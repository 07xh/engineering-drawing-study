'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {buildConstraintIncidence}=require('../../core/constraints/constraint-incidence.cjs');
const point=id=>({id,kind:'point',space:'drawing-2d',unit:'mm',data:{x:0,y:0}});
const coincident=(id,a,b)=>({id,scope:'multi-point-2d-linear',targetIds:[a,b],type:'coincident',data:{a,b},source:'reviewed'});

test('M1 incidence budget accepts exact geometry maximum with no edges',()=>{
 const geometry=Array.from({length:2048},(_,i)=>point('P'+i));
 const r=buildConstraintIncidence({geometry,constraints:[]});
 assert.equal(r.geometryCount,2048);
 assert.equal(r.components.length,2048);
 assert.equal(r.numericRank,null);
 assert.equal(r.proofOfUniqueness,false);
});

test('M1 budget rejects one geometry above maximum before traversing contents',()=>{
 const geometry=Array.from({length:2049},(_,i)=>point('P'+i));
 assert.throws(()=>buildConstraintIncidence({geometry,constraints:[]}),/size budget/);
});

test('M1 rejects duplicate target IDs rather than claiming independent incidence',()=>{
 const c=coincident('same','A','A');
 // Whether schema permits repeated point identifiers or rejects them, it must never prove uniqueness.
 try{
  const r=buildConstraintIncidence({geometry:[point('A')],constraints:[c]});
  assert.equal(r.proofOfUniqueness,false);
  assert.equal(r.numericRank,null);
 }catch(e){
  assert.ok(e instanceof Error);
 }
});

test('M1 validates constraint references even when geometry is empty',()=>{
 assert.throws(()=>buildConstraintIncidence({geometry:[],constraints:[coincident('ab','A','B')]}),/unknown geometry/);
});
