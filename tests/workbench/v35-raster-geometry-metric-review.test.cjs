'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs');
const {candidateDraftFromRaster}=
 require('../../recognition/raster-primitive-draft.cjs');
const {prepareReviewedRasterImport}=
 require('../../labs/local-raster-fillet-import.cjs');
const {buildConfirmedInput}=require('../../labs/auto-fillet-form.cjs');
const {confirmedFilletTimeline}=require('../../workbench/v31-confirmed-fillet-v5.cjs');
const {createConfirmedFilletSession}=require('../../workbench/v31-fillet-session.cjs');
const {attachLocalRasterReview}=
 require('../../labs/local-raster-geometry-review-ui.cjs');

const image={width:120,height:120,byteLength:4096,mediaType:'image/png'};
const analysis={width:120,height:120};
const line=(id,x1,y1,x2,y2)=>({
 id,kind:'line',coordinateSpace:'image-px',
 bbox:[Math.min(x1,x2),Math.min(y1,y2),
  Math.max(1,Math.abs(x2-x1)),Math.max(1,Math.abs(y2-y1))],
 from:{x:x1,y:y1},to:{x:x2,y:y2},
 confidence:.65,method:'binary-hough-candidate/0.1'
});
const circle=(id,cx,cy,r)=>({
 id,kind:'circle',coordinateSpace:'image-px',
 bbox:[cx-r,cy-r,2*r,2*r],center:{x:cx,y:cy},radius:r,
 confidence:.7,method:'connected-ink-circlefit-candidate/0.1'
});
const pair={
 segments:{kind:'two-segments',lines:[
  line('line_1',40,70,60,70),line('line_2',50,60,50,80)],
  firstId:'line_1',secondId:'line_2',filletRadiusMm:3,
  choices:{branchId:'s++',direction:'ccw',
   firstTravel:'forward',secondTravel:'forward'}},
 mixed:{kind:'segment-circle',lines:[line('line_1',35,70,65,70)],
  curves:[circle('curve_1',50,75,8)],firstId:'line_1',
  secondId:'curve_1',filletRadiusMm:3,
  choices:{branchId:'candidate-1',direction:'ccw',
   lineTravel:'forward',knownCircleTravel:'cw'}},
 circles:{kind:'two-circles',curves:[circle('curve_1',50,70,5),
  circle('curve_2',70,70,5)],firstId:'curve_1',
  secondId:'curve_2',filletRadiusMm:10,
  choices:{branchId:'center-1',direction:'cw',
   knownFirstTravel:'ccw',knownSecondTravel:'ccw'}}
};
const draftOf=data=>candidateDraftFromRaster({image,analysis,
 lines:data.lines||[],curves:data.curves||[]}).draft;
