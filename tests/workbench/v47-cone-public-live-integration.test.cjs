'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {coneSpatialV5Preview}=require('../../workbench/cone-spatial-v5-preview.cjs');
const {DIRS}=require('../../workbench/cone-open-ray-v5-mapping.cjs');
const root=path.resolve(__dirname,'../..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const base={baseCenter:{x:0,y:0,z:0},radiusMm:5,heightMm:10,modelUnit:'mm'};
const plane=z=>({point:{x:0,y:0,z},normal:{x:1,y:0,z:3},modelUnit:'mm'});
test('07 public cone page contains all confirmed-source and V5 playback controls',()=>{
 const html=read('labs/cone-cut-live.html');
 for(const id of [
  'coneRadius','coneHeight','coneKind','conePx','conePy','conePz',
  'coneNx','coneNy','coneNz','coneSamples','coneKept','coneConfirm',
  'coneReset','coneSolve','coneStatus','coneSvg','coneDraw',
  'coneBack','conePlay','coneForward','coneSeek','conePercent',
  'coneSpeed','coneGuides','coneMono','coneFocus','coneFit',
  'conePicked','coneStepLabel','coneSteps','coneProof'
 ])assert.match(html,new RegExp('id="'+id+'"'));
 assert.match(html,/cone-cut-live-bundle\.js/);
 assert.match(html,/max-width:900px/);
 assert.match(html,/截交线仅为近似曲线预览/);
 assert.match(html,/整体可见性尚未证明/);
 assert.match(html,/未确认：所有截线线型待审核/);
 assert.match(html,/人工|确认/);
 assert.match(html,/id="coneSourceFile" type="file" accept="image\/png,image\/jpeg,image\/webp"/);
 assert.match(html,/id="coneSourcePreview"/);
 assert.match(html,/id="coneSourceClear"/);
 assert.match(html,/不上传、不自动识图/);
});
test('07 real browser entry uses ONE verified M3 ConstructionStep/V5 contract and native Motion',()=>{
 const src=read('labs/cone-cut-live-entry.cjs');
 assert.match(src,/require\('\.\.\/workbench\/cone-spatial-v5-preview\.cjs'\)/);
 assert.match(src,/require\('\.\.\/workbench\/teaching-motion-v5\.js'\)/);
 assert.match(src,/coneSpatialV5Preview\(cone,plane/);
 assert.match(src,/presentationMode:'split-sheet',provenGuideDag:true/);
 assert.match(src,/sourceConfirmed:true/);
 assert.match(src,/canonicalGuideStepCount!==12/);
 assert.match(src,/answer\.spatialIntent\?\.source\?\.v5StepsReady!==false/);
 assert.match(src,/plan\.stillCurrent\(revision\)/);
 assert.match(src,/answer\.createPlayer\(/);
 assert.match(src,/Motion\.updateSvg\(el,action,fraction\)/);
 assert.match(src,/player\.invalidate\(revision/);
 assert.match(src,/player\.seekStep/);
 assert.match(src,/player\.seekProgress/);
 assert.match(src,/player\.setSpeed/);
 assert.match(src,/requestAnimationFrame\(tick\)/);
 assert.match(src,/addEventListener\('keydown'/);
 assert.match(src,/textContent=/);
 assert.doesNotMatch(src,/function\s+(?:compileTimeline|conePlaneFullEllipse|conePlaneClippedEllipseBoundary|createPlayer)\s*\(/);
 assert.doesNotMatch(src,/innerHTML|fetch\s*\(|XMLHttpRequest|WebSocket|localStorage|sendBeacon|apiKey|token\s*:/i);
});
test('09 confirmed textbook-independent analytic examples truly enter the native composite V5',()=>{
 for(const [kind,z] of [['full-ellipse',6],['clipped-ellipse',1]]){
  const result=coneSpatialV5Preview(base,plane(z),{
   kind,revision:14,sourceConfirmed:true,presentationMode:'split-sheet',
   provenGuideDag:true,samples:64
  });
  assert.equal(result.status,'preview-only');
  assert.equal(result.mathematicallyVerified,true);
  assert.equal(result.canonicalGuideDagConnected,true);
  assert.equal(result.canonicalGuideStepCount,12);
  assert.equal(result.visibilityVerified,false);
  assert.equal(result.publicWorkbenchConnected,false);
  assert.equal(result.spatialIntent.source.v5StepsReady,false);
  assert.equal(result.steps.length,16);
  assert.equal(result.player.canRender(14),true);
  assert.ok(result.timing.totalMs>0);
  const seen=new Set();
  for(const step of result.steps){
   for(const a of step.actions){
    assert.equal(seen.has(a.id),false);
    seen.add(a.id);
   }
  }
 }
 const declined=coneSpatialV5Preview(base,plane(6),{
  kind:'full-ellipse',revision:16,sourceConfirmed:false,
  presentationMode:'split-sheet',provenGuideDag:true
 });
 assert.equal(declined.status,'not-verified');
 assert.deepEqual(declined.steps,[]);
 assert.equal(declined.player,null);
});
test('09 ray mode is opt-in, source must be explicit, unknown stays unknown',()=>{
 const common={kind:'full-ellipse',revision:15,sourceConfirmed:true,
  presentationMode:'split-sheet',provenGuideDag:true,samples:64};
 const unknown=coneSpatialV5Preview(base,plane(6),common);
 assert.equal(unknown.rayEvidence,null);
 assert.ok(unknown.steps.filter(s=>s.role==='result')
  .flatMap(s=>s.actions).every(a=>a.visibility==='undetermined'));
 const determined=coneSpatialV5Preview(base,plane(6),{
  ...common,retainedHalfspace:'positive',observerDirections:{
   V:{...DIRS.V},H:{...DIRS.H},W:{...DIRS.W}
  }
 });
 assert.equal(determined.status,'preview-only');
 assert.equal(determined.rayEvidence.status,'open-ray-evidence');
 assert.equal(determined.rayEvidence.sourceBoundaryEndpointsVerified,false);
 assert.equal(determined.visualLineStylesApplied,false);
 assert.equal(determined.visibilityVerified,false);
 assert.ok(determined.steps.filter(s=>s.role==='result')
  .flatMap(s=>s.actions).some(a=>a.visibility==='hidden'));
});
test('09 site whitelist explicitly includes only a built cone page and bounded bundle',()=>{
 const build=read('scripts/build-static.cjs');
 const home=read('index.html');
 assert.match(build,/'labs\/cone-cut-live\.html'/);
 assert.match(build,/entryPoints:\[path\.join\(root,'labs\/cone-cut-live-entry\.cjs'\)\]/);
 assert.match(build,/outfile:path\.join\(out,'labs\/cone-cut-live-bundle\.js'\)/);
 assert.match(home,/href="labs\/cone-cut-live\.html"/);
 assert.doesNotMatch(build,/'tests\/workbench\/v46-cone-one-v5-composition\.test\.cjs'/);
 assert.doesNotMatch(home,/原题图片已验证|任意题图自动识别已上线/);
});
