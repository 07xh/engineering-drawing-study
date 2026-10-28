'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {project}=require('../../core/projection/conventions.js');
const {IDS,parseReviewedC1Rows,serializeReviewedC1Rows}=
 require('../../project/c1-reviewed-input.cjs');
const xyz={
 V000:{x:0,y:0,z:0},V100:{x:4,y:1,z:0},
 V110:{x:3,y:4,z:0},V010:{x:-1,y:3,z:0},
 V001:{x:1,y:-1,z:5},V101:{x:5,y:0,z:5},
 V111:{x:4,y:3,z:5},V011:{x:0,y:2,z:5}
};
const controls={
 VH:{axis:'x',firstIndex:1,secondIndex:3},
 VW:{axis:'z',firstIndex:2,secondIndex:4},
 HW:{axis:'y',firstIndex:2,secondIndex:3}
};
function original(pair){
 return IDS.map(id=>{
  const views=project(xyz[id]);
  return [id,views[pair[0]].u,views[pair[0]].v,
   views[pair[1]].u,views[pair[1]].v].join(',');
 }).join('\n');
}
for(const [pair,shared] of Object.entries(controls)){
 test('C1 first-angle '+pair+': actual skew prism coordinates survive preflight and serialize',()=>{
  const rows=parseReviewedC1Rows(original(pair),pair);
  assert.deepEqual(rows.map(x=>x.id),IDS);
  assert.equal(serializeReviewedC1Rows(rows,pair),original(pair));
 });
 test('C1 first-angle '+pair+': reject one contradictory common '+shared.axis+
  ' before checkbox confirmation',()=>{
  const lines=original(pair).split('\n'),fields=lines[0].split(',');
  fields[shared.secondIndex]=String(Number(fields[shared.secondIndex])+0.002);
  lines[0]=fields.join(',');
  assert.throws(()=>parseReviewedC1Rows(lines.join('\n'),pair),
   error=>/V000/.test(error.message)&&
    error.message.includes(shared.axis)&&
    error.message.includes(pair[0]+'/'+pair[1]));
 });
 test('C1 first-angle '+pair+': different native IDs cannot share a complete 3D point',()=>{
  const lines=original(pair).split('\n');
  lines[7]='V111,'+lines[0].split(',').slice(1).join(',');
  assert.throws(()=>parseReviewedC1Rows(lines.join('\n'),pair),
   /V000.*V111.*不同三维顶点/);
 });
}
test('C1 preflight rejects disguised hexadecimal, missing entries and non-finite coordinates',()=>{
 for(const token of ['0x10','Infinity','', 'NaN','1e1000']){
  const lines=original('VH').split('\n'),fields=lines[0].split(',');
  fields[1]=token;lines[0]=fields.join(',');
  assert.throws(()=>parseReviewedC1Rows(lines.join('\n'),'VH'),
   /角点 V000.*十进制有限数值/);
 }
});
test('C1 preflight remains a bounded review check, not a new 03 solver',()=>{
 const lines=original('VH').split('\n'),fields=lines[0].split(',');
 fields[3]=String(Number(fields[1])+0.000000001);
 lines[0]=fields.join(',');
 const rows=parseReviewedC1Rows(lines.join('\n'),'VH');
 assert.equal(rows.length,8);
 assert.equal(rows[0].knownViews.H[0],0.000000001);
});