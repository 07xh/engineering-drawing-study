'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {intervalCoverage,positiveCollinearOverlap}=
 require('../../workbench/c1-ocjs-reviewed-solid-v5.cjs');
const {validateC1RealHLRSourceCandidates:validateNative}=
 require('../../workbench/c1-ocjs-reviewed-solid-v5.cjs');
const {project}=require('../../core/projection/conventions.js');
const {prismMesh}=require('../../project/unified-workbench-session.cjs');
const {auditC1M0ExtremeVertexCompleteness:auditM0Vertices}=
 require('../../workbench/c1-ocjs-reviewed-solid-v5.cjs');
const p=(u,v)=>({u,v});
const physicalLedger=()=>{
 const geometry={id:'M0-Reviewed',data:{
  points:{A:{x:0,y:0,z:0},B:{x:3,y:4,z:5},
   C:{x:0,y:8,z:0},D:{x:3,y:12,z:5}},
  edges:[['A','B'],['A','C'],['C','D']]
 }};
 const edgeId='M0-Reviewed::A|B';
 const source=()=>({
  sourceEdgeId:edgeId,originalVertexIds:['A','B'],
  sourceParameterAtProjectedFrom:0,sourceParameterAtProjectedTo:1,
  originalSourceParameterRange:[0,1],
  fromCandidate3D:{x:0,y:0,z:0},
  toCandidate3D:{x:3,y:4,z:5},
  originalXYZReprojectsToHLR:true,
  actualOriginalOCCTBRepEdge3DEndpointsVerified:true,
  originalOCCTSourceLineCurveVerified:true,
  actualOCCTHLREdgeToOriginalTopoDSIdentityMatched:false,
  v5Authorized:false
 });
 const segment=()=>({
  projectedOriginalEdgeCandidates:[edgeId],
  sourceCandidate3DLifts:[source()],
  actualOCCTGeneratedEdgeDirectOriginalBRepIsSameCompared:true,
  directlySameUniqueOriginalOCCTBRepSourceEdgeId:null
 });
 const cad={views:Object.fromEntries(['V','H','W'].map(view=>{
  const stroke=segment();
  stroke.from=project(geometry.data.points.A)[view];
  stroke.to=project(geometry.data.points.B)[view];
  return [view,[stroke]];
 }))};
 return {geometry,cad,edgeId};
};
test('C1 generic source-bound segment coverage joins real CAD split fragments without inventing a gap',()=>{
 const a=p(2,3),b=p(12,3);
 assert.equal(intervalCoverage(a,b,[
  {from:p(2,3),to:p(7,3)}, {from:p(7,3),to:p(12,3)}]),true);
 assert.equal(intervalCoverage(a,b,[
  {from:p(2,3),to:p(6,3)}, {from:p(7,3),to:p(12,3)}]),false);
 assert.equal(intervalCoverage(a,b,[
  {from:p(2,3),to:p(7,3.001)}, {from:p(7,3),to:p(12,3)}]),false);
});
test('non-contour CAD feature is never promoted by 2D nearby/point-only coincidence',()=>{
 const a=p(0,0),b=p(10,0);
 assert.equal(positiveCollinearOverlap(a,b,p(4,2),p(6,2)),false);
 assert.equal(positiveCollinearOverlap(a,b,p(10,0),p(12,0)),false);
 assert.equal(positiveCollinearOverlap(a,b,p(9,0),p(12,0)),true);
 assert.equal(positiveCollinearOverlap(a,b,p(6,0),p(1,0)),true);
 assert.equal(positiveCollinearOverlap(a,b,p(6,0.01),p(1,0.01)),false);
});