function request(data,changes={}){
 const draft=draftOf(data),edits={};
 for(const c of draft.candidates)
  edits[c.id]=c.kind==='segment'
   ?{from:{...c.geometry.from},to:{...c.geometry.to}}
   :{center:{...c.geometry.center},radiusPx:c.geometry.radiusPx};
 return {draft,expectedRevision:draft.revision,
  kind:data.kind,firstId:data.firstId,secondId:data.secondId,edits,
  originX:50,originY:70,mmPerPx:1,yAxis:'down',
  filletRadiusMm:data.filletRadiusMm,
  lineSide:data.kind==='segment-circle'?1:undefined,
  accepted:true,...changes};
}
test('actual raster candidate descriptions become all 3 real math/G1/V5 types only after user review',()=>{
 for(const data of Object.values(pair)){
  const p=prepareReviewedRasterImport(request(data));
  assert.equal(p.kind,data.kind);
  assert.equal(p.geometrySourceReviewed,true);
  assert.equal(p.metricCalibrationMathematicallyProven,false);
  assert.equal(p.sourceCandidateProof,false);
  assert.equal(p.globallyUnique,null);
  const input=buildConfirmedInput(p.kind,p.fields,data.choices,p.reviewedDraftRevision);
  const result=confirmedFilletTimeline(input);
  assert.equal(result.mathematicallyVerified,true);
  assert.equal(result.typedMathEvidence.g1Verified,true);
  assert.equal(result.typedMathEvidence.globallyUnique,null);
 }
});
test('a human correction to source radius is reflected in typed mm values, not fake OCR proof',()=>{
 const p=request(pair.circles);
 p.edits.curve_1.radiusPx=6;
 const updated=prepareReviewedRasterImport(p);
 assert.equal(updated.fields.r1,6);
 assert.equal(updated.sourceFrame,'original-image-px');
 assert.ok(updated.reviewedDraftRevision>p.draft.revision);
});
test('source IDs, human acceptance and current draft revision are mandatory',()=>{
 const p=request(pair.mixed);
 for(const change of [
  {accepted:false},{expectedRevision:p.draft.revision+1},
  {secondId:'line_1'},{secondId:'nonexistent'},
  {kind:'two-circles'},{kind:'unsupported'},
  {edits:{'line_1':p.edits.line_1}}
 ])assert.throws(()=>prepareReviewedRasterImport({...p,...change}));
});
test('partial arc in a raster draft cannot become a full source circle',()=>{
 const arc={...circle('curve_1',60,62,22),
  kind:'arc',startAngle:35,endAngle:230,sweepDeg:195,
  sweepDirection:'cw-screen'};
 const partial={...pair.mixed,curves:[arc]};
 const p=request(partial);
 assert.throws(()=>prepareReviewedRasterImport(p),/unsupported/);
 const other={...pair.circles,curves:[arc,circle('curve_2',93,70,10)]};
 assert.throws(()=>prepareReviewedRasterImport(request(other)),/unsupported/);
});
test('invalid metric, missing target radius, wrong Y convention and nonfinite edits fail closed',()=>{
 const p=request(pair.segments);
 const cases=[
  {mmPerPx:0},{mmPerPx:NaN},{mmPerPx:Infinity},{mmPerPx:-1},
  {originX:NaN},{originY:Infinity},{yAxis:'unknown'},
  {filletRadiusMm:0},{filletRadiusMm:NaN},
  {edits:{...p.edits,line_1:{from:{x:NaN,y:70},to:{x:60,y:70}}}},
  {edits:{...p.edits,line_1:{from:{x:40,y:70},to:{x:40,y:70}}}},
  {edits:{...p.edits,line_1:{from:{x:-5,y:70},to:{x:60,y:70}}}}
 ];
 for(const change of cases)
  assert.throws(()=>prepareReviewedRasterImport({...p,...change}));
});
test('cropped corrected full circle and extra unexpected geometry keys are forbidden',()=>{
 const p=request(pair.circles);
 const changes=[
  {...p.edits,curve_1:{center:{x:5,y:10},radiusPx:20}},
  {...p.edits,curve_1:{center:{x:50,y:70},radiusPx:-2}},
  {...p.edits,curve_1:{center:{x:50,y:70},radiusPx:5,proof:true}},
  {...p.edits,curve_1:{center:{x:50,y:70,z:0},radiusPx:5}}
 ];
 for(const edits of changes)
  assert.throws(()=>prepareReviewedRasterImport({...p,edits}));
});
test('after field alteration existing V5 session clears formerly verified geometry',()=>{
 const data=pair.segments,p=prepareReviewedRasterImport(request(data));
 const confirmed=buildConfirmedInput(p.kind,p.fields,data.choices,p.reviewedDraftRevision);
 const session=createConfirmedFilletSession(confirmed,{now:0});
 const initial=session.snapshot(0);
 assert.equal(initial.ready,true);
 const mutated=buildConfirmedInput(p.kind,{...p.fields,filletRadius:4},
  {branchId:'',direction:'',firstTravel:'',secondTravel:''},initial.revision);
 const changed=session.replace(mutated,{expectedRevision:initial.revision,now:7});
 assert.equal(changed.ready,false);
 assert.equal(session.canRender(initial.revision),false);
 assert.deepEqual(changed.plan.steps,[]);
});

