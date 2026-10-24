'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {certifyConvexSegmentOcclusion:certify}=
 require('../../core/numeric/convex-segment-occlusion.cjs');
const P=(x,y,z)=>({x,y,z});
function box(id,min,max){
 const halfspaces=[];
 for(const axis of ['x','y','z'])for(const [bound,sign] of [['min',-1],['max',1]]){
  const normal=P(0,0,0);normal[axis]=sign;
  halfspaces.push({id:axis+bound,normal,offsetMm:sign*(
   bound==='min'?min[axis]:max[axis])});
 }
 return {id,halfspaces};
}
const solid=box('Box',P(0,0,2),P(10,10,4));
const source={id:'DrawingEdge',from:P(-5,5,0),to:P(15,5,0)};
const run=(overrides={})=>certify({
 source,solid,observerDirection:P(0,0,1),...overrides
});
const interpolate=s=>P(source.from.x+20*s,5,0);
const strictInterior=(p,depth,faces)=>
 faces.every(f=>f.normal.x*p.x+f.normal.y*p.y+
 f.normal.z*(p.z+depth)<f.offsetMm-1e-8);
test('M0 derives continuous occluded parameter interval from ALL convex halfspaces',()=>{
 const result=run();
 assert.equal(result.status,'certified-open-interval');
 const [start,end]=result.openSourceParameterRange;
 assert.ok(start>0.25&&start<0.250001);
 assert.ok(end<0.75&&end>0.749999);
 assert.equal(Object.isFrozen(result.openSourceParameterRange),true);
 for(const s of [(start+end)/2,0.4,0.6]){
  assert.equal(strictInterior(interpolate(s),3,solid.halfspaces),true);
 }
 assert.equal(result.sourceEndpointsVerified,false);
 assert.equal(result.occlusionComplete,false);
 assert.equal(result.officialLineStyleVerified,false);
 assert.equal(result.v5Verified,false);
});
test('independent physical ray witnesses must agree over ALL certified intervals',()=>{
 for(const move of [-20,-5,0,2]){
  const line={id:'SourceEdge',from:P(-5,5,move),to:P(15,5,move)};
  const result=run({source:line});
  if(move===2){assert.equal(result.status,'no-strict-hit');continue;}
  if(result.status!=='certified-open-interval')continue;
  const [a,b]=result.openSourceParameterRange;
  for(let i=1;i<50;i++){
   const s=a+(b-a)*i/50;
   const q=P(-5+20*s,5,move);
   const depth=(3-move);
   assert.ok(depth>0);
   assert.equal(strictInterior(q,depth,solid.halfspaces),true);
  }
 }
});
test('no hidden interval from tangency, complete outside segment or reversed observer',()=>{
 assert.equal(run({source:{...source,from:P(-5,0,0),to:P(15,0,0)}}).status,
  'no-strict-hit');
 assert.equal(run({source:{...source,from:P(-5,20,0),to:P(15,20,0)}}).status,
  'no-strict-hit');
 assert.equal(run({observerDirection:P(0,0,-1)}).status,'no-strict-hit');
 assert.equal(run({source:{...source,from:P(-12,5,0),to:P(-2,5,0)}}).status,
  'no-strict-hit');
});
test('fully occluded segment has open interior (0,1), but never proves endpoint joins',()=>{
 const line={id:'InsideProjection',from:P(2,5,0),to:P(8,5,0)};
 const result=run({source:line});
 assert.equal(result.status,'certified-open-interval');
 assert.deepEqual(result.openSourceParameterRange,[0,1]);
 assert.equal(result.sourceEndpointsVerified,false);
});
test('normal scale, observer scale, face order, translation and source reversal are invariant',()=>{
 const a=run(),scaled=run({
  observerDirection:P(0,0,100),
  solid:{...solid,halfspaces:[...solid.halfspaces].reverse().map(f=>({
   ...f,normal:P(7*f.normal.x,7*f.normal.y,7*f.normal.z),
   offsetMm:7*f.offsetMm
  }))}
 });
 assert.deepEqual(scaled.openSourceParameterRange,a.openSourceParameterRange);
 const translation=P(21,-13,19);
 const shiftedSource={id:source.id,
  from:P(source.from.x+translation.x,source.from.y+translation.y,source.from.z+translation.z),
  to:P(source.to.x+translation.x,source.to.y+translation.y,source.to.z+translation.z)};
 const shifted={id:solid.id,halfspaces:solid.halfspaces.map(f=>({
  ...f,offsetMm:f.offsetMm+f.normal.x*translation.x+
   f.normal.y*translation.y+f.normal.z*translation.z
 }))};
 const transformed=run({source:shiftedSource,solid:shifted});
 assert.equal(transformed.status,'certified-open-interval');
 assert.ok(Math.abs(transformed.openSourceParameterRange[0]-a.openSourceParameterRange[0])<1e-9);
 assert.ok(Math.abs(transformed.openSourceParameterRange[1]-a.openSourceParameterRange[1])<1e-9);
 const flipped=run({source:{...source,from:source.to,to:source.from}});
 assert.ok(Math.abs(flipped.openSourceParameterRange[0]-
  (1-a.openSourceParameterRange[1]))<1e-9);
});
test('near-parallel faces, invalid source IDs and impossible normals fail closed',()=>{
 const tilted={...solid,halfspaces:solid.halfspaces.map((f,i)=>
  i===0?{...f,normal:P(-1,0,1e-13)}:f)};
 assert.equal(run({solid:tilted}).status,'undetermined');
 for(const v of [
  {source:{...source,id:'invalid space'}},
  {source:{...source,to:source.from}},
  {observerDirection:P(0,0,0)},
  {solid:{...solid,halfspaces:solid.halfspaces.slice(0,3)}},
  {solid:{...solid,halfspaces:[...solid.halfspaces,solid.halfspaces[0]]}},
  {solid:{...solid,halfspaces:solid.halfspaces.map((f,i)=>
   i===0?{...f,normal:P(0,0,0)}:f)}},
  {marginMm:-1},
  {angularTolerance:0}
 ])assert.throws(()=>run(v));
});
