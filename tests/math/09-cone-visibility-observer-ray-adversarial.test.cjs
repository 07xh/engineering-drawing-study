'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {coneSectionVisibilityEvidence:run}=
 require('../../workbench/cone-section-visibility-evidence.cjs');
const cone={baseCenter:{x:0,y:0,z:0},radiusMm:5,heightMm:10,modelUnit:'mm'};
const horizontal={point:{x:0,y:0,z:6},
 normal:{x:0,y:0,z:1},modelUnit:'mm'};
const inclined={point:{x:0,y:0,z:6},
 normal:{x:1,y:0,z:3},modelUnit:'mm'};
const sheetTransform={origin:{x:340,y:240},scale:6};
const runConfirmed=(plane,extra={})=>run(cone,plane,{
 sourceConfirmed:true,revision:18,sheetTransform,samples:64,...extra
});
test('09 original uncut cone W/V ray intersection remains only a scoped diagnostic',()=>{
 const r=runConfirmed(horizontal);
 assert.equal(r.status,'lateral-sample-evidence');
 assert.equal(r.retainedHalfspace,null);
 assert.equal(r.cutSolidOpenRayProofConnected,false);
 assert.equal(r.views.W[0].uncutConeVisibility,'visible');
 assert.equal(r.views.W[32].uncutConeVisibility,'occluded');
 assert.ok(r.views.W[32].lateralRayIntersectionMm>0);
 assert.equal(r.views.V[16].uncutConeVisibility,'occluded');
 assert.equal(r.views.V[48].uncutConeVisibility,'visible');
 assert.ok(['undetermined','visible','occluded'].includes(
  r.views.W[16].uncutConeVisibility));
 assert.equal(r.views.H[0].uncutConeVisibility,'visible');
 for(const view of ['V','H','W']){
  assert.ok(r.views[view].every(e=>e.visibility==='undetermined'));
  assert.ok(r.views[view].every(e=>!e.openNeighborhoodVerified));
 }
 assert.equal(r.capOcclusionVerified,false);
 assert.equal(r.continuousCurveVisibilityVerified,false);
 assert.equal(r.visibilityVerified,false);
});
test('09 counterexample: nearer uncut cone lateral ray hit is REMOVED by real cutting halfspace',()=>{
 const without=runConfirmed(inclined);
 const cut=runConfirmed(inclined,{retainedHalfspace:'negative'});
 assert.equal(without.views.W[32].uncutConeVisibility,'occluded');
 assert.equal(cut.views.W[32].uncutConeVisibility,'occluded',
  'original raw ray test must not be altered to fake a fixed oracle');
 assert.equal(cut.views.W[32].visibility,'visible',
  'toward +X ray enters explicitly removed positive plane halfspace');
 assert.equal(cut.views.W[32].openNeighborhoodVerified,true);
 assert.equal(cut.views.W[0].visibility,'undetermined',
  'sampled ellipse seam endpoints remain uncertified');
 assert.equal(cut.views.H[32].visibility,'visible');
 assert.equal(cut.views.V[32].visibility,'undetermined',
  'V ray tangent to cutting plane remains undecided');
 assert.equal(cut.retainedHalfspace,'negative');
 assert.equal(cut.cutSolidOpenRayProofConnected,true);
 assert.equal(cut.visibilityVerified,false);
 assert.equal(cut.continuousCurveVisibilityVerified,false);
});
test('09 same physical halfspace with reversed plane normal retains cut-solid results',()=>{
 const up=runConfirmed(inclined,{retainedHalfspace:'negative'});
 const flipped=runConfirmed({
  ...inclined,normal:{x:-1,y:0,z:-3}
 },{retainedHalfspace:'positive'});
 for(const v of ['V','H','W'])
  assert.deepEqual(up.views[v].map(q=>q.visibility),
   flipped.views[v].map(q=>q.visibility));
});
test('09 tangent observer cannot borrow uncut front/back result as a cut-solid proof',()=>{
 const r=runConfirmed(horizontal,{retainedHalfspace:'negative'});
 assert.equal(r.views.W[32].uncutConeVisibility,'occluded');
 assert.ok(r.views.W.every(x=>x.visibility==='undetermined'));
 assert.ok(r.views.V.every(x=>x.visibility==='undetermined'));
 assert.ok(r.views.H.some(x=>x.visibility==='visible'));
});
