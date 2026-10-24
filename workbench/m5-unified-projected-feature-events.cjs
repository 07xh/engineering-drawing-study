'use strict';
/**
 * M5 C2: one projected EVENT ledger covering reviewed original source
 * creases AND genuinely generated union-face intersections.
 *
 * This module is NOT an alternative M4, SolveResult, Intent, DAG or V5.
 * It uses current M4 source intervals and independently certified generated
 * open subspan ray evidence, then finds all positive planar crossings,
 * collinear overlaps and endpoint meetings in first-angle V/H/W.
 *
 * Events are only projected geometry and source identity: equal paper
 * coordinates do NOT certify 3D contact, occlusion, standardized line
 * styles, or a final unique drawing stroke.
 */
const {project,VIEWS}=require('../core/projection/conventions.js');
const {analyzeSegmentTopology}=
 require('../core/geometry/segment-topology2d.cjs');
const freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){
 for(const v of Object.values(x))freeze(v);Object.freeze(x);
}return x;};
const diff=(a,b)=>({u:a.u-b.u,v:a.v-b.v});
const cross=(a,b)=>a.u*b.v-a.v*b.u;
const dot=(a,b)=>a.u*b.u+a.v*b.v;
const p3=(a,b,t)=>({x:a.x+t*(b.x-a.x),
 y:a.y+t*(b.y-a.y),z:a.z+t*(b.z-a.z)});
const p2=(a,b,t)=>({u:a.u+t*(b.u-a.u),v:a.v+t*(b.v-a.v)});
const dist2=(a,b)=>Math.hypot(a.u-b.u,a.v-b.v);
const dist3=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
const fail=msg=>{throw new TypeError('M5 source feature event graph: '+msg);};

/**
 * Conservative 2D broad phase on already validated first-angle endpoints.
 * A STRICT separating gap rules out a paper intersection; touching bounds
 * still enter the existing M0/M1 exact topology narrow phase.
 * This neither proves 3D joins nor releases engineering lines/V5 actions.
 */
function sourcePaperBounds(c){
 const a=c?.from2D,b=c?.to2D;
 if(!a||!b||![a.u,a.v,b.u,b.v].every(Number.isFinite))
  throw new TypeError('finite reviewed paper segment endpoints required');
 return Object.freeze({minU:Math.min(a.u,b.u),maxU:Math.max(a.u,b.u),
  minV:Math.min(a.v,b.v),maxV:Math.max(a.v,b.v)});
}
function definitelySeparatePaperBounds(a,b){
 return a.maxU<b.minU||b.maxU<a.minU||
  a.maxV<b.minV||b.maxV<a.minV;
}


/**
 * M1's EXISTING exact-for-binary64 topology is the independent sign oracle
 * only when the local Float64 denominator is too small to trust.
 * Never infer physical 3D coincidence or an approved engineering stroke.
 */
function auditNearParallelPaperSources(A,B){
 const segment=c=>({frame:'model-mm-2d',unit:'mm',
  from:{x:c.from2D.u,y:c.from2D.v},
  to:{x:c.to2D.u,y:c.to2D.v}});
 return analyzeSegmentTopology({first:segment(A),second:segment(B)});
}
function sourceParameterAtPaperPoint(c,q){
 const d=diff(c.to2D,c.from2D);
 const u=Math.abs(d.u)>=Math.abs(d.v)?
  (q.u-c.from2D.u)/d.u:(q.v-c.from2D.v)/d.v;
 if(!Number.isFinite(u)||u< -1e-9||u>1+1e-9)
  fail('M1-certified endpoint not in its M4 source parameter domain');
 const t=Math.min(1,Math.max(0,u));
 const actual=p2(c.from2D,c.to2D,t);
 if(dist2(actual,q)>1e-8)
  fail('M1-certified endpoint cannot be safely reconstructed in Float64');
 return t;
}

