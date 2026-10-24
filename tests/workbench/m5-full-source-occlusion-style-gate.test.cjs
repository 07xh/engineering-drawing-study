'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {evaluateFullSourceSegmentOcclusion:decide}=
 require('../../core/verification/convex-occlusion-coverage.cjs');
const {evaluateReviewedConvexMeshDepth:scene}=
 require('../../workbench/reviewed-convex-scene-depth.cjs');
const {createUnifiedProjectSession}=
 require('../../project/unified-workbench-session.cjs');
const P=(x,y,z)=>({x,y,z});
const box=(id,min,max)=>{
 const halfspaces=[];
 for(const axis of ['x','y','z'])for(const [bound,sign] of [['min',-1],['max',1]]){
  const n=P(0,0,0);n[axis]=sign;
  halfspaces.push({id:axis+bound,normal:n,
   offsetMm:sign*(bound==='min'?min[axis]:max[axis])});
 }
 return {id,halfspaces};
};
const source={id:'Edge',from:P(0,5,0),to:P(10,5,0)};
const full=box('Big',P(-1,4,2),P(11,6,4));
const partial=box('Short',P(0,4,2),P(5,6,4));
const overlap=box('Overlap',P(4,4,2),P(11,6,4));
const tangential=box('Touch',P(0,5,2),P(10,6,4));
const status=(solids,src=source)=>decide({source:src,solids,view:'H'});
test('full hidden source-segment witness requires exact [0,1] union, not midpoint/sampled evidence',()=>{
 const one=status([full]);
 assert.equal(one.status,'source-segment-occluded-in-reviewed-solids');
 assert.equal(one.entireSourceSegmentOccluded,true);
 assert.deepEqual(one.occluderIds,['Big']);
 assert.deepEqual(one.coveredParameterRanges[0].sourceParameterRange,[0,1]);
 assert.equal(one.endpointJoinVerified,false);
 assert.equal(one.v5LineStyleSignedOff,false);
 assert.equal(one.officialLineStyleVerified,false);
 assert.equal(one.canonicalIntentVerified,false);
 const incomplete=status([partial]);
 assert.equal(incomplete.status,'full-stroke-unproven');
 assert.equal(incomplete.entireSourceSegmentOccluded,false);
 assert.deepEqual(incomplete.occluderIds,[]);
 const joined=status([partial,overlap]);
 assert.equal(joined.entireSourceSegmentOccluded,false,
  'short first blocker starts exactly at 0 but strict margin leaves endpoint unproved');
 const biggerLeft=box('CoverStart',P(-1,4,2),P(6,6,4));
 const united=status([biggerLeft,overlap]);
 assert.equal(united.entireSourceSegmentOccluded,true);
 assert.deepEqual(united.occluderIds,['CoverStart','Overlap']);
});
test('touch, reversed observer, another view and projection collapse cannot create a hidden style certificate',()=>{
 assert.equal(status([tangential]).entireSourceSegmentOccluded,false);
 assert.equal(decide({source,solids:[full],view:'V'}).entireSourceSegmentOccluded,false);
 const vertical={id:'Vertical',from:P(5,5,0),to:P(5,5,9)};
 const r=status([full],vertical);
 assert.equal(r.status,'collapsed-projection');
 assert.equal(r.entireSourceSegmentOccluded,false);
 assert.equal(r.v5LineStyleSignedOff,false);
});
function mesh(id,min,max){
 const points={};
 for(let x=0;x<2;x++)for(let y=0;y<2;y++)for(let z=0;z<2;z++)
  points['V'+x+y+z]=P(x?max.x:min.x,y?max.y:min.y,z?max.z:min.z);
 const names=Object.keys(points),edges=[];
 for(const [i,a] of names.entries())for(const b of names.slice(i+1))
  if([1,2,3].filter(k=>a[k]!==b[k]).length===1)edges.push([a,b]);
 const faces=[
  ['V000','V100','V110','V010'],['V001','V101','V111','V011'],
  ['V000','V100','V101','V001'],['V010','V110','V111','V011'],
  ['V000','V010','V011','V001'],['V100','V110','V111','V101']
 ];
 return {id,kind:'mesh',space:'model-3d',unit:'mm',
  data:{points,edges,faces}};
}
const rear=mesh('Rear',P(0,0,0),P(10,10,2));
const fore=mesh('Foreground',P(-1,-1,4),P(11,11,6));
test('M5 whole-source-edge witness is rebuilt from ORIGINAL reviewed meshes and first-angle rays',()=>{
 const r=scene({geometry:[rear,fore],revision:14});
 const proof=r.wholeSourceEdgeOcclusion;
 assert.equal(proof.status,'scoped-source-segment-occlusion-only');
 assert.equal(proof.checkedCount,24*3);
 assert.equal(proof.fullLineStyleSignedOff,false);
 const rearH=proof.hiddenSourceEdges.filter(x=>x.view==='H'&&
  x.sourceGeometryId==='Rear'&&x.occluderGeometryIds.includes('Foreground'));
 assert.ok(rearH.length>=4);
 for(const e of rearH){
  assert.equal(e.geometryOfEntireSourceSegmentOccluded,true);
  assert.equal(e.endpointJoinVerified,false);
  assert.equal(e.officialLineStyleVerified,false);
  assert.equal(e.v5LineStyleSignedOff,false);
 }
 assert.equal(r.officialLineStylesVerified,false);
 assert.equal(r.constructionIntentReady,false);
 assert.equal(r.v5Ready,false);
 assert.equal(Object.isFrozen(proof.hiddenSourceEdges[0]),true);
});
test('real unified workbench session owns the scoped proof and invalidates it on source changes',()=>{
 const session=createUnifiedProjectSession();
 try{
  const geometry=[rear,fore];
  session.loadInputs({
   task:'composition',projectId:'StrokeGate',revision:35,
   source:{imageId:'Original'},totalRelationCount:0,relations:[],
   objects:geometry.map(g=>({id:g.id,kind:'solid'})),
   conditions:geometry.map(g=>({id:'C'+g.id,objectId:g.id,
    confirmed:true,sourceCandidateId:null,value:{type:'manual-geometry',
     imageId:'Original',unit:'mm',geometry:g}}))
  });
  const r=session.solve();
  assert.equal(r.sceneDepthEvidence.wholeSourceEdgeOcclusion.status,
   'scoped-source-segment-occlusion-only');
  assert.equal(r.verified,false);
  assert.equal(r.plan,null);
  assert.equal(r.clock,null);
  session.invalidate();
  assert.equal(session.readSnapshot(),null);
 }finally{session.dispose();}
});
test('open/incorrect meshes cannot mint whole-source-stroke proof',()=>{
 const open=mesh('Open',P(0,0,0),P(10,10,2));
 open.data.faces.pop();
 const r=scene({geometry:[rear,open],revision:40});
 assert.equal(r.status,'not-covered');
 assert.equal(r.wholeSourceEdgeOcclusion.status,'not-covered');
 assert.deepEqual(r.wholeSourceEdgeOcclusion.hiddenSourceEdges,[]);
 assert.throws(()=>decide({source,solids:[full],view:'3D'}));
 assert.throws(()=>decide({source,solids:[],view:'H'}));
});
