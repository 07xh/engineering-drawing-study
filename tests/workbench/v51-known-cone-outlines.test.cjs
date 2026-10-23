'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {knownConeOutlines}=require('../../workbench/v51-known-cone-outlines.cjs');
const {coneSpatialV5Preview}=require('../../workbench/cone-spatial-v5-preview.cjs');
test('known cone silhouettes share first-angle scale and preserve translated model',()=>{
 const cone={baseCenter:{x:11,y:23,z:7},radiusMm:5,heightMm:10,modelUnit:'mm'};
 const plane={point:{x:11,y:23,z:13},normal:{x:1,y:0,z:3},modelUnit:'mm'};
 const p=coneSpatialV5Preview(cone,plane,{sourceConfirmed:true,presentationMode:'split-sheet'});
 const [v,h,w]=knownConeOutlines(cone,p.viewTransforms);
 assert.equal(h.attrs.r,5*p.splitSheet.scale);
 assert.equal(v.attrs.d,'M 205 160 L 145 40 L 85 160 Z');
 assert.equal(w.attrs.d,'M 542 160 L 602 40 L 662 160 Z');
 assert.deepEqual(h.attrs,{cx:145,cy:442,r:60});
});
