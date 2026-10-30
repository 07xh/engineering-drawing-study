'use strict';
/**
 * Reusable C1 computation consumer of the REAL OpenCascade.js WASM HLR engine.
 * Scope: reviewed M0-proven closed convex polyhedral mesh, including
 * variable cuboids, tetrahedra and other planar-faced solids. NOT C2 Boolean.
 *
 * No second M0-M5/V5. This engine computes the visible B-Rep projected segments;
 * IDs are merely paper-collinear CANDIDATES until existing M5 proves unique
 * 3D source, endpoints and continuous visibility. Nothing here signs line style.
 *
 * Dependency inversion: the caller injects a pinned, independently initialized
 * OCJS instance, so no 50-MB WASM or node/fs import enters the normal bundle.
 */
const {VIEWS,project,FIRST_ANGLE_OBSERVER_RAYS}=
 require('../../../core/projection/conventions.js');
const {verifiedConvexMeshHalfspaces}=
 require('../../../core/geometry/verified-convex-mesh-halfspaces.cjs');
const {readRealOcjsSharpHLREdge}=
 require('./c1-ocjs-raw-hlr-edges.cjs');
const {auditC1RoundedInversePaperBoundaryAlias}=
 require('../../../workbench/c1-rounded-inverse-paper-boundary-alias.cjs');
const {auditC1ScopedHLRGeneratedEdgeMatch,auditC1ScopedHLRSourceIdentityConflicts}=
 require('./c1-ocjs-scoped-source-matcher.cjs');
const {computeC1NativeHLRIsSameVertexGraph}=
 require('./c1-ocjs-native-vertex-issame-graph.cjs');
const {auditC1OriginalBRepVertexTShapeTopology}=
 require('./c1-ocjs-original-source-vertex-topology.cjs');
const {auditC1OriginalBRepFaceEdgeAdjacency}=
 require('./c1-ocjs-original-source-face-adjacency.cjs');
const {auditC1Native3DSourceScopedIntervals}=
 require('../../../workbench/c1-native-source-scoped-3d-parameter-coverage.cjs');
const finite=Number.isFinite;
const {verifyOcjsHLRProjectedLineCurveWitness}=
 require('./c1-ocjs-output-curve-witness.cjs');
function cuboidBounds(g){
 if(!g||g.kind!=='mesh'||g.space!=='model-3d'||g.unit!=='mm'||
   !g.data||!g.id||!Array.isArray(g.data.edges)||!Array.isArray(g.data.faces))
  throw new TypeError('real reviewed model-mm mesh required');
 const pts=g.data.points;
 if(!pts||Object.keys(pts).length!==8||g.data.edges.length!==12||
    g.data.faces.length!==6)throw new RangeError('only complete cuboids supported by OCJS C1');
 const axes=['x','y','z'], bounds={};
 for(const a of axes){
  const values=[...new Set(Object.values(pts).map(p=>p?.[a]))].sort((x,y)=>x-y);
  if(values.length!==2||values.some(x=>!finite(x)||Math.abs(x)>1e5)||
     values[1]-values[0]<=1e-7)
   throw new RangeError('strict finite nondegenerate axis-aligned cuboid required');
  bounds[a]=values;
 }
 const seen=new Set();
 for(const p of Object.values(pts)){
  if(!p||Object.keys(p).sort().join(',')!=='x,y,z'||
     axes.some(a=>!bounds[a].includes(p[a])))
   throw new RangeError('noncuboid source XYZ');
  seen.add(axes.map(a=>p[a]===bounds[a][0]?'0':'1').join(''));
 }
 if(seen.size!==8)throw new RangeError('all eight physical box corners required');
 const edgeKeys=new Set();
 for(const e of g.data.edges){
  if(!Array.isArray(e)||e.length!==2||e[0]===e[1]||
    !Object.hasOwn(pts,e[0])||!Object.hasOwn(pts,e[1]))
   throw new RangeError('invalid original solid edge');
  const a=pts[e[0]],b=pts[e[1]];
  if(axes.filter(k=>a[k]!==b[k]).length!==1)
   throw new RangeError('original cuboid edges must join axis-adjacent corners');
  edgeKeys.add([...e].sort().join('|'));
 }
 if(edgeKeys.size!==12)throw new RangeError('duplicate original cuboid edge');
 const faceKeys=new Set();
 for(const f of g.data.faces){
  if(!Array.isArray(f)||f.length!==4||new Set(f).size!==4||
    f.some(id=>!Object.hasOwn(pts,id)))
   throw new RangeError('all six authentic quadrilateral box faces required');
  const same=axes.filter(k=>new Set(f.map(id=>pts[id][k])).size===1);
  if(same.length!==1)throw new RangeError('box face must be planar axis boundary');
  const face=same[0]+':'+pts[f[0]][same[0]];
  faceKeys.add(face);
  for(let i=0;i<4;i++)
   if(!edgeKeys.has([f[i],f[(i+1)%4]].sort().join('|')))
    throw new RangeError('original face has nonexistent adjacent source edge');
 }
 if(faceKeys.size!==6)throw new RangeError('duplicated/missing box face');
 return bounds;
}
function method(owner,key){
 const fn=owner?.[key];
 if(typeof fn!=='function')
  throw new TypeError('pinned OpenCascade.js HLR API missing '+key+
    ' (available: '+Object.keys(owner??{}).filter(k=>
     /Pnt|Vertex|Edge|TopAbs/.test(k)).slice(0,22).join(',')+')');
 return fn;
}
function closeToSegment(p,a,b,tol=1e-6){
 const ux=b.u-a.u,uy=b.v-a.v,len2=ux*ux+uy*uy;
 if(len2<1e-15)return false;
 const cross=ux*(p.v-a.v)-uy*(p.u-a.u);
 const t=((p.u-a.u)*ux+(p.v-a.v)*uy)/len2;
 return Math.abs(cross)<=tol*Math.sqrt(len2)&&t>=-tol&&t<=1+tol;
}
function provenanceCandidates(g,view,from,to){
 const src=[];
 for(const edge of g.data.edges){
  const a=project(g.data.points[edge[0]])[view];
  const b=project(g.data.points[edge[1]])[view];
  if(closeToSegment(from,a,b)&&closeToSegment(to,a,b))
   src.push(g.id+'::'+[...edge].sort().join('|'));
 }
 return src.sort();
}

/**
 * Lift ACTUAL projected HLR endpoints back onto every compatible ORIGINAL
 * M0 edge. These are per-source 3D CANDIDATES, not OCCT TopoDS identities:
 * two edges at different depths can have precisely the same V/H/W image.
 * Reprojection is checked independently of the initial collinearity test.
 * This intentionally does not certify a 3D B-Rep curve, M5 style or V5.
 */
