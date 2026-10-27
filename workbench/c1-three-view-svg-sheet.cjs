'use strict';
/**
 * C1 single-sheet V/H/W visualization from the SAME canonical M3 projections,
 * M5 source-edge evidence and certified original V5 line action bindings.
 * This never signs an unsigned physical edge or creates a second player.
 */
const {VIEWS,toSheet}=require('../core/projection/conventions.js');
const {renderC1ThirdViewSvg}=require('./c1-third-view-svg-preview.cjs');
const finite=Number.isFinite;
// Subtract ONLY independently signed original M0/M4/M5 physical intervals
// from the read-only review layer. A positive binary64 parameter gap,
// including a one-ULP gap, must remain visible as unsigned evidence.
// This is presentation partitioning, never a second line-style/V5 signer.
function unresolvedC1PhysicalSourceRemainders(sourceLines,bindings,view){
 if(!VIEWS.includes(view)||!Array.isArray(sourceLines)||!Array.isArray(bindings))
  throw new TypeError('current C1 V/H/W physical source and V5 bindings required');
 const source=new Map();
 for(const line of sourceLines){
  if(line.view!==view||typeof line.sourceEdgeId!=='string'||
     source.has(line.sourceEdgeId)||
     ![line.fromModelMm?.u,line.fromModelMm?.v,
       line.toModelMm?.u,line.toModelMm?.v].every(finite))
   throw new RangeError('invalid or duplicate original C1 review source');
  source.set(line.sourceEdgeId,line);
 }
 const bySource=new Map();
 const interpolate=(a,b,t)=>({u:a.u+(b.u-a.u)*t,v:a.v+(b.v-a.v)*t});
 for(const binding of bindings.filter(b=>b.view===view)){
  const line=source.get(binding.sourceEdgeId),span=binding.originalParameterRange;
  if(!line||binding.signedFormalLineV5!==true||
     !Array.isArray(span)||span.length!==2||
     !span.every(finite)||!(span[0]>=0&&span[1]<=1&&span[0]<span[1])||
     !['gb-t-4457.4-continuous-wide-visible-outline',
       'gb-t-4457.4-thin-dashed-hidden-edge'].includes(binding.standardLineStyle))
   throw new RangeError('unbound or unsigned C1 physical interval cannot suppress review');
  const a=interpolate(line.fromModelMm,line.toModelMm,span[0]),
   b=interpolate(line.fromModelMm,line.toModelMm,span[1]);
  if(!binding.fromModelMm||!binding.toModelMm||
     Math.hypot(a.u-binding.fromModelMm.u,a.v-binding.fromModelMm.v)>1e-7||
     Math.hypot(b.u-binding.toModelMm.u,b.v-binding.toModelMm.v)>1e-7)
   throw new RangeError('signed C1 source parameter does not match M0 projection');
  if(!bySource.has(binding.sourceEdgeId))bySource.set(binding.sourceEdgeId,[]);
  bySource.get(binding.sourceEdgeId).push(span);
 }
 const result=[];
 for(const line of sourceLines){
  const spans=(bySource.get(line.sourceEdgeId)||[]).slice()
   .sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
  let cursor=0;
  const add=(from,to)=>{
   if(to>from)result.push({...line,
    originalParameterRange:[from,to],
    fromModelMm:interpolate(line.fromModelMm,line.toModelMm,from),
    toModelMm:interpolate(line.fromModelMm,line.toModelMm,to),
    certifiedPhysicalSubspanElsewhere:spans.length>0});
  };
  for(const [from,to] of spans){
   if(from<cursor)throw new RangeError('overlapping signed physical source intervals');
   add(cursor,from);
   cursor=to;
  }
  add(cursor,1);
 }
 return result;
}
function renderC1ThreeViewSvg(result,{includeReviewOverlay=true,sheetTransform}={}){
 if(result?.schema!=='draftai-c1-reviewed-solid-vertex-v5/1'||
    result.wholeSolidV5Ready!==false||
    result.singleOriginalV5Player!==true||
    !VIEWS.includes(result.sceneResult?.missingView)||
    !Array.isArray(result.certifiedVisibleContourLineBindings)||
    !Array.isArray(result.scopedEdgePreviews)||
    (result.certifiedPhysicalLineBindings!==undefined&&
      !Array.isArray(result.certifiedPhysicalLineBindings)))
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
  const certifiedPhysical=(result.certifiedPhysicalLineBindings||[])
   .filter(x=>x.view===view);
  const unresolved=unresolvedC1PhysicalSourceRemainders(
   result.scopedEdgePreviews.filter(x=>
    x.view===view&&!x.projectionCollapsedToPoint&&
    x.renderedAsPhysicalSourceCandidate),
   result.certifiedPhysicalLineBindings||[],view);
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
   certifiedPhysicalFeatures:certifiedPhysical.map(line=>({
    sourceEdgeId:line.sourceEdgeId,v5ActionId:line.actionId,
    standardLineStyle:line.standardLineStyle,
    fromSheetPx:line.fromSheetPx,toSheetPx:line.toSheetPx
   })),
   unresolvedPhysicalEdges:unresolved.map(line=>({
    sourceEdgeId:line.sourceEdgeId,
    originalParameterRange:[...line.originalParameterRange],
    standardLineStyle:'undetermined',
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
  ...drawings[view].certifiedPhysicalFeatures.flatMap(line=>
   [line.fromSheetPx,line.toSheetPx]),
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
module.exports={renderC1ThreeViewSvg,unresolvedC1PhysicalSourceRemainders};
