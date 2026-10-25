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
module.exports={outwardProof};
