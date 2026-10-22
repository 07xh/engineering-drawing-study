'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {createFieldReview}=require('../../recognition/image-field-review.cjs');
const {kinds,defaultValues,defaultChoices}=
 require('../../labs/auto-fillet-form.cjs');
const {createConfirmedFilletSession}=require('../../workbench/v31-fillet-session.cjs');
const fs=require('node:fs');
function confirmed(kind='two-segments'){
 const review=createFieldReview();
 review.setImage(1200,800);review.setKind(kind);
 const values=defaultValues(kind);
 for(const [index,field] of review.required().entries()){
  review.mark(field,[10+index*3,20+index*3,40,28]);
  review.confirm(field,values[field]);
 }
 assert.equal(review.progress().confirmed,review.progress().total);
 assert.equal(review.accept(),true);
 return {review,values};
}
test('no photo, no marks and no final acceptance never reach math',()=>{
 const review=createFieldReview(),values=defaultValues('two-segments');
 assert.equal(review.review(values,defaultChoices('two-segments'),0).input,null);
 assert.equal(review.accept(),false);
 review.setImage(800,600);
 assert.equal(review.accept(),false);
 review.mark('filletRadius',[10,20,25,20]);
 review.confirm('filletRadius',3);
 assert.equal(review.review(values,defaultChoices('two-segments'),0).input,null);
});
test('human-confirmed image rectangles feed actual 01/02/07 math for all three types',()=>{
 for(const kind of Object.keys(kinds)){
  const {review,values}=confirmed(kind);
  const r=review.review(values,defaultChoices(kind),7);
  assert.equal(r.status,'ready-for-math');
  assert.equal(Object.keys(r.fieldSources).length,review.progress().total);
  assert.equal(r.fieldSources.filletRadius.confidence,0); // manually anchored, not model score
  const session=createConfirmedFilletSession(r.input,{now:0});
  const snap=session.snapshot(0);
  assert.equal(snap.status,'ready',kind+': '+snap.reason);
  assert.equal(snap.plan.mathematicallyVerified,true);
  assert.equal(snap.revision,7);
  assert.ok(snap.plan.steps.some(s=>s.actions.some(a=>a.kind==='arc')));
 }
});
test('edited confirmed number invalidates prior acceptance and old replay via session revision',()=>{
 const {review,values}=confirmed();
 const old=review.review(values,defaultChoices('two-segments'),3);
 const session=createConfirmedFilletSession(old.input,{now:0});
 const centerBefore=session.snapshot(0).plan.typedMathEvidence.center;
 values.filletRadius=4;review.edited('filletRadius');
 assert.equal(review.progress().accepted,false);
 assert.equal(review.review(values,defaultChoices('two-segments'),4).input,null);
 assert.equal(review.accept(),false);
 const blocked=session.replace(null,{expectedRevision:3,now:10});
 assert.equal(blocked.mathematicallyVerified,false);
 assert.equal(blocked.playback,null);assert.equal(session.canRender(3),false);
 review.confirm('filletRadius',4);
 assert.equal(review.accept(),true);
 const after=review.review(values,defaultChoices('two-segments'),5);
 assert.equal(after.status,'ready-for-math');
 const fresh=session.replace(after.input,{expectedRevision:4,now:20});
 assert.equal(fresh.status,'ready');
 assert.equal(fresh.revision,5);
 assert.notDeepEqual(fresh.plan.typedMathEvidence.center,centerBefore);
});
test('source region bounds, unsupported or degenerate image sizes are refused',()=>{
 const s=createFieldReview();
 assert.equal(s.setImage(10001,300),false);
 assert.equal(s.progress().hasImage,false);
 s.setImage(800,600);
 for(const bbox of [[780,20,30,10],[-1,2,10,10],[1,1,0,5],
  [NaN,1,5,5],[1,1,5,Infinity]])
  assert.throws(()=>s.mark('a1x',bbox));
 assert.throws(()=>s.mark('unknown',[0,0,10,10]),/field/);
 assert.throws(()=>s.confirm('a1x',0),/mark source/);
});
test('photo replacement or geometry kind change clears every source and acceptance',()=>{
 const {review}=confirmed();
 assert.equal(review.progress().accepted,true);
 review.setImage(600,500);
 assert.equal(review.progress().marked,0);
 assert.equal(review.progress().accepted,false);
 const again=confirmed('two-circles').review;
 again.setKind('two-segments');
 assert.equal(again.progress().marked,0);
 assert.equal(again.progress().confirmed,0);
});
test('UI exposes editable image bounding boxes and blocks solving until reviewed',()=>{
 const html=fs.readFileSync('labs/auto-fillet-live.html','utf8');
 const ui=fs.readFileSync('labs/auto-fillet-live-entry.cjs','utf8');
 const reviewUi=fs.readFileSync('labs/image-field-review-ui.cjs','utf8');
 for(const id of ['sourceReviewEnabled','sourceOverlay','sourceField',
  'confirmSource','acceptSources','sourceStatus'])
  assert.match(html,new RegExp('id="'+id+'"'));
 assert.match(ui,/fieldReview\.reviewedInput/);
 assert.match(ui,/if\(fieldReview\?\.isEnabled\(\)\)/);
 assert.match(ui,/fieldReview\?\.edited\(id\)/);
 assert.match(reviewUi,/pointerdown/);
 assert.match(reviewUi,/pointerup/);
 assert.match(reviewUi,/state\.accept\(\)/);
 assert.doesNotMatch(reviewUi,/\bfetch\s*\(|\bXMLHttpRequest\b|\blocalStorage\b/);
});
