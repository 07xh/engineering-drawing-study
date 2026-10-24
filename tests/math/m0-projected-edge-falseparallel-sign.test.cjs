'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {inspectProjectedEdgeDepth:inspect}=
 require('../../core/numeric/projected-edge-depth-events.cjs');
const {orientation2DAdaptive:orient}=
 require('../../core/numeric/orientation2d-adaptive.cjs');
const P=(x,y,z)=>({x,y,z});
const E=(id,from,to)=>({id,from,to});
const n=100000000;
const oracle=BigInt(n)*BigInt(n-2)-BigInt(n-1)**2n;
test('M0 1e8 projected false-parallel determinant cannot create false overlap',()=>{
 assert.equal(oracle,-1n);
 const r=[n,n-1],s=[n-1,n-2];
 assert.equal(r[0]*s[1]-r[1]*s[0],0);
 assert.equal(orient([0,0],r,s).sign,-1);
 const first=E('A',P(0,0,0),P(n,n-1,0));
 const second=E('B',P(0,0,2),P(n-1,n-2,2));
 const result=inspect({first,second,view:'H'});
 assert.equal(result.status,'undetermined-near-parallel-projection');
 assert.deepEqual(result.ranges,[]);
 assert.equal(result.completeOcclusionVerified,false);
 assert.equal(result.endpointJoinVerified,false);
 assert.equal(result.contourLineStyleVerified,false);
 assert.equal(result.v5Ready,false);
});
test('M0 parallel directions but noncollinear line a signed 1e-8 mm off cannot invent 2D overlap',()=>{
 const first=E('A',P(0,0,0),P(n,n-1,0));
 const second=E('B',P(n-1,n-2,2),P(-1,-1,2));
 const result=inspect({first,second,view:'H'});
 assert.equal(orient([0,0],[n,n-1],[n-1,n-2]).sign,-1);
 assert.equal(result.status,'undetermined-near-collinear-projection');
 assert.equal(result.ranges.length,0);
});
test('M0 V/W projection axes use same robust source determinant classification',()=>{
 const Vfirst=E('A',P(0,0,0),P(n,0,n-1));
 const Vsecond=E('B',P(0,2,0),P(n-1,2,n-2));
 const Wfirst=E('A',P(0,0,0),P(0,n,n-1));
 const Wsecond=E('B',P(2,0,0),P(2,n-1,n-2));
 for(const [first,second,view] of [
  [Vfirst,Vsecond,'V'],[Wfirst,Wsecond,'W']]){
  const r=inspect({first,second,view});
  assert.equal(r.status,'undetermined-near-parallel-projection');
  assert.equal(r.ranges.length,0);
 }
});
test('M0 true parallel/collinear front-depth and far disjoint remain compatible',()=>{
 const a=E('A',P(0,0,0),P(10,0,0));
 const b=E('B',P(2,0,2),P(8,0,2));
 const result=inspect({first:a,second:b,view:'H'});
 assert.equal(result.status,'collinear-overlap');
 assert.equal(result.ranges.length,1);
 assert.equal(result.ranges[0].front,'second');
 const far=inspect({first:a,second:E('C',P(2,4,2),P(8,4,2)),view:'H'});
 assert.equal(far.status,'disjoint-parallel');
});
test('M0 real proper 2D crossing still proves only pairwise edge depth',()=>{
 const first=E('A',P(-1,0,0),P(1,0,0));
 const second=E('B',P(0,-1,2),P(0,1,2));
 const r=inspect({first,second,view:'H'});
 assert.equal(r.status,'crossing');
 assert.equal(r.events[0].front,'second');
 assert.equal(r.completeOcclusionVerified,false);
 assert.equal(r.v5Ready,false);
});
