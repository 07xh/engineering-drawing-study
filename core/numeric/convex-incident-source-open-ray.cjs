'use strict';
/**
 * M0 exact physical support theorem for a reviewed original convex source EDGE:
 * If a declared source edge is incident to a genuine planar supporting FACE,
 * every original source-edge point is on that face. If the observer ray has
 * strictly OUTWARD sign on the exact supporting plane, the entire OPEN
 * source-edge observer-ray family is disjoint from the convex solid.
 *
 * All determinants, coplanarity and support orientation signs are computed
 * exactly for the REPRESENTED binary64 input using the preexisting shared
 * dyadic kernel; never approximate a near-zero plane residual or widen
 * coordinates by tolerance. A weakly planar quad, false topology, ray
 * tangency, missing incidence or mixed-side support is NOT certified.
 *
 * This returns only unsigned numerical evidence. Source/scene authentication,
 * junction graph, engineering styles, ConstructionIntent/DAG/V5 remain M5's.
 */
const {dyadic,difference,product,sum,sign}=
 require('./binary64-dyadic.cjs');
const {FIRST_ANGLE_OBSERVER_RAYS}=
 require('../projection/conventions.js');
const ZERO=Object.freeze({n:0n,e:0});
const finite=Number.isFinite;
const vec=(p)=>[p.x,p.y,p.z];
const sub=(a,b)=>difference(dyadic(a),dyadic(b));
const mul=product;
const plus=sum;
const minus=(x)=>({n:-x.n,e:x.e});
function cross(a,b){
 return [plus(mul(a[1],b[2]),minus(mul(a[2],b[1]))),
  plus(mul(a[2],b[0]),minus(mul(a[0],b[2]))),
  plus(mul(a[0],b[1]),minus(mul(a[1],b[0])))];
}
function dot(a,b){
 let result=ZERO;
 for(let i=0;i<3;i++)result=plus(result,mul(a[i],b[i]));
 return sign(result);
}
function ray(v){return v.map(dyadic);}
function outwardProof({geometry,sourceVertexIds,view,convexProof}={}){
 if(!geometry||!geometry.data||!Array.isArray(geometry.data.faces)||
    !geometry.data.points||!Array.isArray(geometry.data.edges)||
    !Array.isArray(sourceVertexIds)||sourceVertexIds.length!==2||
    sourceVertexIds[0]===sourceVertexIds[1]||
    !Object.hasOwn(FIRST_ANGLE_OBSERVER_RAYS,view)||
    !convexProof||!Object.isFrozen(convexProof)||
    convexProof.status!=='validated-closed-convex-mesh'||
    convexProof.sourceGeometryId!==geometry.id||
    convexProof.unit!=='mm'||convexProof.v5Ready!==false)
  throw new TypeError('current independently reviewed closed convex original source required');
 const [idA,idB]=sourceVertexIds;
 const ids=Object.keys(geometry.data.points);
 if(!ids.includes(idA)||!ids.includes(idB)||
    !geometry.data.edges.some(e=>Array.isArray(e)&&
     ((e[0]===idA&&e[1]===idB)||(e[0]===idB&&e[1]===idA))))
  throw new RangeError('source edge absent from original convex mesh');
 const points=geometry.data.points,observer=FIRST_ANGLE_OBSERVER_RAYS[view];
 const ov=ray(vec(observer));
 for(const [faceIndex,face] of geometry.data.faces.entries()){
  if(!Array.isArray(face)||face.length<3||
     !face.some((a,i)=>(a===idA&&face[(i+1)%face.length]===idB)||
       (a===idB&&face[(i+1)%face.length]===idA)))
   continue;
  const origin=vec(points[face[0]]);
  const delta=id=>vec(points[id]).map((x,i)=>sub(x,origin[i]));
  const a=delta(face[1]),b=delta(face[2]),n=cross(a,b);
  if(n.every(q=>sign(q)===0))continue;
  // Original whole face must be EXACTLY planar in represented binary64
  // coordinates. Near-coplanar render polygons remain unsigned.
  if(face.some(id=>dot(n,delta(id))!==0))continue;
  let side=0,bad=false;
  for(const id of ids){
   if(face.includes(id))continue;
   const s=dot(n,delta(id));
   if(s&&side&&s!==side){bad=true;break;}
   if(s)side=s;
  }
  if(bad||side===0)continue;
  const observerSign=dot(n,ov);
  if(observerSign===0||observerSign===side)continue;
  return Object.freeze({
   schema:'draftai-m0-exact-convex-incident-source-edge-open-ray/1',
   status:'certified-clear',reason:'exact-original-support-face-outward-ray',
   view,sourceGeometryId:geometry.id,
   sourceVertexIds:[idA,idB],
   supportingOriginalFaceIndex:faceIndex,
   supportInsideSideSign:side,observerOutwardSign:observerSign,
   exactBinary64PlaneAndSourceIncidence:true,
   exactClosedConvexSupportVerified:true,
   continuousOpenSourceIntervalRayClear:true,
   officialLineStyleVerified:false,constructionIntentApproved:false,
   v5Ready:false
  });
 }
 return Object.freeze({
  schema:'draftai-m0-exact-convex-incident-source-edge-open-ray/1',
  status:'undetermined',reason:'no-exact-outward-original-support-face',
  view,sourceGeometryId:geometry.id,
  sourceVertexIds:[idA,idB],
  continuousOpenSourceIntervalRayClear:false,
  officialLineStyleVerified:false,constructionIntentApproved:false,
  v5Ready:false
 });
}
/**
 * Exact open-interior C1 source-edge theorem for a SINGLE opaque convex
 * original solid. Let E be a true original edge, p(s)=(1-s)A+sB,
 * s in (0,1). For every closed convex supporting face whose plane
 * contains BOTH A and B, require that observer ray points STRICTLY to
 * the solid's inside halfspace. Every other exact supporting face is
 * strictly interior at p(s). Thus for each s there exists an epsilon_s>0
 * whose forward open ray is strictly inside EVERY solid halfspace.
 *
 * This proof needs NO uniform positive depth margin as s approaches
 * vertex endpoints. It proves strictly hidden OPEN SOURCE INTERIOR only,
 * not endpoints, physical paper joins, other solids or final dashed style.
 *
 * Exact binary64 dyadic signs and exact complete polygon planarity are
 * obligatory. A near-planar quad, tangent observer or any non-supporting
 * face remains undetermined rather than widened with a tolerance.
 */
