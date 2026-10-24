'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {auditFiniteCylinderWRayIntervals}=require('../../workbench/m5-finite-cylinder-w-ray-intervals.cjs');
const {compileFiniteCylinderEndpointV5}=require('../../workbench/finite-cylinder-intersection-endpoint-v5.cjs');
function model(){return {
 kind:'finite-orthogonal-cylinder-intersection',unit:'mm',sourceConfirmed:true,
 zCylinder:{radius:10,xCenter:0,yCenter:0,zMin:-15,zMax:15},
 yCylinder:{radius:6,xCenter:0,zCenter:0,yMin:-15,yMax:15}
};}
const audit=(input=model(),revision=8)=>
 auditFiniteCylinderWRayIntervals({input,revision});
function independentRayCheck(input,item){
 const x=(item.xOpenRange[0]+item.xOpenRange[1])/2;
 const Z=input.zCylinder,Y=input.yCylinder;
 const y=Z.yCenter+item.sourceSignY*Math.sqrt(Z.radius**2-(x-Z.xCenter)**2);
 const z=Y.zCenter+item.sourceSignZ*Math.sqrt(Y.radius**2-(x-Y.xCenter)**2);
 assert.ok(y>Y.yMin&&y<Y.yMax);
 assert.ok(z>Z.zMin&&z<Z.zMax);
 const t=Math.min(0.05,0.05*(item.xOpenRange[1]-item.xOpenRange[0]));
 const dz=(x+t-Z.xCenter)**2+(y-Z.yCenter)**2-Z.radius**2;
 const dy=(x+t-Y.xCenter)**2+(z-Y.zCenter)**2-Y.radius**2;
 if(item.positiveViewerRayClearVerified)
  assert.ok(dz>0&&dy>0,'no volume lies in front of the open curve point');
 if(item.positiveOtherSolidInteriorAheadVerified)
  assert.ok(dz<0||dy<0,'at least one solid is immediately in front');
}
test('M5 W +x observer theorem classifies FULL open arcs on both sides, never V/H',()=>{
 const input=model(),r=audit(input);
 assert.equal(r.status,'source-bounded-W-open-rays');
 assert.equal(r.sourceBranchCount,4);
 assert.equal(r.intervalCount,8);
 assert.equal(r.certifiedOpenVisibleCount,4);
 assert.equal(r.certifiedOpenOccludedCount,4);
 assert.equal(r.undeterminedCount,0);
 assert.equal(r.sourceBranchCoverageVerified,true);
 assert.equal(r.viewCoverage.V,'undetermined-generator-direction');
 assert.equal(r.viewCoverage.H,'undetermined-generator-direction');
 assert.equal(r.viewCoverage.W,'scoped-open-interior-certified');
 assert.equal(r.continuousCurveV5Ready,false);
 assert.equal(r.standardLineStylesVerified,false);
 assert.ok(Object.isFrozen(r.intervals));
 for(const a of r.intervals){
  if(a.positiveViewerRayClearVerified)assert.deepEqual(a.xOpenRange,[0,6]);
  else assert.deepEqual(a.xOpenRange,[-6,0]);
  assert.equal(a.originalCurveEndpointJoinsVerified,false);
  assert.equal(a.officialVisibleHiddenStrokeVerified,false);
  assert.equal(a.V5LineActionAuthorized,false);
  independentRayCheck(input,a);
 }
});
test('M5 independent translated axis parameters still partition at BOTH axes centers',()=>{
 const input=model();
 input.zCylinder.radius=8;input.zCylinder.xCenter=3;input.zCylinder.yCenter=-4;
 input.yCylinder.xCenter=-2;input.yCylinder.zCenter=7;
 input.yCylinder.yMin=-30;input.yCylinder.yMax=30;
 input.zCylinder.zMin=-30;input.zCylinder.zMax=30;
 const r=audit(input);
 assert.equal(r.sourceBranchCount,4);
 assert.equal(r.intervalCount,12);
 assert.equal(r.certifiedOpenVisibleCount,4);
 assert.equal(r.certifiedOpenOccludedCount,8);
 for(const it of r.intervals)independentRayCheck(input,it);
});
test('M5 cap cropping and disconnected source-curve branches do not invent hidden spans',()=>{
 const input=model();
 input.zCylinder.zMin=0;input.zCylinder.zMax=3;
 input.yCylinder.yMin=0;input.yCylinder.yMax=20;
 const r=audit(input);
 assert.equal(r.sourceBranchCount,2);
 assert.equal(r.sourceBranchCoverageVerified,true);
 assert.equal(r.continuousCurveV5Ready,false);
 for(const it of r.intervals)independentRayCheck(input,it);
});
test('M5 no curve / tangent source keeps all line style authority blocked',()=>{
 const none=model();none.yCylinder.xCenter=30;
 const n=audit(none);
 assert.equal(n.status,'not-covered');
 assert.equal(n.intervalCount,0);
 assert.equal(n.standardLineStylesVerified,false);
 const touch=model();touch.yCylinder.xCenter=16;
 assert.equal(audit(touch).status,'not-covered');
 const cap=model();cap.yCylinder.yMin=10;cap.yCylinder.yMax=11;
 assert.equal(audit(cap).status,'not-covered');
});
test('M5 proof cannot be forged by flags, screenshots, stale revisions or bogus units',()=>{
 const x=model();x.sourceConfirmed=false;
 assert.throws(()=>audit(x),/confirmed/);
 const y=model();y.v5Ready=true;
 assert.throws(()=>audit(y),/confirmed/);
 const z=model();z.unit='px';
 assert.throws(()=>audit(z),/confirmed/);
 assert.throws(()=>audit(model(),-1),/revision/);
});
test('M5 evidence attaches to the ORIGINAL endpoint point V5 without promoting curve actions',()=>{
 const p=compileFiniteCylinderEndpointV5({input:model(),revision:5,
  sheetTransform:{origin:{x:340,y:200},scale:3}});
 const e=p.continuousCurveWRayEvidence;
 assert.equal(e.status,'source-bounded-W-open-rays');
 assert.equal(e.certifiedOpenVisibleCount,4);
 assert.equal(e.certifiedOpenOccludedCount,4);
 assert.equal(e.revision,5);
 assert.equal(e.standardLineStylesVerified,false);
 assert.equal(p.entireCurveV5Ready,false);
 assert.ok(p.constructionSteps.every(s=>s.actions.every(a=>a.kind==='point')));
 assert.ok(!p.constructionIntents.some(i=>i.operations.some(a=>a.kind==='line')));
 assert.equal(p.singleOriginalV5Player,true);
});
