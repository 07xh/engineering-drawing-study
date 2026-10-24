'use strict';
/**
 * M5 C2. FIRST-ANGLE paper-endpoint incidence of one reviewed registry of
 * ORIGINAL + GENERATED 3D union feature candidates.
 *
 * The exact 2D critical-event subspans were recomputed in #630 and paper
 * source multiplicity audited in #633. Group their open-edge ENDPOINTS by
 * true V/H/W paper coordinate; retain a distinct physical 3D source point
 * per incidence and never connect distant-depth points on paper equality.
 *
 * Incidence is a NECESSARY event topology witness, not an approved final
 * global outline, visible/hidden line style, ConstructionIntent/DAG/V5.
 */
const {VIEWS,project,FIRST_ANGLE_OBSERVER_RAYS}=
 require('../core/projection/conventions.js');
const {auditUnifiedProjectedFeatureEvents}=
 require('./m5-unified-projected-feature-events.cjs');
const {auditUnifiedPaperSourceIdentity}=
 require('./m5-unified-paper-source-identity.cjs');
const freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){
 for(const v of Object.values(x))freeze(v);Object.freeze(x);
}return x;};
const same3=(a,b)=>a.x===b.x&&a.y===b.y&&a.z===b.z;
const same2=(a,b)=>a.u===b.u&&a.v===b.v;
const keyof=p=>p.u+':'+p.v;
const dot3=(a,b)=>a.x*b.x+a.y*b.y+a.z*b.z;
const sub3=(a,b)=>({x:a.x-b.x,y:a.y-b.y,z:a.z-b.z});
const fail=x=>{throw new TypeError('M5 unified paper junction: '+x);};
function auditUnifiedPaperJunctions({geometry,revision,
 projectedStrokePartitions,generatedSubspanRayEvidence,
 unifiedProjectedFeatureEventEvidence,
 unifiedPaperSourceIdentityEvidence}={}){
 if(!Number.isSafeInteger(revision)||revision<0)
  fail('current reviewed geometry revision required');
 const fresh=auditUnifiedProjectedFeatureEvents({geometry,revision,
  projectedStrokePartitions,generatedSubspanRayEvidence});
 if(fresh.status!=='reviewed-original-and-generated-paper-event-candidates'||
    JSON.stringify(fresh)!==JSON.stringify(unifiedProjectedFeatureEventEvidence)||
    fresh.officialLineStylesVerified!==false||fresh.signedV5LineActions!==0)
  fail('forged or stale current source event proof');
 const registered=auditUnifiedPaperSourceIdentity({geometry,revision,
  projectedStrokePartitions,generatedSubspanRayEvidence,
  unifiedProjectedFeatureEventEvidence:fresh});
 if(JSON.stringify(registered)!==JSON.stringify(unifiedPaperSourceIdentityEvidence)||
    registered.officialLineStylesVerified!==false||
    registered.signedV5LineActions!==0)
  fail('forged or stale physical source paper multiplicity');
 const groups=new Map();
 const candidates=new Map(fresh.candidates.map(c=>[c.id,c]));
 for(const s of fresh.subspans){
  const owner=candidates.get(s.sourceCandidateId);
  if(!owner||owner.view!==s.view||
     s.authorizedEngineeringLineStyle!=='undetermined'||
     s.canonicalIntentStepAndV5Approved!==false)
   fail('untrusted original/new M4 line subspan');
  for(const role of ['from','to']){
   const at=role==='from'?s.source3DFrom:s.source3DTo,
    xy=project(at)[s.view],
    supplied=role==='from'?s.projectedFromModelMm:s.projectedToModelMm,
    other=role==='from'?s.source3DTo:s.source3DFrom;
   if(!same2(xy,supplied)||same3(at,other))
    fail('untrusted projected source endpoint or zero-length 3D edge');
   const key=s.view+':'+keyof(xy);
   if(!groups.has(key))groups.set(key,[]);
   const outgoing=sub3(other,at),
    dn=Math.hypot(outgoing.x,outgoing.y,outgoing.z);
   if(dn<=1e-8||!Number.isFinite(dn))
    fail('degenerate paper source incident segment');
   groups.get(key).push({
    sourceCandidateId:owner.id,unifiedSubspanId:s.id,
    featureKind:owner.kind,sourceGeometryIds:[...owner.sourceGeometryIds],
    real3DEndpoint:{...at},projectedPoint:{...xy},
    endpointRole:role,real3DOutgoingDirection:{
     x:outgoing.x/dn,y:outgoing.y/dn,z:outgoing.z/dn},
    exactSourceProjectionAndCurrentGeometryVerified:true,
    actualEngineeringStrokeEndpointSignedOff:false});
  }
 }
 if(groups.size>2400)fail('paper junction graph size limit exceeded');
 const rows=[];
 for(const [key,incidences] of groups){
  if(incidences.length>180)fail('excess source junction incidence');
  const view=key.split(':',1)[0],xy=incidences[0].projectedPoint;
  const ray=FIRST_ANGLE_OBSERVER_RAYS[view];
  if(!VIEWS.includes(view))fail('unknown first-angle paper view');
  const physical=[];
  for(const q of incidences){
   const found=physical.find(x=>same3(x.real3DPoint,q.real3DEndpoint));
   if(found){found.incidentSourceSubspanIds.push(q.unifiedSubspanId);}
   else physical.push({id:'Phys'+physical.length,
    real3DPoint:{...q.real3DEndpoint},
    observerDotDepthMm:dot3(q.real3DEndpoint,ray),
    incidentSourceSubspanIds:[q.unifiedSubspanId],
    sourceEndpointJoinFullyVerified:false});
  }
  physical.sort((a,b)=>b.observerDotDepthMm-a.observerDotDepthMm);
  const distinctDepth=new Set(physical.map(x=>x.observerDotDepthMm));
  const joins=[];
  for(let i=0;i<incidences.length;i++)for(let j=i+1;j<incidences.length;j++){
   const a=incidences[i],b=incidences[j],
    same=same3(a.real3DEndpoint,b.real3DEndpoint),
    dp=dot3(a.real3DOutgoingDirection,b.real3DOutgoingDirection);
   joins.push({sourceSubspanIds:[a.unifiedSubspanId,b.unifiedSubspanId],
    exactlySharedPhysical3DEndpoint:same,
    paperOnlyDepthAlias:!same,
    exactOpposite3DTangents:same&&Math.abs(dp+1)<=1e-10,
    actualGlobalPhysicalFeatureConnectionProven:false,
    fullPaperContinuityAndOcclusionProven:false,
    officialEngineeringLineJoinAuthorized:false});
  }
  const physicalAlias=physical.length>1;
  rows.push({id:'M5PaperNode'+rows.length,revision,view,
   paperCoordinateMm:{...xy},
   incidentSourceEndpoints:incidences,
   distinctPhysical3DNodes:physical,
   incidentCount:incidences.length,
   distinctPhysical3DNodeCount:physical.length,
   physicallySharedEndpointPairCount:joins.filter(j=>
    j.exactlySharedPhysical3DEndpoint).length,
   projectedCoincidentButReal3DDistinct:physicalAlias,
   distinctPhysicalNodeObserverDepthOrderVerified:true,
   observerDepthTieStillUnresolved:distinctDepth.size<physical.length,
   localPairwise3DJunctionRelations:joins,
   allSourceEdgePaperEndpointsIdentified:true,
   entireProjectedContourJunctionAndVisibilityVerified:false,
   officialLineStyle:'undetermined',
   canonicalIntentDAGAndV5EndpointAuthorized:false});
 }
 return freeze({schema:'draftai-m5-unified-paper-junctions/1',
  revision,status:'real-source-reviewed-first-angle-paper-endpoint-incidence',
  sourceGeometryIds:geometry.map(g=>g.id),
  paperNodes:rows,nodeCount:rows.length,
  endpointIncidenceCount:rows.reduce((n,x)=>n+x.incidentCount,0),
  physicallySharedEndpointNodeCount:rows.filter(x=>
   x.physicallySharedEndpointPairCount>0).length,
  paperOnlyDifferent3DDepthNodeCount:rows.filter(x=>
   x.projectedCoincidentButReal3DDistinct).length,
  registeredSourceOpenSubspanCount:fresh.subspans.length,
  allSourceOpenLineEndpointIncidencesAccountedFor:rows.reduce((n,x)=>
   n+x.incidentCount,0)===2*fresh.subspans.length,
  entireFinalProjectedContourJunctionTopologyVerified:false,
  completeOpaqueFaceAndEngineeringLineStandardVerified:false,
  officialLineStylesVerified:false,signedV5LineActions:0,v5Ready:false});
}
module.exports={auditUnifiedPaperJunctions};
