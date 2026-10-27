'use strict';
/**
 * Shared M0/M4 exact-topology source-edge co-projected affine depth order.
 *
 * Given TWO ORIGINAL real straight BRep edge subspans, confirm their
 * projections are EXACTLY collinear in the represented binary64 2D
 * coordinates (adaptive orientation), match EACH candidate endpoint to
 * the peer's independently projected subspan, and compare first-angle
 * signed observer depths at BOTH ends. Since 3D straight endpoints and
 * projective correspondence are affine, two strict same-sign endpoint
 * margins prove the depth order for the WHOLE open paper interval.
 *
 * A midpoint front sample is NEVER a full-interval certificate.
 * Positive partial overlap, depth swap, exact tie, near-collinearity,
 * collapsed projection or insufficient forward margin stays undetermined.
 *
 * Only M4/M5 scene completeness + real native TopoDS history can authorize
 * official GB line styles; this helper returns mathematical witness only.
 */
const {project,VIEWS,FIRST_ANGLE_OBSERVER_RAYS}=
 require('../projection/conventions.js');
const {orientation2DAdaptive}=
 require('./orientation2d-adaptive.cjs');
const {inspectProjectedEdgeDepth}=
 require('./projected-edge-depth-events.cjs');
const finite=Number.isFinite;
const freeze=x=>Object.freeze(x);
function originalCoProjectedAffineDepth({
 candidate,peer,view,strictMarginMm=1e-7
}={}){
 if(!VIEWS.includes(view)||
    !finite(strictMarginMm)||strictMarginMm<=0||
    strictMarginMm>1e-2)
  throw new TypeError('bounded first-angle original edge depth margin required');
 const validate=(x,name)=>{
  if(!x||typeof x!=='object'||Array.isArray(x)||
     Object.keys(x).sort().join(',')!=='from,id,to'||
     typeof x.id!=='string'||!/^[a-zA-Z][\w-]{0,79}$/.test(x.id))
   throw new TypeError(name+' must be an original stable straight 3D source');
  for(const p of [x.from,x.to]){
   if(!p||typeof p!=='object'||Array.isArray(p)||
      Object.keys(p).sort().join(',')!=='x,y,z'||
      [p.x,p.y,p.z].some(v=>!finite(v)||Math.abs(v)>1e6))
    throw new TypeError('original 3D source must have bounded explicit endpoints');
  }
  return {id:x.id,from:{...x.from},to:{...x.to}};
 };
 const a=validate(candidate,'candidate'),
  b=validate(peer,'competitor');
 if(a.id===b.id)throw new TypeError('distinct native physical source identities required');
 const report=(status,deltas=null,why=null)=>freeze({
  schema:'draftai-m0-m4-whole-coproject-original-3d-affine-depth/1',
  candidateSourceId:a.id,peerSourceId:b.id,view,status,
  signedObserverDepthDifferenceAtEndsMm:deltas,
  independentOriginal3DWholeOpenDepthOrderCertified:
   status==='candidate-strictly-front'||status==='candidate-strictly-behind',
  strictlyPositiveOriginalDepthMarginMm:strictMarginMm,
  mathStatusReason:why,
  engineeringLineStyleCertified:false,formalV5ActionSigned:false
 });
 if(Math.hypot(a.to.x-a.from.x,a.to.y-a.from.y,a.to.z-a.from.z)<=1e-7||
    Math.hypot(b.to.x-b.from.x,b.to.y-b.from.y,b.to.z-b.from.z)<=1e-7)
  return report('undetermined-degenerate-3d-source');
 const pa=project(a.from)[view],qa=project(a.to)[view],
  pb=project(b.from)[view],qb=project(b.to)[view];
 const db={u:qb.u-pb.u,v:qb.v-pb.v},
  l2=db.u*db.u+db.v*db.v,
  alen=Math.hypot(qa.u-pa.u,qa.v-pa.v);
 if(!(l2>1e-16)||alen<=1e-8)
  return report('undetermined-collapsed-projection');
 const orientation=p=>orientation2DAdaptive(
  [pb.u,pb.v],[qb.u,qb.v],[p.u,p.v]).sign;
 if(orientation(pa)!==0||orientation(qa)!==0)
  return report('undetermined-not-exactly-collinear-projected-source');
 // Reuse the shared adaptive projected-edge intersection kernel.
 const witness=inspectProjectedEdgeDepth({
  first:a,second:b,view
 });
 if(witness.status!=='collinear-overlap')
  return report('undetermined-no-positive-exact-projected-overlap',
   null,witness.status);
 const fraction=p=>((p.u-pb.u)*db.u+(p.v-pb.v)*db.v)/l2,
  t0=fraction(pa),t1=fraction(qa);
 if(![t0,t1].every(finite)||
    t0<0||t0>1||t1<0||t1>1)
  return report('undetermined-only-partly-covered-paper-interval');
 const peer3D=t=>({
  x:b.from.x+(b.to.x-b.from.x)*t,
  y:b.from.y+(b.to.y-b.from.y)*t,
  z:b.from.z+(b.to.z-b.from.z)*t
 });
 const z0=peer3D(t0),z1=peer3D(t1);
 const projected0=project(z0)[view],projected1=project(z1)[view];
 const deviates=(p,q)=>Math.hypot(p.u-q.u,p.v-q.v)>1e-9;
 if(deviates(projected0,pa)||deviates(projected1,qa))
  return report('undetermined-original-paper-point-correspondence');
 const ray=FIRST_ANGLE_OBSERVER_RAYS[view],
  depth=(p,q)=>(p.x-q.x)*ray.x+(p.y-q.y)*ray.y+
   (p.z-q.z)*ray.z,
  delta0=depth(a.from,z0),delta1=depth(a.to,z1);
 if(!finite(delta0)||!finite(delta1))
  throw new RangeError('nonfinite original observer-depth comparison');
 const delta=[delta0,delta1];
 if(delta0>strictMarginMm&&delta1>strictMarginMm)
  return report('candidate-strictly-front',delta);
 if(delta0< -strictMarginMm&&delta1< -strictMarginMm)
  return report('candidate-strictly-behind',delta);
 return report('undetermined-depth-tie-crossing-or-insufficient-margin',delta);
}
module.exports={originalCoProjectedAffineDepth};
