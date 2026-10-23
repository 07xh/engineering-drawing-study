'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {prismPlaneSection}=require('../../engines/spatial/sections/rectangular-prism-plane.cjs');
const {pyramidPlaneSection}=require('../../engines/spatial/sections/rectangular-pyramid-plane.cjs');
const {adaptSectionResult}=require('../../engines/spatial/sections/section-result-adapter.cjs');
const p=(x,y,z)=>({x,y,z});
const plane={point:p(0,0,5),normal:p(0,0,1)};
test('real prism math adapts to common section result',()=>{
 const raw=prismPlaneSection({min:p(0,0,0),max:p(10,10,10)},plane);
 const out=adaptSectionResult('rectangular-prism',raw);
 assert.equal(out.verified,true);
 assert.equal(out.status,'unique');
 assert.equal(out.vertices.length,4);
 assert.equal(out.perimeter.length,4);
 assert.equal(out.projectionVerified,false);
 assert.equal(out.constructionStepsReady,false);
});
test('real pyramid math adapts to common section result',()=>{
 const raw=pyramidPlaneSection({base:{minX:0,minY:0,maxX:10,maxY:10,z:0},apex:p(5,5,15)},plane);
 const out=adaptSectionResult('rectangular-pyramid',raw);
 assert.equal(out.verified,true);
 assert.equal(out.vertices.length,4);
 assert.ok(out.vertices.every(v=>Math.abs(v.point.z-5)<1e-7));
 assert.equal(out.visibilityVerified,false);
});
test('real no-intersection cannot be upgraded',()=>{
 const raw=prismPlaneSection({min:p(0,0,0),max:p(10,10,10)},{point:p(0,0,30),normal:p(0,0,1)});
 const out=adaptSectionResult('rectangular-prism',raw);
 assert.equal(out.status,'none');
 assert.equal(out.verified,false);
 assert.deepEqual(out.perimeter,[]);
});
