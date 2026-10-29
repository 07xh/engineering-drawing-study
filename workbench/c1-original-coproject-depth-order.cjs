'use strict';
/**
 * ORIGINAL C1 source-edge projected-alias depth ordering.
 *
 * Two projectively coincident 2D segments need not be the same 3D edge.
 * Reconstruct the ORIGINAL 3D subspans, parameterize the same paper point
 * on BOTH sources and evaluate affine signed observer depth at BOTH ends.
 * Because source edges are straight, their depth difference is affine.
 * Strict same-sign endpoint inequalities prove the order over the ENTIRE
 * overlapping OPEN interval, without midpoint sampling.
 *
 * When a competing source covers only part of the requested interval,
 * this gate refuses a whole-stroke claim: M4 must first cut at the overlap.
 * The gate itself NEVER signs engineering strokes or constructs V5 actions.
 */
const {VIEWS,project,FIRST_ANGLE_OBSERVER_RAYS}=
 require('../core/projection/conventions.js');
// Reuse the existing exact binary64 paper predicate: a tiny genuine
// overlap is a real M4 split obligation, not a toleranced non-event.
const {exactPositiveCollinearPaperOverlap}=
 require('./c1-real-occt-m5-visible-contour-parity.cjs');
const {dyadic,difference,product,sign,sum}=
 require('../core/numeric/binary64-dyadic.cjs');
const frozen=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){
 for(const v of Object.values(x))frozen(v);Object.freeze(x);
}return x;};
const edgeKey=(g,a,b)=>g+'::'+[a,b].sort().join('|');
const d3=(a,b)=>({x:a.x-b.x,y:a.y-b.y,z:a.z-b.z});
const dot=(p,q)=>p.x*q.x+p.y*q.y+p.z*q.z;
// Exact endpoints are essential for one-ULP M0 incidence. Arithmetic
// for interior cuts remains a received binary64 model point, never an
// idealized arbitrary-precision geometric source claim.
const lerp=(a,b,t)=>t===0?a:t===1?b:
 ({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,
  z:a.z+(b.z-a.z)*t});
const diff=(a,b)=>difference(dyadic(a),dyadic(b));
const collinear=(a,b,p)=>sign(difference(
 product(diff(b.u,a.u),diff(p.v,a.v)),
 product(diff(b.v,a.v),diff(p.u,a.u))))===0;
// For exact projected collinearity and complete overlapping paper support:
// at each candidate end, peer depth is an EXACT rational interpolation
// of ORIGINAL received binary64 endpoints. Comparing
// (candidateDepth-peerDepth)*den-(peerEndDepth-peerStartDepth)*num
// is exact even when the resulting difference is below floating epsilon.
function exactOriginalCoProjectedDepthEndSigns({
 view,p,q,s,t,candidateStart,candidateEnd,peerStart,peerEnd
}){
 if(!collinear(p,q,s)||!collinear(p,q,t))
  return null;
 const axis=Math.abs(q.u-p.u)>=Math.abs(q.v-p.v)?'u':'v';
 const denom=diff(t[axis],s[axis]);
 const signDenom=sign(denom);
 if(!signDenom)return null;
 const firstAngleDepth={
  V:{axis:'y',sign:-1},H:{axis:'z',sign:1},W:{axis:'x',sign:1}
 }[view];
 const [a,b]=[p,q], [from,to]=[candidateStart,candidateEnd];
 const comparisons=[],approx=[];
 const peerDepthStart=peerStart[firstAngleDepth.axis],
  peerDepthEnd=peerEnd[firstAngleDepth.axis],
  peerDepthDelta=diff(peerDepthEnd,peerDepthStart);
 for(const [paper,model] of [[a,from],[b,to]]){
  const num=diff(paper[axis],s[axis]);
  // The peer interpolating parameter must be literally in [0,1].
  if(sign(num)*signDenom<0||
     sign(difference(denom,num))*signDenom<0)
   return null;
  const delta= difference(
   product(diff(model[firstAngleDepth.axis],peerDepthStart),denom),
   product(peerDepthDelta,num)
  );
  const depthSign=sign(delta);
  comparisons.push(depthSign===0?0:depthSign*signDenom*firstAngleDepth.sign);
  const fraction=(paper[axis]-s[axis])/(t[axis]-s[axis]);
  approx.push((model[firstAngleDepth.axis]-
   (peerDepthStart+(peerDepthEnd-peerDepthStart)*fraction))*
    firstAngleDepth.sign);
 }
 return {signs:comparisons,displayApproxMm:approx};
}
/**
 * Recover the EXACT ideal M0 source point at an existing binary64 M4 cut
 * parameter. The JS expression a+(b-a)*t may round its projected endpoint
 * OFF the original projected line; multiplying dyadics preserves the
 * original source's affine incidence and the real positive tiny subspan.
 *
 * This evaluates ONLY the independently reviewed original source geometry.
 * It is not a claim of generated HLR 2D TopoDS ownership.
 */