function control(value=''){
 const handlers={};
 return {value,handlers,children:[],get options(){return this.children},checked:false,hidden:false,
  textContent:'',files:[],naturalWidth:120,naturalHeight:120,
  valueAsNumber:NaN,attributes:{},
  addEventListener(name,fn){handlers[name]=fn;},
  replaceChildren(...nodes){this.children=nodes},
  append(...nodes){this.children.push(...nodes)},
  setAttribute(k,v){this.attributes[k]=v},
  fire(event){return handlers[event]?.();}
 };
}
function uiControls(){
 const names=['image','photoInput','photoClear','kind','first','second', 'lineSide',
  'preview','edits','originX','originY','mmPerPx','yAxis',
  'filletRadiusMm','scaleSource','scaleLength','scaleReviewed','scaleCalculate','scaleStatus',
  'scaleCircle','scaleKind','scaleValue','scaleSuggest',
  'scaleConfirm','scaleUse','circleScaleStatus','accepted','apply','status'];
 const c=Object.fromEntries(names.map(name=>[name,control()]));
 c.kind.value='two-segments';c.photoInput.files=[{size:4096,type:'image/png'}];
 c.originX.value='50';c.originY.value='70';c.mmPerPx.value='1';
 c.yAxis.value='down';c.filletRadiusMm.value='3';
 for(const name of ['originX','originY','mmPerPx','filletRadiusMm']){
  Object.defineProperty(c[name],'valueAsNumber',{get(){return Number(this.value)}});
 }
 const dom={createElement:()=>control(),
  createElementNS:(_ns,tag)=>{
   assert.ok(['line','circle'].includes(tag));return control();
  }};
 return {c,dom};
}
test('live local raster UI offers two actual source shapes, edits and explicit user acceptance',()=>{
 const {c,dom}=uiControls(),applied=[];
 const ui=attachLocalRasterReview({...c,dom,onApply:x=>applied.push(x)});
 ui.update('line',{raw:pair.segments.lines,analysis,
  original:{width:120,height:120}});
 assert.equal(ui.draft.candidates.length,2);
 assert.equal(c.preview.children.length,2);
 assert.equal(c.first.children.length,3);
 c.first.value='line_1';c.second.value='line_2';
 c.first.fire('change');c.second.fire('change');
 assert.equal(c.edits.children.length,2);
 c.apply.fire('click');
 assert.equal(applied.length,0);
 // Browser input.valueAsNumber is set only after explicit human edits.
 for(const group of c.edits.children)
  for(const label of group.children.slice(1)){
   const input=label.children[0];
   Object.defineProperty(input,'valueAsNumber',{get(){return Number(this.value)}});
  }
 c.accepted.checked=true;c.apply.fire('click');
 assert.equal(applied.length,1);
 assert.equal(applied[0].fields.filletRadius,3);
 assert.equal(c.accepted.checked,false);
 assert.match(c.status.textContent,/毫米条件/);
 c.photoInput.fire('change');
 assert.equal(ui.draft,null);
 assert.equal(c.first.children.length,1);
 assert.equal(c.preview.children.length,0);
});
test('the public workbench wires raw geometry callbacks and turns on strict photo source review',()=>{
 const entry=fs.readFileSync('labs/auto-fillet-live-entry.cjs','utf8');
 const html=fs.readFileSync('labs/auto-fillet-live.html','utf8');
 const ui=fs.readFileSync('labs/local-raster-geometry-review-ui.cjs','utf8');
 for(const id of ['rasterDraftPanel','rasterDraftPreview','rasterEdits',
  'rasterFirst','rasterSecond','rasterMmPerPx','rasterOriginX',
  'rasterOriginY','rasterYAxis','rasterFilletRadius','rasterAccept',
  'rasterApply','rasterStatus','rasterLineSide','circleSide',
  'rasterScaleCircle','rasterScaleSuggest','rasterScaleConfirm','rasterScaleUse'])
  assert.ok(html.includes('id="'+id+'"'),id);
 assert.match(entry,/attachLocalRasterReview/);
 assert.match(entry,/rasterReview\?\.update\('line',raw\)/);
 assert.match(entry,/rasterReview\?\.update\('curve',raw\)/);
 assert.match(entry,/sourceReviewEnabled'\)\.checked=true/);
 assert.match(entry,/fieldReview\?\.edited\(name\)/);
 assert.match(entry,/session\.replace\(current/);
 assert.match(entry,/selection\.side=Number\(\$\('circleSide'\)\.value\)/);
 assert.match(entry,/circleSide'\)\.value=result\.kind/);
 assert.match(entry,/receivedCandidates\('line',items,raw\)/);
 assert.match(entry,/getArrowHints:\(\)=>arrowHints/);
 assert.doesNotMatch(ui,/(fetch\(|XMLHttpRequest|innerHTML|insertAdjacentHTML|localStorage|sessionStorage)/);
});

test('raster source line can be reversed but its explicitly selected signed side must reverse too',()=>{
 const {solveFiniteFillet}=require('../../engines/constraints-2d/finite-fillet-gate.cjs');
 const base=request(pair.mixed);
 const regular=prepareReviewedRasterImport(base);
 const reversedEdits={...base.edits,
  line_1:{from:{...base.edits.line_1.to},to:{...base.edits.line_1.from}}};
 const reversed=prepareReviewedRasterImport({...base,edits:reversedEdits,lineSide:-1});
 const solve=p=>solveFiniteFillet(buildConfirmedInput(p.kind,p.fields,{side:p.lineSide},p.reviewedDraftRevision).problem);
 const first=solve(regular),second=solve(reversed);
 assert.ok(first.candidates.length>0);
 assert.equal(first.candidates.length,second.candidates.length);
 for(const a of first.candidates)
  assert.ok(second.candidates.some(b=>Math.hypot(a.center.x-b.center.x,
   a.center.y-b.center.y)<1e-8),'same geometric locus regardless of raster endpoint order');
});
test('mixed raster source cannot silently inherit +1 or invalid oriented line side',()=>{
 for(const side of [undefined,0,2,-2,NaN]){
  const req=request(pair.mixed,{lineSide:side});
  assert.throws(()=>prepareReviewedRasterImport(req),/line-circle side/);
 }
});
