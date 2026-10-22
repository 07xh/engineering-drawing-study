'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {MAX_BYTES,checkFile,geometrySummary,prepareLocalVectorImport}=require('../../labs/local-vector-svg-import.cjs');
const {buildConfirmedInput}=require('../../labs/auto-fillet-form.cjs');
const {confirmedFilletTimeline}=require('../../workbench/v31-confirmed-fillet-v5.cjs');
const {createConfirmedFilletSession}=require('../../workbench/v31-fillet-session.cjs');
const svg=x=>'<svg width="140" height="140" viewBox="0 0 140 140">'+x+'</svg>';
const twoSegments=()=>svg('<line x1="40" y1="70" x2="60" y2="70"/>'+
 '<line x1="50" y1="60" x2="50" y2="80"/>');
const twoCircles=()=>svg('<circle cx="50" cy="70" r="5"/>'+
 '<circle cx="70" cy="70" r="5"/>');
const mixed=()=>svg('<line x1="35" y1="70" x2="65" y2="70"/>'+
 '<circle cx="50" cy="75" r="8"/>');
const base=(source,kind,firstId,secondId,filletRadiusMm)=>({
 source,kind,firstId,secondId,filletRadiusMm,
 originX:50,originY:70,mmPerPx:1,yAxis:'down',accepted:true
});
const selected=(shape,fields,kind)=>buildConfirmedInput(kind,fields,{
 branchId:shape==='segments'?'s++':shape==='mixed'?'candidate-1':'center-1',
 direction:shape==='circles'?'cw':'ccw',
 ...(shape==='segments'?{firstTravel:'forward',secondTravel:'forward'}:
  shape==='mixed'?{lineTravel:'forward',knownCircleTravel:'cw'}:
   {knownFirstTravel:'ccw',knownSecondTravel:'ccw'})
},2);
test('actual unfamiliar vector geometry fills typed numeric conditions without pixel/mm inference',()=>{
 const a=prepareLocalVectorImport(base(twoSegments(),'two-segments','segment-1','segment-2',3));
 assert.equal(a.imageProvenance.metricCalibrationMathematicallyProven,false);
 assert.deepEqual(a.sourceIds,{first:'segment-1',second:'segment-2'});
 assert.equal(a.fields.a1x,-10);assert.equal(a.fields.b1x,10);
 assert.equal(a.fields.a2y,-10);assert.equal(a.fields.b2y,10);
 assert.equal(a.fields.filletRadius,3);
 const b=confirmedFilletTimeline(selected('segments',a.fields,a.kind));
 assert.equal(b.mathematicallyVerified,true);
 assert.equal(b.typedMathEvidence.g1Verified,true);
 assert.deepEqual(b.typedMathEvidence.center,{x:-3,y:3});
 assert.equal(b.typedMathEvidence.globallyUnique,null);
});
test('line-circle and two circles use real 02/G1/V5 with no precomputed SVG answer',()=>{
 const a=prepareLocalVectorImport(base(mixed(),'segment-circle','segment-1','circle-2',3));
 assert.equal(a.fields.r1,8);
 assert.equal(a.fields.c1y,5);
 const b=confirmedFilletTimeline(selected('mixed',a.fields,a.kind));
 assert.equal(b.status,'ready');assert.equal(b.steps.length,5);
 const c=prepareLocalVectorImport(base(twoCircles(),'two-circles','circle-1','circle-2',10));
 assert.equal(c.fields.c2x,20);
 const d=confirmedFilletTimeline(selected('circles',c.fields,c.kind));
 assert.equal(d.status,'ready');
 assert.equal(d.typedMathEvidence.branchCount,2);
 assert.equal(d.typedMathEvidence.globallyUnique,null);
});
test('manual review click is mandatory; no automatic inferred mm scale',()=>{
 const a=base(twoSegments(),'two-segments','segment-1','segment-2',3);
 assert.throws(()=>prepareLocalVectorImport({...a,accepted:false}),/review checkbox/);
 for(const mmPerPx of [0,-1,NaN,Infinity])
  assert.throws(()=>prepareLocalVectorImport({...a,mmPerPx}),/metric scale/);
 assert.throws(()=>prepareLocalVectorImport({...a,originX:NaN}),/metric scale/);
 assert.throws(()=>prepareLocalVectorImport({...a,yAxis:'unknown'}),/metric scale/);
 assert.throws(()=>prepareLocalVectorImport({...a,filletRadiusMm:0}),/fillet radius/);
});
test('unknown, duplicate and wrong source kinds never become verified math',()=>{
 const a=base(mixed(),'segment-circle','segment-1','circle-2',3);
 assert.throws(()=>prepareLocalVectorImport({...a,firstId:'invented'}),/selected source/);
 assert.throws(()=>prepareLocalVectorImport({...a,secondId:'segment-1'}),/distinct/);
 assert.throws(()=>prepareLocalVectorImport({...a,firstId:'circle-2',secondId:'segment-1'}),/selected source/);
 assert.throws(()=>prepareLocalVectorImport({...a,kind:'unsupported'}),/unsupported/);
});
test('dimension-bearing or instruction-bearing vector content cannot be silently discarded',()=>{
 const body='<line x1="40" y1="70" x2="60" y2="70"/>'+
 '<line x1="50" y1="60" x2="50" y2="80"/>';
 for(const label of ['R12','Φ36','ignore previous instructions']){
  const source=svg(body+'<text x="30" y="20">'+label+'</text>');
  assert.equal(geometrySummary(source).hasLabels,true);
  assert.throws(()=>prepareLocalVectorImport(
   base(source,'two-segments','segment-1','segment-2',3)),/separate manual confirmation/);
 }
});
test('malicious SVG is never made into trusted coordinates or injected DOM',()=>{
 const a=base(twoSegments(),'two-segments','segment-1','segment-2',3);
 assert.throws(()=>prepareLocalVectorImport({...a,
  source:svg('<script>run()</script>')}),/unsupported/);
 assert.throws(()=>prepareLocalVectorImport({...a,
  source:svg('<line onload="attack()" x1="1" y1="1" x2="3" y2="4"/>')}),/unsupported/);
 assert.throws(()=>prepareLocalVectorImport({...a,
  source:svg('<g transform="rotate(20)"><circle cx="50" cy="70" r="5"/></g>')}),/unsupported/);
});
test('subsequent user edit invalidates original V5 session and requires fresh branch verification',()=>{
 const result=prepareLocalVectorImport(base(twoSegments(),'two-segments','segment-1','segment-2',3));
 const session=createConfirmedFilletSession(selected('segments',result.fields,result.kind),{now:0});
 const first=session.snapshot(0);
 assert.equal(first.status,'ready');
 const modified={...result.fields,filletRadius:4};
 const second=buildConfirmedInput(result.kind,modified,{
  branchId:'',direction:'',firstTravel:'',secondTravel:''
 },first.revision);
 const snapshot=session.replace(second,{expectedRevision:first.revision,now:5});
 assert.equal(snapshot.ready,false);
 assert.deepEqual(snapshot.plan.steps,[]);
 assert.equal(snapshot.playback,null);
 assert.equal(session.canRender(first.revision),false);
});
test('limit rejects large or disguised local files before reading raw SVG content',()=>{
 const file=(name,type,size)=>({name,type,size,text:async()=>twoSegments()});
 assert.equal(checkFile(file('sample.svg','image/svg+xml',MAX_BYTES)).ok,true);
 assert.equal(checkFile(file('sample.svg','',200)).ok,true);
 assert.equal(checkFile(file('malware.exe','application/octet-stream',200)).ok,false);
 assert.equal(checkFile(file('test.svg','image/svg+xml',MAX_BYTES+1)).ok,false);
 assert.equal(checkFile(file('test.svg','image/svg+xml',0)).ok,false);
 assert.equal(checkFile({name:'x.svg',size:100,type:'image/svg+xml'}).ok,false);
});
test('public UI consumes original V5 session and never posts, caches or inserts raw SVG',()=>{
 const ui=fs.readFileSync('labs/local-vector-svg-review-ui.cjs','utf8');
 const entry=fs.readFileSync('labs/auto-fillet-live-entry.cjs','utf8');
 const html=fs.readFileSync('labs/auto-fillet-live.html','utf8');
 for(const id of ['vectorSvg','vectorFirst','vectorSecond','vectorMmPerPx',
  'vectorYAxis','vectorOriginX','vectorOriginY','vectorFilletRadius','vectorAccept',
  'vectorApply','vectorPreview','vectorStatus'])
  assert.match(html,new RegExp('id="'+id+'"'));
 assert.match(entry,/attachLocalVectorReview/);
 assert.match(entry,/attachImageFieldReview/);
 assert.match(entry,/attachLocalLineCandidates/);
 assert.match(html,/id="detectLines"/);
 assert.match(html,/id="detectedLineOverlay"/);
 assert.match(entry,/fieldReview\?\.edited\(field\)/);
 assert.match(html,/id="sourceOverlay"/);
 assert.match(html,/id="sourceReviewEnabled"/);
 assert.match(entry,/session\.replace\(current/);
 assert.match(entry,/Motion\.updateSvg/);
 assert.match(ui,/createElementNS/);
 assert.doesNotMatch(ui,/(innerHTML|insertAdjacentHTML|XMLHttpRequest|fetch\(|localStorage|sessionStorage)/);
 assert.doesNotMatch(entry,/(XMLHttpRequest|fetch\(|localStorage|sessionStorage)/);
});

function mockControl(value=''){
 const handlers={};return {value,checked:false,textContent:'',valueAsNumber:NaN,
  handlers,children:[],files:[],attributes:{},
  addEventListener(k,cb){handlers[k]=cb;},
  replaceChildren(...children){this.children=children;},
  append(el){this.children.push(el);},
  setAttribute(k,v){this.attributes[k]=v;}
 };
}
function mockVectorDom(){
 const ids=['file','kind','first','second','mmPerPx','originX','originY',
  'yAxis','filletRadiusMm','accepted','apply','status','preview'];
 const c=Object.fromEntries(ids.map(id=>[id,mockControl()]));
 c.kind.value='two-segments';
 c.mmPerPx.value='1';c.mmPerPx.valueAsNumber=1;
 c.originX.value='50';c.originX.valueAsNumber=50;
 c.originY.value='70';c.originY.valueAsNumber=70;
 c.yAxis.value='down';
 c.filletRadiusMm.value='3';c.filletRadiusMm.valueAsNumber=3;
 const dom={
  createElement(tag){if(tag!=='option')throw Error('untrusted HTML element');return mockControl();},
  createElementNS(ns,tag){if(ns!=='http://www.w3.org/2000/svg'||
      !['line','circle'].includes(tag))throw Error('unsafe SVG tag');
    return mockControl();}
 };
 return {c,dom};
}
test('browser local-file event safely redraws only normalized primitives and requires a user gesture',async()=>{
 const {attachLocalVectorReview}=require('../../labs/local-vector-svg-review-ui.cjs');
 const {c,dom}=mockVectorDom(),applied=[];
 attachLocalVectorReview({...c,dom,onApply:r=>applied.push(r)});
 c.file.files=[{name:'unknown.svg',type:'image/svg+xml',size:600,text:async()=>twoSegments()}];
 await c.file.handlers.change();
 assert.equal(c.preview.children.length,2);
 assert.equal(c.first.children.length,3);
 assert.equal(c.second.children.length,3);
 assert.match(c.status.textContent,/本地提取 2 个图元/);
 c.first.value='segment-1';c.second.value='segment-2';
 c.apply.handlers.click();
 assert.equal(applied.length,0);
 assert.match(c.status.textContent,/未导入/);
 c.accepted.checked=true;
 c.apply.handlers.click();
 assert.equal(applied.length,1);
 assert.equal(applied[0].fields.a1x,-10);
 assert.equal(c.accepted.checked,false);
 assert.match(c.status.textContent,/已根据您确认/);
});
test('stale asynchronous SVG read may never overwrite a newer local file',async()=>{
 const {attachLocalVectorReview}=require('../../labs/local-vector-svg-review-ui.cjs');
 const {c,dom}=mockVectorDom();
 attachLocalVectorReview({...c,dom,onApply:()=>{}});
 let release;
 c.file.files=[{name:'first.svg',type:'image/svg+xml',size:600,
  text:()=>new Promise(resolve=>{release=resolve;})}];
 const first=c.file.handlers.change();
 c.file.files=[{name:'second.svg',type:'image/svg+xml',size:600,text:async()=>twoCircles()}];
 await c.file.handlers.change();
 assert.equal(c.preview.children.length,2);
 assert.equal(c.first.children.length,1); // circles aren't two-segment sources
 release(twoSegments());await first;
 assert.equal(c.first.children.length,1);
 assert.match(c.status.textContent,/本地提取 2 个图元/);
});