function inwardProof({geometry,sourceVertexIds,view,convexProof}={}){
 if(!geometry||!geometry.data||!Array.isArray(geometry.data.faces)||
    !geometry.data.points||!Array.isArray(geometry.data.edges)||
    !Array.isArray(sourceVertexIds)||sourceVertexIds.length!==2||
    sourceVertexIds[0]===sourceVertexIds[1]||
    !Object.hasOwn(FIRST_ANGLE_OBSERVER_RAYS,view)||
    !convexProof||!Object.isFrozen(convexProof)||
    convexProof.status!=='validated-closed-convex-mesh'||
    convexProof.sourceGeometryId!==geometry.id||
    convexProof.unit!=='mm'||convexProof.v5Ready!==false)
  throw new TypeError('current independently reviewed closed convex original source required');
 const [idA,idB]=sourceVertexIds;
 const points=geometry.data.points,ids=Object.keys(points);
 if(!ids.includes(idA)||!ids.includes(idB)||
    !geometry.data.edges.some(e=>Array.isArray(e)&&
     ((e[0]===idA&&e[1]===idB)||(e[0]===idB&&e[1]===idA))))
  throw new RangeError('original source edge missing from validated topology');
 const observer=ray(vec(FIRST_ANGLE_OBSERVER_RAYS[view]));
 let constrained=0,checked=0;
 const unknown=reason=>Object.freeze({
  schema:'draftai-m0-exact-convex-incident-source-edge-inward-ray/1',
  sourceGeometryId:geometry.id,view,
  sourceVertexIds:[idA,idB],status:'undetermined',reason,
  fullOriginalSourceOpenIntervalStrictlyHidden:false,
  endpointOcclusionCertified:false,officialLineStyleVerified:false,
  v5Ready:false
 });
 for(const face of geometry.data.faces){
  const base=vec(points[face[0]]);
  const delta=id=>vec(points[id]).map((x,i)=>sub(x,base[i]));
  let n=null;
  for(let i=1;i<face.length-1;i++){
   const candidate=cross(delta(face[i]),delta(face[i+1]));
   if(candidate.some(x=>sign(x)!==0)){n=candidate;break;}
  }
  if(!n)return unknown('no-exact-support-face-normal');
  // All listed points of EVERY face must be on its EXACT original plane.
  // The existing M0 toleranced validation alone is NOT sufficient.
  if(face.some(id=>dot(n,delta(id))!==0))
   return unknown('original-face-only-approximately-coplanar');
  let side=0;
  for(const id of ids){
   const val=dot(n,delta(id));
   if(val!==0){
    if(side!==0&&side!==val)
     return unknown('original-face-not-an-exact-convex-support');
    side=val;
   }
  }
  if(side===0)return unknown('support-face-lacks-strict-solid-side');
  const av=dot(n,delta(idA)),bv=dot(n,delta(idB));
  if((av!==0&&av!==side)||(bv!==0&&bv!==side))
   return unknown('original-source-outside-support-plane');
  checked++;
  if(av===0&&bv===0){
   constrained++;
   const slope=dot(n,observer);
   if(slope!==side)
    return unknown(slope===0?'observer-tangent-on-incident-support':
     'observer-exits-original-incident-support');
  }
 }
 if(checked!==geometry.data.faces.length||constrained<2)
  return unknown('missing-two-exact-original-incident-supports');
 return Object.freeze({
  schema:'draftai-m0-exact-convex-incident-source-edge-inward-ray/1',
  sourceGeometryId:geometry.id,view,sourceVertexIds:[idA,idB],
  status:'certified-strictly-hidden-open-original-edge',
  reason:'exact-original-all-support-planes-strict-inward-observer',
  allOriginalConvexFacePlanesExact:true,
  exactSupportingFaceCount:constrained,
  fullOriginalSourceOpenIntervalStrictlyHidden:true,
  endpointOcclusionCertified:false,
  entireSceneVisibilityVerified:false,
  officialLineStyleVerified:false,v5Ready:false
 });
}
module.exports={outwardProof,inwardProof};
