'use strict';
/**
 * M0/M5 proof gate: union continuous STRICT-interior forward-ray intervals
 * over all explicitly supplied convex occluders, recomputing every source
 * interval via the existing M0 analytic kernel rather than trusting claimed
 * user/renderer interval arrays.
 *
 * Exact zero/one parameter coverage certifies that EVERY 3D point of the
 * original source segment is behind one or more supplied solid interiors.
 * A gap, tangent join, projected collapse or uncertain occluder cannot
 * be promoted into a visible/hidden line. This is NOT a statement of
 * complete drawing, material transparency, topology, current user review,
 * paper-standard line styles, or V5 signed-off results.
 */
const {certifyConvexSegmentOcclusion}=
 require('../numeric/convex-segment-occlusion.cjs');
const {project,VIEWS,FIRST_ANGLE_OBSERVER_RAYS}=
 require('../projection/conventions.js');
const freeze=o=>{
 if(o&&typeof o==='object'&&!Object.isFrozen(o)){
  for(const v of Object.values(o))freeze(v);
  Object.freeze(o);
 }return o;
};
function evaluateFullSourceSegmentOcclusion({source,solids,view}={}){
 if(!VIEWS.includes(view)||!Array.isArray(solids)||!solids.length||
    solids.length>12)throw new TypeError('first-angle view and 1..12 verified convex solids required');
 if(!source||!source.from||!source.to)
  throw new TypeError('model-mm source segment required');
 const a=project(source.from)[view],b=project(source.to)[view];
 const projectedLength=Math.hypot(b.u-a.u,b.v-a.v);
 if(!Number.isFinite(projectedLength))
  throw new RangeError('nonfinite projected source length');
 const base={
  schema:'draftai-scoped-closed-source-edge-occlusion/1',
  sourceEdgeId:source.id,view,
  proofScope:'supplied-convex-solid-strict-interior-ray-union',
  completeSceneVerified:false,officialLineStyleVerified:false,
  endpointJoinVerified:false,canonicalIntentVerified:false,
  v5LineStyleSignedOff:false
 };
 if(projectedLength<=1e-7)return freeze({...base,
  status:'collapsed-projection',entireSourceSegmentOccluded:false,
  occluderIds:[],coveredParameterRanges:[]});
 const rangeBySolid=[],uncertainIds=[];
 for(const solid of solids){
  const e=certifyConvexSegmentOcclusion({
   source,solid,observerDirection:FIRST_ANGLE_OBSERVER_RAYS[view]
  });
  if(e.status==='certified-open-interval')
   rangeBySolid.push({id:solid.id,range:e.openSourceParameterRange});
  if(e.status==='undetermined')uncertainIds.push(solid.id);
 }
 rangeBySolid.sort((a,b)=>a.range[0]-b.range[0]||
  a.range[1]-b.range[1]||a.id.localeCompare(b.id));
 // DO NOT merge across a positive uncertainty gap (even if under 1 pixel).
 // All interval endpoints lie inside the ORIGINAL solid by strict margin,
 // so a union starting at exactly 0, ending exactly 1 and overlapping
 // without tolerance is a rigorous complete source-SEGMENT occlusion witness.
 let cursor=0,complete=false;
 const contributing=[];
 for(const item of rangeBySolid){
  if(item.range[0]>cursor)break;
  if(item.range[1]>cursor){
   contributing.push(item.id);
   cursor=item.range[1];
  }
  if(cursor===1){complete=true;break;}
 }
 return freeze({...base,
  status:complete?'source-segment-occluded-in-reviewed-solids':
   'full-stroke-unproven',
  entireSourceSegmentOccluded:complete,
  occluderIds:complete?[...new Set(contributing)]:[],
  coveredParameterRanges:rangeBySolid.map(x=>({
   solidId:x.id,sourceParameterRange:[...x.range]
  })),
  ambiguousOccluderIds:uncertainIds
 });
}
module.exports={evaluateFullSourceSegmentOcclusion};
