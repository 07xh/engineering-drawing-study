'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs');
const {candidateDraftFromRaster}=
 require('../../recognition/raster-primitive-draft.cjs');
const {proposeCircleScale,acceptCircleScale}=
 require('../../labs/local-raster-circle-scale.cjs');
const {prepareReviewedRasterImport}=
 require('../../labs/local-raster-fillet-import.cjs');
const {buildConfirmedInput}=require('../../labs/auto-fillet-form.cjs');
const {confirmedFilletTimeline}=
 require('../../workbench/v31-confirmed-fillet-v5.cjs');
const {attachLocalRasterReview}=
 require('../../labs/local-raster-geometry-review-ui.cjs');
const a={width:120,height:120},image={...a,byteLength:1000,mediaType:'image/png'};
const c=(id,x,y,r)=>({
 id,kind:'circle',coordinateSpace:'image-px',
 bbox:[x-r,y-r,r*2,r*2],center:{x,y},radius:r,
 confidence:.77,method:'connected-ink-circlefit-candidate/0.1'
});
const circles=[c('curve_1',50,70,5),c('curve_2',70,70,5)];
const circleDraft=()=>candidateDraftFromRaster({
 image,analysis:a,curves:circles
}).draft;
const input=(draft=circleDraft(),extra={})=>({
 draft,expectedRevision:draft.revision,circleId:'curve_1',
 editedCircle:{center:{x:50,y:70},radiusPx:5},
 dimensionKind:'diameter',reviewedValueMm:10,...extra
});
test('explicit Φ diameter and R radius both yield uniform mm/px proposal without math proof',()=>{
 const d=circleDraft();
 const first=proposeCircleScale(input(d));
 const second=proposeCircleScale(input(d,{dimensionKind:'radius',reviewedValueMm:5}));
 assert.equal(first.mmPerPx,1);
 assert.equal(second.mmPerPx,1);
 assert.equal(first.radiusMm,5);
 assert.equal(first.status,'needs-human-review');
 assert.equal(first.ocrAccuracyProven,false);
 assert.equal(first.metricCalibrationMathematicallyProven,false);
 assert.equal(first.globallyUnique,null);
 assert.throws(()=>acceptCircleScale({proposal:first,...input(d),confirmed:false}),/explicit/);
 const approved=acceptCircleScale({proposal:first,...input(d),confirmed:true});
 assert.equal(approved.status,'user-reviewed-suggestion');
 assert.equal(approved.userReviewed,true);
 assert.equal(approved.metricCalibrationMathematicallyProven,false);
});
test('approved Φ10 on 5px circle is coherent with existing typed geometry, but still requires full source review',()=>{
 const d=circleDraft(),params=input(d);
 const proposal=proposeCircleScale(params);
 const accepted=acceptCircleScale({proposal,...params,confirmed:true});
 const out=prepareReviewedRasterImport({
  draft:d,expectedRevision:d.revision,kind:'two-circles',
  firstId:'curve_1',secondId:'curve_2',edits:{
   curve_1:{center:{x:50,y:70},radiusPx:5},
   curve_2:{center:{x:70,y:70},radiusPx:5}
  },
  originX:50,originY:70,yAxis:'down',
  mmPerPx:accepted.mmPerPx,filletRadiusMm:10,accepted:true
 });
 assert.equal(out.fields.r1,5);
 assert.equal(out.geometrySourceReviewed,true);
 assert.equal(out.metricCalibrationMathematicallyProven,false);
 const typed=buildConfirmedInput(out.kind,out.fields,{
  branchId:'center-1',direction:'cw',
  knownFirstTravel:'ccw',knownSecondTravel:'ccw'
 },out.reviewedDraftRevision);
 const timeline=confirmedFilletTimeline(typed);
 assert.equal(timeline.mathematicallyVerified,true);
 assert.equal(timeline.typedMathEvidence.g1Verified,true);
 assert.equal(timeline.typedMathEvidence.globallyUnique,null);
});
test('changed revision, edited source radius and changed text invalidate old suggestion',()=>{
 const d=circleDraft(),params=input(d),proposal=proposeCircleScale(params);
 const changes=[
  {...params,expectedRevision:d.revision+1},
  {...params,reviewedValueMm:12},
  {...params,dimensionKind:'radius'},
  {...params,editedCircle:{center:{x:50,y:70},radiusPx:6}},
  {...params,editedCircle:{center:{x:51,y:70},radiusPx:5}},
  {...params,circleId:'curve_2'}
 ];
 for(const item of changes)
  assert.throws(()=>acceptCircleScale({proposal,...item,confirmed:true}));
});
test('arc, segment, unknown circle, overflow and cropped user correction fail closed',()=>{
 const d=circleDraft();
 const bad=[
  {circleId:'curve_99'},
  {editedCircle:{center:{x:2,y:70},radiusPx:5}},
  {editedCircle:{center:{x:50,y:70},radiusPx:0}},
  {editedCircle:{center:{x:50,y:70},radiusPx:NaN}},
  {editedCircle:{center:{x:50,y:70},radiusPx:Infinity}},
  {editedCircle:{center:{x:50,y:70},radiusPx:500}},
  {dimensionKind:'angle'},
  {reviewedValueMm:0},
  {reviewedValueMm:-10},
  {reviewedValueMm:Infinity},
  {reviewedValueMm:1e50},
  {reviewedValueMm:1e-25},
  {editedCircle:{center:{x:50,y:70,z:0},radiusPx:5}}
 ];
 for(const mutation of bad)
  assert.throws(()=>proposeCircleScale(input(d,mutation)),undefined,
   JSON.stringify(mutation));
 const src=fs.readFileSync('labs/local-raster-circle-scale.cjs','utf8');
 assert.doesNotMatch(src,/(fetch\(|XMLHttpRequest|localStorage|sessionStorage|innerHTML|eval\()/);
 assert.doesNotMatch(src,/(solveFiniteFillet|confirmedFilletTimeline|session\.replace)/);
});
function element(){
 const handlers={};return {handlers,value:'',valueAsNumber:NaN,checked:false,disabled:false,
  children:[],get options(){return this.children},textContent:'',attributes:{},files:[],
  naturalWidth:120,naturalHeight:120,
  addEventListener(event,fn){handlers[event]=fn},
  replaceChildren(...nodes){this.children=nodes},
  append(...nodes){this.children.push(...nodes)},
  setAttribute(k,v){this.attributes[k]=v},
  fire(event){return handlers[event]?.()}
 };
}
const controls=()=>{
 const ids=['image','photoInput','photoClear','kind','first','second','preview',
  'edits','originX','originY','mmPerPx','yAxis','filletRadiusMm','lineSide',
  'scaleSource','scaleLength','scaleReviewed','scaleCalculate','scaleStatus',
  'scaleCircle','scaleKind','scaleValue','scaleSuggest','scaleConfirm','scaleUse','circleScaleStatus',
  'accepted','apply','status'];
 const result=Object.fromEntries(ids.map(x=>[x,element()]));
 result.kind.value='two-circles';
 result.photoInput.files=[{size:1000,type:'image/png'}];
 result.originX.value='50';result.originY.value='70';
 result.yAxis.value='down';result.filletRadiusMm.value='10';
 result.scaleKind.value='diameter';result.mmPerPx.value='';
 const dom={createElement:()=>element(),createElementNS:(_ns,tag)=>{
  assert.ok(['line','circle'].includes(tag));return element();
 }};
 for(const n of ['originX','originY','mmPerPx','filletRadiusMm','scaleValue'])
  Object.defineProperty(result[n],'valueAsNumber',{get(){return Number(this.value)}});
 return {c:result,dom};
};
test('UI scale remains unfilled until explicit second approval, and old proposal dies on edit',()=>{
 const {c:ui,dom}=controls(),calls=[];
 const app=attachLocalRasterReview({...ui,dom,onApply:r=>calls.push(r)});
 app.update('curve',{raw:circles,analysis:a,original:a});
 ui.first.value='curve_1';ui.second.value='curve_2';
 ui.first.fire('change');ui.second.fire('change');
 assert.equal(ui.scaleCircle.children.length,3);
 // Make editable numeric candidates behave as browser number inputs.
 for(const box of ui.edits.children)
  for(const label of box.children.slice(1))
   Object.defineProperty(label.children[0],'valueAsNumber',{
    get(){return Number(this.value)}});
 ui.scaleCircle.value='curve_1';ui.scaleValue.value='10';
 ui.scaleSuggest.fire('click');
 assert.match(ui.circleScaleStatus.textContent,/建议比例/);
 assert.equal(ui.mmPerPx.value,'');
 assert.equal(ui.scaleConfirm.checked,false);
 assert.equal(ui.scaleUse.disabled,false);
 ui.scaleUse.fire('click');
 assert.match(ui.circleScaleStatus.textContent,/拒绝采用/);
 assert.equal(ui.mmPerPx.value,'');
 ui.scaleSuggest.fire('click');
 ui.scaleConfirm.checked=true;
 ui.scaleUse.fire('click');
 assert.equal(ui.mmPerPx.value,'1');
 assert.equal(ui.scaleConfirm.checked,false);
 assert.equal(ui.accepted.checked,false);
 assert.equal(calls.length,0);
 ui.scaleCircle.value='curve_2';ui.scaleCircle.fire('change');
 assert.equal(ui.mmPerPx.value,'','changing reviewed circle must revoke stale scale');
 assert.equal(ui.scaleUse.disabled,true);
 ui.scaleConfirm.checked=true;
 ui.scaleUse.fire('click');
 assert.equal(ui.mmPerPx.value,'','rejected stale proposal cannot refill calibration');
 app.reset();
 assert.equal(ui.scaleCircle.children.length,1);
 assert.equal(app.draft,null);
});
test('public workbench holds scale review separate from final math approval',()=>{
 const html=fs.readFileSync('labs/auto-fillet-live.html','utf8');
 const entry=fs.readFileSync('labs/auto-fillet-live-entry.cjs','utf8');
 for(const id of ['rasterScaleCircle','rasterScaleKind','rasterScaleValue',
   'rasterScaleSuggest','rasterScaleConfirm','rasterScaleUse','rasterCircleScaleStatus'])
  assert.ok(html.includes('id="'+id+'"'),id);
 assert.match(entry,/attachLocalRasterReview/);
 assert.match(entry,/scaleConfirm:\$\('rasterScaleConfirm'\)/);
 assert.match(entry,/sourceReviewEnabled'\)\.checked=true/);
 assert.match(entry,/rasterReview\?\.markFormEdited/);
 assert.match(html,/人工核对/);
});
