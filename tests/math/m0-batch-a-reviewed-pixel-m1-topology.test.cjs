'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {createReviewedPixelFrame,toModelMillimetres}=
 require('../../core/numeric/reviewed-pixel-frame.cjs');
const {analyzeSegmentTopology:topology}=
 require('../../core/geometry/segment-topology2d.cjs');
function setup(mmPerPx=1,modelYDirection='up',originMm={x:0,y:0}){
 const image={id:'photo-AB',revision:13,width:600,height:480};
 const scale={frame:'original-image-px',unit:'mm/original-image-px',
  reviewed:true,sourceId:'ruler-AB',imageId:image.id,
  revision:image.revision,mmPerPx};
 const origin={reviewed:true,modelYDirection,
  pixel:{x:100,y:100},modelMm:originMm};
 const context=createReviewedPixelFrame({image,scale,origin,approved:true});
 const map=(x,y)=>toModelMillimetres(context,{
  imageId:image.id,revision:13,frame:'original-image-px',
  point:{x,y}
 });
 const seg=(a,b)=>({unit:'mm',frame:'model-mm-2d',
  from:map(...a),to:map(...b)});
 return {image,context,map,seg};
}
test('reviewed pixel→model mm→M1 REAL topology stays correct across exact scales and inverted Y',()=>{
 for(const mmPerPx of [1/8,1,8]){
  for(const dir of ['up','down']){
   for(const mmOrigin of [{x:0,y:0},{x:-1024,y:2048}]){
    const {context,map,seg}=setup(mmPerPx,dir,mmOrigin);
    const a=seg([120,120],[160,160]);
    const b=seg([120,160],[160,120]);
    const r=topology({first:a,second:b});
    assert.equal(r.relation,'proper-crossing');
    assert.equal(r.sourceGeometryVerified,false);
    assert.equal(r.exactForBinary64Inputs,true);
    const p=map(120,100),q=map(160,100);
    assert.equal(q.x-p.x,40*mmPerPx);
    assert.equal(p.y,mmOrigin.y);
    assert.equal(context.status,'user-reviewed-provisional');
    assert.equal(context.geometricAccuracyProven,false);
    assert.equal(context.uniformScaleProven,false);
   }
  }
 }
});
test('M1 proves endpoint, collinear overlap and parallel disjoint only AFTER explicit mm transfer',()=>{
 const {seg}=setup(1/4);
 const a=seg([120,100],[160,100]);
 assert.equal(topology({first:a,second:seg([160,100],[180,120])}).relation,'endpoint-touch');
 assert.equal(topology({first:a,second:seg([140,100],[180,100])}).relation,'collinear-overlap');
 assert.equal(topology({first:a,second:seg([120,104],[160,104])}).relation,'disjoint');
});
test('wrong source revision, frame, and wrong photo refuse before downstream M1',()=>{
 const {context,seg,image}=setup();
 for(const props of [
  {revision:14,frame:'original-image-px',imageId:image.id},
  {revision:13,frame:'model-mm-2d',imageId:image.id},
  {revision:13,frame:'original-image-px',imageId:'other-photo'}
 ]){
  assert.throws(()=>toModelMillimetres(context,{...props,point:{x:120,y:120}}));
 }
 const pixel={x:120,y:120};
 assert.throws(()=>topology({first:{frame:'original-image-px',unit:'px',
  from:pixel,to:{x:160,y:160}},second:seg([120,160],[160,120])}),TypeError);
 const p=seg([120,100],[160,100]);p.unit='px';
 assert.throws(()=>topology({first:p,second:seg([140,100],[180,100])}),TypeError);
});
test('provisional reviewed pixels do not convert into verified photo/unique/V5 evidence',()=>{
 const {map,seg}=setup(1/2);
 const point=map(130,160),a=seg([120,120],[160,160]);
 assert.equal(point.calibrationStatus,'user-reviewed-provisional');
 assert.equal(point.geometricAccuracyProven,false);
 assert.equal(topology({first:a,second:seg([120,160],[160,120])}).globallyUnique,null);
 assert.equal(topology({first:a,second:seg([120,160],[160,120])}).sourceGeometryVerified,false);
});
