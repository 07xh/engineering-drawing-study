'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {evaluateReviewedConvexMeshDepth:analyze}=
 require('../../workbench/reviewed-convex-scene-depth.cjs');
const {auditReviewedM4V5Motion:audit}=
 require('../../workbench/m4-existing-v5-motion-parity.cjs');
const {createUnifiedProjectSession}=
 require('../../project/unified-workbench-session.cjs');
const {deriveGeometryScene}=
 require('../../core/projection/geometry-scene-views.cjs');
const {compileGeometryScene}=
 require('../../project/geometry-scene-consumer.cjs');
const {project,toSheet,fromSheet}=require('../../core/projection/conventions.js');
const Motion=require('../../workbench/teaching-motion-v5.js');
const P=(x,y,z)=>({x,y,z});
function cube(id,x0,z0){
 const points={};
 for(let x=0;x<2;x++)for(let y=0;y<2;y++)for(let z=0;z<2;z++)
  points['V'+x+y+z]=P(x0+10*x,10*y,z0+2*z);
 const ids=Object.keys(points),edges=[];
 for(const [i,a]of ids.entries())for(const b of ids.slice(i+1))
  if([1,2,3].filter(k=>a[k]!==b[k]).length===1)edges.push([a,b]);
 return {id,kind:'mesh',space:'model-3d',unit:'mm',
  data:{points,edges,faces:[
   ['V000','V100','V110','V010'],['V001','V101','V111','V011'],
   ['V000','V100','V101','V001'],['V010','V110','V111','V011'],
   ['V000','V010','V011','V001'],['V100','V110','V111','V101']
  ]}};
}
const geometry=[cube('A',0,0),cube('B',3,4)],revision=134;
const scene=deriveGeometryScene({geometry,revision,resultId:'OriginalGeometry'});
const e=analyze({geometry,revision});
const sheet={origin:{x:360,y:208},scale:5};
const transforms={V:sheet,H:sheet,W:sheet};
test('ONE existing V5 Motion renders source-projectable M4 strokes at exact model mm -> first-angle paper coordinates',()=>{
 const r=audit({geometry,sceneDepthEvidence:e,revision,
  viewTransforms:transforms});
 assert.equal(r.status,'existing-motion-presentation-geometry-only');
 assert.equal(r.sourceSubspanCount,e.projectedStrokePartitions.segmentCount);
 assert.ok(r.sourceSubspanCount>0);
 assert.equal(r.paperGeometryParityVerified,true);
 assert.equal(r.createsSecondPlayer,false);
 assert.equal(r.v5Ready,false);
 assert.equal(r.fullContourLineStylesVerified,false);
 assert.equal(r.canonicalSpatialIntentVerified,false);
 assert.equal(r.constructionStepDAGVerified,false);
 assert.equal(Object.isFrozen(r.candidates),true);
 for(const [i,s]of e.projectedStrokePartitions.segments.entries()){
  const p=r.candidates[i],line=p.v5MotionAction;
  assert.deepEqual(p.sourceParameterRange,s.sourceParameterRange);
  assert.equal(p.sourceEdgeId,s.sourceEdgeId);
  assert.equal(p.scopedOpenInteriorVisibility,s.openInteriorVisibility);
  assert.equal(p.wholeDrawnStrokeVisibility,'undetermined');
  assert.equal(p.officialLineStyleVerified,false);
  assert.equal(p.v5ActionApproved,false);
  assert.equal(p.sourceEndpointVisibilityVerified,false);
  assert.deepEqual(line.geometry.from,toSheet(s.view,project(s.fromModelMm)[s.view],sheet));
  assert.deepEqual(line.geometry.to,toSheet(s.view,project(s.toModelMm)[s.view],sheet));
  const roundTrip=fromSheet(s.view,line.geometry.from,sheet),
   projected=project(s.fromModelMm)[s.view];
  assert.ok(Math.hypot(roundTrip.u-projected.u,
   roundTrip.v-projected.v)<1e-8);
  const x=Motion.actionShapeAttrs(line,0.5);
  assert.equal(x.x1,line.geometry.from.x);
  assert.ok(Math.abs(x.x2-(line.geometry.from.x+line.geometry.to.x)/2)<1e-8);
 }
});
test('paper origin, zoom and FIRST ANGLE signed transforms affect only presentation, not M4 source math',()=>{
 const moved={V:{origin:{x:71,y:162},scale:3},
  H:{origin:{x:100,y:400},scale:8},
  W:{origin:{x:-90,y:18},scale:13}};
 const a=audit({geometry,sceneDepthEvidence:e,revision,viewTransforms:moved});
 const b=audit({geometry,sceneDepthEvidence:e,revision,viewTransforms:transforms});
 assert.equal(a.sourceSubspanCount,b.sourceSubspanCount);
 for(let i=0;i<a.candidates.length;i++){
  const p=a.candidates[i],q=b.candidates[i],s=e.projectedStrokePartitions.segments[i];
  assert.equal(p.sourceEdgeId,q.sourceEdgeId);
  assert.equal(p.scopedOpenInteriorVisibility,q.scopedOpenInteriorVisibility);
  assert.deepEqual(p.v5MotionAction.geometry.from,
   toSheet(s.view,s.projectedFromModelMm,moved[s.view]));
 }
});
test('source event, 3D source, M4 proof flags and revision mismatch reject presentation parity',()=>{
 const args=()=>{const d=structuredClone(e);
  return {geometry,revision,sceneDepthEvidence:d,viewTransforms:transforms};};
 for(const mutate of [
  x=>{x.sceneDepthEvidence.projectedStrokePartitions.segments[0]
   .officialLineStyleVerified=true;},
  x=>{x.sceneDepthEvidence.projectedStrokePartitions.segments[0]
   .projectedFromModelMm.u+=0.3;},
  x=>{x.sceneDepthEvidence.projectedStrokePartitions.segments[0]
   .sourceEndpointJoins.from={sourceVertexKey:'Fake'};},
  x=>{x.sceneDepthEvidence.edgeOverlapAudit.pairCount++;},
  x=>{x.sceneDepthEvidence.projectedVertexJoins.groups[0].members[0]
   .pointRayOcclusion='forged';}
 ]){
  const arg=args();mutate(arg);
  assert.throws(()=>audit(arg),/scoped projected stroke partition|M4 to existing V5 motion parity/);
 }
 assert.equal(audit({...args(),revision:135}).status,'not-covered');
 for(const t of [
  {V:sheet,H:sheet},
  {V:sheet,H:sheet,W:{origin:{x:0,y:0},scale:0}},
  {V:sheet,H:sheet,W:{origin:{x:Infinity,y:0},scale:1}}
 ])assert.throws(()=>audit({...args(),viewTransforms:t}));
});
test('one REAL V7 source-confirmed composition exposes same V5 Motion geometry parity, but no signed timeline',()=>{
 const session=createUnifiedProjectSession();
 try{
  session.loadInputs({task:'composition',projectId:'MotionProof',revision,
   source:{imageId:'ApprovedImage'},relations:[],totalRelationCount:0,
   objects:geometry.map(g=>({id:g.id,kind:'solid'})),
   conditions:geometry.map(g=>({id:'Cond'+g.id,objectId:g.id,
    confirmed:true,sourceCandidateId:null,value:{type:'manual-geometry',
     imageId:'ApprovedImage',unit:'mm',geometry:g}}))
  });
  const result=session.solve(),v=result.scopedMotionParity;
  assert.equal(v.status,'existing-motion-presentation-geometry-only');
  assert.equal(v.sourceSubspanCount,result.sceneDepthEvidence
   .projectedStrokePartitions.segmentCount);
  assert.equal(v.createsSecondPlayer,false);
  const compiled=compileGeometryScene(result.scene,{sheet});
  for(const cand of v.candidates){
   const transformed=toSheet(cand.view,
    project(e.projectedStrokePartitions.segments.find(s=>
     s.sourceEdgeId===cand.sourceEdgeId&&s.view===cand.view&&
     s.sourceParameterRange[0]===cand.sourceParameterRange[0])
     .fromModelMm)[cand.view],compiled.paperTransform);
   assert.deepEqual(cand.v5MotionAction.geometry.from,transformed);
  }
  assert.equal(result.plan,null);
  assert.equal(result.clock,null);
  assert.equal(result.verified,false);
  assert.equal(v.v5Ready,false);
  session.invalidate();
  assert.equal(session.readSnapshot(),null);
 }finally{session.dispose();}
});
test('incomplete source mesh never generates a V5 action or spare player',()=>{
 const bad=cube('Open',0,0);bad.data.faces.pop();
 const evidence=analyze({geometry:[bad],revision});
 const r=audit({geometry:[bad],sceneDepthEvidence:evidence,revision,
  viewTransforms:transforms});
 assert.equal(r.status,'not-covered');
 assert.equal(r.sourceSubspanCount,0);
 assert.deepEqual(r.candidates,[]);
 assert.equal(r.v5Ready,false);
});
