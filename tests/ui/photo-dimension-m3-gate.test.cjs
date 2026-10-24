'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),{parseHTML}=require('linkedom');
const {webcrypto}=require('node:crypto');
const {attachLocalPhotoByteSession}=
 require('../../labs/local-photo-byte-session.cjs');
const {attachReviewedDimensionDraftUi:mountGate}=
 require('../../labs/local-reviewed-dimension-draft-ui.cjs');
const {newDraft}=require('../../recognition/problem-draft.cjs');
const {normalizeNativeDetections}=require('../../recognition/browser-native-dimension-ocr.cjs');
const {proposeDimensionPaths,reviewDimensionPath}=
 require('../../recognition/reviewed-dimension-path.cjs');
const ids={
 refresh:'dimensionDraftRefresh',geometry:'dimensionDraftGeometry',
 candidates:'dimensionDraftCandidates',rulerA:'dimensionRulerA',
 rulerAMm:'dimensionRulerAMm',rulerB:'dimensionRulerB',
 rulerBMm:'dimensionRulerBMm',originX:'dimensionDraftOriginX',
 originY:'dimensionDraftOriginY',yAxis:'dimensionDraftYAxis',
 scaleChecked:'dimensionDraftScaleChecked',
 geometryChecked:'dimensionDraftGeometryChecked',
 alternativesChecked:'dimensionDraftAlternativesChecked',
 commit:'dimensionDraftCommit',attach:'dimensionDraftAttach',
 status:'dimensionDraftStatus',segment:'dimensionDraftSegment',
 targetRadius:'dimensionDraftTargetRadius',side:'dimensionDraftSide',
 m3Accept:'dimensionDraftM3Accept',
 preflight:'dimensionDraftPreflight',apply:'dimensionDraftApply',
 m3Status:'dimensionDraftM3Status'
};
const photo={width:600,height:400};
const image={...photo,byteLength:50000,mediaType:'image/png'};
const ocr=normalizeNativeDetections([{
 rawValue:'R8',boundingBox:{x:40,y:35,width:60,height:25}
}],photo,photo)[0];
const bb=(a,b)=>[Math.min(a.x,b.x),Math.min(a.y,b.y),
 Math.max(1,Math.abs(a.x-b.x)),Math.max(1,Math.abs(a.y-b.y))];
const raw=(id,a,b)=>({id,kind:'line',
 coordinateSpace:'original-image-px',bbox:bb(a,b),
 from:a,to:b,confirmed:false});
const first=raw('line_1',{x:100,y:250},{x:200,y:250});
const second=raw('line_2',{x:100,y:280},{x:250,y:280});
const leader=raw('line_3',{x:100,y:50},{x:170,y:120});
const circle={id:'curve_1',kind:'circle',
 coordinateSpace:'original-image-px',bbox:[165,110,80,80],confirmed:false};
const alternative={id:'curve_2',kind:'arc',
 coordinateSpace:'original-image-px',bbox:[175,110,80,80],confirmed:false};
const arrow={shaftCandidateId:'line_3',endpoint:'to',
 coordinateSpace:'original-image-px',arrowheadVerified:false,
 requiresHumanReview:true,heuristicScore:.8};
const rect=b=>({x:b[0],y:b[1],width:b[2],height:b[3]});
const makeLine=x=>({id:x.id,kind:'segment',method:'detector',
 confidence:.6,reviewStatus:'unconfirmed',
 bbox:rect(x.bbox),geometry:{frame:'drawing-px',from:{...x.from},
 to:{...x.to}}});
