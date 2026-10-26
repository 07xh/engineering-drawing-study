'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {prismMesh}=require('../../project/unified-workbench-session.cjs');
const {project,VIEWS}=require('../../core/projection/conventions.js');
const {auditC1GlobalVisibleContourProof}=
 require('../../workbench/m5-c1-global-visible-contour-proof.cjs');
const {auditC1RealOcctVisibleContourSourceParity:audit,
 exactOriginalModelVertexProjectedEdge:recover}=
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
test('different generated native ordinals cannot both claim one exact paper segment as unique original 3D front source',()=>{
 for(const reversed of [false,true]){
  const x=initial(),samePaper=(p,q)=>p.u===q.u&&p.v===q.v;
  let originalWitness,alternateEdge;
  for(const witness of x.nativeProof.independentlyM5AuthenticatedVisibleNativeGeneratedEdges){
   const seg=x.cad.views[witness.view][witness.nativeVisibleHLREdgeOrdinal];
   const candidate=x.geometry.data.edges.find(e=>{
    const id=x.geometry.id+'::'+[...e].sort().join('|');
    if(id===witness.sourceEdgeId)return false;
    const a=project(x.geometry.data.points[e[0]])[witness.view],
     b=project(x.geometry.data.points[e[1]])[witness.view];
    return (samePaper(a,seg.from)&&samePaper(b,seg.to))||
     (samePaper(b,seg.from)&&samePaper(a,seg.to));
   });
   if(candidate){originalWitness=witness;alternateEdge=candidate;break;}
  }
  assert.ok(originalWitness&&alternateEdge,
   'reviewed box must contain genuinely distinct 3D edges sharing exact first-angle paper projection');
  const view=originalWitness.view,
   genuine=x.cad.views[view][originalWitness.nativeVisibleHLREdgeOrdinal],
   a=x.geometry.data.points[alternateEdge[0]],
   b=x.geometry.data.points[alternateEdge[1]],
   from=reversed?genuine.to:genuine.from,
   to=reversed?genuine.from:genuine.to,
   pa=project(a)[view],pb=project(b)[view],
   t0=samePaper(pa,from)?0:1,t1=1-t0,
   point=t=>t===0?a:b,
   sourceEdgeId=x.geometry.id+'::'+[...alternateEdge].sort().join('|');
  assert.ok(samePaper(project(point(t0))[view],from));
  assert.ok(samePaper(project(point(t1))[view],to));
  const lift={...structuredClone(genuine.sourceCandidate3DLifts[0]),
   sourceEdgeId,originalVertexIds:[...alternateEdge],
   originalSourceParameterRange:[0,1],
   sourceParameterAtProjectedFrom:t0,sourceParameterAtProjectedTo:t1,
   fromCandidate3D:{...point(t0)},toCandidate3D:{...point(t1)},
   actualOriginalOCCTBRepFrom3D:{...a},actualOriginalOCCTBRepTo3D:{...b}};
  const ordinal=x.cad.views[view].push({
   ...structuredClone(genuine),from:{...from},to:{...to},
   sourceCandidate3DLifts:[lift]})-1;
  x.nativeProof.independentlyM5AuthenticatedVisibleNativeGeneratedEdges.push({
   ...structuredClone(originalWitness),sourceEdgeId,
   nativeVisibleHLREdgeOrdinal:ordinal,originalSourceParameterRange:[0,1]});
  assert.throws(()=>audit(x),
   /coincident native visible HLR paper segment has conflicting original 3D front owners/,
   'a second generated ordinal must not bypass exact frontmost 3D provenance (reversed='+reversed+')');
 }
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

test('original M0 whole contour literal paper endpoints recover exact physical 3D vertices without tolerance snapping',()=>{
 const a={x:2,y:0,z:9},b={x:4,y:4,z:9},
  view='H',pa=project(a).H,pb=project(b).H;
 const forward=recover({a,b,view,from:pa,to:pb});
 assert.deepEqual(forward.range,[0,1]);
 assert.deepEqual(forward.from3D,a);
 assert.deepEqual(forward.to3D,b);
 assert.equal(forward.orientation,'forward');
 assert.equal(forward.exactOriginalPhysical3DVertexPairAndPaperBinding,true);
 const reversed=recover({a,b,view,from:pb,to:pa});
 assert.deepEqual(reversed.range,[0,1]);
 assert.deepEqual(reversed.from3D,b);
 assert.deepEqual(reversed.to3D,a);
 assert.equal(reversed.orientation,'reversed');
});
test('same paper edge one representable ULP off does not bind original 3D vertex or manufacture a source interval',()=>{
 const a={x:2,y:0,z:9},b={x:4,y:4,z:9},
  view='H',from={...project(a).H},to=project(b).H;
 from.u+=Number.EPSILON*4;
 assert.equal(recover({a,b,view,from,to}),null);
 assert.equal(recover({a,b,view,from:to,to:from}),null);
});
test('orthographically collapsed M0 source cannot be recovered as a drawable paper edge',()=>{
 const a={x:2,y:4,z:0},b={x:2,y:4,z:9},
  from=project(a).H,to=project(b).H;
 assert.equal(recover({a,b,view:'H',from,to}),null);
});
