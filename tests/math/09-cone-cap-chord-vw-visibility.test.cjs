'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {coneCapChordVWVisibility:run}=require('../../workbench/cone-cap-chord-vw-visibility.cjs');
const cone={baseCenter:{x:0,y:0,z:0},radiusMm:5,heightMm:10,modelUnit:'mm'};
const sheetTransform={origin:{x:340,y:240},scale:6};
const plane=z=>({point:{x:0,y:0,z},normal:{x:1,y:0,z:3},modelUnit:'mm'});
test('V/W cap chord fail closed until full-solid occlusion convention',()=>{
 const r=run(cone,plane(1),{kind:'clipped-ellipse',sourceConfirmed:true,revision:105,sheetTransform});
 assert.equal(r.status,'verified-boundary-composition');
 assert.equal(r.capChordVWInteriorVisibilityVerified,false);
 assert.equal(r.views.H.at(-1).visibility,'occluded-interior');
 assert.equal(r.views.V.at(-1).visibility,'undetermined');
 assert.equal(r.views.W.at(-1).visibility,'undetermined');
 assert.equal(r.completeSolidVisibilityVerified,false);
});
test('full ellipse has no invented chord',()=>{
 const r=run(cone,plane(6),{kind:'full-ellipse',sourceConfirmed:true,sheetTransform});
 assert.equal(r.capChordHorizontalInteriorVisibility,'not-applicable');
});
test('unconfirmed source fails closed',()=>{
 assert.equal(run(cone,plane(1),{kind:'clipped-ellipse',sourceConfirmed:false,sheetTransform}).status,'not-verified');
});
