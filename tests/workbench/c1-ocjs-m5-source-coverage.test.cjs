'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {intervalCoverage,positiveCollinearOverlap}=
 require('../../workbench/c1-ocjs-reviewed-solid-v5.cjs');
const {validateC1RealHLRSourceCandidates:validateNative}=
 require('../../workbench/c1-ocjs-reviewed-solid-v5.cjs');
const p=(u,v)=>({u,v});
const physicalLedger=()=>{
 const geometry={id:'M0-Reviewed',data:{
  points:{A:{x:0,y:0,z:0},B:{x:3,y:0,z:0},
   C:{x:0,y:4,z:0}},
  edges:[['A','B'],['A','C']]
 }};
 const edgeId='M0-Reviewed::A|B';
 const source=()=>({
  sourceEdgeId:edgeId,originalVertexIds:['A','B'],
  sourceParameterAtProjectedFrom:0,sourceParameterAtProjectedTo:1,
  originalSourceParameterRange:[0,1],
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
 const cad={views:{V:[segment()],H:[segment()],W:[segment()]}};
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
