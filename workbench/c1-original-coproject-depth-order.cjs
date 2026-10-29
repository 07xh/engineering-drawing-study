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
const {dyadic,difference,product,sign}=
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
  comparisons.push(sign(delta)*signDenom*firstAngleDepth.sign);
  const fraction=(paper[axis]-s[axis])/(t[axis]-s[axis]);
  approx.push((model[firstAngleDepth.axis]-
   (peerDepthStart+(peerDepthEnd-peerDepthStart)*fraction))*
    firstAngleDepth.sign);
 }
 return {signs:comparisons,displayApproxMm:approx};
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
  if(!exactPositiveCollinearPaperOverlap(p,q,s,t))continue;
  const across=dist2(s,t);
  // Exact original M0 paper identity is required for a mathematical
  // source depth theorem. Even tiny off-line paper drift stays unsigned.
  const near=collinear(p,q,s)&&collinear(p,q,t);
  const scalar0=fraction(s),scalar1=fraction(t);
  const start=Math.max(0,Math.min(scalar0,scalar1)),
   end=Math.min(1,Math.max(scalar0,scalar1));
  // Exact paper overlap can be positive even when a floating projection
  // fraction rounds both ends to the same binary64 value. Never discard
  // that competing original 3D source or sign the whole candidate.
  if(!(end>start)){
   hasPartialOrTie=true;
   comparisons.push({peerSourceEdgeId:peer.sourceEdgeId,
    peerOriginalParameterRange:[...peer.originalParameterRange],
    overlapCandidateParameterRange:null,peerRayStatus:peer.status,
    status:'exact-positive-overlap-unresolved-parameter-fraction',
    depthDifferenceAtEndsMm:null});
   continue;
  }
  const base={peerSourceEdgeId:peer.sourceEdgeId,
   peerOriginalParameterRange:[...peer.originalParameterRange],
   overlapCandidateParameterRange:[start,end],
   peerRayStatus:peer.status,
   exactPaperCollinearityVerified:near};
  // Positive partial overlap is not a complete source stroke.
  // Fraction endpoints can round 1 ULP of real paper coverage away.
  // Use literal source-axis endpoints to prove WHOLE paper coverage.
  const axis=Math.abs(du)>=Math.abs(dv)?'u':'v';
  const wholePaperCovered=
   Math.min(s[axis],t[axis])<=Math.min(p[axis],q[axis])&&
   Math.max(s[axis],t[axis])>=Math.max(p[axis],q[axis]);
  if(!near||!wholePaperCovered||start>0||end<1||across<=1e-8){
   hasPartialOrTie=true;
   comparisons.push({...base,status:'partial-or-ambiguous-coproject-overlap',
    depthDifferenceAtEndsMm:null});
   continue;
  }
  // This replaces tolerance-based ray ordering. It proves the sign
  // of the exact rational depth difference at BOTH projected endpoints.
  // Straight original source depths are affine over a shared paper axis;
  // strict same-sign endpoints prove the entire OPEN overlap.
  const exact=exactOriginalCoProjectedDepthEndSigns({
   view,p,q,s,t,candidateStart:a,candidateEnd:b,
   peerStart:u,peerEnd:v
  });
  if(!exact){
   hasPartialOrTie=true;
   comparisons.push({...base,status:'peer-parameter-outside-covered-source',
    depthDifferenceAtEndsMm:null});
   continue;
  }
  const [s0,s1]=exact.signs;
  const front=s0===1&&s1===1;
  const behind=s0===-1&&s1===-1;
  const [startDepth,endDepth]=exact.displayApproxMm;
  if(!front&&!behind)hasPartialOrTie=true;
  if(behind&&(
     peer.status==='single-opaque-solid-whole-open-ray-clear'||
     peer.status==='exterior-contour-held-by-original-m5'))
    behindCertifiedVisible=true;
  comparisons.push({...base,
   status:front?'candidate-strictly-front':
    behind?'candidate-strictly-behind':'depth-switch-or-tie',
   depthDifferenceAtEndsMm:[startDepth,endDepth],
   exactBinary64RationalOriginalDepthDifferenceEndSigns:exact.signs,
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
  paperOnlyCrossingsNeverInventOriginal3DJunctions:true,
  engineeringLineStyleSigned:false,signedV5ActionCount:0});
}
module.exports={auditC1OriginalCoProjectedDepthOrder};
