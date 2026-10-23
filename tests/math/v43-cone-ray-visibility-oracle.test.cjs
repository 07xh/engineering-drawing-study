'use strict';
/** 09 independent ray/oracle tests for finite-cone open boundary visibility. */
const test=require('node:test');
const assert=require('node:assert/strict');
const {classifyConeSectionVisibility:run}=
 require('../../engines/spatial/sections/cone-cut-ray-visibility.cjs');
const P=(x,y,z)=>({x,y,z});
const cone=(center=P(0,0,0),radiusMm=5,heightMm=10)=>
 ({baseCenter:center,radiusMm,heightMm,modelUnit:'mm'});
const plane=(z=6,normal=P(1,0,3),origin=P(0,0,0))=>
 ({point:P(origin.x,origin.y,origin.z+z),
  normal,modelUnit:'mm'});
const cut=(kind='full-ellipse',halfspace='positive',
 direction=P(1,0,0),normal=P(1,0,3),c=cone(),
 z=kind==='full-ellipse'?6:1)=>
 run(c,plane(z,normal,c.baseCenter),{kind,sourceConfirmed:true,
  retainedHalfspace:halfspace,observerDirection:direction,samples:64});
const near=(a,b,t=1e-7)=>assert.ok(Number.isFinite(a)&&Number.isFinite(b)&&
 Math.abs(a-b)<=t*Math.max(1,Math.abs(a),Math.abs(b)),
 String(a)+' != '+String(b));
