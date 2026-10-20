/* 从同一份自由几何数据生成第一角法单张图纸。
 * 空白点线模型尚不具备封闭表面，不进行虚实线遮挡猜测。
 */
(function(root,factory){
 const api=factory(typeof module==='object'&&module.exports?require('./dof-lab-geometry.js'):root.DrawingLabGeometry,typeof module==='object'&&module.exports?require('./free-geometry-core.js'):root.DrawingFreeGeometry);
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.DrawingFreeSheet=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(G,Free){
'use strict';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const f=n=>{if(!Number.isFinite(n))throw Error('投影坐标无效');return Number(n.toFixed(3))};
function line(a,b,cls,extra=''){return '<line x1="'+f(a.x)+'" y1="'+f(a.y)+'" x2="'+f(b.x)+'" y2="'+f(b.y)+'" class="'+cls+'" '+extra+'/>'}
function text(p,value,cls){return '<text x="'+f(p.x)+'" y="'+f(p.y)+'" class="'+cls+'">'+esc(value)+'</text>'}
function project(state){
 Free.validate(state);
 const max=(axis)=>Math.max(0,...state.points.map(p=>Math.abs(p[axis])));
 const scale=Math.min(G.SCALE,400/(max('x')+15),245/(max('z')+15),275/(max('y')+15));
 const o=G.ORIGIN;
 const convert=p=>({x:o.x+(p.x-o.x)*scale/G.SCALE,y:o.y+(p.y-o.y)*scale/G.SCALE});
 const points={};
 for(const point of state.points){
  const p=G.projectPoint(point),views={};
  for(const view of ['V','H','W','M'])views[view]=convert(p[view]);
  points[point.id]=views;
 }
 return {points,scale,origin:{...o}};
}
function markup(state,options={}){
 const {points,scale,origin:o}=project(state);
 const selected=state.points.some(p=>p.id===options.selectedPoint)?options.selectedPoint:null;
 const parts=['<rect width="960" height="620" fill="#ffffff"/>','<g class="free-sheet-axes">',
 line({x:30,y:o.y},{x:927,y:o.y},'sheet-axis'),
 line({x:o.x,y:15},{x:o.x,y:607},'sheet-axis'),
 line(o,{x:o.x+260,y:o.y+260},'sheet-miter'),
 text({x:60,y:50},'正视图 V','sheet-view-label'),
 text({x:60,y:367},'俯视图 H','sheet-view-label'),
 text({x:705,y:50},'左视图 W','sheet-view-label'),
 text({x:737,y:556},'45°','sheet-axis-label'),
 '</g>'];
 if(options.showGuides!==false&&selected){
  const q=points[selected];
  parts.push('<g class="free-sheet-guides">');
  for(const [kind,a,b] of [
   ['VH',q.V,q.H],['height-VW',q.V,q.W],['depth-HM',q.H,q.M],['depth-MW',q.M,q.W]
  ])parts.push(line(a,b,'sheet-helper','data-kind="'+kind+'"'));
  parts.push('</g>');
 }
 parts.push('<g class="free-sheet-faces">');
 for(const face of state.faces)for(const view of ['V','H','W']){
  const ps=face.map(id=>points[id][view]);
  const area=Math.abs((ps[1].x-ps[0].x)*(ps[2].y-ps[0].y)-(ps[1].y-ps[0].y)*(ps[2].x-ps[0].x));
  if(area>1e-7)parts.push('<polygon points="'+ps.map(p=>f(p.x)+','+f(p.y)).join(' ')+'" class="free-sheet-face" data-face="'+esc(face.join('-'))+'" data-view="'+view+'"/>');
 }
 parts.push('</g>');
 parts.push('<g class="free-sheet-segments">');
 for(const edge of state.edges){
  for(const view of ['V','H','W']){
   const a=points[edge.a][view],b=points[edge.b][view];
   // A projection parallel to the viewing direction degenerates to a point.
   if(Math.hypot(a.x-b.x,a.y-b.y)>1e-8)
    parts.push(line(a,b,'free-sheet-line','data-view="'+view+'" data-segment="'+esc(edge.a)+'-'+esc(edge.b)+'"'));
  }
 }
 parts.push('</g><g class="free-sheet-points">');
 for(const point of state.points)for(const view of ['V','H','W']){
  const p=points[point.id][view],active=point.id===selected;
  parts.push('<circle cx="'+f(p.x)+'" cy="'+f(p.y)+'" r="'+(active?6:4.5)+'" class="'+(active?'free-sheet-point-selected':'free-sheet-point')+'" data-point="'+esc(point.id)+'" data-view="'+view+'" tabindex="0"/>');
  parts.push(text({x:p.x+8,y:p.y-8},point.id+(view==='V'?'′':view==='W'?'″':''),'free-sheet-label'));
 }
 parts.push('</g>');
 if(!state.points.length)parts.push(text({x:86,y:148},'空白图纸：添加空间点后自动生成三面投影','free-sheet-empty'));
 parts.push(text({x:44,y:595},state.faces.length?'三角面拓扑预览：线段与三角面不锁定长度；未完成实体闭合/遮挡核验。':'点线草图：线段不表示长度已约束；尚未创建面，故不判断虚实线。','sheet-disclaimer'));
 return parts.join('');
}
return {project,markup};
});
