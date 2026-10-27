'use strict';
/**
 * C1 single-sheet V/H/W visualization from the SAME canonical M3 projections,
 * M5 source-edge evidence and certified original V5 line action bindings.
 * This never signs an unsigned physical edge or creates a second player.
 */
const {VIEWS,toSheet}=require('../core/projection/conventions.js');
const {renderC1ThirdViewSvg}=require('./c1-third-view-svg-preview.cjs');
const finite=Number.isFinite;
function renderC1ThreeViewSvg(result,{includeReviewOverlay=true,sheetTransform}={}){
 if(result?.schema!=='draftai-c1-reviewed-solid-vertex-v5/1'||
    result.wholeSolidV5Ready!==false||
    result.singleOriginalV5Player!==true||
    !VIEWS.includes(result.sceneResult?.missingView)||
    !Array.isArray(result.certifiedVisibleContourLineBindings)||
    !Array.isArray(result.scopedEdgePreviews))
  throw new TypeError('current canonical unsigned C1 three-view source required');
 const {sceneResult}=result;
 const missing=sceneResult.missingView;
 const transform=sheetTransform;
 // The caller supplies the same canonical first-angle sheet transform used
 // by the original ConstructionIntent/DAG/V5 pipeline.
 if(!transform)throw new TypeError('canonical first-angle sheet transform required');
 const drawings={};
 for(const view of VIEWS){
  const projected=sceneResult.projections?.[view];
  if(!projected?.points)throw new RangeError('missing canonical first-angle projection');
  const signed=result.certifiedVisibleContourLineBindings.filter(x=>x.view===view);
  const unresolved=result.scopedEdgePreviews.filter(x=>
   x.view===view&&!x.projectionCollapsedToPoint&&
   x.renderedAsPhysicalSourceCandidate);
  drawings[view]={
   schema:'draftai-c1-m3-m5-third-view-drawing/1',
   view,revision:result.revision,
   completeDrawingCertified:false,uncertifiedEdgesAreNotV5Actions:true,
   sheetPoints:Object.fromEntries(Object.entries(projected.points).map(
    ([id,p])=>[id,toSheet(view,p,transform)])),
   certifiedVisibleContour:signed.map(line=>({
    sourceEdgeId:line.sourceEdgeId,v5ActionId:line.actionId,
    standardLineStyle:line.standardLineStyle,
    fromSheetPx:line.fromSheetPx,toSheetPx:line.toSheetPx
   })),
   unresolvedPhysicalEdges:unresolved.map(line=>({
    sourceEdgeId:line.sourceEdgeId,standardLineStyle:'undetermined',
    v5ActionId:null,
    fromSheetPx:toSheet(view,line.fromModelMm,transform),
    toSheetPx:toSheet(view,line.toModelMm,transform)
   }))
  };
 }
 const individual=VIEWS.map(view=>({
  view,svg:renderC1ThirdViewSvg(drawings[view],{includeReviewOverlay})
 }));
 return Object.freeze({schema:'draftai-c1-three-view-svg-sheet/1',
  revision:result.revision,missingView:missing,
  views:Object.freeze(individual.map(x=>Object.freeze(x))),
  completeDrawingCertified:false,wholeSolidV5Ready:false});
}
module.exports={renderC1ThreeViewSvg};
