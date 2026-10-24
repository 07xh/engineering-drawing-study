'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {evaluateReviewedConvexMeshDepth:evaluate}=
 require('../../workbench/reviewed-convex-scene-depth.cjs');
const {auditReviewedM4V5Motion:motion}=
 require('../../workbench/m4-existing-v5-motion-parity.cjs');
const {auditSpatialStrokeConstructionDAG:dag}=
 require('../../workbench/spatial-stroke-construction-dag-parity.cjs');
const {inspectSpatialV5ActionRelease:release}=
 require('../../workbench/spatial-v5-per-action-release-gate.cjs');
const P=(x,y,z)=>({x,y,z});
function box(id,a,b){
 const points={};
 for(let x=0;x<2;x++)for(let y=0;y<2;y++)for(let z=0;z<2;z++)
  points['V'+x+y+z]=P(x?b.x:a.x,y?b.y:a.y,z?b.z:a.z);
 const ids=Object.keys(points),edges=[];
 for(const [i,v]of ids.entries())for(const w of ids.slice(i+1))
  if([1,2,3].filter(j=>v[j]!==w[j]).length===1)edges.push([v,w]);
 const faces=[
  ['V000','V100','V110','V010'],['V001','V101','V111','V011'],
  ['V000','V100','V101','V001'],['V010','V110','V111','V011'],
  ['V000','V010','V011','V001'],['V100','V110','V111','V101']
 ];
 return {id,kind:'mesh',space:'model-3d',unit:'mm',data:{points,edges,faces}};
}
const geometry=[
 box('Rear',P(0,0,0),P(10,10,9)),
 box('Front',P(5,4,14),P(15,14,21))];
const revision=2026,sheet={origin:{x:360,y:208},scale:5},
 transforms={V:sheet,H:sheet,W:sheet};
const scene=evaluate({geometry,revision});
const parity=motion({geometry,sceneDepthEvidence:scene,revision,
 viewTransforms:transforms});
const construction=dag({geometry,sceneDepthEvidence:scene,revision,
 viewTransforms:transforms,motionParity:parity});
const inspect=(overrides={})=>release({geometry,sceneDepthEvidence:scene,
 revision,viewTransforms:transforms,motionParity:parity,
 spatialConstructionDAG:construction,...overrides});
test('each existing ONE-V5 candidate action carries two independently matched cut endpoints, but no official drawing style',()=>{
 const x=inspect(),cuts=scene.projectedCutEndpointTopology.cutEndpoints;
 assert.equal(x.status,'all-actions-held-evidence-incomplete');
 assert.equal(x.actionCount,scene.projectedStrokePartitions.segmentCount);
 assert.equal(x.actions.length,x.actionCount);
 assert.equal(x.blockedCount,x.actionCount);
 assert.equal(x.signedCount,0);
 assert.equal(x.singleV5Ready,false);
 for(let i=0;i<x.actions.length;i++){
  const row=x.actions[i],span=scene.projectedStrokePartitions.segments[i];
  assert.deepEqual(row.sourceCutEndpointParameterIds,span.sourceParameterRange);
  assert.equal(row.projectedCutPointFromStatus,cuts[i*2].status);
  assert.equal(row.projectedCutPointToStatus,cuts[i*2+1].status);
  assert.equal(row.independentOriginalEndpointRayAndIncidenceVerified,
   [cuts[2*i],cuts[2*i+1]].every(v=>
    v.status==='positive-original-vertex-ray-incidence'&&
    v.sourceOriginalPointRayVerified&&v.source3DIncidenceVerified));
  assert.equal(row.allProjectedJunctionTopologyVerified,false);
  assert.equal(row.authorizedLineStyle,'undetermined');
  assert.equal(row.officialStyleApproved,false);
  assert.equal(row.actionReleaseStatus,'blocked');
  assert.ok(row.missingProofs.includes('complete-source-endpoint-and-projected-join-visibility'));
 }
 assert.ok(Object.isFrozen(x.actions[0].sourceCutEndpointParameterIds));
});
test('crossings, projected overlap and interior split endpoints do not inherit fake original-source vertex approval',()=>{
 const x=inspect();
 const split=x.actions.filter(a=>
  a.sourceCutEndpointParameterIds[0]>0||a.sourceCutEndpointParameterIds[1]<1);
 assert.ok(split.length>0);
 assert.ok(split.every(a=>a.independentOriginalEndpointRayAndIncidenceVerified===false));
 assert.ok(split.every(a=>
  a.missingProofs.includes('source-cut-endpoint-full-positive-ray-and-3d-incidence')));
 assert.ok(x.actions.some(a=>a.missingProofs.includes(
  'cut-endpoint-tangent-overlap-transition-or-depth-topology')));
});
test('old revision or forged M5 endpoint report cannot mint a source V5 action release',()=>{
 assert.equal(inspect({revision:revision+1}).singleV5Ready,false);
 const invalid={...scene,projectedCutEndpointTopology:{
  ...scene.projectedCutEndpointTopology,
  cutEndpoints:scene.projectedCutEndpointTopology.cutEndpoints.map((x,i)=>
   i===0?{...x,status:'positive-original-vertex-ray-incidence'}:x)}};
 assert.throws(()=>inspect({sceneDepthEvidence:invalid}),/endpoint proof|substituted|stale|forged/i);
 const promoted={...scene,projectedCutEndpointTopology:{
  ...scene.projectedCutEndpointTopology,v5Ready:true}};
 assert.throws(()=>inspect({sceneDepthEvidence:promoted}),/endpoint proof|forged/i);
});
