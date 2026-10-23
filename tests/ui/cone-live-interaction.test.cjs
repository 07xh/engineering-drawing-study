'use strict';
/**
 * 09: real HTML + REAL esbuild production entry + source-confirmed M3 solver
 * in the existing deterministic DOM harness. This is not Android/browser
 * hardware acceptance, OCR, actual textbook image or deployment evidence.
 */
const test=require('node:test');
const assert=require('node:assert/strict');
const {mount}=require('./helpers/dom-app.cjs');
const page='labs/cone-cut-live.html';
const emit=(app,id,type='change')=>
 app.get(id).dispatchEvent(new app.document.defaultView.Event(type,{bubbles:true}));
function confirm(app){
 app.get('coneConfirm').checked=true;
 emit(app,'coneConfirm','change');
}
function solve(app){
 confirm(app);
 app.click('coneSolve');
 return app.get('coneStatus').textContent;
}
function snapshot(app){
 return {
  status:app.get('coneStatus').textContent,
  steps:app.get('coneSteps').children.length,
  controls:app.get('conePlay').disabled,
  proof:app.get('coneProof').textContent,
  viewBox:app.get('coneSvg').getAttribute('viewBox'),
  count:app.get('coneDraw').children.length
 };
}
test('09 real cone page rejects unconfirmed inputs, then both default/unified UI solve the same verified math',()=>{
 const old=mount(page),next=mount(page,{next:true});
 for(const app of [old,next]){
  assert.equal(app.get('conePlay').disabled,true);
  app.click('coneSolve');
  assert.match(app.get('coneStatus').textContent,/请先勾选确认/);
  assert.equal(app.get('coneSteps').children.length,0);
  assert.match(solve(app),/几何模型与单一 V5 动画已就绪/);
  assert.equal(app.get('conePlay').disabled,false);
  assert.equal(app.get('coneSteps').children.length,16);
  assert.match(app.get('coneProof').textContent,/ConstructionStep 12 步/);
  assert.match(app.get('coneProof').textContent,/未确认保留材料侧/);
 }
 assert.deepEqual(snapshot(next),snapshot(old));
});
test('09 real DOM progressive playback, step seek, monochrome and guide toggles do not change math',()=>{
 for(const next of [false,true]){
  const app=mount(page,{next});solve(app);
  app.click('conePlay');
  assert.ok(app.frames.size>0);
  app.advance(450);
  assert.ok(app.get('coneDraw').children.length>0);
  assert.notEqual(app.get('conePercent').textContent,'0%');
  app.click('coneForward');
  assert.ok(app.get('coneStepLabel').textContent.includes('第'));
  const status=app.get('coneStatus').textContent;
  app.get('coneMono').checked=true;emit(app,'coneMono');
  app.get('coneGuides').checked=false;emit(app,'coneGuides');
  assert.equal(app.get('coneStatus').textContent,status);
  app.set('coneSpeed','2');
  app.set('coneSeek','1000','input');
  assert.equal(app.get('conePercent').textContent,'100%');
  assert.ok(app.get('coneDraw').children.length>100);
  assert.equal(app.frames.size,0,'seek must cancel prior animation frame');
  app.click('coneBack');
  assert.equal(app.get('conePlay').disabled,false);
  assert.equal(app.get('coneSteps').children.length,16);
 }
});
test('09 color toggle changes known cone outlines, uncertain V5 curves and 3D preview in both shells',()=>{
 for(const next of [false,true]){
  const app=mount(page,{next});solve(app);
  app.set('coneSeek','1000','input');
  const stroke=sel=>app.get('coneDraw').querySelector(sel)?.getAttribute('stroke');
  const face=()=>app.get('cone3dDraw').querySelector('polygon')?.getAttribute('fill');
  const proof=app.get('coneProof').textContent;
  const status=app.get('coneStatus').textContent;
  const outline='[data-known-outline]';
  const curve='[data-curve-id]';
  const unknown='[data-cone-visibility=undetermined]';
  assert.ok(stroke(curve),'actual displayed continuous cone curve required');
  assert.ok(stroke(unknown),'unverified evidence stays visibly marked');
  assert.equal(app.get('coneMono').checked,false);
  assert.equal(stroke(outline),'#536b89');
  assert.equal(stroke(curve),'#bd762b');
  assert.equal(stroke(unknown),'#bd762b');
  assert.equal(face(),'#e9b453');
  assert.equal(app.get('coneSvg').querySelector('g[aria-hidden=true]').getAttribute('fill'),'#536b89');

  app.get('coneMono').checked=true;emit(app,'coneMono');
  assert.equal(stroke(outline),'#515151');
  assert.equal(stroke(curve),'#777777');
  assert.equal(stroke(unknown),'#777777');
  assert.equal(face(),'#bbbbbb');
  assert.equal(app.get('coneSvg').querySelector('g[aria-hidden=true]').getAttribute('fill'),'#515151');

  app.get('coneMono').checked=false;emit(app,'coneMono');
  assert.equal(stroke(outline),'#536b89');
  assert.equal(stroke(curve),'#bd762b');
  assert.equal(face(),'#e9b453');
  assert.equal(app.get('coneProof').textContent,proof,'color never changes proof scope');
  assert.equal(app.get('coneStatus').textContent,status,'color never reruns mathematics');
  assert.equal(app.get('conePercent').textContent,'100%');
  assert.ok(app.get('coneDraw').querySelector(unknown),'color never upgrades occlusion');
 }
});

