'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {evaluateReviewedConvexMeshDepth:run}=
 require('../../workbench/reviewed-convex-scene-depth.cjs');
const {createUnifiedProjectSession}=
 require('../../project/unified-workbench-session.cjs');
const P=(x,y,z)=>({x,y,z});
function box(id,z0,z1){
 const points={};
 for(let x=0;x<2;x++)for(let y=0;y<2;y++)for(let z=0;z<2;z++)
  points['V'+x+y+z]=P(x?10:0,y?10:0,z?z1:z0);
 const ids=Object.keys(points),edges=[];
 for(const [i,k] of ids.entries())for(const v of ids.slice(i+1))
  if([1,2,3].filter(q=>k[q]!==v[q]).length===1)edges.push([k,v]);
 const faces=[
  ['V000','V100','V110','V010'],['V001','V101','V111','V011'],
  ['V000','V100','V101','V001'],['V010','V110','V111','V011'],
  ['V000','V010','V011','V001'],['V100','V110','V111','V101']
 ];
 return {id,kind:'mesh',space:'model-3d',unit:'mm',
  data:{points,edges,faces}};
}
const original=box('Original',0,2),front=box('Occluder',4,6);
test('confirmed multiple meshes yield projected overlap events with real signed H depths',()=>{
 const r=run({geometry:[original,front],revision:181});
 assert.equal(r.status,'scoped-face-probes-only');
 const a=r.edgeOverlapAudit;
 assert.equal(a.status,'pairwise-depth-events-only');
 assert.equal(a.pairCount,276*3);
 assert.equal(a.completeContourVerified,false);
 assert.ok(a.events.length>0);
 const overlaps=a.events.filter(e=>e.view==='H'&&
  e.relation==='collinear-overlap'&&
  e.firstSourceGeometryId==='Original'&&
  e.secondSourceGeometryId==='Occluder');
 assert.ok(overlaps.length>0,'same-paper edges from 2 solids must be associated');
 assert.ok(overlaps.some(e=>e.ranges.some(q=>q.front==='second')),
  'depth +Z identifies the nearer solid for the original/occluder pair');
 assert.ok(overlaps.every(e=>!e.completeOcclusionVerified&&
  !e.officialLineStyleVerified));
 assert.equal(r.projectionOverlapResolved,false);
 assert.equal(r.v5Ready,false);
 assert.equal(Object.isFrozen(a.events),true);
 assert.equal(Object.isFrozen(a.events[0]),true);
});
test('pairs with depth ties or edge intersections do not authorize complete projected-line styles',()=>{
 const r=run({geometry:[box('Source',0,2),box('Other',0,2)],revision:191});
 const a=r.edgeOverlapAudit;
 assert.equal(a.status,'pairwise-depth-events-only');
 assert.ok(a.events.some(x=>x.relation==='collinear-overlap'&&
  x.ranges.some(z=>z.front==='undetermined')));
 assert.ok(a.events.every(x=>x.completeOcclusionVerified===false&&
  x.officialLineStyleVerified===false));
 assert.equal(r.completeContourVerified,false);
});
test('real existing composition session consumes line-overlap evidence but cannot produce V5',()=>{
 const session=createUnifiedProjectSession();
 try{
  const geometry=[original,front];
  session.loadInputs({
   task:'composition',projectId:'OverlapProject',revision:193,
   source:{imageId:'HumanReviewedSource'},totalRelationCount:0,relations:[],
   objects:geometry.map(x=>({id:x.id,kind:'solid'})),
   conditions:geometry.map(x=>({id:'Condition'+x.id,objectId:x.id,
    sourceCandidateId:null,confirmed:true,value:{type:'manual-geometry',
     imageId:'HumanReviewedSource',unit:'mm',geometry:x}}))
  });
  const result=session.solve();
  assert.equal(result.sceneDepthEvidence.edgeOverlapAudit.status,'pairwise-depth-events-only');
  assert.equal(result.sceneDepthEvidence.edgeOverlapAudit.pairCount,828);
  assert.equal(result.verified,false);
  assert.equal(result.plan,null);
  assert.equal(result.clock,null);
  session.invalidate();
  assert.equal(session.readSnapshot(),null);
 }finally{session.dispose();}
});
test('nonconvex or 2D inputs never get pairwise 3D depth evidence',()=>{
 const bad=box('Bad',0,2);bad.data.faces.pop();
 const rejected=run({geometry:[original,bad],revision:200});
 assert.equal(rejected.status,'not-covered');
 assert.equal(rejected.edgeOverlapAudit.status,'not-covered');
 assert.equal(rejected.edgeOverlapAudit.events.length,0);
 const planar={id:'P',kind:'point',space:'drawing-2d',unit:'mm',data:{x:1,y:1}};
 const rejected2=run({geometry:[original,planar],revision:200});
 assert.equal(rejected2.edgeOverlapAudit.status,'not-covered');
 assert.equal(rejected2.projectionOverlapResolved,false);
});