function exactOriginalPointOnStraightEdge(a,b,t,view){
 const axes={V:['x','z','y',-1],H:['x','y','z',1],
  W:['y','z','x',1]}[view];
 const value=axis=>sum(dyadic(a[axis]),
  product(difference(dyadic(b[axis]),dyadic(a[axis])),dyadic(t)));
 return {u:value(axes[0]),v:value(axes[1]),
  depth:value(axes[2]),observerSign:axes[3]};
}
const cmpExact=(a,b)=>sign(difference(a,b));
const crossExact=(a,b,p)=>difference(
 product(difference(b.u,a.u),difference(p.v,a.v)),
 product(difference(b.v,a.v),difference(p.u,a.u)));
function exactParametricCoProjectedSourceRelation({
 view,sourceStart,sourceEnd,sourceRange,
 peerStart,peerEnd,peerRange
}){
 const p=exactOriginalPointOnStraightEdge(sourceStart,sourceEnd,sourceRange[0],view),
  q=exactOriginalPointOnStraightEdge(sourceStart,sourceEnd,sourceRange[1],view),
  s=exactOriginalPointOnStraightEdge(peerStart,peerEnd,peerRange[0],view),
  t=exactOriginalPointOnStraightEdge(peerStart,peerEnd,peerRange[1],view);
 const axis=cmpExact(p.u,q.u)!==0?'u':cmpExact(p.v,q.v)!==0?'v':null;
 if(!axis||cmpExact(s.u,t.u)===0&&cmpExact(s.v,t.v)===0||
    sign(crossExact(p,q,s))!==0||sign(crossExact(p,q,t))!==0)
  return null;
 const sorted=(a,b)=>cmpExact(a,b)<=0?[a,b]:[b,a];
 const [aMin,aMax]=sorted(p[axis],q[axis]),
  [bMin,bMax]=sorted(s[axis],t[axis]);
 if(cmpExact(aMin,bMax)>=0||cmpExact(bMin,aMax)>=0)
  return null;
 const whole=cmpExact(bMin,aMin)<=0&&cmpExact(aMax,bMax)<=0;
 if(!whole)return {status:'partial-or-ambiguous-coproject-overlap',
  wholeIntervalCovered:false,exactOriginalSourcePaperIncidence:true,
  strictOriginal3DDepthOrderNoToleranceUsed:true,depthEndSigns:null};
 const denom=difference(t[axis],s[axis]),denomSign=sign(denom);
 if(denomSign===0)throw new RangeError('exact co-projected peer has zero source axis');
 const depthDelta=difference(t.depth,s.depth);
 const depthEndSigns=[];
 for(const endpoint of [p,q]){
  const num=difference(endpoint[axis],s[axis]);
  if(cmpExact(product(num,denom),{n:0n,e:0})<0||
     cmpExact(product(difference(denom,num),denom),{n:0n,e:0})<0)
   throw new RangeError('original M0 paper interval fully covered but exact peer fraction escaped');
  const numerator=difference(
   product(difference(endpoint.depth,s.depth),denom),
   product(depthDelta,num));
  const depthSign=sign(numerator);
  depthEndSigns.push(depthSign===0?0:depthSign*denomSign*p.observerSign);
 }
 return {status:depthEndSigns.every(v=>v===1)?
   'candidate-strictly-front':depthEndSigns.every(v=>v===-1)?
    'candidate-strictly-behind':'depth-switch-or-tie',
  wholeIntervalCovered:true,exactOriginalSourcePaperIncidence:true,
  strictOriginal3DDepthOrderNoToleranceUsed:true,depthEndSigns};
}

