'use strict';
/**
 * C2 Boolean-generated BRep edge -> first-angle M4 source-event graph ->
 * existing M5 analytic whole-OPEN-subspan ray proofs.
 *
 * NO renderer geometry, no new mathematical intersection engine and no
 * one-off L-shape lookup: use the SAME generic projected-edge-depth-events
 * and convex-segment-clearance/union-occlusion kernels already in M0/M5.
 *
 * Real TopoDS IsSame vertex IDs distinguish physical 3D junctions from
 * paper-only crossings and endpoint coincidences. A projected overlap or
 * numerically unresolved encounter remains an UNSIGNED source subspan.
 *
 * Input native result is an external independent witness. The consumer
 * checks geometric consistency, but CAN'T attest that the user supplied a
 * genuine same-run OCCT result. Consequently ALL output remains unsigned
 * unless another higher-level native run/authentication gate proves it.
 */
const {project,VIEWS,FIRST_ANGLE_OBSERVER_RAYS}=
 require('../core/projection/conventions.js');
const {inspectProjectedEdgeDepth}=
 require('../core/numeric/projected-edge-depth-events.cjs');
const {originalCoProjectedAffineDepth}=
 require('../core/numeric/original-coproject-affine-depth.cjs');
const {certifyConvexSegmentClearance}=
 require('../core/numeric/convex-segment-clearance.cjs');
const {certifyAxisBoxSourceOpenRay}=
 require('../core/numeric/axis-box-source-open-ray.cjs');
const {evaluateFullSourceSegmentOcclusion}=
 require('../core/verification/convex-occlusion-coverage.cjs');
const finite=Number.isFinite;
const lerp=(a,b,t)=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,
 z:a.z+(b.z-a.z)*t});
const freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){
 for(const y of Object.values(x))freeze(y);Object.freeze(x);
}return x;};
const near=(p,q)=>p&&q&&['x','y','z'].every(
 k=>finite(p[k])&&finite(q[k])&&Math.abs(p[k]-q[k])<1e-8);
