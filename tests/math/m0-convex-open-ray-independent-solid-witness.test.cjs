'use strict';
/**
 * Independent finite-displacement M0/M3 oracle. Unlike the production
 * first-derivative sign test, it asks whether p + t*d lies in the RETAINED
 * physical solid after a small positive displacement. Each specialist still
 * proves its own source boundary; this oracle checks ONLY open interiors.
 *
 * This intentionally never upgrades silhouette endpoints, full drawing
 * visibility, camera/view mapping, or V5 certification.
 */
const test=require('node:test'),assert=require('node:assert/strict');
const {classifyPrismSectionVisibility}=require(
 '../../engines/spatial/sections/rectangular-prism-cut-visibility.cjs');
const {classifyCylinderSectionVisibility}=require(
 '../../engines/spatial/sections/cylinder-cut-ray-visibility.cjs');
const {classifyConeSectionVisibility}=require(
 '../../engines/spatial/sections/cone-cut-ray-visibility.cjs');
const P=(x,y,z)=>({x,y,z});
const pointOnRay=(p,d,t)=>P(p.x+t*d.x,p.y+t*d.y,p.z+t*d.z);
const dot=(a,b)=>a.x*b.x+a.y*b.y+a.z*b.z;
const retained=(p,plane,side)=>{
 const relative=P(p.x-plane.point.x,p.y-plane.point.y,p.z-plane.point.z);
 return (side==='positive'?1:-1)*dot(relative,plane.normal)>0;
};
const EPS=1e-8;
function insidePrism(p,b){
 return ['x','y','z'].every(k=>p[k]>=b.min[k]-EPS&&p[k]<=b.max[k]+EPS);
}
function insideCylinder(p,c){
 const b=c.baseCenter;
 return p.z>=b.z-EPS&&p.z<=b.z+c.heightMm+EPS&&
  Math.hypot(p.x-b.x,p.y-b.y)<=c.radiusMm+EPS;
}
function insideCone(p,c){
 const b=c.baseCenter,z=p.z-b.z;
 return z>=-EPS&&z<=c.heightMm+EPS&&
  Math.hypot(p.x-b.x,p.y-b.y)<=
   c.radiusMm*(1-z/c.heightMm)+EPS;
}
const box={min:P(0,0,0),max:P(10,10,10)};
const cylinder={baseCenter:P(0,0,0),radiusMm:5,heightMm:30};
const cone={baseCenter:P(0,0,0),radiusMm:5,heightMm:10,modelUnit:'mm'};
const prPlane={point:P(0,0,12),normal:P(1,1,1)};
const cyPlane={point:P(0,0,3),normal:P(1,0,1)};
const coPlane={point:P(0,0,6),normal:P(1,0,3),modelUnit:'mm'};
const clipped={point:P(0,0,1),normal:P(1,0,3),modelUnit:'mm'};
const fixtures=[
 {kind:'prism',solid:box,plane:prPlane,inside:insidePrism,
  compute:o=>classifyPrismSectionVisibility(box,prPlane,o),
  cases:[['negative',P(0,0,1)],['positive',P(0,0,1)],
    ['positive',P(1,-1,1e-12)]]},
 {kind:'cylinder',solid:cylinder,plane:cyPlane,inside:insideCylinder,
  compute:o=>classifyCylinderSectionVisibility(cylinder,cyPlane,o),
  cases:[['positive',P(1,0,0)],['negative',P(-1,0,0.25)],
    ['negative',P(-1,0,-0.25)]]},
 {kind:'cone-ellipse',solid:cone,plane:coPlane,inside:insideCone,
  compute:o=>classifyConeSectionVisibility(cone,coPlane,{
   kind:'full-ellipse',sourceConfirmed:true,...o}),
  cases:[['negative',P(1,0,0)],['positive',P(-1,0,0.6)],
    ['negative',P(-1,0,0.6)]]},
 {kind:'cone-clipped',solid:cone,plane:clipped,inside:insideCone,
  compute:o=>classifyConeSectionVisibility(cone,clipped,{
   kind:'clipped-ellipse',sourceConfirmed:true,...o}),
  cases:[['negative',P(1,0,0)],['positive',P(1,0,.7)],
    ['negative',P(-1,0,.6)]]}
];
for(const f of fixtures){
 test('M3 '+f.kind+' open-ray labels agree with independent physical kept-solid membership',()=>{
  let compared=0;
  for(const [side,ray] of f.cases){
   const input={retainedHalfspace:side,observerDirection:ray};
   const before=JSON.stringify(input),result=f.compute(input);
   assert.equal(result.status,'ready',f.kind+' needs actual source geometry');
   assert.equal(JSON.stringify(input),before,'proof cannot mutate observer input');
   const runs=result.edgeRuns||result.runs;
   assert.ok(runs.length>0);
   assert.equal(result.standardViewMappingVerified,false);
   for(const run of runs){
    assert.equal(run.endpointVisibilityVerified,false);
    if(run.visibility==='undetermined')continue;
    const q=run.through;
    assert.ok(['x','y','z'].every(k=>Number.isFinite(q?.[k])),
     f.kind+': missing checked open-boundary midpoint');
    // Both 1e-4 and 1e-3 mm are much smaller than any fixture solid,
    // yet far larger than the residual/tangency tolerances of these cases.
    for(const step of [0.0001,0.001]){
     const moved=pointOnRay(q,result.observerDirection,step);
     const isInside=f.inside(moved,f.solid)&&retained(moved,f.plane,side);
     assert.equal(isInside,run.visibility==='hidden',
      f.kind+' '+side+' '+run.id+' '+run.visibility+' displaced='+step);
    }
    compared++;
   }
  }
  assert.ok(compared>0,'the oracle must inspect computed open intervals');
 });
}
