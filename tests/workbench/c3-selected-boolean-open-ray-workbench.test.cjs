'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {auditC3SelectedBooleanVHWOpenRays:audit}=
 require('../../workbench/c3-selected-boolean-vhw-open-rays.cjs');
const src=()=>({kind:'finite-orthogonal-cylinder-intersection',
 sourceConfirmed:true,unit:'mm',
 zCylinder:{radius:12,xCenter:0,yCenter:0,zMin:-18,zMax:18},
 yCylinder:{radius:9,xCenter:2,zCenter:0,yMin:-17,yMax:17}});
test('W selected-Boolean ray status lookup resolves only a unique current analytic source interval',()=>{
 const model=src(),a=audit({input:model,revision:7,solidOperation:'intersection'});
 const b=audit({input:model,revision:7,solidOperation:'union'});
 const W=a.intervals.filter(x=>x.view==='W'&&x.sourceKind==='analytic-curve');
 assert.ok(W.length>0);
 const changed=W.find(row=>{
  const counterpart=b.intervals.find(s=>
   s.edgeId===row.edgeId&&s.view===row.view&&
   s.openParameterRange[0]===row.openParameterRange[0]&&
   s.openParameterRange[1]===row.openParameterRange[1]);
  return counterpart&&counterpart.openInteriorVolumeRayStatus!==
   row.openInteriorVolumeRayStatus;
 });
 assert.ok(changed,'selected solid Boolean operation must materially alter W ray evidence');
 assert.equal(changed.openInteriorVolumeRayStatus,'strict-interior-ray-clear');
 const other=b.intervals.find(s=>s.edgeId===changed.edgeId&&
  s.view==='W'&&s.openParameterRange[0]===changed.openParameterRange[0]);
 assert.equal(other.openInteriorVolumeRayStatus,'opaque-interior-ahead');
});
test('actual C3 viewer consumes selected ray, preserves projection-overlap demotion and never certifies V5 line style',()=>{
 const js=fs.readFileSync('labs/finite-cylinder-intersection-live-entry.cjs','utf8');
 const html=fs.readFileSync('labs/finite-cylinder-intersection-live.html','utf8');
 const gate=fs.readFileSync('workbench/c3-m0-m3-m5-analytic-source-acceptance.cjs','utf8');
 assert.match(js,/auditC3M0M3M5AnalyticSources\(\{/);
 assert.match(js,/selectedBooleanRayProof=originalSourceAcceptance\.booleanM5RayProof/);
 assert.match(gate,/auditC3SelectedBooleanVHWOpenRays\(\{/);
 assert.match(gate,/input,revision,solidOperation/);
 assert.match(gate,/dotObject3\(zGrad,observer\)/);
 assert.match(js,/selectedWRayTopologyClear=wRayProof\.exactProjectedLateralSelfOverlapExcluded/);
 assert.match(js,/projectedSourceOutlineEventsSeparatedAtWBoundaries===true/);
 assert.match(js,/matches\.length!==1\)return 'undetermined'/);
 assert.match(js,/scopedWRayStatus\(WProof\.branchId/);
 assert.match(js,/scopedWRayStatus\(branch\.id/);
 assert.match(js,/data-selected-Boolean-ray/);
 assert.match(js,/selectedBooleanRayProof\.certifiedOpaqueCount/);
 assert.match(js,/selectedBooleanRayProof=null;selectedWRayTopologyClear=false/);
 assert.match(html,/切换 W 视图的相应证据色/);
 assert.match(html,/投影重合、曲线端点、最终轮廓及国标线型仍未认证/);
 assert.doesNotMatch(js,/data-official-line-style.*true/);
});
