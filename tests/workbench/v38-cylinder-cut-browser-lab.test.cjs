'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {fields,checkedGeometry}=require('../../labs/cylinder-cut-form.cjs');
const {createCylinderVisibilitySvgScene:create}=
 require('../../engines/spatial/sections/cylinder-visibility-frame-svg.cjs');
const values=()=>({
 radius:5,height:30,px:0,py:0,pz:3,nx:1,ny:1,nz:1,
 kept:'negative',vdir:'-1',hdir:'1',wdir:'-1'
});
test('04 browser form maps all human-reviewed inputs to actual model-mm and orthographic rays',()=>{
 const params=checkedGeometry(values());
 assert.deepEqual(params.cylinder,{baseCenter:{x:0,y:0,z:0},radiusMm:5,heightMm:30});
 assert.deepEqual(params.plane,{
  point:{x:0,y:0,z:3},normal:{x:1,y:1,z:1}
 });
 assert.equal(params.options.retainedHalfspace,'negative');
 assert.deepEqual(params.options.observerDirections,{
  V:{x:0,y:-1,z:0},H:{x:0,y:0,z:1},W:{x:-1,y:0,z:0}
 });
 assert.ok(fields.every(key=>Object.hasOwn(values(),key)));
});
test('04 every positive/negative explicit view direction maps to projection-normal axis only',()=>{
 for(const vdir of ['1','-1'])for(const hdir of ['1','-1'])
  for(const wdir of ['1','-1']){
   const checked=checkedGeometry({...values(),vdir,hdir,wdir});
   assert.equal(checked.options.observerDirections.V.x,0);
   assert.equal(checked.options.observerDirections.V.z,0);
   assert.equal(checked.options.observerDirections.H.x,0);
   assert.equal(checked.options.observerDirections.H.y,0);
   assert.equal(checked.options.observerDirections.W.y,0);
   assert.equal(checked.options.observerDirections.W.z,0);
   assert.equal(checked.options.observerDirections.V.y,Number(vdir));
   assert.equal(checked.options.observerDirections.H.z,Number(hdir));
   assert.equal(checked.options.observerDirections.W.x,Number(wdir));
  }
});
test('04 malformed, unitless or zero-sized editing geometry cannot produce verified scene',()=>{
 for(const [key,v] of [['radius',0],['radius',-1],['height',0],
  ['nx',Infinity],['nz','1'],['pz',1e10],['px',NaN]]){
  assert.throws(()=>checkedGeometry({...values(),[key]:v}),/positive|finite/);
 }
 assert.throws(()=>checkedGeometry({...values(),nx:0,ny:0,nz:0}),/normal/);
 assert.throws(()=>checkedGeometry({...values(),kept:'maybe'}),/retained side/);
 assert.throws(()=>checkedGeometry({...values(),vdir:'front'}),/observer sign/);
 assert.throws(()=>checkedGeometry(null),/fields/);
});
test('04 browser review input results in real dynamically generated proof-backed V5 scene',()=>{
 const model=checkedGeometry(values());
 const s=create(model.cylinder,model.plane,{...model.options,revision:3});
 assert.equal(s.status,'ready');
 assert.equal(s.revision,3);
 assert.equal(s.productionUiIntegrated,false);
 assert.equal(s.stepCount,s.stepDescriptors.length);
 assert.ok(s.stepCount>10);
 assert.ok(s.stepDescriptors.every(x=>x.id&&x.title&&
  Number.isFinite(x.startMs)&&Number.isFinite(x.endMs)));
 assert.ok(s.totalMs>0);
 const first=s.renderFrame({elapsedMs:0,expectedRevision:3});
 const last=s.renderFrame({elapsedMs:s.totalMs,expectedRevision:3});
 assert.ok(last.rendered.visible+last.rendered.hidden+last.rendered.undetermined>0);
 assert.equal(first.rendered.visible+first.rendered.hidden+first.rendered.undetermined,0);
});
test('04 original V5 player supports accurate step seek, quarter/full speed and revision protection',()=>{
 const model=checkedGeometry(values());
 const scene=create(model.cylinder,model.plane,{...model.options,revision:5});
 const p=scene.createPlayer({speed:.25});
 assert.equal(p.canRender(5),true);
 p.play(0);
 assert.equal(p.snapshot(400).elapsedMs,100);
 p.setSpeed(4,500);
 assert.equal(p.snapshot(750).elapsedMs,1125);
 const stepIndex=Math.min(5,scene.stepCount-1);
 const snap=p.seekStep(stepIndex,800);
 assert.equal(snap.activeStepIndex,stepIndex);
 assert.equal(snap.elapsedMs,scene.stepDescriptors[stepIndex].startMs);
 const frame=scene.renderFrame({elapsedMs:snap.elapsedMs,expectedRevision:5});
 assert.equal(frame.activeStepIndex,stepIndex);
 const rewind=p.seekStep(0,900);
 assert.equal(rewind.elapsedMs,0);
 p.invalidate(6,1000);
 assert.equal(p.canRender(5),false);
 assert.throws(()=>scene.renderFrame({elapsedMs:0,expectedRevision:6}),/revision/);
});
test('04 opt-in webpage declares all live controls and local built bundle',()=>{
 const html=fs.readFileSync(path.join(__dirname,'../../labs/cylinder-cut-live.html'),'utf8');
 for(const id of [...fields,'kept','vdir','hdir','wdir','status','board',
  'previous','play','next','seek','speed','guides','mono','save',
  'steps','counts','stepDetail','reset','recompute']){
  assert.match(html,new RegExp('id="'+id+'"'));
 }
 assert.match(html,/<script defer src="cylinder-cut-live-bundle\.js"><\/script>/);
 assert.match(html,/数学|真实/);
 assert.match(html,/尚待|尚未/);
 assert.doesNotMatch(html,/<input[^>]*type="file"/);
});
test('04 existing explicit public build includes lab, but does not expand exposure to source math',()=>{
 const script=fs.readFileSync(path.join(__dirname,'../../scripts/build-static.cjs'),'utf8');
 assert.match(script,/'labs\/cylinder-cut-live\.html'/);
 assert.match(script,/labs\/cylinder-cut-live-entry\.cjs/);
 assert.match(script,/outfile:path\.join\(out,'labs\/cylinder-cut-live-bundle\.js'\)/);
 assert.doesNotMatch(script,/'engines\/spatial\/sections\/cylinder-visibility-frame-svg\.cjs'/);
});
test('04 invalid or blocked geometry renders no animation but remains human-editable',()=>{
 const v={...values(),pz:-6};
 const model=checkedGeometry(v);
 const scene=create(model.cylinder,model.plane,{...model.options,revision:0});
 assert.equal(scene.status,'blocked');
 assert.throws(()=>scene.renderFrame({elapsedMs:0,expectedRevision:0}),/no verified/);
});
test('04 input conversion does not mutate user-supplied field object',()=>{
 const raw=values(),previous=structuredClone(raw);
 const a=checkedGeometry(raw),b=checkedGeometry(structuredClone(raw));
 assert.deepEqual(a,b);
 assert.deepEqual(raw,previous);
});
