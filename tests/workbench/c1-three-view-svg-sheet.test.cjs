'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {renderC1ThreeViewSvg,unresolvedC1PhysicalSourceRemainders:remainders}=
 require('../../workbench/c1-three-view-svg-sheet.cjs');
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

test('single paper SVG contains exactly V/H/W canonical layers',()=>{
 const out=renderC1ThreeViewSvg(fixture(),{sheetTransform:transform});
 assert.match(out.sheetSvg,/<svg xmlns="http:\/\/www.w3.org\/2000\/svg"/);
 for(const view of VIEWS){
  assert.match(out.sheetSvg,new RegExp('data-view="'+view+'"'));
  assert.match(out.sheetSvg,new RegExp('data-v5-action="original-'+view+'"'));
 }
 assert.equal((out.sheetSvg.match(/data-view="/g)||[]).length,3);
 assert.equal((out.sheetSvg.match(/data-status="undetermined-review"/g)||[]).length,3);
});
test('single paper SVG hides unsigned overlays without altering signed actions',()=>{
 const out=renderC1ThreeViewSvg(fixture(),{
  sheetTransform:transform,includeReviewOverlay:false
 });
 assert.doesNotMatch(out.sheetSvg,/undetermined-review/);
 assert.equal((out.sheetSvg.match(/data-v5-action="/g)||[]).length,3);
});

const physical=(view,from=0,to=1)=>({
 view,sourceEdgeId:'solid::B|C',actionId:'physical-'+view+'-'+from,
 signedFormalLineV5:true,
 standardLineStyle:'gb-t-4457.4-thin-dashed-hidden-edge',
 originalParameterRange:[from,to],
 fromModelMm:{u:10,v:10*from},toModelMm:{u:10,v:10*to},
 fromSheetPx:toSheet(view,{u:10,v:10*from},transform),
 toSheetPx:toSheet(view,{u:10,v:10*to},transform)
});
test('exact signed source subtraction leaves a genuine one-ULP original 3D parameter gap',()=>{
 const afterHalf=0.5000000000000001;
 const result=remainders([source('W')],[
  physical('W',0,0.5),physical('W',afterHalf,1)
 ],'W');
 assert.equal(result.length,1);
 assert.deepEqual(result[0].originalParameterRange,[0.5,afterHalf]);
 assert.equal(result[0].certifiedPhysicalSubspanElsewhere,true);
 assert(result[0].toModelMm.v>result[0].fromModelMm.v);
});
test('a fully certified physical source has no unsigned review overlay in V/H/W',()=>{
 const f=fixture();f.certifiedPhysicalLineBindings=VIEWS.map(view=>physical(view));
 const out=renderC1ThreeViewSvg(f,{sheetTransform:transform});
 assert.equal((out.sheetSvg.match(/data-status="undetermined-review"/g)||[]).length,0);
 assert.equal((out.sheetSvg.match(/data-status="certified-hidden"/g)||[]).length,3);
 assert.equal((out.sheetSvg.match(/data-v5-action="/g)||[]).length,6);
});
test('a partly signed original edge leaves only its exact unsigned tail',()=>{
 const f=fixture();f.certifiedPhysicalLineBindings=VIEWS.map(view=>physical(view,0,0.5));
 const out=renderC1ThreeViewSvg(f,{sheetTransform:transform});
 assert.equal((out.sheetSvg.match(/data-status="undetermined-review"/g)||[]).length,3);
 const gaps=remainders([source('H')],[physical('H',0,0.5)],'H');
 assert.deepEqual(gaps.map(x=>x.originalParameterRange),[[0.5,1]]);
 assert.deepEqual(gaps[0].fromModelMm,{u:10,v:5});
});
test('review subtraction rejects overlapping, forged and cross-source signed claims',()=>{
 assert.throws(()=>remainders([source('V')],[
  physical('V',0,0.75),physical('V',0.5,1)
 ],'V'),/overlapping/);
 const forged=physical('H');forged.signedFormalLineV5=false;
 assert.throws(()=>remainders([source('H')],[forged],'H'),/unsigned/);
 const shifted=physical('W');shifted.fromModelMm={u:12,v:0};
 assert.throws(()=>remainders([source('W')],[shifted],'W'),/does not match/);
 const missing=physical('V');missing.sourceEdgeId='solid::forged';
 assert.throws(()=>remainders([source('V')],[missing],'V'),/unbound/);
});
