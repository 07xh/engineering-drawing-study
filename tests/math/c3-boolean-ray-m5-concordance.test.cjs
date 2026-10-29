'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {auditC3BooleanRayM5Concordance:audit}=
 require('../../workbench/c3-boolean-ray-m5-concordance.cjs');
const {auditC3JointTopologyVisibility:joint}=
 require('../../workbench/c3-joint-topology-visibility.cjs');
const source=()=>({kind:'finite-orthogonal-cylinder-intersection',
 sourceConfirmed:true,unit:'mm',
 zCylinder:{radius:12,xCenter:0,yCenter:0,zMin:-18,zMax:18},
 yCylinder:{radius:9,xCenter:2,zCenter:0,yMin:-17,yMax:17}});
function fixture(operation='union'){
 const revision=11,sourceBranches=[{id:'SourceB',xRange:[0,10]}];
 const legacyIntervals=['V','H','W'].flatMap(view=>[
  {view,branchId:'SourceB',xOpenRange:[0,4],openInteriorStatus:'clear',
   sourceM3AnalyticBranchVerified:true,physicalGraphBranchAccountedFor:true,
   standardLineStyle:'undetermined',v5ActionAuthorized:false},
  {view,branchId:'SourceB',xOpenRange:[4,10],openInteriorStatus:'occluded',
   sourceM3AnalyticBranchVerified:true,physicalGraphBranchAccountedFor:true,
   standardLineStyle:'undetermined',v5ActionAuthorized:false}
 ]);
 const status=(operation==='union'?['strict-interior-ray-clear',
  'strict-interior-ray-clear','opaque-interior-ahead','opaque-interior-ahead']:
  Array(4).fill('strict-interior-ray-clear'));
 const intervals=['V','H','W'].flatMap(view=>[[0,2],[2,4],[4,7],[7,10]]
  .map((openParameterRange,i)=>({
   view,sourceId:'SourceB',edgeId:'EdgeB',sourceKind:'analytic-curve',
   parameterKind:'x',openParameterRange,
   openInteriorVolumeRayStatus:status[i],
   sourceFirstAngleRayEntireIntervalProven:true,
   standardLineStyle:'undetermined',finalV5StrokeAuthorized:false
  })));
 return {revision,sourceBranches,legacyIntervals,selectedRayEvidence:{
  schema:'draftai-c3-boolean-VHW-open-rays/1',revision,
  solidOperation:operation,intervals,undeterminedCount:0,
  fullSourceOpenEdgeRayCoverageVerified:true,
  officialLineStylesVerified:false,finalV5CurveAuthorized:false}};
}
test('exact open x partition alignment compares independently split C3 geometric and selected UNION rays',()=>{
 const result=audit(fixture());
 assert.equal(result.status,'scoped-boolean-versus-geometric-open-ray-concordance');
 assert.equal(result.checkedOpenCells,12);
 assert.equal(result.allAnalyticSourceBranchOpenCellsCrossChecked,true);
 assert.equal(result.sourceRayContradictions,0);
 assert.equal(result.viewCounts.length,3);
 assert.ok(result.viewCounts.every(x=>x.checkedOpenCells===4&&
  x.selectedOpaqueOpenCells===2&&x.selectedClearOpenCells===2));
 assert.equal(result.closedEndpointContinuityCertified,false);
 assert.equal(result.completeProjectedFeatureOcclusionCertified,false);
 assert.equal(result.officialLineStylesVerified,false);
 assert.equal(result.finalV5CurveAuthorized,false);
 assert.equal(Object.isFrozen(result.viewCounts),true);
});
test('an INTERSECTION ray may be clear although either single cylinder alone occludes',()=>{
 const result=audit(fixture('intersection'));
 assert.equal(result.checkedOpenCells,12);
 assert.equal(result.sourceRayContradictions,0);
 assert.ok(result.viewCounts.every(x=>x.selectedOpaqueOpenCells===0));
});
test('UNION cannot claim a clear ray where independent M5 says an opaque cylinder exists',()=>{
 const x=fixture('union');
 x.selectedRayEvidence.intervals[2].openInteriorVolumeRayStatus=
  'strict-interior-ray-clear';
 assert.throws(()=>audit(x),/independent Boolean and geometric M5 rays contradict/);
});
test('no selected INTERSECTION ray can be opaque if independently both cylinders are clear',()=>{
 const x=fixture('intersection');
 x.selectedRayEvidence.intervals[0].openInteriorVolumeRayStatus=
  'opaque-interior-ahead';
 assert.throws(()=>audit(x),/independent Boolean and geometric M5 rays contradict/);
});
test('a missing, overlapping or reversed C3 parameter interval cannot be silently skipped',()=>{
 for(const edit of [
  rows=>{rows[1].openParameterRange=[3,4];},
  rows=>{rows[1].openParameterRange=[1,4];},
  rows=>{rows[1].openParameterRange=[4,2];}
 ]){
  const x=fixture();
  edit(x.selectedRayEvidence.intervals.slice(0,4));
  assert.throws(()=>audit(x),/partition is incomplete or overlaps/);
 }
});
test('missing Boolean choice carries no approval and cannot borrow a previous revision',()=>{
 const x=fixture();
 x.selectedRayEvidence={
  schema:'draftai-c3-boolean-VHW-open-rays/1',revision:11,
  solidOperation:'unselected',intervals:[],
  fullSourceOpenEdgeRayCoverageVerified:false,finalV5CurveAuthorized:false};
 const blocked=audit(x);
 assert.equal(blocked.status,'boolean-ray-proof-not-available');
 assert.equal(blocked.checkedOpenCells,0);
 assert.equal(blocked.finalV5CurveAuthorized,false);
 x.selectedRayEvidence.revision=10;
 assert.throws(()=>audit(x),/current independent C3/);
});
test('real finite-cylinder C3 graph cross-checks union and intersection from actual M3 and M5',()=>{
 for(const operation of ['union','intersection']){
  const result=joint({input:source(),revision:26,solidOperation:operation});
  const proof=result.booleanRayConcordance;
  assert.equal(proof.status,'scoped-boolean-versus-geometric-open-ray-concordance');
  assert.equal(proof.solidOperation,operation);
  assert.equal(proof.allAnalyticSourceBranchOpenCellsCrossChecked,true);
  assert.equal(proof.sourceRayContradictions,0);
  assert.ok(proof.checkedOpenCells>=result.sourceBranchCount*3);
  assert.equal(proof.officialLineStylesVerified,false);
  assert.equal(result.v5CurveReady,false);
 }
 const pending=joint({input:source(),revision:27});
 assert.equal(pending.booleanRayConcordance.status,'boolean-ray-proof-not-available');
 assert.equal(pending.officialLineStylesVerified,false);
});
