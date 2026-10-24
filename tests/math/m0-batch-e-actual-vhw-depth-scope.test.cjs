'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {inspectProjectedEdgeDepth:depth}=
 require('../../core/numeric/projected-edge-depth-events.cjs');
const {project}=require('../../core/projection/conventions.js');
const P=(x,y,z)=>({x,y,z}),E=(id,from,to)=>({id,from,to});
const move=(edge,t)=>E(edge.id,
 P(edge.from.x+t.x,edge.from.y+t.y,edge.from.z+t.z),
 P(edge.to.x+t.x,edge.to.y+t.y,edge.to.z+t.z));
const pairs=scale=>[
 ['H',E('HA',P(-scale,0,0),P(scale,0,0)),
  E('HB',P(0,-scale,2*scale),P(0,scale,2*scale)),-2*scale],
 ['V',E('VA',P(-scale,2*scale,0),P(scale,2*scale,0)),
  E('VB',P(0,-3*scale,-scale),P(0,-3*scale,scale)),-5*scale],
 ['W',E('WA',P(scale,-scale,0),P(scale,scale,0)),
  E('WB',P(3*scale,0,-scale),P(3*scale,0,scale)),-2*scale]
];
test('all canonical first-angle view signs match analytic observer-depth differences',()=>{
 for(const scale of [1/4,1,4]){
  for(const [view,a,b,expected] of pairs(scale)){
   for(const translation of [P(0,0,0),P(40,-20,30)]){
    const first=move(a,translation),second=move(b,translation);
    const r=depth({first,second,view});
    assert.equal(r.status,'crossing');
    assert.equal(r.events.length,1);
    assert.equal(r.events[0].firstParameter,.5);
    assert.equal(r.events[0].secondParameter,.5);
    assert.equal(r.events[0].front,'second');
    assert.equal(r.events[0].depthDeltaMm,expected);
    const center=P((first.from.x+first.to.x)/2,
      (first.from.y+first.to.y)/2,
      (first.from.z+first.to.z)/2);
    assert.deepEqual(r.events[0].atModelProjection,project(center)[view]);
    assert.equal(r.completeOcclusionVerified,false);
    assert.equal(r.endpointJoinVerified,false);
    assert.equal(r.contourLineStyleVerified,false);
    assert.equal(r.v5Ready,false);
   }
  }
 }
});
test('near-collinear false-zero 2D determinant must not produce a formal continuous overlap',()=>{
 const n=1e8;
 const first=E('A',P(0,0,0),P(n,n-1,0));
 const second=E('B',P(0,0,2),P(n-1,n-2,2));
 const r=depth({first,second,view:'H'});
 assert.equal(r.status,'undetermined-near-parallel-projection');
 assert.equal(r.ranges.length,0);
 assert.equal(r.completeOcclusionVerified,false);
 assert.equal(r.v5Ready,false);
});
test('tie depth and shared projected endpoint must remain undecided and never issue V5 style',()=>{
 const a=E('A',P(0,0,0),P(10,0,0));
 const b=E('B',P(0,0,0),P(10,0,0));
 const same=depth({first:a,second:b,view:'H'});
 assert.equal(same.status,'collinear-overlap');
 assert.equal(same.ranges[0].front,'undetermined');
 const endpoint=depth({first:a,
  second:E('Touch',P(10,0,2),P(20,0,2)),view:'H'});
 assert.equal(endpoint.status,'endpoint-touch-undetermined');
 assert.equal(endpoint.events[0].endpointOrJoin,true);
 assert.equal(endpoint.officialLineStyleVerified,undefined);
 assert.equal(endpoint.contourLineStyleVerified,false);
});
