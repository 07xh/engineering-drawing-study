'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {parseHTML}=require('linkedom');
const Timeline=require('../../workbench/teaching-timeline-v5.js');
const Motion=require('../../workbench/teaching-motion-v5.js');
const base=path.resolve(__dirname,'../..');
const read=p=>fs.readFileSync(path.resolve(base,p),'utf8');
const html=read('labs/c2-native-cut-review.html');
const js=read('labs/c2-native-cut-review-ui.js');

function setup(){
 const {window,document}=parseHTML(html);
 window.DA07TimelineV5=Timeline;
 window.DA07MotionV5=Motion;
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
  geometry:{from:{x:120,y:210},to:{x:280,y:210}},
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
   certifiedVisibleHiddenSourceIntervals:[{
    actionId:action.id,view:'V',sourceNativeResultEdgeOrdinal:1,
    standardEngineeringLineStyle:action.engineeringLineStyle,
    cutVerifiedOriginalTopoDSEndpointsAndClosedM0Rays:true,
    cutOriginalM4PaperAliasStrictDepthReverified:true,
    completeC2CutResultCertified:false,
    signedByExistingConstructionIntentDagAndSingleV5:true
   }],
   unsignedNativePhysicalSourceIntervals:[{sourceNativeResultEdgeOrdinal:2}],
   suppressedNativeBackSourceIntervals:[],
   steps,intents:[{id:'c2_native_V_1_0'}],
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
 assert.match(html,/c2-native-cut-review-ui\.js/);
 assert.match(html,/\.\.\/workbench\/teaching-timeline-v5\.js/);
 assert.match(html,/\.\.\/workbench\/teaching-motion-v5\.js/);
 assert.match(js,/timelineV5\.compileTimeline\(p\.steps\)/);
 assert.match(js,/timelineV5\.createPlayer\(computed/);
 assert.match(js,/motionV5\.actionShapeAttrs/);
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
