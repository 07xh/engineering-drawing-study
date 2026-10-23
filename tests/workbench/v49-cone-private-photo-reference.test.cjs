'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {createLocalPhotoReference,MAX_BYTES,MAX_PIXELS}=
 require('../../recognition/local-photo-reference.cjs');
function browser(){
 const revoked=[],created=[];let serial=0;
 const urls={
  createObjectURL(f){created.push(f);return 'blob:test-'+(++serial);},
  revokeObjectURL(u){revoked.push(u);}
 };
 return {urls,revoked,created};
}
const photo=(type='image/jpeg',size=100)=>({type,size,name:'PRIVATE_BOOK_ANSWER_007.jpg'});
test('08 local source URL is short-lived, data-free, never certifies an original blind answer',()=>{
 const b=browser(),session=createLocalPhotoReference();
 const first=session.attach(photo(),b.urls);
 assert.equal(first.epoch,1); // attach invalidates the previous source epoch
 assert.equal(first.url,'blob:test-1');
 let state=session.snapshot();
 assert.equal(state.ready,false);
 assert.equal(state.sourceAttached,true);
 assert.equal(state.answerIsolationVerified,false);
 assert.equal(state.blindExerciseAccepted,false);
 assert.equal(state.solvedOriginalExercise,false);
 assert.equal(state.conditionRecognition,'not-run');
 assert.equal(state.imageBytesRetained,false);
 assert.equal(state.storedToNetwork,false);
 assert.equal(state.mathSource,'manual-confirmed-fields-only');
 assert.equal(JSON.stringify(state).includes('PRIVATE_BOOK_ANSWER'),false);
 assert.equal(JSON.stringify(state).includes('blob:'),false);
 assert.equal(session.confirmImage(first.epoch,1920,1080),true);
 state=session.snapshot();assert.equal(state.ready,true);
 assert.deepEqual(state.dimensions,{width:1920,height:1080});
 const next=session.attach(photo('image/png'),b.urls);
 assert.deepEqual(b.revoked,['blob:test-1']);
 assert.equal(session.confirmImage(first.epoch,100,100),false);
 assert.equal(session.rejectImage(first.epoch),false);
 assert.equal(session.confirmImage(next.epoch,128,128),true);
 session.clear();
 assert.deepEqual(b.revoked,['blob:test-1','blob:test-2']);
 assert.equal(session.snapshot().ready,false);
 assert.equal(session.snapshot().dimensions,null);
});
test('09 invalid replacement destroys OLD image, even if the replacement cannot be used',()=>{
 const s=createLocalPhotoReference(),b=browser();
 s.attach(photo(),b.urls);
 for(const invalid of [
  photo('image/svg+xml'),photo('text/html'),photo('image/jpeg',0),
  photo('image/jpeg',MAX_BYTES+1),photo('image/png',1.4),null
 ]){
  assert.throws(()=>s.attach(invalid,b.urls),/image|local PNG/);
  assert.equal(s.snapshot().sourceAttached,false);
 }
 assert.deepEqual(b.revoked,['blob:test-1']);
});
test('09 unsafe decoded geometry is rejected without retaining old blob URLs',()=>{
 const s=createLocalPhotoReference(),b=browser();
 for(const [w,h] of [[0,200],[31,800],[10001,100],
  [10000,10000],[NaN,500],[500,100.25]]){
  const ticket=s.attach(photo(),b.urls);
  assert.throws(()=>s.confirmImage(ticket.epoch,w,h),/dimensions/);
  assert.equal(s.snapshot().ready,false);
  assert.equal(s.snapshot().sourceAttached,false);
 }
 assert.equal(b.revoked.length,6);
 assert.equal(MAX_PIXELS,50000000);
});
test('09 no URL factory, foreign URL or source bytes can enter public reference state',()=>{
 const session=createLocalPhotoReference();
 assert.throws(()=>session.attach(photo(),null),/functions required/);
 assert.throws(()=>session.attach(photo(),{
  createObjectURL:()=> 'https://example.net/my-photo.jpg',
  revokeObjectURL(){}
 }),/local blob URL/);
 assert.equal(session.snapshot().ready,false);
 assert.equal(JSON.stringify(session.snapshot()).includes('.jpg'),false);
});