function liftOriginalProjectedSourceCandidates(g,view,from,to){
 if(!VIEWS.includes(view)||![from?.u,from?.v,to?.u,to?.v].every(finite))
  throw new TypeError('finite actual HLR V/H/W projected endpoints required');
 // A projected point is not a B-Rep line, even when it lies on several
 // original edges. Never assign it a 3D source identity.
 // Positive real HLR fragments must reach the original M0 source lift even
 // when their paper length is below the old 1e-8 mm cutoff. The resulting
 // inverse parameter may round to zero; the independent exact boundary
 // alias witness below still holds such candidates without M5/V5 authority.
 const degenerate=from.u===to.u&&from.v===to.v;
 const paperCollinearIds=degenerate?[]:provenanceCandidates(g,view,from,to);
 const rejectedOutsideOriginalSource=[];
 const sourceCandidate3DLifts=[];
 for(const sourceEdgeId of paperCollinearIds){
  const edge=g.data.edges.find(e=>
   g.id+'::'+[...e].sort().join('|')===sourceEdgeId);
  if(!edge)throw new RangeError('original 3D source edge missing');
  const a=g.data.points[edge[0]],b=g.data.points[edge[1]];
  const pa=project(a)[view],pb=project(b)[view];
  const du=pb.u-pa.u,dv=pb.v-pa.v,den=du*du+dv*dv;
  if(!(den>1e-15)||!finite(den))
   throw new RangeError('projected original source edge collapsed');
  const fraction=q=>((q.u-pa.u)*du+(q.v-pa.v)*dv)/den;
  const ta=fraction(from),tb=fraction(to);
  // Paper collinearity uses an OCCT display tolerance. It must never
  // become exact original TopoDS parameter coverage: even a one-ULP
  // overrun (or negative subnormal underflow) is positive geometry.
  // Preserve genuine OCCT display candidates, but expose a separate
  // explicit rounding flag that independent M5 source proofs must gate.
  const within=(q)=>q.u>=Math.min(pa.u,pb.u)&&q.u<=Math.max(pa.u,pb.u)&&
   q.v>=Math.min(pa.v,pb.v)&&q.v<=Math.max(pa.v,pb.v);
  if(![ta,tb].every(finite)||ta<-1e-6||ta>1+1e-6||
     tb<-1e-6||tb>1+1e-6)
   throw new RangeError('HLR endpoint lies outside original source edge');
  const outsideOriginal=!(within(from)&&within(to))||
   ta<0||ta>1||tb<0||tb>1;
  if(outsideOriginal)rejectedOutsideOriginalSource.push(sourceEdgeId);
  // The inverse can ALSO round an interior received paper coordinate to
  // exactly t=0/1 without any out-of-domain point or explicit clamp.
  // Keep its 3D display lift, but hold it as paper-rounded evidence.
  const clamp=t=>Math.max(0,Math.min(1,t));
  const t0=clamp(ta),t1=clamp(tb);
  const roundedBoundary=auditC1RoundedInversePaperBoundaryAlias({
   sourceFrom:pa,sourceTo:pb,measuredFrom:from,measuredTo:to,
   roundedInverseParameters:[t0,t1]
  });
  const paperRounded=outsideOriginal||
   roundedBoundary.anyRoundedInverseBoundaryAlias;
  const point=t=>({x:a.x+(b.x-a.x)*t,
   y:a.y+(b.y-a.y)*t,z:a.z+(b.z-a.z)*t});
  const fromCandidate3D=point(t0),toCandidate3D=point(t1);
  const pf=project(fromCandidate3D)[view],
   pt=project(toCandidate3D)[view];
  if(Math.hypot(pf.u-from.u,pf.v-from.v)>1e-6||
     Math.hypot(pt.u-to.u,pt.v-to.v)>1e-6)
   throw new RangeError('original 3D source candidate fails HLR reprojection');
  sourceCandidate3DLifts.push({
   sourceEdgeId,originalVertexIds:[...edge],
   sourceParameterAtProjectedFrom:t0,sourceParameterAtProjectedTo:t1,
   originalSourceParameterRange:[Math.min(t0,t1),Math.max(t0,t1)],
   paperOnlyUnclampedOriginalSourceParameters:[ta,tb],
   sourceParameterWasClampedForPaperOnly:paperRounded,
   sourceParameterWasRoundedAtOriginalBoundaryForPaperOnly:
    roundedBoundary.anyRoundedInverseBoundaryAlias,
   exactBinary64RoundedInverseBoundaryWitness:roundedBoundary,
   originalSourceExactParameterCoverageFromRoundingProven:false,
   fromCandidate3D,toCandidate3D,
   originalSourceCurveType:'straight-m0-polyhedral-edge',
   originalXYZReprojectsToHLR:true,
   actualOCCTTopoDSEdgeIdentityRecovered:false,
   actualOCCT3DCurveExtracted:false,
   officialEngineeringLineStyle:'undetermined',v5Authorized:false
  });
 }
 const ids=sourceCandidate3DLifts.map(w=>w.sourceEdgeId);
 return {
  projectedOriginalEdgeCandidates:ids,sourceCandidate3DLifts,
  // These are explicitly REJECTED candidates, never source identities.
  paperCollinearSourcesRoundedOutsideOriginalBounds:rejectedOutsideOriginalSource,
  unmappedReason:ids.length?null:degenerate?
   'degenerate-projected-hlr-not-a-physical-segment':
   'no-original-m0-edge-reprojects-to-both-hlr-endpoints',
  candidate3DGeometryOnly:true,actualOCCTTopoDSIdentityRecovered:false,
  officialEngineeringLineStyle:'undetermined',v5Authorized:false
 };
}

/**
 * Correlate one real ORIGINAL OCCT source B-Rep edge with an M0 source edge
 * using its measured 3D OCCT vertex coordinates, NEVER a paper projection.
 * Source identity is unique only within the original input shape. This does
 * NOT establish which original TopoDS edge generated a particular HLR edge.
 */
function matchOriginalBRepEdgeByXYZ(geometry,occtFrom,occtTo){
 const valid=p=>p&&['x','y','z'].every(k=>Number.isFinite(p[k]));
 if(!valid(occtFrom)||!valid(occtTo))
  throw new TypeError('finite measured OCCT 3D edge endpoints required');
 const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
 if(distance(occtFrom,occtTo)<=1e-8)
  throw new RangeError('OCCT original 3D source edge has collapsed endpoints');
 const matches=[];
 for(const vertices of geometry.data.edges){
  const [a,b]=vertices,from=geometry.data.points[a],
   to=geometry.data.points[b];
  if(!valid(from)||!valid(to))throw new RangeError('invalid M0 source XYZ');
  const direct=distance(occtFrom,from)<=1e-6&&
   distance(occtTo,to)<=1e-6;
  const reverse=distance(occtFrom,to)<=1e-6&&
   distance(occtTo,from)<=1e-6;
  if(direct||reverse)matches.push({
   sourceEdgeId:geometry.id+'::'+[...vertices].sort().join('|'),
   originalVertexIds:[...vertices],occtEdgeOrientation:direct?'forward':'reverse',
   fromOCCT3D:{...occtFrom},toOCCT3D:{...occtTo},
   originalOCCTBRepVertexXYZMatched:true,
   occtCurveTypeIndependentlyVerified:false,
   generatedHLREdgeTopoDSIdentityMatched:false,
   engineeringLineStyle:'undetermined',v5Authorized:false
  });
 }
 if(matches.length!==1)
  throw new RangeError('original OCCT source B-Rep 3D endpoint match '+matches.length+
   ' (missing or ambiguous M0 physical source)');
 return matches[0];
}

/**
 * Independent geometric check of an actual OCCT BRepAdaptor 3D LINE.
 * Reject finite but wrong curve samples and parametric midpoint drift.
 * A straight 3D source curve does not prove HLR source topology or line style.
 */
function verifyOriginalOcctLinearCurveWitness({
 sourceEndpoints,parameterRange,curveSamples,curveKind,
 requireUnitSpeedOCCTLineParameterization=false
}={}){
 const finite3=p=>p&&['x','y','z'].every(k=>Number.isFinite(p[k]));
 if(curveKind!=='line'||!Array.isArray(sourceEndpoints)||
    sourceEndpoints.length!==2||!sourceEndpoints.every(finite3)||
    !Array.isArray(parameterRange)||parameterRange.length!==2||
    !parameterRange.every(Number.isFinite)||
    !(parameterRange[1]>parameterRange[0])||
    !Array.isArray(curveSamples)||curveSamples.length!==3||
    !curveSamples.every(finite3))
  throw new TypeError('finite OCCT 3D line curve and parameter witness required');
 const d=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
 const [a,b]=sourceEndpoints,[first,middle,last]=curveSamples;
 const direct=d(a,first)<=1e-6&&d(b,last)<=1e-6;
 const reverse=d(a,last)<=1e-6&&d(b,first)<=1e-6;
 const physicalLengthMm=d(a,b);
 const parameterSpan=parameterRange[1]-parameterRange[0];
 // Geom_Line uses a unit direction: BRepAdaptor_Curve's parameter
 // difference is physical distance in mm, even for a trimmed edge.
 // A 3D endpoint/midpoint match alone cannot authenticate a forged
 // parameter interval used later to map native HLR to M0/M5 [0,1].
 if(requireUnitSpeedOCCTLineParameterization&&
    (!Number.isFinite(physicalLengthMm)||!Number.isFinite(parameterSpan)||
    !(parameterSpan>0)||
    Math.abs(parameterSpan-physicalLengthMm)>
     1e-6*Math.max(1,physicalLengthMm)))
  throw new RangeError('OCCT BRep line parameter span disagrees with original physical 3D length');
 if(!direct&&!reverse||physicalLengthMm<=1e-8)
  throw new RangeError('OCCT BRep curve endpoints disagree with original 3D topology');
 const affineMid={x:(a.x+b.x)/2,y:(a.y+b.y)/2,z:(a.z+b.z)/2};
 if(d(middle,affineMid)>1e-6)
  throw new RangeError('OCCT BRep reported line with nonaffine middle geometry');
 return {
  occtSourceCurveType:'line',
  occtSourceCurveParameterRange:[...parameterRange],
  occtSourceCurve3DEndpointsAndMidpointVerified:true,
  occtCurveTypeIndependentlyVerified:true,
  generatedHLREdgeTopoDSIdentityMatched:false,
  engineeringLineStyle:'undetermined',v5Authorized:false
 };
}
/**
 * Traverse actual OCJS ORIGINAL shape TopoDS edges, not HLR's flattened
 * visible output. Return an auditable complete source edge ledger. It is
 * only a corroboration for independently M0-reviewed source identity.
 */
/**
 * Compare ACTUAL native HLR edge TShapes against the ACTUAL original BRep
 * source-edge TShapes before Emscripten handles are destroyed.
 *
 * IsSame positively establishes shared TShape+Location (ignoring orientation)
 * when true. A normal HLR-created edge can have no IsSame source match:
 * paper coincidence must NEVER be substituted for generated-edge history.
 */
