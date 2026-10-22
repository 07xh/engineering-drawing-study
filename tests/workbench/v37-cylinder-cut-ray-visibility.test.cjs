'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {classifyCylinderSectionVisibility:solve}=
 require('../../engines/spatial/sections/cylinder-cut-ray-visibility.cjs');
const p=(x,y,z)=>({x,y,z});
const c=(r=5,h=30,baseCenter=p(0,0,0))=>
 ({radiusMm:r,heightMm:h,baseCenter});
const plane=(point,normal)=>({point,normal});
const cut=z=>plane(p(0,0,z),p(1,0,1));
const view=(x,y,z)=>({x,y,z});
const near=(a,b,t=1e-7)=>assert.ok(Math.abs(a-b)<=t,
 String(a)+' != '+String(b));
function run(z,opts){return solve(c(),cut(z),opts);}
test('04 observer facing removed halfspace sees every one-dimensional section interval',()=>{
 const out=run(3,{retainedHalfspace:'negative',observerDirection:view(1,0,0)});
 assert.equal(out.status,'ready');
 assert.equal(out.sourcePerimeterVerified,true);
 assert.equal(out.visibilityVerified,true);
 assert.equal(out.v5StrokeStyleReady,false);
 assert.equal(out.boundaryEndpointVisibilityVerified,false);
 assert.equal(out.counts.hidden,0);
 assert.equal(out.counts.undetermined,0);
 assert.ok(out.counts.visible>=2);
 assert.ok(out.runs.every(r=>r.visibility==='visible'));
});
test('04 the exact same view changes when opposite solid halfspace is retained',()=>{
 const opts={observerDirection:view(1,0,0)};
 const removed=run(3,{...opts,retainedHalfspace:'negative'});
 const retained=run(3,{...opts,retainedHalfspace:'positive'});
 assert.equal(removed.counts.hidden,0);
 assert.ok(retained.counts.hidden>0);
 assert.ok(retained.counts.visible>0);
 assert.equal(retained.counts.undetermined,1); // bottom cap, eye parallel to cap
 assert.equal(retained.visibilityVerified,false);
});
test('04 retained-side oblique observer splits lateral arc at analytic silhouettes',()=>{
 const out=run(3,{retainedHalfspace:'negative',observerDirection:view(-1,0,.25)});
 assert.equal(out.status,'ready');
 const lateral=out.runs.filter(r=>r.kind==='lateral-arc');
 assert.ok(lateral.length>=3);
 assert.ok(lateral.some(r=>r.visibility==='hidden'));
 assert.ok(lateral.some(r=>r.visibility==='visible'));
 for(const run of lateral){
  const q=run.through;
  near(q.x*q.x+q.y*q.y,25);
  near(q.x+q.z,3);
  assert.ok(q.z>=0&&q.z<=30);
  assert.equal(run.endpointVisibilityVerified,false);
  if(run.visibility==='hidden')assert.ok(run.reason.includes('retained-cylinder'));
 }
 const cap=out.runs.find(r=>r.kind==='cap-chord');
 assert.equal(cap.visibility,'hidden');
 assert.equal(cap.reason,'ray-enters-retained-cylinder-from-cap-interior');
});
test('04 a viewpoint below the cut cap makes its chord not occluded by the cylinder',()=>{
 const out=run(3,{retainedHalfspace:'negative',observerDirection:view(-1,0,-.25)});
 const cap=out.runs.find(r=>r.kind==='cap-chord');
 assert.equal(cap.visibility,'visible');
 assert.equal(cap.reason,'ray-leaves-cylinder-away-from-cap');
});
test('04 top-cap chord flips visibility with the observer vertical component',()=>{
 const hidden=run(27,{retainedHalfspace:'positive',observerDirection:view(1,0,-.25)});
 const visible=run(27,{retainedHalfspace:'positive',observerDirection:view(1,0,.25)});
 assert.equal(hidden.status,'ready');assert.equal(visible.status,'ready');
 assert.equal(hidden.runs.find(r=>r.kind==='cap-chord').visibility,'hidden');
 assert.equal(visible.runs.find(r=>r.kind==='cap-chord').visibility,'visible');
});
test('04 exact ray alignment with cut plane is uncertified, never invents line style',()=>{
 const out=run(3,{retainedHalfspace:'negative',observerDirection:view(1,0,-1)});
 assert.equal(out.status,'ready');
 assert.equal(out.counts.hidden,0);
 assert.equal(out.counts.visible,0);
 assert.equal(out.counts.undetermined,out.totalRuns);
 assert.equal(out.visibilityVerified,false);
});
test('04 views along cylinder axis keep open-side cases clear but mark backside tangencies unknown',()=>{
 const exposed=run(15,{retainedHalfspace:'negative',observerDirection:view(0,0,1)});
 assert.equal(exposed.status,'ready');
 assert.equal(exposed.counts.undetermined,0);
 assert.equal(exposed.counts.visible,exposed.totalRuns);
 const backside=run(15,{retainedHalfspace:'negative',observerDirection:view(0,0,-1)});
 assert.equal(backside.status,'ready');
 assert.ok(backside.counts.undetermined>0);
 assert.equal(backside.visibilityVerified,false);
});
test('04 all three explicit observer rays preserve same model-space boundary facts',()=>{
 const directions=[view(0,-1,0),view(0,0,1),view(-1,0,0)];
 const outputs=directions.map(observerDirection=>run(3,{
  retainedHalfspace:'negative',observerDirection
 }));
 assert.ok(outputs.every(r=>r.status==='ready'&&r.modelUnit==='mm'));
 const totals=outputs.map(r=>r.runs.reduce((acc,x)=>acc+(x.kind==='cap-chord'?1:0),0));
 assert.deepEqual(totals,[1,1,1]);
 for(const out of outputs)for(const entry of out.runs){
  assert.deepEqual(entry.projections.through,{
   V:{u:entry.through.x,v:entry.through.z},
   H:{u:entry.through.x,v:entry.through.y},
   W:{u:entry.through.y,v:entry.through.z}
  });
 }
});
test('04 visible/hidden split is determined from real polar tangent roots not display sampling count',()=>{
 const args={retainedHalfspace:'negative',observerDirection:view(-1,0,.3)};
 const coarse=run(3,{...args,samplesPerTurn:16});
 const fine=run(3,{...args,samplesPerTurn:256});
 assert.equal(coarse.status,'ready');assert.equal(fine.status,'ready');
 assert.deepEqual(coarse.counts,fine.counts);
 assert.equal(coarse.totalRuns,fine.totalRuns);
 for(let i=0;i<coarse.runs.length;i++){
  assert.equal(coarse.runs[i].visibility,fine.runs[i].visibility);
  if(coarse.runs[i].kind==='lateral-arc')
   near(coarse.runs[i].angularInterval[0],fine.runs[i].angularInterval[0]);
 }
});
test('04 top+bottom cap cuts keep provenance and split physical contour by observer ray',()=>{
 const out=solve(c(5,8),cut(4),{
  retainedHalfspace:'negative',observerDirection:view(-1,0,.2)
 });
 assert.equal(out.status,'ready');
 assert.equal(out.runs.filter(r=>r.kind==='cap-chord').length,2);
 assert.ok(out.counts.hidden+out.counts.visible+out.counts.undetermined>2);
 assert.ok(out.maxResidualMm<1e-6);
});
test('04 missing removal choice or observer vector fails without falling back to guessed convention',()=>{
 assert.throws(()=>solve(c(),cut(3),{}),/retainedHalfspace/);
 assert.throws(()=>solve(c(),cut(3),{retainedHalfspace:'negative'}),/direction/);
 assert.throws(()=>solve(c(),cut(3),{
  retainedHalfspace:'removed',observerDirection:view(1,0,0)
 }),/retainedHalfspace/);
 assert.throws(()=>solve(c(),cut(3),{
  retainedHalfspace:'positive',observerDirection:view(0,0,0)
 }),/direction/);
});
test('04 invalid mathematical section and unbounded requested sampling never produce a visibility verdict',()=>{
 for(const pl of [plane(p(0,0,0),p(1,0,0)),cut(-5),cut(35),
  plane(p(0,0,-10),p(0,0,1))]){
  const result=solve(c(),pl,{
   retainedHalfspace:'negative',observerDirection:view(-1,0,.2)});
  assert.equal(result.status,'blocked');
  assert.deepEqual(result.runs,[]);
  assert.equal(result.visibilityVerified,false);
 }
 for(const samplesPerTurn of [0,15,17,257,'64']){
  assert.throws(()=>run(3,{
   retainedHalfspace:'negative',observerDirection:view(1,0,0),samplesPerTurn
  }),/samplesPerTurn/);
 }
});
test('04 observer vector norm does not change visibility while all input parameters remain immutable',()=>{
 const original=c(),section=cut(3);
 const first=solve(original,section,{
  retainedHalfspace:'negative',observerDirection:view(-1,0,.2)
 });
 const later=solve(structuredClone(original),structuredClone(section),{
  retainedHalfspace:'negative',observerDirection:view(-10,0,2)
 });
 assert.deepEqual(first,later);
 assert.deepEqual(original,c());
 assert.deepEqual(section,cut(3));
 assert.equal(first.standardViewMappingVerified,false);
});
