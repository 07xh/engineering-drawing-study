'use strict';
// C1 independent property oracle for actual REVIEWED third-view -> shared
// source/scene/M5 proof -> only original V5 point consumer.
// Random inputs are NOT unknown-photo recognition or full line-style proofs.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fc=require('fast-check');
const {compileReviewedSolidVertexV5}=
 require('../../workbench/reviewed-solid-vertex-v5.cjs');

const dimensions=fc.record({
 x:fc.integer({min:-60,max:60}),
 y:fc.integer({min:-60,max:60}),
 z:fc.integer({min:-60,max:60}),
 width:fc.integer({min:5,max:36}),
 depth:fc.integer({min:5,max:36}),
 height:fc.integer({min:5,max:36}),
 unitScale:fc.integer({min:1,max:4})
});
const settings={seed:20261025,numRuns:16};
const views=['V','H','W'];
// Deliberately written independently of the project's projection convention
// so the test can detect an incorrect V/H/W axis exchange.
function expected(p){
 return {V:{u:p.x,v:p.z},H:{u:p.x,v:p.y},W:{u:p.y,v:p.z}};
}
function fixture(t,pair){
 const s=t.unitScale;
 const at={x:t.x*s,y:t.y*s,z:t.z*s};
 const lengths={x:t.width*s,y:t.depth*s,z:t.height*s};
 const points={};
 for(const a of [0,1])for(const b of [0,1])for(const c of [0,1]){
  points['P'+a+b+c]={
   x:at.x+a*lengths.x,y:at.y+b*lengths.y,
   z:at.z+c*lengths.z
  };
 }
 const vertices=Object.entries(points).map(([id,p])=>{
  const m=expected(p);
  return {id,knownViews:Object.fromEntries([...pair].map(view=>
   [view,[m[view].u,m[view].v]]))};
 });
 const edges=[];
 const ids=Object.keys(points);
 for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++){
  const a=ids[i],b=ids[j];
  const hamming=[1,2,3].filter(k=>a[k]!==b[k]).length;
  if(hamming===1)edges.push([a,b]);
 }
 const faces=[
  ['P000','P100','P110','P010'],
  ['P001','P101','P111','P011'],
  ['P000','P100','P101','P001'],
  ['P010','P110','P111','P011'],
  ['P000','P010','P011','P001'],
  ['P100','P110','P111','P101']
 ];
 return {points,input:{geometryId:'PropertyBox',confirmedBy:'user',
  topologyConfirmed:true,revision:25,unit:'mm',vertices,edges,faces}};
}

for(const pair of ['VH','VW','HW']){
 test('fast-check/C1 '+pair+': arbitrary translated scaled cuboids retain true M3 source edges and scoped M5/V5 proofs',()=>{
  fc.assert(fc.property(dimensions,t=>{
   const {points,input}=fixture(t,pair);
   const result=compileReviewedSolidVertexV5({input,
    sheetTransform:{origin:{x:360,y:190},scale:2}});
   const s=result.sceneResult;
   const missing=views.find(view=>!pair.includes(view));
   assert.equal(s.missingView,missing);
   assert.equal(s.geometryVerifiedWithinReviewedTopology,true);
   assert.equal(s.provenEdgeCount,12);
   assert.equal(result.vertexConstructionCount,8);
   assert.equal(result.certifiedPointConstructionReady,true);
   assert.equal(result.singleOriginalV5Player,true);
   assert.equal(result.wholeSolidV5Ready,false);
   assert.equal(result.officialSolidLineStylesVerified,false);
   assert.equal(result.player.canRender(25),true);
   assert.equal(result.scopedEdgePreviews.length,36);
   for(const [id,p] of Object.entries(points)){
    assert.deepEqual(s.geometry.data.points[id],p);
    const m=expected(p);
    for(const view of views)
     assert.deepEqual(s.projections[view].points[id],m[view]);
   }
   for(const e of result.scopedEdgePreviews){
    assert.equal(e.revision,25);
    assert.equal(e.sourceGeometryId,'PropertyBox');
    assert.equal(e.sourcePhysicalCreaseVerified,true);
    assert.equal(e.sourceCoplanarSubdivisionVerified,false);
    assert.equal(e.renderedAsPhysicalSourceCandidate,true);
    assert.equal(e.finalEngineeringLineStyle,'undetermined');
    assert.equal(e.officialV5Stroke,false);
    const from=points[e.sourceVertexIds[0]];
    const to=points[e.sourceVertexIds[1]];
    assert.deepEqual(e.fromModelMm,expected(from)[e.view]);
    assert.deepEqual(e.toModelMm,expected(to)[e.view]);
   }
   result.player.invalidate(26,0);
   assert.equal(result.player.canRender(25),false);
  }),settings);
 });
}

test('fast-check/C1: inconsistent manually paired source coordinates fail closed at every scale',()=>{
 fc.assert(fc.property(dimensions,t=>{
  const {input}=fixture(t,'VH');
  input.vertices[0].knownViews.H[0]+=1;
  assert.throws(()=>compileReviewedSolidVertexV5({input,
   sheetTransform:{origin:{x:360,y:190},scale:2}}),
   /unique 3D vertex/);
 }),{seed:20261025,numRuns:32});
});
