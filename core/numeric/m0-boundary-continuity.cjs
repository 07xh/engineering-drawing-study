'use strict';
/**
 * Compare independent analytic boundary point rays with their neighboring
 * open-interval classifications. Do not extrapolate point-ray visibility
 * through a tangent, transition, depth tie, or omitted solid.
 */
const {auditM0PartitionBoundaries}=require('./m0-analytic-boundary-ray-audit.cjs');
const freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){Object.values(x).forEach(freeze);Object.freeze(x);}return x;};
const category=x=>x==='hidden-within-supplied-solids'?'occluded':
 x==='clear-within-supplied-solids'?'clear':null;
function auditM0BoundaryContinuity(args={}){
 const evidence=auditM0PartitionBoundaries(args);
 const {boundaries,partition}=evidence;
 const joins=[];
 for(let i=0;i<boundaries.length;i++){
  const b=boundaries[i],left=i?partition.runs[i-1]:null,
   right=i<partition.runs.length?partition.runs[i]:null;
  const l=left&&category(left.status),r=right&&category(right.status);
  const adjacentKnown=(!left||!!l)&&(!right||!!r);
  const same=!left||!right||l===r;
  const agrees=(!left||l===b.rayStatus)&&(!right||r===b.rayStatus);
  const certified=b.pointRayCertified&&adjacentKnown&&same&&agrees;
  const reasons=[];
  if(!b.pointRayCertified)reasons.push('boundary-ray-undetermined');
  if(!adjacentKnown)reasons.push('adjacent-open-run-undetermined');
  if(!same)reasons.push('visibility-transition');
  if(!agrees)reasons.push('boundary-open-visibility-disagreement');
  joins.push({parameter:b.parameter,rayStatus:b.rayStatus,
   leftOpenStatus:left?.status??null,rightOpenStatus:right?.status??null,
   localVisibilityContinuous:certified,reasons,
   // Local continuity alone is not a source-vertex/topology certificate.
   endpointJoinVerified:false,officialLineStyleVerified:false});
 }
 return freeze({schema:'draftai-m0-boundary-continuity/1',evidence,joins,
  allLocalVisibilityContinuous:joins.every(x=>x.localVisibilityContinuous),
  nearestDepthContinuousVerified:false,
  completeSceneVerified:false,fullContourVerified:false,
  officialLineStyleVerified:false,v5VerifiedExportReady:false});
}
module.exports={auditM0BoundaryContinuity};
