'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {verifiedConvexMeshHalfspaces:verify}=
 require('../../core/geometry/verified-convex-mesh-halfspaces.cjs');
const {evaluateReviewedConvexMeshDepth:evaluate}=
 require('../../workbench/reviewed-convex-scene-depth.cjs');
const {createUnifiedProjectSession}=
 require('../../project/unified-workbench-session.cjs');
const P=(x,y,z)=>({x,y,z});
function box(id,min,max){
 const points={};
 for(let a=0;a<2;a++)for(let b=0;b<2;b++)for(let c=0;c<2;c++)
  points['V'+a+b+c]=P(a?max.x:min.x,b?max.y:min.y,c?max.z:min.z);
 const ids=Object.keys(points),edges=[];
 for(const [i,k] of ids.entries())for(const l of ids.slice(i+1)){
  if([1,2,3].filter(q=>k[q]!==l[q]).length===1)edges.push([k,l]);
 }
 const faces=[
  ['V000','V100','V110','V010'],['V001','V101','V111','V011'],
  ['V000','V100','V101','V001'],['V010','V110','V111','V011'],
  ['V000','V010','V011','V001'],['V100','V110','V111','V101']
 ];
 return {id,kind:'mesh',space:'model-3d',unit:'mm',
  data:{points,edges,faces}};
}
const back=box('Back',P(0,0,0),P(10,10,2));
const front=box('Front',P(0,0,4),P(10,10,6));
const byFace=(r,id,index)=>r.samples.find(s=>
 s.sourceGeometryId===id&&s.sourceFaceId==='face-'+index);
test('all six faces of a reviewed convex cube form a closed manifold and correct outward halfspaces',()=>{
 const result=verify(back);
 assert.equal(result.status,'validated-closed-convex-mesh');
 assert.equal(result.sourceVertexCount,8);
 assert.equal(result.sourceEdgeCount,12);
 assert.equal(result.sourceFaceCount,6);
 assert.equal(result.halfspaces.length,6);
 assert.ok(result.halfspaces.every(f=>f.normal&&Number.isFinite(f.offsetMm)));
 const center=P(5,5,1);
 assert.ok(result.halfspaces.every(f=>
  f.normal.x*center.x+f.normal.y*center.y+
  f.normal.z*center.z<f.offsetMm));
 assert.equal(result.v5Ready,false);
});
test('multiobject depth sorting marks rear H-projection face blocked by forward mesh, preserving V/H/W',()=>{
 const result=evaluate({geometry:[front,back],revision:61});
 assert.equal(result.status,'scoped-face-probes-only');
 assert.deepEqual(result.sourceGeometryIds,['Front','Back']);
 assert.equal(result.sampleCount,12);
 const rearTop=byFace(result,'Back',2);
 const frontTop=byFace(result,'Front',2);
 assert.ok(rearTop&&frontTop);
 assert.equal(rearTop.H.occlusion,'occluded');
 assert.equal(rearTop.H.nearestSolidId,'Front');
 assert.ok(Math.abs(rearTop.H.nearestDepthMm-2)<1e-8);
 assert.equal(frontTop.H.occlusion,'clear');
 assert.equal(frontTop.H.nearestSolidId,null);
 assert.equal(rearTop.H.completeSceneVerified,false);
 assert.equal(rearTop.V.sourceRayScope,'only-supplied-convex-halfspaces');
 assert.equal(result.projectionOverlapResolved,false);
 assert.equal(result.completeContourVerified,false);
 assert.equal(result.v5Ready,false);
 assert.equal(Object.isFrozen(result.samples),true);
 assert.equal(Object.isFrozen(result.samples[0].H.orderedHits),true);
});
test('forged open face, broken edge identity, nonplanar and nonconvex input is not a solid occluder',()=>{
 const shapes=[
  {...back,data:{...back.data,faces:back.data.faces.slice(0,-1)}},
  {...back,data:{...back.data,edges:back.data.edges.slice(0,-1)}},
  {...back,data:{...back.data,points:{...back.data.points,V111:P(9,10,2)}}},
  {...back,data:{...back.data,points:{...back.data.points,V111:P(10,10,1)}}}
 ];
 for(const shape of shapes){
  assert.throws(()=>verify(shape),/closed convex mesh evidence/);
  const result=evaluate({geometry:[shape,front],revision:10});
  assert.equal(result.status,'not-covered');
  assert.equal(result.sampleCount,0);
  assert.equal(result.fullSceneVerified,false);
 }
});
test('unrelated 2D/point Geometry is left usable, not disguised as a complete 3D scene',()=>{
 const point={id:'P1',kind:'point',space:'drawing-2d',unit:'mm',data:{x:1,y:2}};
 for(const geometry of [[back,point],[point]]){
  const r=evaluate({geometry,revision:7});
  assert.equal(r.status,'not-covered');
  assert.deepEqual(r.samples,[]);
  assert.equal(r.v5Ready,false);
 }
 assert.throws(()=>evaluate({geometry:[back],revision:-1}),/revision/);
});
test('REAL existing unified project session consumes two human-confirmed mesh objects, not a second player',()=>{
 const session=createUnifiedProjectSession();
 try{
  const geometry=[back,front];
  const data={task:'composition',projectId:'TwoObjects',revision:87,
   source:{imageId:'ConfirmedOriginal'},totalRelationCount:0,relations:[],
   objects:geometry.map(x=>({id:x.id,kind:'solid'})),
   conditions:geometry.map(x=>({
    id:'Condition'+x.id,objectId:x.id,confirmed:true,
    sourceCandidateId:null,value:{type:'manual-geometry',
     imageId:'ConfirmedOriginal',unit:'mm',geometry:x}
   }))};
  session.loadInputs(data);
  const solved=session.solve();
  assert.equal(solved.status,'confirmed-input-only');
  assert.equal(solved.verified,false);
  assert.equal(solved.sceneDepthEvidence.status,'scoped-face-probes-only');
  assert.equal(solved.sceneDepthEvidence.revision,87);
  assert.equal(byFace(solved.sceneDepthEvidence,'Back',2).H.nearestSolidId,'Front');
  assert.equal(solved.plan,null);
  assert.equal(solved.clock,null);
  session.invalidate();
  assert.equal(session.readSnapshot(),null,'old ray evidence invalidates with source revision');
 }finally{session.dispose();}
});
