/* SVG fallback of freely created point/segment topology.
 * Uses the SAME spatial projection as the existing teaching SVG viewer.
 */
(function(root,factory){
 const api=factory(typeof module==='object'&&module.exports?require('./free-geometry-core.js'):root.DrawingFreeGeometry,typeof module==='object'&&module.exports?require('./dof-lab-spatial-svg.js'):root.DrawingLabSpatialPreview);
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.DrawingFreeSpatial=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(Free,Spatial){
'use strict';
const f=x=>Number(x.toFixed(3)),esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function markup(state,options={}){
 Free.validate(state);
 const points=Object.fromEntries(state.points.map(p=>[p.id,Spatial.project(p,options)]));
 const out=['<rect width="460" height="330" fill="#fbfdfb"/>'];
 for(const edge of state.edges){
  const a=points[edge.a],b=points[edge.b];
  out.push('<line x1="'+f(a.x)+'" y1="'+f(a.y)+'" x2="'+f(b.x)+'" y2="'+f(b.y)+'" stroke="#317959" stroke-width="2.8" data-segment="'+esc(edge.a)+'-'+esc(edge.b)+'"/>');
 }
 for(const p of state.points){
  const q=points[p.id],active=p.id===options.selectedPoint;
  out.push('<circle cx="'+f(q.x)+'" cy="'+f(q.y)+'" r="'+(active?7:5.4)+'" fill="'+(active?'#d5852a':'#468c65')+'" stroke="#fff" stroke-width="2" data-point="'+esc(p.id)+'" tabindex="0"/>');
  out.push('<text x="'+f(q.x+9)+'" y="'+f(q.y-9)+'" font-size="15" fill="#315c43">'+esc(p.id)+'</text>');
 }
 if(!state.points.length)out.push('<text x="54" y="164" fill="#587363" font-size="15">空白场景：先添加第一个空间点</text>');
 out.push('<text x="12" y="312" font-size="12" fill="#5a7564">空间点线模型 · 非教材原题 · SVG 兼容模式</text>');
 return out.join('');
}
return {markup};
});