test('09 changing any source condition invalidates old player, requires a NEW confirmation and discards shapes',()=>{
 for(const next of [false,true]){
  const app=mount(page,{next});solve(app);
  app.click('conePlay');app.advance(800);
  assert.ok(app.get('coneDraw').children.length>0);
  app.set('coneRadius','5.8','input');
  assert.equal(app.get('coneConfirm').checked,false);
  assert.equal(app.get('conePlay').disabled,true);
  assert.equal(app.get('coneSteps').children.length,0);
  assert.equal(app.get('coneDraw').children.length,0);
  assert.equal(app.frames.size,0);
  app.click('coneSolve');
  assert.match(app.get('coneStatus').textContent,/请先勾选确认/);
  assert.match(solve(app),/已就绪/);
  assert.equal(app.get('coneSteps').children.length,16);
 }
});
test('09 full vs clipped cone outputs are different; invalid apex cases fail closed even after confirm',()=>{
 const app=mount(page,{next:true});
 solve(app);app.set('coneSeek','1000','input');
 const fullCount=app.get('coneDraw').children.length;
 app.set('coneKind','clipped-ellipse','input');
 app.set('conePz','1','input');
 assert.equal(app.get('conePlay').disabled,true);
 assert.equal(app.get('coneConfirm').checked,false);
 assert.match(solve(app),/已就绪/);
 app.set('coneSeek','1000','input');
 assert.ok(app.get('coneDraw').children.length>fullCount,
  'clipped boundary requires a real additional base chord');
 assert.match(app.get('coneProof').textContent,/底面截弦/);
 app.set('conePz','10','input');
 assert.equal(app.get('conePlay').disabled,true);
 confirm(app);app.click('coneSolve');
 assert.equal(app.get('conePlay').disabled,true);
 assert.equal(app.get('coneSteps').children.length,0);
 assert.match(app.get('coneStatus').textContent,/无法生成已验证|被拒绝/);
});
test('09 explicit material halfspace produces limited ray labels without new standard-answer claim',()=>{
 const app=mount(page,{next:true});
 app.set('coneKept','positive','input');
 solve(app);
 assert.match(app.get('coneProof').textContent,/开区间证据/);
 assert.match(app.get('coneProof').textContent,/端点.*尚未验收/);
 assert.match(app.get('coneStatus').textContent,/不是完整国标工程制图答案/);
 app.set('coneSeek','1000','input');
 assert.equal(app.get('coneDraw').querySelector('[data-cone-visibility=hidden]'),null,'open rays cannot certify whole strokes');
 assert.ok(app.get('coneDraw').querySelector('[data-curve-id]'));
 assert.ok(app.get('coneDraw').querySelector('[data-cone-visibility=undetermined]'));
 assert.equal(app.get('coneSvg').getAttribute('viewBox'),'0 0 960 680');
});

test('09 cone playback uses one clock even when RAF timestamp lags behind play click',()=>{
 for(const next of [false,true]){
  const app=mount(page,{next});solve(app);
  app.click('conePlay');
  const pending=[...app.frames.values()][0];
  assert.equal(typeof pending,'function');
  app.frames.clear();
  // This timestamp would throw 'clock moved backwards' with the old V5 loop.
  pending(-1);
  assert.doesNotMatch(app.get('coneStatus').textContent,/动画验证失败/);
  assert.equal(app.get('conePlay').disabled,false);
  app.advance(450);
  assert.notEqual(app.get('conePercent').textContent,'0%');
  assert.match(app.get('coneStatus').textContent,/已就绪/);
 }
});
