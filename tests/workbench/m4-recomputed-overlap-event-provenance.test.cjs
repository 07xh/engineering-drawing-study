'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {evaluateReviewedConvexMeshDepth:analyze}=
 require('../../workbench/reviewed-convex-scene-depth.cjs');
const {partitionReviewedSourceEdges:partition}=
 require('../../workbench/scoped-projected-stroke-partition.cjs');
const {recomputeReviewedProjectedEdgeEvents:recompute}=
 require('../../workbench/recomputed-projected-pairwise-events.cjs');
const {createUnifiedProjectSession}=
 require('../../project/unified-workbench-session.cjs');
const P=(x,y,z)=>({x,y,z});
function cube(id,x0,z0){
 const points={};
 for(let x=0;x<2;x++)for(let y=0;y<2;y++)for(let z=0;z<2;z++)
  points['V'+x+y+z]=P(x0+x*10,y*10,z0+z*2);
 const names=Object.keys(points),edges=[];
 for(const [i,a] of names.entries())for(const b of names.slice(i+1))
  if([1,2,3].filter(k=>a[k]!==b[k]).length===1)edges.push([a,b]);
 return {id,space:'model-3d',kind:'mesh',unit:'mm',data:{points,edges,
  faces:[
   ['V000','V100','V110','V010'],['V001','V101','V111','V011'],
   ['V000','V100','V101','V001'],['V010','V110','V111','V011'],
   ['V000','V010','V011','V001'],['V100','V110','V111','V101']
  ]}};
}
const geometry=[cube('Base',0,0),cube('Front',3,4)];
const original=analyze({geometry,revision:900});
const run=sceneDepthEvidence=>partition({geometry,sceneDepthEvidence,revision:900});
test('recomputed mathematical pairwise V/H/W events equal previously approved M5 source audit',()=>{
 const input=[];
 for(const g of geometry)for(const pair of g.data.edges){
  input.push({sourceGeometryId:g.id,
   sourceEdgeId:g.id+'::'+[...pair].sort().join('|'),
   edge:{id:'ReviewedEdge_'+(input.length+1),
    from:g.data.points[pair[0]],to:g.data.points[pair[1]]}});
 }
 const proven=recompute(input);
 assert.deepEqual(proven,original.edgeOverlapAudit);
 assert.equal(proven.pairCount,input.length*(input.length-1)/2*3);
 assert.ok(proven.events.length>0);
 assert.equal(original.projectedStrokePartitions.status,'preview-partition-evidence-only');
 assert.deepEqual(run(original),original.projectedStrokePartitions);
 assert.equal(Object.isFrozen(proven.events),true);
});
test('M4 rejects altered projected intersection events, missing real events, sorted order and pair count',()=>{
 const altered=[
  d=>{d.edgeOverlapAudit.pairCount++;},
  d=>{d.edgeOverlapAudit.events.pop();},
  d=>{d.edgeOverlapAudit.events.push({...d.edgeOverlapAudit.events[0]});},
  d=>{d.edgeOverlapAudit.events.reverse();},
  d=>{d.edgeOverlapAudit.events[0].firstSourceEdgeId='Bogus::V000|V111';},
  d=>{d.edgeOverlapAudit.events[0].completeOcclusionVerified=true;},
  d=>{d.edgeOverlapAudit.events[0].relation='crossing';},
 ];
 for(const mutate of altered){
  const d=structuredClone(original);mutate(d);
  assert.notDeepEqual(d.edgeOverlapAudit,original.edgeOverlapAudit);
  assert.throws(()=>run(d),/forged or stale projected crossing\/overlap/);
 }
});
test('changes to numerical projection ranges, depth delta and tie labels cannot enter future V5 cuts',()=>{
 const originalEvents=original.edgeOverlapAudit.events;
 const index=originalEvents.findIndex(e=>
  e.events?.length||e.ranges?.length);
 assert.ok(index>=0);
 const incident=originalEvents[index];
 for(const mutate of [
  d=>{d.events[index].view=d.events[index].view==='H'?'V':'H';},
  d=>{d.events[index].firstSourceGeometryId='Fake';},
  d=>{if(d.events[index].events.length)
    d.events[index].events[0].firstParameter+=0.007;
   else d.events[index].ranges[0].firstParameterRange[0]+=0.007;},
  d=>{if(d.events[index].events.length)
    d.events[index].events[0].front='first';
   else d.events[index].ranges[0].front='first';}
 ]){
  const d=structuredClone(original);
  mutate(d.edgeOverlapAudit);
  if(JSON.stringify(d.edgeOverlapAudit)===JSON.stringify(original.edgeOverlapAudit))
   continue;
  assert.throws(()=>run(d),/forged or stale projected crossing\/overlap/);
 }
 assert.ok(incident);
});
test('existing V7 reviewed composition still uses same scene, source revision, no V5 approval',()=>{
 const session=createUnifiedProjectSession();
 try{
  session.loadInputs({task:'composition',projectId:'EventProof',revision:900,
   source:{imageId:'Photo'},relations:[],totalRelationCount:0,
   objects:geometry.map(g=>({id:g.id,kind:'solid'})),
   conditions:geometry.map(g=>({id:'Condition'+g.id,objectId:g.id,
    confirmed:true,sourceCandidateId:null,value:{type:'manual-geometry',
     imageId:'Photo',unit:'mm',geometry:g}}))
  });
  const r=session.solve();
  assert.deepEqual(r.sceneDepthEvidence.projectedStrokePartitions,
   original.projectedStrokePartitions);
  assert.equal(r.sceneDepthEvidence.v5Ready,false);
  assert.equal(r.sceneDepthEvidence.officialLineStylesVerified,false);
  assert.equal(r.plan,null);
  assert.equal(r.clock,null);
  session.invalidate();
  assert.equal(session.readSnapshot(),null);
 }finally{session.dispose();}
});
