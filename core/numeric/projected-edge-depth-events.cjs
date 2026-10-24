'use strict';
/**
 * M0 pairwise projected 3D edge depth events. Shared first-angle V/H/W:
 * detect crossing of two finite projected segments and interval overlap of
 * collinear segments. At the SAME paper point compare model distances in
 * the signed observer direction. Split collinear overlaps at a depth swap.
 *
 * This is only a PAIRWISE edge witness. It is not proof of 3D scene
 * completeness, surface occlusion, a silhouette, a source-face contour, or
 * a final V5 visible/hidden stroke. Endpoints and coplanar ties stay unknown.
 */
const {project,VIEWS,FIRST_ANGLE_OBSERVER_RAYS}=
 require('../projection/conventions.js');
const finite=n=>typeof n==='number'&&Number.isFinite(n);
// Snapshotted explicit source coordinates only. Re-reading an accessor-backed
// source after it passed validation would invalidate the projected proof.
function snapshotPoint(p){
 if(!p||typeof p!=='object'||Array.isArray(p)||
    Object.keys(p).sort().join(',')!=='x,y,z')
  throw new TypeError('source point requires finite explicit x/y/z');
 const x=p.x,y=p.y,z=p.z;
 if(![x,y,z].every(v=>finite(v)&&Math.abs(v)<=1e8))
  throw new TypeError('source point requires finite explicit x/y/z');
 return {x,y,z};
}
const {dotObject3:dot}=
 require('./object-vector3.cjs');
const {orientation2DAdaptive}=require('./orientation2d-adaptive.cjs');
const exactTurn=(a,b,c)=>orientation2DAdaptive(
 [a.u,a.v],[b.u,b.v],[c.u,c.v]).sign;
const at=(s,t)=>({x:s.from.x+(s.to.x-s.from.x)*t,
 y:s.from.y+(s.to.y-s.from.y)*t,
 z:s.from.z+(s.to.z-s.from.z)*t});
const vec=(p,q)=>({u:q.u-p.u,v:q.v-p.v});
const cr=(a,b)=>a.u*b.v-a.v*b.u;
const d2=(a,b)=>a.u*b.u+a.v*b.v;
const clamp=t=>Math.max(0,Math.min(1,t));
const finiteId=id=>typeof id==='string'&&
 /^[A-Za-z][A-Za-z0-9_-]{0,79}$/.test(id);
