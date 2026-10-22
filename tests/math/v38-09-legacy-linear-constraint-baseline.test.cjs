'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {analyze}=require('../../knowledge/multi-point-constraints.js');
const fixed=(point,axis,value)=>({type:'fixed',point,axis,value});
const coincident=(a,b)=>({type:'coincident',a,b});
const horizontal=(a,b)=>({type:'horizontal',a,b});
const vertical=(a,b)=>({type:'vertical',a,b});
test('09 legacy independent four affine equations determine only 2-point linear scope',()=>{
 const r=analyze({points:['A','B'],constraints:[
  fixed('A','x',2),fixed('A','y',3),
  fixed('B','x',6),fixed('B','y',8)
 ]});
 assert.equal(r.status,'unique');assert.equal(r.rank,4);
 assert.equal(r.degrees,0);assert.equal(r.solutionCount,1);
 assert.equal(r.variableCount,4);
 assert.deepEqual(r.steps.map(x=>x.status),
  ['independent','independent','independent','independent']);
});
test('09 one coincident relation contributes precisely two independent axis equations',()=>{
 const r=analyze({points:['A','B'],constraints:[coincident('A','B')]});
 assert.equal(r.rank,2);assert.equal(r.degrees,2);
 assert.equal(r.status,'continuous');assert.equal(r.solutionCount,null);
});
test('09 duplicate linear condition never gives a second independent equation',()=>{
 const r=analyze({points:['A'],constraints:[
  fixed('A','x',1),fixed('A','x',1)
 ]});
 assert.equal(r.rank,1);assert.equal(r.degrees,1);
 assert.equal(r.status,'continuous');
 assert.deepEqual(r.steps.map(x=>x.status),['independent','redundant']);
});
test('09 contradictory fixed equations signal absence only inside affine linear scope',()=>{
 const r=analyze({points:['A'],constraints:[
  fixed('A','x',0),fixed('A','x',1)
 ]});
 assert.equal(r.status,'none');assert.equal(r.solutionCount,0);
 assert.equal(r.degrees,null);assert.equal(r.steps.at(-1).status,'contradiction');
});
test('09 horizontal and vertical relations do not silently fix global location',()=>{
 const r=analyze({points:['A','B'],constraints:[
  horizontal('A','B'),vertical('A','B')
 ]});
 assert.equal(r.rank,2);assert.equal(r.degrees,2);
 assert.equal(r.status,'continuous');
});
test('09 adding redundant coordinate to a fully constrained coincident pair preserves rank',()=>{
 const r=analyze({points:['A','B'],constraints:[
  fixed('A','x',0),fixed('A','y',0),coincident('A','B'),
  fixed('B','x',0),fixed('B','y',0)
 ]});
 assert.equal(r.rank,4);assert.equal(r.degrees,0);
 assert.equal(r.status,'unique');
 assert.deepEqual(r.steps.slice(-2).map(x=>x.status),['redundant','redundant']);
});
test('09 unknown point ID, duplicate point names and impossible zero linear row fail closed',()=>{
 assert.throws(()=>analyze({points:['A'],constraints:[fixed('B','x',2)]}),/未知点/);
 assert.throws(()=>analyze({points:['A','A'],constraints:[]}),/重复/);
 assert.throws(()=>analyze({points:['A'],constraints:[
  {type:'linear',terms:[
   {point:'A',axis:'x',factor:1},
   {point:'A',axis:'x',factor:-1}],value:0}
 ]}),/不能全为零/);
});
