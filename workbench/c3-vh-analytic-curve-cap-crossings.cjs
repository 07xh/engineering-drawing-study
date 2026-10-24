'use strict';
/**
 * C3 adapter to reusable 2D circle/line intersection algebra:
 * rederive BOTH source families from trusted M3/M4; compare each resulting
 * paper crossing with all true signed 3D curve branches independently.
 * A 2D crossing cannot, by itself, merge 3D graph vertices or mint a line.
 */
const {evaluateUnifiedMath}=require('./unified-math-pipeline.cjs');
const {buildC3VHProjectionDedup}=
 require('./c3-vh-projection-dedup.cjs');
const {auditC3CapBoundaryIncidence}=
 require('./c3-cap-boundary-incidence.cjs');
const {arrangeProjectedCircleArcsAndLines}=
 require('../core/projection/projected-circle-arc-line-events.cjs');
const {project,VIEWS}=require('../core/projection/conventions.js');
const freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){
 for(const v of Object.values(x))freeze(v);Object.freeze(x);
}return x;};
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
const mix=(a,b,t)=>({x:a.x+(b.x-a.x)*t,
 y:a.y+(b.y-a.y)*t,z:a.z+(b.z-a.z)*t});
function auditC3VHAnalyticCurveCapCrossings({input,revision}={}){
 if(!Number.isSafeInteger(revision)||revision<0)
  throw new TypeError('current C3 M3 geometry revision required');
 const m3=evaluateUnifiedMath({
  kind:'finite-orthogonal-cylinder-intersection',input,revision});
 const missing=reason=>freeze({schema:'draftai-c3-vh-circle-line-crossings/1',
  revision,status:'not-covered',reason,views:{},events:[],
  allVHAnalyticCurveCapSourcePairsEnumerated:false,
  allSpatialCurveLineJunctionsCertified:false,
  officialLineStylesVerified:false,finalV5StrokeAuthorized:false});
 if(m3.status!=='scoped-analytic-ready'||m3.sourceConfirmed!==true||
    m3.geometryVerifiedWithinSpecialistScope!==true)
  return missing('current independently verified finite M3 unavailable');
 const circle=buildC3VHProjectionDedup({input,revision});
 const cap=auditC3CapBoundaryIncidence({input,revision});
 if(circle.status!=='scoped-projected-analytic-interval-deduplicated'||
    circle.projectionOwnershipVerified!==true||
    !['scoped-analytic-cap-junction-incidence',
       'undetermined-unmatched-lateral-cap-junction'].includes(cap.status)||
    cap.capSourceStatus!=='scoped-analytic-cap-boundary-pairs'||
    cap.standardLineStylesVerified!==false||
    circle.officialLineStylesVerified!==false)
  return missing('source curves and finite cap contact not covered');
 const scale=Math.max(1,input.zCylinder.radius,input.yCylinder.radius);
 const tolerance=1e-8*scale,byBranch=new Map(m3.branches.map(b=>[b.id,b]));
 const byCap=new Map(cap.capSegments.map(s=>[s.id,s]));
 const sourceAt=(branch,u)=>{
  const Z=m3.source.zCylinder,Y=m3.source.yCylinder;
  const radY=(Z.radius-Math.abs(u-Z.xCenter))*
    (Z.radius+Math.abs(u-Z.xCenter));
  const radZ=(Y.radius-Math.abs(u-Y.xCenter))*
    (Y.radius+Math.abs(u-Y.xCenter));
  if(radY< -tolerance||radZ< -tolerance)return null;
  return {x:u,y:Z.yCenter+branch.signY*Math.sqrt(Math.max(0,radY)),
   z:Y.zCenter+branch.signZ*Math.sqrt(Math.max(0,radZ))};
 };
 const views={},events=[];
 for(const view of ['V','H']){
  const spans=circle.spans.filter(s=>s.view===view);
  const curves=spans.map(s=>({
   id:s.id,view,center:{u:s.projectedSourceCircle.xCenter,
    v:s.projectedSourceCircle.coordinateCenter},
   radius:s.projectedSourceCircle.radius,sign:s.retainedSign,
   uRange:s.xOpenRange
  }));
  const lines=cap.capSegments.map(s=>({
   id:s.id,view,from:project(s.from)[view],to:project(s.to)[view]
  }));
  const arrangement=arrangeProjectedCircleArcsAndLines({
   view,arcs:curves,lines,tolerance});
  const index=new Map(spans.map(s=>[s.id,s]));
  const scoped=arrangement.events.map(e=>{
   const s=index.get(e.arcId),c=byCap.get(e.lineId);
   if(!s||!c)throw new RangeError('C3 exact projected event lost source ID');
   const sourceCapPoint=mix(c.from,c.to,e.lineParameter);
   const matched=[],differing=[];
   for(const id of s.sourceBranchIds){
    const branch=byBranch.get(id),x=e.curveParameterU;
    if(!branch)throw new RangeError('projected analytic source identity lost');
    // One de-duplicated paper arc can have two or more different 3D
    // branch sources; compare EACH instead of assuming unique ownership.
    if(x<branch.xRange[0]-tolerance||x>branch.xRange[1]+tolerance)
     continue;
    const spatial=sourceAt(branch,x);
    if(!spatial)throw new RangeError('projected curve left M3 radical support');
    if(distance(spatial,sourceCapPoint)<=tolerance)matched.push(id);
    else differing.push(id);
   }
   if(matched.length===0&&differing.length===0)
    throw new RangeError('2D projected event lacks any genuine 3D curve source');
   return {
    ...e,sourceArc3DBranchIds:[...s.sourceBranchIds],
    verified3DMatchingBranchIds:matched,
    verified3DSeparatedBranchIds:differing,
    physical3DSourceContactCandidate:matched.length>0,
    projectionAloneDoesNotProve3DJoin:true,
    exactSourceCapParameter:e.lineParameter,
    fullPhysicalGraphJunctionInserted:false,
    allOtherProjectedFeaturesConsidered:false,
    finalContourAndEndpointContinuityVerified:false,
    officialLineStyle:'undetermined',finalV5StrokeAuthorized:false
   };
  });
  views[view]={...arrangement,events:scoped};
  events.push(...scoped);
 }
 return freeze({schema:'draftai-c3-vh-circle-line-crossings/1',
  revision,status:'scoped-exact-VH-analytic-curve-cap-crossing-ledger',
  views,events,
  source3DBranchCount:m3.branchCount,
  originalFiniteCapSourceCount:cap.capSegments.length,
  projectedIntersectionCandidateCount:events.length,
  real3DContactCandidateCount:events.filter(e=>
   e.physical3DSourceContactCandidate).length,
  projectedOnlyContactCount:events.filter(e=>
   !e.physical3DSourceContactCandidate).length,
  allVHAnalyticCurveCapSourcePairsEnumerated:true,
  allSpatialCurveLineJunctionsCertified:false,
  allViewsIncludingWComplete:false,
  completeProjectedContourVerified:false,
  officialLineStylesVerified:false,finalV5StrokeAuthorized:false});
}
module.exports={auditC3VHAnalyticCurveCapCrossings};
