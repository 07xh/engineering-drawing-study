'use strict';
/**
 * ONE-SCENE C2 subtraction bridge: original same-run native TopoDS vertex
 * identity + existing 3-view M4 projected encounter inventory + M5 open
 * continuous rays + physical (not paper-only) junctions.
 *
 * Strictly READ-ONLY. The original Cut M0 ray certifies (0,1) visibility,
 * never the closed endpoints. The true final TopoDS vertex graph authenticates
 * the 3D source at 0/1, but a paper crossing without shared TopoDS identity
 * does not certify the engineering line join. Thus a green row here is ONLY a
 * candidate for whole-scene line-style review; no Cut V5 action is minted.
 *
 * This is the existing M0/M4/M5 computation's joint acceptance boundary,
 * not a new ray solver, CAD engine, M4 intersection finder, or V5 player.
 */
const {VIEWS,project,FIRST_ANGLE_OBSERVER_RAYS}=
 require('../core/projection/conventions.js');
const {inspectProjectedEdgeDepth}=
 require('../core/numeric/projected-edge-depth-events.cjs');
const {certifyAxisBoxSubtractiveClosedSourceEndpoints}=
 require('../core/numeric/axis-box-source-open-ray.cjs');
const POINT_KEYS='x,y,z';
const same3=(a,b)=>a&&b&&['x','y','z'].every(k=>
 Number.isFinite(a[k])&&Number.isFinite(b[k])&&Object.is(a[k],b[k]));
const same2=(a,b)=>a&&b&&Number.isFinite(a.u)&&Number.isFinite(a.v)&&
 Object.is(a.u,b.u)&&Object.is(a.v,b.v);
const spanSame=(a,b)=>Array.isArray(a)&&Array.isArray(b)&&a.length===2&&
 b.length===2&&Object.is(a[0],b[0])&&Object.is(a[1],b[1]);
const interp=(a,b,t)=>({x:a.x+(b.x-a.x)*t,
 y:a.y+(b.y-a.y)*t,z:a.z+(b.z-a.z)*t});
