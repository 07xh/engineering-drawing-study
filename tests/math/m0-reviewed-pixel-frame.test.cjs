'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {createReviewedPixelFrame,toModelMillimetres}=require('../../core/numeric/reviewed-pixel-frame.cjs');
const image={id:'local-photo-123',revision:7,width:1000,height:800};
const scale={frame:'original-image-px',unit:'mm/original-image-px',
 reviewed:true,imageId:image.id,revision:image.revision,sourceId:'ruler-1',mmPerPx:0.5};
const origin={pixel:{x:100,y:200},modelMm:{x:10,y:20},
 modelYDirection:'up',reviewed:true};
const create=(v={})=>createReviewedPixelFrame({image,scale,origin,approved:true,...v});
const convert=(frame,point={x:120,y:190},v={})=>toModelMillimetres(frame,
 {frame:'original-image-px',imageId:image.id,revision:image.revision,point,...v});

test('reviewed original-image pixels convert to model millimetres with explicit Y-up',()=>{
 const c=create();
 assert.deepEqual(convert(c),{x:20,y:25,unit:'mm',frame:'model-mm-2d',
  sourceImageId:image.id,sourceRevision:7,
  calibrationStatus:'user-reviewed-provisional',geometricAccuracyProven:false});
 assert.equal(c.uniformScaleProven,false);
 assert.equal(c.perspectiveCorrectionPerformed,false);
 assert.equal(c.geometricAccuracyProven,false);
 assert.ok(Object.isFrozen(c));
});
test('explicit Y-down produces opposite model Y; translation offsets have mm units',()=>{
 const c=create({origin:{...origin,modelYDirection:'down'}});
 assert.equal(convert(c).y,15);
 assert.equal(convert(c).x,20);
 assert.deepEqual(convert(c,{x:100,y:200}).x,10);
});
test('wrong image, stale revision, or unlabeled coordinates fail closed',()=>{
 const c=create();
 assert.throws(()=>convert(c,undefined,{revision:8}),/stale/);
 assert.throws(()=>convert(c,undefined,{imageId:'other-photo'}),/stale/);
 assert.throws(()=>convert(c,undefined,{frame:'model-mm-2d'}),/labeled/);
 assert.throws(()=>toModelMillimetres(c,{point:{x:120,y:190}}),/stale/);
 assert.throws(()=>toModelMillimetres({...c},{frame:'original-image-px',
  imageId:image.id,revision:7,point:{x:120,y:190}}),/context/);
});
test('explicit reviewed scale and binding are mandatory',()=>{
 assert.throws(()=>create({approved:false}),/approval/);
 assert.throws(()=>create({scale:{...scale,reviewed:false}}),/reviewed/);
 assert.throws(()=>create({scale:{...scale,imageId:'other-photo'}}),/reviewed/);
 assert.throws(()=>create({scale:{...scale,revision:6}}),/reviewed/);
 assert.throws(()=>create({scale:{...scale,frame:'drawing-px'}}),/reviewed/);
 assert.throws(()=>create({scale:{...scale,unit:'px/mm'}}),/reviewed/);
 assert.throws(()=>create({scale:{...scale,sourceId:''}}),/reviewed/);
});
test('zero, negative, nonfinite, out-of-range scale cannot silently enter model mm',()=>{
 for(const s of [0,-1,Infinity,NaN,1e-10,1e7,'0.5'])
  assert.throws(()=>create({scale:{...scale,mmPerPx:s}}),/reviewed/);
});
test('origin must be reviewed, bounded and its axis direction explicit',()=>{
 assert.throws(()=>create({origin:{...origin,reviewed:false}}),/reviewed/);
 assert.throws(()=>create({origin:{...origin,modelYDirection:undefined}}),/reviewed/);
 assert.throws(()=>create({origin:{...origin,pixel:{x:-1,y:1}}}),/outside/);
 assert.throws(()=>create({origin:{...origin,modelMm:{x:NaN,y:0}}}),/finite/);
});
test('image bounds, dimensions and malformed/typed/sparse input rejected',()=>{
 for(const bad of [null,{...image,id:''},{...image,revision:1.5},
  {...image,width:0},{...image,height:10001}])
  assert.throws(()=>create({image:bad}),/original image/);
 const c=create();
 for(const bad of [null,{x:Infinity,y:2},{x:NaN,y:2},
  {x:-1,y:5},{x:1001,y:4},{x:100,y:801},[100,100],{x:'120',y:1}])
  assert.throws(()=>convert(c,bad));
 assert.equal(convert(c,{x:1000,y:800}).x,460);
});
test('precision limitations at large model origins fail closed',()=>{
 const c=create({origin:{...origin,modelMm:{x:1e12,y:20}}});
 assert.throws(()=>convert(c,{x:100.000001,y:200}),/precision/);
 const other=create({origin:{...origin,modelMm:{x:1e308,y:20}}});
 assert.throws(()=>convert(other,{x:1000,y:200}),/precision/);
});
test('boundary at nonfinite model output fails rather than leaking Infinity',()=>{
 const c=create({origin:{...origin,modelMm:{x:Number.MAX_VALUE,y:20}}});
 assert.throws(()=>convert(c,{x:1000,y:200}),/precision/);
});
test('two independent point conversions preserve scale and directional geometry',()=>{
 const c=create();
 const a=convert(c,{x:100,y:200}),b=convert(c,{x:200,y:200});
 assert.equal(b.x-a.x,50);
 assert.equal(a.y,b.y);
 assert.ok(Object.isFrozen(b));
});
