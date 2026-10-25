'use strict';
/**
 * Actual OCC B-Rep section samples, generated offline with independent CAD
 * geometry. NOT a second solver, V5 action signer or continuous topology proof.
 * Dev-only fixture: Open CASCADE is NOT imported by the production viewer.
 */
const {test}=require('node:test'),assert=require('node:assert/strict');
const oracle=require('../fixtures/c3-open-cascade-independent-section.json');
const {evaluateFiniteOrthogonalCylinderIntersection:solve}=
 require('../../engines/spatial/intersections/finite-orthogonal-cylinders.cjs');
const {project}=require('../../core/projection/conventions.js');

function checkProbe(input,branches,pt){
 const [x,y,z]=pt,{zCylinder:Z,yCylinder:Y}=input;
 if(!pt.every(Number.isFinite))throw new RangeError('OCC probe is nonfinite');
 const a=(x-Z.xCenter)**2+(y-Z.yCenter)**2-Z.radius**2;
 const b=(x-Y.xCenter)**2+(z-Y.zCenter)**2-Y.radius**2;
 if(Math.max(Math.abs(a),Math.abs(b))>.005)
  throw new RangeError('independent CAD probe violates true cylinder lateral equations');
 if(y<Y.yMin-.005||y>Y.yMax+.005||
    z<Z.zMin-.005||z>Z.zMax+.005)
  throw new RangeError('CAD probe outside finite axial caps');
 const signY=y>Z.yCenter?1:-1,signZ=z>Y.zCenter?1:-1;
 const matches=branches.filter(v=>
  v.signY===signY&&v.signZ===signZ&&
  x>=v.xRange[0]-.003&&x<=v.xRange[1]+.003);
 if(matches.length!==1)
  throw new RangeError('OCCT lateral point does not belong to one current analytic branch');
 const branch=matches[0];
 const expectedY=Z.yCenter+branch.signY*Math.sqrt(Math.max(0,
  Z.radius**2-(x-Z.xCenter)**2));
 const expectedZ=Y.zCenter+branch.signZ*Math.sqrt(Math.max(0,
  Y.radius**2-(x-Y.xCenter)**2));
 if(Math.max(Math.abs(y-expectedY),Math.abs(z-expectedZ))>.004)
  throw new RangeError('independent CAD section mismatches M3 analytic coordinates');
 for(const v of ['V','H','W']){
  const projected=project({x,y,z})[v];
  if(!Number.isFinite(projected.u)||!Number.isFinite(projected.v))
   throw new RangeError('CAD section first-angle projection unavailable');
 }
 return [signY,signZ].join(',');
}

test('real offline OCCT 7.9 B-Rep lateral intersections agree with BOTH M3 radicals and finite caps',()=>{
 assert.equal(oracle.schema,
  'draftai-c3-open-cascade-independent-lateral-section-oracle/1');
 assert.match(oracle.cadKernel,/Open CASCADE/);
 assert.equal(oracle.modelUnit,'mm');
 assert.equal(oracle.cases.length,2);
 let total=0;
 for(const c of oracle.cases){
  assert.equal(c.allCapFeaturesCovered,false,
   'this CAD oracle does NOT validate lateral-cap or cap-cap geometry');
  assert.ok(c.selectedLateralSectionEdgeCount>=1);
  assert.ok(c.sectionEdgeCount>=c.selectedLateralSectionEdgeCount);
  const actual=solve({input:c.input,revision:29});
  assert.equal(actual.status,'scoped-analytic-ready');
  assert.equal(actual.geometryVerifiedWithinSpecialistScope,true);
  assert.equal(actual.analyticallyCompleteWithinScope,true);
  const observed=new Set();
  for(const edge of c.lateralEdges){
   assert.equal(edge.curveType,'GeomAbs_BSplineCurve');
   assert.ok(edge.maxSurfaceResidual<=.005);
   assert.equal(edge.points.length,12);
   for(const p of edge.points){observed.add(checkProbe(c.input,actual.branches,p));total++;}
  }
  if(c.id==='unequal-offset-full'){
   assert.equal(actual.branchCount,4);
   assert.deepEqual([...observed].sort(),['-1,-1','-1,1','1,-1','1,1']);
  }else{
   assert.equal(c.id,'unequal-offset-positive-caps');
   assert.equal(actual.branchCount,1);
   assert.deepEqual([...observed],['1,1']);
  }
  // CAD numerical agreement cannot mint final drawing topology/visibility.
  assert.equal(actual.globalJunctionTopologyVerified,false);
  assert.equal(actual.officialLineStylesVerified,false);
  assert.equal(actual.verifiedVisibility,false);
  assert.equal(actual.v5Ready,false);
  assert.equal(actual.constructionIntents.length,0);
  assert.equal(actual.steps.length,0);
 }
 assert.equal(total,48);
});

test('OCCT deviation and fake source-projection counterexamples fail closed',()=>{
 const c=oracle.cases[0],result=solve({input:c.input,revision:29});
 const p=c.lateralEdges[0].points[0];
 assert.doesNotThrow(()=>checkProbe(c.input,result.branches,p));
 assert.throws(()=>checkProbe(c.input,result.branches,
  [p[0],p[1]+.1,p[2]]),/violates true cylinder/);
 assert.throws(()=>checkProbe(c.input,result.branches,
  [p[0],p[1],p[2]+.1]),/violates true cylinder/);
 assert.throws(()=>checkProbe(c.input,result.branches,
  [p[0],p[1],NaN]),/nonfinite/);
 assert.throws(()=>checkProbe(c.input,[],p),/one current analytic branch/);
});
