'use strict';
/**
 * Recompute M5 continuous observer-ray evidence on REAL OCCT Boolean
 * TopoDS result edges, including newly GENERATED union seams. Reuses
 * the existing M0 convex component halfspaces, continuous analytic M5
 * ray kernels and first-angle observer convention. NO new math engine.
 *
 * The external OCCT JSON is an independent reference, NOT a trusted
 * native witness unless the caller actually re-runs the native OCP
 * producer on the same original source. Accordingly this API never
 * grants official drawing styles or V5 authorization.
 */
const crypto=require('node:crypto');
const {VIEWS,project,FIRST_ANGLE_OBSERVER_RAYS}=
 require('../core/projection/conventions.js');
const {verifiedConvexMeshHalfspaces}=
 require('../core/geometry/verified-convex-mesh-halfspaces.cjs');
const {certifyConvexSegmentClearance}=
 require('../core/numeric/convex-segment-clearance.cjs');
const {certifyAxisBoxSourceOpenRay}=
 require('../core/numeric/axis-box-source-open-ray.cjs');
const {evaluateFullSourceSegmentOcclusion}=
 require('../core/verification/convex-occlusion-coverage.cjs');
const {auditC2GeneratedResultProjectedM4M5}=
 require('./c2-native-generated-global-m4-m5.cjs');
const freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){
 for(const y of Object.values(x))freeze(y);Object.freeze(x);
}return x;};
const dot=(a,b)=>a.x*b.x+a.y*b.y+a.z*b.z;
const finite=Number.isFinite;
function originalBoxGeometry(part){
 const lo=part?.min,hi=part?.max,id=part?.id;
 if(part?.type!=='box'||typeof id!=='string'||
    !/^[a-zA-Z][\w-]{0,70}$/.test(id)||
    !Array.isArray(lo)||!Array.isArray(hi)||lo.length!==3||hi.length!==3||
    [...lo,...hi].some(x=>!finite(x)||Math.abs(x)>1e6)||
    lo.some((x,i)=>hi[i]-x<=1e-7))
  throw new TypeError('finite original C2 box source manifest required');
 const [x0,y0,z0]=lo,[x1,y1,z1]=hi;
 const points={
  A:{x:x0,y:y0,z:z0},B:{x:x1,y:y0,z:z0},
  C:{x:x1,y:y1,z:z0},D:{x:x0,y:y1,z:z0},
  E:{x:x0,y:y0,z:z1},F:{x:x1,y:y0,z:z1},
  G:{x:x1,y:y1,z:z1},H:{x:x0,y:y1,z:z1}
 };
 const faces=[['A','D','C','B'],['E','F','G','H'],
  ['A','B','F','E'],['D','H','G','C'],
  ['A','E','H','D'],['B','C','G','F']];
 const seen=new Set(),edges=[];
 for(const face of faces)for(let i=0;i<face.length;i++){
  const a=face[i],b=face[(i+1)%face.length],
   key=[a,b].sort().join('|');
  if(!seen.has(key)){seen.add(key);edges.push([a,b]);}
 }
 return {id,kind:'mesh',space:'model-3d',unit:'mm',
  data:{points,edges,faces}};
}
function auditC2OcctGeneratedEdgeUnionRays({manifest,nativeReport}={}){
 const parts=manifest?.components,revision=manifest?.revision,
  operation=manifest?.operation??'union';
 if(!['union','cut'].includes(operation))
  throw new TypeError('original native C2 boolean mode must be union or Cut');
 if(operation==='cut'){
  const [stock,cutter]=parts||[];
  if(!stock||!cutter)throw new TypeError('current stock and cutter required');
  const axes=[0,1,2].filter(i=>cutter.min[i]<stock.min[i]-1e-7&&
   cutter.max[i]>stock.max[i]+1e-7);
  if(axes.length!==1||[0,1,2].some(i=>
    i!==axes[0]&&!(stock.min[i]+1e-7<cutter.min[i]&&
      cutter.max[i]<stock.max[i]-1e-7)))
   throw new RangeError('Cut needs one through-axis and inset original rectangular stock wall');
 }
 if(!Number.isSafeInteger(revision)||revision<1||
    !Array.isArray(parts)||parts.length!==2||
    parts[0]?.id===parts[1]?.id)
  throw new TypeError('two distinct current original C2 component source identities required');
 // Native result source IDs/revision alone are NOT sufficient. Reject an
 // unverified or stale OCP union that used different box bounds under the
 // same names. Exact binary64 mm coordinate equality is mandatory.
 if(nativeReport?.sourceFingerprintScope!==
    'ordered-ID-box-bounds-IEEE754-binary64-mm-v1'||
    typeof nativeReport.canonicalOriginalComponentGeometrySHA256!=='string'||
    !/^[0-9a-f]{64}$/.test(nativeReport.canonicalOriginalComponentGeometrySHA256)||
    !Array.isArray(nativeReport.actualNativeSourceBoxBoundsMm)||
    nativeReport.actualNativeSourceBoxBoundsMm.length!==parts.length||
    nativeReport.actualNativeSourceBoxBoundsMm.some((v,i)=>
     v?.id!==parts[i].id||
     !Array.isArray(v.min)||!Array.isArray(v.max)||
     v.min.length!==3||v.max.length!==3||
     ['min','max'].some(key=>v[key].some((num,j)=>
       !Number.isFinite(num)||!Object.is(num,parts[i][key][j])))))
  throw new RangeError('OCCT source box bounds differ from current independent M0 geometry');
 if(operation==='cut'){
  if(nativeReport.actualNativeBooleanOperation!=='cut'||
     nativeReport.originalSolidDifferenceReviewedAsThroughRectangularBore!==true)
   throw new RangeError('native same-run OCCT subtraction evidence missing');
  const digest=crypto.createHash('sha256');
  digest.update('DraftAI-C2-actual-TopoDS-source-v1\\0');
  digest.update(String(revision)+'\\0');
  digest.update('cut\\0');
  for(const part of parts){
   digest.update(part.id+'\\0');
   for(const value of [...part.min,...part.max]){
    const bytes=Buffer.allocUnsafe(8);bytes.writeDoubleBE(value,0);
    digest.update(bytes);
   }
  }
  if(digest.digest('hex')!==nativeReport.canonicalOriginalComponentGeometrySHA256)
   throw new RangeError('original through-hole operation or all source 3D coordinates changed');
 }else if(nativeReport.actualNativeBooleanOperation!==undefined&&
          nativeReport.actualNativeBooleanOperation!=='union')
  throw new RangeError('native report Cut cannot be consumed as opaque union');
 const geometries=parts.map(originalBoxGeometry);
 const solids=geometries.map(g=>{
  const proof=verifiedConvexMeshHalfspaces(g);
  return {id:g.id,halfspaces:proof.halfspaces};
 });
 if(nativeReport?.schema!==
    'draftai-independent-occt-boolean-topods-history-reference/1'||
    nativeReport.sourceRevision!==revision||nativeReport.unit!=='mm'||
    JSON.stringify(nativeReport.originalSourceIds)!==
     JSON.stringify(parts.map(p=>p.id))||
    nativeReport.status!=='valid-occt-boolean-history-reference-only'||
    nativeReport.allResultEdgesHaveSameRunActualTopoDSHistorySupport!==true||
    nativeReport.allResultEdgesHaveExactlyTwoRealNativeIncidentFaces!==true||
    !Array.isArray(nativeReport.outputEdges)||
    nativeReport.resultEdgeCount!==nativeReport.outputEdges.length||
    nativeReport.outputEdges.length<6||nativeReport.outputEdges.length>256||
    nativeReport.allFinalGeneratedEdgeEndpointsMappedToSameRunNativeTopoDSVertices!==true||
    nativeReport.allResultNativeVertexIncidenceAccountedFor!==true||
    !Array.isArray(nativeReport.resultVertexIncidence)||
    nativeReport.resultVertexCount!==nativeReport.resultVertexIncidence.length||
    nativeReport.ConstructionIntentAuthorized!==false||
    nativeReport.signedV5ActionCount!==0||
    nativeReport.completeProjectedOcclusionAndGBLineStylesCertified!==false)
  throw new RangeError('current complete unsigned native OCCT Boolean history inventory required');
 const seen=new Set(),rows=[];
 // Independently reconcile the reported output's one globally shared
 // TopoDS vertex identity per junction. It is NOT enough for two paper
 // projections to have equal (u,v); they need matching native vertex IDs.
 const vertexByOrdinal=new Map();
 for(const vertex of nativeReport.resultVertexIncidence){
  const id=vertex?.actualNativeTopoDSVertexOrdinal,
   p=vertex?.real3DModelMm;
  if(!Number.isSafeInteger(id)||id<1||
     id>nativeReport.resultVertexCount||vertexByOrdinal.has(id)||
     !p||Object.keys(p).sort().join(',')!=='x,y,z'||
     [p.x,p.y,p.z].some(x=>!finite(x)||Math.abs(x)>1e6)||
     vertex.genuineTopoDSIsSameJunctionProven!==true||
     !Array.isArray(vertex.incidentFinalTopoDSEdgeOrdinals)||
     vertex.incidentFinalTopoDSEdgeOrdinals.length<2)
   throw new RangeError('incomplete native result 3D vertex incidence inventory');
  vertexByOrdinal.set(id,vertex);
 }
 if(vertexByOrdinal.size!==nativeReport.resultVertexCount)
  throw new RangeError('missing shared native result vertex ordinal');
 const recomputedIncidence=new Map([...vertexByOrdinal.keys()].map(id=>[id,[]]));
 const counts={physicalGeneratedEdges:0,coplanarNativeSubdivisions:0,
  undeterminedNativeFeatures:0,collapsed:0,clear:0,hidden:0,
  unresolvedDepth:0};
 const surfaceNear=(a,b)=>Math.abs(a-b)<=1e-9;
 const outward=(source,solid,ray)=>{
  // One verified M0 supporting plane is sufficient: endpoints both lie
  // on it and the observer ray strictly points OUT of the whole convex
  // component. Straight-edge affine interpolation keeps all points on it.
  return solid.halfspaces.some(h=>
   surfaceNear(dot(h.normal,source.from),h.offsetMm)&&
   surfaceNear(dot(h.normal,source.to),h.offsetMm)&&
   dot(h.normal,ray)>1e-10);
 };
 for(const edge of nativeReport.outputEdges){
  const ordinal=edge?.finalTopoDSEdgeOrdinal;
  if(!Number.isSafeInteger(ordinal)||ordinal<1||ordinal>
     nativeReport.outputEdges.length||seen.has(ordinal))
   throw new RangeError('missing/duplicate actual OCCT result edge ordinal');
  seen.add(ordinal);
  const xyz=edge.real3DModelMmEndpoints;
  if(!Array.isArray(xyz)||xyz.length!==2||
     xyz.some(p=>!p||Object.keys(p).sort().join(',')!=='x,y,z'||
      [p.x,p.y,p.z].some(v=>!finite(v)||Math.abs(v)>1e6))||
     edge.currentNativeResultEdgeHasExactlyTwoIncidentFaces!==true||
     !Array.isArray(edge.currentNativeResultFaceOutwardNormals)||
     edge.currentNativeResultFaceOutwardNormals.length!==2)
   throw new RangeError('missing exact native generated edge 3D geometry/manifold faces');
  const nativeVertexOrdinals=edge.actualNativeTopoDSVertexOrdinals;
  if(!Array.isArray(nativeVertexOrdinals)||
     nativeVertexOrdinals.length!==2||
     nativeVertexOrdinals[0]===nativeVertexOrdinals[1]||
     nativeVertexOrdinals.some(id=>!vertexByOrdinal.has(id))||
     edge.nativeTopologicalEndpointJoinSource!==
      'same-run-result-TopoDS-vertex-IsSame')
   throw new RangeError('native result edge has unverified actual TopoDS vertex IDs');
  for(const [index,id] of nativeVertexOrdinals.entries()){
   const nativePoint=vertexByOrdinal.get(id).real3DModelMm,
    p=xyz[index];
   if(Math.hypot(p.x-nativePoint.x,p.y-nativePoint.y,
     p.z-nativePoint.z)>1e-9)
    throw new RangeError('native edge endpoint not same 3D TopoDS vertex');
   recomputedIncidence.get(id).push(ordinal);
  }
  const [from,to]=xyz,spaceLength=Math.hypot(
   from.x-to.x,from.y-to.y,from.z-to.z);
  if(!(spaceLength>1e-7))
   throw new RangeError('collapsed native final physical edge');
  const ns=edge.currentNativeResultFaceOutwardNormals;
  if(ns.some(n=>!Array.isArray(n)||n.length!==3||
     n.some(x=>!finite(x))||Math.abs(Math.hypot(...n)-1)>1e-9))
   throw new RangeError('unverified native incident face normals');
  const cosine=Math.max(-1,Math.min(1,ns[0].reduce(
   (s,x,i)=>s+x*ns[1][i],0)));
  const angle=Math.acos(cosine),
   feature=angle>1e-6&&Math.PI-angle>1e-6?
    'physical-crease':angle<=1e-6?'coplanar-subdivision':
    'undetermined-dihedral';
  if(!finite(edge.currentNativeResultDihedralAngleRad)||
     Math.abs(edge.currentNativeResultDihedralAngleRad-angle)>1e-8||
     edge.currentNativeResultFeatureStatus!==feature||
     edge.currentNativeResultPhysicalCreaseVerified!==(
      feature==='physical-crease')||
     edge.currentNativeResultCoplanarSubdivisionVerified!==(
      feature==='coplanar-subdivision'))
   throw new RangeError('native Boolean face dihedral/history status drift');
  if(!Array.isArray(edge.originalTopoDSHistory)||
     edge.originalTopoDSHistory.length<1||
     edge.originalTopoDSHistory.some(h=>
      !parts.some(p=>p.id===h.sourceComponentId)||
      !['edge','face'].includes(h.sourceKind)||
      !Number.isSafeInteger(h.sourceOrdinal)||h.sourceOrdinal<1||
      h.sourceOrdinal>(h.sourceKind==='edge'?12:6)||
      typeof h.relation!=='string'))
   throw new RangeError('generated edge without original TopoDS shape history');
  const source={id:'C2NativeEdge'+ordinal,from,to};
  // Necessary but not sufficient: verify native final edge lies on
  // actual M0 component supporting planes instead of arbitrary 3D input.
  if(!solids.some(solid=>solid.halfspaces.some(h=>
     surfaceNear(dot(h.normal,from),h.offsetMm)&&
     surfaceNear(dot(h.normal,to),h.offsetMm))))
   throw new RangeError('native edge unsupported by original convex M0 face geometry');
  if(feature==='physical-crease')counts.physicalGeneratedEdges++;
  else if(feature==='coplanar-subdivision')counts.coplanarNativeSubdivisions++;
  else counts.undeterminedNativeFeatures++;
  for(const view of VIEWS){
   const from2D=project(from)[view],to2D=project(to)[view];
   const base={view,sourceNativeResultEdgeOrdinal:ordinal,
    source3DFrom:{...from},source3DTo:{...to},
    genuineResultTopoDSVertexOrdinals:[...nativeVertexOrdinals],
    bothEndpointOriginal3DIsSameJunctionsVerified:true,
    projectedFromModelMm:from2D,projectedToModelMm:to2D,
    currentNativeResultFeatureStatus:feature,
    sourceOriginalTopoDSHistory:edge.originalTopoDSHistory.map(h=>({...h})),
    allCurrentM0ComponentsRevalidated:true,
    nativeGenerated3DSourceUsedRatherThanRendererPolyline:true,
    officialEngineeringLineStyle:'undetermined',
    V5ActionSignedOff:false};
   if(Math.hypot(from2D.u-to2D.u,from2D.v-to2D.v)<=1e-7){
    counts.collapsed++;
    rows.push({...base,status:'collapsed-in-projection'});
    continue;
   }
   if(feature!=='physical-crease'){
    rows.push({...base,status:feature==='coplanar-subdivision'?
      'coplanar-mesh-only-not-an-engineering-line':
      'uncertain-generated-edge-dihedral'});
    continue;
   }
   if(operation==='cut'){
    counts.unresolvedDepth++;
    rows.push({...base,
     status:'unresolved-subtracted-void-continuous-ray-depth',
     fullNativeTopoDSResultEdgeContinuousRayProof:false,
     allComponentClearIds:[],continuousUnionStrictOcclusionVerified:false,
     allOriginalConvexComponentIds:solids.map(s=>s.id)
    });
    continue;
   }
   const ray=FIRST_ANGLE_OBSERVER_RAYS[view];
   const clearIds=[],boxOpenRays=[];
   for(const [i,solid] of solids.entries()){
    const analytic=certifyConvexSegmentClearance({
     source,solid,observerDirection:ray
    });
    const exact=certifyAxisBoxSourceOpenRay({
     source,box:parts[i],view
    });
    boxOpenRays.push(exact);
    if(analytic.status==='certified-clear'||
       outward(source,solid,ray)||
       exact.status==='certified-clear')
     clearIds.push(solid.id);
   }
   const blocked=evaluateFullSourceSegmentOcclusion({
    source,solids,view
   });
   const clear=clearIds.length===solids.length;
   const hidden=blocked.entireSourceSegmentOccluded===true||
    boxOpenRays.some(x=>x.status==='certified-strictly-hidden');
   if(clear&&hidden)
    throw new RangeError('contradictory existing M5 all-face clear and hidden rays');
   if(clear)counts.clear++;
   else if(hidden)counts.hidden++;
   else counts.unresolvedDepth++;
   rows.push({...base,
    status:clear?'entire-original-generated-BRep-edge-front-ray-clear':
     hidden?'entire-original-generated-BRep-edge-behind-opaque-union':
     'undetermined-all-opaque-components',
    fullNativeTopoDSResultEdgeContinuousRayProof:true,
    allComponentClearIds:clearIds,
    continuousUnionStrictOcclusionVerified:hidden,
    fullOpenSourceAxisBoxTheoremApplied:true,
    originalBoxStrictInteriorOpenRayWitnessIds:boxOpenRays
     .filter(x=>x.status==='certified-strictly-hidden')
     .map(x=>x.solidId),
    allOriginalConvexComponentIds:solids.map(s=>s.id)
   });
  }
 }
 for(const [vertexId,vertex] of vertexByOrdinal){
  const expected=recomputedIncidence.get(vertexId).sort((a,b)=>a-b),
   provided=vertex.incidentFinalTopoDSEdgeOrdinals;
  if(new Set(provided).size!==provided.length||
     JSON.stringify(expected)!==JSON.stringify(provided))
   throw new RangeError('incomplete or forged same-run TopoDS edge-vertex incidence');
 }
 if(seen.size!==nativeReport.resultEdgeCount||
    counts.physicalGeneratedEdges+counts.coplanarNativeSubdivisions+
      counts.undeterminedNativeFeatures!==seen.size||
    rows.length!==seen.size*VIEWS.length)
  throw new RangeError('incomplete native generated edge V/H/W audit accounting');
 const globalPaperEvents=auditC2GeneratedResultProjectedM4M5({
  nativeReport,solids,revision,boxes:parts,operation
 });
 if(globalPaperEvents.sourceResultEdgeCount!==seen.size||
    globalPaperEvents.VHWSourceRows!==rows.length)
  throw new RangeError('new native source M4/M5 graph drifted from original topology');
 return freeze({
  schema:'draftai-c2-occt-generated-edge-m5-continuous-rays/1',
  sourceRevision:revision,componentIds:solids.map(s=>s.id),
  actualNativeBooleanOperation:operation,
  generatedNativeResultEdgeCount:seen.size,
  counts,rows,globalPaperEvents,
  originalNativeSourceM4FullPaperGraphRecomputed:true,
  generatedEdgeContinuousM5SubspansRecomputed:operation==='union',
  strictSubtractiveBooleanContinuousM5VisibilityProven:false,
  realOCCTGeneratedEdgeHistoryWasRecomputedByThisFunction:false,
  currentNativeReported3DAndM0SourceCrossChecked:true,
  allNativeResultEdgeEndpointIsSameJunctionsReconciled:true,
  authenticatedNativeResultVertexCount:vertexByOrdinal.size,
  allFirstAngleWholeOriginalGeneratedEdgeRaysAudited:operation==='union',
  completeBooleanBoundaryAndPaperJunctionsCertified:false,
  officialEngineeringLineStylesCertified:false,
  ConstructionIntentAuthorized:false,signedV5ActionCount:0
 });
}
module.exports={originalBoxGeometry,auditC2OcctGeneratedEdgeUnionRays};
