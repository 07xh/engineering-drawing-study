'use strict';
/** M1 finite model-mm segment topology. Reuses M0 exact binary64 orientation. */
const {orientation2DAdaptive}=require('../numeric/orientation2d-adaptive.cjs');
function point(p,name){
 if(!p||typeof p!=='object'||Array.isArray(p))throw new TypeError(name+' must be a point');
 const {x,y}=p;
 if(typeof x!=='number'||!Number.isFinite(x)||typeof y!=='number'||!Number.isFinite(y))
  throw new TypeError(name+' requires finite x and y');
 return Object.freeze({x,y});
}
function segment(s,name){
 if(!s||typeof s!=='object'||Array.isArray(s))throw new TypeError(name+' must be a segment');
 const {frame,unit,from,to}=s;
 if(frame!=='model-mm-2d'||unit!=='mm')throw new TypeError(name+' requires explicit model-mm-2d/mm frame');
 const a=point(from,name+'.from'),b=point(to,name+'.to');
 if(a.x===b.x&&a.y===b.y)throw new RangeError(name+' is a degenerate zero-length segment');
 return {a,b};
}
const same=(a,b)=>a.x===b.x&&a.y===b.y;
const cmp=(a,b)=>a.x<b.x?-1:a.x>b.x?1:a.y<b.y?-1:a.y>b.y?1:0;
const between=(a,p,b)=>p.x>=Math.min(a.x,b.x)&&p.x<=Math.max(a.x,b.x)&&
 p.y>=Math.min(a.y,b.y)&&p.y<=Math.max(a.y,b.y);
function result(relation,point=null,overlap=null){
 return Object.freeze({schema:'draftai-model-mm-segment-topology/1',relation,
  intersects:relation!=='disjoint',intersectionPoint:point,overlap,
  exactForBinary64Inputs:true,sourceGeometryVerified:false,
  computesProperCrossingCoordinates:false,globallyUnique:null});
}
function analyzeSegmentTopology({first,second}={}){
 const {a,b}=segment(first,'first'),{a:c,b:d}=segment(second,'second');
 const orient=(p,q,r)=>orientation2DAdaptive([p.x,p.y],[q.x,q.y],[r.x,r.y]).sign;
 const o1=orient(a,b,c),o2=orient(a,b,d),o3=orient(c,d,a),o4=orient(c,d,b);
 if(o1===0&&o2===0&&o3===0&&o4===0){
  const [p,q]=cmp(a,b)<=0?[a,b]:[b,a];
  const [u,v]=cmp(c,d)<=0?[c,d]:[d,c];
  const left=cmp(p,u)>=0?p:u,right=cmp(q,v)<=0?q:v;
  const order=cmp(left,right);
  if(order>0)return result('disjoint');
  if(order===0)return result('endpoint-touch',left);
  return result(same(p,u)&&same(q,v)?'coincident':'collinear-overlap',null,
   Object.freeze({from:left,to:right}));
 }
 if(o1*o2<0&&o3*o4<0)return result('proper-crossing');
 for(const [sign,p,start,end] of [[o1,c,a,b],[o2,d,a,b],[o3,a,c,d],[o4,b,c,d]]){
  if(sign===0&&between(start,p,end))return result('endpoint-touch',p);
 }
 return result('disjoint');
}
module.exports={analyzeSegmentTopology};
