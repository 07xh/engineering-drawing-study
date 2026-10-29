'use strict';
/**
 * C3 M4/M5 W: split the actual same-source front/rear mirror depth
 * certificates at EVERY independently enumerated projected analytic
 * curve / finite cap-source LINE contact. A true 3D cap join is not a
 * paper-only overlap, and neither permits signing an engineering stroke.
 *
 * Both evidence providers are recomputed by the canonical C3 joint M3/M5
 * pipeline. Event absence between adjacent cuts is scoped only to these
 * *enumerated source cap line features*, not the entire solid silhouette,
 * cap faces, junction visibility, or globally frontmost line styles.
 */
const {project,FIRST_ANGLE_OBSERVER_RAYS}=
 require('../core/projection/conventions.js');
const freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){
 for(const v of Object.values(x))freeze(v);Object.freeze(x);
}return x;};
function auditC3WMirrorCapContactPartition({
 revision,mirrorEvidence,wCapEvidence
}={}){
 if(!Number.isSafeInteger(revision)||revision<0||
    mirrorEvidence?.revision!==revision||
    wCapEvidence?.revision!==revision||
    mirrorEvidence?.schema!=='draftai-c3-W-mirror-depth-order/1'||
    wCapEvidence?.schema!=='draftai-c3-W-radical-cap-contacts/1')
  throw new TypeError('current independent W mirror and cap contact witnesses required');
 const blocked=reason=>freeze({
  schema:'draftai-c3-W-mirror-cap-contact-partition/1',
  revision,solidOperation:mirrorEvidence.solidOperation,
  status:'not-covered',reason,
  originalMirroredOpenCellCount:0,atomicMirroredOpenCellCount:0,
  physicalCapContactCount:0,paperOnlyCapContactCount:0,
  capLineContactSplitCount:0,unassignedProjectedCapContactCount:0,
  atomicMirroredOpenCells:[],projectedCapContactEvents:[],
  allProjectedCapLineContactsAssignedToMirroredSourceCells:false,
  everyMirroredOpenCellFreeOfInteriorCapSourceLineCrossing:false,
  globalProjectedFeatureDepthVerified:false,
  closedSourceJunctionContinuityVerified:false,
  engineeringLineStylesCertified:false,officialV5Authorized:false
 });
 if(mirrorEvidence.status!=='scoped-exact-signed-W-lateral-mirror-depth'||
    mirrorEvidence.sameSignedLateralSourceWDepthOrderProven!==true)
  return blocked('exact centered source W mirror depth not certified');
 if(wCapEvidence.status!=='scoped-exact-W-analytic-curve-cap-line-events'||
    wCapEvidence.allWCurveCapPairsEnumerated!==true)
  return blocked('all original W finite cap source line contacts not enumerated');
 const obs=FIRST_ANGLE_OBSERVER_RAYS.W;
 if(obs.x!==1||obs.y!==0||obs.z!==0||
    project({x:7,y:2,z:3}).W.u!==2||
    project({x:7,y:2,z:3}).W.v!==3)
  throw new RangeError('incorrect C3 first-angle W depth convention');
 const center=mirrorEvidence.exactSharedXCenter;
 const pairs=mirrorEvidence.mirroredOpenDepthCells;
 if(!Number.isFinite(center)||!Array.isArray(pairs)||!pairs.length||
    pairs.length>512||!Array.isArray(wCapEvidence.events)||
    wCapEvidence.events.length>2048)
  throw new RangeError('bounded genuine C3 W mirrored cells and cap events required');
 const sources=new Map(),segments=[];
 for(const [index,pair] of pairs.entries()){
  if(pair.front3DDepthStrictlyGreaterThroughoutOpenCell!==true||
     pair.distinctRearAndFront3DPointsShareExactAnalyticWProjection!==true||
     pair.rearSelectedBooleanInteriorAheadProven!==true||
     pair.frontSelectedBooleanNoInteriorAheadProven!==true||
     pair.officialLineStyle!=='undetermined'||pair.v5ActionAuthorized!==false||
     !Array.isArray(pair.frontOriginalXOpenRange)||
     !Array.isArray(pair.rearOriginalXOpenRange)||
     pair.frontOriginalXOpenRange.length!==2||
     pair.rearOriginalXOpenRange.length!==2||
     ![...pair.frontOriginalXOpenRange,...pair.rearOriginalXOpenRange]
       .every(Number.isFinite))
   throw new RangeError('unsigned, complete original C3 W same-source mirror pairs required');
  const [lo,hi]=pair.frontOriginalXOpenRange;
  const [rl,rh]=pair.rearOriginalXOpenRange;
  if(!(hi>lo&&rh>rl&&lo>=center&&rh<=center)||
     !(2*center-hi===rl&&2*center-lo===rh))
   throw new RangeError('incorrect real W front/rear mirror parameter interval');
  for(const [id,side] of [
   [pair.rearM3BranchId,'rear'],[pair.frontM3BranchId,'front']
  ]){
   if(typeof id!=='string'||!id)
    throw new RangeError('C3 signed 3D source identity missing');
   if(!sources.has(id))sources.set(id,[]);
   sources.get(id).push({index,side,range:side==='rear'?[rl,rh]:[lo,hi]});
  }
  segments.push({pair,index,cuts:[lo,hi],events:[]});
 }
 const assigned=[],unassigned=[];
 for(const event of wCapEvidence.events){
  if(event.view!=='W'||typeof event.sourceBranchId!=='string'||
     typeof event.sourceCapFeatureId!=='string'||
     !Number.isFinite(event.sourceXParameter)||
     !event.sourceCurve3DPoint||!event.sourceCap3DPoint||
     !['x','y','z'].every(k=>
      Number.isFinite(event.sourceCurve3DPoint[k])&&
      Number.isFinite(event.sourceCap3DPoint[k]))||
     !Number.isFinite(event.signedCapMinusCurveObserverDepth)||
     event.signedCapMinusCurveObserverDepth!==
      event.sourceCap3DPoint.x-event.sourceCurve3DPoint.x||
     event.pointwiseTrue3DSourceCoincidenceVerified===
      event.projectedSourceOnlyNotPhysicalJoin||
     event.officialLineStyle!=='undetermined'||
     event.finalV5StrokeAuthorized!==false)
   throw new RangeError('untrusted genuine W projected finite cap source crossing');
  const p=project(event.sourceCurve3DPoint).W;
  const q=project(event.sourceCap3DPoint).W;
  if(![p.u,p.v,q.u,q.v].every(Number.isFinite)||
     !event.projectedUV||![event.projectedUV.u,event.projectedUV.v].every(Number.isFinite))
   throw new RangeError('nonfinite C3 cap and analytic curve paper coordinates');
  // The generating analytic point and the endpoint of the native cap
  // source must refer to the SAME W paper crossing, not arbitrary geometry.
  const scale=Math.max(1,Math.abs(p.u),Math.abs(p.v),
   Math.abs(q.u),Math.abs(q.v));
  const tolerance=1e-7*scale;
  if(Math.hypot(p.u-event.projectedUV.u,p.v-event.projectedUV.v)>tolerance||
     Math.hypot(q.u-event.projectedUV.u,q.v-event.projectedUV.v)>tolerance||
     event.sourceCurve3DPoint.x!==event.sourceXParameter)
   throw new RangeError('C3 cap event is not bound to the same M3 W projected source');
  const candidates=(sources.get(event.sourceBranchId)||[]).filter(row=>
   event.sourceXParameter>=row.range[0]&&
   event.sourceXParameter<=row.range[1]);
  if(candidates.length!==1){
   unassigned.push({eventId:event.id,sourceBranchId:event.sourceBranchId,
    reason:'unpaired-or-ambiguous-source-event-boundary'});
   continue;
  }
  const matched=candidates[0],pair=segments[matched.index];
  const mirrorX=matched.side==='rear'?
   2*center-event.sourceXParameter:event.sourceXParameter;
  const [lo,hi]=pair.pair.frontOriginalXOpenRange;
  if(!Number.isFinite(mirrorX)||mirrorX<lo||mirrorX>hi){
   unassigned.push({eventId:event.id,sourceBranchId:event.sourceBranchId,
    reason:'mirror-reflection-lost-representable-source-cell'});
   continue;
  }
  if(mirrorX>lo&&mirrorX<hi)pair.cuts.push(mirrorX);
  const cmp=event.signedCapMinusCurveObserverDepth;
  const depth=cmp>0?'cap-in-front-of-curve':
   cmp<0?'cap-behind-curve':'coincident-W-depth-or-physical-join';
  const row={eventId:event.id,sourceBranchId:event.sourceBranchId,
   sourceCapFeatureId:event.sourceCapFeatureId,
   mirroredPairIndex:matched.index,
   side:matched.side,
   sourceOriginalX:event.sourceXParameter,
   mirroredFrontX:mirrorX,
   trueOriginal3DCapContact:
    event.pointwiseTrue3DSourceCoincidenceVerified===true,
   paperOnlyCapContact:
    event.projectedSourceOnlyNotPhysicalJoin===true,
   capRelativeToSourceCurveWDepth:depth,
   projectedCapLineEventIsAnAtomicBoundary:true,
   closedEventSourceContinuityCertified:false,
   signedLineStyle:'undetermined',v5ActionAuthorized:false};
  pair.events.push(row);assigned.push(row);
 }
 const atomic=[];
 for(const {pair,index,cuts,events} of segments){
  const sorted=[...new Set(cuts)].sort((a,b)=>a-b);
  const [lo,hi]=pair.frontOriginalXOpenRange;
  if(sorted[0]!==lo||sorted.at(-1)!==hi)
   throw new RangeError('C3 W mirror cap contact partition lost original source extent');
  for(let i=1;i<sorted.length;i++){
   const a=sorted[i-1],z=sorted[i];
   if(!(z>a))throw new RangeError('C3 W projected cap event collapsed positive open cell');
   const back=[2*center-z,2*center-a];
   if(!(back[1]>back[0]))
    throw new RangeError('C3 W cap contact cut destroyed rear original M3 source span');
   // All independently enumerated source cap LINE crossings occur at one
   // of the open cell boundaries, not in its interior (within THIS M4
   // source-line arrangement only).
   if(events.some(e=>e.mirroredFrontX>a&&e.mirroredFrontX<z))
    throw new RangeError('interior C3 cap-line event was skipped');
   atomic.push({mirroredPairIndex:index,
    signedRadicalPair:pair.signedRadicalPair,
    rearM3BranchId:pair.rearM3BranchId,
    frontM3BranchId:pair.frontM3BranchId,
    rearOriginalXOpenRange:back,frontOriginalXOpenRange:[a,z],
    lowerBoundCapEvents:events.filter(e=>e.mirroredFrontX===a).map(e=>e.eventId),
    upperBoundCapEvents:events.filter(e=>e.mirroredFrontX===z).map(e=>e.eventId),
    allEnumeratedOriginalCapSourceLinesHaveNoInteriorCrossing:true,
    sameSourceMirrorStrictFrontDepthProven:true,
    adjacentBoundaryEventsHaveCompleteJunctionProof:false,
    unrelatedProjectedSolidOutlineOcclusionResolved:false,
    standardLineStyle:'undetermined',v5ActionAuthorized:false});
  }
 }
 if(atomic.length>2048)throw new RangeError('C3 W cap-line atomic mirror budget exceeded');
 const allAssigned=unassigned.length===0;
 return freeze({schema:'draftai-c3-W-mirror-cap-contact-partition/1',
  revision,solidOperation:mirrorEvidence.solidOperation,
  status:allAssigned?'scoped-mirror-depth-and-cap-line-event-partition':
   'partial-unassigned-mirror-cap-source-events',
  originalMirroredOpenCellCount:pairs.length,
  atomicMirroredOpenCellCount:atomic.length,
  physicalCapContactCount:assigned.filter(e=>e.trueOriginal3DCapContact).length,
  paperOnlyCapContactCount:assigned.filter(e=>e.paperOnlyCapContact).length,
  capLineContactSplitCount:atomic.length-pairs.length,
  unassignedProjectedCapContactCount:unassigned.length,
  unassignedProjectedCapContacts:unassigned,
  atomicMirroredOpenCells:atomic,projectedCapContactEvents:assigned,
  allProjectedCapLineContactsAssignedToMirroredSourceCells:allAssigned,
  everyMirroredOpenCellFreeOfInteriorCapSourceLineCrossing:allAssigned,
  globalProjectedFeatureDepthVerified:false,
  closedSourceJunctionContinuityVerified:false,
  engineeringLineStylesCertified:false,officialV5Authorized:false});
}
module.exports={auditC3WMirrorCapContactPartition};
