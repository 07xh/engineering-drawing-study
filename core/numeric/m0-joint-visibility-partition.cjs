'use strict';
/**
 * Partition an entire source segment using REAL M0 positive occlusion and
 * conservative clearance certificates. Positive and negative witnesses are
 * never inferred from their complements. Transition points remain unknown.
 * This is a scope-limited partition, not a nearest-depth or scene proof.
 */
const {certifyConvexSegmentOcclusion}=require('./convex-segment-occlusion.cjs');
const {certifyConvexSegmentClearance}=require('./convex-segment-clearance.cjs');
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){Object.values(x).forEach(freeze);Object.freeze(x);}return x;};
function partitionM0Segment({source,solids,observerDirection,marginMm=1e-7,
 angularTolerance=1e-12}={}){
 if(!Array.isArray(solids)||!solids.length||solids.length>64||
  new Set(solids.map(s=>s?.id)).size!==solids.length)
  throw new TypeError('1..64 distinct convex solids required');
 const witnesses=solids.map(s=>certifyConvexSegmentOcclusion({
  source,solid:s,observerDirection,marginMm,angularTolerance}));
 const cuts=[0,1];
 for(const w of witnesses)if(w.status==='certified-open-interval'){
  const [a,b]=w.openSourceParameterRange;
  if(!finite(a)||!finite(b)||a<0||b>1||a>=b)
   throw new RangeError('invalid M0 certified interval');
  cuts.push(a,b);
 }
 cuts.sort((a,b)=>a-b);
 const boundaries=[...new Set(cuts)];
 const runs=[];
 for(let i=0;i<boundaries.length-1;i++){
  const from=boundaries[i],to=boundaries[i+1];
  if(to<=from)continue;
  const occluders=witnesses.filter(w=>w.status==='certified-open-interval'&&
   w.openSourceParameterRange[0]<=from&&w.openSourceParameterRange[1]>=to)
   .map(w=>w.solidId);
  let status='undetermined',reason='insufficient-open-interval-proof';
  const clearance=[];
  if(occluders.length){
   status='hidden-within-supplied-solids';reason='positive-open-interior-witness';
  }else{
   for(const solid of solids)clearance.push(certifyConvexSegmentClearance({
    source,solid,observerDirection,sourceParameterRange:[from,to],
    clearanceMarginMm:marginMm,angularTolerance}));
   if(clearance.every(w=>w.status==='certified-clear')){
    status='clear-within-supplied-solids';reason='all-solids-continuous-clearance';
   }
  }
  runs.push({from,to,status,reason,occluderIds:occluders,
   clearSolidIds:clearance.filter(w=>w.status==='certified-clear').map(w=>w.solidId),
   depthOrderVerified:false});
 }
 return freeze({schema:'draftai-m0-joint-visibility-partition/1',
  sourceId:source?.id,solidIds:solids.map(s=>s.id),runs,
  transitionParameters:boundaries.slice(1,-1),
  positiveWitnesses:witnesses,
  allOpenRunsClassified:runs.every(r=>r.status!=='undetermined'),
  endpointJoinVerified:false,depthOrderVerified:false,
  completeSceneVerified:false,officialLineStyleVerified:false,
  v5VerifiedExportReady:false});
}
module.exports={partitionM0Segment};
