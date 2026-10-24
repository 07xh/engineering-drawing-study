'use strict';
/**
 * Independent halfspace/interior membership checks for real M3 open-ray
 * consumers of M0 scalar convex-open-ray. Finite scope only: analytical
 * axis-aligned prism, right cylinder and upright cone at supplied plane.
 */
const test=require('node:test'),assert=require('node:assert/strict');
const {classifyPrismSectionVisibility:prism}=
 require('../../engines/spatial/sections/rectangular-prism-cut-visibility.cjs');
const {classifyCylinderSectionVisibility:cylinder}=
 require('../../engines/spatial/sections/cylinder-cut-ray-visibility.cjs');
const {classifyConeSectionVisibility:cone}=
 require('../../engines/spatial/sections/cone-cut-ray-visibility.cjs');
const {classifyConvexOpenRaySign:signCase}=
 require('../../core/numeric/convex-open-ray.cjs');
const P=(x,y,z)=>({x,y,z});
const dot=(a,b)=>a.x*b.x+a.y*b.y+a.z*b.z;
const plane={point:P(0,0,6),normal:P(1,0,3)};
const norm=d=>Math.hypot(d.x,d.y,d.z);
function raySample(q,observer,travel=1e-3){
 const len=norm(observer);
 return P(q.x+travel*observer.x/len,
  q.y+travel*observer.y/len,q.z+travel*observer.z/len);
}
function isKept(q,plane,halfspace,margin=1e-7){
 const signed=dot(plane.normal,P(q.x-plane.point.x,
  q.y-plane.point.y,q.z-plane.point.z));
 return halfspace==='negative'?signed< -margin:signed>margin;
}
function verifyLocalMembership(r,observer,plane,halfspace,inside,label){
 let verified=0,hidden=0,visible=0;
 const runs=r.edgeRuns||r.runs;
 for(const part of runs){
  if(part.visibility==='undetermined'){
   assert.equal(part.openIntervalCertified??part.openEdgeVerified,false);
   continue;
  }
  const q=raySample(part.through,observer);
  const interior=inside(q)&&isKept(q,plane,halfspace);
  assert.equal(interior,part.visibility==='hidden',
   label+' '+part.id+' physical kept-solid membership');
  assert.equal(part.endpointVisibilityVerified,false);
  verified++;
  if(part.visibility==='hidden')hidden++;
  else visible++;
 }
 assert.ok(verified>0,label+' must test actual signed rays');
 return {verified,hidden,visible};
}
test('actual M3 prism edge runs agree with independent integer cut-plane and box-face sign oracle',()=>{
 const box={min:P(0,0,0),max:P(10,10,10)},
  cut={point:P(0,0,12),normal:P(1,1,1)};
 let removed=0,kept=0,hidden=0;
 for(const d of [P(1,-2,-1),P(-1,2,-3),P(0,0,1),
  P(1,1,1),P(1,-1,0),P(-1,-1,-1)]){
  for(const side of ['negative','positive']){
   const r=prism(box,cut,{retainedHalfspace:side,observerDirection:d});
   assert.equal(r.status,'ready');
   assert.equal(r.standardViewMappingVerified,false);
   assert.equal(r.v5LineStylesReady,false);
   assert.equal(r.boundaryEndpointsVerified,false);
   assert.equal(r.globallyUnique,null);
   const planeSign=(side==='negative'?-1:1)*(d.x+d.y+d.z);
   for(const run of r.edgeRuns){
    const [axis,bound]=run.boxFace.split('-');
    const surfaceSign=(bound==='max'?1:-1)*d[axis];
    const expected=planeSign<0?'visible':
      planeSign===0?'undetermined':
      surfaceSign>0?'visible':surfaceSign<0?'hidden':'undetermined';
    assert.equal(run.visibility,expected,
     'BigInt-equivalent integer direction oracle '+run.boxFace);
    if(planeSign<0&&expected==='visible')removed++;
    if(planeSign>0&&expected==='visible')kept++;
    if(expected==='hidden')hidden++;
   }
   verifyLocalMembership(r,d,cut,side,q=>
    ['x','y','z'].every(axis=>q[axis]>box.min[axis]+1e-7&&
       q[axis]<box.max[axis]-1e-7),'prism');
  }
 }
 assert.ok(removed>0&&kept>0&&hidden>0);
});
test('actual M3 finite cylinder lateral arcs match independent circle AND kept-plane membership',()=>{
 const model={baseCenter:P(0,0,0),radiusMm:5,heightMm:30};
 let hidden=0,visible=0;
 for(const d of [P(1,0,-1),P(-1,0,-1),P(0,0,1)]){
  for(const side of ['negative','positive']){
   const r=cylinder(model,plane,{
    retainedHalfspace:side,observerDirection:d,samplesPerTurn:64
   });
   assert.equal(r.status,'ready');
   assert.equal(r.sourcePerimeterVerified,true);
   assert.equal(r.standardViewMappingVerified,false);
   assert.equal(r.v5StrokeStyleReady,false);
   assert.equal(r.globallyUnique,null);
   const result=verifyLocalMembership(r,d,plane,side,q=>
    Math.hypot(q.x,q.y)<model.radiusMm-1e-7&&
    q.z>1e-7&&q.z<model.heightMm-1e-7,'cylinder');
   hidden+=result.hidden;visible+=result.visible;
  }
 }
 assert.ok(hidden>0&&visible>0,'both ray directions must be witnessed');
});
test('actual M3 cone analytic arc runs agree with independent finite convex cone inequalities',()=>{
 const model={baseCenter:P(0,0,0),radiusMm:5,heightMm:10,modelUnit:'mm'},
  cut={point:P(0,0,6),normal:P(1,0,3),modelUnit:'mm'};
 let visible=0,hidden=0;
 for(const d of [P(1,0,-1),P(-1,0,-1),P(0,0,1)]){
  for(const side of ['negative','positive']){
   const r=cone(model,cut,{
    kind:'full-ellipse',sourceConfirmed:true,
    retainedHalfspace:side,observerDirection:d,samples:64
   });
   assert.equal(r.status,'ready');
   assert.equal(r.sourceBoundaryVerified,true);
   assert.equal(r.standardViewMappingVerified,false);
   assert.equal(r.v5LineStylesReady,false);
   assert.equal(r.boundaryEndpointsVerified,false);
   assert.equal(r.globallyUnique,null);
   const count=verifyLocalMembership(r,d,cut,side,q=>{
    if(q.z<=1e-7||q.z>=model.heightMm-1e-7)return false;
    const radius=model.radiusMm*(model.heightMm-q.z)/model.heightMm;
    return Math.hypot(q.x,q.y)<radius-1e-7;
   },'cone');
   visible+=count.visible;hidden+=count.hidden;
  }
 }
 assert.ok(hidden>0&&visible>0,'cone must produce independently signed physical rays');
});
test('plane-cut reversal with retained side reversal preserves actual prism and cylinder physics',()=>{
 const box={min:P(0,0,0),max:P(10,10,10)},
  cut={point:P(0,0,12),normal:P(1,1,1)};
 const flipped={point:cut.point,normal:P(-1,-1,-1)};
 for(const d of [P(1,-2,-1),P(-1,2,-3),P(0,0,1)]){
  const a=prism(box,cut,{retainedHalfspace:'negative',observerDirection:d});
  const b=prism(box,flipped,{retainedHalfspace:'positive',observerDirection:d});
  assert.equal(a.status,'ready');assert.equal(b.status,'ready');
  assert.deepEqual(a.edgeRuns.map(x=>x.visibility),b.edgeRuns.map(x=>x.visibility));
 }
 const model={baseCenter:P(0,0,0),radiusMm:5,heightMm:30};
 const reverse={point:plane.point,normal:P(-1,0,-3)};
 for(const d of [P(1,0,-1),P(-1,0,-1)]){
  const a=cylinder(model,plane,{retainedHalfspace:'negative',observerDirection:d});
  const b=cylinder(model,reverse,{retainedHalfspace:'positive',observerDirection:d});
  assert.equal(a.status,'ready');assert.equal(b.status,'ready');
  assert.deepEqual(a.runs.map(x=>[x.kind,x.visibility]),
    b.runs.map(x=>[x.kind,x.visibility]));
 }
});
test('M0 scalar classifier refuses near-tangent slopes and cannot certify open arc end joins',()=>{
 for(const [a,b] of [[0,1],[1,0],[1,1e-11],[1,-1e-11],
   [-1e-11,1],[1e-11,-1]])
  assert.equal(signCase(a,b),'undetermined');
 const box={min:P(0,0,0),max:P(10,10,10)},
  cut={point:P(0,0,12),normal:P(1,1,1)};
 const tangent=prism(box,cut,{
  retainedHalfspace:'negative',observerDirection:P(1,-1,0)
 });
 assert.equal(tangent.status,'ready');
 assert.equal(tangent.visibilityVerified,false);
 assert.ok(tangent.edgeRuns.every(x=>x.visibility==='undetermined'&&
  x.openEdgeVerified===false&&x.endpointVisibilityVerified===false));
});