const geometry=()=>newDraft({image,candidates:[
 makeLine(first),makeLine(second),makeLine(leader),{
  id:'curve_1',kind:'circle',method:'detector',
  confidence:.7,reviewStatus:'unconfirmed',bbox:rect(circle.bbox),
  geometry:{frame:'drawing-px',center:{x:205,y:150},radiusPx:40}
 }
]});
function mount(initialPhotoIdentity=null){
 const source=fs.readFileSync('labs/auto-fillet-live.html','utf8');
 const {document,window}=parseHTML(source);
 Object.defineProperty(window.HTMLInputElement.prototype,'valueAsNumber',{
  configurable:true,get(){return this.value.trim()===''?NaN:Number(this.value)}
 });
 Object.defineProperty(window.HTMLInputElement.prototype,'checked',{
  configurable:true,get(){return this.hasAttribute('checked')},
  set(x){this.toggleAttribute('checked',!!x)}
 });
 Object.defineProperty(window.HTMLSelectElement.prototype,'value',{
  configurable:true,get(){return (this.querySelector('option[selected]')||
   this.querySelector('option'))?.value||''},
  set(x){for(const o of this.querySelectorAll('option'))
   o.toggleAttribute('selected',o.value===String(x))}
 });
 const get=id=>document.getElementById(id);
 const controls=Object.fromEntries(Object.entries(ids).map(([k,id])=>[k,get(id)]));
 for(const [id,c] of Object.entries(controls))
  assert.ok(c,'missing real page control '+id);
 let current=geometry(),generation=3,valid=true,filled=[];
 let photoIdentity=initialPhotoIdentity;
 const candidates=proposeDimensionPaths({dimension:ocr,lines:[leader],
  curves:[circle,alternative],arrows:[arrow],image:photo});
 const selected=candidates.proposals.find(x=>x.pathKind==='straight'&&
  x.curveCandidateId==='curve_1');
 assert.ok(selected);
 const proofInput={
  dimension:ocr,lines:[leader],curves:[circle,alternative],arrows:[arrow],
  image:photo,selectedPathId:selected.id,
  sourceEpoch:7,currentSourceEpoch:7,
  revision:0,expectedRevision:0,reviewedTextValueMm:8,
  unitsConfirmed:true,textConfirmed:true,pathConfirmed:true,
  curveConfirmed:true,arrowReviewed:true,finalAccepted:true,
  answerMark:'contains-answers'
 };
 assert.equal(reviewDimensionPath(proofInput).sourceLinkManuallyAccepted,true);
 const gate=mountGate({controls,dom:document,
  getDraft:()=>current,getGeneration:()=>generation,
  ...(initialPhotoIdentity?{getPhotoIdentity:()=>typeof photoIdentity==='function'?photoIdentity():photoIdentity}:{}),
  getReviewForDraft:rev=>valid?{...proofInput,
   revision:rev,expectedRevision:rev}:null,
  onPrepared:output=>filled.push(output)
 });
 const click=id=>controls[id].click();
 const set=(id,value,type='change')=>{
  controls[id].value=String(value);
  controls[id].dispatchEvent(new window.Event(type,{bubbles:true}));
 };
 const check=(id)=>{controls[id].checked=true;controls[id].dispatchEvent(
  new window.Event('change',{bubbles:true}));};
 const decide=(id,decision)=>{
  const el=controls.candidates.querySelector(
   '[data-draft-review-id="'+id+'"]');
  assert.ok(el,'review row '+id);
  el.value=decision;el.dispatchEvent(new window.Event('change',{bubbles:true}));
 };
 const preparedSource=()=>{
  click('refresh');
  for(const id of ['line_1','line_2','line_3','curve_1'])
   decide(id,'confirmed');
  set('rulerA','line_1');set('rulerB','line_2');
  set('rulerAMm','20','input');set('rulerBMm','30','input');
  set('segment','line_1');
  check('scaleChecked');check('geometryChecked');check('commit');
 };
 return {controls,document,window,gate,click,set,check,decide,
  preparedSource,filled,
  setPhotoIdentity:v=>{photoIdentity=v},
  invalidatePhoto(){current=null;generation++;valid=false;}
 };
}
test('09 real photo review HTML starts blocked and never treats OCR text as solved geometry',()=>{
 const a=mount();
 assert.equal(a.controls.attach.disabled,true);
 assert.equal(a.controls.preflight.disabled,true);
 assert.equal(a.controls.apply.disabled,true);
 a.click('attach');
 assert.equal(a.gate.status,'unreviewed');
 assert.equal(a.filled.length,0);
});
test('09 competitors require individual review; TWO independent rulers create existing versioned ProblemDraft',()=>{
 const a=mount();a.preparedSource();a.click('attach');
 assert.equal(a.gate.status,'unreviewed');
 assert.match(a.controls.status.textContent,/ambiguous-associations/);
 a.check('alternativesChecked');a.check('commit');a.click('attach');
 assert.equal(a.gate.status,'dimension-attached-to-existing-draft');
 assert.match(a.controls.status.textContent,/ProblemDraft/);
 assert.match(a.controls.status.textContent,/0.000%/);
 assert.equal(a.controls.preflight.disabled,false);
 assert.equal(a.controls.apply.disabled,true);
 assert.equal(a.filled.length,0);
});
test('09 true M3 preflight calculates possible branches but never chooses nor plays until explicit transfer',()=>{
 const a=mount();a.preparedSource();
 a.check('alternativesChecked');a.check('commit');a.click('attach');
 assert.equal(a.gate.status,'dimension-attached-to-existing-draft');
 a.set('targetRadius','10','input');a.set('side','1');
 a.check('m3Accept');a.click('preflight');
 assert.match(a.controls.m3Status.textContent,/M3/);
 assert.ok(['unique','multiple'].includes(a.gate.m3Status));
 assert.equal(a.controls.apply.disabled,false);
 assert.equal(a.filled.length,0);
 a.click('apply');
 assert.equal(a.filled.length,1);
 assert.equal(a.filled[0].problem.kind,'segment-circle');
 assert.equal(a.filled[0].fields.r1,8);
 assert.equal(a.filled[0].fields.filletRadius,10);
 assert.equal(a.filled[0].requiresFinalFieldReview,true);
 assert.equal(a.filled[0].requiresBranchSelection,true);
 assert.equal(a.controls.apply.disabled,true);
 assert.equal(a.gate.m3Status,'not-executed');
});
test('09 a mismatched second-ruler scale or changed OCR/photo blocks every M3 transition',()=>{
 const a=mount();a.preparedSource();a.check('alternativesChecked');
 a.set('rulerBMm','37','input');a.check('commit');a.click('attach');
 assert.match(a.controls.status.textContent,/inconsistent-calibration/);
 assert.equal(a.controls.preflight.disabled,true);
 a.invalidatePhoto();
 a.click('refresh');
 assert.equal(a.controls.attach.disabled,true);
 assert.equal(a.filled.length,0);
});
test('09 changing any accepted scale, source or M3 condition invalidates prior permission and no old V5 remains',()=>{
 const a=mount();a.preparedSource();a.check('alternativesChecked');
 a.check('commit');a.click('attach');a.set('targetRadius','10','input');a.set('side','1');
 a.check('m3Accept');a.click('preflight');
 assert.equal(a.controls.apply.disabled,false);
 a.set('rulerAMm','22','input');
 assert.equal(a.controls.apply.disabled,true);
 assert.equal(a.controls.preflight.disabled,true);
 assert.equal(a.gate.status,'unreviewed');
 assert.equal(a.filled.length,0);
});
test('09 actual public entry uses current OCR/raster modules, existing typed M3 and original workbench final V5',()=>{
 const src=fs.readFileSync('labs/auto-fillet-live-entry.cjs','utf8');
 const control=fs.readFileSync('labs/local-reviewed-dimension-draft-ui.cjs','utf8');
 assert.match(src,/attachReviewedDimensionDraftUi\(/);
 assert.match(src,/getDraft:\(\)=>rasterReview\?\.draft/);
 assert.match(src,/getReviewForDraft:rev=>nativeOcrUi\?\.getReviewForDraft/);
 assert.match(src,/fieldReview\?\.edited\(name\)/);
 assert.match(control,/makeDimensionConstraint\(/);
 assert.match(control,/prepareSpecialistInput\(/);
 assert.match(control,/solveFiniteFillet\(/);
 assert.doesNotMatch(control,/compileTimeline|createPlayer|new TextDetector|fetch\(|localStorage|XMLHttpRequest/);
});

test('09 changing second independently reviewed ruler after actual M3 revokes transfer',()=>{
 const a=mount();a.preparedSource();a.check('alternativesChecked');
 a.check('commit');a.click('attach');a.set('targetRadius','10','input');
 a.set('side','1');a.check('m3Accept');a.click('preflight');
 assert.equal(a.controls.apply.disabled,false);
 a.set('rulerBMm','31','input');
 assert.equal(a.controls.apply.disabled,true);
 assert.equal(a.controls.preflight.disabled,true);
 assert.equal(a.gate.m3Status,'not-executed');
 a.click('apply');
 assert.equal(a.filled.length,0);
});
test('09 changing photo source generation after actual M3 prevents stale transfer',()=>{
 const a=mount();a.preparedSource();a.check('alternativesChecked');
 a.check('commit');a.click('attach');a.set('targetRadius','10','input');
 a.set('side','1');a.check('m3Accept');a.click('preflight');
 assert.equal(a.controls.apply.disabled,false);
 a.invalidatePhoto();
 a.click('apply');
 assert.equal(a.filled.length,0);
 assert.equal(a.controls.apply.disabled,true);
});

test('09 actual photo M3 preflight requires witnessed isolation and rechecks binding on transfer',()=>{
 const code=fs.readFileSync('labs/local-reviewed-dimension-draft-ui.cjs','utf8');
 assert.match(code,/isolateReviewedDraft\(accepted/);
 assert.match(code,/isolation\.status!=='reviewed-conditions-isolated'/);
 assert.match(code,/isolationSourceBinding/);
 const a=mount();a.preparedSource();a.check('alternativesChecked');
 a.check('commit');a.click('attach');a.set('targetRadius','10','input');
 a.set('side','1');a.check('m3Accept');a.click('preflight');
 assert.ok(['unique','multiple'].includes(a.gate.m3Status));
 a.click('apply');
 assert.equal(a.filled.length,1);
 assert.equal(a.filled[0].requiresFinalFieldReview,true);
 assert.equal(a.filled[0].requiresBranchSelection,true);
});

test('REAL file-byte proof callback must be current before native reviewed-photo M3 entry',()=>{
 const digest={sha256:'ab'.repeat(32),epoch:1,width:600,height:400,
  originalFileBytesRead:true};
 const a=mount(digest);
 a.preparedSource();a.check('alternativesChecked');
 a.check('commit');a.click('attach');a.set('targetRadius','10','input');
 a.set('side','1');a.check('m3Accept');a.click('preflight');
 assert.ok(['unique','multiple'].includes(a.gate.m3Status));
 assert.equal(a.controls.apply.disabled,false);
 const evidence=a.gate.getEvidenceSnapshot();
 assert.equal(evidence.photoByteSha256,digest.sha256);
 a.setPhotoIdentity({...digest,sha256:'cd'.repeat(32)});
 a.click('apply');
 assert.equal(a.filled.length,0,'same-sized but different original bytes must revoke old math transfer');
 assert.equal(a.controls.apply.disabled,true);
});
test('REAL file byte session identity rejects same-photo SHA with changed attachment epoch',()=>{
 const digest={sha256:'ab'.repeat(32),epoch:1,width:600,height:400,
  originalFileBytesRead:true};
 const a=mount(digest);
 a.preparedSource();a.check('alternativesChecked');
 a.check('commit');a.click('attach');a.set('targetRadius','10','input');
 a.set('side','1');a.check('m3Accept');a.click('preflight');
 assert.equal(a.controls.apply.disabled,false);
 a.setPhotoIdentity({...digest,epoch:2});
 a.click('apply');
 assert.equal(a.filled.length,0);
 assert.equal(a.controls.apply.disabled,true);
});
test('REAL M3 review refuses absent SHA, stale dimensions and unverified file byte flags',()=>{
 const base={sha256:'ab'.repeat(32),epoch:1,width:600,height:400,
  originalFileBytesRead:true};
 for(const bad of [null,{...base,width:599},{...base,sha256:'invalid'},
  {...base,originalFileBytesRead:false}]){
  const a=mount(base);a.setPhotoIdentity(bad);a.click('refresh');
  assert.equal(a.gate.status,'unreviewed');
  assert.equal(a.controls.attach.disabled,true);
 }
});

function localFile(bytes){
 const copy=new Uint8Array(bytes);
 return {type:'image/png',size:copy.byteLength,
  async arrayBuffer(){return copy.slice().buffer;}};
}
function mountRealFileSession(){
 let shaSession=null;
 const a=mount(()=>shaSession?.snapshot()??null),
  photoInput=a.document.getElementById('problemPhoto'),
  preview=a.document.getElementById('photoPreview'),
  clear=a.document.getElementById('clearPhoto');
 Object.defineProperty(preview,'naturalWidth',{
  configurable:true,value:600
 });
 Object.defineProperty(preview,'naturalHeight',{
  configurable:true,value:400
 });
 const original=localFile([137,80,78,71,13,10,26,10,1,2,3,4,5,6]);
 Object.defineProperty(photoInput,'files',{
  configurable:true,value:[original]
 });
 shaSession=attachLocalPhotoByteSession({
  fileInput:photoInput,photoClear:clear,image:preview,
  subtle:webcrypto.subtle
 });
 const setFile=v=>Object.defineProperty(photoInput,'files',{
  configurable:true,value:[v]
 });
 return {a,shaSession,photoInput,original,setFile};
}
test('09 actual WebCrypto source SHA256 → two user-reviewed rulers → M0 metric → real M3 preflight and transfer',async()=>{
 const {a,shaSession}=mountRealFileSession();
 assert.equal(a.gate.status,'unreviewed');
 // File exists but its hash has not been verified yet.
 a.click('refresh');
 assert.equal(a.controls.attach.disabled,true);
 const valid=await shaSession.hashCurrent();
 assert.match(valid.sha256,/^[a-f0-9]{64}$/);
 a.preparedSource();
 a.check('alternativesChecked');a.check('commit');a.click('attach');
 assert.equal(a.gate.status,'dimension-attached-to-existing-draft');
 assert.equal(a.gate.getEvidenceSnapshot()?.photoByteSha256,valid.sha256);
 a.set('targetRadius','10','input');
 a.set('side','1');a.check('m3Accept');a.click('preflight');
 assert.ok(['unique','multiple'].includes(a.gate.m3Status));
 assert.equal(a.controls.apply.disabled,false);
 a.click('apply');
 assert.equal(a.filled.length,1);
 assert.equal(a.filled[0].problem.unit,'mm');
 assert.equal(a.filled[0].requiresFinalFieldReview,true);
 assert.equal(a.filled[0].requiresBranchSelection,true);
 assert.equal(a.controls.apply.disabled,true);
});
test('09 same size different ORIGINAL file bytes revoke a genuine M3 preflight before transfer',async()=>{
 const {a,shaSession,setFile}=mountRealFileSession();
 const first=await shaSession.hashCurrent();
 a.preparedSource();a.check('alternativesChecked');
 a.check('commit');a.click('attach');a.set('targetRadius','10','input');
 a.set('side','1');a.check('m3Accept');a.click('preflight');
 assert.ok(['unique','multiple'].includes(a.gate.m3Status));
 assert.equal(a.controls.apply.disabled,false);
 const changed=localFile([137,80,78,71,13,10,26,10,1,2,3,4,5,7]);
 setFile(changed);
 // Even BEFORE new hashing finishes, original File identity mismatch
 // revokes the old SHA source and the old user-reviewed math result.
 assert.equal(shaSession.snapshot(),null);
 a.click('apply');
 assert.equal(a.filled.length,0);
 assert.equal(a.controls.apply.disabled,true);
 const second=await shaSession.hashCurrent();
 assert.notEqual(first.sha256,second.sha256);
 a.click('preflight');
 assert.equal(a.gate.m3Status,'not-executed');
 assert.equal(a.filled.length,0);
});
test('09 same content reattached as a NEW file invalidates old source attachment epoch',async()=>{
 const {a,shaSession,setFile}=mountRealFileSession();
 const initial=await shaSession.hashCurrent();
 a.preparedSource();a.check('alternativesChecked');
 a.check('commit');a.click('attach');a.set('targetRadius','10','input');
 a.set('side','1');a.check('m3Accept');a.click('preflight');
 assert.equal(a.controls.apply.disabled,false);
 const sameBytes=localFile([137,80,78,71,13,10,26,10,1,2,3,4,5,6]);
 setFile(sameBytes);
 const after=await shaSession.hashCurrent();
 assert.equal(initial.sha256,after.sha256);
 assert.notEqual(initial.epoch,after.epoch);
 a.click('apply');
 assert.equal(a.filled.length,0);
 assert.equal(a.controls.apply.disabled,true);
});
