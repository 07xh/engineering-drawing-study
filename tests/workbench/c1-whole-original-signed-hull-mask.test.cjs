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
