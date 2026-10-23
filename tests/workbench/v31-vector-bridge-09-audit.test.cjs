'use strict';
/** 09 independent regression matrix for the V3.1 00 reviewed SVG -> verified V5 bridge.
 * Tests target evidentiary boundaries, rather than snapshotting an answer SVG.
 */
const test=require('node:test');
const assert=require('node:assert/strict');
const {extractSvgCandidates}=require('../../recognition/vector-svg-candidates.cjs');
const {reviewCandidate}=require('../../recognition/problem-draft.cjs');
const {prepareConfirmedFillet,runConfirmedSvgFillet}=
  require('../../integration/v31-confirmed-svg-fillet-v5.cjs');

const svg=body=>'<svg width="160" height="160" viewBox="0 0 160 160">'+body+'</svg>';
function fixture(){
 const draft=extractSvgCandidates(svg(
  '<line x1="40" y1="80" x2="60" y2="80"/>'+
  '<line x1="50" y1="70" x2="50" y2="90"/>')).draft;
 return draft.candidates.reduce((d,c)=>reviewCandidate(d,{
  id:c.id,expectedRevision:d.revision,decision:'confirmed'}),draft);
}
const config=draft=>({draft,expectedRevision:draft.revision,
  calibration:{frame:'drawing-px',originPx:{x:50,y:80},mmPerPx:1,
   yAxis:'down',reviewedBy:'user',revision:draft.revision},
  kind:'two-segments',sourceIds:{first:'segment-1',second:'segment-2'},
  filletRadiusMm:3,
  selection:{branchId:'s++',direction:'ccw',
    firstTravel:'forward',secondTravel:'forward'},
  sheet:{origin:{x:350,y:220},scale:5}});

test('09 independent mathematical cross-check of actual source geometry and finite/G1 evidence',()=>{
 const input=config(fixture());
 const prep=prepareConfirmedFillet(input);
 assert.deepEqual(prep.problem.geometry,{
  first:{a:{x:-10,y:0},b:{x:10,y:0}},
  second:{a:{x:0,y:-10},b:{x:0,y:10}}});
 const out=runConfirmedSvgFillet(input);
 assert.equal(out.status,'ready');
 const e=out.typedMathEvidence;
 assert.equal(e.unit,'mm');
 assert.equal(e.branchId,input.selection.branchId);
 assert.ok(e.maxResidualMm<1e-7);
 assert.equal(e.g1Verified,true);
 assert.equal(e.finishedArcVerified,true);
 assert.equal(e.globallyUnique,null);
 assert.equal(out.revision,input.expectedRevision);
 assert.equal(out.imageProvenance.metricCalibrationMathematicallyProven,false);
});
test('09 adversarial review: discarded, unconfirmed and note are never a mathematical source',()=>{
 const input=config(fixture());
 let draft=reviewCandidate(input.draft,{
  id:'segment-2',expectedRevision:input.expectedRevision,decision:'rejected'});
 assert.throws(()=>runConfirmedSvgFillet({...input,draft,expectedRevision:draft.revision,
  calibration:{...input.calibration,revision:draft.revision}}),/user-confirmed/);
 const unreviewed=extractSvgCandidates(svg(
  '<line x1="40" y1="80" x2="60" y2="80"/>'+
  '<line x1="50" y1="70" x2="50" y2="90"/>')).draft;
 assert.throws(()=>prepareConfirmedFillet({...input,draft:unreviewed,
  expectedRevision:unreviewed.revision,calibration:{...input.calibration,revision:0}}),/unconfirmed/);
});
test('09 scale and handedness cannot silently alter a verified geometry',()=>{
 const input=config(fixture());
 const out=runConfirmedSvgFillet(input);
 assert.deepEqual(out.typedMathEvidence.center,{x:-3,y:3});
 const reflected={...input,calibration:{...input.calibration,yAxis:'up'}};
 const ref=prepareConfirmedFillet(reflected);
 assert.deepEqual(ref.problem.geometry.second,
  {a:{x:0,y:10},b:{x:0,y:-10}});
 assert.notDeepEqual(ref.problem.geometry.second,
  prepareConfirmedFillet(input).problem.geometry.second);
 assert.throws(()=>runConfirmedSvgFillet({...input,calibration:{
  ...input.calibration,mmPerPx:NaN}}),/metric scale/);
 assert.throws(()=>runConfirmedSvgFillet({...input,calibration:{
  ...input.calibration,mmPerPx:2e6}}),/metric scale/);
});
test('09 dimensional evidence: wrong diameter and unreviewed label cannot be laundered',()=>{
 let draft=extractSvgCandidates(svg(
  '<line x1="40" y1="80" x2="60" y2="80"/>'+
  '<circle cx="50" cy="85" r="8"/>'+
  '<text x="100" y="30">Φ16</text>')).draft;
 for(const c of draft.candidates.filter(c=>c.geometry)){
  draft=reviewCandidate(draft,{id:c.id,expectedRevision:draft.revision,decision:'confirmed'});
 }
 const req={...config(draft),kind:'segment-circle',
  sourceIds:{segment:'segment-1',circle:'circle-2'},
  selection:{branchId:'candidate-1',direction:'ccw',
   lineTravel:'forward',knownCircleTravel:'cw'}};
 assert.throws(()=>prepareConfirmedFillet(req),/unconfirmed/);
 const candidate=draft.candidates.find(c=>c.dimension);
 draft=reviewCandidate(draft,{id:candidate.id,expectedRevision:draft.revision,
  decision:'confirmed',patch:{dimension:{...candidate.dimension,
   value:17,unit:'mm',refs:['circle-2']}}});
 const bad={...req,draft,expectedRevision:draft.revision,
  calibration:{...req.calibration,revision:draft.revision}};
 assert.throws(()=>prepareConfirmedFillet(bad),/dimension conflicts/);
});
test('09 tampered or stale source IDs, revisions and model-mm units never reuse a verified plan',()=>{
 const input=config(fixture());
 assert.throws(()=>runConfirmedSvgFillet({...input,expectedRevision:0}),/stale/);
 assert.throws(()=>runConfirmedSvgFillet({...input,sourceIds:{
  first:'segment-2',second:'segment-2'}}),/distinct/);
 assert.throws(()=>runConfirmedSvgFillet({...input,sourceIds:{
  first:'segment-1',second:'fabricated'}}),/user-confirmed/);
 assert.throws(()=>runConfirmedSvgFillet({...input,calibration:{
  ...input.calibration,frame:'model-mm'}}),/calibration/);
 assert.throws(()=>runConfirmedSvgFillet({...input,selection:{
  ...input.selection,branchId:'fabricated-branch'}}),/branch/);
});
test('09 no branch, invalid G1 traversal and screen reprojection do not manufacture proof',()=>{
 const input=config(fixture());
 const empty=runConfirmedSvgFillet({...input,selection:{}});
 assert.equal(empty.mathematicallyVerified,false);
 assert.equal(empty.timing,null);
 assert.deepEqual(empty.steps,[]);
 const bad=runConfirmedSvgFillet({...input,selection:{
  ...input.selection,firstTravel:'reverse'}});
 assert.equal(bad.mathematicallyVerified,false);
 assert.deepEqual(bad.steps,[]);
 const a=runConfirmedSvgFillet(input);
 const b=runConfirmedSvgFillet({...input,sheet:{origin:{x:20,y:60},scale:14}});
 assert.deepEqual(a.typedMathEvidence,b.typedMathEvidence);
 assert.notDeepEqual(a.steps.at(-1).actions[0].geometry,
  b.steps.at(-1).actions[0].geometry);
});
