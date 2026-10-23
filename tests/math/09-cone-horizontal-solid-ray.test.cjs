'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {coneHorizontalSolidRay:ray}=require('../../engines/spatial/sections/cone-horizontal-solid-ray.cjs');
const cone={baseCenter:{x:0,y:0,z:0},radiusMm:5,heightMm:10};
test('V front and rear lateral points distinguished by full solid first-hit disk',()=>{
 assert.equal(ray(cone,{x:0,y:-2.5,z:5},'V').status,'visible');
 assert.equal(ray(cone,{x:0,y:2.5,z:5},'V').status,'occluded');
});
test('W front and rear lateral points distinguished by full solid first-hit disk',()=>{
 assert.equal(ray(cone,{x:2.5,y:0,z:5},'W').status,'visible');
 assert.equal(ray(cone,{x:-2.5,y:0,z:5},'W').status,'occluded');
});
test('tangent silhouette has one coincident first hit',()=>{
 assert.equal(ray(cone,{x:2.5,y:0,z:5},'V').status,'visible');
});
test('base rim, apex and off-surface points fail closed',()=>{
 assert.equal(ray(cone,{x:5,y:0,z:0},'V').status,'undetermined');
 assert.equal(ray(cone,{x:0,y:0,z:10},'W').status,'undetermined');
 assert.equal(ray(cone,{x:0,y:0,z:5},'V').status,'undetermined');
});
