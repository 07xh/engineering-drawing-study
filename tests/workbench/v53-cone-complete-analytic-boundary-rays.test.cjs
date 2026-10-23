'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {completedConeBoundaryRays:solve}=
 require('../../workbench/cone-complete-boundary-rays.cjs');
const {verifiedConeSpatialIntent}=
 require('../../workbench/verified-cone-spatial-intent.cjs');
const P=(x,y,z)=>({x,y,z});
const cone={baseCenter:P(0,0,0),radiusMm:5,heightMm:10,modelUnit:'mm'};
const plane=(n=P(1,1,3),z=6)=>({
 point:P(0,0,z),normal:n,modelUnit:'mm'});
const opts=(rest={})=>({
 kind:'full-ellipse',revision:33,sourceConfirmed:true,samples:64,
 retainedHalfspace:'positive',...rest
});
const supportPoint=(op,angle)=>{
 const a=op.analytic,k=op.cone.radiusMm/op.cone.heightMm;
 const rho=a.numeratorMm/(a.denominator.constant+
  a.denominator.cosCoeff*Math.cos(angle)+
  a.denominator.sinCoeff*Math.sin(angle));
 return {x:a.apex.x+rho*Math.cos(angle),
  y:a.apex.y+rho*Math.sin(angle),
  z:a.apex.z-rho/k};
};
const inside=(p,ray,t,normal,kept)=>{
 const q={x:p.x+t*ray.x,y:p.y+t*ray.y,z:p.z+t*ray.z};
 const g=Math.hypot(q.x,q.y)-5*(10-q.z)/10;
 const planeSigned=kept*(normal.x*q.x+normal.y*q.y+
  normal.z*(q.z-6));
 return planeSigned>1e-10&&g< -1e-7;
};
test('04 full ellipse: analytic open intervals plus W silhouette tangencies certified without another solver',()=>{
 const p=plane(),res=solve(cone,p,opts());
 assert.equal(res.status,'analytic-convex-boundary-ray-evidence');
 assert.equal(res.closedSourceSeamVerified,true);
 assert.equal(res.quadraticTangentContactEvaluated,true);
 assert.equal(res.completeAnalyticBoundaryVisibilityVerified,true);
 assert.equal(res.completeSolidVisibilityVerified,false);
 assert.equal(res.capAndOtherObjectOcclusionVerified,false);
 assert.equal(res.V5EngineeringLineStylesCertified,false);
 assert.ok(res.views.W.critical.some(x=>
  x.reason==='positive-quadratic-tangent-exit'));
 assert.ok(res.views.W.intervals.some(x=>x.visibility==='hidden'));
 assert.ok(res.views.W.intervals.some(x=>x.visibility==='visible'));
 for(const v of ['V','H','W']){
  assert.equal(res.views[v].wholeAnalyticSourceBoundaryCertified,true);
  assert.equal(res.views[v].criticalPointsCertified,true);
 }
 // Independently evaluate actual finite observer ray against both solid
 // inequalities, at analytic interval midpoints (not source samples).
 const source=verifiedConeSpatialIntent(cone,p,{
  sourceConfirmed:true,revision:33,samples:64,
  sheetTransform:{origin:{x:0,y:0},scale:1}
 }).spatialIntent.operation;
 for(const [view,entry] of Object.entries(res.views)){
  for(const arc of entry.intervals){
   const mid=(arc.parameterRadians[0]+arc.parameterRadians[1])/2;
   const world=supportPoint(source,mid);
   const hidden=inside(world,entry.observerDirection,0.0005,p.normal,1);
   assert.equal(hidden,arc.visibility==='hidden',
    'independent finite convex ray counterexample '+view);
  }
 }
});
test('09 cut-plane observer ray parallel leaves boundary undecided rather than claiming 3D visibility',()=>{
 const v=solve(cone,plane(P(1,0,3)),opts());
 assert.equal(v.status,'analytic-convex-boundary-ray-evidence');
 assert.equal(v.views.V.wholeAnalyticSourceBoundaryCertified,false);
 assert.equal(v.views.V.openIntervalsCertified,false);
 assert.equal(v.completeAnalyticBoundaryVisibilityVerified,false);
 assert.ok(v.views.V.critical.every(x=>x.status==='undetermined'));
 assert.equal(v.views.W.criticalPointsCertified,true);
});
test('09 plane normal + halfspace reversal preserves source boundary visibility',()=>{
 const a=solve(cone,plane(),opts());
 const b=solve(cone,plane(P(-1,-1,-3)),opts({
  retainedHalfspace:'negative'
 }));
 for(const view of ['V','H','W']){
  assert.deepEqual(a.views[view].intervals.map(x=>x.visibility),
   b.views[view].intervals.map(x=>x.visibility));
  assert.deepEqual(a.views[view].critical.map(x=>x.status),
   b.views[view].critical.map(x=>x.status));
 }
});
test('09 no confirmed source or clipped loop may publish full analytic boundary certification',()=>{
 const no=solve(cone,plane(),opts({sourceConfirmed:false}));
 assert.equal(no.status,'not-verified');
 assert.equal(no.completeAnalyticBoundaryVisibilityVerified,false);
 const clip=solve(cone,plane(),opts({kind:'clipped-ellipse'}));
 assert.equal(clip.status,'not-supported');
 assert.equal(clip.views,null);
 assert.equal(clip.completeAnalyticBoundaryVisibilityVerified,false);
 assert.throws(()=>solve(cone,plane(),opts({
  observerDirections:{V:P(0,1,0),H:P(0,0,1),W:P(1,0,0)}
 })),/conflicts/);
 assert.throws(()=>solve(cone,plane(),opts({
  retainedHalfspace:'unknown'
 })),/halfspace/);
 const original=JSON.stringify(plane());
 const p=plane();solve(cone,p,opts());
 assert.equal(JSON.stringify(p),original);
});