const freeze=o=>{if(o&&typeof o==='object'&&!Object.isFrozen(o)){
 for(const v of Object.values(o))freeze(v);Object.freeze(o);
}return o;};
function auditC2CutNativeJunctionGlobalLineGate({math,nativeReport,revision}={}){
 const g=math?.globalPaperEvents,edges=nativeReport?.outputEdges,
  vertices=nativeReport?.resultVertexIncidence;
 if(!Number.isSafeInteger(revision)||revision<1||
    math?.actualNativeBooleanOperation!=='cut'||
    math.allNativeResultEdgeEndpointIsSameJunctionsReconciled!==true||
    math.currentNativeReported3DAndM0SourceCrossChecked!==true||
    math.ConstructionIntentAuthorized!==false||
    math.signedV5ActionCount!==0||
    nativeReport?.actualNativeBooleanOperation!=='cut'||
    nativeReport.sourceRevision!==revision||
    nativeReport.allFinalGeneratedEdgeEndpointsMappedToSameRunNativeTopoDSVertices!==true||
    nativeReport.allResultNativeVertexIncidenceAccountedFor!==true||
    nativeReport.completeProjectedOcclusionAndGBLineStylesCertified!==false||
    nativeReport.ConstructionIntentAuthorized!==false||
    nativeReport.signedV5ActionCount!==0||
    g?.schema!=='draftai-c2-native-generated-m4-m5-global-paper-events/1'||
    g.actualNativeBooleanOperation!=='cut'||g.revision!==revision||
    g.allOfficialEngineeringLinesCertified!==false||
    g.fullOriginalConstructionIntentDAGSingleV5Authorized!==false||
    !Array.isArray(edges)||edges.length<6||edges.length>256||
    !Array.isArray(vertices)||vertices.length<4||vertices.length>512||
    !Array.isArray(g.rows)||g.rows.length!==3*edges.length||
    g.VHWSourceRows!==g.rows.length||
    g.sourceResultEdgeCount!==edges.length||
    g.actualM4PairwiseSegmentViewChecks!==
     edges.length*(edges.length-1)/2*VIEWS.length)
  throw new RangeError('fresh same-run Cut native source and complete unsigned V/H/W M4/M5 required');
 const original=new Map(),nativeVertices=new Map(),rowsByKey=new Map();
 for(const v of vertices){
  const id=v?.actualNativeTopoDSVertexOrdinal,p=v?.real3DModelMm;
  if(!Number.isSafeInteger(id)||id<1||nativeVertices.has(id)||
     v.genuineTopoDSIsSameJunctionProven!==true||
     !p||Object.keys(p).sort().join(',')!==POINT_KEYS||
     ![p.x,p.y,p.z].every(Number.isFinite)||
     !Array.isArray(v.incidentFinalTopoDSEdgeOrdinals))
   throw new RangeError('unverified original native TopoDS shared 3D vertex');
  nativeVertices.set(id,v);
 }
 if(nativeVertices.size!==vertices.length)throw new RangeError('duplicate result native vertex');
 const incidence=new Map([...nativeVertices.keys()].map(id=>[id,[]]));
 for(const e of edges){
  const id=e?.finalTopoDSEdgeOrdinal,ids=e?.actualNativeTopoDSVertexOrdinals,
   xyz=e?.real3DModelMmEndpoints;
  if(!Number.isSafeInteger(id)||id<1||original.has(id)||
     e.nativeTopologicalEndpointJoinSource!=='same-run-result-TopoDS-vertex-IsSame'||
     !Array.isArray(ids)||ids.length!==2||ids[0]===ids[1]||
     !ids.every(v=>nativeVertices.has(v))||
     !Array.isArray(xyz)||xyz.length!==2||
     !xyz.every(p=>p&&Object.keys(p).sort().join(',')===POINT_KEYS)||
     !same3(xyz[0],nativeVertices.get(ids[0]).real3DModelMm)||
     !same3(xyz[1],nativeVertices.get(ids[1]).real3DModelMm))
   throw new RangeError('native C2 result edge and original TopoDS physical endpoint disagree');
  original.set(id,e);
  ids.forEach(v=>incidence.get(v).push(id));
 }
 if(original.size!==edges.length)throw new RangeError('duplicate original native result edge');
 for(const [id,actual] of incidence){
  const declared=nativeVertices.get(id).incidentFinalTopoDSEdgeOrdinals;
  if(actual.length<2||actual.some(v=>!Number.isSafeInteger(v))||
     new Set(declared).size!==declared.length||
     JSON.stringify(actual.sort((a,b)=>a-b))!==
      JSON.stringify([...declared].sort((a,b)=>a-b)))
   throw new RangeError('not all real same-run original native 3D junction incident edges accounted');
 }
 for(const row of g.rows){
  const k=row?.view+'@'+row?.sourceNativeResultEdgeOrdinal;
  if(!VIEWS.includes(row?.view)||rowsByKey.has(k)||
     !original.has(row.sourceNativeResultEdgeOrdinal)||
     !Array.isArray(row.source3DVertexOrdinals)||row.source3DVertexOrdinals.length!==2||
     JSON.stringify(row.source3DVertexOrdinals)!==
      JSON.stringify(original.get(row.sourceNativeResultEdgeOrdinal).actualNativeTopoDSVertexOrdinals)||
     !Array.isArray(row.cuts)||row.cuts[0]!==0||row.cuts.at(-1)!==1||
     !Array.isArray(row.encounters)||!Array.isArray(row.subspans)||
     (row.collapsed?row.subspans.length!==0:
      row.subspans.length!==row.cuts.length-1))
   throw new RangeError('incomplete or contradictory genuine three-view M4 source/junction graph');
  rowsByKey.set(k,row);
 }
 if(rowsByKey.size!==3*edges.length)throw new RangeError('missing original C2 result view');
 const boxes=nativeReport.actualNativeSourceBoxBoundsMm;
 if(!Array.isArray(boxes)||boxes.length!==2||
    boxes.some(x=>!x||typeof x.id!=='string'||
     !Array.isArray(x.min)||!Array.isArray(x.max)||
     x.min.length!==3||x.max.length!==3))
  throw new RangeError('original genuine native stock and cutter bounds required for M0 closed endpoints');
 const stock={...boxes[0],type:'box'},cutter={...boxes[1],type:'box'};
 const all=[],accepted=[];
 let closedMatchingOpenRaySourceIntervals=0,
  closedMatchingOpenRayOriginalNativeEndpointPairs=0,
  closedUnresolvedSourceEndPoints=0,closedSourcePointsClear=0,
  closedSourcePointsStrictlyHidden=0,
  total=0,positive=0,junctionReady=0,globalPaperReady=0,
  sourceEndpointPairs=0,heldInterior=0,heldPaper=0,heldAliasing=0,
  exact3DDepthResolvedAtAllOriginalSourceEndpoints=0,
  distinctProjectedEndpoint3DDepthComparisons=0,
  strictFrontProjectedEndpointAliasCount=0,
  strictBackProjectedEndpointAliasCount=0,
  unresolvedProjectedEndpointDepthCount=0;
 for(const row of g.rows){
  const e=original.get(row.sourceNativeResultEdgeOrdinal),
   coords=e.real3DModelMmEndpoints,ids=e.actualNativeTopoDSVertexOrdinals;
  for(const [i,span] of row.subspans.entries()){
   total++;
   const range=span.originalGeneratedEdgeParameterRange,
    status=span.status,clear=status==='analytic-cut-whole-open-subspan-front-ray-clear',
    hidden=status==='analytic-cut-whole-open-subspan-strictly-hidden';
   if(!spanSame(range,[row.cuts[i],row.cuts[i+1]])||
      !(range[0]<range[1])||
      !same3(span.realOriginalNative3DFrom,interp(coords[0],coords[1],range[0]))||
      !same3(span.realOriginalNative3DTo,interp(coords[0],coords[1],range[1]))||
      !same2(span.projectedFromModelMm,project(span.realOriginalNative3DFrom)[row.view])||
      !same2(span.projectedToModelMm,project(span.realOriginalNative3DTo)[row.view])||
      span.continuousSourceGeometryIsOriginalNativeTopoDSEdge!==true||
      span.V5ActionSignedOff!==false||
      span.officialEngineeringLineStyle!=='undetermined')
    throw new RangeError('M4 original native parametric 3D source does not match exact projected subspan');
   if(!clear&&!hidden)continue;
   positive++;
   const ray=span.originalM0SubtractiveCutOpenSourceRayEvidence;
   if(e.currentNativeResultFeatureStatus!=='physical-crease'||
      ray?.schema!=='draftai-m0-axis-box-subtractive-open-ray/1'||
      ray.view!==row.view||
      ray.status!==(clear?'certified-clear':'certified-strictly-hidden')||
      ray.sourceId!=='NativeEdge'+e.finalTopoDSEdgeOrdinal+'Part'+(i+1)||
      ray.signedV5Action!==false||
      ray.fullSubtractiveSceneEngineeringLinesCertified!==false||
      span.continuousSubtractiveCutOpenRayClearVerified!==clear||
      span.continuousSubtractiveCutStrictHiddenVerified!==hidden||
      span.continuousAllOpaqueComponentRayClearVerified!==false||
      span.continuousUnionStrictInteriorOcclusionVerified!==false)
    throw new RangeError('claimed positive Cut source interval is not backed by genuine unsigned M0/M5 ray');
   const closed=certifyAxisBoxSubtractiveClosedSourceEndpoints({
    source:{id:ray.sourceId,from:span.realOriginalNative3DFrom,
     to:span.realOriginalNative3DTo},
    stock,cutter,view:row.view
   });
   if(closed.openSourceStatus!==ray.status||
      closed.sourceId!==ray.sourceId||
      closed.constructionIntentAuthorized!==false||
      closed.newV5ActionCount!==0)
    throw new RangeError('actual closed M0 endpoint rays are not from the same genuine Cut source');
   if(closed.bothClosedEndpointsStrictlyMatchOpenSource)
    closedMatchingOpenRaySourceIntervals++;
   for(const endpoint of closed.originalClosedEndpoints){
    if(endpoint.status==='certified-clear')closedSourcePointsClear++;
    else if(endpoint.status==='certified-strictly-hidden')
     closedSourcePointsStrictlyHidden++;
    else closedUnresolvedSourceEndPoints++;
   }
   // Only literal native source endpoints are native TopoDS vertices;
   // M4 interior crossings are not converted into fabricated vertices.
   const checkEnd=(t,p)=>{
    if(t!==0&&t!==1)return {ok:false,why:'m4-interior-not-original-topods-vertex'};
    const vi=t===0?0:1,v=nativeVertices.get(ids[vi]);
    if(!v||!same3(p,v.real3DModelMm)||
       !same2(project(v.real3DModelMm)[row.view],project(p)[row.view]))
     throw new RangeError('actual native M4 endpoint contradicts source 3D vertex IsSame');
    return {ok:true,vertexOrdinal:ids[vi]};
   };
   const ends=[checkEnd(range[0],span.realOriginalNative3DFrom),
    checkEnd(range[1],span.realOriginalNative3DTo)];
   const endpointTopoDS=ends.every(x=>x.ok);
   if(endpointTopoDS){
    sourceEndpointPairs++;
    if(closed.bothClosedEndpointsStrictlyMatchOpenSource)
     closedMatchingOpenRayOriginalNativeEndpointPairs++;
   }else heldInterior++;
   // Consume all native-generated projected events at BOTH source
   // boundaries. A 2D touching peer is not a physical TopoDS junction.
   const atBoundary=t=>row.encounters.filter(x=>x.sourceParameter===t);
   const events=[atBoundary(range[0]),atBoundary(range[1])];
   const eachNativeEndpointPaperJoin=
    ends.every((end,k)=>end.ok&&events[k].every(w=>{
     const peer=original.get(w.otherNativeEdgeOrdinal);
     return peer&&w.boundaryRounded===false&&
      w.original3DPhysicalJunctionVerified===true&&
      w.projectedOnlyMeeting===false&&
      w.verifiedSharedNativeTopoDSVertexOrdinal===end.vertexOrdinal&&
      peer.actualNativeTopoDSVertexOrdinals.includes(end.vertexOrdinal);
    }));
   if(endpointTopoDS&&!eachNativeEndpointPaperJoin)heldPaper++;
   // Independently recompute projected native source crossings using the
   // existing M0 edge pair oracle. Distinct TopoDS vertices that meet only
   // on PAPER can still be strictly depth-ordered; they NEVER become the
   // same physical 3D junction. This check is necessary for a future
   // line-style review, but not sufficient for a closed-endpoint GB stroke.
   const observerRay=FIRST_ANGLE_OBSERVER_RAYS[row.view],source3D={
    id:'NativeC2Edge'+e.finalTopoDSEdgeOrdinal,
    from:coords[0],to:coords[1]
   };
   const endpointDepthRows=ends.map((end,k)=>{
    const t=range[k],a=k===0?span.realOriginalNative3DFrom:
     span.realOriginalNative3DTo;
    const comparisons=events[k].map(w=>{
     const peer=original.get(w.otherNativeEdgeOrdinal);
     if(!peer||w.boundaryRounded!==false||
        !Number.isSafeInteger(w.otherNativeEdgeOrdinal)||
        w.otherNativeEdgeOrdinal===e.finalTopoDSEdgeOrdinal)
      throw new RangeError('unbound original M4 projected endpoint pair');
     if(w.original3DPhysicalJunctionVerified===true){
      if(!end.ok||w.projectedOnlyMeeting!==false||
         w.verifiedSharedNativeTopoDSVertexOrdinal!==end.vertexOrdinal||
         !peer.actualNativeTopoDSVertexOrdinals.includes(end.vertexOrdinal))
       throw new RangeError('forged actual TopoDS shared-vertex identity at paper intersection');
      return {peerNativeEdgeOrdinal:w.otherNativeEdgeOrdinal,
       relation:w.relation,depthStatus:'actual-shared-native-3d-vertex',
       distinctPhysical3DSource:false};
     }
     if(w.projectedOnlyMeeting!==true||
        w.verifiedSharedNativeTopoDSVertexOrdinal!==null)
      throw new RangeError('projected-only endpoint forged into real 3D junction');
     const other3D={
      id:'NativeC2Peer'+peer.finalTopoDSEdgeOrdinal,
      from:peer.real3DModelMmEndpoints[0],
      to:peer.real3DModelMmEndpoints[1]
     };
     const witness=inspectProjectedEdgeDepth({
      first:source3D,second:other3D,view:row.view
     });
     // Never invent exact correspondence to a projected peer at a nearby
     // 2D coordinate. Numerical 1-ULP mismatches remain UNDETERMINED.
     let u=null;
     if(witness.status===w.relation&&
        (witness.status==='crossing'||
         witness.status==='endpoint-touch-undetermined')){
      const matched=witness.events.filter(x=>
       x.firstParameter===t);
      if(matched.length===1)u=matched[0].secondParameter;
     }else if(witness.status==='collinear-overlap'&&
         ['projected-collinear-overlap-start',
          'projected-collinear-overlap-end'].includes(w.relation)){
      const atStart=w.relation.endsWith('start'),
       matched=witness.ranges.filter(x=>
        x.firstParameterRange[atStart?0:1]===t);
      if(matched.length===1)
       u=matched[0].secondParameterRange[atStart?0:1];
     }
     let depthStatus='unresolved-paper-only-native-depth';
     if(Number.isFinite(u)&&u>=0&&u<=1){
      const b=interp(other3D.from,other3D.to,u),
       pa=project(a)[row.view],pb=project(b)[row.view];
      if(same2(pa,pb)){
       const delta=(a.x-b.x)*observerRay.x+
        (a.y-b.y)*observerRay.y+(a.z-b.z)*observerRay.z;
       if(delta>1e-7)depthStatus='candidate-strictly-front-of-paper-alias';
       else if(delta< -1e-7)
        depthStatus='candidate-strictly-behind-paper-alias';
       else if(same3(a,b)){
        // Different native vertex handles at the same exact 3D point
        // cannot authenticate the same physical junction.
        depthStatus='coincident-xyz-but-distinct-native-topods';
       }
      }
     }
     return {peerNativeEdgeOrdinal:w.otherNativeEdgeOrdinal,
      relation:w.relation,depthStatus,
      distinctPhysical3DSource:true};
    });
    for(const comparison of comparisons){
     if(!comparison.distinctPhysical3DSource)continue;
     distinctProjectedEndpoint3DDepthComparisons++;
     if(comparison.depthStatus==='candidate-strictly-front-of-paper-alias')
      strictFrontProjectedEndpointAliasCount++;
     else if(comparison.depthStatus==='candidate-strictly-behind-paper-alias')
      strictBackProjectedEndpointAliasCount++;
     else unresolvedProjectedEndpointDepthCount++;
    }
    return {nativeOriginalEndpointVerified:end.ok,
     originalNativeVertexOrdinal:end.ok?end.vertexOrdinal:null,
     allProjectedEndpointDepthEventsResolved:end.ok&&
      comparisons.every(x=>[
       'actual-shared-native-3d-vertex',
       'candidate-strictly-front-of-paper-alias',
       'candidate-strictly-behind-paper-alias'
      ].includes(x.depthStatus)),
     physical3DAndPaperOnlyDepthComparisons:comparisons};
   });
   const allEndpointDepthResolved=endpointDepthRows.every(x=>
    x.allProjectedEndpointDepthEventsResolved);
   if(allEndpointDepthResolved)
    exact3DDepthResolvedAtAllOriginalSourceEndpoints++;
   const overlaps=span.coProjectedOriginalNative3DDepthWitnesses;
   if(!Array.isArray(overlaps)||span.projectedAliasOrUncertainEventBlocked!==false||
      span.allProjectedPhysicalNativeAliasesStrictlyBehindCertified!==true||
      overlaps.some(w=>w?.view!==row.view||
       w.independentOriginal3DWholeOpenDepthOrderCertified!==true||
       w.status!=='candidate-strictly-front'||w.formalV5ActionSigned!==false))
    throw new RangeError('positive Cut native interval falsely passed global same-paper front-depth proof');
   globalPaperReady++;
   if(endpointTopoDS&&eachNativeEndpointPaperJoin)junctionReady++;
   const joint=endpointTopoDS&&eachNativeEndpointPaperJoin,
    ledger={view:row.view,
     nativeResultSourceEdgeOrdinal:e.finalTopoDSEdgeOrdinal,
     originalGeneratedEdgeParameterRange:[...range],
     originalNative3DVertexOrdinals:[...ids],
     projectedFromModelMm:{...span.projectedFromModelMm},
     projectedToModelMm:{...span.projectedToModelMm},
     positiveOpenM5RayStatus:clear?'strictly-clear':'strictly-hidden',
     independentlyNativeSourceOpenRayProof:true,
     original3DClosedSourceEndpointM0RayEvidence:closed,
     bothOriginal3DClosedEndpointRaysAgreeWithOpenM5:
      closed.bothClosedEndpointsStrictlyMatchOpenSource,
     independentlyTopoDSOriginal3DSourceEndpointPairCertified:endpointTopoDS,
     nativeFullShared3DVertexIncidenceRechecked:true,
     m4EndpointPhysicalJunctionsNotPaperAliases:eachNativeEndpointPaperJoin,
     actualOriginal3DEndpointAndPaperAliasDepthEvidence:endpointDepthRows,
     allOriginalNativeEndpointPaperAliasDepthsResolved:allEndpointDepthResolved,
     allCurrentPhysicalCoProjectedSourcesStrictlyBehindOrAbsent:true,
     allClosedJunctionsAndOpenRayEvidenceJointlyCertified:joint,
     pendingJunctionReason:joint?null:
      !endpointTopoDS?'interior-m4-event-not-topods-original-vertex':
      'paper-coincident-or-unproven-global-native-junction',
     officialGBEngineeringLineStyle:'undetermined',
     constructionIntentAuthorized:false,signedV5Action:false};
   all.push(ledger);if(joint)accepted.push(ledger);
  }
 }
 if(total!==g.continuousM5SubspanCount||
    positive!==g.partialSubtractiveCutRaySubspansProven||
    positive!==g.positiveWholeOpenRayClearSubspans+
     g.positiveWholeStrictlyHiddenSubspans||
    all.length!==positive||globalPaperReady!==positive||
    accepted.length!==junctionReady||
    closedMatchingOpenRaySourceIntervals>positive||
    closedMatchingOpenRayOriginalNativeEndpointPairs>sourceEndpointPairs||
    2*positive!==closedSourcePointsClear+
     closedSourcePointsStrictlyHidden+closedUnresolvedSourceEndPoints)
  throw new RangeError('C2 signed-candidate proof accounting differs from true M4');
 return freeze({
  schema:'draftai-c2-cut-native-m4-m5-joint-original-junction-gate/1',
  sourceRevision:revision,
  sourceResultEdgeCount:edges.length,views:[...VIEWS],
  nativeOriginalResultVertexCount:vertices.length,
  allActualSameRunNativeVertex3DIncidenceRechecked:true,
  allActualFirstAngleM4SourceIntervalsReboundToNative3D:true,
  counts:{totalM4Subspans:total,positiveOpenRaySubspans:positive,
   positiveM5IntervalsWithBothM0ClosedEndpointRaysCertified:
    closedMatchingOpenRaySourceIntervals,
   originalNativeVertexEndpointPairsWithClosedRaysCertified:
    closedMatchingOpenRayOriginalNativeEndpointPairs,
   individuallyCertifiedClosedEndpointClearRays:closedSourcePointsClear,
   individuallyCertifiedClosedEndpointStrictHiddenRays:
    closedSourcePointsStrictlyHidden,
   individuallyUnresolvedClosedEndpointRays:closedUnresolvedSourceEndPoints,
   exactOriginalNative3DEndpointPairs:sourceEndpointPairs,
   nativeGlobalPaperAliasFrontDepthAudited:globalPaperReady,
   jointOpenRayNativeEndpointAndGlobalPaperCandidates:junctionReady,
   heldAtInteriorM4Junction:heldInterior,
   heldAtPaperOrUnprovenNativeJunction:heldPaper,
   heldForGlobalDepthAlias:heldAliasing,
   fullNative3DEndpointPairsWithResolvedProjectedAliasDepth:
    exact3DDepthResolvedAtAllOriginalSourceEndpoints,
   distinctProjectedEndpoint3DDepthComparisons,
   strictlyFrontOfPaperEndpointAliasCount:strictFrontProjectedEndpointAliasCount,
   strictlyBehindPaperEndpointAliasCount:strictBackProjectedEndpointAliasCount,
   unresolvedPaperEndpointDepthComparisons:
    unresolvedProjectedEndpointDepthCount},
  positiveSourceIntervals:all,
  possibleFullJunctionLineReviewCandidates:accepted,
  completeBooleanClosedJunctionVisibilityCertified:false,
  globalGBEngineeringLineStylesCertified:false,
  originalNativeConstructionIntentAuthorized:false,
  newUniqueV5Actions:0
 });
}
module.exports={auditC2CutNativeJunctionGlobalLineGate};
