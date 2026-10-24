'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {intersectConvexRayHalfspaces:intersect,traceConvexRayDepth:trace}=
 require('../../core/numeric/convex-ray-depth.cjs');
const P=(x,y,z)=>({x,y,z});
const box=(id,min,max)=>{
 const halfspaces=[];
 for(const axis of ['x','y','z'])for(const [face,sign] of [['min',-1],['max',1]]){
  const normal=P(0,0,0);normal[axis]=sign;
  halfspaces.push({id:axis+face,normal,offsetMm:sign*(face==='min'?min[axis]:max[axis])});
 }
 return {id,halfspaces};
};
const A=box('Near',P(0,0,2),P(10,10,4));
const B=box('Far',P(0,0,6),P(10,10,8));
const C=box('Source',P(0,0,-2),P(10,10,0));
const ray=P(0,0,1),origin=P(5,5,0);
const cast=(solids,point=origin,observerDirection=ray)=>
 trace({point,observerDirection,solids});
test('M0 intersects genuine finite convex intervals and sorts multiple occluding solids',()=>{
 const a=intersect({point:origin,observerDirection:ray,halfspaces:A.halfspaces});
 assert.equal(a.status,'hit');
 assert.ok(Math.abs(a.entryMm-2)<1e-9);
 assert.ok(Math.abs(a.exitMm-4)<1e-9);
 assert.equal(a.entryFaceId,'zmin');
 assert.equal(a.exitFaceId,'zmax');
 const ordered=cast([B,C,A]);
 assert.equal(ordered.status,'occluded');
 assert.equal(ordered.scope,'only-supplied-convex-halfspaces');
 assert.equal(ordered.nearestSolidId,'Near');
 assert.equal(ordered.nearestDepthMm,2);
 assert.deepEqual(ordered.orderedHits.map(s=>s.solidId),['Near','Far']);
 assert.ok(ordered.intersections.some(s=>s.solidId==='Source'&&s.status==='miss'),
  'source support surface at ray origin must not create fake front hit');
 assert.equal(ordered.completeSceneVerified,false);
 assert.equal(ordered.officialLineStyleVerified,false);
 assert.equal(Object.isFrozen(ordered.orderedHits),true);
});
test('generic front interval is independently witnessed by halfspace membership',()=>{
 const source=P(4,5,1);
 const hits=cast([A,B],source);
 assert.equal(hits.status,'occluded');
 for(const hit of hits.orderedHits){
  const solid=hit.solidId==='Near'?A:B;
  const inside=t=>solid.halfspaces.every(f=>
   f.normal.x*source.x+f.normal.y*source.y+
   f.normal.z*(source.z+t)<=f.offsetMm+1e-10);
  const mid=(hit.entryMm+hit.exitMm)/2;
  assert.equal(inside(mid),true);
  assert.equal(inside(Math.max(0,hit.entryMm-0.05)),false);
  assert.equal(inside(hit.exitMm+0.05),false);
 }
});
test('clear is only a scoped no-occluder result, and an internal source ray is hidden',()=>{
 assert.equal(cast([A,B],P(20,20,0)).status,'clear');
 assert.equal(cast([C],P(5,5,-1)).status,'occluded');
 assert.equal(cast([A],P(5,5,6),P(0,0,-1)).status,'occluded');
 assert.equal(cast([A],P(5,5,6),P(0,0,1)).status,'clear');
});
test('grazing projected silhouette, coincident front depths and invalid face set never certify ordering',()=>{
 const grazing=cast([A],P(0,5,0));
 assert.equal(grazing.status,'undetermined');
 assert.ok(grazing.ambiguousSolidIds.includes('Near'));
 assert.equal(grazing.depthOrderVerified,false);
 const tie=cast([A,{...A,id:'Other'}],origin);
 assert.equal(tie.status,'undetermined');
 assert.equal(tie.nearestSolidId,null);
 const tangent=cast([A],P(-1,5,4),P(1,0,-2));
 assert.equal(tangent.status,'undetermined');
});
test('M0 scale, translation, face ordering and independent source IDs preserve depths',()=>{
 const baseline=cast([A,B]);
 const d=P(0,0,17);
 const doubled=[B,A].map(s=>({
  ...s,halfspaces:[...s.halfspaces].reverse().map(f=>({
   ...f,normal:P(f.normal.x*7,f.normal.y*7,f.normal.z*7),offsetMm:f.offsetMm*7
  }))
 }));
 const transformed=cast(doubled,origin,d);
 assert.equal(transformed.status,baseline.status);
 assert.equal(transformed.nearestSolidId,baseline.nearestSolidId);
 assert.equal(transformed.nearestDepthMm,baseline.nearestDepthMm);
 const shift=P(14,21,-37);
 const tsolids=[B,A].map(s=>({...s,halfspaces:s.halfspaces.map(f=>({
  ...f,offsetMm:f.offsetMm+
   f.normal.x*shift.x+f.normal.y*shift.y+f.normal.z*shift.z
 }))}));
 const moved=cast(tsolids,P(origin.x+shift.x,origin.y+shift.y,origin.z+shift.z));
 assert.ok(Math.abs(moved.nearestDepthMm-2)<1e-9);
});
test('malformed ray, duplicate/missing IDs and nonfinite solids fail closed',()=>{
 for(const request of [
  {point:origin,observerDirection:P(0,0,0),solids:[A]},
  {point:P(5,NaN,0),observerDirection:ray,solids:[A]},
  {point:origin,observerDirection:ray,solids:[]},
  {point:origin,observerDirection:ray,solids:[A,A]},
  {point:origin,observerDirection:ray,solids:[{...A,halfspaces:A.halfspaces.slice(0,3)}]},
  {point:origin,observerDirection:ray,solids:[{...A,halfspaces:[...A.halfspaces,A.halfspaces[0]]}]},
  {point:origin,observerDirection:ray,solids:[{...A,halfspaces:
    A.halfspaces.map((f,i)=>i?f:{...f,normal:P(0,0,0)})}]},
  {point:origin,observerDirection:ray,solids:[A],toleranceMm:-1},
  {point:origin,observerDirection:ray,solids:[A],angleTolerance:0}
 ])assert.throws(()=>trace(request));
});