const key=(view,ordinal)=>view+'@'+ordinal;
const spanOverlap=(a,b)=>a[0]<b[1]&&b[0]<a[1];
function auditC2GeneratedResultProjectedM4M5({
 nativeReport,solids,revision,boxes=[]
}={}){
 const edges=nativeReport?.outputEdges;
 if(!Number.isSafeInteger(revision)||revision<1||
    nativeReport?.sourceRevision!==revision||
    !Array.isArray(edges)||edges.length<2||edges.length>40||
    !Array.isArray(solids)||solids.length<2||solids.length>8||
    !solids.every(x=>typeof x.id==='string'&&
      Array.isArray(x.halfspaces)&&x.halfspaces.length>=4)||
    !Array.isArray(boxes)||
    (boxes.length!==0&&boxes.length!==solids.length)||
    boxes.some((x,i)=>x?.id!==solids[i].id||x.type!=='box'))
  throw new TypeError('bounded native generated BRep edges and actual M0 scene required');
 const source=new Map(),per=new Map(),all=[];
 for(const item of edges){
  const id=item?.finalTopoDSEdgeOrdinal,ids=item?.actualNativeTopoDSVertexOrdinals,
   xyz=item?.real3DModelMmEndpoints;
  if(!Number.isSafeInteger(id)||id<1||id>edges.length||source.has(id)||
     !Array.isArray(ids)||ids.length!==2||
     ids.some(x=>!Number.isSafeInteger(x)||x<1)||ids[0]===ids[1]||
     !Array.isArray(xyz)||xyz.length!==2||!xyz.every(p=>p&&
     Object.keys(p).sort().join(',')==='x,y,z'&&
     [p.x,p.y,p.z].every(Number.isFinite))||
     Math.hypot(xyz[0].x-xyz[1].x,
       xyz[0].y-xyz[1].y,xyz[0].z-xyz[1].z)<=1e-7||
     !['physical-crease','coplanar-subdivision',
       'undetermined-dihedral'].includes(item.currentNativeResultFeatureStatus))
   throw new RangeError('untrusted native result edge endpoints or true TopoDS identity');
  const e={id,ids:[...ids],from:xyz[0],to:xyz[1],
   feature:item.currentNativeResultFeatureStatus};
  source.set(id,e);all.push(e);
  for(const view of VIEWS){
   const a=project(e.from)[view],b=project(e.to)[view];
   per.set(key(view,id),{view,id,projectedFrom:a,projectedTo:b,
    collapsed:Math.hypot(a.u-b.u,a.v-b.v)<=1e-7,
    cutParameters:[0,1],encounters:[],collinearOverlapRanges:[],
    unresolvedWholeEdge:false,roundedCut:false});
  }
 }
 let pairwiseEventChecks=0,transverseProjectedCrossings=0,
  trueNative3DJunctions=0,paperOnlyEncounters=0,
  exactProjectedOverlaps=0,nearDegeneratePairEvents=0;
 function addCut(r,t,event){
  if(!finite(t)||t< -1e-9||t>1+1e-9)
   throw new RangeError('M4 native generated source parameter escaped original [0,1]');
  const bounded=Math.max(0,Math.min(1,t));
  if(bounded!==t){r.roundedCut=true;r.unresolvedWholeEdge=true;}
  r.cutParameters.push(bounded);
  r.encounters.push({...event,sourceParameter:bounded,
   boundaryRounded:bounded!==t});
 }
 function pairEvent(first,second,view,ta,tb,relation){
  const a=per.get(key(view,first.id)),b=per.get(key(view,second.id));
  const ia=ta===0?first.ids[0]:ta===1?first.ids[1]:null;
  const ib=tb===0?second.ids[0]:tb===1?second.ids[1]:null;
  const joined=ia!==null&&ia===ib;
  const pa=lerp(first.from,first.to,ta),pb=lerp(second.from,second.to,tb);
  if(joined&&!near(pa,pb))
   throw new RangeError('same TopoDS vertex has disconnected original 3D points');
  const evidence={otherNativeEdgeOrdinal:second.id,relation,
   verifiedSharedNativeTopoDSVertexOrdinal:joined?ia:null,
   original3DPhysicalJunctionVerified:joined,
   projectedOnlyMeeting:!joined};
  addCut(a,ta,evidence);
  addCut(b,tb,{...evidence,otherNativeEdgeOrdinal:first.id});
  if(joined)trueNative3DJunctions++;
  else paperOnlyEncounters++;
 }
 for(let i=0;i<all.length;i++)for(let j=i+1;j<all.length;j++){
  const e=all[i],f=all[j];
  for(const view of VIEWS){
   const ra=per.get(key(view,e.id)),rb=per.get(key(view,f.id));
   const witness=inspectProjectedEdgeDepth({
    first:{id:'NativeC2Edge'+e.id,from:e.from,to:e.to},
    second:{id:'NativeC2Edge'+f.id,from:f.from,to:f.to},view
   });
   pairwiseEventChecks++;
   if(witness.status==='crossing'){
    transverseProjectedCrossings+=witness.events.length;
    for(const hit of witness.events)
     pairEvent(e,f,view,hit.firstParameter,hit.secondParameter,
      witness.status);
   }else if(witness.status==='endpoint-touch-undetermined'){
    for(const hit of witness.events)
     pairEvent(e,f,view,hit.firstParameter,hit.secondParameter,
      witness.status);
    // Geometrically touching in 2D doesn't certify which neighboring
    // 3D face the viewer actually sees on either side of this join.
   }else if(witness.status==='collinear-overlap'){
    exactProjectedOverlaps+=witness.ranges.length;
    for(const range of witness.ranges){
     const [aa,ab]=range.firstParameterRange,
      [ba,bb]=range.secondParameterRange;
     pairEvent(e,f,view,aa,ba,'projected-collinear-overlap-start');
     pairEvent(e,f,view,ab,bb,'projected-collinear-overlap-end');
     ra.collinearOverlapRanges.push({
      range:[Math.min(aa,ab),Math.max(aa,ab)],
      peerSourceOrdinal:f.id
     });
     rb.collinearOverlapRanges.push({
      range:[Math.min(ba,bb),Math.max(ba,bb)],
      peerSourceOrdinal:e.id
     });
    }
   }else if(witness.status.startsWith('undetermined-')){
    // A near-collinear line IS NOT proven disjoint even when the
    // classic 2D double-precision denominator happens to underflow.
    nearDegeneratePairEvents++;
    ra.unresolvedWholeEdge=true;rb.unresolvedWholeEdge=true;
   }
  }
 }
 let totalSubspans=0,positiveClear=0,positiveHidden=0,uncertain=0,
  collinearAliased=0,collapsed=0,strictForegroundAliasesResolved=0,
  nonphysicalAliasesIgnored=0;
 const rows=[];
 for(const raw of per.values()){
  const edge=source.get(raw.id),
   unique=[...new Set(raw.cutParameters)].sort((a,b)=>a-b);
  if(unique[0]!==0||unique.at(-1)!==1||unique.length>128)
   throw new RangeError('incomplete or excessive actual M4 source parameter tiling');
  if(raw.collapsed){
   collapsed++;
   rows.push({view:raw.view,sourceNativeResultEdgeOrdinal:raw.id,
    source3DVertexOrdinals:[...edge.ids],collapsed:true,
    cuts:unique,encounters:raw.encounters,subspans:[],
    formalEngineeringLineStylesCertified:false});
   continue;
  }
  const subspans=[];
  for(let k=1;k<unique.length;k++){
   const lo=unique[k-1],hi=unique[k];
   if(!(hi>lo))throw new RangeError('nonpositive original generated edge subspan');
   const from=lerp(edge.from,edge.to,lo),to=lerp(edge.from,edge.to,hi),
    from2=project(from)[raw.view],to2=project(to)[raw.view];
   const micro=Math.hypot(from2.u-to2.u,from2.v-to2.v)<=1e-10;
   const overlaps=raw.collinearOverlapRanges.filter(w=>
    spanOverlap([lo,hi],w.range));
   const physicalOverlaps=overlaps.filter(w=>
    source.get(w.peerSourceOrdinal)?.feature==='physical-crease');
   nonphysicalAliasesIgnored+=overlaps.length-physicalOverlaps.length;
   // Only genuine OTHER native physical creases can compete for an
   // official engineering line. Coplanar OCCT mesh subdivisions are
   // not engineering edges and must not block their real source.
   // The existing adaptive M4 collinear-overlap discovery provides
   // the complete original parameter cuts; independently prove the
   // strict signed 3D affine depth along EACH matching paper segment.
   const candidate3D={id:'NativeC2Edge'+raw.id+'Span'+k,from,to};
   const aliasOrders=physicalOverlaps.map(w=>{
    const competitor=source.get(w.peerSourceOrdinal);
    return originalCoProjectedAffineDepth({
     candidate:candidate3D,
     peer:{id:'NativeC2Peer'+competitor.id,
      from:competitor.from,to:competitor.to},
     view:raw.view
    });
   });
   const allOriginalPhysicalAliasesBehind=
    aliasOrders.length>0&&aliasOrders.every(x=>
     x.status==='candidate-strictly-front');
   const aliasBlocked=physicalOverlaps.length>0&&
     !allOriginalPhysicalAliasesBehind;
   if(allOriginalPhysicalAliasesBehind)
    strictForegroundAliasesResolved++;
   const base={
    originalGeneratedEdgeParameterRange:[lo,hi],
    realOriginalNative3DFrom:from,realOriginalNative3DTo:to,
    projectedFromModelMm:from2,projectedToModelMm:to2,
    trueNativeEdgeEndpointVertexOrdinals:[...edge.ids],
    continuousSourceGeometryIsOriginalNativeTopoDSEdge:true,
    officialEngineeringLineStyle:'undetermined',V5ActionSignedOff:false
   };
   let status='undetermined-join-or-native-boolean-evidence',
    clear=false,hidden=false;
   if(edge.feature==='coplanar-subdivision')
    status='coplanar-native-subdivision-not-a-line';
   else if(edge.feature!=='physical-crease')
    status='unverified-native-dihedral';
   else if(micro)status='unrenderable-positive-3d-subspan';
   else if(raw.unresolvedWholeEdge||aliasBlocked)
    status='unresolved-projected-depth-or-collinear-source-alias';
   else{
    const candidate={id:'NativeEdge'+raw.id+'Part'+k,from,to},
     ray=FIRST_ANGLE_OBSERVER_RAYS[raw.view];
    // The existing closed-convex segment-clearance kernel is still the
    // primary general solver. For current independently M0-verified
    // original axis-aligned box components, ALSO apply the exact affine
    // open-source support theorem. The original native TopoDS endpoints
    // can be on exterior box corners, so demanding a uniform positive
    // depth margin including both endpoints is mathematically impossible
    // even where every open source point is strictly hidden.
    const originalBoxRays=boxes.map(box=>
     certifyAxisBoxSourceOpenRay({
      source:candidate,box,view:raw.view
     }));
    clear=solids.every((solid,i)=>
     certifyConvexSegmentClearance({
      source:candidate,solid,observerDirection:ray
     }).status==='certified-clear'||
     originalBoxRays[i]?.status==='certified-clear');
    hidden=evaluateFullSourceSegmentOcclusion({
     source:candidate,solids,view:raw.view
    }).entireSourceSegmentOccluded===true||
     originalBoxRays.some(e=>
      e.status==='certified-strictly-hidden');
    if(clear&&hidden)
     throw new RangeError('contradictory analytic clear/occluded union interval');
    if(clear)status='analytic-whole-open-subspan-front-ray-clear';
    else if(hidden)status='analytic-whole-open-subspan-strictly-hidden';
   }
   if(clear)positiveClear++;
   else if(hidden)positiveHidden++;
   else if(status==='unresolved-projected-depth-or-collinear-source-alias')
    collinearAliased++;
   else uncertain++;
   totalSubspans++;
   subspans.push({...base,status,
    continuousAllOpaqueComponentRayClearVerified:clear,
    continuousUnionStrictInteriorOcclusionVerified:hidden,
    exactBoxOpenSourceRayProofApplied:boxes.length===solids.length,
    projectedAliasOrUncertainEventBlocked:
     raw.unresolvedWholeEdge||aliasBlocked,
    allProjectedPhysicalNativeAliasesStrictlyBehindCertified:
     aliasOrders.length===0||allOriginalPhysicalAliasesBehind,
    coProjectedOriginalNative3DDepthWitnesses:aliasOrders,
    nonphysicalCoplanarAliasesExcludedFromLineCompetition:
     overlaps.length-physicalOverlaps.length,
    nativeActualTopologySourceNotIndependentlyAttestedHere:true});
  }
  rows.push({view:raw.view,sourceNativeResultEdgeOrdinal:raw.id,
   source3DVertexOrdinals:[...edge.ids],
   collapsed:false,cuts:unique,
   encounters:raw.encounters,subspans,
   formalEngineeringLineStylesCertified:false});
 }
 if(rows.length!==all.length*VIEWS.length||
    totalSubspans!==positiveClear+positiveHidden+uncertain+collinearAliased||
    pairwiseEventChecks!==all.length*(all.length-1)/2*VIEWS.length)
  throw new RangeError('incomplete M4/M5 native source event accounting');
 return freeze({
  schema:'draftai-c2-native-generated-m4-m5-global-paper-events/1',
  revision,sourceResultEdgeCount:all.length,
  VHWSourceRows:rows.length,
  actualM4PairwiseSegmentViewChecks:pairwiseEventChecks,
  exactM4TransverseProjectedCrossings:transverseProjectedCrossings,
  provenOriginalNative3DVertexMeetings:trueNative3DJunctions,
  paperOnlyMeetingsKeptSeparate:paperOnlyEncounters,
  projectedCollinearIntervalOverlaps:exactProjectedOverlaps,
  unresolvedNearDegeneratePairEvents:nearDegeneratePairEvents,
  continuousM5SubspanCount:totalSubspans,
  positiveWholeOpenRayClearSubspans:positiveClear,
  positiveWholeStrictlyHiddenSubspans:positiveHidden,
  unsignedProjectedAliasSubspans:collinearAliased,
  strictlyForegroundOriginalCoProjectedSubspansCertified:
   strictForegroundAliasesResolved,
  ignoredCoplanarSubdivisionProjectedAliasCount:nonphysicalAliasesIgnored,
  unresolvedSubspans:uncertain,
  collapsedProjectedSourceRows:collapsed,rows,
  nativeSourceGenuinenessSignedHere:false,
  allOfficialEngineeringLinesCertified:false,
  fullOriginalConstructionIntentDAGSingleV5Authorized:false,
  originalNativeGeneratedEdgeHistoryWasReauthenticatedHere:false,
  realTextbookBlindTestPassed:false
 });
}
module.exports={auditC2GeneratedResultProjectedM4M5};
