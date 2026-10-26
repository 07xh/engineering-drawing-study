'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {prismMesh}=require('../../project/unified-workbench-session.cjs');
const {project,VIEWS}=require('../../core/projection/conventions.js');
const {auditC1GlobalVisibleContourProof}=
 require('../../workbench/m5-c1-global-visible-contour-proof.cjs');
const {auditC1RealOcctVisibleContourSourceParity:audit}=
 require('../../workbench/c1-real-occt-m5-visible-contour-parity.cjs');
const g=()=>{
 const x=prismMesh({solid:{min:{x:0,y:0,z:0},
  max:{x:6,y:8,z:10}}});
 return {...x,id:'ActualContour'};
};
const initial=()=>{
 const geometry=g(),revision=34,
  contour=auditC1GlobalVisibleContourProof({geometry,revision});
 assert.equal(contour.certifiedVisibleContourLineCount,12);
 const cad={sourceGeometryId:geometry.id,revision,
  hiddenHLROutputFromActualOCCT:true,v5Authorized:false,
  views:{V:[],H:[],W:[]}};
 const proof={
  schema:'draftai-c1-ocjs-native-generated-topods-original-3d-vertex-concordance/1',
  sourceGeometryId:geometry.id,revision,
  actualGeneratedHLREdgeToOriginalTopoDSEdgeHistoryComplete:false,
  signedV5ActionCount:0,
  independentlyM5AuthenticatedVisibleNativeGeneratedEdges:[]
 };
 for(const v of contour.views)for(const interval of v.candidateIntervals){
  if(!interval.v5ActionAuthorized)continue;
  const e=geometry.data.edges.find(x=>
   geometry.id+'::'+[...x].sort().join('|')===interval.sourceEdgeId);
  assert.ok(e);
  const a=geometry.data.points[e[0]],b=geometry.data.points[e[1]];
  const axis=['x','y','z'].find(k=>a[k]!==b[k]);
  assert.ok(axis);
  const p=interval.real3DFrom,q=interval.real3DTo,
   t0=(p[axis]-a[axis])/(b[axis]-a[axis]),
   t1=(q[axis]-a[axis])/(b[axis]-a[axis]),
   range=[Math.min(t0,t1),Math.max(t0,t1)],
   ordinal=cad.views[v.view].length;
  const lift={
   sourceEdgeId:interval.sourceEdgeId,
   originalVertexIds:[...e],
   originalSourceParameterRange:range,
   sourceParameterAtProjectedFrom:t0,sourceParameterAtProjectedTo:t1,
   actualOriginalOCCTBRepEdge3DEndpointsVerified:true,
   originalOCCTSourceLineCurveVerified:true,
   originalXYZReprojectsToHLR:true,v5Authorized:false,
   actualOriginalOCCTBRepFrom3D:{...a},
   actualOriginalOCCTBRepTo3D:{...b},
   fromCandidate3D:{...p},toCandidate3D:{...q}
  };
  cad.views[v.view].push({
   occtHLRVisibilityClass:'visible-sharp',
   actualOCCTHLRFlattenedBRepLineVerified:true,
   actualOCCTGeneratedEdgeDirectOriginalBRepIsSameCompared:true,
   actualOCCTHLREdgeToOriginalTopoDSIdentityMatched:false,
   from:project(p)[v.view],to:project(q)[v.view],
   sourceCandidate3DLifts:[lift]
  });
  proof.independentlyM5AuthenticatedVisibleNativeGeneratedEdges.push({
   view:v.view,sourceEdgeId:interval.sourceEdgeId,
   originalSourceParameterRange:range,
   nativeVisibleHLREdgeOrdinal:ordinal,
   uniquePhysicalM5FrontOriginalSourceFromActualBRep:true,
   fullOriginalPhysicalSourceM5ClosedRayClear:true,
   generatedEdgeOriginalTopoDSHistoryRecovered:false,
   engineeringLineCertified:false,signedV5Action:false
  });
 }
 assert.deepEqual(VIEWS.map(v=>cad.views[v].length),[4,4,4]);
 return {geometry,revision,cad,nativeProof:proof};
};
test('reviewed cuboid 12 signed convex contours are independently covered by genuine native HLR physical 3D source intervals without minting extra V5',()=>{
 const p=audit(initial());
 assert.equal(p.originalGloballySignedM5ContourStrokeCount,12);
 assert.equal(p.originalGloballySignedM5ContoursWithExactNativeOriginal3DSourceCoverage,12);
 assert.equal(p.originalGloballySignedM5ContoursStillHeldForNativeProof,0);
 assert.equal(p.nativeCADCorroboratesEveryOriginalGloballySignedExteriorContour,true);
 assert.equal(p.realNativeOCCTVisible3DSourceFragmentsAudited,12);
 assert.ok(p.rows.every(r=>r.realOCCTOriginal3DSourceCompleteContourParity&&
   r.trueNativeOCCTGeneratedLineOrdinals.length===1&&
   r.nativeGeneratedOriginalSourceOverlap===false&&
   r.positiveLengthNativeSourceGaps.length===0&&
   r.signedV5Action===false));
 assert.equal(p.fullGeneratedTopoDSEdgeToOriginalTopoDSHistoryProven,false);
 assert.equal(p.constructionIntentDAGUniqueV5ParityProven,false);
});
test('one actual generated BRep source segment missing last half cannot pass signed contour CAD parity',()=>{
 const x=initial(),c=x.cad.views.H[0],a=x.geometry.data.points[
  c.sourceCandidate3DLifts[0].originalVertexIds[0]],
 b=x.geometry.data.points[c.sourceCandidate3DLifts[0].originalVertexIds[1]],
 l=c.sourceCandidate3DLifts[0];
 const t0=l.sourceParameterAtProjectedFrom,
  t1=l.sourceParameterAtProjectedTo;
 const mid=(t0+t1)/2,point=t=>({
  x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,z:a.z+(b.z-a.z)*t});
 c.to=project(point(mid)).H;l.toCandidate3D=point(mid);
 l.sourceParameterAtProjectedTo=mid;
 l.originalSourceParameterRange=[Math.min(t0,mid),Math.max(t0,mid)];
 x.nativeProof.independentlyM5AuthenticatedVisibleNativeGeneratedEdges
  .find(w=>w.view==='H'&&w.nativeVisibleHLREdgeOrdinal===0).
  originalSourceParameterRange=[...l.originalSourceParameterRange];
 const r=audit(x);
 assert.equal(r.nativeCADCorroboratesEveryOriginalGloballySignedExteriorContour,false);
 assert.equal(r.originalGloballySignedM5ContoursStillHeldForNativeProof,1);
 assert.ok(r.rows.some(y=>y.view==='H'&&
  y.heldReason==='true-occt-generated-contour-source-parameter-gap'));
});
test('duplicated actual HLR generated VCompound 3D source strokes cannot masquerade as one complete contour',()=>{
 const x=initial();
 const base=structuredClone(x.cad.views.V[0]);
 const ordinal=x.cad.views.V.push(base)-1;
 const w=structuredClone(x.nativeProof.independentlyM5AuthenticatedVisibleNativeGeneratedEdges
  .find(z=>z.view==='V'&&z.nativeVisibleHLREdgeOrdinal===0));
 w.nativeVisibleHLREdgeOrdinal=ordinal;
 x.nativeProof.independentlyM5AuthenticatedVisibleNativeGeneratedEdges.push(w);
 const r=audit(x);
 assert.equal(r.nativeCADCorroboratesEveryOriginalGloballySignedExteriorContour,false);
 assert.equal(r.originalGloballySignedM5ContoursStillHeldForNativeProof,1);
 assert.ok(r.rows.some(y=>y.view==='V'&&
  y.nativeGeneratedOriginalSourceOverlap===true));
});
test('forged paper point, unverified source curve and stale revision cannot pass native-to-original contour binding',()=>{
 const x=initial();x.cad.views.H[0].to.u+=Number.EPSILON*4;
 assert.throws(()=>audit(x),/source lift contradicts original 3D model or paper/);
 const y=initial();y.cad.views.H[0].sourceCandidate3DLifts[0].
  originalOCCTSourceLineCurveVerified=false;
 assert.throws(()=>audit(y),/source lift contradicts original 3D model or paper/);
 const z=initial();z.nativeProof.revision--;
 assert.throws(()=>audit(z),/current true native OCCT HLR/);
});
test('a source ID that disagrees with genuine current native VCompound BRep candidate cannot be paper-selected',()=>{
 const x=initial(),w=x.nativeProof.independentlyM5AuthenticatedVisibleNativeGeneratedEdges
  .find(z=>z.view==='H'&&z.nativeVisibleHLREdgeOrdinal===0);
 w.sourceEdgeId='ActualContour::V000|V111';
 assert.throws(()=>audit(x),/forged or stale current genuine visible HLR source witness/);
});
