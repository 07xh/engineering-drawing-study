'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs');
const {compileReviewedSegmentPreview}=require('../../workbench/reviewed-two-view-segment-preview.cjs');
const {project,toSheet}=require('../../core/projection/conventions.js');

const sheetTransform={origin:{x:360,y:210},scale:3};
const vertices=[{id:'A',x:11,y:27,z:30},{id:'B',x:31,y:9,z:20}];
const xyz=()=>vertices.map(p=>({...p}));
function givens(pair,points=vertices){
 return points.map(({id,x,y,z})=>{
  const projected=project({x,y,z});
  return {id,knownViews:Object.fromEntries([...pair].map(v=>
   [v,[projected[v].u,projected[v].v]]))};
 });
}
function input(points){return {confirmedBy:'user',revision:12,unit:'mm',points,
 sheetTransform};}
function checkViews(result){
 const preview=result.segmentPreview,scene=preview.scene;
 assert.equal(preview.id,'SegmentAB');
 assert.equal(preview.revision,12);
 assert.equal(scene.revision,12);
 assert.equal(scene.objects.length,1);
 assert.equal(scene.objects[0].id,'SegmentAB');
 assert.equal(scene.objects[0].kind,'segment');
 assert.equal(scene.objects[0].representations['3D'].data.start.x,11);
 assert.equal(preview.geometry.unit,'mm');
 assert.equal(preview.projectionVerifiedWithinIdentifiedEndpoints,true);
 assert.equal(preview.visibility,'undetermined');
 assert.equal(preview.lineStyle,'undetermined');
 assert.equal(preview.certifiedAsConstructionStep,false);
 assert.equal(preview.officialV5SegmentReady,false);
 assert.equal(preview.solidReconstructionVerified,false);
 for(const v of ['V','H','W']){
  const s=preview.screen[v],projA=project(vertices[0])[v],projB=project(vertices[1])[v];
  assert.deepEqual(s.from,toSheet(v,projA,sheetTransform));
  assert.deepEqual(s.to,toSheet(v,projB,sheetTransform));
  assert.equal(s.collapsed,false);
  assert.equal(preview.views[v].kind,'segment');
 }
 assert.equal(result.canonicalVerified,true);
 assert.ok(result.steps.length>=6);
 assert.equal(result.player.canRender(12),true);
 assert.ok(result.timeline.segments.length>0);
 result.player.play(0);assert.ok(result.player.snapshot(100).elapsedMs>0);
 result.player.pause(100);result.player.seekStep(0,100);
 result.player.invalidate(13,100);
 assert.equal(result.player.canRender(12),false);
}
for(const pair of ['VH','VW','HW']){
 test('C1 identified AB: '+pair+' independently recomputes V/H/W and keeps single original V5',()=>{
  checkViews(compileReviewedSegmentPreview(input(givens(pair))));
 });
}
test('C1 known XYZ and reverse A/B row ordering keep stable spatial identities',()=>{
 checkViews(compileReviewedSegmentPreview(input(xyz().reverse())));
});
test('C1 segment collinear to observer collapses in one view, not a phantom hidden line',()=>{
 const points=[{id:'A',x:10,y:20,z:30},{id:'B',x:10,y:44,z:30}];
 const r=compileReviewedSegmentPreview(input(givens('VH',points)));
 assert.equal(r.segmentPreview.views.V.kind,'point');
 assert.equal(r.segmentPreview.screen.V.collapsed,true);
 assert.equal(r.segmentPreview.views.H.kind,'segment');
 assert.equal(r.segmentPreview.views.W.kind,'segment');
 assert.equal(r.segmentPreview.visibility,'undetermined');
});
test('C1 zero-length edge, invalid endpoint correspondence, inconsistent or missing givens fail closed',()=>{
 const same=xyz();same[1]={id:'B',x:same[0].x,y:same[0].y,z:same[0].z};
 assert.throws(()=>compileReviewedSegmentPreview(input(same)),/zero-length/);
 const mixed=[givens('VH')[0],givens('HW')[1]];
 assert.throws(()=>compileReviewedSegmentPreview(input(mixed)),/same confirmed source-view pair/);
 const mismatch=givens('VH');mismatch[1].knownViews.H[0]+=1;
 assert.throws(()=>compileReviewedSegmentPreview(input(mismatch)),/canonical|ready|projection/i);
 const missing=givens('VH');delete missing[1].knownViews.H;
 assert.throws(()=>compileReviewedSegmentPreview(input(missing)),/two finite reviewed/i);
 const switched=givens('VH');switched[1].id='A';
 assert.throws(()=>compileReviewedSegmentPreview(input(switched)),/distinct labeled/i);
 const falseUnit=input(givens('VW'));falseUnit.unit='px';
 assert.throws(()=>compileReviewedSegmentPreview(falseUnit),/mm units/);
 const unconfirmed=input(givens('HW'));unconfirmed.confirmedBy=null;
 assert.throws(()=>compileReviewedSegmentPreview(unconfirmed),/confirmation/);
 const stale=input(givens('HW'));stale.revision=0;
 assert.throws(()=>compileReviewedSegmentPreview(stale),/confirmation/);
});
test('C1 exact input changes recompute segment and separate revision cannot keep stale player',()=>{
 const before=compileReviewedSegmentPreview(input(givens('VH')));
 const modified=vertices.map(p=>({...p}));
 modified[1].z+=13;
 const next=compileReviewedSegmentPreview({...input(givens('VH',modified)),revision:13});
 assert.notDeepEqual(before.segmentPreview.screen.V.to,next.segmentPreview.screen.V.to);
 assert.equal(next.segmentPreview.revision,13);
 assert.equal(before.segmentPreview.revision,12);
 assert.equal(before.player.canRender(13),false);
 assert.equal(next.player.canRender(12),false);
});
test('C1 UI only renders undetermined AB preview after the SAME player completes',()=>{
 const ui=fs.readFileSync('labs/two-point-v5-live-entry.cjs','utf8');
 const html=fs.readFileSync('labs/two-point-v5-live.html','utf8');
 const homepage=require('../../ui-next/home.cjs').homeHTML();
 assert.match(ui,/compileReviewedSegmentPreview\(input\)/);
 assert.match(ui,/if\(!preview\|\|!frame.done\|\|!current.player.canRender\(revision\)\)return/);
 assert.match(ui,/data-official-v5','false/);
 assert.match(ui,/data-line-style','undetermined/);
 assert.match(ui,/renderReviewedSegmentPreview\(svg,frame,mono\)/);
 assert.match(ui,/showSegment'\)\.addEventListener\('change',invalidateSource\)/);
 assert.ok(html.includes('id="showSegment"'));
 assert.match(html,/非正式 V5 线条/);
 assert.ok(homepage.includes('href="labs/two-point-v5-live.html"'));
 assert.match(homepage,/非实体标准答案/);
});
