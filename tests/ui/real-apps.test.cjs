'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {mount}=require('./helpers/dom-app.cjs');
for(const kind of ['two-segments','segment-circle','two-circles'])test('2D real app: legacy/new equivalence, invalidation and recovery for '+kind,()=>{
 const old=mount('labs/auto-fillet-live.html'),next=mount('labs/auto-fillet-live.html',{next:true});
 for(const app of [old,next])app.set('kind',kind);
 const text=app=>app.get('result').textContent;
 assert.match(next.get('status').textContent,/通过真实数学/);
 assert.equal(text(next),text(old));
 assert.equal(next.get('saveVerifiedSvg').disabled,false);
 const before=text(next);next.document.querySelector('[data-next-panel-button=steps]').click();
 assert.equal(text(next),before);assert.equal(next.frames.size,0);
 for(const app of [old,next]){app.click('play');app.advance(500);app.set('geo-filletRadius','0','input');}
 assert.equal(next.get('saveVerifiedSvg').disabled,true);assert.equal(next.get('saveVerifiedSteps').disabled,true);
 assert.equal(next.get('result').hidden,true);assert.equal(next.get('drawing').children.length,0);assert.equal(next.frames.size,0);
 assert.equal(next.get('status').textContent,old.get('status').textContent);
 for(const app of [old,next])app.set('kind',kind);
 assert.equal(text(next),text(old));assert.equal(next.get('saveVerifiedSvg').disabled,false);
});
test('projection real app: same geometry, invalid data rejection and teaching modes',()=>{
 const old=mount('labs/point-projection-live.html'),next=mount('labs/point-projection-live.html',{next:true});
 assert.equal(next.get('paperSvg').innerHTML,old.get('paperSvg').innerHTML);
 for(const mode of ['full','hint','draw']){
  for(const app of [old,next])app.set('learningMode',mode);
  assert.equal(next.get('paperSvg').innerHTML,old.get('paperSvg').innerHTML);
  assert.equal(next.get('drawControls').hidden,mode!=='draw');
 }
 for(const app of [old,next]){app.set('spaceX','not-a-number','input');}
 assert.equal(next.get('solveStatus').textContent,old.get('solveStatus').textContent);
 assert.equal(next.get('paperSvg').innerHTML,old.get('paperSvg').innerHTML);
});
test('fillet real app: same candidates, mode boundaries and failed-input rendering',()=>{
 const old=mount('labs/circle-fillet-live.html'),next=mount('labs/circle-fillet-live.html',{next:true});
 for(const mode of ['circles','segments','segment-circle']){
  for(const app of [old,next])app.set('modeSelect',mode);
  assert.equal(next.get('diagram').innerHTML,old.get('diagram').innerHTML);
  assert.equal(next.get('status').textContent,old.get('status').textContent);
 }
 for(const app of [old,next]){app.set('modeSelect','circles');app.set('r1','0','input');}
 assert.equal(next.get('diagram').innerHTML,old.get('diagram').innerHTML);
 assert.equal(next.get('status').textContent,old.get('status').textContent);
});
