'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {renderC1ThirdViewSvg}=require('../../workbench/c1-third-view-svg-preview.cjs');
const drawing=()=>({
 schema:'draftai-c1-m3-m5-third-view-drawing/1',view:'W',revision:1,
 completeDrawingCertified:false,uncertifiedEdgesAreNotV5Actions:true,
 sheetPoints:{A:{x:0,y:0},B:{x:10,y:0},C:{x:10,y:10},D:{x:0,y:10}},
 certifiedVisibleContour:[{
  sourceEdgeId:'solid::A|B',v5ActionId:'original-v5-1',
  standardLineStyle:'gb-t-4457.4-continuous-wide-visible-outline',
  fromSheetPx:{x:0,y:0},toSheetPx:{x:10,y:0}
 }],
 unresolvedPhysicalEdges:[{
  sourceEdgeId:'solid::B|C',v5ActionId:null,
  standardLineStyle:'undetermined',
  fromSheetPx:{x:10,y:0},toSheetPx:{x:10,y:10}
 }]
});
test('renders canonical solved third view; only certified contour is official',()=>{
 const svg=renderC1ThirdViewSvg(drawing());
 assert.match(svg,/viewBox="-20 -20 50 50"/);
 assert.match(svg,/data-status="certified-visible"/);
 assert.match(svg,/data-status="undetermined-review"/);
 assert.equal((svg.match(/<line /g)||[]).length,2);
});
test('can hide review overlay without silently certifying it',()=>{
 const svg=renderC1ThirdViewSvg(drawing(),{includeReviewOverlay:false});
 assert.doesNotMatch(svg,/undetermined-review/);
 assert.equal((svg.match(/<line /g)||[]).length,1);
});
test('rejects forged official edge and duplicate V5 action',()=>{
 const x=drawing();x.unresolvedPhysicalEdges[0].standardLineStyle='hidden';
 assert.throws(()=>renderC1ThirdViewSvg(x),/review overlay/);
 const y=drawing();y.certifiedVisibleContour.push({...y.certifiedVisibleContour[0]});
 assert.throws(()=>renderC1ThirdViewSvg(y),/unique existing V5/);
});
test('escapes source and vertex identifiers in SVG attributes',()=>{
 const x=drawing();x.sheetPoints['<bad>']={x:5,y:5};
 x.certifiedVisibleContour[0].sourceEdgeId='x" onload="alert(1)';
 const svg=renderC1ThirdViewSvg(x);
 assert.doesNotMatch(svg,/data-vertex="<bad>"/);
 assert.match(svg,/&lt;bad&gt;/);
 assert.match(svg,/&quot; onload=&quot;/);
});

test('optional vertex labels and signed V5 identifiers remain inspectable',()=>{
 const svg=renderC1ThirdViewSvg(drawing(),{showVertexLabels:true});
 assert.match(svg,/data-v5-action="original-v5-1"/);
 assert.match(svg,/<text x="4" y="-4"/);
 assert.match(svg,/<title>C1 W third-view geometry preview<\/title>/);
 assert.match(svg,/<desc>Black strokes are certified V5 contour actions/);
});
