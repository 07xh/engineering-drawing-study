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
const frozen=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){
 for(const v of Object.values(x))frozen(v);Object.freeze(x);
}return x;};
const edgeKey=(g,a,b)=>g+'::'+[a,b].sort().join('|');
const d3=(a,b)=>({x:a.x-b.x,y:a.y-b.y,z:a.z-b.z});
const dot=(p,q)=>p.x*q.x+p.y*q.y+p.z*q.z;
const lerp=(a,b,t)=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,
 z:a.z+(b.z-a.z)*t});
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
  const near=lineError(s)<=1e-9&&lineError(t)<=1e-9;
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
  const ux=t.u-s.u,uy=t.v-s.v,ulen=ux*ux+uy*uy;
  const peerParam=k=>((k.u-s.u)*ux+(k.v-s.v)*uy)/ulen;
  const ta=peerParam(p),tb=peerParam(q);
  if(!Number.isFinite(ta)||!Number.isFinite(tb)||
     ta< -1e-12||ta>1+1e-12||tb< -1e-12||tb>1+1e-12){
   hasPartialOrTie=true;
   comparisons.push({...base,status:'peer-parameter-outside-covered-source',
    depthDifferenceAtEndsMm:null});
   continue;
  }
  const x=lerp(u,v,ta),y=lerp(u,v,tb);
  if(dist2(project(x)[view],p)>1e-9||
     dist2(project(y)[view],q)>1e-9){
   hasPartialOrTie=true;
   comparisons.push({...base,status:'source-paper-correspondence-not-certified',
    depthDifferenceAtEndsMm:null});
   continue;
  }
  const startDepth=dot(d3(a,x),ray),
   endDepth=dot(d3(b,y),ray);
  const strictMargin=1e-7;
  const front=startDepth>strictMargin&&endDepth>strictMargin;
  const behind=startDepth< -strictMargin&&endDepth< -strictMargin;
  if(!front&&!behind)hasPartialOrTie=true;
  if(behind&&(
     peer.status==='single-opaque-solid-whole-open-ray-clear'||
     peer.status==='exterior-contour-held-by-original-m5'))
    behindCertifiedVisible=true;
  comparisons.push({...base,
   status:front?'candidate-strictly-front':
    behind?'candidate-strictly-behind':'depth-switch-or-tie',
   depthDifferenceAtEndsMm:[startDepth,endDepth],
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
  paperOnlyCrossingsNeverInventOriginal3DJunctions:true,
  engineeringLineStyleSigned:false,signedV5ActionCount:0});
}
module.exports={auditC1OriginalCoProjectedDepthOrder};