function probeRealOcctHLREdgeDirectOriginalSourceIdentity({
 generatedEdge,originalSourceEdges
}={}){
 if(typeof generatedEdge?.IsSame!=='function'||
    generatedEdge.IsNull?.()===true||
    generatedEdge.IsSame(generatedEdge)!==true||
    !Array.isArray(originalSourceEdges)||!originalSourceEdges.length||
    originalSourceEdges.length>512)
  throw new TypeError('actual OCCT generated and original native TopoDS edges required');
 const ids=new Set(),visited=new Set(),partnerIds=new Set();
 // This direct probe can be called independently of the HLR EdgeMap audit.
 // Repeated explorer occurrences must not silently relabel a different
 // physical TShape with an already accepted original M0 source ID.
 const originalHandleBySourceId=new Map();
 let partnerRelationSupported=typeof generatedEdge.IsPartner==='function';
 let partnerRelationComparisons=0,partnerOccurrences=0;
 if(partnerRelationSupported&&generatedEdge.IsPartner(generatedEdge)!==true)
  throw new RangeError('nonreflexive generated native TopoDS IsPartner');
 for(const item of originalSourceEdges){
  if(typeof item?.sourceEdgeId!=='string'||!item.sourceEdgeId||
     typeof item.edge?.IsSame!=='function')
   throw new TypeError('untrusted original native TopoDS source edge');
  if(item.edge.IsNull?.()===true||item.edge.IsSame(item.edge)!==true)
   throw new RangeError('nonreflexive or null original native TopoDS source edge');
  const prior=originalHandleBySourceId.get(item.sourceEdgeId);
  if(prior){
   const forward=item.edge.IsSame(prior),backward=prior.IsSame(item.edge);
   if(typeof forward!=='boolean'||typeof backward!=='boolean'||
      forward!==backward||forward!==true)
    throw new RangeError('duplicate original source ID aliases distinct native TopoDS edges');
  }else{
   // A different M0 source ID cannot alias the same native original edge,
   // even when the generated HLR edge matches neither source.
   for(const other of originalHandleBySourceId.values()){
    const f=item.edge.IsSame(other),b=other.IsSame(item.edge);
    if(typeof f!=='boolean'||typeof b!=='boolean'||f!==b)
     throw new RangeError('asymmetric original native TopoDS source ledger IsSame');
    if(f)throw new RangeError('multiple different original physical edges share native TopoDS identity');
   }
   originalHandleBySourceId.set(item.sourceEdgeId,item.edge);
  }
  const forward=generatedEdge.IsSame(item.edge),backward=item.edge.IsSame(generatedEdge);
  if(typeof forward!=='boolean'||typeof backward!=='boolean'||forward!==backward)
   throw new RangeError('asymmetric or nonboolean actual OCCT TopoDS IsSame proof');
  const hasPartner=typeof generatedEdge.IsPartner==='function'&&
   typeof item.edge.IsPartner==='function';
  if(!hasPartner)partnerRelationSupported=false;
  else{
   if(item.edge.IsPartner(item.edge)!==true)
    throw new RangeError('nonreflexive original native TopoDS IsPartner');
   const pf=generatedEdge.IsPartner(item.edge),pr=item.edge.IsPartner(generatedEdge);
   if(typeof pf!=='boolean'||typeof pr!=='boolean'||pf!==pr)
    throw new RangeError('asymmetric or nonboolean actual OCCT TopoDS IsPartner proof');
   partnerRelationComparisons++;
   if(forward&&!pf)throw new RangeError('OCCT IsSame edge relation contradicts IsPartner');
   if(pf){partnerOccurrences++;partnerIds.add(item.sourceEdgeId);}
  }
  visited.add(item.sourceEdgeId);
  if(forward)ids.add(item.sourceEdgeId);
 }
 if(ids.size>1)
  throw new RangeError('generated HLR TopoDS edge IsSame to multiple different original physical edges');
 const partnerSources=partnerRelationSupported?[...partnerIds].sort():[];
 return {
  actualOCCTGeneratedEdgeDirectOriginalBRepIsSameCompared:true,
  originalPhysicalOCCTSourceIdsCompared:[...visited].sort(),
  actualOriginalOCCTBRepEdgeOccurrencesCompared:originalSourceEdges.length,
  actualDistinctOriginalOCCTBRepSourceCount:visited.size,
  directlySameOriginalOCCTBRepSourceEdgeIds:[...ids].sort(),
  directlySameUniqueOriginalOCCTBRepSourceEdgeId:ids.size===1?[...ids][0]:null,
  actualOCCTGeneratedEdgeDirectOriginalBRepIsSameProven:ids.size===1,
  actualOCCTGeneratedEdgePartnerOriginalBRepIsPartnerCompared:partnerRelationSupported,
  originalNativeTopoDSEdgePartnerRelationComparisons:partnerRelationComparisons,
  originalNativeTopoDSEdgePartnerOccurrencesCompared:partnerOccurrences,
  originalPhysicalOCCTPartnerSourceEdgeIds:partnerSources,
  partnerUniqueOriginalOCCTBRepSourceEdgeId:partnerSources.length===1?partnerSources[0]:null,
  actualOCCTGeneratedEdgeTShapePartnerOriginalBRepCandidateCount:partnerSources.length,
  actualOCCTGeneratedEdgeTShapePartnerOriginalBRepCandidateAmbiguous:partnerSources.length>1,
  actualOCCTGeneratedEdgeTShapePartnerOriginalBRepCandidateOnly:partnerSources.length===1&&ids.size===0,
  partnerOriginalBRepTShapeRelationDoesNotProveLocationParameterOrHistory:true,
  completeOCCTGeneratedEdgeToOriginalTopoDSHistoryCertified:false,
  wholeSceneEngineeringLineStyleCertified:false,signedV5Action:false
 };}
/**
 * Inspect the real HLRBRep_Data EdgeMap (1-based OCCT source index), not
 * the generated HLR VCompound. This proves only which ORIGINAL TopoDS
 * edges the internal HLR data structure knows. It does NOT identify a
 * generated/split HLR edge or close any M5 source-parameter gap.
 */
function probeRealOcctHLRDataStructureSourceEdgeMap({
 edgeMap,originalSourceEdges
}={}){
 if(typeof edgeMap?.Extent!=='function'||
    typeof edgeMap?.FindKey!=='function'||
    !Array.isArray(originalSourceEdges)||!originalSourceEdges.length||
    originalSourceEdges.length>512)
  throw new TypeError('real indexed OCCT HLR DataStructure EdgeMap required');
 const sourceById=new Map();
 for(const item of originalSourceEdges){
  if(typeof item?.sourceEdgeId!=='string'||!item.sourceEdgeId||
     typeof item.edge?.IsSame!=='function')
   throw new RangeError('duplicate or unbound original TopoDS source ledger');
  const prior=sourceById.get(item.sourceEdgeId);
  if(prior){
   // TopExp explorers can expose repeated occurrences of the SAME physical
   // source edge. Collapse only when native IsSame is symmetric and true.
   const forward=item.edge.IsSame(prior.edge),backward=prior.edge.IsSame(item.edge);
   if(typeof forward!=='boolean'||typeof backward!=='boolean'||
      forward!==backward||forward!==true)
    throw new RangeError('duplicate or unbound original TopoDS source ledger');
  }else sourceById.set(item.sourceEdgeId,item);
 }
 const uniqueSourceEdges=[...sourceById.values()];
 // A source ID is a physical TopoDS identity, not a display label.
 // Verify injectivity across the COMPLETE original ledger before reading
 // any HLR index. Otherwise two different M0 edges could share one TShape
 // and a partial/unknown EdgeMap would conceal the source contradiction.
 for(let i=0;i<uniqueSourceEdges.length;i++){
  const current=uniqueSourceEdges[i].edge;
  if(current.IsNull?.()===true||current.IsSame(current)!==true)
   throw new RangeError('nonreflexive or null original TopoDS source edge');
  for(let j=0;j<i;j++){
   const previous=uniqueSourceEdges[j].edge;
   const forward=current.IsSame(previous),reverse=previous.IsSame(current);
   if(typeof forward!=='boolean'||typeof reverse!=='boolean'||
      forward!==reverse)
    throw new RangeError('asymmetric original TopoDS source ledger IsSame');
   if(forward)
    throw new RangeError('distinct original source IDs alias one native TopoDS edge');
  }
 }
 const extent=edgeMap.Extent();
 if(!Number.isSafeInteger(extent)||extent<1||extent>512)
  throw new RangeError('bounded native HLR original edge map extent required');
 const indexed=[],seen=new Set(),originalIds=new Set(sourceById.keys());
 for(let i=1;i<=extent;i++){
  // FindKey returns a borrowed reference into OCCT's indexed map.
  // Deleting it would corrupt the owning HLR DataStructure.
  const edge=edgeMap.FindKey(i);
  const proof=probeRealOcctHLREdgeDirectOriginalSourceIdentity({
   generatedEdge:edge,originalSourceEdges:uniqueSourceEdges
  });
  const id=proof.directlySameUniqueOriginalOCCTBRepSourceEdgeId;
  if(id!==null){
   if(seen.has(id))
    throw new RangeError('HLR internal EdgeMap duplicates one original M0 physical source');
   seen.add(id);
  }
  indexed.push({hlrDataStructureOneBasedEdgeIndex:i,
   originalPhysicalSourceEdgeId:id,
   directlySameOriginalTopoDSInputEdge:id!==null,
   originalPhysicalSourceTShapePartnerCandidateIds:
    proof.originalPhysicalOCCTPartnerSourceEdgeIds,
   originalPhysicalSourceTShapePartnerCandidateOnly:
    proof.actualOCCTGeneratedEdgeTShapePartnerOriginalBRepCandidateOnly,
   generatedHLREdgeToOriginalTopoDSHistoryProven:false,
   signedV5Action:false});
 }
 return {
  scope:'native-hlr-internal-original-source-index-only',
  internalEdgeMapExtent:extent,
  originalSourceIdsInInputBRep:originalIds.size,
  originalSourceEdgeOccurrenceCount:originalSourceEdges.length,
  uniqueOriginalSourceEdgeCount:uniqueSourceEdges.length,
  sourceLedgerDistinctNativeTopoDSIdentityVerified:true,
  internalEdgeMapOriginalSourceIdsMatched:seen.size,
  everyOriginalBRepSourcePresentInHLRDataStructure:
   seen.size===originalIds.size,
  edgeMapSourceBijectionVerified:extent===originalIds.size&&
   indexed.length===originalIds.size&&
   indexed.every(row=>row.directlySameOriginalTopoDSInputEdge===true)&&
   seen.size===originalIds.size,
  edgeMapSourceBijectionFailureReasons:[
   ...(extent!==originalIds.size?['edge-map extent differs from original source inventory']:[]),
   ...(indexed.some(row=>row.directlySameOriginalTopoDSInputEdge!==true)?
     ['one or more native index entries have no unique original TopoDS identity']:[]),
   ...(seen.size!==originalIds.size?['one or more original source edges are absent or duplicated']:[])
  ],
  indexedOriginalSources:indexed,
  generatedHLREdgeToOriginalTopoDSHistoryProven:false,
  continuousM5VisibilityProven:false,
  officialEngineeringLineStyleCertified:false,signedV5Action:false
 };
}
/**
 * Compare genuine generated HLR TopoDS VERTICES with ORIGINAL BRep vertex
 * handles before their OCCT lifetime ends. IsSame proves a direct TShape
 * identity, not HLR-generated EDGE history or engineering line style.
 * Exact current M0 XYZ and first-angle paper projection are also required.
 */
