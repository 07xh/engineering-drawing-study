'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {buildC3WIntervalPreview:preview}=
 require('../../workbench/c3-w-ray-preview.cjs');
const {auditC3JointTopologyVisibility:joint}=
 require('../../workbench/c3-joint-topology-visibility.cjs');
const {compileFiniteCylinderEndpointV5:compile}=
 require('../../workbench/finite-cylinder-intersection-endpoint-v5.cjs');
const input=()=>({kind:'finite-orthogonal-cylinder-intersection',
 sourceConfirmed:true,unit:'mm',
 zCylinder:{radius:12,xCenter:0,yCenter:0,zMin:-18,zMax:18},
 yCylinder:{radius:9,xCenter:2,zCenter:0,yMin:-17,yMax:17}});
const sheet={origin:{x:320,y:260},scale:4};
test('real C3 W interval consumer preserves EVERY source open-ray partition',()=>{
 const source=input(),revision=17;
 const audited=joint({input:source,revision});
 const result=preview({input:source,revision});
 assert.equal(result.status,'source-bounded-W-open-ray-preview');
 assert.equal(result.sourceM3BranchCount,audited.sourceBranchCount);
 assert.equal(result.exactProjectedLateralSelfOverlapExcluded,true);
 const W=audited.intervals.filter(i=>i.view==='W');
 assert.ok(W.length>0);
 assert.equal(result.intervals.length,W.length);
 assert.ok(result.certifiedClearCount>0);
 assert.ok(result.certifiedOccludedCount>0);
 assert.equal(result.certifiedClearCount+result.certifiedOccludedCount+
  result.undeterminedCount,W.length);
 for(let i=0;i<W.length;i++){
  const p=result.intervals[i],expected=W[i];
  assert.equal(p.branchId,expected.branchId);
  assert.deepEqual(p.xOpenRange,expected.xOpenRange);
  assert.equal(p.originalM5EvidenceId,expected.originalM5EvidenceId);
  assert.equal(p.openInteriorRayStatus,expected.openInteriorStatus);
  assert.equal(p.confidenceScope,'open-interval-finite-volume-ray-only');
  assert.equal(p.transitionAndEndpointVisibilityVerified,false);
  assert.equal(p.otherProjectedContoursVerified,false);
  assert.equal(p.officialLineStyle,'undetermined');
  assert.equal(p.v5CurveActionAuthorized,false);
 }
 assert.equal(result.officialLineStylesVerified,false);
 assert.equal(result.v5CurveReady,false);
 assert.equal(Object.isFrozen(result.intervals),true);
 assert.equal(Object.isFrozen(result.intervals[0].xOpenRange),true);
});
test('same-X center real W projected depth collision blocks colored classification',()=>{
 const source=input();source.yCylinder.xCenter=source.zCylinder.xCenter;
 const r=preview({input:source,revision:9});
 assert.equal(r.status,'source-bounded-W-open-ray-preview');
 assert.equal(r.exactProjectedLateralSelfOverlapExcluded,false);
 assert.ok(r.intervals.length>0);
 assert.equal(r.certifiedClearCount,0);
 assert.equal(r.certifiedOccludedCount,0);
 assert.equal(r.undeterminedCount,r.intervals.length);
 assert.ok(r.intervals.every(i=>i.openInteriorRayStatus==='undetermined'));
});
test('source with empty finite cylinder intersection emits no W segments',()=>{
 const source=input();source.zCylinder.zMin=40;source.zCylinder.zMax=65;
 const r=preview({input:source,revision:3});
 assert.equal(r.status,'not-covered');
 assert.equal(r.intervals.length,0);
 assert.equal(r.officialLineStylesVerified,false);
 assert.equal(r.v5CurveReady,false);
});
test('new W preview never grants continuous curve V5 or alters original point engine',()=>{
 const source=input(),revision=7;
 const W=preview({input:source,revision});
 const C=compile({input:source,revision,sheetTransform:sheet,
  stationCountPerBranch:2});
 assert.ok(W.certifiedClearCount+W.certifiedOccludedCount>0);
 assert.equal(C.singleOriginalV5Player,true);
 assert.equal(C.player.canRender(revision),true);
 assert.ok(C.constructionSteps.every(s=>s.actions.every(a=>a.kind==='point')));
 assert.equal(C.entireCurveV5Ready,false);
 assert.equal(C.standardVisibleHiddenLineStylesVerified,false);
 assert.equal(C.canExportCertifiedDrawing,false);
});
test('public viewer consumes M5 interval source, not sampled ray signs',()=>{
 const js=fs.readFileSync('labs/finite-cylinder-intersection-live-entry.cjs','utf8');
 const html=fs.readFileSync('labs/finite-cylinder-intersection-live.html','utf8');
 assert.match(js,/buildC3WIntervalPreview\(\{input,revision\}\)/);
 assert.match(js,/wRayProof\.intervals/);
 assert.match(js,/wRayProof\.sourceM3BranchCount!==branches\.size/);
 assert.match(js,/strictOpen\?1e-5:0/);
 assert.match(js,/data-open-ray-status/);
 assert.match(js,/data-standard-line-style.*unverified/);
 assert.match(js,/data-official-v5.*false/);
 assert.match(html,/W 青色 \/ 橙色 \/ 紫色/);
 assert.match(html,/不是国标实虚线/);
 assert.doesNotMatch(js,/fetch\(|XMLHttpRequest|sendBeacon/);
});
