'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {deriveTwoDistanceSubgraphEvidence:scan}=
 require('../../core/constraints/nonlinear-distance-branch-graph.cjs');
const {evaluateUnifiedMath}=require('../../workbench/unified-math-pipeline.cjs');
const fixed=(id,point,x,y)=>({id,kind:'fixed',point,at:{x,y}});
const distance=(id,a,b,value)=>({id,kind:'distance',a,b,value});
const base={
 frame:'model-mm-2d',unit:'mm',revision:6,
 points:[{id:'Anchor1'},{id:'Anchor2'},{id:'UnknownX'}],
 constraints:[
  fixed('Known1','Anchor1',0,0),fixed('Known2','Anchor2',4,0),
  distance('Dist1','UnknownX','Anchor1',3),
  distance('Dist2','Anchor2','UnknownX',3)
 ]
};
const scanBase=source=>scan({...base,...source});
test('generic factor graph extracts algebraic two-branch witness independent of constraint endpoint order and names',()=>{
 const a=scanBase();
 assert.equal(a.schema,'draftai-m3-two-distance-graph-evidence/1');
 assert.equal(a.status,'local-analytic-subgraphs');
 assert.equal(a.subgraphs.length,1);
 const witness=a.subgraphs[0];
 assert.equal(witness.targetPointId,'UnknownX');
 assert.deepEqual(witness.sourceConstraintIds,['Dist1','Dist2']);
 assert.equal(witness.status,'two-separated-roots');
 assert.equal(witness.branchCount,2);
 assert.equal(witness.exhaustiveWithinTwoDistanceLoci,true);
 assert.equal(witness.proof.branches.length,2);
 assert.equal(witness.completeFullConstraintGraphVerified,false);
 assert.equal(a.fullConstraintGraphVerified,false);
 assert.equal(a.v5Ready,false);
 assert.ok(Object.isFrozen(a.subgraphs[0].proof.branches));
});
test('M3 solver preserves local numeric seeds separately and never upgrades SolveResult to a fully proved graph',()=>{
 const params={kind:'point-constraint-system',revision:6,
  input:{frame:base.frame,unit:base.unit,points:base.points,
   constraints:base.constraints,
   seeds:[
    {id:'Top',coordinates:{Anchor1:{x:0,y:0},Anchor2:{x:4,y:0},UnknownX:{x:2,y:2}}},
    {id:'Bottom',coordinates:{Anchor1:{x:0,y:0},Anchor2:{x:4,y:0},UnknownX:{x:2,y:-2}}}
   ]}};
 const result=evaluateUnifiedMath(params);
 assert.equal(result.analyticSubgraphEvidence.subgraphs[0].branchCount,2);
 assert.equal(result.solveResult.status,'undetermined');
 assert.equal(result.globalBranchEnumerationComplete,false);
 assert.equal(result.sourceProblemConfirmed,false);
 assert.equal(result.v5Ready,false);
 assert.deepEqual(result.geometry,[]);
 assert.deepEqual(result.constructionIntents,[]);
 assert.deepEqual(result.constructionSteps,[]);
});
test('other constraints can narrow this pair, so subgraph completeness is NEVER all-input uniqueness',()=>{
 const constraints=[...base.constraints,
  {id:'AxisExtra',kind:'axis',point:'UnknownX',axis:'y',value:1}];
 const r=scanBase({constraints});
 assert.equal(r.subgraphs[0].branchCount,2);
 assert.equal(r.subgraphs[0].completeFullConstraintGraphVerified,false);
 assert.equal(r.solutionsCertifiedForFullGraph,false);
});
test('different centers and strict gaps give no-root within the primitive while whole graph remains unverified',()=>{
 const r=scanBase({constraints:[
  ...base.constraints.slice(0,2),
  distance('First','UnknownX','Anchor1',1),
  distance('Second','UnknownX','Anchor2',1)]});
 assert.equal(r.subgraphs[0].proof.status,'strictly-disjoint');
 assert.equal(r.subgraphs[0].branchCount,0);
 assert.equal(r.fullConstraintGraphVerified,false);
});
test('duplicate fixed centers, invalid factors, 3D spheres and near tangent do not forge pair uniqueness',()=>{
 const duplicate=scanBase({constraints:[
  fixed('Known1','Anchor1',0,0),fixed('KnownAgain','Anchor1',1,0),
  ...base.constraints.slice(1)]});
 assert.equal(duplicate.subgraphs.length,0);
 assert.equal(duplicate.fullConstraintGraphVerified,false);
 const r=scanBase({constraints:[
  ...base.constraints.slice(0,2),
  distance('Radius1','Anchor1','UnknownX',2),
  distance('Radius2','Anchor2','UnknownX',2)]});
 assert.equal(r.subgraphs[0].status,'undetermined');
 assert.equal(r.subgraphs[0].branchCount,null);
 assert.equal(r.subgraphs[0].exhaustiveWithinTwoDistanceLoci,false);
 const sphere=scan({frame:'model-mm-3d',unit:'mm',revision:6,
  points:[{id:'A'}],constraints:[]});
 assert.equal(sphere.status,'not-covered');
 assert.deepEqual(sphere.subgraphs,[]);
});
test('source frame, revision and duplicate constraint IDs must not result in proof',()=>{
 assert.throws(()=>scanBase({unit:'px'}));
 assert.throws(()=>scanBase({revision:-1}));
 assert.throws(()=>scanBase({constraints:[
  fixed('Known1','Anchor1',0,0),fixed('Known2','Anchor2',4,0),
  distance('Same','UnknownX','Anchor1',3),
  distance('Same','UnknownX','Anchor2',3)
 ]}));
});
