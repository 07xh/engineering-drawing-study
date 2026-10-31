'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {parseHTML}=require('linkedom');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const {createRequire}=require('node:module');
const {project}=require('../../core/projection/conventions.js');
const Timeline=require('../../workbench/teaching-timeline-v5.js');
const {buildC1DxfGivenFirstPaper}=require('../../workbench/c1-dxf-given-first-paper.cjs');
const entry=path.resolve('labs/c1-reviewed-dxf-live-entry.cjs');
const originalRequire=createRequire(entry);
const originalPoints={
 A:{x:0,y:0,z:0},B:{x:2,y:1,z:2},
 C:{x:4,y:3,z:7},D:{x:6,y:6,z:5}
};
const tetra={id:'ReviewedPrivateDXF',data:{points:originalPoints,
 edges:[['A','B'],['A','C'],['A','D'],['B','C'],['B','D'],['C','D']],
 faces:[['A','B','C'],['A','B','D'],['A','C','D'],['B','C','D']]}};
const given=()=>({
 schema:'draftai-c1-authenticated-dxf-reviewed-given/1',
 sourceSha256:'a'.repeat(64),convertedDxfSha256:'b'.repeat(64),
 views:{V:Object.values(originalPoints).map(p=>project(p).V),
  H:Object.values(originalPoints).map(p=>project(p).H)},
 givenOriginalHandleEndpoints:{V:['A','B','C','D'].map((_,i)=>({handle:'V'+i,endpoint:'point'})),
  H:['A','B','C','D'].map((_,i)=>({handle:'H'+i,endpoint:'point'}))},
 missingView:'W',assumedScope:'all-extreme-vertices-of-one-closed-convex-opaque-solid',
 humanSelectedFullExtremeVertexSet:true,
 originalSourceCompletenessIndependentlyProved:false,
 sourceImageRecognitionVerified:false,
 referenceWasNotExportedAsSolverInput:true,
 sourceIsNotYetConfirmedForProduction:true,textbookBlindSolveAccepted:false
});
const tick=()=>new Promise(resolve=>setImmediate(resolve));
test('real local DXF DOM: GIVEN first, explicit draft opt-in, invalidate and no V5 signing',async()=>{
 const raw=fs.readFileSync('labs/c1-reviewed-dxf-live.html','utf8');
 const {document,window}=parseHTML(raw);
 for(const e of document.querySelectorAll('input,button,img,textarea')){
  for(const prop of ['disabled','checked','hidden'])
   Object.defineProperty(e,prop,{configurable:true,
    get(){return this.hasAttribute(prop);},
    set(value){value?this.setAttribute(prop,''):this.removeAttribute(prop);}
   });
  if(e.tagName==='TEXTAREA')Object.defineProperty(e,'value',{configurable:true,
   get(){return this.__typed??this.textContent;},
   set(value){this.__typed=String(value);}
  });
 }
 const pack=given(),body=JSON.stringify(pack);
 const file={name:'source.json',size:body.length,text:async()=>body};
 Object.defineProperty(document.getElementById('givenFile'),'files',{
  configurable:true,value:[file]
 });
 // Use genuine packet schema validator but fake the expensive M3/QuickHull:
 // the DOM contract must not depend on a guessed candidate before user opt-in.
 let reconstructs=0,compileCalls=0;
 const scopedRequire=name=>{
  if(name.includes('c1-authenticated-dxf-to-reviewed-v5.cjs')){
   const real=originalRequire(name);
   return {...real,
    reconstructC1FromDxfGiven:async()=>{reconstructs++;
     return {inferred:{candidateGeometry:tetra,
      knownViewPair:['V','H'],missingView:'W',
      inferredOriginal3DPointCount:4,
      explicitlyReviewedManyToOnePaperProjectionPairs:false,
      independentlyValidatedByCurrentM0:true}};},
    compileReviewedC1DxfGivenToSoleV5:async({givenPacket,revision,sheetTransform})=>{
     compileCalls++;
     assert.deepEqual(JSON.parse(JSON.stringify(sheetTransform)),
      buildC1DxfGivenFirstPaper(givenPacket).transform,
      'the canonical V5 sheet frame must come from GIVEN only');
     const steps=[{id:'given0',title:'仅核对原始点',dependsOn:[],
      explanation:'真实原题来源投影点',actions:[{id:'point0',kind:'point',
       geometry:{center:{x:390,y:290},radius:4}}]}];
     const timeline=Timeline.compileTimeline(steps);
     const player=Timeline.createPlayer(timeline,{revision});
     return {solution:{
      revision,singleOriginalV5Player:true,player,steps,timeline,
      certifiedVisibleContourLineBindings:[],
      certifiedPhysicalLineBindings:[],
      certifiedVisibleContourLineActionCount:0,
      certifiedPhysicalLineActionCount:0,
      intents:[{id:'given0',source:{solver:'reviewed-given',proofScope:'original-point-only'}}],
      threeViewSvgSheet:{sheetSvg:
       '<svg data-forbidden-final-answer="true"><line x1="1" y1="2" x2="3" y2="4"/></svg>'},
      m0M3M5PhysicalSourceAcceptance:{status:'bounded-original-source-math-acceptance'}
     },scopedConvexAcceptance:{
      realTextbookBlindTestPassed:false,scopedSingleConvexFullyCertified:false,
      checkedOriginalPhysicalEdgeViews:18,positiveGapCount:2,
      overlappingCertifiedSourceCount:0,
      perViewSourceCoverage:Object.fromEntries(['V','H','W'].map(v=>[v,{
       checkedOriginalPhysicalEdgeViews:6,positiveGapCount:v==='W'?2:0,
       overlappingCertifiedSourceCount:0,allOriginalPhysicalSourceRangesAccounted:false
      }])),
      missingObligations:['original generated HLR history and continuous occlusion']
     }};
    }
   };
  }
  return originalRequire(name);
 };
 const code=fs.readFileSync(entry,'utf8');
 vm.runInNewContext(code,{
  document,window,require:scopedRequire,URL:{
   createObjectURL:()=>{throw Error('not called');},revokeObjectURL:()=>{}
  },performance:{now:()=>0},requestAnimationFrame:()=>0,
  cancelAnimationFrame:()=>{},console
 },{filename:entry});
 const $=id=>document.getElementById(id);
 const mode=()=>document.querySelector('#sheetPreview svg')?.getAttribute('data-c1-paper-mode');
 assert.equal($('showCandidate').disabled,true);
 assert.equal(mode(),undefined);
 $('givenFile').dispatchEvent(new window.Event('change'));
 for(let i=0;i<8&&!reconstructs;i++)await tick();
 for(let i=0;i<8&&$('showCandidate').disabled;i++)await tick();
 assert.equal(reconstructs,1);
 assert.equal(mode(),'given','candidate must not appear before explicit click');
 assert.equal(document.querySelectorAll('#sheetPreview [data-source-point-only]').length,8);
 assert.equal(document.querySelectorAll('#sheetPreview [data-c1-unanswered-view="W"]').length,1);
 assert.equal(document.querySelectorAll('#sheetPreview line').length,0);
 assert.equal($('showCandidate').disabled,false);
 assert.equal(compileCalls,0);
 $('showCandidate').dispatchEvent(new window.Event('click'));
 assert.equal(mode(),'unsigned-candidate');
 assert.equal(document.querySelectorAll('#sheetPreview line').length,18);
 assert.match($('paperMode').textContent,/不是已验证作图/);
 assert.equal(compileCalls,0);
 $('showGiven').dispatchEvent(new window.Event('click'));
 assert.equal(mode(),'given');
 assert.equal(document.querySelectorAll('#sheetPreview [data-c1-unanswered-view="W"]').length,1);
 $('sourcePairs').value='0,0\n0,1\n1,2\n2,3';
 $('sourcePairs').dispatchEvent(new window.Event('input'));
 assert.equal($('showCandidate').disabled,true);
 assert.equal(mode(),'given');
 assert.equal($('reviewCheck').checked,false);
 assert.equal($('compile').disabled,true);
 assert.equal(document.querySelectorAll('#animation > *').length,0);
 assert.equal(compileCalls,0);
 // Reconfirm actual original source correspondence, then exercise the
 // REAL page compile/paint flow with a maliciously prefilled final SVG.
 $('applyPairs').dispatchEvent(new window.Event('click'));
 for(let i=0;i<8&&$('reviewCheck').disabled;i++)await tick();
 assert.equal($('reviewCheck').disabled,false);
 $('reviewCheck').checked=true;
 $('reviewCheck').dispatchEvent(new window.Event('change'));
 assert.equal($('compile').disabled,false);
 $('compile').dispatchEvent(new window.Event('click'));
 for(let i=0;i<8&&!compileCalls;i++)await tick();
 for(let i=0;i<8&&$('v5StepJump').disabled;i++)await tick();
 assert.equal(compileCalls,1);
 assert.equal(mode(),'given','even after compile the original third view stays blank');
 assert.equal(document.querySelectorAll('#sheetPreview line').length,0);
 assert.equal(document.querySelectorAll('#sheetPreview [data-c1-unanswered-view="W"]').length,1);
 assert.equal(document.querySelectorAll('#animation [data-source-point-only]').length,8);
 assert.equal(document.querySelectorAll('#animation [data-action-id]').length,0);
 assert.equal(document.querySelectorAll('[data-forbidden-final-answer]').length,0);
 assert.match($('paperMode').textContent,/空白待求视图/);
 assert.equal($('v5StepJump').disabled,false);
});
