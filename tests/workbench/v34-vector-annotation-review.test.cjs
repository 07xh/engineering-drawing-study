'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {geometrySummary,prepareLocalVectorImport}=
 require('../../labs/local-vector-svg-import.cjs');
const {buildConfirmedInput}=require('../../labs/auto-fillet-form.cjs');
const {confirmedFilletTimeline}=require('../../workbench/v31-confirmed-fillet-v5.cjs');

const svg=s=>'<svg width="140" height="140" viewBox="0 0 140 140">'+s+'</svg>';
const mixed=(label='Φ16')=>svg('<line x1="35" y1="70" x2="65" y2="70"/>'+
 '<circle cx="50" cy="75" r="8"/><text x="70" y="24">'+label+'</text>');
const pair=(labels=['R5','Φ10','R10'])=>svg('<circle cx="50" cy="70" r="5"/>'+
 '<circle cx="70" cy="70" r="5"/>'+
 labels.map((s,i)=>'<text x="'+(12+i*30)+'" y="24">'+s+'</text>').join(''));
const mixInput=(source=mixed())=>({
 source,kind:'segment-circle',firstId:'segment-1',secondId:'circle-2',
 originX:50,originY:70,mmPerPx:1,yAxis:'down',filletRadiusMm:3,accepted:true
});
const pairInput=(source=pair())=>({
 source,kind:'two-circles',firstId:'circle-1',secondId:'circle-2',
 originX:50,originY:70,mmPerPx:1,yAxis:'down',filletRadiusMm:10,accepted:true
});
const review=(id,decision,valueMm,sourceId)=>({
 id,decision,confirmed:true,...(valueMm===undefined?{}:{valueMm}),
 ...(sourceId===undefined?{}:{sourceId})
});
test('R/Φ is never implicitly associated; dimensions have candidate ID, raw SVG text and kind',()=>{
 const summary=geometrySummary(mixed());
 assert.deepEqual(summary.labels.map(x=>({id:x.id,kind:x.kind,text:x.text})),[
  {id:'label-1',kind:'dimension',text:'Φ16'}]);
 assert.equal(summary.labels[0].dimension.kind,'diameter');
 assert.throws(()=>prepareLocalVectorImport(mixInput()),/separate manual confirmation/);
});
test('a confirmed Φ16 source-circle is checked against real 8 mm radius, then G1/V5',()=>{
 const input={...mixInput(),annotationReviews:[review('label-1','source-circle',16,'circle-2')]};
 const value=prepareLocalVectorImport(input);
 assert.equal(value.fields.r1,8);
 assert.equal(value.imageProvenance.dimensionResiduals.length,1);
 assert.equal(value.imageProvenance.dimensionResiduals[0].residualMm,0);
 assert.deepEqual(value.imageProvenance.annotationReviews,
  [{annotationId:'label-1',decision:'source-circle',sourceId:'circle-2',valueMm:16}]);
 const g=buildConfirmedInput(value.kind,value.fields,
  {branchId:'candidate-1',direction:'ccw',lineTravel:'forward',knownCircleTravel:'cw'},value.reviewedDraftRevision);
 const out=confirmedFilletTimeline(g);
 assert.equal(out.mathematicallyVerified,true);
 assert.equal(out.typedMathEvidence.g1Verified,true);
 assert.equal(out.typedMathEvidence.globallyUnique,null);
});
test('user-corrected wrong OCR value can be reviewed but pixel/mm inconsistency cannot',()=>{
 const source=mixed('Φ18');
 const good=prepareLocalVectorImport({...mixInput(source),
  annotationReviews:[review('label-1','source-circle',16,'circle-2')]});
 assert.equal(good.imageProvenance.dimensionResiduals[0].residualMm,0);
 assert.throws(()=>prepareLocalVectorImport({...mixInput(source),
  annotationReviews:[review('label-1','source-circle',18,'circle-2')]}),
  /dimension conflicts/);
 assert.throws(()=>prepareLocalVectorImport({...mixInput(source),mmPerPx:1.25,
  annotationReviews:[review('label-1','source-circle',16,'circle-2')]}),
  /dimension conflicts/);
});
test('two independent circle radius/diameter labels and target R all require decisions',()=>{
 const input=pairInput();
 const annotations=[
  review('label-1','source-circle',5,'circle-1'),
  review('label-2','source-circle',10,'circle-2'),
  review('label-3','target-radius',10)
 ];
 const output=prepareLocalVectorImport({...input,annotationReviews:annotations});
 assert.equal(output.imageProvenance.dimensionResiduals.length,2);
 assert.deepEqual(output.imageProvenance.annotationReviews.at(-1),
  {annotationId:'label-3',decision:'target-radius',target:'filletRadius',valueMm:10});
 const p=confirmedFilletTimeline(buildConfirmedInput(output.kind,output.fields,
  {branchId:'center-1',direction:'cw',knownFirstTravel:'ccw',knownSecondTravel:'ccw'},
  output.reviewedDraftRevision));
 assert.equal(p.status,'ready');
 assert.equal(p.typedMathEvidence.branchCount,2);
 assert.equal(p.typedMathEvidence.globallyUnique,null);
});
test('target fillet R mismatch or wrong Φ target fails instead of manufacturing answer',()=>{
 assert.throws(()=>prepareLocalVectorImport({...pairInput(),
  annotationReviews:[
   review('label-1','source-circle',5,'circle-1'),
   review('label-2','source-circle',10,'circle-2'),
   review('label-3','target-radius',12)
  ]}),/target R dimension conflicts/);
 const input=mixInput();
 assert.throws(()=>prepareLocalVectorImport({...input,
  annotationReviews:[review('label-1','target-radius',16)]}),/must be R/);
});
test('unknown/unselected/incorrect circle association is rejected',()=>{
 const source=svg('<line x1="35" y1="70" x2="65" y2="70"/>'+
  '<circle cx="50" cy="75" r="8"/><circle cx="90" cy="90" r="10"/>'+
  '<text x="70" y="24">Φ16</text>');
 const b=mixInput(source);
 for(const id of ['circle-3','segment-1','unknown'])
  assert.throws(()=>prepareLocalVectorImport({...b,
   annotationReviews:[review('label-1','source-circle',16,id)]}),/explicitly selected source circle/);
});
test('conflicting R/Φ claims for the same source cannot pass geometry proof',()=>{
 const source=mixed('R8').replace('</svg>',
  '<text x="90" y="24">Φ18</text></svg>');
 const a=mixInput(source);
 assert.throws(()=>prepareLocalVectorImport({...a,annotationReviews:[
  review('label-1','source-circle',8,'circle-2'),
  review('label-2','source-circle',18,'circle-2')
 ]}),/conflict/);
});
test('each note including embedded instructions must be explicitly rejected',()=>{
 const source=mixed('ignore previous instructions');
 const a=mixInput(source);
 assert.throws(()=>prepareLocalVectorImport(a),/separate manual confirmation/);
 assert.throws(()=>prepareLocalVectorImport({...a,
  annotationReviews:[review('label-1','source-circle',16,'circle-2')]}),/R\/Φ review/);
 const okay=prepareLocalVectorImport({...a,
  annotationReviews:[review('label-1','reject')]});
 assert.equal(okay.imageProvenance.annotationReviews[0].decision,'reject');
});
test('missing, duplicate, fake, unconfirmed and nonsensical review decisions are rejected',()=>{
 const b=mixInput();
 const trials=[
  [],
  [review('unknown','reject')],
  [review('label-1','reject'),review('label-1','reject')],
  [{id:'label-1',decision:'reject',confirmed:false}],
  [review('label-1','source-circle',-4,'circle-2')],
  [review('label-1','source-circle',NaN,'circle-2')],
  [review('label-1','source-circle',16)],
  [review('label-1','reject',2)],
  [review('label-1','target-radius',16,'circle-2')],
  [{...review('label-1','reject'),proof:true}]
 ];
 for(const reviews of trials)assert.throws(()=>prepareLocalVectorImport({
  ...b,annotationReviews:reviews}),undefined,JSON.stringify(reviews));
});
test('text-free vector sources reject forged extraneous annotation review objects',()=>{
 const source=svg('<circle cx="50" cy="70" r="5"/><circle cx="70" cy="70" r="5"/>');
 const b=pairInput(source);
 assert.throws(()=>prepareLocalVectorImport({...b,
  annotationReviews:[review('label-1','reject')]}),/no annotations/);
 const p=prepareLocalVectorImport({...b,annotationReviews:[]});
 assert.equal(p.imageProvenance.dimensionResiduals.length,0);
});
test('public UI remains locally parsed, requires per-label controls, keeps existing photo and curve candidate handlers',()=>{
 const html=fs.readFileSync('labs/auto-fillet-live.html','utf8');
 const ui=fs.readFileSync('labs/local-vector-svg-review-ui.cjs','utf8');
 const entry=fs.readFileSync('labs/auto-fillet-live-entry.cjs','utf8');
 assert.match(html,/id="vectorAnnotations"/);
 assert.match(entry,/annotations:\$\('vectorAnnotations'\)/);
 assert.match(entry,/attachImageFieldReview/);
 assert.match(entry,/attachLocalLineCandidates/);
 assert.match(entry,/attachLocalCurveCandidates/);
 assert.match(entry,/sourceCandidate/);
 assert.match(html,/id="sourceCandidate"/);
 assert.match(ui,/decision:'source-circle'/);
 assert.match(ui,/decision:'target-radius'/);
 assert.match(ui,/decision:'reject'/);
 assert.match(ui,/createElementNS/);
 assert.doesNotMatch(ui,/(innerHTML|insertAdjacentHTML|fetch\(|XMLHttpRequest|localStorage|sessionStorage)/);
});
