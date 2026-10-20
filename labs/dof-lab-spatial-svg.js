/* Lightweight SVG spatial preview and fallback for browsers without WebGL.
 * Only fixed teaching polyhedra and a separate constrained space point P.
 * WebGL/Three.js viewer can replace this module without touching the sheet or solver.
 */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./dof-lab-geometry.js'):root.DrawingLabGeometry);if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.DrawingLabSpatialPreview=api;})(typeof globalThis!=='undefined'?globalThis:this,function(G){
'use strict';
const f=n=>Number(n.toFixed(3)),esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function project(p,view={}){
 if(!G.pointValid(p))throw Error('空间预览点坐标无效');
 const yaw=Number.isFinite(view.yaw)?view.yaw:0.72,pitch=Number.isFinite(view.pitch)?view.pitch:0.52;
 const zoom=Math.min(2.5,Math.max(.5,Number.isFinite(view.zoom)?view.zoom:1));
 const dx=p.x-36,dy=p.y-33,dz=p.z-31;
 const u=dx*Math.cos(yaw)-dy*Math.sin(yaw),v=dx*Math.sin(yaw)+dy*Math.cos(yaw);
 const scale=2.95*zoom;
 return {x:f(230+u*scale),y:f(172+(v*Math.sin(pitch)-dz*Math.cos(pitch))*scale),
  depth:v*Math.cos(pitch)+dz*Math.sin(pitch)};
}
function markup(model,locus,view={}){
 G.validate(model);
 if(!locus||!Object.hasOwn(locus,'degrees'))throw Error('缺少空间自由度结果');
 const opts=view,projected=Object.fromEntries(Object.entries(model.points).map(([id,p])=>[id,project(p,view)]));
 const poly=face=>face.map(id=>f(projected[id].x)+','+f(projected[id].y)).join(' ');
 const layers=model.faces.map((face,i)=>({face,i,depth:face.reduce((sum,id)=>sum+projected[id].depth,0)/face.length})).sort((a,b)=>a.depth-b.depth);
 const out=['<rect width="460" height="330" fill="#fbfdfb"/>'];
 // Fixed reference polyhedron, semi-transparent so the constrained point remains visible.
 for(const entry of layers)out.push('<polygon points="'+poly(entry.face)+'" fill="'+(entry.i%2===0?'#9ecdb5':'#c6e5d3')+'" fill-opacity=".53" stroke="#568d6c" stroke-width="1.6"/>');
 for(const [a,b] of model.edges){
  const p=projected[a],q=projected[b];
  out.push('<line x1="'+f(p.x)+'" y1="'+f(p.y)+'" x2="'+f(q.x)+'" y2="'+f(q.y)+'" stroke="#367455" stroke-width="1.9"/>');
 }
 if(opts.selectedVertex&&projected[opts.selectedVertex]){
  const q=projected[opts.selectedVertex];
  out.push('<circle cx="'+f(q.x)+'" cy="'+f(q.y)+'" r="6" fill="#d0832f" stroke="#fff" stroke-width="1.5"/>');
  out.push('<text x="'+f(q.x+8)+'" y="'+f(q.y-8)+'" fill="#315b42" font-size="14">'+esc(opts.selectedVertex)+'</text>');
 }
 if(locus.kind==='none'){
  out.push('<text x="16" y="304" font-size="14" fill="#aa523b">条件矛盾：空间中没有满足全部条件的点</text>');
  return out.join('');
 }
 const P=locus.example;if(!G.pointValid(P))throw Error('空间示例点无效');
 const point=project(P,view),D=locus.directions||[];
 const addLine=(a,b,css)=>{const u=project(a,view),v=project(b,view);
  out.push('<line x1="'+f(u.x)+'" y1="'+f(u.y)+'" x2="'+f(v.x)+'" y2="'+f(v.y)+'" stroke="#db8b26" stroke-width="2.6" stroke-dasharray="7 5" class="'+css+'"/>')};
 const addVec=(p,d,k)=>({x:p.x+k*d[0],y:p.y+k*d[1],z:p.z+k*d[2]});
 const normalize=d=>{const n=Math.hypot(...d);return n?d.map(v=>v/n):[0,0,0]};
 if(locus.degrees===1&&D[0]){
  const d=normalize(D[0]);addLine(addVec(P,d,-120),addVec(P,d,120),'locus-line');
 }else if(locus.degrees===2&&D.length>=2){
  const a=normalize(D[0]),b=normalize(D[1]),corners=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([u,v])=>({
   x:P.x+u*a[0]*57+v*b[0]*57,y:P.y+u*a[1]*57+v*b[1]*57,z:P.z+u*a[2]*57+v*b[2]*57
  }));
  out.push('<polygon class="locus-plane" points="'+corners.map(c=>{const q=project(c,view);return f(q.x)+','+f(q.y)}).join(' ')+'" fill="#e8a53e" fill-opacity=".15" stroke="#cf8427" stroke-width="2" stroke-dasharray="7 5"/>');
 }else if(locus.degrees===3){
  for(const dir of [[1,0,0],[0,1,0],[0,0,1]])addLine(addVec(P,dir,-17),addVec(P,dir,17),'locus-space');
 }
 out.push('<circle cx="'+f(point.x)+'" cy="'+f(point.y)+'" r="6.5" fill="#d98524" stroke="#fff" stroke-width="2" class="locus-point"/>');
 out.push('<text x="'+f(point.x+9)+'" y="'+f(point.y-11)+'" font-size="15" font-weight="700" fill="#885513">P'+(locus.degrees?'*':'')+'</text>');
 out.push('<text x="13" y="315" font-size="12" fill="#53705c">固定立体仅供参照；橙色为目标点与可行位置，当前为交互 SVG 预览。</text>');
 return out.join('');
}
return {project,markup};
});
