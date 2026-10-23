'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {coneSectionVisibilityEvidence:run}=require('../../workbench/cone-section-visibility-evidence.cjs');
const cone={baseCenter:{x:0,y:0,z:0},radiusMm:5,heightMm:10,modelUnit:'mm'};
const plane={point:{x:0,y:0,z:6},normal:{x:0,y:0,z:1},modelUnit:'mm'};
const sheetTransform={origin:{x:340,y:240},scale:6};
const output=run(cone,plane,{sourceConfirmed:true,revision:18,sheetTransform,samples:64});
test('W observer +X sees front and occludes back lateral cone points',()=>{
 assert.equal(output.status,'lateral-sample-evidence');
 assert.equal(output.views.W[0].visibility,'visible');
 assert.equal(output.views.W[32].visibility,'occluded');
 assert.ok(output.views.W[32].lateralRayIntersectionMm>0);
});
test('V observer -Y sees near side, far side is occluded',()=>{
 assert.equal(output.views.V[16].visibility,'occluded');
 assert.equal(output.views.V[48].visibility,'visible');
});
test('silhouette grazing points remain undetermined instead of fabricated visible',()=>{
 assert.equal(output.views.W[16].visibility,'undetermined');
 assert.equal(output.views.W[48].visibility,'undetermined');
 assert.equal(output.views.V[0].visibility,'undetermined');
 assert.equal(output.views.V[32].visibility,'undetermined');
});
test('H observer +Z does not invent base-cap occlusion',()=>{
 assert.equal(output.views.H[0].visibility,'visible');
 assert.equal(output.capOcclusionVerified,false);
 assert.equal(output.continuousCurveVisibilityVerified,false);
});