test('C1 real HLR source identity checks every V/H/W stroke without claiming native TopoDS history',()=>{
 const x=physicalLedger();
 assert.equal(validateNative(x),true);
 for(const view of ['V','H','W']){
  const q=physicalLedger();
  q.cad.views[view].push(structuredClone(q.cad.views[view][0]));
  assert.equal(validateNative(q),true);
 }
});
test('C1 refuses fabricated same-geometry source IDs, even on an unsigned CAD crease',()=>{
 for(const view of ['V','H','W']){
  const q=physicalLedger(),stroke=q.cad.views[view][0];
  stroke.projectedOriginalEdgeCandidates=['M0-Reviewed::A|invented'];
  stroke.sourceCandidate3DLifts[0].sourceEdgeId='M0-Reviewed::A|invented';
  assert.throws(()=>validateNative(q),/invalid original physical source candidates/);
 }
});
test('C1 refuses duplicate, missing and cross-source native lift witnesses',()=>{
 for(const change of [
  q=>q.cad.views.V[0].projectedOriginalEdgeCandidates.push(q.edgeId),
  q=>q.cad.views.H[0].sourceCandidate3DLifts=[],
  q=>q.cad.views.W[0].sourceCandidate3DLifts[0].sourceEdgeId='M0-Reviewed::A|C',
  q=>q.cad.views.V[0].sourceCandidate3DLifts[0].originalVertexIds=['A','C'],
  q=>q.cad.views.H[0].sourceCandidate3DLifts[0].originalVertexIds=['B','A']
 ]){
  const q=physicalLedger();change(q);
  assert.throws(()=>validateNative(q),/source candidates|physical source lift|BRep IsSame/);
 }
});
test('C1 refuses forged HLR source parameters and false BRep IsSame identities',()=>{
 for(const change of [
  q=>q.cad.views.V[0].sourceCandidate3DLifts[0].sourceParameterAtProjectedFrom=NaN,
  q=>q.cad.views.H[0].sourceCandidate3DLifts[0].originalSourceParameterRange=[0,0.9999999999999999],
  q=>q.cad.views.W[0].sourceCandidate3DLifts[0].sourceParameterAtProjectedTo=0,
  q=>q.cad.views.V[0].sourceCandidate3DLifts[0].fromCandidate3D.y=Number.MIN_VALUE,
  q=>q.cad.views.H[0].sourceCandidate3DLifts[0].toCandidate3D.x=3-Number.EPSILON*2,
  q=>q.cad.views.V[0].sourceCandidate3DLifts[0].v5Authorized=true,
  q=>q.cad.views.H[0].sourceCandidate3DLifts[0].actualOriginalOCCTBRepEdge3DEndpointsVerified=false,
  q=>q.cad.views.W[0].directlySameUniqueOriginalOCCTBRepSourceEdgeId='M0-Reviewed::A|C',
  q=>q.cad.views.V[0].actualOCCTGeneratedEdgeDirectOriginalBRepIsSameCompared=false
 ]){
  const q=physicalLedger();change(q);
  assert.throws(()=>validateNative(q),/physical source lift|BRep IsSame/);
 }
});
test('C1 refuses duplicate original physical edges before HLR source matching',()=>{
 const q=physicalLedger();q.geometry.data.edges.push(['B','A']);
 assert.throws(()=>validateNative(q),/duplicate original M0 source/);
});
test('C1 exact original XYZ parameter reversal remains valid in all first-angle views',()=>{
 const q=physicalLedger();
 for(const view of ['V','H','W']){
  const lift=q.cad.views[view][0].sourceCandidate3DLifts[0];
  lift.sourceParameterAtProjectedFrom=1;
  lift.sourceParameterAtProjectedTo=0;
  lift.fromCandidate3D={x:3,y:4,z:5};
  lift.toCandidate3D={x:0,y:0,z:0};
  const stroke=q.cad.views[view][0];
  [stroke.from,stroke.to]=[stroke.to,stroke.from];
 }
 assert.equal(validateNative(q),true);
});

test('C1 identical V paper strokes at different Y depths stay distinct unsigned 3D candidates',()=>{
 const q=physicalLedger(),stroke=q.cad.views.V[0];
 const rear='M0-Reviewed::C|D';
 stroke.projectedOriginalEdgeCandidates.push(rear);
 stroke.sourceCandidate3DLifts.push({
  ...structuredClone(stroke.sourceCandidate3DLifts[0]),
  sourceEdgeId:rear,originalVertexIds:['C','D'],
  fromCandidate3D:{x:0,y:8,z:0},
  toCandidate3D:{x:3,y:12,z:5}
 });
 assert.deepEqual(project(stroke.sourceCandidate3DLifts[0].fromCandidate3D).V,
  project(stroke.sourceCandidate3DLifts[1].fromCandidate3D).V);
 assert.equal(validateNative(q),true);
 stroke.directlySameUniqueOriginalOCCTBRepSourceEdgeId=rear;
 assert.equal(validateNative(q),true);
 stroke.sourceCandidate3DLifts[1].fromCandidate3D.y=0;
 assert.throws(()=>validateNative(q),/physical source lift/);
});
test('C1 rejects incorrect paper endpoint even with valid original 3D source name and flags',()=>{
 for(const view of ['V','H','W']){
  const q=physicalLedger();
  q.cad.views[view][0].to.u+=0.01;
  assert.throws(()=>validateNative(q),/physical source lift/);
 }
});

test('real C1 OCCT source gate independently proves bounded M0 box extreme vertices',()=>{
 for(const [min,max] of [
  [{x:0,y:0,z:0},{x:6,y:8,z:10}],
  [{x:-73,y:-44,z:-21},{x:-13,y:-7,z:19}],
  [{x:151,y:22,z:-32},{x:154,y:73,z:-29}]
 ]){
  const g=prismMesh({solid:{min,max}});
  const p=auditM0Vertices(g);
  assert.equal(p.vertexHullVerified,true);
  assert.equal(p.derivedVertexCount,8);
  assert.equal(p.officialLineStyleVerified,false);
  assert.equal(p.completeSceneVerified,false);
 }
});
test('real C1 OCCT source gate independently proves skew tetra extreme vertices',()=>{
 const g={id:'skew-tetra-m0',kind:'mesh',space:'model-3d',unit:'mm',
  data:{points:{A:{x:0,y:0,z:0},B:{x:17,y:1,z:3},
   C:{x:3,y:16,z:2},D:{x:5,y:6,z:23}},
   edges:[['A','B'],['A','C'],['A','D'],['B','C'],['B','D'],['C','D']],
   faces:[['A','B','C'],['A','B','D'],['A','C','D'],['B','C','D']]}};
 const p=auditM0Vertices(g);
 assert.equal(p.vertexHullVerified,true);
 assert.equal(p.derivedVertexCount,4);
});
test('real C1 source gate rejects missing physical face before any CAD signing',()=>{
 const g=prismMesh({solid:{min:{x:0,y:0,z:0},max:{x:6,y:8,z:10}}});
 const bad={...g,data:{...g.data,faces:g.data.faces.slice(1)}};
 assert.throws(()=>auditM0Vertices(bad),/closed|face|topology|mesh/i);
});
