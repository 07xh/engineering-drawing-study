'use strict';
/**
 * C1 reviewed third-view SVG preview. This is a read-only view of the
 * canonical M3/M5 drawing, NOT a ConstructionIntent signer or V5 player.
 * Unresolved edges are deliberately shown only as review annotations.
 */
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({
 '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
})[c]);
function renderC1ThirdViewSvg(drawing,{includeReviewOverlay=true,padding=20}={}){
 if(drawing?.schema!=='draftai-c1-m3-m5-third-view-drawing/1'||
    !['V','H','W'].includes(drawing.view)||
    !Number.isSafeInteger(drawing.revision)||
    !Array.isArray(drawing.certifiedVisibleContour)||
    !Array.isArray(drawing.unresolvedPhysicalEdges)||
    !drawing.sheetPoints||typeof drawing.sheetPoints!=='object'||
    drawing.completeDrawingCertified!==false||
    drawing.uncertifiedEdgesAreNotV5Actions!==true||
    !finite(padding)||padding<0||padding>200)
  throw new TypeError('current unsigned C1 M3/M5 third-view preview required');
 const points=Object.entries(drawing.sheetPoints);
 if(points.length<4||points.length>128)
  throw new RangeError('bounded current third-view point set required');
 const segments=[];
 const seen=new Set();
 for(const [id,p] of points){
  if(!id||!p||!finite(p.x)||!finite(p.y))
   throw new TypeError('finite first-angle point required');
 }
 for(const line of drawing.certifiedVisibleContour){
  if(typeof line.v5ActionId!=='string'||!line.v5ActionId||
     seen.has(line.v5ActionId)||
     line.standardLineStyle!=='gb-t-4457.4-continuous-wide-visible-outline')
   throw new RangeError('official C1 contour requires unique existing V5 line action');
  seen.add(line.v5ActionId);
  segments.push({line,official:true});
 }
 for(const line of drawing.unresolvedPhysicalEdges){
  if(line.standardLineStyle!=='undetermined'||line.v5ActionId!==null)
   throw new RangeError('unsigned C1 physical edge must remain a review overlay');
  if(includeReviewOverlay)segments.push({line,official:false});
 }
 const coords=points.map(([,p])=>p);
 for(const {line} of segments){
  if(!line.fromSheetPx||!line.toSheetPx||
     ![line.fromSheetPx.x,line.fromSheetPx.y,
       line.toSheetPx.x,line.toSheetPx.y].every(finite))
   throw new TypeError('finite canonical first-angle sheet endpoints required');
  coords.push(line.fromSheetPx,line.toSheetPx);
 }
 const xs=coords.map(p=>p.x),ys=coords.map(p=>p.y);
 const x0=Math.min(...xs)-padding,y0=Math.min(...ys)-padding;
 const width=Math.max(1,Math.max(...xs)-Math.min(...xs)+2*padding);
 const height=Math.max(1,Math.max(...ys)-Math.min(...ys)+2*padding);
 const lines=segments.map(({line,official})=>{
  const a=line.fromSheetPx,b=line.toSheetPx;
  const attr=official?
   'stroke="#111827" stroke-width="2"':
   'stroke="#9ca3af" stroke-width="1" stroke-dasharray="4 4"';
  return '<line x1="'+a.x+'" y1="'+a.y+'" x2="'+b.x+
   '" y2="'+b.y+'" '+attr+' data-source-edge="'+
   esc(line.sourceEdgeId)+'" data-status="'+
   (official?'certified-visible':'undetermined-review')+'"/>';
 });
 const markers=points.map(([id,p])=>
  '<circle cx="'+p.x+'" cy="'+p.y+
  '" r="2" fill="#2563eb" data-vertex="'+esc(id)+'"/>');
 return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="'+
  [x0,y0,width,height].join(' ')+'" role="img" aria-label="'+
  esc('C1 '+drawing.view+' third view; unresolved edges are review only')+
  '"><g fill="none" stroke-linecap="round">'+lines.join('')+
  '</g><g>'+markers.join('')+'</g></svg>';
}
module.exports={renderC1ThirdViewSvg};
