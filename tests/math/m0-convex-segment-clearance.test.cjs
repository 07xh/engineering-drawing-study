'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {certifyConvexSegmentClearance:check}=
 require('../../core/numeric/convex-segment-clearance.cjs');
const P=(x,y,z)=>({x,y,z});
function box(id,min,max){
 const halfspaces=[];
 for(const axis of ['x','y','z'])for(const [edge,sign] of [['min',-1],['max',1]]){
  const n=P(0,0,0);n[axis]=sign;
  halfspaces.push({id:axis+edge,normal:n,
   offsetMm:sign*(edge==='min'?min[axis]:max[axis])});
 }
 return {id,halfspaces};
}
const solid=box('Blocker',P(0,0,2),P(10,10,4));
const source={id:'Edge',from:P(-5,5,0),to:P(15,5,0)};
const witness=(extra={})=>check({source,solid,
 observerDirection:P(0,0,1),...extra});
test('M0 certifies continuous forward-ray CLEAR subintervals without midpoint inference',()=>{
 const left=witness({sourceParameterRange:[0,0.1]});
 const right=witness({sourceParameterRange:[0.9,1]});
 const blocked=witness({sourceParameterRange:[0.4,0.6]});
 assert.equal(left.status,'certified-clear');
 assert.equal(right.status,'certified-clear');
 assert.equal(blocked.status,'undetermined');
 assert.equal(witness().status,'undetermined');
 for(const [a,b] of [[0,0.1],[0.9,1]]){
  for(let k=0;k<=50;k++)for(const depth of [0,0.1,2,3,4,8,100]){
   const t=a+(b-a)*k/50,p=P(-5+20*t,5,depth);
   assert.ok(solid.halfspaces.some(f=>
    f.normal.x*p.x+f.normal.y*p.y+f.normal.z*p.z>f.offsetMm));
  }
 }
 assert.equal(left.sourceOpenIntervalVerified,true);
 assert.equal(left.sceneCompleteVerified,false);
 assert.equal(left.officialLineStyleVerified,false);
 assert.equal(left.v5Ready,false);
 assert.equal(Object.isFrozen(left),true);
});
test('source on outward support face is continuously clear, inward or tangent stays uncertain',()=>{
 const sourceFace={id:'TopEdge',from:P(1,1,4),to:P(9,1,4)};
 const out=witness({source:sourceFace});
 assert.equal(out.status,'certified-clear');
 assert.equal(out.reason,'full-interval-outward-support');
 assert.equal(witness({source:{...sourceFace,from:P(1,1,2),to:P(9,1,2)}}).status,
  'undetermined');
 assert.equal(witness({source:{...source,from:P(-5,0,0),to:P(15,0,0)}}).status,
  'undetermined','coplanar grazing is NOT open-face visibility');
 const reversed=witness({observerDirection:P(0,0,-1)});
 assert.equal(reversed.status,'certified-clear');
});
test('first-angle ray direction, scale, reordered faces and rigid translation preserve certified-clear',()=>{
 const base=witness({sourceParameterRange:[0,0.1]});
 const scaled=witness({sourceParameterRange:[0,0.1],
  observerDirection:P(0,0,17),solid:{...solid,
   halfspaces:[...solid.halfspaces].reverse().map(f=>({
    ...f,normal:P(7*f.normal.x,7*f.normal.y,7*f.normal.z),
    offsetMm:7*f.offsetMm
   }))}});
 assert.equal(base.status,scaled.status);
 const shift=P(55,-31,17);
 const moved={id:source.id,from:P(source.from.x+shift.x,
  source.from.y+shift.y,source.from.z+shift.z),
  to:P(source.to.x+shift.x,source.to.y+shift.y,source.to.z+shift.z)};
 const movedSolid={id:solid.id,halfspaces:solid.halfspaces.map(f=>({
  ...f,offsetMm:f.offsetMm+
   f.normal.x*shift.x+f.normal.y*shift.y+f.normal.z*shift.z
 }))};
 assert.equal(witness({source:moved,solid:movedSolid,
  sourceParameterRange:[0,0.1]}).status,base.status);
});
test('near contact, shadowed interior and incomplete cylinder-approximation claims never certify open line',()=>{
 for(const request of [
  {sourceParameterRange:[0.25,0.75]},
  {sourceParameterRange:[0.2,0.8]},
  {sourceParameterRange:[0.25,0.250000001]},
  {source:{...source,from:P(0,0,0),to:P(10,0,0)}},
  {source:{...source,from:P(0,5,2),to:P(10,5,2)}}
 ]){
  const r=witness(request);
  assert.notEqual(r.status,'certified-clear');
  assert.equal(r.officialLineStyleVerified,false);
 }
});
test('invalid source, observer, duplicate halfspaces, off-bounds and unknown units fail closed',()=>{
 for(const options of [
  {source:{...source,id:'bad name'}},
  {source:{...source,to:source.from}},
  {observerDirection:P(0,0,0)},
  {sourceParameterRange:[0.4,0.4]},
  {sourceParameterRange:[-0.1,0.1]},
  {solid:{...solid,halfspaces:[...solid.halfspaces,solid.halfspaces[0]]}},
  {solid:{...solid,halfspaces:solid.halfspaces.slice(0,2)}},
  {solid:{...solid,halfspaces:solid.halfspaces.map((f,i)=>
   i===0?{...f,normal:P(0,0,0)}:f)}},
  {clearanceMarginMm:0},
  {angularTolerance:-1}
 ])assert.throws(()=>witness(options));
});
