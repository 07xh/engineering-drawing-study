/* Tangency geometry classification with numeric residuals.
 * These are configuration checks, not proofs of global uniqueness.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.DrawingTangencyAnalysis=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const EPS=1e-8,finite=x=>typeof x==='number'&&Number.isFinite(x);
function circle(c){if(!c||![c.x,c.y,c.r].every(finite)||c.r<=0)throw Error('圆心与正半径必须为有限数');return c}
function line(l){if(!l||![l.a,l.b,l.offset].every(finite)||Math.hypot(l.a,l.b)<EPS)throw Error('直线方程无效');return l}
function circleLine(c,l){
 c=circle(c);l=line(l);
 const norm=Math.hypot(l.a,l.b),signed=(l.a*c.x+l.b*c.y-l.offset)/norm,distance=Math.abs(signed),residual=distance-c.r;
 return {type:'circle-line',status:Math.abs(residual)<=EPS?'tangent':residual>0?'separate':'secant',distance,residual,
  tangentPoint:Math.abs(residual)<=EPS?{x:c.x-signed*l.a/norm,y:c.y-signed*l.b/norm}:null};
}
function circleCircle(a,b){
 a=circle(a);b=circle(b);
 const d=Math.hypot(a.x-b.x,a.y-b.y),outer=d-(a.r+b.r),inner=d-Math.abs(a.r-b.r);
 if(d<=EPS&&Math.abs(a.r-b.r)<=EPS)return {type:'circle-circle',status:'coincident',distance:d,residual:0,tangentPoint:null};
 if(d<=EPS)return {type:'circle-circle',status:'concentric',distance:d,residual:Math.abs(a.r-b.r),tangentPoint:null};
 let status='intersecting',residual=Math.min(Math.abs(outer),Math.abs(inner)),tangentPoint=null;
 if(Math.abs(outer)<=EPS){status='externally-tangent';residual=outer;tangentPoint={x:a.x+a.r*(b.x-a.x)/d,y:a.y+a.r*(b.y-a.y)/d}}
 else if(Math.abs(inner)<=EPS){status='internally-tangent';residual=inner;const direction=a.r>=b.r?1:-1;tangentPoint={x:a.x+direction*a.r*(b.x-a.x)/d,y:a.y+direction*a.r*(b.y-a.y)/d}}
 else if(outer>0)status='separate';
 else if(inner<0)status='contained';
 return {type:'circle-circle',status,distance:d,residual,tangentPoint};
}
return {circleLine,circleCircle};
});
