'use strict';
/**
 * 09 independent verification: existing M3 cone open-ray intervals (#432)
 * may annotate original 07 V5 actions, never promote silhouette endpoints,
 * polygonal chords, unknown observers or legacy unconfirmed plans.
 */
const test=require('node:test');
const assert=require('node:assert/strict');
const {coneSpatialV5Preview:run}=
 require('../../workbench/cone-spatial-v5-preview.cjs');
const {coneV5OpenRayEvidence,DIRS}=
 require('../../workbench/cone-open-ray-v5-mapping.cjs');
const Timeline=require('../../workbench/teaching-timeline-v5.js');
const Motion=require('../../workbench/teaching-motion-v5.js');
const P=(x,y,z)=>({x,y,z});
const cone=()=>({baseCenter:P(0,0,0),radiusMm:5,heightMm:10,modelUnit:'mm'});
const plane=(z=6,n=P(1,0,3))=>({point:P(0,0,z),normal:n,modelUnit:'mm'});
const options=(kind='full-ellipse',revision=9,samples=64,halfspace='positive')=>({
 kind,revision,samples,sourceConfirmed:true,presentationMode:'split-sheet',
 retainedHalfspace:halfspace,observerDirections:{
  V:{...DIRS.V},H:{...DIRS.H},W:{...DIRS.W}
 }
});
const actions=out=>out.steps.flatMap(s=>s.actions);
const get=(out,id)=>actions(out).find(a=>a.id===id);
const names=['V','H','W'];
test('07 opt-in per-view open-ray proof maps onto EXISTING V5 strokes, not a second player',()=>{
 const c=cone(),p=plane(),out=run(c,p,options());
 assert.equal(out.status,'preview-only');
 assert.equal(out.rayEvidence.status,'open-ray-evidence');
 assert.equal(out.rayEvidence.partitionCoverageVerified,true);
 assert.equal(out.rayEvidence.allViewOpenIntervalsCertified,false);
 assert.equal(out.rayEvidence.views.V.allOpenIntervalsCertified,false);
 assert.equal(out.rayEvidence.views.W.allOpenIntervalsCertified,true);
 assert.equal(out.visibilityVerified,false);
 assert.equal(out.visibilityEndpointsVerified,false);
 assert.equal(out.completeRayOcclusionVerified,false);
 assert.equal(out.visualLineStylesApplied,false);
 assert.equal(out.rayEvidence.engineeringDrawingLineStylesCertified,false);
 assert.equal(out.spatialIntent.source.visibilityVerified,false);
 assert.equal(out.spatialIntent.source.v5StepsReady,false);
 assert.equal(out.constructionStepsReady,false);
 assert.equal(out.firstAngleLayoutVerified,false);
 assert.equal(out.publicWorkbenchConnected,false);
 assert.equal(out.steps.filter(s=>s.role==='result').length,3);
 assert.equal(get(out,'cone_W_lateral_4').visibility,'visible');
 assert.equal(get(out,'cone_W_lateral_32').visibility,'hidden');
 assert.equal(get(out,'cone_H_lateral_4').visibility,'visible');
 assert.equal(get(out,'cone_V_lateral_4').visibility,'undetermined');
 for(const id of ['cone_W_lateral_16','cone_W_lateral_17']){
  const a=get(out,id);
  assert.equal(a.visibility,'undetermined',
   'a sampled line meeting a silhouette root must NOT borrow adjacent open interval style');
  assert.equal(a.visibilityProof,'unverified-or-silhouette-boundary');
 }
 const certain=get(out,'cone_W_lateral_4');
 assert.equal(certain.visibilityProof,'analytic-open-ray-only');
 assert.equal(certain.endpointVisibilityVerified,false);
 assert.equal(certain.wholeProjectedStrokeOcclusionVerified,false);
 assert.equal(certain.sampledPolylineOnly,true);
 Motion.actionShapeAttrs(certain,.5);
 assert.equal(Timeline.frame(out.timing,out.timing.totalMs).completedIds.length,
  actions(out).length);
 const player=out.createPlayer({speed:2});
 player.play(0);
 assert.ok(player.snapshot(500).elapsedMs>0);
 assert.equal(player.seekStep(3,600).activeStepIndex,3);
});
test('09 strict interval containment blocks BOTH crossing and tangent-adjacent source chords',()=>{
 const out=run(cone(),plane(),options());
 const W=out.rayEvidence.views.W.lateral;
 assert.equal(W[3],'visible'); // open analytic theta interval strictly inside positive-cos region
 assert.equal(W[31],'hidden');
 assert.equal(W[15],'undetermined'); // ends on theta=pi/2
 assert.equal(W[16],'undetermined'); // begins on theta=pi/2
 assert.equal(W[47],'undetermined'); // ends on theta=3pi/2
 assert.equal(W[48],'undetermined'); // begins on theta=3pi/2
 for(const v of names){
  assert.equal(out.rayEvidence.views[v].lateral.length,64);
  for(const [i,label] of out.rayEvidence.views[v].lateral.entries())
   assert.equal(get(out,'cone_'+v+'_lateral_'+(i+1)).visibility,label);
 }
 assert.equal(out.rayEvidence.sourceBoundaryEndpointsVerified,false);
 assert.equal(out.rayEvidence.projectedChordOcclusionVerified,false);
});
test('04 clipped true base chord gets open-ray status in H, but collapsed V point stays unknown',()=>{
 const out=run(cone(),plane(1),options('clipped-ellipse'));
 assert.equal(out.status,'preview-only');
 const H=get(out,'cone_H_cap_chord');
 const V=get(out,'cone_V_cap_chord');
 const W=get(out,'cone_W_cap_chord');
 assert.equal(H.kind,'line');
 assert.equal(H.visibility,'hidden');
 assert.equal(H.visibilityProof,'analytic-open-ray-only');
 assert.equal(V.kind,'point'); // plane x=3,z=0 gives collapsed V projection.
 assert.equal(V.visibility,'undetermined');
 assert.equal(W.visibility,'undetermined'); // W ray parallel to kept section plane.
 for(const a of [H,V,W]){
  assert.equal(a.endpointVisibilityVerified,false);
  assert.equal(a.wholeProjectedStrokeOcclusionVerified,false);
 }
 assert.equal(out.spatialIntent.operation.geometryKind,'clipped-ellipse');
 assert.equal(out.spatialIntent.source.sectionInteriorVerified,false);
});
test('09 plane-normal reversal MUST accompany retained-side reversal; classified source is invariant',()=>{
 const a=run(cone(),plane(6),options());
 const b=run(cone(),plane(6,P(-1,0,-3)),
  options('full-ellipse',9,64,'negative'));
 for(const view of names)
  assert.deepEqual(a.rayEvidence.views[view].lateral,
   b.rayEvidence.views[view].lateral);
});
test('07 default legacy workbench has UNKNOWN visibility, same step IDs and no new proof claims',()=>{
 const out=run(cone(),plane(),{kind:'full-ellipse',revision:3,
  samples:64,sourceConfirmed:true,presentationMode:'split-sheet'});
 assert.equal(out.status,'preview-only');
 assert.equal(out.rayEvidence,null);
 assert.deepEqual(out.steps.filter(s=>s.role==='result').map(s=>s.id),
  ['cone_V','cone_H','cone_W']);
 assert.ok(out.steps.filter(s=>s.role==='result')
  .flatMap(s=>s.actions).every(a=>a.visibility==='undetermined'));
 assert.equal(out.visualLineStylesApplied,false);
 assert.equal(out.player.canRender(3),true);
 const single=run(cone(),plane(),{kind:'full-ellipse',
  sourceConfirmed:true,revision:4,
  sheetTransform:{origin:{x:340,y:240},scale:6}});
 assert.equal(single.rayEvidence,null);
 assert.deepEqual(single.steps.map(s=>s.id),['cone_V','cone_H','cone_W']);
});
test('09 explicit correct axis vectors required: W ray reversal and missing conditions fail closed',()=>{
 const c=cone(),p=plane();
 for(const bad of [
  {observerDirections:options().observerDirections,retainedHalfspace:undefined},
  {retainedHalfspace:'positive',observerDirections:undefined},
  {retainedHalfspace:'outside',observerDirections:options().observerDirections},
  {retainedHalfspace:'positive',observerDirections:{
   V:P(0,1,0),H:P(0,0,1),W:P(1,0,0)}},
  {retainedHalfspace:'positive',observerDirections:{
   V:P(0,-1,0),H:P(0,0,1),W:P(-1,0,0)}},
  {retainedHalfspace:'positive',observerDirections:{
   V:P(0,-1,0),H:P(0,0,1)}},
  {retainedHalfspace:'positive',observerDirections:{
   V:P(0,-1,0),H:P(0,0,1),W:P(0,0,0)}},
  {retainedHalfspace:'positive',observerDirections:{
   V:P(0,-1,0),H:P(0,0,1),W:P(1,0,NaN)}}
 ]){
  assert.throws(()=>run(c,p,{...options(),...bad}));
 }
 assert.throws(()=>run(c,p,{...options(),visibilityVerified:true}),/untrusted/);
});
test('09 source not reviewed or mathematically invalid never generates an annotated V5 timeline',()=>{
 const c=cone();
 const no=run(c,plane(),{...options(),sourceConfirmed:false});
 assert.equal(no.status,'not-verified');
 assert.equal(no.player,null);
 assert.deepEqual(no.steps,[]);
 const apex=run(c,plane(10),options());
 assert.equal(apex.status,'not-verified');
 assert.equal(apex.player,null);
 const vertical=run(c,plane(6,P(1,0,0)),options());
 assert.equal(vertical.status,'not-verified');
 assert.equal(vertical.player,null);
});
test('09 256-source-sample budget maintains single native V5 engine and conservative labels',()=>{
 const out=run(cone(),plane(),options('full-ellipse',11,256));
 assert.equal(out.status,'preview-only');
 assert.ok(out.steps.every(s=>s.actions.length<=100));
 assert.equal(new Set(actions(out).map(a=>a.id)).size,actions(out).length);
 assert.equal(out.rayEvidence.views.W.lateral.length,256);
 assert.equal(out.rayEvidence.sourceBoundaryEndpointsVerified,false);
 const live=out.createPlayer({speed:.5});
 assert.equal(live.canRender(11),true);
 live.invalidate(12,0);
 assert.equal(live.canRender(11),false);
});
test('09 mutable observer/retained halfspace invalidates source fingerprint before another playback',()=>{
 const c=cone(),p=plane(),opts=options('full-ellipse',24);
 const out=run(c,p,opts);
 assert.equal(out.stillCurrent(24),true);
 opts.observerDirections.H.z=-1;
 assert.equal(out.stillCurrent(24),false);
 assert.throws(()=>out.createPlayer(),/stale source/);
});
