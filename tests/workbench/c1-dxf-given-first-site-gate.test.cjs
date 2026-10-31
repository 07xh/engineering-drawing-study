'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const {project,toSheet,VIEWS}=require('../../core/projection/conventions.js');
const {buildC1DxfGivenFirstPaper:givenOnly}=
 require('../../workbench/c1-dxf-given-first-paper.cjs');
const physical=[
 {x:0,y:0,z:0},{x:2,y:1,z:2},{x:4,y:3,z:7},{x:6,y:6,z:5}
];
const make=(known=['V','H'])=>({
 schema:'draftai-c1-authenticated-dxf-reviewed-given/1',
 sourceSha256:'a'.repeat(64),convertedDxfSha256:'b'.repeat(64),
 views:Object.fromEntries(known.map(v=>[v,physical.map(p=>project(p)[v])])),
 givenOriginalHandleEndpoints:Object.fromEntries(known.map(v=>[
  v,physical.map((_,i)=>({handle:v+(i+1),endpoint:'point'}))
 ])),
 missingView:VIEWS.find(v=>!known.includes(v)),
 assumedScope:'all-extreme-vertices-of-one-closed-convex-opaque-solid',
 humanSelectedFullExtremeVertexSet:true,
 originalSourceCompletenessIndependentlyProved:false,
 sourceImageRecognitionVerified:false,
 referenceWasNotExportedAsSolverInput:true,
 sourceIsNotYetConfirmedForProduction:true,
 textbookBlindSolveAccepted:false
});
for(const known of [['V','H'],['V','W'],['H','W']]){
 test('first C1 GIVEN paper '+known.join('/')+' leaves missing view structurally blank',()=>{
  const packet=make(known),paper=givenOnly(packet);
  assert.deepEqual(paper.knownViewPair,[...known].sort());
  assert.equal(paper.missingView,packet.missingView);
  assert.equal(paper.views[packet.missingView].sourceRole,'UNKNOWN');
  assert.deepEqual(paper.views[packet.missingView].points,[]);
  assert.equal(paper.views[packet.missingView].state,
   'intentionally-blank-missing-view');
  for(const view of known){
   assert.equal(paper.views[view].sourceRole,'GIVEN');
   assert.equal(paper.views[view].points.length,4);
   for(const row of paper.views[view].points){
    assert.deepEqual(row.uv,packet.views[view][row.index]);
    assert.deepEqual(row.paper,toSheet(view,row.uv,paper.transform));
    assert.equal(row.originalCADSourceHandle,view+(row.index+1));
    assert.equal(row.originalCADSourceEndpoint,'point');
   }
  }
  assert.equal(paper.candidateGeometryAvailable,false);
  assert.equal(paper.recoveredMissingPaperPoints,0);
  assert.equal(paper.derived3DEdges,0);
  assert.equal(paper.formalEngineeringLinesCertified,false);
  assert.equal(paper.officialV5Authorized,false);
  assert.ok(Object.isFrozen(paper.views[known[0]].points[0].paper));
  // Even if the candidate M3 was solved elsewhere, it is NOT an input.
  assert.equal(paper.originalPointCloudIsNotOriginalDXFStrokeTopology,true);
 });
}
test('bad or answer-bearing source never enters GIVEN-only UI',()=>{
 for(const mutate of [
  p=>{p.referenceStrokes=[{foo:'answer'}];},
  p=>{p.textbookBlindSolveAccepted=true;},
  p=>{p.missingView='V';},
  p=>{p.views.H[0].u=Infinity;},
  p=>{p.givenOriginalHandleEndpoints.V[0].handle='../unsafe';}
 ]){
  const p=make();mutate(p);
  assert.throws(()=>givenOnly(p),/packet|given|answer|original|source|point|two known|DXF|invalid|unsigned|source/i);
 }
});
test('real C1 local review page refuses automatic guessed missing-view preview',()=>{
 const html=fs.readFileSync('labs/c1-reviewed-dxf-live.html','utf8');
 const script=fs.readFileSync('labs/c1-reviewed-dxf-live-entry.cjs','utf8');
 new vm.Script(script,{filename:'c1-reviewed-dxf-live-entry.cjs'});
 for(const id of ['showGiven','showCandidate','paperMode'])
  assert.equal((html.match(new RegExp('id="'+id+'"','g'))||[]).length,1);
 assert.match(html,/<button id="showCandidate"[^>]*disabled>/);
 assert.match(html,/原题已知视图（默认）/);
 assert.match(script,/buildC1DxfGivenFirstPaper\(rawGiven\)/);
 assert.match(script,/'data-c1-unanswered-view':view/);
 assert.match(script,/'data-c1-paper-mode':'given'/);
 assert.match(script,/'data-c1-paper-mode':'unsigned-candidate'/);
 assert.match(script,/\$\('showCandidate'\)\.addEventListener\('click'/);
 assert.match(script,/\$\('showGiven'\)\.addEventListener\('click'/);
 assert.doesNotMatch(script,/renderCandidate\(inferred,projectCandidate\(inferred\)\)/);
 assert.doesNotMatch(script,/\bfetch\(|\blocalStorage\.|sessionStorage\.|XMLHttpRequest/);
});
