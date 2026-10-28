'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {parseHTML}=require('linkedom');
const Timeline=require('../../workbench/teaching-timeline-v5.js');
const Motion=require('../../workbench/teaching-motion-v5.js');
const Projection=require('../../core/projection/conventions.js');
const base=path.resolve(__dirname,'../..');
const read=p=>fs.readFileSync(path.resolve(base,p),'utf8');
const html=read('labs/c2-native-cut-review.html');
const js=read('labs/c2-native-cut-review-ui.js');

function setup(){
 const {window,document}=parseHTML(html);
 // LinkeDOM intentionally leaves select/range input values getter-only.
 // Real browsers provide native writable value properties; emulate that
 // browser contract without changing production UI behavior.
 for(const [id,value] of [['cutSeek','0'],['cutSpeed','1']])
  Object.defineProperty(document.getElementById(id),'value',{
   value,writable:true,configurable:true
  });
 window.DA07TimelineV5=Timeline;
 window.DA07MotionV5=Motion;
 window.DAFirstAngleProjection=Projection;
 const callback={raf:null};
 vm.runInNewContext(js,{
  globalThis:window,document,
  performance:{now:()=>2500},
  requestAnimationFrame:fn=>{callback.raf=fn;return 1;},
  cancelAnimationFrame:()=>{callback.raf=null;},
  Error,Number,JSON,Array,String,Set,Map,Object,Math
 },{timeout:1000});
 return {window,document,callback};
}
// UI fixture only: this deliberately IS NOT genuine OCCT mathematics.
// Authenticity must be proven upstream by native CI; browser importer only
// checks the file format before replaying the existing V5.
function syntheticReview(){
 const action={id:'c2_native_action_V_1_0',kind:'line',
  geometry:{from:{x:200,y:210},to:{x:260,y:210}},
  engineeringLineStyle:'gb-t-4457.4-continuous-wide-visible-outline'};
 const steps=[{id:'c2_native_V_1_0',dependsOn:[],
  title:'局部认证原始线段',actions:[action]}];
 return {
  schema:'draftai-c2-actual-native-occt-m0-m4-m5-full-proof-pack/1',
  booleanOperation:'cut',
  provenance:{actualNativeOpenCascadeRanInThisProcessTree:true,signedV5ActionCount:1},
  sourceCertifiedNativeCanonicalV5:null,
  completeCutProjectOfficialGBLineStylesAndV5Certified:false,
  ConstructionIntentDAGSingleV5FullySigned:false,
  completeSubtractiveBooleanM5RayVisibilityCertified:false,
  realTextbookBlindTestPassed:false,
  independentlySignedPartialCutV5ActionCount:1,
  sourceCertifiedNativeCanonicalPartialCutV5:{
   actualOriginalBooleanOperation:'cut',
   entireCutOriginalDrawingSigned:false,
   boundedTwoBoxUnionFullFormalV5Certified:false,
   allNativePhysicalSourcesSignedOrProvenSuppressed:false,
   canonicalConstructionIntentDagChecked:true,
   oneExistingV5TimelineRecreated:true,
   realNativeBRepWasExecutedInOriginalRunner:true,
   revision:24,
   sheetTransform:{origin:{x:320,y:270},scale:12},
   certifiedVisibleHiddenSourceIntervals:[{
    actionId:action.id,view:'V',sourceNativeResultEdgeOrdinal:1,
    originalGeneratedEdgeParameterRange:[0,1],
    projectedFromModelMm:{u:10,v:5},
    projectedToModelMm:{u:5,v:5},
    standardEngineeringLineStyle:action.engineeringLineStyle,
    cutVerifiedOriginalTopoDSEndpointsAndClosedM0Rays:true,
    cutOriginalM4PaperAliasStrictDepthReverified:true,
    completeC2CutResultCertified:false,
    signedByExistingConstructionIntentDagAndSingleV5:true
   }],
   unsignedNativePhysicalSourceIntervals:[{sourceNativeResultEdgeOrdinal:2}],
   suppressedNativeBackSourceIntervals:[],
   steps,intents:[{id:'c2_native_V_1_0',
    outputEntityIds:[action.id],
    operations:[{id:action.id,kind:'line',
     coordinateSpace:'sheet-px',geometry:{...action.geometry}}]}],
   timeline:Timeline.compileTimeline(steps)
  }
 };
}
async function importProof(host,pack){
 const file=host.document.getElementById('cutProofFile');
 const data=JSON.stringify(pack);
 Object.defineProperty(file,'files',{configurable:true,value:[
  {size:data.length,text:async()=>data}
 ]});
 file.dispatchEvent(new host.window.Event('change'));
 await new Promise(resolve=>setImmediate(resolve));
}
test('C2 mobile review packages the actual single V5 modules, excludes raw textbook and remote AI',()=>{
 assert.ok(html.includes('c2-native-cut-review-bundle.js'));
 assert.ok(!html.includes('src="../workbench/'),
  'never publish private original V5 source paths as public assets');
 const entry=read('labs/c2-native-cut-review-entry.cjs');
 assert.ok(entry.includes("require('../workbench/teaching-timeline-v5.js')"));
 assert.ok(entry.includes("require('../workbench/teaching-motion-v5.js')"));
 assert.ok(read('scripts/build-static.cjs').includes('c2-native-cut-review-bundle.js'));
 assert.match(js,/timelineV5\.compileTimeline\(p\.steps\)/);
 assert.match(js,/timelineV5\.createPlayer\(computed/);
 assert.match(js,/motionV5\.actionShapeAttrs/);
 assert.match(js,/projection\.toSheet/);
 assert.match(read('labs/c2-native-cut-review-entry.cjs'),
  /DAFirstAngleProjection/);
 assert.doesNotMatch(js,/\bfetch\s*\(|XMLHttpRequest|WebSocket|eval\s*\(/);
 assert.match(read('scripts/build-static.cjs'),/'labs\/c2-native-cut-review.html'/);
 assert.match(read('index.html'),/href="labs\/c2-native-cut-review.html"/);
 assert.match(read('.github/workflows/c2-actual-through-hole-source-e2e.yml'),
  /original-c2-through-hole-m0-m4\.signed-only\.svg/);
});
test('same official V5 locally replays only admitted partial Cut shapes',async()=>{
 const host=setup();
 await importProof(host,syntheticReview());
 const $=id=>host.document.getElementById(id);
 assert.equal($('cutSigned').textContent,'1');
 assert.equal($('cutHeld').textContent,'1');
 assert.equal($('cutSuppressed').textContent,'0');
 assert.equal($('cutPlay').disabled,false);
 assert.equal($('cutDraw').querySelectorAll('line').length,1);
 assert.match($('cutStatus').textContent,/不是|未签收|局部/);
 $('cutPlay').dispatchEvent(new host.window.Event('click'));
 assert.equal($('cutPlay').textContent,'暂停');
 assert.equal(typeof host.callback.raf,'function');
 $('cutPlay').dispatchEvent(new host.window.Event('click'));
 assert.equal($('cutPlay').textContent,'播放');
});
test('an imported partial proof with unauthorized formal line style is rejected before rendering',async()=>{
 const host=setup(),forged=syntheticReview();
 forged.sourceCertifiedNativeCanonicalPartialCutV5.certifiedVisibleHiddenSourceIntervals[0]
  .standardEngineeringLineStyle='bogus-claimed-formal-line';
 await importProof(host,forged);
 const $=id=>host.document.getElementById(id);
 assert.equal($('cutPlay').disabled,true);
 assert.equal($('cutDraw').querySelectorAll('line').length,0);
 assert.equal($('cutStatus').dataset.error,'true');
});
test('browser refuses a fake complete C2 result even if the file claims a V5 action',async()=>{
 const host=setup(),forged=syntheticReview();
 forged.ConstructionIntentDAGSingleV5FullySigned=true;
 await importProof(host,forged);
 assert.equal(host.document.getElementById('cutPlay').disabled,true);
 assert.match(host.document.getElementById('cutStatus').textContent,/无法加载/);
});

/**
 * REQUIRED REAL NATIVE E2E. The genuine OCP BRep Cut CLI creates the
 * mathematical proof immediately before this test; no synthetic data
 * and no copy of an old signed artifact are accepted.
 *
 * This test is normally inert outside the dedicated native CI, where the
 * actual proof path is supplied by the same-run producer. Synthetic DOM
 * fixtures above still test the UI without requiring OCP on the dev host.
 */
test('live same-run OpenCascade Cut JSON imports into mobile single V5: 12 actual strokes, all other sources held', {
 skip:!process.env.DRAFTAI_REAL_C2_NATIVE_PROOF_PACK
},async()=>{
 const source=process.env.DRAFTAI_REAL_C2_NATIVE_PROOF_PACK;
 const raw=fs.readFileSync(source);
 assert.ok(raw.length>2000&&raw.length<=12*1024*1024);
 const real=JSON.parse(raw.toString('utf8'));
 assert.equal(real.provenance.actualNativeOpenCascadeRanInThisProcessTree,true);
 assert.equal(real.nativeTopology.actualNativeBooleanOperation,'cut');
 assert.equal(real.nativeTopology.resultEdgeCount,24);
 assert.equal(real.mathM0M4M5.globalPaperEvents.continuousM5SubspanCount,64);
 assert.equal(real.sourceCertifiedNativeCanonicalPartialCutV5.certifiedVisibleHiddenSourceIntervals.length,12);
 assert.equal(real.sourceCertifiedNativeCanonicalPartialCutV5.unsignedNativePhysicalSourceIntervals.length,40);
 const host=setup();
 await importProof(host,real);
 const $=id=>host.document.getElementById(id);
 assert.equal($('cutStatus').dataset.error,'false',
  'actual freshly generated native Cut mathematical witness must be browser importable: '+
   $('cutStatus').textContent);
 assert.equal($('cutSigned').textContent,'12');
 assert.equal($('cutSuppressed').textContent,'12');
 assert.equal($('cutHeld').textContent,'40');
 const graphics=[...$('cutDraw').querySelectorAll('line')];
 assert.equal(graphics.length,12);
 const sourceActions=real.sourceCertifiedNativeCanonicalPartialCutV5.steps.flatMap(x=>x.actions);
 assert.equal(sourceActions.length,12);
 for(const [i,node] of graphics.entries()){
  const a=sourceActions[i],verified=Motion.actionShapeAttrs(a,1);
  assert.equal(node.dataset.actionId,a.id);
  assert.equal(node.dataset.engineeringLine,
   a.engineeringLineStyle.includes('dashed')?'hidden':'visible');
  assert.ok([verified.x1,verified.y1,verified.x2,verified.y2].every(Number.isFinite));
 }
 $('cutPlay').dispatchEvent(new host.window.Event('click'));
 assert.equal($('cutPlay').textContent,'暂停');
 assert.equal(typeof host.callback.raf,'function');
 $('cutPlay').dispatchEvent(new host.window.Event('click'));
 assert.equal($('cutPlay').textContent,'播放');

 // Same authentic data with tampered GB engineering style must fail closed.
 const forged=structuredClone(real);
 forged.sourceCertifiedNativeCanonicalPartialCutV5.steps[0]
  .actions[0].engineeringLineStyle='bogus-unverified-source-style';
 const other=setup();
 await importProof(other,forged);
 assert.equal(other.document.getElementById('cutPlay').disabled,true);
 assert.equal(other.document.getElementById('cutDraw').querySelectorAll('line').length,0);
 assert.equal(other.document.getElementById('cutStatus').dataset.error,'true');

 // A false full-scene flag cannot turn a 12-action partial Cut into
 // a claimed complete answer.
 const premature=structuredClone(real);
 premature.completeCutProjectOfficialGBLineStylesAndV5Certified=true;
 const third=setup();
 await importProof(third,premature);
 assert.equal(third.document.getElementById('cutPlay').disabled,true);
 assert.equal(third.document.getElementById('cutDraw').querySelectorAll('line').length,0);
});

test('signed V5 stroke cannot be shifted off genuine original M4 first-angle paper even if matching style is retained',async()=>{
 const host=setup(),forged=syntheticReview();
 forged.sourceCertifiedNativeCanonicalPartialCutV5.steps[0]
  .actions[0].geometry.to.x+=1;
 forged.sourceCertifiedNativeCanonicalPartialCutV5.timeline=
  Timeline.compileTimeline(
   forged.sourceCertifiedNativeCanonicalPartialCutV5.steps);
 await importProof(host,forged);
 assert.equal(host.document.getElementById('cutPlay').disabled,true);
 assert.equal(host.document.getElementById('cutDraw').querySelectorAll('line').length,0);
 assert.match(host.document.getElementById('cutStatus').textContent,
  /V5 终点与 M4 纸面投影/);
});
