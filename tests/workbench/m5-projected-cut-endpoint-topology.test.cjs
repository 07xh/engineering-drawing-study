'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {evaluateReviewedConvexMeshDepth:evaluate}=
 require('../../workbench/reviewed-convex-scene-depth.cjs');
const {deriveProjectedCutEndpointTopology:topology}=
 require('../../workbench/reviewed-projected-cut-endpoint-topology.cjs');
const {inspectSpatialV5Readiness:readiness}=
 require('../../workbench/spatial-v5-evidence-readiness.cjs');
const P=(x,y,z)=>({x,y,z});
function box(id,a,b){
 const points={};
 for(let x=0;x<2;x++)for(let y=0;y<2;y++)for(let z=0;z<2;z++)
  points['V'+x+y+z]=P(x?b.x:a.x,y?b.y:a.y,z?b.z:a.z);
 const ids=Object.keys(points),edges=[];
 for(const [i,v] of ids.entries())for(const w of ids.slice(i+1))
  if([1,2,3].filter(j=>v[j]!==w[j]).length===1)edges.push([v,w]);
 const faces=[
  ['V000','V100','V110','V010'],['V001','V101','V111','V011'],
  ['V000','V100','V101','V001'],['V010','V110','V111','V011'],
  ['V000','V010','V011','V001'],['V100','V110','V111','V101']
 ];
 return {id,kind:'mesh',space:'model-3d',unit:'mm',data:{points,edges,faces}};
}
const rear=box('Rear',P(0,0,0),P(10,10,10));
const front=box('Front',P(5,4,14),P(15,14,24));
test('real first-angle source edges produce uniquely source-bound V/H/W cut endpoints with no official line certification',()=>{
 const revision=21,geometry=[rear];
 const scene=evaluate({geometry,revision});
 const e=scene.projectedCutEndpointTopology;
 assert.equal(e.schema,'draftai-m5-projected-cut-endpoints/1');
 assert.equal(e.status,'source-projected-endpoint-scope-only');
 assert.equal(e.sourceCount,scene.projectedStrokePartitions.segmentCount);
 assert.equal(e.cutEndpoints.length,2*e.sourceCount);
 assert.equal(e.v5Ready,false);
 assert.equal(e.fullProjectedJunctionsVerified,false);
 assert.equal(e.officialLineStylesVerified,false);
 const original=e.cutEndpoints.filter(x=>x.source3DIncidenceVerified);
 assert.ok(original.length>0);
 assert.ok(original.every(x=>x.sourceVertexKey&&
  [0,1].includes(x.sourceParameter)&&x.pointModelMm&&
  x.projectedIntersectionIsPhysicalSourceJoinVerified===false));
 assert.ok(e.cutEndpoints.every(x=>x.officialEndpointLineStyleVerified===false&&
  x.allIncidentStrokeContinuityVerified===false&&x.v5Ready===false));
 assert.deepEqual(topology({geometry,sceneDepthEvidence:scene,revision}),e);
 assert.ok(Object.isFrozen(e.cutEndpoints[0].projectedModelMm));
 const report=readiness({sceneDepthEvidence:scene,revision});
 assert.equal(report.v5Ready,false);
 assert.equal(report.projectedCutPointScopePresent,true);
 assert.equal(report.singleV5TimelineCanBeSigned,false);
});
test('two partially overlapping bodies distinguish transverse depth-separated paper crossings from physical joins',()=>{
 const geometry=[rear,front],revision=22;
 const scene=evaluate({geometry,revision});
 const e=scene.projectedCutEndpointTopology;
 assert.equal(e.status,'source-projected-endpoint-scope-only');
 assert.ok(e.cutEndpoints.some(x=>x.sourceParameter>0&&x.sourceParameter<1));
 const deepCrossings=scene.edgeOverlapAudit.events.filter(x=>
  x.relation==='crossing').flatMap(x=>x.events||[])
  .filter(x=>x.endpointOrJoin===false&&x.front!=='undetermined');
 assert.ok(deepCrossings.length>0,'pairwise sources contain strict paper crossing with distinct depth');
 const separated=e.cutEndpoints.filter(x=>x.screenDepthSeparated);
 assert.ok(separated.length>0,'real original stroke cut keeps the pairwise depth witness');
 assert.ok(separated.every(x=>
  x.projectedIntersectionIsPhysicalSourceJoinVerified===false));
 // Other overlapping source edges at THE SAME paper junction may make
 // even a depth-separated two-edge crossing unsafe as a complete join.
 assert.ok(separated.every(x=>
  ['depth-separated-paper-crossing-no-spatial-join',
   'undetermined-paper-overlap-touch-or-tie'].includes(x.status)));
 assert.ok(e.cutEndpoints.some(x=>x.status.startsWith('undetermined')));
 assert.equal(e.fullProjectedJunctionsVerified,false);
 assert.equal(scene.v5Ready,false);
});
test('coincident paper projections and source vertices at different physical depths remain undetermined',()=>{
 const overlapping=box('Stacked',P(0,0,12),P(10,10,22));
 const geometry=[rear,overlapping],revision=23,
  proof=evaluate({geometry,revision}).projectedCutEndpointTopology;
 assert.equal(proof.v5Ready,false);
 assert.ok(proof.cutEndpoints.some(x=>
  x.status==='undetermined-paper-overlap-touch-or-tie'));
 assert.ok(proof.cutEndpoints.every(x=>
  x.projectedIntersectionIsPhysicalSourceJoinVerified===false));
});
test('source revision changes, tampered edge events, forged endpoint rays all fail closed',()=>{
 const geometry=[rear],revision=24,scene=evaluate({geometry,revision});
 const stale=topology({geometry,sceneDepthEvidence:scene,revision:revision+1});
 assert.equal(stale.status,'not-covered');
 assert.equal(stale.v5Ready,false);
 const forged={...scene,projectedVertexJoins:{
  ...scene.projectedVertexJoins,
  groups:scene.projectedVertexJoins.groups.map((g,i)=>i===0?
   {...g,listedVertexDepthOrderVerified:false}:g)
 }};
 assert.throws(()=>topology({geometry,sceneDepthEvidence:forged,revision}),
  /untrusted|stale/);
 const changed={...scene,edgeOverlapAudit:{...scene.edgeOverlapAudit,
  pairCount:scene.edgeOverlapAudit.pairCount+1}};
 assert.throws(()=>topology({geometry,sceneDepthEvidence:changed,revision}),
  /untrusted|stale/);
 const tampered={...scene,projectedCutEndpointTopology:{
  ...scene.projectedCutEndpointTopology,v5Ready:true}};
 assert.throws(()=>readiness({sceneDepthEvidence:tampered,revision}),
  /forged/);
});
test('open meshes and invalid/unreviewed source conditions never become accepted paper joins',()=>{
 const invalid=box('Open',P(0,0,0),P(2,3,4));
 invalid.data.faces.pop();
 const scene=evaluate({geometry:[invalid],revision:25});
 assert.equal(scene.status,'not-covered');
 assert.equal(scene.projectedCutEndpointTopology.status,'not-covered');
 assert.equal(scene.projectedCutEndpointTopology.v5Ready,false);
});