function auditUnifiedProjectedFeatureEvents({geometry,revision,
 projectedStrokePartitions,generatedSubspanRayEvidence}={}){
 if(!Number.isSafeInteger(revision)||revision<0)fail('current revision required');
 if(!Array.isArray(geometry)||geometry.length<2||geometry.length>8)
  fail('reviewed 2..8 source solids required');
 const ids=geometry.map(g=>g.id);
 if(new Set(ids).size!==ids.length)fail('distinct source Geometry IDs required');
 const m=projectedStrokePartitions,ray=generatedSubspanRayEvidence;
 if(m?.schema!=='draftai-scoped-projected-stroke-partition/1'||
    m.revision!==revision||m.status!=='preview-partition-evidence-only'||
    m.officialLineStylesVerified!==false||m.v5Ready!==false||
    m.generatedStrokeSignedCount!==0||
    !Array.isArray(m.segments)||!Array.isArray(m.generatedSegments))
  fail('only unsigned original M4 source partitions allowed');
 if(ray?.schema!=='draftai-m5-generated-open-subspan-opaque-rays/1'||
    ray.revision!==revision||
    ray.status!=='all-current-generated-open-subspan-source-rays-recomputed'||
    ray.officialLineStylesVerified!==false||ray.signedV5LineActions!==0||
    ray.v5Ready!==false||!Array.isArray(ray.pieces))
  fail('unsigned M0-certified generated source subspans required');
 const originalEdges=new Map();
 for(const g of geometry){
  for(const [a,b] of g.data.edges)originalEdges.set(
   g.id+'::'+[a,b].sort().join('|'),
   {sourceGeometryId:g.id,from:g.data.points[a],to:g.data.points[b]});
 }
 const candidates=[];
 for(const s of m.segments){
  if(!VIEWS.includes(s.view)||!originalEdges.has(s.sourceEdgeId)||
     !ids.includes(s.sourceGeometryId)||s.officialLineStyleVerified!==false||
     s.v5ActionApproved!==false||s.canonicalIntentVerified!==false)
   fail('source original M4 stroke invalid or released');
  if(!s.unionOpenSourceFeatureVerified)continue;
  const source=originalEdges.get(s.sourceEdgeId);
  const [left,right]=s.sourceParameterRange??[];
  if(source.sourceGeometryId!==s.sourceGeometryId||
     !Number.isFinite(left)||!Number.isFinite(right)||
     left<0||right>1||left>=right||
     dist3(p3(source.from,source.to,left),s.fromModelMm)>1e-8||
     dist3(p3(source.from,source.to,right),s.toModelMm)>1e-8)
   fail('original M4 source endpoints not on their authentic Geometry edge');
  const a=s.fromModelMm,b=s.toModelMm;
  if(dist3(a,b)<=1e-8||dist2(project(a)[s.view],project(b)[s.view])<=1e-8)
   continue;
  candidates.push({
   id:'M5Unified'+candidates.length,kind:'original-physical-crease',
   view:s.view,sourceEdgeId:s.sourceEdgeId,generatedSourceFeatureId:null,
   sourceGeometryIds:[s.sourceGeometryId],
   from3D:{...a},to3D:{...b},
   from2D:{...s.projectedFromModelMm},
   to2D:{...s.projectedToModelMm},
   verifiedUnionExteriorOpenFeature:true,
   observerRayEvidenceScope:s.openInteriorVisibility,
   sourceRevision:revision,officialEngineeringLineStyle:'undetermined',
   formalV5ActionAuthorized:false});
 }
 const generatedM4=new Map(m.generatedSegments.map(s=>[s.id,s]));
 const generatedM4Ids=new Set(generatedM4.keys());
 if(generatedM4Ids.size!==m.generatedSegments.length||
    ray.pieceCount!==ray.pieces.length||
    ray.pieces.some(p=>!generatedM4Ids.has(p.m4GeneratedCandidateId)))
  fail('new feature source M4 interval identity incomplete');
 for(const s of ray.pieces){
  if(!VIEWS.includes(s.view)||!ids.length||
     !Array.isArray(s.independentConvexSourceGeometryIds)||
     s.independentConvexSourceGeometryIds.join('|')!==ids.join('|')||
     s.applicableEngineeringLineStyle!=='undetermined'||
     s.officialSingleV5LineActionAuthorized!==false)
   fail('untrusted generated M0 ray source or claimed V5 line');
  const parent=generatedM4.get(s.m4GeneratedCandidateId);
  const [left,right]=s.source3DOpenParameterRange??[];
  if(!parent||parent.view!==s.view||
     parent.sourceGeneratedFeatureId!==s.generated3DSourceFeatureId||
     !Number.isFinite(left)||!Number.isFinite(right)||
     left<0||right>1||left>=right||
     dist3(p3(parent.source3DFrom,parent.source3DTo,left),s.source3DFrom)>1e-8||
     dist3(p3(parent.source3DFrom,parent.source3DTo,right),s.source3DTo)>1e-8)
   fail('new M0-proven source subspan does not match its authentic M4 parent');
  const a=s.source3DFrom,b=s.source3DTo;
  if(dist3(a,b)<=1e-8||dist2(project(a)[s.view],project(b)[s.view])<=1e-8)
   continue;
  candidates.push({
   id:'M5Unified'+candidates.length,kind:'generated-two-face-crease',
   view:s.view,sourceEdgeId:null,
   generatedSourceFeatureId:s.generated3DSourceFeatureId,
   sourceGeometryIds:[...ids],
   from3D:{...a},to3D:{...b},
   from2D:{...s.sourceProjectedFromModelMm},
   to2D:{...s.sourceProjectedToModelMm},
   verifiedUnionExteriorOpenFeature:true,
   observerRayEvidenceScope:s.sourceRayStatus,
   sourceRevision:revision,officialEngineeringLineStyle:'undetermined',
   formalV5ActionAuthorized:false});
 }
 if(candidates.length>240)fail('bounded source candidate graph budget exceeded');
 for(const s of candidates)if(
  !['V','H','W'].includes(s.view)||
  ![s.from2D.u,s.from2D.v,s.to2D.u,s.to2D.v].every(Number.isFinite)||
  dist2(s.from2D,project(s.from3D)[s.view])>1e-8||
  dist2(s.to2D,project(s.to3D)[s.view])>1e-8)
  fail('first-angle 3D-to-2D source identity mismatch');
 const cutMap=new Map(candidates.map(s=>[s.id,[0,1]]));
 // Local precomputed bounds preserve existing source IDs, output and revision.
 const candidateBounds=candidates.map(sourcePaperBounds);
 const events=[];
 for(let i=0;i<candidates.length;i++)for(let j=i+1;j<candidates.length;j++){
  const A=candidates[i],B=candidates[j];
  if(A.view!==B.view||
     definitelySeparatePaperBounds(candidateBounds[i],candidateBounds[j]))
   continue;
  const r=diff(A.to2D,A.from2D),s=diff(B.to2D,B.from2D),
   qp=diff(B.from2D,A.from2D),
   n1=Math.hypot(r.u,r.v),n2=Math.hypot(s.u,s.v);
  const scale=Math.max(1,n1,n2),tol=1e-10*scale;
  const den=cross(r,s);
  if(Math.abs(den)>tol*Math.max(n1,n2)){
   const t=cross(qp,s)/den,u=cross(qp,r)/den;
   if(t< -1e-10||t>1+1e-10||u< -1e-10||u>1+1e-10)continue;
   const ta=Math.max(0,Math.min(1,t)),ub=Math.max(0,Math.min(1,u));
   cutMap.get(A.id).push(ta);cutMap.get(B.id).push(ub);
   const qA=p3(A.from3D,A.to3D,ta),qB=p3(B.from3D,B.to3D,ub);
   const interior=ta>1e-9&&ta<1-1e-9&&ub>1e-9&&ub<1-1e-9;
   events.push({
    id:'M5Cross'+events.length,view:A.view,
    candidateIds:[A.id,B.id],kind:interior?
     'projected-interior-crossing':'projected-endpoint-or-t-junction',
    sourceParameters:[ta,ub],
    projectedPoint:p2(A.from2D,A.to2D,ta),
    samePhysical3DPointVerified:dist3(qA,qB)<=1e-9,
    paperCoincidenceCannotAuthorizePhysicalJoin:true,
    completeStrokeDepthOrderingVerified:false,
    standardLineStyleApproved:false,officialV5ActionAuthorized:false});
  }else{
   // A tolerance-only parallel test can silently erase a real crossing,
   // fabricate a false paper overlap, or discard an endpoint T-junction.
   // Reuse verified M1 binary64 orientation here, not another predicate.
   const relation=auditNearParallelPaperSources(A,B);
   if(relation.relation==='disjoint')continue;
   if(relation.relation==='proper-crossing')
    fail('exact M1 crossing is near-parallel: floating intersection is undetermined');
   if(relation.relation==='endpoint-touch'){
    const q=relation.intersectionPoint;
    const xy={u:q.x,v:q.y},ta=sourceParameterAtPaperPoint(A,xy),
     ub=sourceParameterAtPaperPoint(B,xy);
    cutMap.get(A.id).push(ta);cutMap.get(B.id).push(ub);
    events.push({id:'M5Cross'+events.length,view:A.view,
     candidateIds:[A.id,B.id],kind:'projected-endpoint-or-t-junction',
     sourceParameters:[ta,ub],projectedPoint:xy,
     samePhysical3DPointVerified:
      dist3(p3(A.from3D,A.to3D,ta),p3(B.from3D,B.to3D,ub))<=1e-9,
     paperCoincidenceCannotAuthorizePhysicalJoin:true,
     completeStrokeDepthOrderingVerified:false,
     standardLineStyleApproved:false,officialV5ActionAuthorized:false});
    continue;
   }
   if(!['coincident','collinear-overlap'].includes(relation.relation))
    fail('unexpected M1 projected segment topology status');
   if(Math.abs(cross(qp,r))>tol*n1||
      Math.abs(cross(diff(B.to2D,A.from2D),r))>tol*n1)
    fail('exact M1 collinear source overlap lost to numeric tolerance');
   const length2=dot(r,r),b0=dot(qp,r)/length2,
    b1=dot(diff(B.to2D,A.from2D),r)/length2,
    lo=Math.max(0,Math.min(b0,b1)),hi=Math.min(1,Math.max(b0,b1));
   if(hi-lo<=1e-9)
    fail('exact M1 positive paper overlap falls below supported M5 parameter precision');
   const qa=p2(A.from2D,A.to2D,lo),
    qb=p2(A.from2D,A.to2D,hi),sb2=dot(s,s),
    ub0=dot(diff(qa,B.from2D),s)/sb2,
    ub1=dot(diff(qb,B.from2D),s)/sb2;
   if(ub0< -1e-9||ub0>1+1e-9||ub1< -1e-9||ub1>1+1e-9)
    fail('paper overlap parameters outside original source edges');
   cutMap.get(A.id).push(lo,hi);
   cutMap.get(B.id).push(ub0,ub1);
   const pA0=p3(A.from3D,A.to3D,lo),
    pA1=p3(A.from3D,A.to3D,hi),
    pB0=p3(B.from3D,B.to3D,ub0),
    pB1=p3(B.from3D,B.to3D,ub1);
   events.push({id:'M5Overlap'+events.length,view:A.view,
    candidateIds:[A.id,B.id],kind:'projected-collinear-positive-overlap',
    firstSourceParameterRange:[lo,hi],
    secondSourceParameterRange:[ub0,ub1],
    projectedFromModelMm:qa,projectedToModelMm:qb,
    physicallyCoincidentEntireOverlapVerified:
     dist3(pA0,pB0)<=1e-9&&dist3(pA1,pB1)<=1e-9,
    projectedDuplicatesResolvedAndUnique:false,
    frontmostOpaqueFaceVerified:false,
    standardLineStyleApproved:false,officialV5ActionAuthorized:false});
  }
  if(events.length>24000)fail('projected source pairwise event budget exceeded');
 }
 const subspans=[];
 for(const c of candidates){
  const unique=[];
  for(const x of cutMap.get(c.id).sort((a,b)=>a-b)){
   if(!Number.isFinite(x)||x< -1e-8||x>1+1e-8)
    fail('projected critical event outside source interval');
   const y=Math.max(0,Math.min(1,x));
   if(!unique.length||y-unique.at(-1)>1e-9)unique.push(y);
  }
  if(unique[0]!==0||unique.at(-1)!==1)fail('original projected candidate not fully partitioned');
  for(let i=0;i<unique.length-1;i++){
   const a=unique[i],b=unique[i+1];
   if(b-a<=1e-9)continue;
   const from=p3(c.from3D,c.to3D,a),to=p3(c.from3D,c.to3D,b);
   subspans.push({id:'M5UnifiedOpen'+subspans.length,
    view:c.view,sourceCandidateId:c.id,
    sourceFeatureKind:c.kind,
    sourceParameterOpenRange:[a,b],
    source3DFrom:from,source3DTo:to,
    projectedFromModelMm:project(from)[c.view],
    projectedToModelMm:project(to)[c.view],
    sourceCrossingAndOverlapCriticalEventsIncluded:true,
    fullSceneOpaqueVolumeAndJunctionsVerified:false,
    uniqueFinalProjectedStrokeProven:false,
    authorizedEngineeringLineStyle:'undetermined',
    canonicalIntentStepAndV5Approved:false});
  }
 }
 return freeze({schema:'draftai-m5-unified-projected-source-events/1',
  revision,status:'reviewed-original-and-generated-paper-event-candidates',
  sourceGeometryIds:ids,candidates,events,subspans,
  candidateCount:candidates.length,eventCount:events.length,
  originalSourceCandidateCount:candidates.filter(x=>
   x.kind==='original-physical-crease').length,
  generatedSourceCandidateCount:candidates.filter(x=>
   x.kind==='generated-two-face-crease').length,
  properPaperCrossingCount:events.filter(x=>
   x.kind==='projected-interior-crossing').length,
  positiveCollinearOverlapCount:events.filter(x=>
   x.kind==='projected-collinear-positive-overlap').length,
  partitionedOpenSubspanCount:subspans.length,
  firstAngleProjectedGeometrySourceAccountedFor:true,
  allRelevantFinalOutlineFeaturesProvenComplete:false,
  projectedDuplicateResolutionAndFinalSourceUniquenessVerified:false,
  fullPaperJunctionAndDepthTopologyVerified:false,
  officialLineStylesVerified:false,signedV5LineActions:0,v5Ready:false});
}
module.exports={auditUnifiedProjectedFeatureEvents,auditNearParallelPaperSources,
 sourcePaperBounds,definitelySeparatePaperBounds};
