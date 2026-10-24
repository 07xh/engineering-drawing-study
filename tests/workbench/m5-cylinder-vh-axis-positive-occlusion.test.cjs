'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {auditFiniteCylinderVHAxisRays}=
 require('../../workbench/m5-finite-cylinder-vh-axis-rays.cjs');
const {compileFiniteCylinderEndpointV5}=
 require('../../workbench/finite-cylinder-intersection-endpoint-v5.cjs');
const {FIRST_ANGLE_OBSERVER_RAYS}=require('../../core/projection/conventions.js');
const model=()=>({
 kind:'finite-orthogonal-cylinder-intersection',unit:'mm',sourceConfirmed:true,
 zCylinder:{radius:10,xCenter:0,yCenter:0,zMin:-15,zMax:15},
 yCylinder:{radius:6,xCenter:0,zCenter:0,yMin:-15,yMax:15}
});
const audit=(input=model(),revision=19)=>
 auditFiniteCylinderVHAxisRays({input,revision});
function independentPositiveRayCheck(input,row){
 if(!row.positiveOpaqueVolumeAheadForEveryOpenCurvePoint)return;
 const Z=input.zCylinder,Y=input.yCylinder;
 const x=(row.xOpenRange[0]+row.xOpenRange[1])/2;
 const y=Z.yCenter+row.sourceSignY*
  Math.sqrt(Math.max(0,Z.radius**2-(x-Z.xCenter)**2));
 const z=Y.zCenter+row.sourceSignZ*
  Math.sqrt(Math.max(0,Y.radius**2-(x-Y.xCenter)**2));
 const t=Math.min(0.02,
  row.view==='V'?Math.max(0,(y-Z.yCenter)/4):
   Math.max(0,(Y.zCenter-z)/4));
 assert.ok(t>0);
 const ray=FIRST_ANGLE_OBSERVER_RAYS[row.view];
 const next={x:x+t*ray.x,y:y+t*ray.y,z:z+t*ray.z};
 if(row.view==='V'){
  const residual=(next.x-Z.xCenter)**2+
   (next.y-Z.yCenter)**2-Z.radius**2;
  assert.ok(residual<0,'strict opaque Z volume ahead of V branch');
  assert.ok(z>Z.zMin&&z<Z.zMax);
  assert.equal(row.sourceOccluderId,'zCylinder');
 }else{
  const residual=(next.x-Y.xCenter)**2+
   (next.z-Y.zCenter)**2-Y.radius**2;
  assert.ok(residual<0,'strict opaque Y volume ahead of H branch');
  assert.ok(y>Y.yMin&&y<Y.yMax);
  assert.equal(row.sourceOccluderId,'yCylinder');
 }
}
test('C3 M5 default: four signed source branches => 8 V/H source intervals; 4 strictly occluded, 4 unsigned generators',()=>{
 const input=model(),r=audit(input);
 assert.equal(r.status,'scoped-analytic-VH-strict-volume-occlusion');
 assert.equal(r.sourceBranchCount,4);
 assert.equal(r.intervalCount,8);
 assert.equal(r.certifiedOccludedCount,4);
 assert.equal(r.generatorOrCapUndeterminedCount,4);
 assert.equal(r.sourceBranchCoverageVerified,true);
 assert.equal(r.officialLineStylesVerified,false);
 assert.equal(r.completeCurveV5Ready,false);
 assert.ok(Object.isFrozen(r.intervals));
 assert.deepEqual(r.intervals.map(row=>row.view).sort(),
  ['H','H','H','H','V','V','V','V']);
 for(const row of r.intervals){
  assert.deepEqual(row.xOpenRange,[-6,6]);
  assert.deepEqual(row.observerDirection,
   FIRST_ANGLE_OBSERVER_RAYS[row.view]);
  assert.equal(row.officialSolidDashedLineStyle,'undetermined');
  assert.equal(row.v5LineActionAuthorized,false);
  assert.equal(row.positiveOpenViewerRayClearVerified,false);
  assert.equal(row.originalCurveEndpointJunctionsVerified,false);
  const shouldOcclude=row.view==='V'?
   row.sourceSignY===1:row.sourceSignZ===-1;
  assert.equal(row.positiveOpaqueVolumeAheadForEveryOpenCurvePoint,
   shouldOcclude);
  independentPositiveRayCheck(input,row);
 }
});
test('C3 M5 signed rays are translation-invariant and support unequal axes/radii',()=>{
 const input=model();
 input.zCylinder.radius=8;
 input.zCylinder.xCenter=3;input.zCylinder.yCenter=-7;
 input.yCylinder.xCenter=-2;input.yCylinder.zCenter=15;
 input.zCylinder.zMin=-30;input.zCylinder.zMax=30;
 input.yCylinder.yMin=-30;input.yCylinder.yMax=30;
 const r=audit(input,20);
 assert.equal(r.sourceBranchCount,4);
 assert.equal(r.certifiedOccludedCount,4);
 assert.equal(r.generatorOrCapUndeterminedCount,4);
 for(const row of r.intervals)independentPositiveRayCheck(input,row);
});
test('C3 M5 strict-cap guard refuses V occlusion when Z finite caps trim analytic z radicals',()=>{
 const input=model();
 input.zCylinder.zMin=-2;input.zCylinder.zMax=2;
 const r=audit(input);
 assert.equal(r.status,'scoped-analytic-VH-strict-volume-occlusion');
 assert.ok(r.sourceBranchCount>0);
 const allV=r.intervals.filter(x=>x.view==='V');
 assert.ok(allV.length>0);
 assert.ok(allV.every(x=>x.positiveOpaqueVolumeAheadForEveryOpenCurvePoint===false));
 assert.ok(allV.every(x=>x.officialSolidDashedLineStyle==='undetermined'));
});
test('C3 M5 strict-cap guard refuses H occlusion where finite Y axial caps clip y radicals',()=>{
 const input=model();
 input.yCylinder.yMin=9;input.yCylinder.yMax=11;
 const r=audit(input);
 assert.equal(r.status,'scoped-analytic-VH-strict-volume-occlusion');
 assert.ok(r.sourceBranchCount>0);
 assert.ok(r.intervals.filter(x=>x.view==='H').every(x=>
  !x.positiveOpaqueVolumeAheadForEveryOpenCurvePoint));
 assert.equal(r.officialLineStylesVerified,false);
});
test('C3 axial cap touches a radical at an INTERIOR stationary X: no unsafe full V visibility theorem',()=>{
 const input=model();
 input.zCylinder.zMax=6; // z=6 at interior x=0 on positive Z branch
 const r=audit(input);
 assert.equal(r.status,'scoped-analytic-VH-strict-volume-occlusion');
 for(const row of r.intervals.filter(x=>
  x.view==='V'&&x.sourceSignZ===1)){
  assert.equal(row.strictlyInteriorToOccludingCylinderCapsForWholeBranch,false);
  assert.equal(row.positiveOpaqueVolumeAheadForEveryOpenCurvePoint,false);
 }
});
test('C3 M5 no intersection, tangent and forged model cannot be used to authorize curve strokes',()=>{
 const none=model();none.yCylinder.xCenter=30;
 assert.equal(audit(none).status,'not-covered');
 const tangent=model();tangent.yCylinder.xCenter=16;
 assert.equal(audit(tangent).status,'not-covered');
 const unconfirmed=model();unconfirmed.sourceConfirmed=false;
 assert.throws(()=>audit(unconfirmed),/confirmed/);
 const px=model();px.unit='px';
 assert.throws(()=>audit(px),/confirmed/);
 const fake=model();fake.officialLineStylesVerified=true;
 assert.throws(()=>audit(fake),/confirmed/);
 assert.throws(()=>audit(model(),-1),/revision/);
});
test('C3 existing authentic endpoint point DAG/V5 receives V/H proof but no curve steps or standard lines',()=>{
 const p=compileFiniteCylinderEndpointV5({input:model(),revision:21,
  sheetTransform:{origin:{x:340,y:200},scale:3}});
 assert.equal(p.continuousCurveWRayEvidence.status,'source-bounded-W-open-rays');
 const evidence=p.continuousCurveVHAxisRayEvidence;
 assert.equal(evidence.status,'scoped-analytic-VH-strict-volume-occlusion');
 assert.equal(evidence.sourceBranchCount,4);
 assert.equal(evidence.certifiedOccludedCount,4);
 assert.equal(evidence.revision,p.revision);
 assert.equal(evidence.officialLineStylesVerified,false);
 assert.equal(evidence.completeCurveV5Ready,false);
 assert.equal(p.entireCurveV5Ready,false);
 assert.equal(p.singleOriginalV5Player,true);
 assert.ok(p.constructionSteps.every(s=>s.actions.every(a=>a.kind==='point')));
 assert.ok(!p.constructionIntents.some(i=>i.operations.some(a=>
  ['line','curve','polyline','arc'].includes(a.kind))));
});
