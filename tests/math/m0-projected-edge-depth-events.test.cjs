'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {inspectProjectedEdgeDepth:inspect}=
 require('../../core/numeric/projected-edge-depth-events.cjs');
const P=(x,y,z)=>({x,y,z});
const edge=(id,from,to)=>({id,from,to});
const H1=edge('First',P(-1,0,0),P(1,0,0));
const H2=edge('Second',P(0,-1,2),P(0,1,2));
const run=(first,second,view)=>inspect({first,second,view});
test('two distinct 3D edges crossing in H: +Z nearest front, without V5 style promotion',()=>{
 const a=run(H1,H2,'H');
 assert.equal(a.status,'crossing');assert.equal(a.events.length,1);
 assert.equal(a.events[0].firstParameter,0.5);
 assert.equal(a.events[0].secondParameter,0.5);
 assert.deepEqual(a.events[0].atModelProjection,{u:0,v:0});
 assert.equal(a.events[0].front,'second');
 assert.equal(a.events[0].depthDeltaMm,-2);
 assert.equal(a.events[0].endpointOrJoin,false);
 assert.equal(a.completeOcclusionVerified,false);
 assert.equal(a.contourLineStyleVerified,false);
 assert.equal(a.v5Ready,false);
});
test('first-angle V and W observer signs are not an arbitrary 3D camera',()=>{
 const V1=edge('Vfirst',P(-1,2,0),P(1,2,0));
 const V2=edge('Vsecond',P(0,-3,-1),P(0,-3,1));
 const v=run(V1,V2,'V');
 assert.equal(v.status,'crossing');
 assert.equal(v.events[0].front,'second','-Y is nearer');
 const W1=edge('Wfirst',P(1,-1,0),P(1,1,0));
 const W2=edge('Wsecond',P(3,0,-1),P(3,0,1));
 const w=run(W1,W2,'W');
 assert.equal(w.status,'crossing');
 assert.equal(w.events[0].front,'second','+X is nearer');
});
test('parallel separated segments are disjoint; collinear overlap gives exact parameter interval',()=>{
 const a=edge('A',P(0,0,0),P(10,0,0));
 const b=edge('B',P(2,0,1),P(8,0,1));
 const r=run(a,b,'H');
 assert.equal(r.status,'collinear-overlap');
 assert.equal(r.ranges.length,1);
 assert.ok(Math.abs(r.ranges[0].firstParameterRange[0]-0.2)<1e-10);
 assert.ok(Math.abs(r.ranges[0].firstParameterRange[1]-0.8)<1e-10);
 assert.equal(r.ranges[0].front,'second');
 assert.deepEqual(r.ranges[0].projectedFrom,{u:2,v:0});
 assert.deepEqual(r.ranges[0].projectedTo,{u:8,v:0});
 const far=edge('Far',P(2,4,1),P(8,4,1));
 assert.equal(run(a,far,'H').status,'disjoint-parallel');
});
test('collinear projected overlap depth swaps split at the real 3D depth-equality point',()=>{
 const a=edge('First',P(0,0,0),P(10,0,0));
 const b=edge('Second',P(2,0,-2),P(8,0,2));
 const r=run(a,b,'H');
 assert.equal(r.status,'collinear-overlap');
 assert.equal(r.ranges.length,2);
 assert.deepEqual(r.ranges.map(q=>q.front),['first','second']);
 assert.ok(Math.abs(r.ranges[0].projectedTo.u-5)<1e-10);
 assert.ok(Math.abs(r.ranges[1].projectedFrom.u-5)<1e-10);
 assert.equal(r.completeOcclusionVerified,false);
 const symmetric=run(b,a,'H');
 assert.deepEqual(symmetric.ranges.map(q=>q.front),['second','first']);
});
test('projected common endpoint, coincident depth and collapsed projection stay unverified',()=>{
 const a=edge('First',P(0,0,0),P(4,0,0));
 const b=edge('Second',P(4,0,3),P(8,0,3));
 const join=run(a,b,'H');
 assert.equal(join.status,'endpoint-touch-undetermined');
 assert.equal(join.events[0].front,'undetermined');
 const same=run(a,edge('Other',P(0,0,0),P(4,0,0)),'H');
 assert.equal(same.status,'collinear-overlap');
 assert.equal(same.ranges[0].front,'undetermined');
 const collapse=run(edge('Vertical',P(1,1,0),P(1,1,10)),a,'H');
 assert.equal(collapse.status,'collapsed-projection-undetermined');
});
test('coordinate translation and view-depth scaling preserve edge front order',()=>{
 const shifted=e=>({
  ...e,from:P(e.from.x+7,e.from.y-12,e.from.z+19),
  to:P(e.to.x+7,e.to.y-12,e.to.z+19)
 });
 const a=run(H1,H2,'H'),b=run(shifted(H1),shifted(H2),'H');
 assert.equal(b.status,a.status);
 assert.equal(b.events[0].front,a.events[0].front);
 assert.ok(Math.abs(b.events[0].depthDeltaMm-a.events[0].depthDeltaMm)<1e-9);
});
test('invalid inputs and duplicate source IDs cannot counterfeit edge depth ordering',()=>{
 const cases=[
  {first:H1,second:H1,view:'H'},
  {first:H1,second:H2,view:'3D'},
  {first:edge('Zero',P(1,1,1),P(1,1,1)),second:H1,view:'H'},
  {first:edge('Bad',P(NaN,1,1),P(1,1,1)),second:H1,view:'H'},
  {first:H1,second:H2,view:'H',toleranceMm:-1}
 ];
 for(const sample of cases)assert.throws(()=>inspect(sample));
});