const dot=(a,b)=>a.x*b.x+a.y*b.y+a.z*b.z;
function rayOracle(r,c,pl){
 const unit=r.observerDirection;
 const mag=Math.hypot(pl.normal.x,pl.normal.y,pl.normal.z);
 const n=P(pl.normal.x/mag,pl.normal.y/mag,pl.normal.z/mag);
 const kept=r.retainedHalfspace==='positive'?1:-1;
 for(const seg of r.runs){
  if(seg.visibility==='undetermined')continue;
  const q=seg.through,delta=1e-4;
  const next=P(q.x+delta*unit.x,q.y+delta*unit.y,q.z+delta*unit.z);
  const half=kept*((next.x-pl.point.x)*n.x+
   (next.y-pl.point.y)*n.y+(next.z-pl.point.z)*n.z);
  const rho=Math.hypot(next.x-c.baseCenter.x,next.y-c.baseCenter.y);
  const bodyR=c.radiusMm*(c.baseCenter.z+c.heightMm-next.z)/c.heightMm;
  const inCone=next.z>=c.baseCenter.z&&
   next.z<=c.baseCenter.z+c.heightMm&&rho<bodyR;
  if(seg.visibility==='hidden'){
   assert.ok(half>0,'hidden ray must initially enter kept halfspace');
   assert.equal(inCone,true,'hidden ray must initially enter finite cone');
  }else{
   assert.ok(half<0||!inCone,
    'visible ray must initially enter removed space or leave convex cone');
  }
 }
}
test('04 exact cone silhouette angular roots split visible and hidden FULL ellipse',()=>{
 const result=cut();
 assert.equal(result.status,'ready');
 assert.equal(result.sourceBoundaryVerified,true);
 assert.equal(result.counts.visible,2);
 assert.equal(result.counts.hidden,1);
 assert.equal(result.counts.undetermined,0);
 assert.equal(result.runs.length,3);
 assert.equal(result.openIntervalsVerified,true);
 assert.equal(result.visibilityVerified,false);
 assert.equal(result.boundaryEndpointsVerified,false);
 assert.equal(result.standardViewMappingVerified,false);
 assert.equal(result.v5LineStylesReady,false);
 near(result.runs[0].angularInterval[0],0);
 near(result.runs[0].angularInterval[1],Math.PI/2);
 near(result.runs[1].angularInterval[1],3*Math.PI/2);
 near(result.runs[2].angularInterval[1],2*Math.PI);
 for(let i=1;i<result.runs.length;i++)
  near(result.runs[i-1].angularInterval[1],result.runs[i].angularInterval[0]);
 rayOracle(result,cone(),plane());
});
test('04 explicit removed halfspace makes all lateral open intervals visible',()=>{
 const r=cut('full-ellipse','negative',P(1,0,0));
 assert.equal(r.status,'ready');
 assert.deepEqual(r.counts,{visible:1,hidden:0,undetermined:0});
 assert.equal(r.runs[0].reason,'ray-enters-explicitly-removed-halfspace');
 rayOracle(r,cone(),plane());
});
test('09 plane-tangent and silhouette grazing rays never invent line styles',()=>{
 const tangent=cut('full-ellipse','positive',P(3,0,-1));
 assert.equal(tangent.status,'ready');
 assert.equal(tangent.openIntervalsVerified,false);
 assert.equal(tangent.counts.undetermined,1);
 const outward=cut('full-ellipse','positive',P(0,0,1));
 assert.equal(outward.counts.visible,1);
 assert.equal(outward.counts.hidden,0);
 const inward=cut('full-ellipse','negative',P(0,0,-1));
 assert.equal(inward.counts.hidden,1);
 assert.equal(inward.visibilityVerified,false);
 rayOracle(outward,cone(),plane());
 rayOracle(inward,cone(),plane());
});
test('04 clipped cone side arc plus interior bottom cap chord have distinct ray proofs',()=>{
 const c=cone(),p=plane(1);
 const r=cut('clipped-ellipse','positive',P(1,0,1));
 assert.equal(r.status,'ready');
 assert.equal(r.runs.filter(x=>x.kind==='cap-chord').length,1);
 assert.equal(r.runs.at(-1).visibility,'hidden');
 assert.equal(r.runs.at(-1).reason,'ray-enters-cone-through-bottom-cap');
 near(r.runs.at(-1).through.z,c.baseCenter.z);
 assert.ok(Math.hypot(r.runs.at(-1).through.x,r.runs.at(-1).through.y)<5);
 for(const edge of r.runs){
  assert.equal(edge.endpointVisibilityVerified,false);
  assert.ok(edge.maxResidualMm<1e-6);
 }
 rayOracle(r,c,p);
 const uncertain=cut('clipped-ellipse','positive',P(1,0,0));
 assert.equal(uncertain.runs.at(-1).visibility,'undetermined');
 assert.equal(uncertain.openIntervalsVerified,false);
 const removed=cut('clipped-ellipse','positive',P(1,0,-1));
 assert.equal(removed.runs.at(-1).visibility,'visible');
 rayOracle(removed,c,p);
});
test('09 equivalent normal reversal with matching halfspace reversal preserves verdict',()=>{
 const c=cone(),f=cut('full-ellipse','positive',P(1,0,0),P(1,0,3),c);
 const b=cut('full-ellipse','negative',P(1,0,0),P(-1,0,-3),c);
 assert.deepEqual(f.counts,b.counts);
 assert.equal(f.runs.length,b.runs.length);
 for(let i=0;i<f.runs.length;i++){
  near(f.runs[i].angularInterval[0],b.runs[i].angularInterval[0]);
  near(f.runs[i].angularInterval[1],b.runs[i].angularInterval[1]);
  assert.equal(f.runs[i].visibility,b.runs[i].visibility);
 }
});
test('09 normal magnitude and numerical sampling cannot change analytic visibility',()=>{
 const c=cone();
 const a=cut('full-ellipse','positive',P(1,0,0));
 const b=cut('full-ellipse','positive',P(7,0,0),P(2,0,6));
 assert.deepEqual(a.counts,b.counts);
 for(const s of [32,128,256]){
  const r=run(c,plane(),{kind:'full-ellipse',sourceConfirmed:true,
   retainedHalfspace:'positive',observerDirection:P(1,0,0),samples:s});
  assert.deepEqual(a.counts,r.counts);
  assert.equal(r.runs.length,a.runs.length);
 }
});
test('09 translated and scaled physical cone preserves analytic ray classification',()=>{
 const c=cone(),original=cut();
 const moved=cone(P(100,-70,25),10,20);
 const r=cut('full-ellipse','positive',P(1,0,0),P(1,0,3),moved,12);
 assert.equal(r.status,'ready');
 assert.deepEqual(original.counts,r.counts);
 assert.ok(r.maxResidualMm<1e-6);
 rayOracle(r,moved,plane(12,P(1,0,3),moved.baseCenter));
});
test('09 invalid, unconfirmed and degenerate geometry fail closed',()=>{
 const c=cone(),p=plane();
 const denied=run(c,p,{sourceConfirmed:false,
  retainedHalfspace:'positive',observerDirection:P(1,0,0)});
 assert.equal(denied.status,'not-verified');
 assert.deepEqual(denied.runs,[]);
 assert.equal(denied.openIntervalsVerified,false);
 const apex=run(c,plane(10),{sourceConfirmed:true,
  retainedHalfspace:'positive',observerDirection:P(1,0,0)});
 assert.equal(apex.status,'not-verified');
 assert.equal(apex.visibilityVerified,false);
 assert.throws(()=>run(c,p,{sourceConfirmed:true,
  retainedHalfspace:'positive',observerDirection:P(0,0,0)}),/nonzero/);
 assert.throws(()=>run(c,p,{sourceConfirmed:true,
  retainedHalfspace:'wrong',observerDirection:P(1,0,0)}),/retained/);
 assert.throws(()=>run(c,p,{sourceConfirmed:true,
  retainedHalfspace:'positive',observerDirection:P(1,0,0),
  visibilityVerified:true}),/unrecognized/);
 assert.throws(()=>run(c,p,{sourceConfirmed:true,
  retainedHalfspace:'positive',observerDirection:P(1,0,0),
  samples:257}),/32..256/);
 const tangentPlane=run(c,plane(6,P(1,0,0)),{sourceConfirmed:true,
  retainedHalfspace:'positive',observerDirection:P(1,0,0)});
 assert.equal(tangentPlane.status,'not-verified');
});
test('09 source snapshots and return values never upgrade unknown endpoint/standards',()=>{
 const c=cone(),p=plane();
 const before=JSON.stringify([c,p]);
 const a=run(c,p,{sourceConfirmed:true,retainedHalfspace:'positive',
  observerDirection:P(1,0,0)});
 const b=run(c,p,{sourceConfirmed:true,retainedHalfspace:'positive',
  observerDirection:P(1,0,0)});
 assert.deepEqual(a,b);
 assert.equal(JSON.stringify([c,p]),before);
 assert.equal(a.globallyUnique,null);
 assert.equal(a.visibilityVerified,false);
 assert.equal(a.standardViewMappingVerified,false);
 assert.equal(a.v5LineStylesReady,false);
});