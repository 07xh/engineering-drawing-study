'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {evaluateReviewedConvexMeshDepth}=
 require('../../workbench/reviewed-convex-scene-depth.cjs');
const {inspectClosedSourceStrokeRays:prove}=
 require('../../workbench/reviewed-closed-source-stroke-rays.cjs');
const P=(x,y,z)=>({x,y,z});
function box(id,a,b){
 const points={};
 for(let x=0;x<2;x++)for(let y=0;y<2;y++)for(let z=0;z<2;z++)
  points['V'+x+y+z]=P(x?b.x:a.x,y?b.y:a.y,z?b.z:a.z);
 const ids=Object.keys(points),edges=[];
 for(const [i,k]of ids.entries())for(const v of ids.slice(i+1))
  if([1,2,3].filter(q=>k[q]!==v[q]).length===1)edges.push([k,v]);
 const faces=[
  ['V000','V100','V110','V010'],['V001','V101','V111','V011'],
  ['V000','V100','V101','V001'],['V010','V110','V111','V011'],
  ['V000','V010','V011','V001'],['V100','V110','V111','V101']
 ];
 return {id,kind:'mesh',space:'model-3d',unit:'mm',data:{points,edges,faces}};
}
const rear=box('Rear',P(0,0,0),P(10,10,10)),
 forward=box('Forward',P(4,3,14),P(14,13,21));
test('single reviewed convex mesh certifies some complete original outer edges via all-ray proofs without inventing official solid-line style',()=>{
 const geometry=[rear],revision=61;
 const scene=evaluateReviewedConvexMeshDepth({geometry,revision});
 const a=scene.closedSourceStrokeRays;
 assert.equal(a.status,'scoped-positive-closed-source-rays-only');
 assert.ok(a.sourceEdgeViewCount>0);
 assert.ok(a.certifiedClosedVisibleCount>0,
  'strict outward support and both original vertex positive rays prove some full edges');
 assert.ok(a.certifiedOuterEdgeCount>0,
  'front silhouette edges are projected hull boundary and fully frontmost');
 assert.ok(a.certifiedClosedVisibleCount>=a.certifiedOuterEdgeCount);
 assert.equal(a.officialLineStylesVerified,false);
 assert.equal(a.v5Ready,false);
 const closed=a.edges.filter(e=>e.status==='certified-visible-closed-outer-source-edge');
 assert.ok(closed.length>0);
 assert.ok(closed.every(x=>x.positiveClosedRayVisibilityVerified&&
  x.originalSourceEndpointRaysVerified&&
  x.projectedOuterOpenBoundaryVerified));
 assert.ok(closed.every(x=>x.projectedJunctionTopologyVerified===false&&
  x.officialLineStyleVerified===false&&x.v5Ready===false));
 assert.ok(Object.isFrozen(closed[0].sourceParameterRange));
 const recomputed=prove({geometry,sceneDepthEvidence:scene,revision});
 assert.deepEqual(recomputed,a);
});
test('two genuinely overlapping projected solids allow bounded positive ray evidence but NEVER overall multi-body drawing certification',()=>{
 const geometry=[rear,forward],revision=62;
 const scene=evaluateReviewedConvexMeshDepth({geometry,revision});
 const a=scene.closedSourceStrokeRays;
 assert.equal(a.sourceGeometryIds.length,2);
 assert.ok(a.sourceEdgeViewCount>0);
 assert.equal(a.completeMultiBodyLineWorkVerified,false);
 assert.equal(a.canonicalConstructionIntentVerified,false);
 assert.equal(a.constructionStepDAGVerified,false);
 assert.equal(a.v5Ready,false);
 for(const edge of a.edges){
  assert.equal(edge.officialLineStyleVerified,false);
  if(edge.positiveClosedRayVisibilityVerified)
   assert.equal(edge.originalSourceEndpointRaysVerified,true);
 }
});
test('source touching/near coincident projected joints are not assumed unique positive joins',()=>{
 const sameView=box('Other',P(0,0,18),P(10,10,25));
 const geometry=[rear,sameView],revision=63;
 const a=evaluateReviewedConvexMeshDepth({geometry,revision}).closedSourceStrokeRays;
 assert.ok(a.edges.some(x=>x.status==='undetermined'));
 assert.equal(a.officialLineStylesVerified,false);
 assert.ok(a.edges.every(x=>x.projectedJunctionTopologyVerified===false));
});
test('strict anti-forgery: stale revision, altered ray partitions or fake union/outlines block positive line certificates',()=>{
 const geometry=[rear],revision=64,
  scene=evaluateReviewedConvexMeshDepth({geometry,revision});
 assert.throws(()=>prove({geometry,sceneDepthEvidence:scene,revision:65}),/not-covered|revision/);
 const e={...scene,projectedStrokePartitions:{...scene.projectedStrokePartitions,
  segments:scene.projectedStrokePartitions.segments.map((s,i)=>
   i===0?{...s,openInteriorVisibility:'visible'}:s)}};
 assert.throws(()=>prove({geometry,sceneDepthEvidence:e,revision}),/source visibility|segment/);
 const fake={...scene,projectedUnionOutlines:{...scene.projectedUnionOutlines,
  segments:scene.projectedUnionOutlines.segments.map((s,i)=>
   i===0?{...s,status:'open-projected-union-boundary',officialLineStyleVerified:true}:s)}};
 assert.throws(()=>prove({geometry,sceneDepthEvidence:fake,revision}),/tampered|stale/);
});
test('open mesh and unsupported geometry do not produce a fabricated positive full source line',()=>{
 const broken=box('Open',P(0,0,0),P(2,4,6));
 broken.data.faces.pop();
 const audit=evaluateReviewedConvexMeshDepth({geometry:[broken],revision:65});
 assert.equal(audit.status,'not-covered');
 assert.equal(audit.closedSourceStrokeRays.status,'not-covered');
 assert.equal(audit.closedSourceStrokeRays.certifiedClosedVisibleCount,0);
});
