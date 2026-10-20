/* Analytic planar intersections; explicit degeneracy and multiplicity, no guessed solutions. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.DrawingPlanarIntersections=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const EPS=1e-9,finite=n=>typeof n==='number'&&Number.isFinite(n);
function line(c){
 if(!c||![c.a,c.b,c.offset].every(finite)||Math.hypot(c.a,c.b)<=EPS)throw Error('直线方程无效');
 const len=Math.hypot(c.a,c.b);return {a:c.a/len,b:c.b/len,d:c.offset/len};
}
function circle(c){
 if(!c||![c.x,c.y,c.r].every(finite)||c.r<=0)throw Error('圆参数无效');
 return c;
}
function result(points,status){return {scope:'single-2d-point-intersection',status,solutions:points,degrees:status==='coincident'?1:status==='none'?null:0,solutionCount:status==='coincident'?null:points.length};}
function lineLine(first,second){
 const u=line(first),v=line(second),det=u.a*v.b-v.a*u.b;
 if(Math.abs(det)<=EPS){
  const same=Math.abs(u.a*v.d-v.a*u.d)<=EPS&&Math.abs(u.b*v.d-v.b*u.d)<=EPS;
  return result([],same?'coincident':'none');
 }
 return result([{x:(u.d*v.b-v.d*u.b)/det,y:(u.a*v.d-v.a*u.d)/det}],'unique');
}
function lineCircle(raw,cRaw){
 const l=line(raw),c=circle(cRaw),signed=l.a*c.x+l.b*c.y-l.d;
 if(Math.abs(signed)>c.r+EPS)return result([],'none');
 const foot={x:c.x-signed*l.a,y:c.y-signed*l.b};
 const squared=Math.max(0,c.r*c.r-signed*signed),half=Math.sqrt(squared);
 if(half<=EPS)return result([foot],'unique');
 return result([{x:foot.x-half*l.b,y:foot.y+half*l.a},{x:foot.x+half*l.b,y:foot.y-half*l.a}],'multiple');
}
function circleCircle(cRaw,dRaw){
 const c=circle(cRaw),d=circle(dRaw),dx=d.x-c.x,dy=d.y-c.y,dist=Math.hypot(dx,dy);
 if(dist<=EPS)return result([],Math.abs(c.r-d.r)<=EPS?'coincident':'none');
 if(dist>c.r+d.r+EPS||dist<Math.abs(c.r-d.r)-EPS)return result([],'none');
 const along=(c.r*c.r-d.r*d.r+dist*dist)/(2*dist);
 const half=Math.sqrt(Math.max(0,c.r*c.r-along*along));
 const x=c.x+along*dx/dist,y=c.y+along*dy/dist;
 if(half<=EPS)return result([{x,y}],'unique');
 return result([{x:x-half*dy/dist,y:y+half*dx/dist},{x:x+half*dy/dist,y:y-half*dx/dist}],'multiple');
}
function intersect(a,b){
 if(!a||!b)throw Error('缺少几何约束');
 if(a.type==='line'&&b.type==='line')return lineLine(a,b);
 if(a.type==='line'&&b.type==='circle')return lineCircle(a,b);
 if(a.type==='circle'&&b.type==='line')return lineCircle(b,a);
 if(a.type==='circle'&&b.type==='circle')return circleCircle(a,b);
 throw Error('尚不支持的几何交会类型');
}
return {intersect,lineLine,lineCircle,circleCircle};
});