const freeze=x=>{
 if(x&&typeof x==='object'&&!Object.isFrozen(x)){
  for(const child of Object.values(x))freeze(child);
  Object.freeze(x);
 }return x;
};
function inspectProjectedEdgeDepth({
 first:inputFirst,second:inputSecond,view,toleranceMm=1e-7
}={}){
 if(!VIEWS.includes(view)||!finite(toleranceMm)||
    toleranceMm<=0||toleranceMm>1e-2)
  throw new TypeError('first-angle V/H/W and bounded mm tolerance required');
 const [first,second]=[inputFirst,inputSecond].map(edge=>{
  if(!edge||typeof edge!=='object'||Array.isArray(edge)||
     Object.keys(edge).sort().join(',')!=='from,id,to')
   throw new TypeError('two valid 3D source segments with stable IDs required');
  const id=edge.id,fromInput=edge.from,toInput=edge.to;
  if(!finiteId(id))
   throw new TypeError('two valid 3D source segments with stable IDs required');
  const from=snapshotPoint(fromInput),to=snapshotPoint(toInput);
  if(Math.hypot(from.x-to.x,from.y-to.y,from.z-to.z)<=toleranceMm)
   throw new TypeError('two valid 3D source segments with stable IDs required');
  return {id,from,to};
 });
 if(first.id===second.id)throw new TypeError('distinct 3D source edge IDs required');
 const [a,b,c,d]=[first.from,first.to,second.from,second.to]
  .map(p=>project(p)[view]);
 const r=vec(a,b),s=vec(c,d),qp=vec(a,c);
 const lr=Math.hypot(r.u,r.v),ls=Math.hypot(s.u,s.v);
 const base={schema:'draftai-projected-edge-depth-events/1',view,
  sourceEdgeIds:[first.id,second.id],scope:'two-explicit-model-mm-segments',
  completeOcclusionVerified:false,endpointJoinVerified:false,
  contourLineStyleVerified:false,v5Ready:false};
 const report=(status,events=[],ranges=[])=>freeze({...base,status,events,ranges});
 if(!finite(lr)||!finite(ls))
  throw new RangeError('projected edge numerical overflow');
 if(lr<=toleranceMm||ls<=toleranceMm)
  return report('collapsed-projection-undetermined');
 const signed=(t,u)=>{
  const q=at(first,t),p=at(second,u),ray=FIRST_ANGLE_OBSERVER_RAYS[view];
  return dot({x:q.x-p.x,y:q.y-p.y,z:q.z-p.z},ray);
 };
 const front=delta=>delta>toleranceMm?'first':
  delta< -toleranceMm?'second':'undetermined';
 const uv=t=>({u:a.u+r.u*t,v:a.v+r.v*t});
 const otherParam=t=>d2(vec(c,uv(t)),s)/(ls*ls);
 const denom=cr(r,s),threshold=toleranceMm*Math.max(lr,ls);
 if(Math.abs(denom)>threshold){
  const t=cr(qp,s)/denom,u=cr(qp,r)/denom;
  const slack=toleranceMm/Math.min(lr,ls);
  if(t< -slack||t>1+slack||u< -slack||u>1+slack)
   return report('disjoint');
  const tt=clamp(t),uu=clamp(u);
  const aa=uv(tt),bb={u:c.u+s.u*uu,v:c.v+s.v*uu};
  if(Math.hypot(aa.u-bb.u,aa.v-bb.v)>toleranceMm)
   return report('undetermined-numerical-intersection');
  const delta=signed(tt,uu);
  return report('crossing',[{atModelProjection:aa,
   firstParameter:tt,secondParameter:uu,
   depthDeltaMm:delta,front:front(delta),
   endpointOrJoin:Math.min(tt,1-tt)*lr<=toleranceMm||
    Math.min(uu,1-uu)*ls<=toleranceMm,
   fullLineVisibilityVerified:false}]);
 }
 // A rounded cross product at large-but-supported source coordinates
 // can be zero even if the exact projected binary64 lines are NOT
 // parallel/collinear. Never generate a continuous 'collinear-overlap'
 // range merely because floating two-term products cancelled to zero.
 const directionSign=exactTurn({u:0,v:0},r,s);
 if(directionSign!==0)
  return report('undetermined-near-parallel-projection');
 const cSign=exactTurn(a,b,c),dSign=exactTurn(a,b,d);
 if(cSign!==0||dSign!==0){
  // Only a numerically well-separated pair that lies entirely on the
  // same exact side can keep the old negative disjoint-parallel verdict.
  if(cSign!==0&&cSign===dSign&&Math.abs(cr(qp,r))>threshold)
   return report('disjoint-parallel');
  return report('undetermined-near-collinear-projection');
 }
 const t0=d2(vec(a,c),r)/(lr*lr),
  t1=d2(vec(a,d),r)/(lr*lr);
 const start=Math.max(0,Math.min(t0,t1)),end=Math.min(1,Math.max(t0,t1));
 if(end<start-toleranceMm/lr)return report('disjoint');
 if(end-start<=toleranceMm/lr){
  const t=clamp((start+end)/2),u=clamp(otherParam(t));
  return report('endpoint-touch-undetermined',[{
   atModelProjection:uv(t),firstParameter:t,secondParameter:u,
   depthDeltaMm:signed(t,u),front:'undetermined',
   endpointOrJoin:true,fullLineVisibilityVerified:false
  }]);
 }
 const s0=clamp(start),s1=clamp(end);
 const delta0=signed(s0,otherParam(s0)),
  delta1=signed(s1,otherParam(s1));
 const cuts=[s0,s1];
 if((delta0>toleranceMm&&delta1< -toleranceMm)||
    (delta0< -toleranceMm&&delta1>toleranceMm)){
  const zero=s0+(s1-s0)*(-delta0)/(delta1-delta0);
  if(zero>s0+toleranceMm/lr&&zero<s1-toleranceMm/lr)
   cuts.splice(1,0,zero);
 }
 const ranges=[];
 for(let i=0;i<cuts.length-1;i++){
  const aa=cuts[i],bb=cuts[i+1],mid=(aa+bb)/2;
  ranges.push({firstParameterRange:[aa,bb],
   secondParameterRange:[otherParam(aa),otherParam(bb)],
   projectedFrom:uv(aa),projectedTo:uv(bb),
   midpointDepthDeltaMm:signed(mid,otherParam(mid)),
   front:front(signed(mid,otherParam(mid))),
   sourceEndpointJoinVerified:false,fullLineVisibilityVerified:false});
 }
 return report('collinear-overlap',[],ranges);
}
module.exports={inspectProjectedEdgeDepth};
