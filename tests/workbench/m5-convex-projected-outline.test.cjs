'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {verifyConvexProjectedOutline:verify}=
 require('../../core/verification/convex-projected-outline.cjs');
const {evaluateReviewedConvexMeshDepth:sceneDepth}=
 require('../../workbench/reviewed-convex-scene-depth.cjs');
const {createUnifiedProjectSession}=
 require('../../project/unified-workbench-session.cjs');
const P=(x,y,z)=>({x,y,z});
function box(id,min,max){
 const points={};
 for(let x=0;x<2;x++)for(let y=0;y<2;y++)for(let z=0;z<2;z++)
  points['V'+x+y+z]=P(x?max.x:min.x,y?max.y:min.y,z?max.z:min.z);
 const ids=Object.keys(points),edges=[];
 for(const [i,k] of ids.entries())for(const v of ids.slice(i+1))
  if([1,2,3].filter(q=>k[q]!==v[q]).length===1)edges.push([k,v]);
 const faces=[
  ['V000','V100','V110','V010'],['V001','V101','V111','V011'],
  ['V000','V100','V101','V001'],['V010','V110','V111','V011'],
  ['V000','V010','V011','V001'],['V100','V110','V111','V101']
 ];
 return {id,kind:'mesh',space:'model-3d',unit:'mm',data:{points,edges,faces}};
}
const back=box('Back',P(0,0,0),P(10,12,8));
const front=box('Front',P(1,2,12),P(13,14,18));
const area=points=>Math.abs(points.reduce((sum,p,i)=>{
 const next=points[(i+1)%points.length];
 return sum+p.u*next.v-p.v*next.u;
},0)/2);
test('independent V/H/W convex hull proof returns 4 bounded outer sides from actual 3D box source edges',()=>{
 const r=verify({mesh:back,revision:25});
 assert.equal(r.sourceClosedConvexTopologyVerified,true);
 assert.equal(r.sourceGeometryId,'Back');
 for(const view of ['V','H','W']){
  const out=r[view];
  assert.equal(out.view,view);
  assert.equal(out.convexProjectedBoundaryVerified,true);
  assert.equal(out.boundarySides.length,4);
  assert.equal(out.vertices.length,4);
  assert.ok(area(out.vertices)>1);
  assert.ok(out.boundarySides.every(s=>
   s.projectedBoundaryVerified&&s.sourceEdgeCandidates.length>=1&&
   s.frontmostSourceEdgeVerified===false&&
   s.officialLineStyleVerified===false));
  assert.equal(out.completeMultiBodyContourVerified,false);
 }
 assert.equal(area(r.H.vertices),120);
 assert.equal(area(r.V.vertices),80);
 assert.equal(area(r.W.vertices),96);
 assert.equal(r.multiBodySilhouetteVerified,false);
 assert.equal(r.v5Ready,false);
 assert.equal(Object.isFrozen(r.H.boundarySides),true);
 assert.equal(Object.isFrozen(r.H.boundarySides[0].sourceEdgeCandidates),true);
});
test('generic non-axis-aligned convex box keeps first-angle V/H/W hull proof without hardcoding box orientations',()=>{
 const rotated=box('Rotated',P(0,0,0),P(12,7,5));
 const a=Math.PI/6;for(const p of Object.values(rotated.data.points)){
  const x=p.x,y=p.y;p.x=x*Math.cos(a)-y*Math.sin(a);
  p.y=x*Math.sin(a)+y*Math.cos(a);
 }
 const r=verify({mesh:rotated,revision:27});
 for(const view of ['V','H','W']){
  assert.ok(area(r[view].vertices)>0);
  assert.equal(r[view].convexProjectedBoundaryVerified,true);
  assert.ok(r[view].boundarySides.every(s=>s.sourceEdgeCandidates.length>0));
 }
 assert.equal(r.v5Ready,false);
});
test('two intersecting/overlapping projections are two local convex outlines, never a verified combined silhouette or line style',()=>{
 const r=sceneDepth({geometry:[back,front],revision:31});
 assert.equal(r.projectedOutlines.status,'individual-convex-projected-boundaries');
 assert.equal(r.projectedOutlines.objects.length,2);
 assert.equal(r.projectedOutlines.objects[0].evidence.H.boundarySides.length,4);
 assert.equal(r.projectedOutlines.objects[1].evidence.V.boundarySides.length,4);
 assert.equal(r.projectedOutlines.allIndividualConvexProjectedBoundariesVerified,true);
 assert.equal(r.projectedOutlines.combinedSilhouetteVerified,false);
 assert.equal(r.projectedOutlines.officialLineStylesVerified,false);
 assert.equal(r.completeContourVerified,false);
 assert.equal(r.officialLineStylesVerified,false);
 assert.equal(r.v5Ready,false);
});
test('invalid open meshes and mixed source shapes have no projected outline proof',()=>{
 const invalid=box('Broken',P(0,0,0),P(2,3,5));
 invalid.data.faces.pop();
 assert.throws(()=>verify({mesh:invalid,revision:11}),/closed convex mesh/);
 assert.throws(()=>verify({mesh:back,revision:-1}),/revision/);
 const r=sceneDepth({geometry:[back,invalid],revision:12});
 assert.equal(r.status,'not-covered');
 assert.equal(r.projectedOutlines.status,'not-covered');
 assert.equal(r.projectedOutlines.allIndividualConvexProjectedBoundariesVerified,false);
 assert.deepEqual(r.projectedOutlines.objects,[]);
});
test('existing composition session consumes source convex silhouette evidence but never produces verified V5 or final line styles',()=>{
 const sess=createUnifiedProjectSession(),geometry=[back,front];
 try{
  sess.loadInputs({task:'composition',projectId:'ContourCase',
   revision:43,source:{imageId:'ConfirmedPhoto'},
   totalRelationCount:0,relations:[],
   objects:geometry.map(g=>({id:g.id,kind:'solid'})),
   conditions:geometry.map(g=>({id:'Condition'+g.id,objectId:g.id,
    sourceCandidateId:null,confirmed:true,value:{type:'manual-geometry',
     unit:'mm',imageId:'ConfirmedPhoto',geometry:g}}))});
  const r=sess.solve();
  assert.equal(r.sceneDepthEvidence.projectedOutlines.objects.length,2);
  assert.equal(r.sceneDepthEvidence.projectedOutlines.combinedSilhouetteVerified,false);
  assert.equal(r.verified,false);assert.equal(r.clock,null);assert.equal(r.plan,null);
  sess.invalidate();assert.equal(sess.readSnapshot(),null);
 }finally{sess.dispose();}
});
