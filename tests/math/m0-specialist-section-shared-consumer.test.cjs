'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {classifyConePlane}=require('../../engines/spatial/sections/cone-plane-classifier.cjs');
const {classifyConeSectionVisibility}=require('../../engines/spatial/sections/cone-cut-ray-visibility.cjs');
const {finiteCylinderLateralArcs}=require('../../engines/spatial/sections/finite-cylinder-lateral-arcs.cjs');
const {finiteCylinderSectionBoundary}=require('../../engines/spatial/sections/finite-cylinder-section-boundary.cjs');
const {classifyPrismSectionVisibility}=require('../../engines/spatial/sections/rectangular-prism-cut-visibility.cjs');
const {project}=require('../../core/projection/conventions.js');
const P=(x,y,z)=>({x,y,z});
const cone={baseCenter:P(0,0,0),radiusMm:5,heightMm:10,modelUnit:'mm'};
const conePlane=(z,normal=P(1,0,3))=>
 ({point:P(0,0,z),normal,modelUnit:'mm'});
const cylinder={baseCenter:P(0,0,0),radiusMm:5,heightMm:10};
const cylinderPlane=(z,normal=P(0,0,1))=>({point:P(0,0,z),normal});
test('M0 cone finite-body classification still distinguishes full, clipped, none and unsupported',()=>{
 const full=classifyConePlane(cone,conePlane(6));
 const clipped=classifyConePlane(cone,conePlane(1));
 const missed=classifyConePlane(cone,conePlane(12));
 const vertical=classifyConePlane(cone,conePlane(5,P(1,0,0)));
 assert.deepEqual([full.status,full.kind],['ready','full-ellipse']);
 assert.deepEqual([clipped.status,clipped.kind],['ready','clipped-ellipse']);
 assert.equal(missed.status,'none');assert.equal(missed.separationVerified,true);
 assert.equal(vertical.status,'unsupported-conic');
});
test('M0 cone open-ray visibility preserves analytic proof scope and complete-V5 refusal',()=>{
 const r=classifyConeSectionVisibility(cone,conePlane(6),{
  kind:'full-ellipse',sourceConfirmed:true,retainedHalfspace:'positive',
  observerDirection:P(1,0,0),samples:64});
 assert.equal(r.status,'ready');assert.equal(r.runs.length,3);
 assert.ok(r.counts.visible>0&&r.counts.hidden>0);
 assert.equal(r.visibilityVerified,false);
 assert.equal(r.boundaryEndpointsVerified,false);
 assert.equal(r.v5LineStylesReady,false);
});
test('M0 cylinder arc samples use the one authoritative first-angle projector',()=>{
 const a=finiteCylinderLateralArcs(cylinder,cylinderPlane(5),{samplesPerTurn:32});
 assert.equal(a.status,'complete-lateral');
 assert.equal(a.verified,true);
 assert.equal(a.completeSolidIntersectionVerified,false);
 for(const arc of a.arcs)for(let i=0;i<arc.samples.length;i++)
  assert.deepEqual(arc.projections[i],project(arc.samples[i]));
});
test('M0 finite cylinder 1D perimeter maintains topology and no official V5 certification',()=>{
 const r=finiteCylinderSectionBoundary(cylinder,cylinderPlane(5),{samplesPerTurn:32});
 assert.equal(r.status,'ready');
 assert.equal(r.boundaryVerified,true);
 assert.equal(r.solidSectionPerimeterVerified,true);
 assert.equal(r.visibilityVerified,false);assert.equal(r.v5StepsReady,false);
 assert.equal(r.contourLoops.length,1);
});
test('M0 prism first-angle point arithmetic still supports open-face ray evidence only',()=>{
 const prism={min:P(0,0,0),max:P(10,10,10)};
 const r=classifyPrismSectionVisibility(prism,{
  point:P(0,0,12),normal:P(1,1,1)
 },{retainedHalfspace:'negative',observerDirection:P(0,0,1)});
 assert.equal(r.status,'ready');
 assert.ok(r.edgeRuns.length>0);
 assert.equal(r.visibilityVerified,false);
 assert.equal(r.v5LineStylesReady,false);
});
