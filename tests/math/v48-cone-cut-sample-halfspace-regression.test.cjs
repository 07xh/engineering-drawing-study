'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {coneSectionVisibilityEvidence:run}=
 require('../../workbench/cone-section-visibility-evidence.cjs');
const {coneV5OpenRayEvidence,DIRS}=
 require('../../workbench/cone-open-ray-v5-mapping.cjs');
const {verifiedConeSpatialIntent}=
 require('../../workbench/verified-cone-spatial-intent.cjs');
const P=(x,y,z)=>({x,y,z});
const cone=(center=P(0,0,0),radiusMm=5,heightMm=10)=>
 ({baseCenter:center,radiusMm,heightMm,modelUnit:'mm'});
const plane=(z=6,n=P(1,0,3),center=P(0,0,0))=>({
 point:P(center.x,center.y,center.z+z),normal:n,modelUnit:'mm'});
const sheetTransform={origin:{x:340,y:240},scale:6};
const config=(kind='full-ellipse',samples=64,extra={})=>({
 kind,sourceConfirmed:true,revision:42,sheetTransform,samples,
 ...extra
});
test('09 explicit cut-solid sample results are strict local neighborhoods of the existing 04/07 arc evidence',()=>{
 for(const kind of ['full-ellipse','clipped-ellipse']){
  const z=kind==='full-ellipse'?6:1,c=cone(),p=plane(z);
  for(const samples of [32,64,128,256]){
   const options=config(kind,samples,{retainedHalfspace:'positive'});
   const got=run(c,p,options);
   assert.equal(got.status,'lateral-sample-evidence');
   assert.equal(got.cutSolidOpenRayProofConnected,true);
   assert.equal(got.visibilityVerified,false);
   const source=verifiedConeSpatialIntent(c,p,config(kind,samples));
   assert.equal(source.status,'ready');
   const trusted=coneV5OpenRayEvidence(c,p,{
    kind,samples,sourceConfirmed:true,
    retainedHalfspace:'positive',
    observerDirections:{V:{...DIRS.V},H:{...DIRS.H},W:{...DIRS.W}},
    analytic:source.spatialIntent.operation.analytic
   });
   assert.equal(got.views.V.length,samples+1);
   for(const view of ['V','H','W']){
    const L=trusted.views[view].lateral;
    for(let i=0;i<=samples;i++){
     const previous=i>0?L[i-1]:null,next=i<samples?L[i]:null;
     const confirmed=previous!==null&&next!==null&&
      previous===next&&(previous==='hidden'||previous==='visible');
     const expected=confirmed?
      (previous==='hidden'?'occluded':'visible'):'undetermined';
     const actual=got.views[view][i];
     assert.equal(actual.visibility,expected,kind+'/'+view+'/'+i);
     assert.equal(actual.openNeighborhoodVerified,confirmed);
     assert.equal(actual.endpointVisibilityVerified,false);
     assert.equal(actual.completeProjectedOcclusionVerified,false);
    }
   }
  }
 }
});
test('09 signed halfspace is essential; sampled uncut visibility remains diagnostic only',()=>{
 const c=cone(),p=plane();
 const raw=run(c,p,config()),cutPositive=run(c,p,
  config('full-ellipse',64,{retainedHalfspace:'positive'}));
 const cutNegative=run(c,p,
  config('full-ellipse',64,{retainedHalfspace:'negative'}));
 for(const view of ['V','H','W'])for(let i=0;i<=64;i++)
  assert.equal(raw.views[view][i].visibility,'undetermined');
 assert.equal(cutPositive.views.W[32].visibility,'occluded');
 assert.equal(cutNegative.views.W[32].visibility,'visible');
 assert.equal(cutPositive.views.W[32].uncutConeVisibility,
  cutNegative.views.W[32].uncutConeVisibility);
 assert.equal(cutPositive.views.W[0].visibility,'undetermined');
 assert.equal(cutNegative.views.W[64].visibility,'undetermined');
});
test('09 unconfirmed, unsupported, forged and degenerate sources fail closed',()=>{
 const c=cone(),p=plane();
 const blocked=run(c,p,{...config(),sourceConfirmed:false,
  retainedHalfspace:'positive'});
 assert.equal(blocked.status,'not-verified');
 assert.equal(blocked.views,null);
 for(const extra of [
  {retainedHalfspace:''},{retainedHalfspace:'both'},
  {visibilityVerified:true},{observerDirection:P(1,0,0)},
  {spatialIntent:{source:{visibilityVerified:true}}}
 ])assert.throws(()=>run(c,p,config('full-ellipse',64,extra)),
  /halfspace|untrusted/);
 const apex=run(c,plane(10),config('full-ellipse',64,
  {retainedHalfspace:'positive'}));
 assert.equal(apex.status,'not-verified');
 assert.equal(apex.views,null);
});
test('09 offset+scale transformation changes no cut-ray labels for known cone',()=>{
 const a=run(cone(),plane(),config('full-ellipse',64,
  {retainedHalfspace:'negative'}));
 const center=P(100,-70,25),b=run(cone(center,10,20),
  plane(12,P(1,0,3),center),
  config('full-ellipse',64,{retainedHalfspace:'negative'}));
 for(const view of ['V','H','W'])
  assert.deepEqual(a.views[view].map(x=>x.visibility),
   b.views[view].map(x=>x.visibility));
});
