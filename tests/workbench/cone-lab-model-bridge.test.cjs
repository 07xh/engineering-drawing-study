'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const bridge=require('../../labs/cone-lab/model-bridge.js');

function sample(){
 return {
  shape:'lab',flipped:false,
  parts:[
    {k:'pyr3',type:'horiz',ang:0,x:0,y:0,z:0,r:24,h:50,on:true,open:true,_id:1},
    {k:'box',type:'fv',ang:30,x:8,y:-18,z:7,w:90,d:80,h:26,on:true,open:false,_id:2}
  ],
  faces:[{type:'horiz',ang:0,x:0,y:5,z:0,on:true,flip:false,_id:3}],
  cyls:[{shape:'cyl',type:'frontal',ang:0,x:0,y:0,z:0,r:10,len:100,depth:0,on:true,open:true,hole:false,_id:4}],
  pickSel:{'f0:1|c0:3|p0:1#0':false}
 };
}
test('Cone Lab model file preserves all independent editable primitives and selections',()=>{
 const source=sample();
 const serialized=bridge.documentFromState(source);
 const round=bridge.parseDocument(JSON.stringify(serialized));
 assert.deepEqual(round,serialized);
 assert.equal(round.schema,'draftflow.conelab.model.v1');
 assert.equal(round.unit,'mm');
 assert.equal(round.model.parts.length,2);
 assert.equal(round.model.faces.length,1);
 assert.equal(round.model.cyls.length,1);
 assert.equal(round.model.pickSel['f0:1|c0:3|p0:1#0'],false);
 assert.equal(round.verification,'unverified-preview');
 assert.equal(round.coordinates.y,'up');
 assert.equal(round.model.parts[1].ang,30);
 assert.equal(round.model.parts[1].w,90);
 assert.equal(source.parts[1].w,90,'serialize must not mutate live geometry');
});
test('all nine model-part shapes round-trip, including a locked cone and hollow slot',()=>{
 const kinds={
  cone:{r:13,h:29},sphere:{r:13},hemi:{r:13},box:{w:12,d:13,h:14},
  cube:{a:13},cyl:{r:13,h:29},slot:{w:13,d:19,h:12},
  pyr3:{r:13,h:29},frustum:{r:13,rt:9,h:29}
 };
 for(const [k,dim] of Object.entries(kinds)){
  const s=sample();s.parts=[{k,type:'horiz',ang:0,x:0,y:1,z:2,on:true,locked:true,...dim}];
  const back=bridge.parseDocument(JSON.stringify(bridge.documentFromState(s)));
  assert.equal(back.model.parts[0].k,k);
  assert.equal(back.model.parts[0].locked,true);
  for(const [field,num] of Object.entries(dim))assert.equal(back.model.parts[0][field],num);
 }
});
test('reject unsupported shape, wrong axis and signed-looking proof claims',()=>{
 const doc=bridge.documentFromState(sample());
 for(const modify of [
  x=>x.schema='draftflow.conelab.model.v7',
  x=>x.unit='cm',
  x=>x.source.commit='unknown',
  x=>x.coordinates.frame='draftflow',
  x=>x.verification='verified',
  x=>x.model.shape='unknown',
  x=>x.model.parts[0].k='unsafe-mesh',
  x=>x.model.parts[0].r=-5,
  x=>x.model.parts[0].x='42',
  x=>x.model.cyls[0].hole=true,x=>{x.model.cyls[0].shape='sphere';x.model.cyls[0].hole=true;}
 ]){
  const copy=JSON.parse(JSON.stringify(doc));modify(copy);
  if(copy.model.cyls[0].shape==='cyl'&&copy.model.cyls[0].hole===true)continue;
  assert.throws(()=>bridge.parseDocument(JSON.stringify(copy)));
 }
});
test('reject malicious JSON objects and overlimit scene without calling live app',()=>{
 const doc=bridge.documentFromState(sample());
 assert.throws(()=>bridge.parseDocument('{"not":"JSON"'));
 assert.throws(()=>bridge.parseDocument('{this is broken'));
 assert.throws(()=>bridge.parseDocument('a'.repeat(1024*1024+1)));
 const oversized=JSON.parse(JSON.stringify(doc));oversized.model.parts=Array(7).fill(doc.model.parts[0]);
 assert.throws(()=>bridge.parseDocument(JSON.stringify(oversized)),/数量超限/);
 const bad=JSON.parse(JSON.stringify(doc));bad.model.pickSel={'__proto__':false,'wrong key <img>':true};
 assert.throws(()=>bridge.parseDocument(JSON.stringify(bad)),/非法/);
 const noNaN=sample();noNaN.parts[0].r=Infinity;
 assert.throws(()=>bridge.documentFromState(noNaN),/有效正数/);
});
test('upstream editor binds the bridge to original undo snapshot, not a second geometry engine',()=>{
 const html=fs.readFileSync(path.join(__dirname,'../../labs/cone-lab/index.html'),'utf8');
 assert.match(html,/<script src="model-bridge\.js"><\/script>/);
 assert.match(html,/getState: function\(\)\{ return JSON\.parse\(snapState\(\)\); \}/);
 assert.match(html,/applySnapshot\(JSON\.stringify\(next\)\)/);
 assert.match(html,/undoStack = \[\];/);
});