function probeRealOcctHLRVertexDirectOriginalSourceIdentity({
 generatedVertex,originalSourceVertices,view,nativePaperPoint,geometry
}={}){
 if(!geometry?.data?.points||!VIEWS.includes(view)||!Number.isFinite(nativePaperPoint?.u)||
    !Number.isFinite(nativePaperPoint?.v)||typeof generatedVertex?.IsSame!=='function'||
    generatedVertex.IsNull?.()===true||generatedVertex.IsSame(generatedVertex)!==true||
    !Array.isArray(originalSourceVertices)||!originalSourceVertices.length||
    originalSourceVertices.length>1024)
  throw new TypeError('actual OCCT HLR vertex and bounded original TopoDS vertex ledger required');
 const sameIds=new Set(),partnerIds=new Set();
 // Validate the entire original vertex ledger, not only matches to this
 // generated HLR vertex. Repeated explorer occurrences must retain identity.
 const originalHandleByVertexId=new Map();
 let sameUnbound=0,paperMismatch=0,direct=0;
 let partnerRelationSupported=typeof generatedVertex.IsPartner==='function';
 let partnerRelationComparisons=0,partnerOccurrences=0,partnerUnbound=0,partnerPaperMismatch=0;
 if(partnerRelationSupported&&generatedVertex.IsPartner(generatedVertex)!==true)
  throw new RangeError('nonreflexive generated native TopoDS vertex IsPartner');
 for(const item of originalSourceVertices){
  const original=item?.vertex;
  if(typeof original?.IsSame!=='function'||original.IsNull?.()===true||
     original.IsSame(original)!==true)
   throw new TypeError('invalid original native TopoDS vertex');
  if(item.sourceVertexId!==null){
   const id=item.sourceVertexId,xyz=item.originalModelXYZ,
    model=geometry.data.points[id];
   if(typeof id!=='string'||!id||!xyz||!model||
      !['x','y','z'].every(k=>Number.isFinite(xyz[k])&&xyz[k]===model[k]))
    throw new RangeError('unbound original M0 vertex identity in native ledger');
   const prior=originalHandleByVertexId.get(id);
   if(prior){
    const f=original.IsSame(prior),b=prior.IsSame(original);
    if(typeof f!=='boolean'||typeof b!=='boolean'||f!==b||!f)
     throw new RangeError('duplicate original M0 vertex ID aliases distinct native TopoDS vertices');
   }else{
    for(const other of originalHandleByVertexId.values()){
     const f=original.IsSame(other),b=other.IsSame(original);
     if(typeof f!=='boolean'||typeof b!=='boolean'||f!==b)
      throw new RangeError('asymmetric original native TopoDS vertex ledger IsSame');
     if(f)throw new RangeError('one generated TopoDS vertex matches conflicting original M0 vertices');
    }
    originalHandleByVertexId.set(id,original);
   }
  }
  const forward=generatedVertex.IsSame(original),reverse=original.IsSame(generatedVertex);
  if(typeof forward!=='boolean'||typeof reverse!=='boolean'||forward!==reverse)
   throw new RangeError('asymmetric original/generated TopoDS vertex IsSame');
  const hasPartner=typeof generatedVertex.IsPartner==='function'&&
   typeof original.IsPartner==='function';
  if(!hasPartner)partnerRelationSupported=false;
  else{
   if(original.IsPartner(original)!==true)
    throw new RangeError('nonreflexive original native TopoDS vertex IsPartner');
   const pf=generatedVertex.IsPartner(original),pr=original.IsPartner(generatedVertex);
   if(typeof pf!=='boolean'||typeof pr!=='boolean'||pf!==pr)
    throw new RangeError('asymmetric original/generated TopoDS vertex IsPartner');
   partnerRelationComparisons++;
   if(forward&&!pf)throw new RangeError('OCCT vertex IsSame relation contradicts IsPartner');
   if(pf){
    partnerOccurrences++;
    if(item.sourceVertexId===null)partnerUnbound++;
    else{
     const xyz=item.originalModelXYZ,model=geometry.data.points[item.sourceVertexId];
     if(typeof item.sourceVertexId!=='string'||!item.sourceVertexId||!xyz||!model||
        !['x','y','z'].every(k=>Number.isFinite(xyz[k])&&xyz[k]===model[k]))
      throw new RangeError('unbound original M0 vertex identity in native partner ledger');
     const paper=project(xyz)[view];
     if(paper.u!==nativePaperPoint.u||paper.v!==nativePaperPoint.v)partnerPaperMismatch++;
     else partnerIds.add(item.sourceVertexId);
    }
   }
  }
  if(!forward)continue;
  direct++;
  if(item.sourceVertexId===null){sameUnbound++;continue;}
  const xyz=item.originalModelXYZ,model=geometry.data.points[item.sourceVertexId];
  if(typeof item.sourceVertexId!=='string'||!item.sourceVertexId||!xyz||!model||
     !['x','y','z'].every(k=>Number.isFinite(xyz[k])&&xyz[k]===model[k]))
   throw new RangeError('unbound original M0 vertex identity in native ledger');
  sameIds.add(item.sourceVertexId);
  const paper=project(xyz)[view];
  if(paper.u!==nativePaperPoint.u||paper.v!==nativePaperPoint.v)paperMismatch++;
 }
 if(sameIds.size>1)
  throw new RangeError('one generated TopoDS vertex matches conflicting original M0 vertices');
 const id=sameIds.size===1&&sameUnbound===0&&paperMismatch===0?[...sameIds][0]:null;
 const partnerCandidateIds=partnerRelationSupported&&partnerUnbound===0&&partnerPaperMismatch===0?
  [...partnerIds].sort():[];
 return {
  originalNativeTopoDSVertexOccurrencesCompared:originalSourceVertices.length,
  directOriginalTopoDSVertexIsSameOccurrenceCount:direct,
  directOriginalTopoDSVertexWithoutExactM0Binding:sameUnbound,
  directOriginalTopoDSVertexPaperMismatchCount:paperMismatch,
  directlySameOriginalM0VertexId:id,
  directOriginal3DVertexTopoDSIdentityProven:id!==null,
  actualOCCTGeneratedVertexPartnerOriginalBRepIsPartnerCompared:partnerRelationSupported,
  originalNativeTopoDSVertexPartnerRelationComparisons:partnerRelationComparisons,
  originalNativeTopoDSVertexPartnerOccurrencesCompared:partnerOccurrences,
  partnerOriginalTopoDSVertexUnboundOccurrenceCount:partnerUnbound,
  partnerOriginalTopoDSVertexPaperMismatchCount:partnerPaperMismatch,
  partnerOriginalM0VertexCandidateIds:partnerCandidateIds,
  partnerUniqueOriginalM0VertexCandidateId:partnerCandidateIds.length===1?partnerCandidateIds[0]:null,
  partnerOriginalM0VertexCandidateAmbiguous:partnerCandidateIds.length>1,
  partnerSourceCandidateDoesNotProveOriginal3DLocationOrTopoDSHistory:true,
  fullGeneratedHLREdgeToOriginalTopoDSHistoryProven:false,
  officialEngineeringLineStyle:'undetermined',signedV5Action:false
 };}
