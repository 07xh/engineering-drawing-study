'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const Timeline=require('../../workbench/teaching-timeline-v5.js');
const {inspectC1CanonicalV5Step:inspect}=
 require('../../workbench/c1-canonical-v5-step-evidence.cjs');
const visible='gb-t-4457.4-continuous-wide-visible-outline';
function fixture(){
 const steps=[
  {id:'given_0',dependsOn:[],title:'核对原题的第一个点',
   explanation:'从原题已确认的投影位置标记该点。',
   actions:[{id:'p_0',kind:'point'}]},
  {id:'guide_1',dependsOn:['given_0'],title:'传递投影辅助线',
   actions:[{id:'g_1',kind:'line'}]},
  {id:'edge_2',dependsOn:['guide_1'],title:'签收实体的真实可见边',
   explanation:'已核对 M5 原始棱线及连续遮挡。',
   actions:[{id:'edge_2_action',kind:'line',engineeringLineStyle:visible}]}
 ];
 const timeline=Timeline.compileTimeline(steps);
 const player=Timeline.createPlayer(timeline,{revision:9});
 const solution={revision:9,singleOriginalV5Player:true,player,steps,timeline,
  intents:[{id:'given_0',source:{solver:'mathematical-c1-projection',
   proofScope:'reviewed-point'}},{id:'guide_1',source:{solver:'original-03',
   proofScope:'point-projection-only'}},{id:'edge_2',source:{solver:'M0-M5',
   proofScope:'closed-convex-signed-edge'}}],
  certifiedVisibleContourLineBindings:[],
  certifiedPhysicalLineBindings:[{actionId:'edge_2_action',revision:9,
   signedFormalLineV5:true,sourceEdgeId:'Tetra::A|C',view:'W',
   standardLineStyle:visible,originalParameterRange:[0,1]}]
 };
 return {solution,revision:9,frame:player.snapshot()};
}
test('only existing first V5 frame shows its actual DAG title and actual mathematical text',()=>{
 const data=fixture(),r=inspect(data);
 assert.equal(r.id,'given_0');
 assert.equal(r.stepNumber,1);assert.equal(r.totalSteps,3);
 assert.equal(r.title,'核对原题的第一个点');
 assert.equal(r.explanation,'从原题已确认的投影位置标记该点。');
 assert.equal(r.actions[0].formalLineCertified,false);
 assert.equal(r.actions[0].kind,'point');
 assert.equal(r.actions[0].progress,0);
 assert.deepEqual(r.dependsOn,[]);
 assert.equal(r.registeredProofSourceSolver,'mathematical-c1-projection');
 assert.equal(r.wholeTextbookC1BlindAccepted,false);
});
test('changing sole player to actual guide step never upgrades an auxiliary line to signed stroke',()=>{
 const f=fixture();f.solution.player.seekStep(1,20);
 const r=inspect({...f,frame:f.solution.player.snapshot()});
 assert.equal(r.stepNumber,2);assert.equal(r.explanation,null);
 assert.equal(r.explanationVerifiedAvailable,false);
 assert.deepEqual(r.dependsOn,['given_0']);
 assert.equal(r.actions[0].formalLineCertified,false);
 assert.equal(r.actions[0].officialLineStyle,null);
});
test('actual M5 binding makes a signed physical source traceable only at its existing step',()=>{
 const f=fixture();f.solution.player.seekStep(2,20);
 const r=inspect({...f,frame:f.solution.player.snapshot()});
 assert.equal(r.id,'edge_2');
 assert.equal(r.actions[0].formalLineCertified,true);
 assert.equal(r.actions[0].officialLineStyle,visible);
 assert.equal(r.actions[0].originalSourceEdgeId,'Tetra::A|C');
 assert.deepEqual(r.actions[0].sourceParameterRange,[0,1]);
 assert.deepEqual(r.dependsOn,['guide_1']);
});
test('stale revision, forged source, orphan actions, duplicate bindings and unsigned GB line are held',()=>{
 const base=fixture(),bad=edit=>{const f=fixture();edit(f);return()=>inspect(f);};
 assert.throws(()=>inspect({...base,revision:8}),/source-current/);
 assert.throws(bad(f=>{f.solution.singleOriginalV5Player=false;}),/source-current/);
 assert.throws(bad(f=>{f.frame.activeStepIndex=2;}),/active step|frame fractions/);
 assert.throws(bad(f=>{f.solution.certifiedPhysicalLineBindings[0].revision=8;}),/signed source/);
 assert.throws(bad(f=>{f.solution.certifiedPhysicalLineBindings.push(
  {...f.solution.certifiedPhysicalLineBindings[0]});}),/signed source/);
 assert.throws(bad(f=>{f.solution.certifiedPhysicalLineBindings=[];}),/unbound engineering/);
 assert.throws(bad(f=>{f.solution.steps[0].actions[0].engineeringLineStyle=visible;}),/unbound engineering/);
 assert.throws(bad(f=>{f.solution.certifiedPhysicalLineBindings[0].standardLineStyle=
  'arbitrary';}),/signed source/);
 assert.throws(bad(f=>{f.solution.certifiedPhysicalLineBindings[0].sourceEdgeId='';}),/signed source/);
 assert.throws(bad(f=>{f.solution.steps[2].actions[0].id='unknown_action';}),/V5 action/);
 assert.throws(bad(f=>{f.frame.invalid=true;}),/source-current/);
});
test('frame zero rejects future line, forged completed action, extra action and foreign timeline before paint',()=>{
 const corrupt=[
  f=>{f.frame.actionFractions.edge_2_action=1;},
  f=>{f.frame.completedIds.push('edge_2_action');},
  f=>{f.frame.actionFractions.future_answer=1;},
  f=>{f.frame.elapsedMs=f.solution.timeline.totalMs;},
  f=>{f.solution.timeline={...f.solution.timeline};}
 ];
 for(const mutate of corrupt){
  const f=fixture();mutate(f);
  assert.throws(()=>inspect(f),/canonical|source-current|frame fractions/);
 }
 const f=fixture();
 f.solution.player.seekStep(2,20);
 const legitimate=inspect({...f,frame:f.solution.player.snapshot()});
 assert.equal(legitimate.actions[0].formalLineCertified,true);
 assert.equal(legitimate.stepIndex,2);
});
test('real independently compiled DXF reviewed tetra uses exact same signed/unsigned canonical V5 DAG',async()=>{
 const {compileReviewedC1DxfGivenToSoleV5}=require(
  '../../workbench/c1-authenticated-dxf-to-reviewed-v5.cjs');
 const {project}=require('../../core/projection/conventions.js');
 const xyz=[{x:0,y:0,z:0},{x:2,y:1,z:2},{x:4,y:3,z:7},{x:6,y:6,z:5}];
 const sourceSha256='a'.repeat(64),convertedDxfSha256='b'.repeat(64);
 const packet={schema:'draftai-c1-authenticated-dxf-reviewed-given/1',
  sourceSha256,convertedDxfSha256,
  views:Object.fromEntries(['V','H'].map(v=>[v,xyz.map(p=>project(p)[v])])),
  givenOriginalHandleEndpoints:Object.fromEntries(['V','H'].map(v=>[
   v,xyz.map((_,i)=>({handle:v+(i+1),endpoint:'point'}))
  ])),
  missingView:'W',
  assumedScope:'all-extreme-vertices-of-one-closed-convex-opaque-solid',
  humanSelectedFullExtremeVertexSet:true,
  originalSourceCompletenessIndependentlyProved:false,
  sourceImageRecognitionVerified:false,referenceWasNotExportedAsSolverInput:true,
  sourceIsNotYetConfirmedForProduction:true,textbookBlindSolveAccepted:false
 };
 const compiled=await compileReviewedC1DxfGivenToSoleV5({
  givenPacket:packet,geometryId:'C1ReviewedVX',revision:4,
  confirmedReview:{sourceSha256,convertedDxfSha256,
   confirmedCurrentRevision:4,confirmedGeometryId:'C1ReviewedVX',
   originalGivenPointSetsChecked:true,allOriginalExtremeVerticesPresentChecked:true,
   closedConvexFaceAndEdgeTopologyReviewed:true,
   referenceAnswerWasNotUsedToConfirmTopology:true,
   explicitReviewedInputKind:'human-reviewed-original-candidate'
  },sheetTransform:{origin:{x:360,y:265},scale:4}
 });
 const s=compiled.solution;
 const first=inspect({solution:s,revision:4,frame:s.player.snapshot()});
 assert.equal(first.totalSteps,s.steps.length);
 assert.equal(first.id,s.steps[0].id);
 assert.equal(first.actions.length,s.steps[0].actions.length);
 assert.equal(first.wholeTextbookC1BlindAccepted,false);
 s.player.seekStep(s.steps.length-1,1);
 const last=inspect({solution:s,revision:4,frame:s.player.snapshot()});
 assert.equal(last.stepNumber,s.steps.length);
 assert.equal(last.id,s.steps.at(-1).id);
 assert.equal(last.singleCanonicalPlayerUsed,true);
 assert.ok(last.options.every((step,i)=>step.id===s.steps[i].id));
});
