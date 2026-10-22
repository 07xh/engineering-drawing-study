'use strict';

/**
 * M0 first-increment audit: executable invariants over the existing
 * authoritative solvers. This file intentionally does not change math.
 *
 * A green test is NOT evidence that a generic nonlinear or 3-D CAD
 * solver is implemented, or that a custom domain was deployed.
 */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const Contracts=require('../../core/contracts');
const Adapters=require('../../core/adapters');
const Projection=require('../../core/projection/conventions.js');
const {solveProjection}=require('../../engines/projection/point-projection.cjs');
const {circleCircleFilletCenters}=require('../../engines/planar/circle-circle-fillet.cjs');
const {chooseDirectedFillet}=require('../../engines/planar/directed-circle-fillet.cjs');

const nearly=(a,b,tol=1e-8)=>assert.ok(
  Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=tol,
  'Expected '+a+' ~= '+b+' (abs '+tol+')'
);
let nextId=0;
function condition(scope,type,data){
  return {id:'m0_c_'+(++nextId),scope,type,data,targetIds:['P'],source:'given'};
}
function twoCircles(extra={}){
  return {
    first:{center:{x:0,y:0},radius:5},
    second:{center:{x:20,y:0},radius:5},
    filletRadius:10,firstMode:'external',secondMode:'external',
    ...extra
  };
}

test('M0: two finite point-intersection branches remain multiple even with DOF=0',()=>{
  const scope='point-2d-intersection';
  const solved=Adapters.solve({scope,constraints:[
    condition(scope,'circle',{x:0,y:0,r:5}),
    condition(scope,'circle',{x:8,y:0,r:5})
  ]});
  assert.equal(solved.status,'multiple');
  assert.equal(solved.solutionCount,2);
  assert.equal(solved.degrees,0);
  assert.equal(solved.globallyUnique,false);
  assert.equal(solved.proofLevel,'analytic');
  assert.equal(Contracts.validateSolveResult(solved).ok,true);
  assert.ok(solved.maxResidual<=1e-8);
  assert.deepEqual(
    solved.solutions.map(p=>Math.round(p.y)).sort((a,b)=>a-b),[-3,3]
  );
});

test('M0: result validator refuses to relabel a multiple result as globally unique',()=>{
  const scope='point-2d-intersection';
  const solved=Adapters.solve({scope,constraints:[
    condition(scope,'circle',{x:0,y:0,r:5}),
    condition(scope,'circle',{x:8,y:0,r:5})
  ]});
  assert.equal(Contracts.validateSolveResult({...solved,globallyUnique:true}).ok,false);
  assert.equal(Contracts.validateSolveResult({...solved,status:'unique'}).ok,false);
});

test('M0: Jacobian at a NON-solution cannot establish existence or global uniqueness',()=>{
  const scope='multi-point-2d-local-jacobian';
  const solved=Adapters.solve({
    scope,points:{A:{x:0,y:0},B:{x:0,y:0}},
    constraints:[{id:'m0_distance',scope,type:'distance',source:'given',
      targetIds:['A','B'],data:{a:'A',b:'B',value:5}}]
  });
  assert.equal(solved.status,'undetermined');
  assert.equal(solved.atProvidedConfiguration,false);
  assert.equal(solved.proofLevel,'local-first-order');
  assert.equal(solved.localDegrees,4);
  assert.equal(solved.degrees,null);
  assert.equal(solved.globallyUnique,null);
  assert.equal(solved.solutionCount,null);
  assert.equal(Contracts.validateSolveResult(solved).ok,true);
});

test('M0: unknown target cannot silently carry a pre-filled answer coordinate',()=>{
  const pending={id:'P',kind:'point',space:'model-3d',unit:'mm'};
  assert.equal(Contracts.validateUnknownTarget(pending).ok,true);
  assert.equal(Contracts.validateUnknownTarget({...pending,data:{x:1,y:2,z:3}}).ok,false);
  assert.equal(Contracts.validateUnknownTarget({...pending,x:10}).ok,false);
});

