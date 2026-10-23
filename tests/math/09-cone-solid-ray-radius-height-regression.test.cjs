'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {coneHorizontalSolidRay:ray}=require('../../engines/spatial/sections/cone-horizontal-solid-ray.cjs');
const cone={baseCenter:{x:0,y:0,z:0},radiusMm:5,heightMm:10};
test('finite cone radius decreases toward apex (non-mid-height regression)',()=>{
 for(const [z,r] of [[2,4],[8,1]]){
  assert.equal(ray(cone,{x:0,y:-r,z},'V').status,'visible');
  assert.equal(ray(cone,{x:0,y:r,z},'V').status,'occluded');
  assert.equal(ray(cone,{x:r,y:0,z},'W').status,'visible');
  assert.equal(ray(cone,{x:-r,y:0,z},'W').status,'occluded');
 }
});
test('former inverted-radius assumption is rejected as off-surface',()=>{
 assert.equal(ray(cone,{x:0,y:-1,z:2},'V').status,'undetermined');
 assert.equal(ray(cone,{x:0,y:-4,z:8},'V').status,'undetermined');
});
