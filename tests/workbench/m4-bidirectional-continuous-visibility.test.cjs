'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {evaluateReviewedConvexMeshDepth:compute}=
 require('../../workbench/reviewed-convex-scene-depth.cjs');
const {partitionReviewedSourceEdges:partition}=
 require('../../workbench/scoped-projected-stroke-partition.cjs');
const {certifyConvexSegmentClearance:clear}=
 require('../../core/numeric/convex-segment-clearance.cjs');
const {verifiedConvexMeshHalfspaces:convex}=
 require('../../core/geometry/verified-convex-mesh-halfspaces.cjs');
const {FIRST_ANGLE_OBSERVER_RAYS}=require('../../core/projection/conventions.js');
const {createUnifiedProjectSession}=require('../../project/unified-workbench-session.cjs');
const P=(x,y,z)=>({x,y,z});
function box(id,min,max){
 const points={};
 for(let x=0;x<2;x++)for(let y=0;y<2;y++)for(let z=0;z<2;z++)
  points['V'+x+y+z]=P(x?max.x:min.x,y?max.y:min.y,z?max.z:min.z);
 const ids=Object.keys(points),edges=[];
 for(const [i,a] of ids.entries())for(const b of ids.slice(i+1))
  if([1,2,3].filter(k=>a[k]!==b[k]).length===1)edges.push([a,b]);
 const faces=[
  ['V000','V100','V110','V010'],['V001','V101','V111','V011'],
  ['V000','V100','V101','V001'],['V010','V110','V111','V011'],
  ['V000','V010','V011','V001'],['V100','V110','V111','V101']
 ];
 return {id,kind:'mesh',space:'model-3d',unit:'mm',
  data:{points,edges,faces}};
}
const near=box('Near',P(-1,-1,4),P(11,11,6));
const far=box('Far',P(0,0,0),P(10,10,2));
const pair=[far,near];
const owners=Object.fromEntries(pair.map(g=>[g.id,g]));
const solids=pair.map(g=>({id:g.id,halfspaces:convex(g).halfspaces}));
const reconstructed=span=>{
 const g=owners[span.sourceGeometryId];
 const [a,b]=span.sourceEdgeId.split('::')[1].split('|');
 return {id:'Checked',from:g.data.points[a],to:g.data.points[b]};
};
test('M4 now distinguishes independently certified V/H/W OPEN visibility from hidden and uncertain',()=>{
 const evidence=compute({geometry:pair,revision:165}),
  pieces=evidence.projectedStrokePartitions;
 assert.equal(pieces.status,'preview-partition-evidence-only');
 assert.ok(pieces.scopedHiddenCount>0);
 assert.ok(pieces.scopedVisibleCount>0);
 assert.equal(pieces.segmentCount,pieces.segments.length);
 assert.equal(evidence.v5Ready,false);
 assert.equal(pieces.v5Ready,false);
 assert.equal(pieces.officialLineStylesVerified,false);
 assert.equal(pieces.canonicalIntentVerified,false);
 assert.equal(pieces.constructionStepDAGVerified,false);
 assert.equal(pieces.completeOcclusionVerified,false);
 const counts={hidden:0,visible:0,undetermined:0};
 for(const p of pieces.segments){
  counts[p.openInteriorVisibility]++;
  assert.equal(p.v5ActionApproved,false);
  assert.equal(p.joinVisibilityVerified,false);
  assert.equal(p.officialLineStyleVerified,false);
  assert.ok(p.sourceParameterRange[0]>=0&&
   p.sourceParameterRange[1]<=1);
  assert.ok(p.sourceParameterRange[0]<p.sourceParameterRange[1]);
  assert.ok(Object.isFrozen(p));
  if(p.openInteriorVisibility==='visible'){
   assert.equal(p.evidenceScope,
    'strict-forward-ray-clearance-in-reviewed-solids');
   assert.deepEqual(p.positiveClearanceSolidIds,['Far','Near']);
   for(const solid of solids){
    const w=clear({source:reconstructed(p),solid,
     observerDirection:FIRST_ANGLE_OBSERVER_RAYS[p.view],
     sourceParameterRange:p.sourceParameterRange});
    assert.equal(w.status,'certified-clear',
     'positive statement must be independently true for every scene blocker');
   }
  }else{
   assert.deepEqual(p.positiveClearanceSolidIds,[]);
   if(p.openInteriorVisibility==='undetermined'){
    assert.equal(p.evidenceScope,'none');
    assert.deepEqual(p.occluderGeometryIds,[]);
   }
  }
 }
 assert.equal(pieces.scopedVisibleCount,counts.visible);
 assert.equal(pieces.scopedHiddenCount,counts.hidden);
 assert.ok(counts.undetermined>0,
  'intersections/junctions/coplanar silhouettes cannot all be promoted');
 assert.ok(pieces.segments.some(p=>p.view==='H'&&
  p.sourceGeometryId==='Near'&&p.openInteriorVisibility==='visible'));
 assert.ok(pieces.segments.some(p=>p.view==='H'&&
  p.sourceGeometryId==='Far'&&p.openInteriorVisibility==='hidden'));
});
test('reverse-observer and coplanar exposed edges do not become a fabricated certified visible contour',()=>{
 const out=compute({geometry:pair,revision:168}).projectedStrokePartitions;
 assert.ok(out.segments.some(p=>p.openInteriorVisibility==='undetermined'));
 // A rear edge is behind the enlarged near body in H.
 assert.ok(out.segments.filter(s=>s.view==='H'&&s.sourceGeometryId==='Far')
  .some(p=>p.openInteriorVisibility==='hidden'));
 assert.ok(out.segments.every(p=>p.officialLineStyleVerified===false));
});
test('old forged visibility summary cannot force positive results; source revision remains authoritative',()=>{
 const e=compute({geometry:pair,revision:170});
 const forged=structuredClone(e);
 forged.projectedStrokePartitions.scopedVisibleCount=999;
 forged.projectedStrokePartitions.segments[0].openInteriorVisibility='visible';
 const rebuilt=partition({geometry:pair,sceneDepthEvidence:forged,revision:170});
 assert.deepEqual(rebuilt,e.projectedStrokePartitions);
 const stale=partition({geometry:pair,sceneDepthEvidence:e,revision:171});
 assert.equal(stale.status,'not-covered');
});
test('real V7 human-confirmed Geometry scene exposes both scoped states, no second player or official line-style',()=>{
 const s=createUnifiedProjectSession();
 try{
  s.loadInputs({task:'composition',revision:171,projectId:'ReviewedVisible',
   source:{imageId:'CurrentSource'},totalRelationCount:0,relations:[],
   objects:pair.map(g=>({id:g.id,kind:'solid'})),
   conditions:pair.map(g=>({id:'Condition'+g.id,objectId:g.id,
    confirmed:true,sourceCandidateId:null,value:{type:'manual-geometry',
     imageId:'CurrentSource',unit:'mm',geometry:g}}))
  });
  const r=s.solve(),p=r.sceneDepthEvidence.projectedStrokePartitions;
  assert.equal(p.status,'preview-partition-evidence-only');
  assert.ok(p.scopedVisibleCount>0&&p.scopedHiddenCount>0);
  assert.equal(r.verified,false);
  assert.equal(r.plan,null);
  assert.equal(r.clock,null);
  s.invalidate();
  assert.equal(s.readSnapshot(),null);
 }finally{s.dispose();}
});
