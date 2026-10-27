'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {renderC1ThreeViewSvg}=require('../../workbench/c1-three-view-svg-sheet.cjs');
const {toSheet,VIEWS}=require('../../core/projection/conventions.js');
const transform={origin:{x:120,y:120},scale:1};
const pts={A:{u:0,v:0},B:{u:10,v:0},C:{u:10,v:10},D:{u:0,v:10}};
const projection=()=>({points:pts});
const signed=view=>({
 view,sourceEdgeId:'solid::A|B',actionId:'original-'+view,
 standardLineStyle:'gb-t-4457.4-continuous-wide-visible-outline',
 fromSheetPx:toSheet(view,pts.A,transform),
 toSheetPx:toSheet(view,pts.B,transform)
});
const source=view=>({
 view,sourceEdgeId:'solid::B|C',
 projectionCollapsedToPoint:false,renderedAsPhysicalSourceCandidate:true,
 fromModelMm:pts.B,toModelMm:pts.C
});
const fixture=()=>({
 schema:'draftai-c1-reviewed-solid-vertex-v5/1',revision:1,
 wholeSolidV5Ready:false,singleOriginalV5Player:true,
 sceneResult:{missingView:'W',projections:{V:projection(),H:projection(),W:projection()}},
 certifiedVisibleContourLineBindings:VIEWS.map(signed),
 scopedEdgePreviews:VIEWS.map(source)
});
test('V/H/W on canonical first-angle paper with certified and unsigned layers',()=>{
 const out=renderC1ThreeViewSvg(fixture(),{sheetTransform:transform});
 assert.deepEqual(out.views.map(x=>x.view),VIEWS);
 assert.equal(out.missingView,'W');
 for(const {view,svg} of out.views){
  assert.match(svg,new RegExp('data-v5-action="original-'+view+'"'));
  assert.match(svg,/data-status="undetermined-review"/);
 }
 assert.equal(out.wholeSolidV5Ready,false);
});
test('review overlay can be omitted in every view',()=>{
 const out=renderC1ThreeViewSvg(fixture(),{sheetTransform:transform,includeReviewOverlay:false});
 assert(out.views.every(x=>!x.svg.includes('undetermined-review')));
});
test('rejects absent transform and forged final solid signoff',()=>{
 assert.throws(()=>renderC1ThreeViewSvg(fixture()),/sheet transform/);
 const forged=fixture();forged.wholeSolidV5Ready=true;
 assert.throws(()=>renderC1ThreeViewSvg(forged,{sheetTransform:transform}),/canonical unsigned/);
});