function extractRealOcjsOriginalSourceBRepEdges({
 oc,shape,geometry,kind,vertexType,avoid,newObj,hold,
 originalNativeEdgeHandles,originalNativeVertexHandles
}){
 const explorer=newObj('TopExp_Explorer_2',shape,kind,avoid);
 const matches=new Map();
 let occurrences=0;
 while(explorer.More()){
  if(++occurrences>512)throw new RangeError('excess OCCT source topology edges');
  const edge=hold(explorer.Current());
  const vertices=newObj('TopExp_Explorer_2',edge,vertexType,avoid);
  const coords=[],nativeVertices=[];
  while(vertices.More()){
   const node=hold(vertices.Current());
   const vertex=hold(method(oc.TopoDS,'Vertex_1')(node));
   nativeVertices.push(vertex);
   const point=hold(method(oc.BRep_Tool,'Pnt')(vertex));
   coords.push({x:point.X(),y:point.Y(),z:point.Z()});
   if(coords.length>2)
    throw new RangeError('original OCCT edge with non-segment source vertices');
   vertices.Next();
  }
  if(coords.length!==2)throw new RangeError('missing real original OCCT 3D vertices');
  const edgeType=hold(method(oc.TopoDS,'Edge_1')(edge));
  const adaptor=newObj('BRepAdaptor_Curve_2',edgeType);
  const kindLine=oc.GeomAbs_CurveType?.GeomAbs_Line??oc.GeomAbs_Line;
  if(kindLine===undefined||adaptor.GetType()!==kindLine||
     adaptor.Is3DCurve()!==true)
   throw new RangeError('original OCCT polyhedral source is not verified 3D line');
  const first=adaptor.FirstParameter(),last=adaptor.LastParameter();
  if(![first,last].every(finite)||!(last>first))
   throw new RangeError('nonfinite/nonincreasing OCCT source curve parameters');
  const readCurvePoint=t=>{
   const pt=hold(adaptor.Value(t));
   return {x:pt.X(),y:pt.Y(),z:pt.Z()};
  };
  const actualCurveSamples=[readCurvePoint(first),
   readCurvePoint((first+last)/2),readCurvePoint(last)];
  const curveProof=verifyOriginalOcctLinearCurveWitness({
   sourceEndpoints:coords,parameterRange:[first,last],
   curveSamples:actualCurveSamples,
   curveKind:'line',requireUnitSpeedOCCTLineParameterization:true
  });
  // Preserve REAL BRepAdaptor.Value(First/Last) model XYZ independently of
  // TopExp_Explorer vertex traversal. They may run in opposite directions.
  // This is original 3D curve evidence, never generated HLR edge history.
  const record={...matchOriginalBRepEdgeByXYZ(geometry,coords[0],coords[1]),
   ...curveProof,
   occtSourceCurveFirstPoint3D:{...actualCurveSamples[0]},
   occtSourceCurveLastPoint3D:{...actualCurveSamples[2]}};
  if(originalNativeEdgeHandles instanceof Array)
   originalNativeEdgeHandles.push({sourceEdgeId:record.sourceEdgeId,edge:edgeType});
  if(originalNativeVertexHandles instanceof Array){
   const [aId,bId]=record.originalVertexIds,
    a=geometry.data.points[aId],b=geometry.data.points[bId];
   const eq=(p,q)=>['x','y','z'].every(k=>p[k]===q[k]);
   for(let i=0;i<2;i++){
    const id=eq(coords[i],a)?aId:eq(coords[i],b)?bId:null;
    originalNativeVertexHandles.push({vertex:nativeVertices[i],
     sourceVertexId:id,
     originalModelXYZ:id===null?null:{...geometry.data.points[id]}});
   }
  }
  const prior=matches.get(record.sourceEdgeId);
  if(prior){
   const d=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
   const same=d(prior.fromOCCT3D,record.fromOCCT3D)<=1e-6&&
    d(prior.toOCCT3D,record.toOCCT3D)<=1e-6;
   const swapped=d(prior.fromOCCT3D,record.toOCCT3D)<=1e-6&&
    d(prior.toOCCT3D,record.fromOCCT3D)<=1e-6;
   if(!same&&!swapped||
      prior.occtSourceCurveType!==record.occtSourceCurveType||
      prior.occtSourceCurve3DEndpointsAndMidpointVerified!==true)
    throw new RangeError('duplicate conflicting original OCCT edge');
  }else matches.set(record.sourceEdgeId,record);
  explorer.Next();
 }
 if(matches.size!==geometry.data.edges.length)
  throw new RangeError('real original OCCT source topology incomplete: '+
   matches.size+'/'+geometry.data.edges.length);
 return {
  originalBRepSourceEdges:[...matches.values()].sort((a,b)=>
   a.sourceEdgeId.localeCompare(b.sourceEdgeId)),
  occtOriginalEdgeOccurrenceCount:occurrences,
  completeSourceTopology3DEndpointCorrespondence:true,
  generatedHLREdgeTopoDSIdentityMatched:false,
  actualOCCTCurveTypeIndependentlyVerified:true,
  engineeringLineStylesCertified:false,v5Authorized:false
 };
}
// HLRAlgo_Projector normal is the observer direction, not merely the
// 2D drawing-plane orientation. These MUST agree with the canonical
// first-angle rays; the flattened HLR Y coordinate is now +paper V.
// Reversing the normal to make paper V look correct silently reverses
// visible/hidden OCCT classes even though the 2D lines still overlap.
const ray=view=>['x','y','z'].map(k=>FIRST_ANGLE_OBSERVER_RAYS[view][k]);
const FRAME=Object.freeze({
 V:{normal:ray('V'),xdir:[1,0,0]},
 H:{normal:ray('H'),xdir:[1,0,0]},
 W:{normal:ray('W'),xdir:[0,1,0]}
});
/**
 * Every polygonal face is reconstructed from REVIEWED M0 mesh coordinates,
 * not a hardcoded answer. Sewed shell has no free or multiply-used CAD
 * edges; M0 independently proves its strict convex closed geometry.
 *
 * A shell suffices for HLR projection: it owns complete real OCCT faces
 * and their sewn shared topological edges, without relying on a separately
 * signed V5 action or an arbitrary triangulated renderer.
 */
