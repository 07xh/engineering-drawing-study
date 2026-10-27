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
 // Compose the actual canonical V/H/W sheet without reprojecting points.
 // The SVG children are produced exclusively by our escaped renderer.
 const all=VIEWS.flatMap(view=>[
  ...Object.values(drawings[view].sheetPoints),
  ...drawings[view].certifiedVisibleContour.flatMap(line=>
   [line.fromSheetPx,line.toSheetPx]),
  ...(includeReviewOverlay?drawings[view].unresolvedPhysicalEdges.flatMap(line=>
   [line.fromSheetPx,line.toSheetPx]):[])
 ]);
 if(!all.length||all.some(p=>!p||!finite(p.x)||!finite(p.y)))
  throw new RangeError('incomplete shared first-angle sheet coordinates');
 const xs=all.map(p=>p.x),ys=all.map(p=>p.y);
 const left=Math.min(...xs)-20,top=Math.min(...ys)-20;
 const width=Math.max(1,Math.max(...xs)-Math.min(...xs)+40);
 const height=Math.max(1,Math.max(...ys)-Math.min(...ys)+40);
 const groups=individual.map(({view,svg})=>{
  const start=svg.indexOf('<g fill="none" stroke-linecap="round">');
  const end=svg.lastIndexOf('</svg>');
  if(start<0||end<start||!svg.slice(start,end).endsWith('</g>'))
   throw new RangeError('canonical C1 SVG group structure changed');
  return '<g data-view="'+view+'">'+svg.slice(start,end)+'</g>';
 });
 const sheetSvg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="'+
  [left,top,width,height].join(' ')+
  '" role="img" aria-label="C1 first-angle V H W sheet">'+
  '<title>C1 first-angle three-view preview</title>'+
  '<desc>Certified contours and unsigned review edges; not a completed drawing.</desc>'+
  groups.join('')+'</svg>';
 return Object.freeze({schema:'draftai-c1-three-view-svg-sheet/1',
  revision:result.revision,missingView:missing,
  views:Object.freeze(individual.map(x=>Object.freeze(x))),
  sheetSvg,
  completeDrawingCertified:false,wholeSolidV5Ready:false});
}
module.exports={renderC1ThreeViewSvg};
