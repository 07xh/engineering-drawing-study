/* First-angle single-sheet SVG for convex planar teaching polyhedra.
 * Hidden edge segments are classified geometrically, not assumed per vertex.
 */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./dof-lab-geometry.js'):root.DrawingLabGeometry,typeof module==='object'&&module.exports?require('./dof-lab-visibility.js'):root.DrawingLabVisibility);if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.DrawingLabSheet=api;})(typeof globalThis!=='undefined'?globalThis:this,function(G,Visibility){
'use strict';
const esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const f=n=>{if(!Number.isFinite(n))throw Error('图纸包含无效坐标');return Number(n.toFixed(3))};
function line(a,b,css,attrs=''){
 return '<line x1="'+f(a.x)+'" y1="'+f(a.y)+'" x2="'+f(b.x)+'" y2="'+f(b.y)+'" class="'+css+'" '+attrs+'/>';
}
function label(p,t,css){
 return '<text x="'+f(p.x)+'" y="'+f(p.y)+'" class="'+css+'">'+esc(t)+'</text>';
}
function dot(p,labelText,css,extra=''){
 return '<circle cx="'+f(p.x)+'" cy="'+f(p.y)+'" r="5" class="'+css+'" '+extra+'/>'+label({x:p.x+9,y:p.y-9},labelText,'sheet-point-label');
}
function markup(model,point,options={}){
 if(!G||typeof G.geometry!=='function'||!Visibility||typeof Visibility.analyze!=='function')throw Error('投影与可见性引擎未加载');
 const modelData=G.geometry(model),transfer=G.transfer(point),o=G.ORIGIN;
 const wire=options.showWireframe!==false,showGuides=options.showGuides!==false;
 const showLabels=options.showLabels===true,selected=options.selectedVertex||null;
 const parts=[
 '<rect width="960" height="620" fill="#ffffff"/>',
 '<g class="sheet-axes">',
 line({x:48,y:o.y},{x:912,y:o.y},'sheet-axis'),
 line({x:o.x,y:30},{x:o.x,y:595},'sheet-axis'),
 line(transfer.miterRay.from,transfer.miterRay.to,'sheet-miter'),
 label({x:50,y:o.y-11},'X','sheet-axis-label'),
 label({x:o.x+7,y:28},'Z','sheet-axis-label'),
 label({x:o.x+265,y:o.y+264},'45°','sheet-axis-label'),
 label({x:105,y:48},'正视图 V','sheet-view-label'),
 label({x:105,y:365},'俯视图 H','sheet-view-label'),
 label({x:715,y:48},'左视图 W','sheet-view-label'),
 '</g>'
 ];
 if(wire){
  const visibility=Visibility.analyze(model);
  parts.push('<g class="sheet-object-projections">');
  // Paint hidden edges first, then visible edges; coincident projected edges
  // must read as solid when a nearer visible outline is on top.
  for(const hidden of [true,false])for(const view of ['V','H','W']){
   for(const edge of visibility[view]){
    if(edge.hidden!==hidden||(hidden&&options.showHiddenEdges===false))continue;
    parts.push(line(edge.from,edge.to,'sheet-edge '+(hidden?'sheet-edge-hidden':'sheet-edge-visible'),
      'data-view="'+view+'" data-edge="'+esc(edge.a)+'-'+esc(edge.b)+'"'));
   }
  }
  for(const view of ['V','H','W']){
   if(showLabels){
    for(const [id,p] of Object.entries(modelData.views[view].points)){
     parts.push('<circle cx="'+f(p.x)+'" cy="'+f(p.y)+'" r="'+(selected===id?'5':'3.4')+'" class="'+(selected===id?'sheet-vertex-selected':'sheet-vertex')+'" data-vertex="'+esc(id)+'" data-view="'+view+'"/>');
     if(selected===id)parts.push(label({x:p.x+8,y:p.y-8},id+(view==='V'?'′':view==='W'?'″':''),'sheet-point-label'));
    }
   }
  }
  parts.push('</g>');
 }
 if(showGuides){
  parts.push('<g class="sheet-helper-lines">');
  for(const g of transfer.guide)parts.push(line(g.from,g.to,'sheet-helper','data-kind="'+esc(g.kind)+'"'));
  parts.push('</g>');
 }
 if(options.showTarget!==false){
 parts.push('<g class="sheet-target-projections">');
 for(const view of ['V','H','W']){
  const p=transfer.points[view];
  parts.push(dot(p,view==='V'?'p′':view==='H'?'p':'p″','sheet-target','data-target-view="'+view+'"'));
 }
 parts.push('</g>');
 }
 parts.push(label({x:58,y:596},'凸多面体的虚实线依据投影遮挡计算；曲面和复杂非凸形体尚未支持。','sheet-disclaimer'));
 return parts.join('');
}
return {markup};
});