function makeConvexOcjsShell({oc,geometry,newObj,hold}){
 const proof=verifiedConvexMeshHalfspaces(geometry);
 if(proof.status!=='validated-closed-convex-mesh'||
    proof.sourceGeometryId!==geometry.id||geometry.data.faces.length>64)
  throw new RangeError('independently M0-proven closed convex source required');
 const sewing=newObj('BRepBuilderAPI_Sewing',
  Math.min(1e-7,proof.toleranceMm),true,true,true,false);
 for(const faceIds of geometry.data.faces){
  const polygon=newObj('BRepBuilderAPI_MakePolygon_1');
  for(const id of faceIds){
   const p=geometry.data.points[id];
   // Added() indicates creation of the latest polygon EDGE; the first
   // vertex has no edge yet. The final closed Wire/Face and sewing are
   // the authoritative OCCT topology checks, not each intermediate flag.
   polygon.Add_1(newObj('gp_Pnt_3',p.x,p.y,p.z));
  }
  polygon.Close();
  const wire=hold(polygon.Wire());
  if(wire.IsNull())throw new RangeError('real polygon wire is null');
  const faceBuilder=newObj('BRepBuilderAPI_MakeFace_15',wire,true);
  const face=hold(faceBuilder.Face());
  if(!faceBuilder.IsDone()||face.IsNull())
   throw new RangeError('OCJS could not build source polygon face');
  sewing.Add(face);
 }
 // Message_ProgressRange is a normal OCCT algorithm call argument, not
 // an independent or fabricated processing model.
 sewing.Perform(newObj('Message_ProgressRange_1'));
 if(sewing.NbFreeEdges()!==0||sewing.NbMultipleEdges()!==0)
  throw new RangeError('real OCJS sewn convex shell has open or nonmanifold edges');
 const shell=hold(sewing.SewedShape());
 if(shell.IsNull())throw new RangeError('OCJS returned null sewn shell');
 return shell;
}
function computeC1OcjsVisibleSegments({oc,geometry,revision}={}){
 if(!Number.isSafeInteger(revision)||revision<1)
  throw new TypeError('current reviewed C1 revision required');
 // Closed convex meshes are independently proved at M0 before any CAD
 // call; cuboids reuse efficient OCCT primitive and other polyhedra use
 // genuine polygon-face sewing (not a second geometric inference path).
 verifiedConvexMeshHalfspaces(geometry);
 let b=null;
 try{b=cuboidBounds(geometry);}catch(_){ /* generic convex branch */ }
 const owned=[];
 const hold=obj=>{
  if(!obj||typeof obj.delete!=='function')
   throw new TypeError('unreleasable OCJS object');
  owned.push(obj);return obj;
 };
 const newObj=(key,...args)=>hold(new (method(oc,key))(...args));
 const enumValue=(name)=>oc.TopAbs_ShapeEnum?.[name]??oc[name];
 try{
  const kind=enumValue('TopAbs_EDGE'),vertexType=enumValue('TopAbs_VERTEX'),
   avoid=enumValue('TopAbs_SHAPE');
  if([kind,vertexType,avoid].some(x=>x===undefined))
   throw new TypeError('real OCJS TopAbs enum unavailable');
  let solid;
  if(b){
   const builder=newObj('BRepPrimAPI_MakeBox_4',
    newObj('gp_Pnt_3',b.x[0],b.y[0],b.z[0]),
    newObj('gp_Pnt_3',b.x[1],b.y[1],b.z[1]));
   solid=hold(builder.Shape());
   if(!builder.IsDone()||solid.IsNull())
    throw new RangeError('real OCJS B-Rep cuboid construction failed');
  }else{
   solid=makeConvexOcjsShell({oc,geometry,newObj,hold});
  }
  const originalNativeEdgeHandles=[],originalNativeVertexHandles=[];
  const sourceBRep=extractRealOcjsOriginalSourceBRepEdges({
   oc,shape:solid,geometry,kind,vertexType,avoid,newObj,hold,
   originalNativeEdgeHandles,originalNativeVertexHandles
  });
  if(originalNativeVertexHandles.length!==2*sourceBRep.occtOriginalEdgeOccurrenceCount)
   throw new RangeError('actual original TopoDS vertex occurrence inventory incomplete');
  if(originalNativeEdgeHandles.length!==sourceBRep.occtOriginalEdgeOccurrenceCount)
   throw new RangeError('native source OCCT TopoDS edge occurrence ledger incomplete');
  // ORIGINAL physical vertex TShapes are independently stable even when
  // OCCT HLR creates distinct projected TopoDS vertices at the same junction.
  const originalNativeVertexTopology=auditC1OriginalBRepVertexTShapeTopology({
   geometry,originalNativeVertexHandles
  });
  // Independently verify real sewn BRep face-edge incidence against the
  // reviewed M0 face boundaries. This is ORIGINAL 3D adjacency only;
  // generated HLR edges still need their own source/occlusion evidence.
  const faceKind=enumValue('TopAbs_FACE');
  if(faceKind===undefined)throw new TypeError('real OCJS TopAbs_FACE unavailable');
  const nativeFaceEdgeInventories=[];
  const faceExplorer=newObj('TopExp_Explorer_2',solid,faceKind,avoid);
  while(faceExplorer.More()){
   if(nativeFaceEdgeInventories.length>=64)
    throw new RangeError('too many native BRep faces');
   const face=hold(faceExplorer.Current());
   const faceEdges=newObj('TopExp_Explorer_2',face,kind,avoid),edges=[];
   while(faceEdges.More()){
    if(edges.length>=256)throw new RangeError('too many native BRep face edges');
    const edge=hold(faceEdges.Current());
    edges.push(hold(method(oc.TopoDS,'Edge_1')(edge)));
    faceEdges.Next();
   }
   nativeFaceEdgeInventories.push(edges);
   faceExplorer.Next();
  }
  const originalNativeFaceAdjacency=auditC1OriginalBRepFaceEdgeAdjacency({
   geometry,originalNativeEdgeHandles,nativeFaceEdgeInventories
  });
  const sourceById=new Map(sourceBRep.originalBRepSourceEdges.map(x=>
   [x.sourceEdgeId,x]));
  const rows={},hiddenViews={},hiddenSharpNullCompoundViews=[];
  const nativeGraphInput={},nativeHLRSourceHistoryAPISurfaceByView={},
   nativeSourceScopedSharpOutputByView={};
  // Read-only discovery of the actual pinned WASM HLR internal source-index
  // API. Do not call unknown methods, dereference native handles, or infer
  // generated->original TopoDS history from a method name alone.
  const nativeHLRSourceIndexMethodNames=obj=>{
   const names=new Set();
   for(let p=obj,depth=0;p&&depth<4;p=Object.getPrototypeOf(p),depth++)
    for(const key of Object.getOwnPropertyNames(p))
     if(/DataStructure|EdgeMap|Index|GetDS|SourceEdge|OriginalEdge/.test(key))
      names.add(key);
   return [...names].sort().slice(0,48);
  };
  for(const view of VIEWS){
   const f=FRAME[view];
   const axis=newObj('gp_Ax2_2',newObj('gp_Pnt_3',0,0,0),
     newObj('gp_Dir_4',...f.normal),newObj('gp_Dir_4',...f.xdir));
   const projector=newObj('HLRAlgo_Projector_2',axis);
   const algorithm=newObj('HLRBRep_Algo_1');
   algorithm.Add_2(solid,0);
   algorithm.Projector_1(projector);
   algorithm.Update();
   algorithm.Hide_1();
   const handle=newObj('Handle_HLRBRep_Algo_2',algorithm);
   if(handle.IsNull())throw new RangeError('null OCJS B-Rep HLR handle');
   const extractor=newObj('HLRBRep_HLRToShape',handle),
    visible=hold(extractor.VCompound_1());
   let originalDataStructureIndex={
    scope:'native-hlr-internal-original-source-index-only',
    availability:'DataStructure-not-exposed',
    generatedHLREdgeToOriginalTopoDSHistoryProven:false,
    signedV5Action:false
   };
   if(typeof algorithm.DataStructure==='function'){
    // Only the returned handle is an owned value. get(), EdgeMap() and
    // FindKey() expose borrowed OCCT objects: deleting them corrupts
    // the owning HLR algorithm's memory (verified in real WASM CI).
    const dsHandle=hold(algorithm.DataStructure());
    if(dsHandle.IsNull()===false&&typeof dsHandle.get==='function'){
     const ds=dsHandle.get();
     if(typeof ds.EdgeMap==='function'){
      const map=ds.EdgeMap();
      originalDataStructureIndex={
       ...probeRealOcctHLRDataStructureSourceEdgeMap({
        edgeMap:map,originalSourceEdges:originalNativeEdgeHandles
       }),availability:'real-native-edge-map-inspected'
      };
     }else originalDataStructureIndex.availability='EdgeMap-not-exposed';
    }else originalDataStructureIndex.availability='DataStructure-handle-null';
   }
   nativeHLRSourceHistoryAPISurfaceByView[view]={
    actualPinnedWasmObjectInspected:true,
    algorithmMethodNames:nativeHLRSourceIndexMethodNames(algorithm),
    algorithmHandleMethodNames:nativeHLRSourceIndexMethodNames(handle),
    extractorMethodNames:nativeHLRSourceIndexMethodNames(extractor),
    originalDataStructureIndex,
    generatedToOriginalTopoDSHistoryProven:false,
    officialLineStyleCertified:false,signedV5Action:false
   };
   if(visible.IsNull())throw new RangeError('no real OCJS visible HLR geometry');
   const withSourceCandidates=(measured,hlrClass,generatedNativeEdge)=>{
    const lifted=liftOriginalProjectedSourceCandidates(
     geometry,view,measured.from,measured.to);
    if(hlrClass==='visible-sharp'&&lifted.unmappedReason)
     throw new RangeError('real OCJS visible HLR source unmapped in '+
      view+': '+lifted.unmappedReason);
    const verifiedLifts=lifted.sourceCandidate3DLifts.map(lift=>{
     const actual=sourceById.get(lift.sourceEdgeId);
     if(!actual||actual.originalOCCTBRepVertexXYZMatched!==true||
        actual.occtSourceCurve3DEndpointsAndMidpointVerified!==true)
      throw new RangeError('real source 3D OCCT BRep curve missing for HLR candidate');
     return {...lift,actualOriginalOCCTBRepEdge3DEndpointsVerified:true,
      originalOCCTSourceCurveType:actual.occtSourceCurveType,
      originalOCCTCurveParameterRange:[...actual.occtSourceCurveParameterRange],
      originalOCCTSourceLineCurveVerified:
       actual.occtSourceCurve3DEndpointsAndMidpointVerified,
      actualOriginalOCCTBRepFrom3D:{...actual.fromOCCT3D},
      actualOriginalOCCTBRepTo3D:{...actual.toOCCT3D},
      actualOCCTHLREdgeToOriginalTopoDSIdentityMatched:false};
    });
    const direct=probeRealOcctHLREdgeDirectOriginalSourceIdentity({
     generatedEdge:generatedNativeEdge,originalSourceEdges:originalNativeEdgeHandles
    });
    if(direct.directlySameUniqueOriginalOCCTBRepSourceEdgeId!==null&&
       !lifted.projectedOriginalEdgeCandidates.includes(
        direct.directlySameUniqueOriginalOCCTBRepSourceEdgeId))
     throw new RangeError('actual OCCT native IsSame original edge disagrees with geometric M0 HLR source candidates');
    const partnerSourceIds=direct.actualOCCTGeneratedEdgePartnerOriginalBRepIsPartnerCompared?
     direct.originalPhysicalOCCTPartnerSourceEdgeIds:[];
    const partnerPaperSourceIds=partnerSourceIds.filter(id=>
     lifted.projectedOriginalEdgeCandidates.includes(id));
    const uniquePartnerPaperSourceId=partnerSourceIds.length===1&&partnerPaperSourceIds.length===1?
     partnerPaperSourceIds[0]:null;
    const liftsWithPartnerCandidates=verifiedLifts.map(lift=>({
     ...lift,
     originalBRepTShapePartnerSourceCandidate:uniquePartnerPaperSourceId===lift.sourceEdgeId,
     originalBRepTShapePartnerSourceCandidateOnly:
      uniquePartnerPaperSourceId===lift.sourceEdgeId&&
      direct.directlySameUniqueOriginalOCCTBRepSourceEdgeId===null,
     originalBRepTShapePartnerCandidateDoesNotProveSourceParameterOrHistory:true
    }));
    return {...measured,...lifted,...direct,occtHLRVisibilityClass:hlrClass,
     sourceCandidate3DLifts:liftsWithPartnerCandidates,
     originalBRepTShapePartnerSourceCandidateIds:partnerSourceIds,
     originalBRepTShapePartnerSourceCandidatesConsistentWithPaperProjection:partnerPaperSourceIds,
     uniqueOriginalBRepTShapePartnerSourceCandidate:uniquePartnerPaperSourceId,
     originalBRepTShapePartnerCandidateIsNotFullSourceHistory:true,
     originalOCCTSourceTopology3DVerified:true,
     actualOCCTHLREdgeToOriginalTopoDSIdentityMatched:false,
     hiddenStrokeEngineeringStyleNotCertified:true};
   };
   // Same native edge reader is used on both HLR sharp-edge compounds.
   // Neither represents original TopoDS identity or a GB line style.
   const traverse=(compound,hlrClass)=>{
    const edges=newObj('TopExp_Explorer_2',compound,kind,avoid);
    const result=[],vertexRecords=[],nativeEdges=[];
    while(edges.More()){
     const edge=hold(edges.Current());
     let nativeEndpoints=null;
     const measured=readRealOcjsSharpHLREdge({
      oc,edge,view,vertexType,avoid,newObj,hold,
      onGenuineTopoDSVertices:rec=>{nativeEndpoints=rec;}
     });
     if(measured){
      const checked=withSourceCandidates(measured,hlrClass,edge);
      if(!nativeEndpoints||
         nativeEndpoints.nativeVertices.length!==2||
         nativeEndpoints.projectedEndpoints.length!==2)
       throw new RangeError('verified OCCT edge lost its native vertex topology');
      const directNativeVertexOriginalSource=nativeEndpoints.nativeVertices.map(
       (vertex,side)=>probeRealOcctHLRVertexDirectOriginalSourceIdentity({
        generatedVertex:vertex,originalSourceVertices:originalNativeVertexHandles,
        view,nativePaperPoint:nativeEndpoints.projectedEndpoints[side],geometry
       }));
      const ordinal=result.length;
      result.push({...checked,directNativeVertexOriginalSource});
      nativeEdges.push(edge);
      vertexRecords.push({nativeHLREdgeOrdinal:ordinal,
       vertices:nativeEndpoints.nativeVertices,
       projectedEndpoints:nativeEndpoints.projectedEndpoints});
     }
     if(result.length>128)
      throw new RangeError('unbounded real BRep HLR sharp-edge output');
     edges.Next();
    }
    return {segments:result,vertexRecords,nativeEdges};
   };
   const visibleNative=traverse(visible,'visible-sharp');
   const segments=visibleNative.segments;
   // HCompound contains ACTUAL hidden C0/sharp HLR edges. This is
   // computed occlusion evidence, not permission to draw GB dashed lines.
   const hidden=hold(method(extractor,'HCompound_1').call(extractor));
   // Native HCompound legitimately yields a null TopoDS shape when NO
   // sharp hidden edges exist for a particular view. Null is not a line.
   // Track this empty case explicitly rather than forging hidden segments.
   const emptyHiddenSharp=hidden.IsNull();
   if(emptyHiddenSharp)hiddenSharpNullCompoundViews.push(view);
   const hiddenNative=emptyHiddenSharp?
    {segments:[],vertexRecords:[],nativeEdges:[]}:traverse(hidden,'hidden-sharp');
   const hiddenSegments=hiddenNative.segments;
   // Native OCCT HLRBRep_HLRToShape has source-filtered extraction
   // VCompound(S)/HCompound(S). Query EACH actual original TopoDS edge
   // while the algorithm and its internal EdgeMap are still alive.
   // Compare its newly generated projected output with the whole-solid
   // generated TopoDS edges using symmetric native IsSame, NEVER paper
   // coincidence alone. This is a source-scoped witness, not a global
   // parameter/occlusion or GB line-style certificate.
   const indexProof=originalDataStructureIndex;
   if(indexProof.availability!=='real-native-edge-map-inspected'||
      indexProof.everyOriginalBRepSourcePresentInHLRDataStructure!==true||
      indexProof.edgeMapSourceBijectionVerified!==true||
      indexProof.sourceLedgerDistinctNativeTopoDSIdentityVerified!==true||
      !Array.isArray(indexProof.indexedOriginalSources)||
      typeof extractor.VCompound_2!=='function'||
      typeof extractor.HCompound_2!=='function')
    throw new RangeError('pinned native HLR source-scoped extraction and original EdgeMap required');
   const byOriginalSource=new Map();
   for(const row of indexProof.indexedOriginalSources){
    if(row.directlySameOriginalTopoDSInputEdge===true&&
       typeof row.originalPhysicalSourceEdgeId==='string'){
     if(byOriginalSource.has(row.originalPhysicalSourceEdgeId))
      throw new RangeError('duplicate native HLR indexed original source');
     byOriginalSource.set(row.originalPhysicalSourceEdgeId,
      row.hlrDataStructureOneBasedEdgeIndex);
    }
   }
   const scopedRows=[],processed=new Set();
   let scopedOutputEdges=0,directGeneratedIdentityMatches=0,
    paperOnlyScopedOutputEdges=0;
   for(const original of originalNativeEdgeHandles){
    if(processed.has(original.sourceEdgeId))continue;
    processed.add(original.sourceEdgeId);
    const index=byOriginalSource.get(original.sourceEdgeId);
    if(!Number.isSafeInteger(index)||index<1)
     throw new RangeError('original OCCT source missing native HLR EdgeMap index');
    const row={originalPhysicalSourceEdgeId:original.sourceEdgeId,
     hlrDataStructureOneBasedEdgeIndex:index};
    for(const [klass,methodName,global] of [
     ['visible-sharp','VCompound_2',visibleNative],
     ['hidden-sharp','HCompound_2',hiddenNative]
    ]){
     const filtered=hold(extractor[methodName](original.edge));
     const witnesses=[];
     if(!filtered.IsNull()){
      const scopedExplorer=newObj('TopExp_Explorer_2',filtered,kind,avoid);
      while(scopedExplorer.More()){
       const nativeEdge=hold(scopedExplorer.Current());
       const measured=readRealOcjsSharpHLREdge({
        oc,edge:nativeEdge,view,vertexType,avoid,newObj,hold
       });
       if(measured){
        const witness=auditC1ScopedHLRGeneratedEdgeMatch({
         view,hlrClass:klass,sourceEdgeId:original.sourceEdgeId,
         globalSegments:global.segments,
         globalNativeEdges:global.nativeEdges,
         scopedSegment:measured,scopedNativeEdge:nativeEdge
        });
        witnesses.push({...witness,from:measured.from,to:measured.to});
        scopedOutputEdges++;
        if(witness.actualNativeScopedToGlobalGeneratedEdgeIsSameProven)
         directGeneratedIdentityMatches++;
        else paperOnlyScopedOutputEdges++;
       }
       if(witnesses.length>128)
        throw new RangeError('unbounded source-scoped native HLR sharp edges');
       scopedExplorer.Next();
      }
     }
     row[klass==='visible-sharp'?'visible':'hidden']=witnesses;
     // OCCT HLRBRep::MakeEdge3d, unlike VCompound/HCompound's 2D
     // MakeEdge, retains the ORIGINAL source curve and native 3D
     // parameter range. Source-filtered extraction is tied to the real
     // indexed original TopoDS edge; these are not guessed paper lifts.
     // Keep native 3D intervals separate from generated 2D TShape IsSame
     // and from whole-scene M5 continuous visibility.
     const sharp=oc.HLRBRep_TypeOfResultingEdge?.HLRBRep_Sharp;
     if(sharp===undefined||typeof extractor.CompoundOfEdges_2!=='function')
      throw new TypeError('pinned OCJS source-scoped native 3D HLR sharp extraction missing');
     const native3DCompound=hold(extractor.CompoundOfEdges_2(
      original.edge,sharp,klass==='visible-sharp',true));
     const native3DIntervals=[];
     if(!native3DCompound.IsNull()){
      const explorer3D=newObj('TopExp_Explorer_2',native3DCompound,kind,avoid);
      while(explorer3D.More()){
       const shape3D=hold(explorer3D.Current());
       const edge3D=hold(method(oc.TopoDS,'Edge_1')(shape3D));
       const curve3D=newObj('BRepAdaptor_Curve_2',edge3D);
       const first=curve3D.FirstParameter(),last=curve3D.LastParameter();
       const lineKind=oc.GeomAbs_CurveType?.GeomAbs_Line??oc.GeomAbs_Line;
       if(curve3D.GetType()!==lineKind||curve3D.Is3DCurve()!==true||
          !finite(first)||!finite(last)||!(last>first))
        throw new RangeError('actual source-filtered native HLR 3D edge is not a positive line');
       const p0=hold(curve3D.Value(first)),p1=hold(curve3D.Value(last));
       const from3D={x:p0.X(),y:p0.Y(),z:p0.Z()};
       const to3D={x:p1.X(),y:p1.Y(),z:p1.Z()};
       if(![...Object.values(from3D),...Object.values(to3D)].every(finite))
        throw new RangeError('nonfinite actual native HLR 3D source segment');
       // HLRBRep::MakeEdge3d is supposed to reuse the original 3D
       // curve with a trimmed parameter range. Verify the claim against
       // the ACTUAL original OCCT BRepAdaptor at three native parameters,
       // not an inferred 2D lift or a tolerance-based source label.
       const originalCurve3D=newObj('BRepAdaptor_Curve_2',original.edge);
       for(const t of [first,(first+last)/2,last]){
        const sourcePoint=hold(originalCurve3D.Value(t));
        const generatedPoint=hold(curve3D.Value(t));
        if(['X','Y','Z'].some(axis=>
         sourcePoint[axis]()!==generatedPoint[axis]()))
         throw new RangeError('native source-filtered HLR 3D curve differs from original BRep at same parameter');
       }
       native3DIntervals.push({
        nativeOriginalCurveParameterRange:[first,last],
        actualOCCTGenerated3DFrom:from3D,actualOCCTGenerated3DTo:to3D,
        nativeSourceFilterOriginalEdgeId:original.sourceEdgeId,
        native3DCurveExactlySameAsOriginalAtThreeParameters:true,
        originalGeneratedTopoDSHistoryCertified:false,
        engineeringLineStyle:'undetermined',signedV5Action:false
       });
       if(native3DIntervals.length>128)
        throw new RangeError('unbounded native source-scoped 3D HLR sharp intervals');
       explorer3D.Next();
      }
     }
     const source3D=sourceById.get(original.sourceEdgeId);
     if(!source3D?.occtSourceCurve3DEndpointsAndMidpointVerified)
      throw new RangeError('native source-scoped 3D HLR lost original OCCT curve');
     const native3DCoverage=auditC1Native3DSourceScopedIntervals({
      originalNativeParameterRange:source3D.occtSourceCurveParameterRange,
      generatedNativeParameterRanges:native3DIntervals.map(x=>
       x.nativeOriginalCurveParameterRange)
     });
     row[klass==='visible-sharp'?'visible3D':'hidden3D']={
      nativeSourceFilteredOriginalTopoDSEdge:true,
      native3DGeneratedCurveIntervals:native3DIntervals,
      exactNative3DSourceParameterCoverage:native3DCoverage,
      generated2DSourceIdentityIsSameProven:false,
      globalContinuousVisibilityCertified:false,
      engineeringLineStyle:'undetermined',signedV5Action:false
     };
    }
    // Source-scoped native 3D V+H partition is the direct OCCT curve
    // domain ledger. Visible-only and hidden-only gaps are expected;
    // the COMBINED partition must be checked before interpreting a 2D
    // rounded-inverse micro-gap as missing original physical source.
    const native3DSource=sourceById.get(original.sourceEdgeId);
    row.combinedNative3DSourceParameterPartition=
     auditC1Native3DSourceScopedIntervals({
      originalNativeParameterRange:native3DSource.occtSourceCurveParameterRange,
      generatedNativeParameterRanges:[
       ...row.visible3D.native3DGeneratedCurveIntervals,
       ...row.hidden3D.native3DGeneratedCurveIntervals
      ].map(x=>x.nativeOriginalCurveParameterRange)
     });
    row.combinedNative3DPartitionIsNotGenerated2DTopoDSHistory=true;
    row.engineeringLineStyle='undetermined';
    row.signedV5Action=false;
    scopedRows.push(row);
   }
   if(processed.size!==byOriginalSource.size)
    throw new RangeError('source-scoped HLR filter did not enumerate every original edge');
   // The native EdgeMap and source-filtered output are still the only
   // authority for each claim. Cross-check ALL original sources here, before
   // returning serializable evidence to M5 or deleting WASM handles.
   const nativeSourceIdentityConflicts=auditC1ScopedHLRSourceIdentityConflicts({
    matches:scopedRows.flatMap(source=>[
     ...source.visible,...source.hidden
    ]),
    wholeSolidCounts:{'visible-sharp':visibleNative.segments.length,
     'hidden-sharp':hiddenNative.segments.length}
   });
   // Preserve exact unclaimed native ordinals and their measured projected
   // endpoints for independent source/parameter forensics. These are NOT
   // inferred M0 source labels and must not authorize engineering strokes.
   const unclaimedNativeGeneratedHLREdges=
    nativeSourceIdentityConflicts.unclaimedWholeSolidGeneratedEdgeOrdinals.map(
     ({hlrClass,ordinal})=>{
      const generated=hlrClass==='visible-sharp'?
       visibleNative.segments[ordinal]:hiddenNative.segments[ordinal];
      if(!generated||!generated.from||!generated.to)
       throw new RangeError('missing actual native generated HLR edge for unclaimed ordinal');
      return Object.freeze({view,hlrClass,ordinal,
       projectedFrom:Object.freeze({...generated.from}),
       projectedTo:Object.freeze({...generated.to}),
       sourceCandidate3DLifts:generated.sourceCandidate3DLifts,
       actualNativeScopedOriginalSourceIdentityRecovered:false,
       originalSourceParameterIntervalCertified:false,
       engineeringLineStyle:'undetermined',signedV5Action:false});
     });
   nativeSourceScopedSharpOutputByView[view]={
    unclaimedNativeGeneratedHLREdges,
    nativeSourceIdentityConflicts,
    schema:'draftai-c1-ocjs-real-original-topods-scoped-hlr/1',
    sourceEdgeCount:scopedRows.length,
    nativeSourceScopedOutputEdgeCount:scopedOutputEdges,
    nativeScopedToWholeSolidGeneratedIsSameCount:directGeneratedIdentityMatches,
    paperOnlyScopedOutputEdgeCount:paperOnlyScopedOutputEdges,
    originalTopoDSEdgeIndexCheckedAgainstActualHLREdgeMap:true,
    allScopedOutputsReboundToWholeSolidPaper:true,
    rows:scopedRows,
    fullGlobalGeneratedEdgeToOriginalSourceHistoryProven:false,
    fullContinuousVisibilityProven:false,
    engineeringLineStyle:'undetermined',signedV5ActionCount:0
   };
   nativeGraphInput[view]={
    visible:visibleNative.vertexRecords,
    hidden:hiddenNative.vertexRecords
   };
   if(segments.length<(b?4:3))
    throw new RangeError('real OCJS C1 silhouette incomplete for '+view+' count='+segments.length+' source='+geometry.id+' scope='+(b?'cuboid':'sewn-convex-shell'));
   rows[view]=segments;
   hiddenViews[view]=hiddenSegments;
  }
  // IsSame inspects genuine OCCT TShape/Location while all emscripten
  // TopoDS vertex objects are still alive. Persist no native handles.
  const nativeGeneratedVertexGraph=
   computeC1NativeHLRIsSameVertexGraph({perView:nativeGraphInput});
  const directNativeOriginalVertexMatches=Object.fromEntries(VIEWS.map(view=>[
   view,[...rows[view],...hiddenViews[view]].reduce((n,edge)=>
    n+edge.directNativeVertexOriginalSource.filter(x=>
     x.directOriginal3DVertexTopoDSIdentityProven).length,0)
  ]));
  // IsPartner ignores TopLoc_Location. Its matches are source candidates,
  // never 3D endpoint identity, parameter history, visibility or V5 authority.
  const nativeTShapePartnerEdgeCandidatesByView=Object.fromEntries(VIEWS.map(view=>[
   view,[...rows[view],...hiddenViews[view]].reduce((n,edge)=>n+
    (edge.actualOCCTGeneratedEdgePartnerOriginalBRepIsPartnerCompared?
     edge.originalPhysicalOCCTPartnerSourceEdgeIds.length:0),0)
  ]));
  const nativeTShapePartnerVertexCandidatesByView=Object.fromEntries(VIEWS.map(view=>[
   view,[...rows[view],...hiddenViews[view]].reduce((n,edge)=>
    n+edge.directNativeVertexOriginalSource.reduce((sum,vertex)=>
     sum+(vertex.actualOCCTGeneratedVertexPartnerOriginalBRepIsPartnerCompared?
      vertex.partnerOriginalM0VertexCandidateIds.length:0),0),0)
  ]));
  if(nativeGeneratedVertexGraph.counts.genuineOCCTNativeHLRSharpEdges!==
     VIEWS.reduce((n,v)=>n+rows[v].length+hiddenViews[v].length,0)||
     nativeGeneratedVertexGraph.signedV5ActionCount!==0)
   throw new RangeError('actual OCCT HLR native generated vertex graph is incomplete');
  return Object.freeze({
   schema:'draftai-c1-ocjs-real-visible-brep/1',
   engine:'opencascade.js',revision,
   sourceGeometryId:geometry.id,unit:'mm',
   proofScope:b?'reviewed-axis-aligned-cuboid':
    'reviewed-closed-convex-polyhedral-shell',
   views:rows,hiddenSharpViews:hiddenViews,
   nativeGeneratedVertexGraph,originalNativeVertexTopology,
   originalNativeFaceAdjacency,directNativeOriginalVertexMatches,
   nativeTShapePartnerEdgeCandidatesByView,
   nativeTShapePartnerVertexCandidatesByView,
   nativeTShapePartnerCandidatesDoNotProveOriginalHistory:true,
   nativeHLRSourceHistoryAPISurfaceByView,
   nativeSourceScopedSharpOutputByView,
   everyNativeGeneratedEndpointComparedToOriginalTopoDSVertices:true,
   directNativeOriginalVertexIdentityDoesNotProveEdgeHistory:true,
   hiddenHLROutputFromActualOCCT:true,
   hiddenSharpNullCompoundViews,
   hiddenSharpEdgesAreOnlyUnsignedCandidates:true,
   hiddenHLROriginalEdgeAttributionRecovered:false,
   hiddenLineStylesCertified:false,
   engineComputedVisibleGeometry:true,
   allEmittedVisibleHLRCurvesVerifiedStraightAndPlanar:true,
   actualOriginalTopoDSToHLRGeneratedEdgeLinkVerified:false,
   originalBRepSourceEdges:sourceBRep.originalBRepSourceEdges,
   occtOriginalEdgeOccurrenceCount:sourceBRep.occtOriginalEdgeOccurrenceCount,
   completeSourceTopology3DEndpointCorrespondence:
    sourceBRep.completeSourceTopology3DEndpointCorrespondence,
   actualOCCTHLREdgeToOriginalTopoDSIdentityMatched:false,
   actualOCCTCurveTypeIndependentlyVerified:
    sourceBRep.actualOCCTCurveTypeIndependentlyVerified,
   sourceCandidateOnly:true,
   lineStyleCertified:false,v5Authorized:false
  });
 }finally{
  for(const o of owned.reverse())o.delete();
 }
}
module.exports={computeC1OcjsVisibleSegments,cuboidBounds,
 liftOriginalProjectedSourceCandidates,matchOriginalBRepEdgeByXYZ,
 extractRealOcjsOriginalSourceBRepEdges,
 verifyOriginalOcctLinearCurveWitness,
 probeRealOcctHLREdgeDirectOriginalSourceIdentity,
 probeRealOcctHLRVertexDirectOriginalSourceIdentity,
 probeRealOcctHLRDataStructureSourceEdgeMap};
