'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {certifyWholeProjectedExteriorCoverage}=require(
 '../../workbench/m5-c1-reviewed-convex-physical-edge-strokes.cjs');
const source={fromModelMm:{u:0,v:0},toModelMm:{u:10,v:0}};
const line=(a,b,vertical=0)=>({
 projectedFromModelMm:{u:a,v:vertical},
 projectedToModelMm:{u:b,v:vertical},
 signedOfficialLineStyle:'gb-t-4457.4-continuous-wide-visible-outline',
 v5ActionAuthorized:true
});
test('full continuous signed silhouette can mask an original source span',()=>{
 assert.equal(certifyWholeProjectedExteriorCoverage({...source,
  certifiedContours:[line(0,5),line(5,10)]}),true);
 assert.equal(certifyWholeProjectedExteriorCoverage({...source,
  certifiedContours:[line(10,0)]}),true);
});
test('positive partial collinear overlap never masks missing part',()=>{
 assert.equal(certifyWholeProjectedExteriorCoverage({...source,
  certifiedContours:[line(3,7)]}),false);
 assert.equal(certifyWholeProjectedExteriorCoverage({...source,
  certifiedContours:[line(0,3),line(7,10)]}),false);
});
test('one represented-binary64 positive gap never closes by tolerance',()=>{
 const tiny=Number.EPSILON;
 assert.equal(certifyWholeProjectedExteriorCoverage({
  fromModelMm:{u:0,v:0},toModelMm:{u:1,v:0},
  certifiedContours:[line(0,0.5),line(0.5+tiny,1)]
 }),false);
});
test('parallel distinct paper source is not the same physical contour',()=>{
 assert.equal(certifyWholeProjectedExteriorCoverage({...source,
  certifiedContours:[line(0,10,0.00001)]}),false);
 assert.equal(certifyWholeProjectedExteriorCoverage({...source,
  certifiedContours:[{...line(0,10),v5ActionAuthorized:false}]}),false);
});

test('even sub-nanometre parallel paper displacement cannot mask a different physical edge',()=>{
 assert.equal(certifyWholeProjectedExteriorCoverage({...source,
  certifiedContours:[line(0,10,1e-10)]}),false);
 const diagonal={fromModelMm:{u:0,v:0},toModelMm:{u:10,v:10}};
 const shifted={projectedFromModelMm:{u:0,v:1e-12},
  projectedToModelMm:{u:10,v:10+1e-12},
  signedOfficialLineStyle:'gb-t-4457.4-continuous-wide-visible-outline',
  v5ActionAuthorized:true};
 assert.equal(certifyWholeProjectedExteriorCoverage({...diagonal,
  certifiedContours:[shifted]}),false);
});
test('large-offset one-ULP positive paper gap survives signed silhouette union',()=>{
 const bits=new DataView(new ArrayBuffer(8));
 bits.setFloat64(0,65538,false);
 bits.setBigUint64(0,bits.getBigUint64(0,false)+1n,false);
 const after=bits.getFloat64(0,false);
 assert(after>65538);
 assert.equal(certifyWholeProjectedExteriorCoverage({
  fromModelMm:{u:65536,v:0},toModelMm:{u:65540,v:0},
  certifiedContours:[line(65536,65538),line(after,65540)]
 }),false);
});
test('exactly contiguous signed vertical and diagonal contours still mask complete sources',()=>{
 const make=(u0,v0,u1,v1)=>({
  projectedFromModelMm:{u:u0,v:v0},projectedToModelMm:{u:u1,v:v1},
  signedOfficialLineStyle:'gb-t-4457.4-continuous-wide-visible-outline',
  v5ActionAuthorized:true
 });
 assert.equal(certifyWholeProjectedExteriorCoverage({
  fromModelMm:{u:2,v:10},toModelMm:{u:2,v:0},
  certifiedContours:[make(2,0,2,5),make(2,5,2,10)]
 }),true);
 assert.equal(certifyWholeProjectedExteriorCoverage({
  fromModelMm:{u:10,v:10},toModelMm:{u:0,v:0},
  certifiedContours:[make(0,0,5,5),make(5,5,10,10)]
 }),true);
});
