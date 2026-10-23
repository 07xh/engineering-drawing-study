'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {continuousConeLateralVisibility:analytic}=require('../../workbench/cone-continuous-lateral-visibility.cjs');
const {coneSectionVisibilityEvidence:ray}=require('../../workbench/cone-section-visibility-evidence.cjs');
const cone={baseCenter:{x:0,y:0,z:0},radiusMm:5,heightMm:10,modelUnit:'mm'};
const sheetTransform={origin:{x:340,y:240},scale:6};
const planes=[
 {kind:'full-ellipse',point:{x:0,y:0,z:6},normal:{x:1,y:0,z:3}},
 {kind:'clipped-ellipse',point:{x:0,y:0,z:1},normal:{x:1,y:0,z:3}},
 {kind:'full-ellipse',point:{x:0,y:0,z:6},normal:{x:0,y:0,z:1}}
];
for(const [index,spec] of planes.entries()){
 test('independent ray classifications match analytic intervals '+index,()=>{
  const plane={point:spec.point,normal:spec.normal,modelUnit:'mm'};
  const options={kind:spec.kind,sourceConfirmed:true,revision:21,sheetTransform,samples:128};
  const a=analytic(cone,plane,options),r=ray(cone,plane,options);
  assert.equal(a.status,'analytic-lateral-intervals');
  assert.equal(r.status,'lateral-sample-evidence');
  const [lo,hi]=a.spatialIntent.operation.analytic.parameterRadians;
  for(const view of ['V','H','W']){
   for(let i=0;i<r.views[view].length;i++){
    const sample=r.views[view][i];
    if(sample.visibility==='undetermined')continue;
    const theta=lo+(hi-lo)*i/(r.views[view].length-1);
    const segment=a.views[view].find(s=>theta>=s.fromRadians-1e-9&&theta<=s.toRadians+1e-9);
    assert.ok(segment,'missing analytic visibility interval '+view+' '+i);
    assert.equal(segment.visibility,sample.visibility,view+' index '+i);
   }
  }
 });
}
