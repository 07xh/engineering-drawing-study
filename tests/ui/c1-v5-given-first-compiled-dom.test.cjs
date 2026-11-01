'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {parseHTML}=require('linkedom');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const {createRequire}=require('node:module');
const Timeline=require('../../workbench/teaching-timeline-v5.js');
const {project}=require('../../core/projection/conventions.js');
const entry=path.resolve('labs/c1-reviewed-dxf-live-entry.cjs');
const originalRequire=createRequire(entry);
const points={
 A:{x:0,y:0,z:0},B:{x:2,y:1,z:2},
 C:{x:4,y:3,z:7},D:{x:6,y:6,z:5}
};
function given(){
 return {
  schema:'draftai-c1-authenticated-dxf-reviewed-given/1',
  sourceSha256:'a'.repeat(64),convertedDxfSha256:'b'.repeat(64),
  views:{V:Object.values(points).map(p=>project(p).V),
   H:Object.values(points).map(p=>project(p).H)},
  givenOriginalHandleEndpoints:{
   V:Object.keys(points).map((_,i)=>({handle:'V'+i,endpoint:'point'})),
   H:Object.keys(points).map((_,i)=>({handle:'H'+i,endpoint:'point'}))
  },
  missingView:'W',
  assumedScope:'all-extreme-vertices-of-one-closed-convex-opaque-solid',
  humanSelectedFullExtremeVertexSet:true,
  originalSourceCompletenessIndependentlyProved:false,
  sourceImageRecognitionVerified:false,
  referenceWasNotExportedAsSolverInput:true,
  sourceIsNotYetConfirmedForProduction:true,textbookBlindSolveAccepted:false
 };
}
test('C1 compiled playback frame zero keeps GIVEN/blank target, never preloads final SVG',async()=>{
 const {document,window}=parseHTML(
  fs.readFileSync('labs/c1-reviewed-dxf-live.html','utf8'));
 for(const el of document.querySelectorAll('input,button,select')){
  for(const prop of ['disabled','checked','hidden'])
   Object.defineProperty(el,prop,{configurable:true,
    get(){return this.hasAttribute(prop);},
    set(v){v?this.setAttribute(prop,''):this.removeAttribute(prop);}
   });
 }
 const jump=document.getElementById('v5StepJump');
 Object.defineProperty(jump,'value',{configurable:true,
  get(){return this.__selected??this.querySelector('option')?.getAttribute('value')??'';},
  set(v){this.__selected=String(v);}
 });
 const steps=[{id:'source_point',dependsOn:[],
  title:'依据 GIVEN 定位点',explanation:'由当前审核的两视图来源计算。',
  actions:[{id:'source_point_action',kind:'point',
   geometry:{center:{x:50,y:70},radius:4}}]}];
 const timeline=Timeline.compileTimeline(steps);
 const player=Timeline.createPlayer(timeline,{revision:3});
 const solution={revision:3,singleOriginalV5Player:true,steps,timeline,player,
  intents:[{id:'source_point',source:{solver:'reviewed-source-projection',
   proofScope:'verified-point-only'}}],
  certifiedVisibleContourLineBindings:[],certifiedPhysicalLineBindings:[],
  certifiedVisibleContourLineActionCount:0,certifiedPhysicalLineActionCount:0,
  m0M3M5PhysicalSourceAcceptance:{status:'held-not-full-proof'},
  // Deliberately include a precomputed target: it must never reach the DOM.
  threeViewSvgSheet:{sheetSvg:
   '<svg data-premature-answer="true"><line data-answer-stroke="true"/></svg>'}
 };
 const coverage=()=>({checkedOriginalPhysicalEdgeViews:6,positiveGapCount:2,
  overlappingCertifiedSourceCount:0,allOriginalPhysicalSourceRangesAccounted:false});
 const result={solution,scopedConvexAcceptance:{
  realTextbookBlindTestPassed:false,scopedSingleConvexFullyCertified:false,
  checkedOriginalPhysicalEdgeViews:18,positiveGapCount:2,
  overlappingCertifiedSourceCount:0,
  perViewSourceCoverage:{V:coverage(),H:coverage(),W:coverage()},
  missingObligations:['original HLR history','continuous occlusion']
 }};
 let receivedSheet=null;
 const scopedRequire=name=>{
  if(name.includes('c1-authenticated-dxf-to-reviewed-v5.cjs')){
   const real=originalRequire(name);
   return {...real,compileReviewedC1DxfGivenToSoleV5:async args=>{
    receivedSheet=args.sheetTransform;return result;
   }};
  }
  return originalRequire(name);
 };
 const scene={document,window,require:scopedRequire,
  URL:{createObjectURL:()=>'',revokeObjectURL:()=>{}},
  performance:{now:()=>0},requestAnimationFrame:()=>0,
  cancelAnimationFrame:()=>{},console};
 vm.runInNewContext(fs.readFileSync(entry,'utf8')+
  '\n;this.__seed=(p,c)=>{rawGiven=p;given=p;candidate=c;revision=3;};'+
  '\n;this.__compile=compile;this.__draw=drawV5;',scene,{filename:entry});
 const packet=given();
 // Candidate contains a huge unknown coordinate: it must not dictate the
 // official sheet origin/scale or cause a missing-view answer to appear.
 const candidate={inferred:{candidateGeometry:{data:{points:{
  ...points,unknown:{x:10000,y:10000,z:10000}
 }}}}};
 scene.__seed(packet,candidate);
 document.getElementById('reviewCheck').checked=true;
 await scene.__compile();
 const paper=document.querySelector('#sheetPreview svg');
 assert.ok(paper,'compiled C1 must preserve the original paper');
 assert.equal(paper.getAttribute('data-c1-paper-mode'),'given');
 assert.equal(paper.getAttribute('data-missing-view'),'W');
 assert.equal(document.querySelectorAll('#sheetPreview [data-source-point-only]').length,8);
 assert.equal(document.querySelectorAll('#sheetPreview [data-c1-unanswered-view="W"]').length,1);
 assert.equal(document.querySelectorAll('#sheetPreview line').length,0);
 assert.equal(document.querySelector('[data-premature-answer]'),null);
 assert.equal(document.querySelector('[data-answer-stroke]'),null);
 assert.equal(document.querySelectorAll('#animation [data-action-id]').length,0);
 assert.equal(receivedSheet.scale,5,'only authenticated GIVEN bounds choose sheet scale');
 assert.match(document.getElementById('paperMode').textContent,/GIVEN.*空白/);
 assert.equal(document.getElementById('showCandidate').disabled,true);
 // Only a real time-progressed action may appear in the separate V5 panel.
 player.seekMs(250,0);scene.__draw();
 assert.ok(document.querySelector('#animation [data-action-id="source_point_action"]'));
 assert.equal(document.querySelectorAll('#sheetPreview line').length,0);
 assert.equal(document.querySelectorAll('#sheetPreview [data-c1-unanswered-view="W"]').length,1);
});