const dist2=(p,q)=>Math.hypot(p.u-q.u,p.v-q.v);
function auditC1OriginalCoProjectedDepthOrder({
 geometry,view,sourceEdgeId,originalParameterRange,peers
}={}){
 if(geometry?.kind!=='mesh'||geometry.space!=='model-3d'||
   geometry.unit!=='mm'||!VIEWS.includes(view)||
   typeof sourceEdgeId!=='string'||!Array.isArray(originalParameterRange)||
   originalParameterRange.length!==2||
   !originalParameterRange.every(Number.isFinite)||
   !(originalParameterRange[0]>=0&&
     originalParameterRange[1]<=1&&
     originalParameterRange[1]>originalParameterRange[0])||
   !Array.isArray(peers)||peers.length>1024)
  throw new TypeError('bounded current original 3D source and M4 peers required');
 const sources=new Map();
 for(const edge of geometry.data.edges){
  const [a,b]=edge,k=edgeKey(geometry.id,a,b);
  if(sources.has(k)||!geometry.data.points[a]||
      !geometry.data.points[b])
   throw new TypeError('duplicate or missing genuine original 3D source');
  sources.set(k,[geometry.data.points[a],geometry.data.points[b]]);
 }
 if(!sources.has(sourceEdgeId))
  throw new RangeError('unrecognized original source edge identity');
 const coords=(id,r)=>{
  const [a,b]=sources.get(id);
  return [lerp(a,b,r[0]),lerp(a,b,r[1])];
 };
 const [a,b]=coords(sourceEdgeId,originalParameterRange);
 const p=project(a)[view],q=project(b)[view];
 const du=q.u-p.u,dv=q.v-p.v,len2=du*du+dv*dv;
 if(!Number.isFinite(len2)||len2<=1e-16)
  return frozen({status:'collapsed-source-projection',view,
   sourceEdgeId,aliasesExamined:0,comparisons:[],
   wholeIntervalFrontmostCertified:false,
   visibleSourceCoversEntireLine:false});
 const candidateProjectionLength=Math.sqrt(len2);
 const ray=FIRST_ANGLE_OBSERVER_RAYS[view];
 const fraction=t=>((t.u-p.u)*du+(t.v-p.v)*dv)/len2;
 const lineError=t=>Math.abs(du*(t.v-p.v)-dv*(t.u-p.u))/
  candidateProjectionLength;
 const comparisons=[];
 let behindCertifiedVisible=false,hasPartialOrTie=false;
 for(const peer of peers){
  if(peer?.view!==view||peer.sourceGeometryId!==geometry.id||
     typeof peer.sourceEdgeId!=='string'||
     !sources.has(peer.sourceEdgeId)||
     !Array.isArray(peer.originalParameterRange)||
     peer.originalParameterRange.length!==2||
     !peer.originalParameterRange.every(Number.isFinite)||
     peer.originalParameterRange[0]<0||
     peer.originalParameterRange[1]>1||
     peer.originalParameterRange[0]>=peer.originalParameterRange[1])
   throw new RangeError('forged original peer identity or parameter range');
  if(peer.sourceEdgeId===sourceEdgeId)continue;
  const [u,v]=coords(peer.sourceEdgeId,peer.originalParameterRange),
   s=project(u)[view],t=project(v)[view];
  // The same exact original 3D source with a *rounded* M4 cut endpoint
  // can look transversely off-line in JS paper arithmetic. Do not mistake
  // that floating drift for an original source crossing or lose a real
  // one-ULP overlap. Compute the original affine source relation exactly.
  const relation=exactParametricCoProjectedSourceRelation({
   view,sourceStart:sources.get(sourceEdgeId)[0],
   sourceEnd:sources.get(sourceEdgeId)[1],
   sourceRange:originalParameterRange,
   peerStart:sources.get(peer.sourceEdgeId)[0],
   peerEnd:sources.get(peer.sourceEdgeId)[1],
   peerRange:peer.originalParameterRange
  });
  if(!relation)continue;
  const base={peerSourceEdgeId:peer.sourceEdgeId,
   peerOriginalParameterRange:[...peer.originalParameterRange],
   // Exact original source cuts need not be representable as a rounded
   // paper inverse fraction. Keep this field null, not a false [0,1].
   overlapCandidateParameterRange:null,
   peerRayStatus:peer.status,
   exactPaperCollinearityVerified:true,
   originalAffineM0ParametricIncidenceVerified:true};
  if(!relation.wholeIntervalCovered){
   hasPartialOrTie=true;
   comparisons.push({...base,status:'partial-or-ambiguous-coproject-overlap',
    exactOriginalSourceWholePaperOverlapProven:false,
    depthDifferenceAtEndsMm:null});
   continue;
  }
  const front=relation.status==='candidate-strictly-front',
   behind=relation.status==='candidate-strictly-behind';
  // The full binary64 rational sign is authoritative. Approximate model
  // depth values are display-only and can underflow to zero; never use
  // them to decide the visibility ordering.
  const axis=Math.abs(t.u-s.u)>=Math.abs(t.v-s.v)?'u':'v';
  const depth={V:['y',-1],H:['z',1],W:['x',1]}[view];
  const approximate=[a,b].map((model,i)=>{
   const paper=i===0?p:q;
   const frac=(paper[axis]-s[axis])/(t[axis]-s[axis]);
   return (model[depth[0]]-(u[depth[0]]+
    (v[depth[0]]-u[depth[0]])*frac))*depth[1];
  });
  const [startDepth,endDepth]=approximate;
  if(!front&&!behind)hasPartialOrTie=true;
  if(behind&&(
     peer.status==='single-opaque-solid-whole-open-ray-clear'||
     peer.status==='exterior-contour-held-by-original-m5'))
    behindCertifiedVisible=true;
  comparisons.push({...base,
   status:front?'candidate-strictly-front':
    behind?'candidate-strictly-behind':'depth-switch-or-tie',
   depthDifferenceAtEndsMm:[startDepth,endDepth],
   exactBinary64RationalOriginalDepthDifferenceEndSigns:
    relation.depthEndSigns,
   strictOriginal3DDepthOrderNoToleranceUsed:true,
   entireOriginalStraightSubspanDepthOrderCertified:front||behind,
   competingSourceHasCertifiedClearForwardRay:
    peer.status==='single-opaque-solid-whole-open-ray-clear'||
    peer.status==='exterior-contour-held-by-original-m5'});
 }
 const status=hasPartialOrTie?'undetermined-coproject-source-order':
  behindCertifiedVisible?'suppressed-by-front-original-visible-source':
  comparisons.some(x=>x.status==='candidate-strictly-behind')?
   'undetermined-source-behind-unverified-peer':
  comparisons.length?'candidate-strictly-front-of-all-aliases':
   'no-positive-projected-source-alias';
 return frozen({schema:'draftai-c1-original-3d-coproject-depth-order/1',
  view,sourceGeometryId:geometry.id,sourceEdgeId,
  originalParameterRange:[...originalParameterRange],
  status,aliasesExamined:comparisons.length,comparisons,
  wholeIntervalFrontmostCertified:
   status==='candidate-strictly-front-of-all-aliases'|| 
   status==='no-positive-projected-source-alias',
  visibleSourceCoversEntireLine:
   status==='suppressed-by-front-original-visible-source',
  theorem:'original-straight-source-3d-affine-depth-order-all-projected-points',
  exactDyadicDepthOrderRequiresStrictWholeCoProjectedPaperSupport:true,
  originalM0AffineSourceAndM4CutParametersComparedExactly:true,
  roundedM4PaperInterpolationCannotCreateOrEraseSourceOverlap:true,
  paperOnlyCrossingsNeverInventOriginal3DJunctions:true,
  engineeringLineStyleSigned:false,signedV5ActionCount:0});
}
module.exports={auditC1OriginalCoProjectedDepthOrder};
