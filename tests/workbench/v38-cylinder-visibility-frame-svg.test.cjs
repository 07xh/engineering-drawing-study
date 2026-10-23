'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createCylinderVisibilitySvgScene:create}=
 require('../../engines/spatial/sections/cylinder-visibility-frame-svg.cjs');
const p=(x,y,z)=>({x,y,z});
const cylinder=(radiusMm=5,heightMm=30,baseCenter=p(0,0,0))=>
 ({radiusMm,heightMm,baseCenter});
const plane=(point,normal)=>({point,normal});
const cut=z=>plane(p(0,0,z),p(1,0,1));
const observers=()=>({V:p(1,0,0),H:p(0,0,1),W:p(-1,0,.2)});
function make({c=cylinder(),pl=cut(3),revision=7,retainedHalfspace='negative',
 dirs=observers(),samplesPerTurn=64}={}){
 return create(c,pl,{revision,retainedHalfspace,observerDirections:dirs,samplesPerTurn});
}
const shot=(s,elapsedMs)=>s.renderFrame({elapsedMs,expectedRevision:s.revision});
const occurrences=(s,text)=>(s.match(new RegExp(text,'g'))||[]).length;
test('04 math-verified scene synthesizes complete fixed-size first-angle SVG without user markup',()=>{
 const s=make(),f=shot(s,s.totalMs);
 assert.equal(s.status,'ready');
 assert.equal(s.productionUiIntegrated,false);
 assert.equal(f.done,true);
 assert.equal(f.revision,7);
 assert.equal(f.completeEngineeringDrawingVerified,false);
 assert.equal(f.firstAngleObserverConventionsSignedOff,false);
 assert.equal(f.globallyUnique,null);
 assert.match(f.svg,/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
 assert.match(f.svg,/viewBox="0 0 960 680"/);
 assert.match(f.svg,/<g id="source-cylinder">/);
 assert.match(f.svg,/<g id="construction-guides">/);
 assert.match(f.svg,/<g id="verified-section-strokes">/);
 assert.ok(f.rendered.given>=9);
 assert.ok(f.rendered.guide>0);
 assert.ok(f.rendered.visible>0);
 assert.ok(f.rendered.hidden>0);
 assert.ok(f.completedActionCount>0);
});
test('04 time zero reveals given shapes only, never leaks future construction or answers',()=>{
 const s=make(),zero=shot(s,0),end=shot(s,s.totalMs);
 assert.equal(zero.done,false);
 assert.equal(zero.completedActionCount,0);
 assert.equal(zero.rendered.guide,0);
 assert.equal(zero.rendered.visible,0);
 assert.equal(zero.rendered.hidden,0);
 assert.equal(zero.rendered.undetermined,0);
 assert.equal(zero.rendered.given,end.rendered.given);
 assert.match(zero.svg,/<circle[^>]+data-layer="given"/);
 assert.doesNotMatch(zero.svg,/data-visibility="hidden"|data-visibility="visible"/);
 assert.notEqual(zero.svg,end.svg);
});
test('04 exact hidden dashes and visible solid strokes coexist at finished frame',()=>{
 const s=make(),f=shot(s,s.totalMs);
 assert.match(f.svg,/stroke-dasharray="6 4" data-visibility="hidden"/);
 assert.match(f.svg,/stroke-dasharray="none" data-visibility="visible"/);
 assert.equal(occurrences(f.svg,'data-visibility="hidden"'),f.rendered.hidden);
 assert.equal(occurrences(f.svg,'data-visibility="visible"'),f.rendered.visible);
 assert.match(f.svg,/data-source="side-[A-Za-z0-9_-]+"/);
 assert.match(f.svg,/<line[^>]+stroke="#424242"/);
});
test('04 partial frame uses same V5 times and progressively traces a result stroke',()=>{
 const s=make(),final=shot(s,s.totalMs);
 const frames=Array.from({length:31},(_,i)=>shot(s,s.totalMs*i/30));
 for(let i=1;i<frames.length;i++){
  assert.ok(frames[i].completedActionCount>=frames[i-1].completedActionCount);
  assert.ok(frames[i].rendered.guide>=frames[i-1].rendered.guide);
  assert.ok(frames[i].rendered.visible+frames[i].rendered.hidden+
    frames[i].rendered.undetermined>=
    frames[i-1].rendered.visible+frames[i-1].rendered.hidden+
    frames[i-1].rendered.undetermined);
 }
 assert.equal(frames.at(-1).svg,final.svg);
 assert.ok(frames.some(f=>f.activeActionId!==null));
 assert.ok(frames.some(f=>f.rendered.guide>0&&!f.done));
 assert.ok(frames.some(f=>f.rendered.hidden>0&&!f.done));
});
test('04 when all rays face removed space there are only verified solid result strokes',()=>{
 const s=make({dirs:{V:p(1,0,0),H:p(0,0,1),W:p(1,0,.2)}});
 assert.equal(s.status,'ready');
 assert.equal(s.visibilityLineStylesFullyVerified,true);
 const frame=shot(s,s.totalMs);
 assert.equal(frame.rendered.hidden,0);
 assert.equal(frame.rendered.undetermined,0);
 assert.ok(frame.rendered.visible>0);
 assert.doesNotMatch(frame.svg,/data-visibility="hidden"|data-visibility="undetermined"/);
});
test('04 no silent invented line type: ray parallel to cut plane remains marked uncertain',()=>{
 const s=make({dirs:{V:p(1,0,-1),H:p(0,0,1),W:p(-1,0,.2)}});
 assert.equal(s.status,'ready');
 assert.equal(s.visibilityLineStylesFullyVerified,false);
 const f=shot(s,s.totalMs);
 assert.ok(f.rendered.undetermined>0);
 assert.match(f.svg,/stroke-dasharray="1.5 5" data-visibility="undetermined"/);
 assert.doesNotMatch(f.svg,/<script|<foreignObject|<image\b/i);
});
test('04 full frame requires current revision; model edits without bumping version also invalidate',()=>{
 const model=cylinder(),source=cut(3),dirs=observers();
 const s=create(model,source,{revision:7,retainedHalfspace:'negative',observerDirections:dirs});
 assert.throws(()=>s.renderFrame({elapsedMs:0,expectedRevision:6}),/revision/);
 assert.throws(()=>s.renderFrame({elapsedMs:0}),/revision/);
 const start=shot(s,0);
 model.radiusMm=6;
 assert.throws(()=>shot(s,0),/changed/);
 assert.equal(start.revision,7);
 model.radiusMm=5;
 source.point.z=4;
 assert.throws(()=>shot(s,0),/changed/);
 source.point.z=3;
 dirs.W.x=.5;
 assert.throws(()=>shot(s,0),/changed/);
});
test('04 invalid progress and unsafe revision never yield a drawable standard answer',()=>{
 const s=make();
 for(const ms of [-1,NaN,Infinity,s.totalMs+1,'300',null])
  assert.throws(()=>s.renderFrame({elapsedMs:ms,expectedRevision:7}),/elapsedMs/);
 for(const revision of [NaN,-1,'7',null])
  assert.throws(()=>make({revision}),/revision/);
});
test('04 real geometry changes the delivered result SVG; no prebuilt screenshot substitutions',()=>{
 const a=make();
 const b=make({c:cylinder(3,16,p(10,-2,4)),
  pl:plane(p(10,-2,8),p(1,0,1))});
 assert.equal(a.status,'ready');assert.equal(b.status,'ready');
 assert.notEqual(shot(a,a.totalMs).svg,shot(b,b.totalMs).svg);
 assert.notEqual(a.totalMs,0);assert.notEqual(b.totalMs,0);
});
test('04 section top/bottom/full elliptical cases all create genuine complete three-view frames',()=>{
 for(const [c,pl] of [[cylinder(),cut(27)],[cylinder(5,8),cut(4)],
  [cylinder(),cut(15)]]){
  const s=make({c,pl});
  assert.equal(s.status,'ready');
  const f=shot(s,s.totalMs);
  assert.equal(f.done,true);
  assert.ok(f.rendered.given>=9);
  assert.ok(f.rendered.guide>=1);
  assert.ok(f.rendered.visible+f.rendered.hidden+f.rendered.undetermined>2);
  assert.match(f.svg,/<g id="verified-section-strokes">/);
 }
});
test('04 pathological or unsupported cut geometry is blocked before SVG frame generation',()=>{
 for(const pl of [cut(-5),cut(35),plane(p(0,0,0),p(1,0,0))]){
  const s=make({pl});
  assert.equal(s.status,'blocked');
  assert.throws(()=>s.renderFrame({elapsedMs:0,expectedRevision:7}),/no verified/);
 }
});
test('04 high-resolution curve yields bounded deterministic SVG full frames without source mutation',()=>{
 const c=cylinder(),pl=cut(3),dirs=observers();
 const high=create(c,pl,{revision:7,retainedHalfspace:'negative',
  observerDirections:dirs,samplesPerTurn:256});
 assert.equal(high.status,'ready');
 assert.ok(high.stepCount<300);
 const frame=shot(high,high.totalMs);
 assert.ok(frame.svg.length<400000);
 assert.equal(frame.done,true);
 assert.ok(frame.rendered.visible+frame.rendered.hidden>100);
 const repeat=create(structuredClone(c),structuredClone(pl),{
  revision:7,retainedHalfspace:'negative',
  observerDirections:structuredClone(dirs),samplesPerTurn:256});
 assert.equal(frame.svg,shot(repeat,repeat.totalMs).svg);
 assert.deepEqual(c,cylinder());
 assert.deepEqual(pl,cut(3));
 assert.deepEqual(dirs,observers());
});
