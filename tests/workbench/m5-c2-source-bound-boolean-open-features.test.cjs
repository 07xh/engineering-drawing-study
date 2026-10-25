'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {prismMesh}=require('../../project/unified-workbench-session.cjs');
const {evaluateReviewedConvexMeshDepth}=
 require('../../workbench/reviewed-convex-scene-depth.cjs');
const {inspectFinalSourceStrokeObligations}=
 require('../../workbench/m5-final-source-stroke-obligations.cjs');
const {auditC2SourceBoundBooleanOpenFeatures,matchCompleteOpenAxis}=
 require('../../workbench/m5-c2-source-bound-boolean-open-features.cjs');
const pt=(x,y,z)=>({x,y,z});
const box=(id,a,b)=>({...prismMesh({solid:{min:a,max:b}}),id});
const A=()=>box('A',pt(0,0,0),pt(10,10,10));
const B=()=>box('B',pt(5,5,5),pt(15,15,15));
const gate=(geometry,revision=321)=>{
 const scene=evaluateReviewedConvexMeshDepth({geometry,revision});
 return inspectFinalSourceStrokeObligations({geometry,revision,
  sceneDepthEvidence:scene});
};
test('M5 C2: real source lineage maps all paper pieces to independently recomputed whole-axis Boolean open exterior sectors',()=>{
 const g=gate([A(),B()]),a=g.unifiedPaperLineReadinessEvidence,
  boolean=a.booleanSourceOpenFeatureEvidence,
  paper=g.unifiedPaperSourceIdentityEvidence;
 assert.equal(boolean.schema,
  'draftai-m5-c2-source-bound-boolean-open-feature/1');
 assert.equal(boolean.status,
  'source-recomputed-original-and-generated-exterior-open-feature-lineage');
 assert.equal(boolean.paperIntervalCount,paper.paperIntervalCount);
 assert.equal(boolean.allPaperSourcesAccountedFor,true);
 assert.equal(a.lines.length,boolean.lines.length);
 const sourceKinds=new Set(),acceptedKinds=new Set();
 let accepted=0;
 for(const group of boolean.lines){
  const parent=paper.groups.find(p=>p.id===group.paperGroupId);
  const actual=a.lines.find(p=>p.paperGroupId===group.paperGroupId);
  assert.ok(parent&&actual);
  assert.equal(group.sourceMultiplicity,parent.sourceMultiplicity);
  assert.equal(group.contributions.length,parent.sourceMultiplicity);
  assert.equal(group.selectedWhole3DBooleanExteriorOpenSourceVerified,
   actual.selectedWholeSource3DBooleanExteriorOpenFeatureVerified);
  assert.equal(actual.originalAndNew3DBooleanOpenSourceTraceComplete,true);
  for(const item of group.contributions){
   sourceKinds.add(item.sourceKind);
   const parentSource=parent.sourceSubspans.find(s=>
    s.sourceSubspanId===item.sourceSubspanId);
   assert.ok(parentSource);
   assert.deepEqual(item.original3DFrom,parentSource.from3D);
   assert.deepEqual(item.original3DTo,parentSource.to3D);
   assert.equal(item.authorizedOfficialLineStyle,'undetermined');
   assert.equal(item.v5LineActionAuthorized,false);
   if(item.entireReal3DSourceOpenIntervalBooleanExteriorVerified){
    accepted++;acceptedKinds.add(item.sourceKind);
    assert.ok(item.originalOrNewFeatureProofId);
    assert.equal(item.sourceFeatureId,parentSource.originalSourceFeatureId);
    assert.ok(item.scopedStatus.startsWith('certified-entire-'));
   }
  }
  assert.equal(actual.officialEngineeringSolidDashedStyle,'undetermined');
  assert.equal(actual.formalV5StrokeSigned,false);
  assert.ok(actual.missingProofObligations.includes(
   'global-complete-boolean-exterior-and-final-paper-contour'));
 }
 assert.ok(sourceKinds.has('original-physical-crease'));
 assert.ok(sourceKinds.has('generated-two-face-crease'));
 assert.ok(accepted>0);
 assert.ok(acceptedKinds.has('original-physical-crease'));
 assert.ok(acceptedKinds.has('generated-two-face-crease'),
  'real interpenetrating cuboids have novel union open creases');
 assert.equal(g.signedCount,0);
 assert.equal(g.v5Ready,false);
 assert.equal(a.signedV5LineActions,0);
});
test('C2 finite original and NEW face source open-axis coverage must include every bit, not just a positive midpoint',()=>{
 const p=(z)=>({x:3,y:7,z});
 const sector=(lo,hi,status='certified-convex-exterior-open-crease')=>({
  sourceAxis:'z',source3DFrom:p(lo),source3DTo:p(hi),
  positiveUnionExternalCreaseVerified:
   status==='certified-convex-exterior-open-crease',
  status
 });
 const valid=[sector(0,4),sector(4,10)];
 assert.equal(matchCompleteOpenAxis({from:p(0),to:p(10),axis:'z',
  items:valid,sourceKind:'original'}),true);
 assert.equal(matchCompleteOpenAxis({from:p(10),to:p(0),axis:'z',
  items:valid,sourceKind:'original'}),true);
 assert.equal(matchCompleteOpenAxis({from:p(0),to:p(10),axis:'z',
  items:[sector(0,4),sector(4.00000000001,10)],sourceKind:'original'}),false);
 assert.equal(matchCompleteOpenAxis({from:p(0),to:p(10),axis:'z',
  items:[sector(0,4),sector(4,7,'certified-source-crease-buried-inside-union'),
   sector(7,10)],sourceKind:'original'}),false);
 assert.equal(matchCompleteOpenAxis({from:{x:3+2**-35,y:7,z:0},
  to:{x:3+2**-35,y:7,z:10},axis:'z',items:valid,
  sourceKind:'original'}),false);
 const novel=(lo,hi,okay)=>({
  sourceAxis:'z',source3DFrom:p(lo),source3DTo:p(hi),
  positiveNewConcaveUnionOpenFeatureVerified:okay,
  status:okay?'certified-new-concave-union-open-crease':
   'certified-new-face-intersection-buried-in-union'
 });
 assert.equal(matchCompleteOpenAxis({from:p(2),to:p(8),axis:'z',
  items:[novel(0,10,true)],sourceKind:'generated'}),true);
 assert.equal(matchCompleteOpenAxis({from:p(0),to:p(10),axis:'z',
  items:[novel(0,4,true),novel(4,8,false),novel(8,10,true)],
  sourceKind:'generated'}),false);
});
test('C2 burying third solid and full-face flat interface cannot inherit positive paper-style release',()=>{
 const cases=[
  [A(),box('B',pt(7,-1,-1),pt(13,11,11))],
  [A(),box('B',pt(10,0,0),pt(20,10,10))],
  [A(),B(),box('C',pt(9,4,6),pt(11,6,8))]
 ];
 for(let i=0;i<cases.length;i++){
  const g=gate(cases[i],327+i);
  const audit=g.unifiedPaperLineReadinessEvidence;
  const b=audit.booleanSourceOpenFeatureEvidence;
  assert.equal(b.allPaperSourcesAccountedFor,true);
  assert.equal(b.paperIntervalCount,audit.paperIntervalCount);
  assert.equal(b.signedV5LineActions,0);
  assert.equal(audit.signedV5LineActions,0);
  assert.ok(audit.lines.every(x=>
   x.formalV5StrokeSigned===false&&
   x.officialEngineeringSolidDashedStyle==='undetermined'));
 }
});
test('C2 stale source version and invented Boolean source registry refuse to inherit 3D exterior authority',()=>{
 const geometry=[A(),B()],revision=331,g=gate(geometry,revision);
 const evidence=g.unifiedPaperSourceIdentityEvidence;
 const basic={geometry,revision,unifiedPaperSourceIdentityEvidence:evidence};
 assert.throws(()=>auditC2SourceBoundBooleanOpenFeatures({
  ...basic,revision:332}),/current unsigned/);
 assert.throws(()=>auditC2SourceBoundBooleanOpenFeatures({
  ...basic,unifiedPaperSourceIdentityEvidence:{
   ...evidence,signedV5LineActions:1}}),/current unsigned/);
 assert.throws(()=>auditC2SourceBoundBooleanOpenFeatures({
  ...basic,unifiedPaperSourceIdentityEvidence:{
   ...evidence,sourceGeometryIds:['forged']}}),/current unsigned/);
 assert.equal(g.v5Ready,false);
});
