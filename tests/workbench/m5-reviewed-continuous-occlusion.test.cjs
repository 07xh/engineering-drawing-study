'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {evaluateReviewedConvexMeshDepth:run}=
 require('../../workbench/reviewed-convex-scene-depth.cjs');
const {createUnifiedProjectSession}=
 require('../../project/unified-workbench-session.cjs');
const P=(x,y,z)=>({x,y,z});
function box(id,a,b){
 const points={};
 for(let x=0;x<2;x++)for(let y=0;y<2;y++)for(let z=0;z<2;z++)
  points['V'+x+y+z]=P(x?b.x:a.x,y?b.y:a.y,z?b.z:a.z);
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
const rear=box('Rear',P(0,0,0),P(10,10,2));
const foreground=box('Foreground',P(-1,-1,4),P(11,11,6));
const findSource=(g,sourceEdgeId)=>{
 const labels=sourceEdgeId.split('::')[1].split('|');
 return labels.map(x=>g.data.points[x]);
};
test('continuous H-view occlusion intervals use REAL confirmed mesh boundaries, not sampled midpoints',()=>{
 const r=run({geometry:[rear,foreground],revision:113});
 const audit=r.edgeContinuousOcclusion;
 assert.equal(audit.status,'continuous-open-interval-evidence-only');
 assert.equal(audit.pairCount>0,true);
 assert.equal(audit.completeContourVerified,false);
 assert.equal(audit.officialLineStylesVerified,false);
 assert.equal(r.v5Ready,false);
 const affected=audit.certifiedRanges.filter(x=>x.view==='H'&&
   x.sourceGeometryId==='Rear'&&
   x.occluderGeometryId==='Foreground');
 assert.ok(affected.length>=4,'H-view enlarged foreground blocks multiple entire rear edges');
 for(const e of affected){
  assert.equal(e.sourceEndpointsVerified,false);
  assert.equal(e.fullLineStyleVerified,false);
  assert.equal(e.completeOcclusionVerified,false);
  const [a,b]=e.openSourceParameterRange;
  assert.ok(a>=0&&b<=1&&a<b);
  const [from,to]=findSource(rear,e.sourceEdgeId);
  // Independent forward-ray geometry oracle. Sample INSIDE the analytically
  // proven continuous open interval, not as a test substitute for proof.
  for(const s of [0.1,0.5,0.9]){
   const t=a+(b-a)*s;
   const p=P(from.x+(to.x-from.x)*t,
     from.y+(to.y-from.y)*t,from.z+(to.z-from.z)*t);
   const atDepth=P(p.x,p.y,p.z+4);
   assert.ok(atDepth.x> -1&&atDepth.x<11);
   assert.ok(atDepth.y> -1&&atDepth.y<11);
   assert.ok(atDepth.z>4&&atDepth.z<6);
  }
 }
 assert.equal(Object.isFrozen(audit.certifiedRanges),true);
 assert.equal(Object.isFrozen(audit.certifiedRanges[0]),true);
});
test('source 3D line that projects to a point never certifies V5 hidden stroke',()=>{
 const r=run({geometry:[rear,foreground],revision:114});
 assert.ok(r.edgeContinuousOcclusion.uncertainPairs.some(x=>
  x.reason==='projected-source-edge-collapses-to-point'&&x.view==='H'));
 assert.equal(r.edgeContinuousOcclusion.officialLineStylesVerified,false);
});
test('invalid open mesh or unreviewed 2D Geometry never gains continuous occlusion',()=>{
 const opened=box('Open',P(0,0,0),P(10,10,2));
 opened.data.faces.pop();
 const r=run({geometry:[rear,opened],revision:114});
 assert.equal(r.status,'not-covered');
 assert.equal(r.edgeContinuousOcclusion.status,'not-covered');
 assert.deepEqual(r.edgeContinuousOcclusion.certifiedRanges,[]);
 const xy={id:'Given2D',kind:'point',space:'drawing-2d',unit:'mm',data:{x:1,y:2}};
 const mixed=run({geometry:[rear,xy],revision:114});
 assert.equal(mixed.edgeContinuousOcclusion.status,'not-covered');
});
test('REAL reviewed composition session carries mathematically bounded spans but NO answer/V5 promotion',()=>{
 const session=createUnifiedProjectSession();
 const geometry=[rear,foreground];
 try{
  session.loadInputs({
   task:'composition',projectId:'ContinuousScene',revision:410,
   source:{imageId:'ReviewedPhoto'},totalRelationCount:0,relations:[],
   objects:geometry.map(x=>({id:x.id,kind:'solid'})),
   conditions:geometry.map(x=>({id:'Condition'+x.id,objectId:x.id,
    sourceCandidateId:null,confirmed:true,value:{type:'manual-geometry',
     imageId:'ReviewedPhoto',unit:'mm',geometry:x}}))
  });
  const result=session.solve();
  assert.equal(result.kind,'composition-evidence');
  assert.equal(result.sceneDepthEvidence.revision,410);
  assert.equal(result.sceneDepthEvidence.edgeContinuousOcclusion.status,
   'continuous-open-interval-evidence-only');
  assert.equal(result.verified,false);
  assert.equal(result.plan,null);
  assert.equal(result.clock,null);
  assert.equal(result.sceneDepthEvidence.officialLineStylesVerified,false);
  session.invalidate();
  assert.equal(session.readSnapshot(),null);
 }finally{session.dispose();}
});
