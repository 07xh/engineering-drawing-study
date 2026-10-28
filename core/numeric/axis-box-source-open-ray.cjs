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
/**
 * Conservative S minus C boolean OPEN observer-ray theorem.
 *
 * The existing positive stock-box ray proof remains the sole M0 kernel:
 * 1. S\\C is a subset of S, so a whole ray clear of S is clear of S\\C.
 * 2. If the ray enters strict interior of S and a perpendicular coordinate
 *    of EVERY open source point is strictly outside C, that complete ray
 *    never meets the cutter and must intersect S\\C.
 *
 * An affine open source point stays strictly outside C when BOTH endpoint
 * coordinates lie on the same non-interior side of one cutter plane, with
 * at least one strictly outside. Equality at both endpoints is NOT enough:
 * that is a cutter wall and its ray/face topology needs more evidence.
 * 3. A front-facing, nonempty STOCK MATERIAL SLAB strictly beyond the
 *    entire original source and strictly outside the cutting box in the
 *    observer's AXIAL coordinate is another sufficient hidden-ray theorem.
 *    The two other affine source coordinates must lie strictly inside the
 *    stock at EVERY open source point. One common slab point then lies
 *    strictly within S\\C in front of every such point. This recovers
 *    native side-view bore-wall rays, without guessing a surface normal or
 *    testing a single representative point.
 *
 * This does not infer native OCCT history, projected joins, GB style or V5.
 */
function certifyAxisBoxSubtractiveOpenRay({source,stock,cutter,view}={}){
 if(stock?.id===cutter?.id)
  throw new RangeError('subtractive stock and cutter identities must differ');
 const stockRay=certifyAxisBoxSourceOpenRay({source,box:stock,view});
 // Independently validate the cutter as a finite original M0 box; never
 // trust a caller-supplied isThroughHole or clearance flag.
 certifyAxisBoxSourceOpenRay({source,box:cutter,view});
 const direction=FIRST_ANGLE_OBSERVER_RAYS[view],
  names=['x','y','z'],a=source.from,b=source.to;
 let cutterSeparatedAxis=null;
 for(let i=0;i<3;i++){
  const k=names[i];
  if(direction[k]!==0)continue;
  const min=cutter.min[i],max=cutter.max[i];
  if((a[k]<=min&&b[k]<=min&&(a[k]<min||b[k]<min))||
     (a[k]>=max&&b[k]>=max&&(a[k]>max||b[k]>max))){
   cutterSeparatedAxis=k;
   break;
  }
 }
 // Check all original binary64 endpoint bounds; affine interpolation
 // makes each non-view-axis coordinate STRICTLY interior to stock for
 // every 0<s<1 iff both endpoints are in the closed stock interval and
 // not both lie on either same boundary plane.
 const rayAxis=names.findIndex(k=>direction[k]!==0);
 if(rayAxis<0||names.filter(k=>direction[k]!==0).length!==1||
    ![1,-1].includes(direction[names[rayAxis]]))
  throw new RangeError('expected exact canonical first-angle axis ray');
 const perpendicularSourceOpenInterior=names.every((k,i)=>{
  if(i===rayAxis)return true;
  const lower=stock.min[i],upper=stock.max[i],
   x=a[k],y=b[k];
  return x>=lower&&x<=upper&&y>=lower&&y<=upper&&
   (x>lower||y>lower)&&(x<upper||y<upper);
 });
 // Keep the interval OPEN, never materialize a rounded midpoint or
 // silently snap a 1-ULP positive real interval into a nonempty witness.
 // Direction +: max(source axial endpoints, cutter max) < stock max.
 // Direction -: stock min < min(source axial endpoints, cutter min).
 const plus=direction[names[rayAxis]]===1,
  axial=names[rayAxis],
  frontSlabLow=plus?
   Math.max(a[axial],b[axial],cutter.max[rayAxis],stock.min[rayAxis]):
   stock.min[rayAxis],
  frontSlabHigh=plus?
   stock.max[rayAxis]:
   Math.min(a[axial],b[axial],cutter.min[rayAxis],stock.max[rayAxis]),
  frontMaterialSlab=perpendicularSourceOpenInterior&&
   frontSlabLow<frontSlabHigh?Object.freeze({
    axis:axial,lowerExclusiveMm:frontSlabLow,
    upperExclusiveMm:frontSlabHigh,
    fixedCommonFrontMaterialDepthExists:true,
    allOriginalOpenSourcePerpendicularCoordinatesStrictlyWithinStock:true
   }):null;
 let status='undetermined',reason='subtractive-cutter-boundary-or-open-ray-unresolved';
 if(stockRay.status==='certified-clear'){
  status='certified-clear';
  reason='subtracted-material-is-subset-of-original-stock';
 }else if(stockRay.status==='certified-strictly-hidden'&&
          cutterSeparatedAxis!==null){
  status='certified-strictly-hidden';
  reason='strict-stock-front-interior-ray-and-perpendicular-cutter-separation';
 }else if(frontMaterialSlab!==null){
  // Every open segment point has a STRICT positive observer-ray
  // intersection with stock interior, outside the cutter in this axis.
  // This is exact whole-segment depth evidence, NOT projected M4 junction
  // proof, and it cannot authorize a formally drawn hidden line.
  status='certified-strictly-hidden';
  reason='common-front-stock-material-slab-outside-subtractive-cutter';
 }
 return Object.freeze({
  schema:'draftai-m0-axis-box-subtractive-open-ray/1',
  sourceId:source.id,stockId:stock.id,cutterId:cutter.id,view,
  status,reason,originalStockRayStatus:stockRay.status,
  cutterPerpendicularStrictSeparationAxis:cutterSeparatedAxis,
  commonFrontSubtractiveMaterialSlab:frontMaterialSlab,
  everyOpenSourcePointHasCommonStrictFrontMaterialDepth:
   status==='certified-strictly-hidden'&&frontMaterialSlab!==null,
  eachSourceOpenInteriorRayProved:status!=='undetermined',
  closedEndpointAndAllProjectedNativeJunctionsCertified:false,
  fullSubtractiveSceneEngineeringLinesCertified:false,
  constructionIntentAuthorized:false,signedV5Action:false
 });
}
module.exports={certifyAxisBoxSourceOpenRay,certifyAxisBoxSubtractiveOpenRay};
