/* View-specific hidden-edge analysis for convex planar teaching polyhedra.
 * All coordinates derive from DrawingLabGeometry. V views from negative Y,
 * H from positive Z, W from negative X (first-angle left-side view).
 * Occlusion is computed against projected faces; edges are split wherever
 * an occluding face boundary crosses the projected edge.
 * No curves, cutaway solids or concave/nonmanifold mesh claims here.
 */
(function(root,factory){
 const api=factory(typeof module==='object'&&module.exports?require('./dof-lab-geometry.js'):root.DrawingLabGeometry);
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.DrawingLabVisibility=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(G){
'use strict';
const EPS=1e-8,DEPTH_EPS=1e-6;
function projection(point,view){
 if(!G.pointValid(point))throw Error('三维顶点坐标无效');
 if(view==='V')return {u:point.x,v:point.z,depth:-point.y};
 if(view==='H')return {u:point.x,v:point.y,depth:point.z};
 if(view==='W')return {u:point.y,v:point.z,depth:-point.x};
 throw Error('不支持的投影面');
}
const cross=(a,b)=>a.u*b.v-a.v*b.u;
const sub=(a,b)=>({u:a.u-b.u,v:a.v-b.v});
function intersectionT(a,b,c,d){
 const ab=sub(b,a),cd=sub(d,c),den=cross(ab,cd);
 if(Math.abs(den)<EPS)return null; // parallel or overlapping edges: endpoints suffice
 const ac=sub(c,a),t=cross(ac,cd)/den,u=cross(ac,ab)/den;
 return t>EPS&&t<1-EPS&&u>-EPS&&u<1+EPS?t:null;
}
function depthOfFaceAt(test,face){
 // A planar polygon can be triangulated as a fan; projected degenerate
 // triangles are skipped, and barycentric interpolation yields exact depth.
 for(let i=1;i<face.length-1;i++){
  const a=face[0],b=face[i],c=face[i+1];
  const ab=sub(b,a),ac=sub(c,a),q=sub(test,a),det=cross(ab,ac);
  if(Math.abs(det)<EPS)continue;
  const t=cross(q,ac)/det,u=cross(ab,q)/det;
  if(t>=-EPS&&u>=-EPS&&t+u<=1+EPS){
   return a.depth+t*(b.depth-a.depth)+u*(c.depth-a.depth);
  }
 }
 return null;
}
function edgeSegments(model,view){
 G.validate(model);
 const v2=Object.fromEntries(Object.entries(model.points).map(([name,p])=>[name,projection(p,view)]));
 const faces=model.faces.map(face=>face.map(id=>v2[id]));
 const out=[];
 for(const [a,b] of model.edges){
  const start=v2[a],end=v2[b];
  const d=sub(end,start),length=Math.hypot(d.u,d.v);
  if(length<EPS)continue; // edge parallel to viewing direction: projects to a point
  const breaks=[0,1];
  for(const face of faces)for(let k=0;k<face.length;k++){
   const t=intersectionT(start,end,face[k],face[(k+1)%face.length]);
   if(t!==null)breaks.push(t);
  }
  breaks.sort((x,y)=>x-y);
  const cuts=breaks.filter((t,i)=>i===0||t-breaks[i-1]>EPS);
  const result=[];
  for(let i=1;i<cuts.length;i++){
   const lo=cuts[i-1],hi=cuts[i];if(hi-lo<EPS)continue;
   const mid=(lo+hi)/2;
   const sample={u:start.u+d.u*mid,v:start.v+d.v*mid};
   const physicalDepth=start.depth+(end.depth-start.depth)*mid;
   const occluded=faces.some(face=>{
    const surfaceDepth=depthOfFaceAt(sample,face);
    return surfaceDepth!==null&&surfaceDepth>physicalDepth+DEPTH_EPS;
   });
   const from3={
    x:model.points[a].x+(model.points[b].x-model.points[a].x)*lo,
    y:model.points[a].y+(model.points[b].y-model.points[a].y)*lo,
    z:model.points[a].z+(model.points[b].z-model.points[a].z)*lo
   };
   const to3={
    x:model.points[a].x+(model.points[b].x-model.points[a].x)*hi,
    y:model.points[a].y+(model.points[b].y-model.points[a].y)*hi,
    z:model.points[a].z+(model.points[b].z-model.points[a].z)*hi
   };
   const screenFrom=G.projectPoint(from3)[view],screenTo=G.projectPoint(to3)[view];
   result.push({a,b,view,hidden:occluded,from:screenFrom,to:screenTo,startT:lo,endT:hi});
  }
  // Merge intervals with equal visibility to avoid multiple overlaid SVG strokes.
  for(const part of result){
   const last=out[out.length-1];
   if(last&&last.a===part.a&&last.b===part.b&&last.hidden===part.hidden&&Math.abs(last.endT-part.startT)<EPS){
    last.to=part.to;last.endT=part.endT;
   }else out.push(part);
  }
 }
 return out;
}
function analyze(model){
 return Object.fromEntries(['V','H','W'].map(view=>[view,edgeSegments(model,view)]));
}
return {projection,edgeSegments,analyze};
});
