'use strict';
/**
 * M0 exact affine OPEN-source observer ray theorem for a bounded
 * axis-aligned convex box. Current OCCT two-box C2 source grammar uses
 * these original exact 3D bounds; this is a reusable geometric lemma,
 * NOT a special case keyed to any exercise/drawing.
 *
 * With p(s)=A+s(B-A), 0<s<1, each coordinate is affine. If BOTH original
 * source endpoints lie in the box then:
 *  - constant boundary coordinates need the observer ray to point
 *    strictly INTO that box (strict positive t);
 *  - nonconstant coordinates lie strictly between their endpoint
 *    coordinate extrema for every OPEN s and are inside the box.
 * Thus for EACH source-open s, a positive (possibly s-dependent) ray
 * depth epsilon_s enters the STRICT BOX INTERIOR. No uniform endpoint
 * margin is needed or invented. This handles hidden physical BRep edges
 * whose 3D vertices are on exterior support planes.
 *
 * Outward supporting coordinate planes analogously certify clear rays
 * for all open source points and all t>0 (without sampling).
 *
 * All inequalities are exact relations between finite represented-binary64
 * endpoint/bound values; no tolerance, snapping, offsets, or midpoint tests.
 * This lemma certifies neither original BRep topology nor official V5
 * line styles; caller must validate native source, full scene and M4 joins.
 */
const {FIRST_ANGLE_OBSERVER_RAYS}=require('../projection/conventions.js');
const freeze=x=>Object.freeze(x);
function certifyAxisBoxSourceOpenRay({source,box,view}={}){
 const input=source;
 if(!input||typeof input!=='object'||Array.isArray(input)||
    Object.keys(input).sort().join(',')!=='from,id,to'||
    typeof input.id!=='string'||!/^[A-Za-z][\w-]{0,79}$/.test(input.id)||
    !Object.hasOwn(FIRST_ANGLE_OBSERVER_RAYS,view)||
    !box||typeof box!=='object'||Array.isArray(box)||
    box.type!=='box'||typeof box.id!=='string'||
    !/^[A-Za-z][\w-]{0,79}$/.test(box.id)||
    !Array.isArray(box.min)||!Array.isArray(box.max)||
    box.min.length!==3||box.max.length!==3)
  throw new TypeError('bounded original axis-box source and first-angle view required');
 const snap=p=>{
  if(!p||typeof p!=='object'||Array.isArray(p)||
     Object.keys(p).sort().join(',')!=='x,y,z')
   throw new TypeError('explicit original finite model-mm source endpoint required');
  const x=p.x,y=p.y,z=p.z;
  if(![x,y,z].every(Number.isFinite)||
     [x,y,z].some(v=>Math.abs(v)>1e6))
   throw new TypeError('bounded finite original 3D endpoint required');
  return [x,y,z];
 };
 const A=snap(input.from),B=snap(input.to);
 const min=[...box.min],max=[...box.max];
 if([...min,...max].some(v=>!Number.isFinite(v)||Math.abs(v)>1e6)||
    min.some((v,i)=>max[i]-v<=1e-7)||
    Math.hypot(...A.map((x,i)=>x-B[i]))<=1e-7)
  throw new RangeError('bounded positive 3D source and convex axis box required');
 const d=FIRST_ANGLE_OBSERVER_RAYS[view],
  ray=[d.x,d.y,d.z],axes=['x','y','z'];
 const insideEveryEndpoint=A.every((x,i)=>x>=min[i]&&x<=max[i]&&
   B[i]>=min[i]&&B[i]<=max[i]);
 let outwardSupport=null,strictInwardFaces=0,allBoundariesEnter=true;
 for(let i=0;i<3;i++){
  // One separating ORIGINAL box-support face and outward observer ray
  // prove this entire source misses THIS convex occluder for t>0.
  if(A[i]===min[i]&&B[i]===min[i]&&ray[i]<0)
   outwardSupport=axes[i]+'-min';
  if(A[i]===max[i]&&B[i]===max[i]&&ray[i]>0)
   outwardSupport=axes[i]+'-max';
  if(A[i]===min[i]&&B[i]===min[i]){
   strictInwardFaces++;
   if(ray[i]<=0)allBoundariesEnter=false;
  }
  if(A[i]===max[i]&&B[i]===max[i]){
   strictInwardFaces++;
   if(ray[i]>=0)allBoundariesEnter=false;
  }
 }
 // Proof of clearance cannot require whole source to be inside the box:
 // the native edge could be on its supporting plane but outside in
 // another coordinate. A strict outward halfspace still excludes it.
 let status='undetermined',reason='no-complete-axis-box-open-ray-proof';
 if(outwardSupport!==null){
  status='certified-clear';
  reason='exact-original-box-outward-support-ray';
 }else if(insideEveryEndpoint&&allBoundariesEnter){
  // The open source lives strictly inside every nonconstant coordinate,
  // and every constant boundary coordinate has a STRICT inward ray.
  status='certified-strictly-hidden';
  reason='each-original-source-open-point-has-positive-strict-interior-ray';
 }
 return freeze({
  schema:'draftai-m0-axis-box-exact-source-open-ray/1',
  sourceId:input.id,solidId:box.id,view,status,reason,
  originalSourceEndpointsWithinBox:insideEveryEndpoint,
  certifiedOutwardSupportingFace:outwardSupport,
  constantBoundarySupportCount:strictInwardFaces,
  nonuniformEndpointDepthMarginWasNeverRequired:true,
  everyOriginalSourceInteriorPointStrictlyHidden:
   status==='certified-strictly-hidden',
  everyOriginalSourceInteriorPointClear:
   status==='certified-clear',
  sourceEndpointOcclusionOrJoinCertified:false,
  nativeTopoDSHistoryReauthenticatedHere:false,
  officialEngineeringLineStyleAuthorized:false,
  signedV5ActionCount:0
 });
}
module.exports={certifyAxisBoxSourceOpenRay};
