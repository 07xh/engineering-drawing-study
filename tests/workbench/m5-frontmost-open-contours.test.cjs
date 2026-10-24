'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {evaluateReviewedConvexMeshDepth:evaluate}=
 require('../../workbench/reviewed-convex-scene-depth.cjs');
const {correlateReviewedOpenContours:correlate}=
 require('../../workbench/reviewed-frontmost-open-contours.cjs');
const {createUnifiedProjectSession}=
 require('../../project/unified-workbench-session.cjs');
const P=(x,y,z)=>({x,y,z});
function box(id,x0,z0){
 const points={};
 for(let x=0;x<2;x++)for(let y=0;y<2;y++)for(let z=0;z<2;z++)
  points['V'+x+y+z]=P(x0+10*x,10*y,z0+2*z);
 const ids=Object.keys(points),edges=[];
 for(const [i,a]of ids.entries())for(const b of ids.slice(i+1))
  if([1,2,3].filter(k=>a[k]!==b[k]).length===1)edges.push([a,b]);
 return {id,kind:'mesh',space:'model-3d',unit:'mm',data:{points,edges,
  faces:[
   ['V000','V100','V110','V010'],['V001','V101','V111','V011'],
   ['V000','V100','V101','V001'],['V010','V110','V111','V011'],
   ['V000','V010','V011','V001'],['V100','V110','V111','V101']
  ]}};
}
const back=box('Back',0,0),front=box('Front',3,4),
 geometry=[back,front];
test('M5 first-angle individual projected outline correlates unique continuous FRONT source edges',()=>{
 const e=evaluate({geometry,revision:202}),
  contours=e.frontmostOpenContours;
 assert.equal(contours.schema,'draftai-m5-frontmost-open-contour-spans/1');
 assert.equal(contours.status,'scoped-frontmost-open-contour-evidence-only');
 assert.ok(contours.entryCount>=16);
 assert.ok(contours.localVisibleOpenSpanCount>0);
 assert.ok(contours.entries.some(x=>x.view==='H'&&
  x.sourceGeometryId==='Front'&&
  x.openSpans.some(s=>s.frontmostSourceEdgeId!==null)));
 assert.equal(contours.fullMultiBodySilhouetteVerified,false);
 assert.equal(contours.allSourceEndpointJoinsVerified,false);
 assert.equal(contours.officialLineStylesVerified,false);
 assert.equal(contours.canonicalIntentVerified,false);
 assert.equal(contours.constructionStepDAGVerified,false);
 assert.equal(contours.v5Ready,false);
 assert.equal(e.v5Ready,false);
 for(const x of contours.entries){
  assert.ok(['V','H','W'].includes(x.view));
  assert.equal(x.geometricHullSideVerified,true);
  assert.equal(x.sourceJunctionsVerified,false);
  assert.equal(x.wholeSideStandardLineStyleVerified,false);
  const cuts=x.openSpans;
  assert.ok(cuts.length>0);
  assert.equal(cuts[0].projectedFractionRange[0],0);
  assert.equal(cuts.at(-1).projectedFractionRange[1],1);
  for(let i=0;i<cuts.length;i++){
   const span=cuts[i];
   if(i)assert.equal(cuts[i-1].projectedFractionRange[1],
    span.projectedFractionRange[0]);
   assert.ok(span.projectedFractionRange[1]>span.projectedFractionRange[0]);
   assert.equal(span.officialLineStyleVerified,false);
   assert.equal(span.v5ActionApproved,false);
   assert.equal(span.sourceEndpointJoinsVerified,false);
   if(span.status==='scoped-frontmost-visible-open-interval'){
    assert.ok(span.frontmostSourceEdgeId.startsWith(x.sourceGeometryId+'::'));
    assert.deepEqual(span.candidateSourceEdgeIds,[span.frontmostSourceEdgeId]);
   }else{
    assert.equal(span.status,'undetermined');
    assert.equal(span.frontmostSourceEdgeId,null);
   }
  }
 }
 assert.equal(Object.isFrozen(contours.entries),true);
 assert.equal(Object.isFrozen(contours.entries[0].openSpans),true);
});
test('geometric hull side is NOT automatically visible multi-body silhouette',()=>{
 const e=evaluate({geometry,revision:203});
 const rearH=e.frontmostOpenContours.entries.filter(x=>
  x.sourceGeometryId==='Back'&&x.view==='H');
 assert.ok(rearH.length>=4);
 assert.ok(rearH.some(side=>side.openSpans.some(s=>s.status==='undetermined')));
 assert.ok(e.projectedOutlines.allIndividualConvexProjectedBoundariesVerified);
 assert.equal(e.projectedOutlines.combinedSilhouetteVerified,false);
 assert.equal(e.frontmostOpenContours.fullMultiBodySilhouetteVerified,false);
});
test('edited hull, original source edge, projected depth cut or stale revision cannot fake a future V5 contour style',()=>{
 const e=evaluate({geometry,revision:204});
 const args=()=>{const z=structuredClone(e);
  return {geometry,revision:204,sceneDepthEvidence:z,
   projectedStrokePartitions:z.projectedStrokePartitions};};
 for(const mutate of [
  x=>{x.sceneDepthEvidence.projectedOutlines.objects[0]
   .evidence.H.boundarySides[0].projectedBoundaryVerified=false;},
  x=>{x.sceneDepthEvidence.projectedOutlines.objects[0]
   .evidence.H.boundarySides[0].sourceEdgeCandidates[0]
   .sourceEdgeId='V000|V111';},
  x=>{x.projectedStrokePartitions.segments[0].openInteriorVisibility='forged-visible';},
  x=>{x.sceneDepthEvidence.edgeOverlapAudit.pairCount++;}
 ]){
  const a=args();mutate(a);
  assert.throws(()=>correlate(a),/M5 frontmost open contour|scoped projected stroke partition/);
 }
 assert.equal(correlate({...args(),revision:205}).status,'not-covered');
});
test('actual source-confirmed V7 composition exposes open contour candidates without a second V5',()=>{
 const session=createUnifiedProjectSession();
 try{
  session.loadInputs({task:'composition',projectId:'OutlineReadOnly',
   revision:206,source:{imageId:'SourceImage'},
   totalRelationCount:0,relations:[],
   objects:geometry.map(g=>({id:g.id,kind:'solid'})),
   conditions:geometry.map(g=>({id:'C'+g.id,objectId:g.id,
    confirmed:true,sourceCandidateId:null,value:{type:'manual-geometry',
     imageId:'SourceImage',unit:'mm',geometry:g}}))
  });
  const result=session.solve();
  assert.ok(result.sceneDepthEvidence.frontmostOpenContours.localVisibleOpenSpanCount>0);
  assert.equal(result.sceneDepthEvidence.frontmostOpenContours.v5Ready,false);
  assert.equal(result.verified,false);
  assert.equal(result.plan,null);
  assert.equal(result.clock,null);
  session.invalidate();
  assert.equal(session.readSnapshot(),null);
 }finally{session.dispose();}
});
test('open mesh or unsupported geometry cannot fabricate visible contour',()=>{
 const bad=box('Open',0,0);bad.data.faces.pop();
 const r=evaluate({geometry:[bad],revision:207});
 assert.equal(r.status,'not-covered');
 assert.equal(r.frontmostOpenContours.status,'not-covered');
 assert.equal(r.frontmostOpenContours.v5Ready,false);
});