test('M0: first-angle math views are invariant under arbitrary sheet origin and zoom',()=>{
  const model={x:-12.5,y:0.375,z:125};
  const expected={V:{u:-12.5,v:125},H:{u:-12.5,v:0.375},
    W:{u:0.375,v:125}};
  assert.deepEqual(Projection.project(model),expected);
  for(const transform of [
    {origin:{x:0,y:0},scale:0.5},
    {origin:{x:700,y:430},scale:4},
    {origin:{x:-50,y:111},scale:16}
  ]){
    const sheet=Projection.sheetPoint(model,transform);
    for(const view of ['V','H','W']){
      const restored=Projection.fromSheet(view,sheet[view],transform);
      nearly(restored.u,expected[view].u);
      nearly(restored.v,expected[view].v);
    }
    nearly(sheet.V.x,sheet.H.x);
    nearly(sheet.V.y,sheet.W.y);
    nearly(sheet.H.y-transform.origin.y,sheet.M.x-transform.origin.x);
    assert.deepEqual(Projection.project(model),expected);
  }
});

test('M0: large coordinate inputs must not hide a real 10 mm conflict',()=>{
  const solved=solveProjection({knownViews:{
    V:[1e12,12],H:[1e12+10,10]
  }});
  assert.equal(solved.status,'none');
  assert.equal(solved.point,null);
  assert.deepEqual(solved.steps,[]);
  assert.equal(solved.solutionCount,0);
});

test('M0: underconstrained first-angle point must never produce guessed geometry',()=>{
  const solved=solveProjection({knownViews:{H:[3,7]}});
  assert.equal(solved.status,'continuous');
  assert.equal(solved.degrees,1);
  assert.equal(solved.globallyUnique,false);
  assert.equal(solved.point,null);
  assert.equal(solved.views,null);
  assert.deepEqual(solved.guides,[]);
});

test('M0: finite source arc filtering retains original branch identities',()=>{
  const base=twoCircles();
  const both=circleCircleFilletCenters(base);
  assert.deepEqual(both.candidates.map(c=>c.id),['center-1','center-2']);
  const clipped=circleCircleFilletCenters({
    ...base,first:{...base.first,
      arc:{startAngle:30,endAngle:60,direction:'ccw'}}
  });
  assert.equal(clipped.status,'unique');
  assert.deepEqual(clipped.candidates.map(c=>c.id),['center-2']);
  assert.equal(clipped.candidates[0].sourceArcRangeVerified,true);
  assert.ok(clipped.excludedCandidates.some(x=>x.id==='center-1'));
});

test('M0: chosen fillet branch alone does not prove directed G1 continuity',()=>{
  const solved=chooseDirectedFillet({
    ...twoCircles(),branchId:'center-2',direction:'cw'
  });
  assert.equal(solved.status,'selected');
  assert.equal(solved.selectedId,'center-2');
  assert.equal(solved.g1Verified,false);
  assert.equal(solved.maxG1Mismatch,null);
});

test('M0: math ccw arc to legacy SVG must explicitly reveal lost traversal direction',()=>{
  const transform={origin:{x:100,y:100},scale:2};
  const data={center:{x:2,y:3},radius:5};
  const ccw={id:'a_ccw',kind:'arc',space:'drawing-2d',unit:'mm',
    data:{...data,startAngle:0,endAngle:90,direction:'ccw'}};
  const cw={id:'a_cw',kind:'arc',space:'drawing-2d',unit:'mm',
    data:{...data,startAngle:90,endAngle:0,direction:'cw'}};
  const outCCW=Adapters.toLegacySvgArc(ccw,transform);
  const outCW=Adapters.toLegacySvgArc(cw,transform);
  assert.equal(outCCW.orientationPreserved,false);
  assert.equal(outCW.orientationPreserved,true);
  assert.ok(outCCW.warning);
  assert.deepEqual(outCCW.action.geometry,outCW.action.geometry);
  assert.equal(Contracts.validAction(outCCW.action),true);
  assert.equal(Contracts.validAction(outCW.action),true);
});

test('M0: evidence step references must not point to a later construction step',()=>{
  const p={
    schemaVersion:Contracts.SCHEMA_VERSION,
    id:'m0_provenance',title:'Generated non-textbook invariant fixture',
    source:{kind:'generated',generatorId:'M0'},type:'planar-geometry',
    status:'source-verified',givens:[],geometry:[],constraints:[],
    renderMode:'manual-steps',steps:[
      {id:'stepA',explanation:'incorrect forward dependency',
        actions:[],dependsOn:['stepB']},
      {id:'stepB',explanation:'later step',actions:[]}
    ]
  };
  assert.equal(Contracts.validateProblem(p).ok,false);
});
