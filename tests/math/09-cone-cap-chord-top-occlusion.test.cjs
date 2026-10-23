'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {coneCapChordTopOcclusion:run}=require('../../workbench/cone-cap-chord-top-occlusion.cjs');
const cone={baseCenter:{x:0,y:0,z:0},radiusMm:5,heightMm:10,modelUnit:'mm'};
const sheetTransform={origin:{x:340,y:240},scale:6};
const plane=z=>({point:{x:0,y:0,z},normal:{x:1,y:0,z:3},modelUnit:'mm'});
test('strict clipped chord interior hidden from +Z but V/W unresolved',()=>{
 const r=run(cone,plane(1),{kind:'clipped-ellipse',sourceConfirmed:true,revision:99,sheetTransform});
 assert.equal(r.status,'verified-boundary-composition');
 assert.equal(r.capChordTopOcclusionVerified,true);
 assert.equal(r.capChordTopInteriorVisibility,'occluded');
 assert.equal(r.views.H.at(-1).visibility,'occluded-interior');
 assert.equal(r.views.H.at(-1).endpointsVisibility,'undetermined');
 assert.equal(r.views.V.at(-1).visibility,'undetermined');
 assert.equal(r.views.W.at(-1).visibility,'undetermined');
 assert.equal(r.completeSolidVisibilityVerified,false);
});
test('full ellipse never invents a cap chord',()=>{
 const r=run(cone,plane(6),{kind:'full-ellipse',sourceConfirmed:true,sheetTransform});
 assert.equal(r.capChordTopInteriorVisibility,'not-applicable');
 assert.equal(r.capChordTopOcclusionVerified,false);
});
test('unconfirmed source remains not verified',()=>{
 assert.equal(run(cone,plane(1),{kind:'clipped-ellipse',sourceConfirmed:false,sheetTransform}).status,'not-verified');
});
