'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {inspectProjectedEdgeDepth:inspect}=
 require('../../core/numeric/projected-edge-depth-events.cjs');
const P=(x,y,z)=>({x,y,z});
const E=(id,from,to)=>({id,from,to});
const first=()=>E('A',P(-1,0,0),P(1,0,0));
const second=()=>E('B',P(0,-1,2),P(0,1,2));
test('M0 projected source coordinate accessor is read once, not changed after validation',()=>{
 const a=first();let reads=0;
 Object.defineProperty(a.from,'x',{
  enumerable:true,get(){return ++reads===1?-1:Infinity;}
 });
 const r=inspect({first:a,second:second(),view:'H'});
 assert.equal(r.status,'crossing');
 assert.equal(r.events[0].front,'second');
 assert.equal(reads,1);
 assert.equal(r.completeOcclusionVerified,false);
 assert.equal(r.v5Ready,false);
});
test('M0 dynamic top-level edge from/to and identity getters cannot alter proven crossing',()=>{
 const a=first();let fromReads=0,idReads=0;
 Object.defineProperty(a,'from',{
  enumerable:true,get(){return ++fromReads===1?P(-1,0,0):P(3e8,0,0);}
 });
 Object.defineProperty(a,'id',{
  enumerable:true,get(){return ++idReads===1?'A':'Other';}
 });
 const r=inspect({first:a,second:second(),view:'H'});
 assert.equal(r.status,'crossing');
 assert.deepEqual(r.sourceEdgeIds,['A','B']);
 assert.equal(fromReads,1);assert.equal(idReads,1);
});
test('M0 a caller cannot exploit a late-mutating endpoint z to reverse observer depth sign',()=>{
 const b=second();let reads=0;
 Object.defineProperty(b.to,'z',{
  enumerable:true,get(){return ++reads===1?2:-2;}
 });
 const r=inspect({first:first(),second:b,view:'H'});
 assert.equal(r.status,'crossing');
 assert.equal(r.events[0].front,'second');
 assert.equal(reads,1);
});
test('M0 first read nonfinite, duplicate identity, missing own coordinates fail closed',()=>{
 const bad=first();let count=0;
 Object.defineProperty(bad.from,'x',{get(){count++;return Infinity;},enumerable:true});
 assert.throws(()=>inspect({first:bad,second:second(),view:'H'}),TypeError);
 assert.equal(count,1);
 const hole=first();delete hole.from.y;assert.throws(()=>
  inspect({first:hole,second:second(),view:'H'}),TypeError);
 const duplicate=second();duplicate.id='A';
 assert.throws(()=>inspect({first:first(),second:duplicate,view:'H'}),TypeError);
});
test('M0 exact near-parallel projection guard remains active after snapshot',()=>{
 const n=1e8;
 const a=E('A',P(0,0,0),P(n,n-1,0));
 const b=E('B',P(0,0,2),P(n-1,n-2,2));
 const r=inspect({first:a,second:b,view:'H'});
 assert.equal(r.status,'undetermined-near-parallel-projection');
 assert.deepEqual(r.ranges,[]);
 assert.equal(r.officialLineStyleVerified,undefined);
 assert.equal(r.contourLineStyleVerified,false);
});
test('M0 multiple V/H/W views preserve source identity and pairwise scope',()=>{
 const a=first(),b=second();
 const result=inspect({first:a,second:b,view:'H'});
 assert.equal(result.status,'crossing');
 assert.equal(result.events[0].depthDeltaMm,-2);
 assert.equal(result.endpointJoinVerified,false);
 assert.equal(result.completeOcclusionVerified,false);
});
