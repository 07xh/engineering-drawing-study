'use strict';
/**
 * Consume REAL source-scoped HLR extraction (original TopoDS input edge
 * filtered through OCCT) alongside the whole-solid V/H/W HLR result.
 * No guessed paper alias may be promoted to original TopoDS history:
 * native scoped IsSame is tracked separately, and original 3D source
 * parameter intervals and continuous M5 rays remain independent gates.
 */
const {VIEWS,project}=require('../core/projection/conventions.js');
const {nativeScopedPaperSegmentsSame}=
 require('../engines/spatial/hlr/c1-ocjs-scoped-source-matcher.cjs');
const {exactCandidateIntervalCoverage,exactCandidateVisibilityClassOverlap}=
 require('./c1-original-source-interval-coverage.cjs');
const {auditExactBinary64PaperParameterPair,
 auditExactBinary64PaperCandidateCoverage,
 auditExactBinary64PaperVisibilityConflict}=
 require('./c1-exact-binary64-paper-parameter.cjs');
const {auditC1ExactBinary64PaperAffineWitness}=
 require('./c1-exact-binary64-paper-affine.cjs');
const {projectC1Native3DSourceIntervalsToM4}=
 require('./c1-native-source-scoped-m4-projection.cjs');
const {auditC1RealNativeScoped2D3DClassBinding}=
 require('./c1-native-scoped-2d-3d-class-binding.cjs');
const {auditC1WholeSolidNativeHLRSourceScopeRebinding}=
 require('./c1-global-native-hlr-original-source-rebind.cjs');
const frozen=o=>{if(o&&typeof o==='object'&&!Object.isFrozen(o)){
 for(const v of Object.values(o))frozen(v);Object.freeze(o);
}return o;};
function auditC1NativeScopedHLRSourceConsumer({geometry,cad}={}){
 if(typeof geometry?.id!=='string'||!geometry.id||
    !Array.isArray(geometry?.data?.edges)||!geometry.data.edges.length||
    !geometry.data.points||cad?.sourceGeometryId!==geometry.id||
    !Number.isSafeInteger(cad?.revision)||cad.revision<1)
  throw new TypeError('current C1 M0 geometry and real HLR revision required');
 const ids=geometry.data.edges.map(e=>{
  if(!Array.isArray(e)||e.length!==2||e[0]===e[1]||e.some(id=>
      typeof id!=='string'||!Object.hasOwn(geometry.data.points,id)))
   throw new RangeError('invalid original C1 physical source');
  const [a,b]=e.map(id=>geometry.data.points[id]);
  if(![a,b].every(p=>p&&['x','y','z'].every(k=>Number.isFinite(p[k])))||
     ['x','y','z'].every(k=>a[k]===b[k]))
   throw new RangeError('nonfinite or degenerate original C1 3D source edge');
  return geometry.id+'::'+[...e].sort().join('|');
 });
 const projectedOriginalBySource=new Map();
 for(let i=0;i<ids.length;i++){
  const [a,b]=geometry.data.edges[i].map(id=>geometry.data.points[id]);
  const projectedA=project(a),projectedB=project(b);
  projectedOriginalBySource.set(ids[i],Object.fromEntries(VIEWS.map(view=>
   [view,[projectedA[view],projectedB[view]]])));
 }
 const originalVertexIdsBySource=new Map(ids.map((id,i)=>
  [id,geometry.data.edges[i]]));
 const expected=new Set(ids);
 // Real source-scoped 3D geometry is a stronger, independent M4 input
 // than an inverse of rounded 2D generated HLR paper endpoints.
 const nativeM4Available=geometry.kind==='mesh'&&
  geometry.space==='model-3d'&&geometry.unit==='mm'&&
  cad.actualOCCTCurveTypeIndependentlyVerified===true&&
  Array.isArray(cad.originalBRepSourceEdges)&&
  cad.originalBRepSourceEdges.length===ids.length;
 const nativeCurveBySource=new Map();
 if(nativeM4Available){
  for(const curve of cad.originalBRepSourceEdges){
   if(!expected.has(curve?.sourceEdgeId)||
      nativeCurveBySource.has(curve.sourceEdgeId))
    throw new RangeError('unbound original native 3D curve in M4 source consumer');
   nativeCurveBySource.set(curve.sourceEdgeId,curve);
  }
 }
 if(expected.size!==ids.length)
  throw new RangeError('duplicate original M0 physical source edge');
 const valid=p=>p&&Number.isFinite(p.u)&&Number.isFinite(p.v);
 // Scoped HLR paper aliases are only CANDIDATES, but even a candidate
 // must lie on its claimed ORIGINAL M0 edge in the SAME first-angle view.
 // This tolerance is exclusively for CAD paper rounding, never for exact
 // source parameter coverage, 3D depth, continuous visibility or V5.
 const onOriginalPaperEdge=(p,source,view)=>{
  const [a,b]=projectedOriginalBySource.get(source)[view];
  const dx=b.u-a.u,dy=b.v-a.v,length=Math.hypot(dx,dy);
  if(!valid(p)||!Number.isFinite(length)||!(length>0))return false;
  const along=(p.u-a.u)*(dx/length)+(p.v-a.v)*(dy/length);
  if(!Number.isFinite(along))return false;
  const bounded=Math.max(0,Math.min(length,along));
  // For a very short original M0 projection, an absolute 1e-6 mm
  // allowance could assign an entirely unrelated generated line to it.
  // Keep the CAD rounding cap but scale it to the actual source span.
  return Math.hypot(p.u-a.u-(dx/length)*bounded,
   p.v-a.v-(dy/length)*bounded)<=Math.min(1e-6,length*1e-6);
 };
 // Inverting a 2D HLR paper line yields only a CANDIDATE original 3D
 // parameter. Native TopoDS history, endpoint topology and opaque rays must
 // still be proven separately. Never clamp rounded endpoints to [0,1]:
 // that could silently erase a positive original-source parameter gap.
 const paperParameter=(p,source,view)=>{
  const [a,b]=projectedOriginalBySource.get(source)[view];
  const du=b.u-a.u,dv=b.v-a.v,useU=Math.abs(du)>=Math.abs(dv);
  const delta=useU?du:dv;
  if(!Number.isFinite(delta)||delta===0)return null;
  const t=((useU?p.u:p.v)-(useU?a.u:a.v))/delta;
  return Number.isFinite(t)&&t>=0&&t<=1?t:null;
 };
 const originalEndpointCandidate=(p,t,source,view)=>{
  const [a,b]=projectedOriginalBySource.get(source)[view];
  const [aId,bId]=originalVertexIdsBySource.get(source);
  if(t===0&&p.u===a.u&&p.v===a.v)return aId;
  if(t===1&&p.u===b.u&&p.v===b.v)return bId;
  return null;
 };
 const views={},counts={originalSourceEdgesPerView:ids.length,
  projectedSourcesWithFullPaperCandidateCoverage:0,
  projectedSourcesWithPositivePaperCandidateGaps:0,
  projectedSourcesWithExactBinary64PaperCandidateGaps:0,
  projectedSourcesWithFullExactBinary64PaperCandidateCoverage:0,
  projectedSourcesWithRoundedFalseFullPaperCandidateCoverage:0,
  sourceScopedPaperEndpointsOffExactBinary64OriginalLine:0,
  projectedSourcesWithExactAffinePaperMismatch:0,
  projectedSourcesWithVisibleHiddenCandidateConflicts:0,
  positiveLengthVisibleHiddenCandidateConflictIntervalCount:0,
  projectedSourcesWithExactVisibleHiddenCandidateConflicts:0,
  exactPositiveLengthVisibleHiddenCandidateConflictIntervalCount:0,
  projectedSourcesWithRoundedMissedVisibleHiddenCandidateConflicts:0,
  sourceScopedPaperStrokesWithUnboundParameters:0,
  sourceScopedPaperEndpointsOutsideExactBinary64Domain:0,
  sourceScopedPaperPositiveIntervalsLostByRoundedInverse:0,
  nativeSourceScopedOutputEdges:0,nativeGeneratedIsSameMatches:0,
  paperOnlySourceScopedEdges:0,wholeSolidVisibleEdgesWithoutScopedSource:0,
  wholeSolidHiddenEdgesWithoutScopedSource:0,
  paperAliasedWholeSolidEdgesWithMultipleOriginalSources:0,
  nativeOriginal3DM4SourceViewCandidates:0,
  nativeOriginal3DM4ProjectedClassSegments:0,
  nativeOriginal3DM4PositiveIntervalsHeldForBinary64:0,
  nativeSourceScoped2DGeneratedEdgesClassReconciledWith3D:0,
  nativeSourceScoped2DEdgesExactlyBackedBySame3DClass:0,
  nativeSourceScoped2DEdgesClassOrRoundingHeld:0,
  nativeSourceScoped2DEdgesWithOpposite3DClassOverlap:0,
  nativeSourceScoped2DEdgesWithFullSourceOneULPCompatibility:0,
  nativeSourceScoped2DEdgesPreciselyHeldButULPBounded:0,
  nativeSourceScoped2DEdgesBeyondOneULPOrWithoutWholeNativeClass:0};
 for(const view of VIEWS){
  const scoped=cad.nativeSourceScopedSharpOutputByView?.[view],
   ds=cad.nativeHLRSourceHistoryAPISurfaceByView?.[view]?.originalDataStructureIndex;
  if(scoped?.schema!=='draftai-c1-ocjs-real-original-topods-scoped-hlr/1'||
     scoped.sourceEdgeCount!==ids.length||
     scoped.originalTopoDSEdgeIndexCheckedAgainstActualHLREdgeMap!==true||
     scoped.allScopedOutputsReboundToWholeSolidPaper!==true||
     scoped.fullGlobalGeneratedEdgeToOriginalSourceHistoryProven!==false||
     scoped.fullContinuousVisibilityProven!==false||
     scoped.signedV5ActionCount!==0||
     ds?.availability!=='real-native-edge-map-inspected'||
     ds.everyOriginalBRepSourcePresentInHLRDataStructure!==true||
     !Array.isArray(ds.indexedOriginalSources)||
     ds.indexedOriginalSources.length!==ids.length||
     !Array.isArray(scoped.rows)||scoped.rows.length!==ids.length)
   throw new RangeError('missing complete real OCCT source-scoped HLR/EdgeMap evidence');
  // A real OCCT EdgeMap is a bijection: two distinct original TopoDS
  // source edges cannot own the same one-based native index.
  const indexed=new Map(),nativeSourceIndices=new Set();
  for(const x of ds.indexedOriginalSources){
   if(!expected.has(x.originalPhysicalSourceEdgeId)||
      !Number.isSafeInteger(x.hlrDataStructureOneBasedEdgeIndex)||
      x.hlrDataStructureOneBasedEdgeIndex<1||
      x.directlySameOriginalTopoDSInputEdge!==true||
      indexed.has(x.originalPhysicalSourceEdgeId)||
      nativeSourceIndices.has(x.hlrDataStructureOneBasedEdgeIndex))
    throw new RangeError('stale or duplicated real native HLR source index');
   indexed.set(x.originalPhysicalSourceEdgeId,x.hlrDataStructureOneBasedEdgeIndex);
   nativeSourceIndices.add(x.hlrDataStructureOneBasedEdgeIndex);
  }
  const classes={
   visible:{global:cad.views?.[view],field:'visible'},
   hidden:{global:cad.hiddenSharpViews?.[view],field:'hidden'}
  };
  for(const item of Object.values(classes)){
   if(!Array.isArray(item.global)||item.global.length>128)
    throw new RangeError('invalid whole-solid HLR stroke inventory');
   item.sources=Array.from({length:item.global.length},()=>new Set());
   // Direct native IsSame is an identity, not a paper-only alias. A single
   // generated TopoDS edge may not certify two original sources or appear
   // twice in one visibility class.
   item.nativeOwners=new Map();
  }
  const sourceRanges=new Map(ids.map(id=>[id,[]]));
  const exactPaperDiagnostics=new Map(ids.map(id=>[id,[]]));
  const exactAffineWitnesses=new Map(ids.map(id=>[id,[]]));
  const exactPaperSegments=new Map(ids.map(id=>[id,[]]));
  const exactClassSegments=Object.fromEntries(['visible','hidden'].map(k=>
   [k,new Map(ids.map(id=>[id,[]]))]));
  const classRanges=Object.fromEntries(['visible','hidden'].map(k=>
   [k,new Map(ids.map(id=>[id,[]]))]));
  for(const item of Object.values(classes))
   item.parameterCandidates=Array.from({length:item.global.length},()=>[]);
  let total=0,direct=0,seen=new Set();
  for(const row of scoped.rows){
   const source=row?.originalPhysicalSourceEdgeId;
   if(!expected.has(source)||seen.has(source)||
      row.hlrDataStructureOneBasedEdgeIndex!==indexed.get(source))
    throw new RangeError('source-scoped HLR row is not the current original TopoDS');
   seen.add(source);
   for(const [klass,item] of Object.entries(classes)){
    const witnesses=row[item.field];
    if(!Array.isArray(witnesses)||witnesses.length>128)
     throw new RangeError('invalid original-source-filtered HLR class');
    for(const w of witnesses){
     const paper=w?.globalPaperCandidateOrdinals,
      native=w?.globalDirectSameGeneratedTopoDSOrdinals;
     if(w.view!==view||
        w.hlrClass!==(klass==='visible'?'visible-sharp':'hidden-sharp')||
        w.originalPhysicalSourceEdgeId!==source||
        !valid(w.from)||!valid(w.to)||
        !Array.isArray(paper)||paper.length===0||
        !Array.isArray(native)||native.length>1||
        w.actualNativeScopedToGlobalGeneratedEdgeIsSameProven!==
         (native.length===1)||
        w.fullOriginalSourceParameterCoverageProven!==false||
        w.globalContinuousOcclusionProven!==false||
        w.engineeringLineStyle!=='undetermined'||w.signedV5Action!==false)
      throw new RangeError('invalid unsigned OCCT source-scoped HLR witness');
     // A native source-filtered HLR line cannot be attributed to an
     // arbitrary 3D source just because its label occurs in a whole-solid
     // candidate list. Reproject the original 3D BRep endpoints first.
     // A collapsed projection has no positive line to attribute.
     if(!(Math.hypot(w.to.u-w.from.u,w.to.v-w.from.v)>0)||
        !onOriginalPaperEdge(w.from,source,view)||
        !onOriginalPaperEdge(w.to,source,view))
      throw new RangeError('source-scoped HLR paper segment contradicts original M0 3D projection');
     const [sourceFrom,sourceTo]=projectedOriginalBySource.get(source)[view];
     const exactPaper=auditExactBinary64PaperParameterPair({
      sourceFrom,sourceTo,measuredFrom:w.from,measuredTo:w.to
     });
     // Cross-axis exact affine incidence is independent of inverse-t coverage.
     // OCCT may round transverse paper coordinates: diagnose, never snap.
     const affine=auditC1ExactBinary64PaperAffineWitness({
      sourceFrom,sourceTo,measuredFrom:w.from,measuredTo:w.to
     });
     exactAffineWitnesses.get(source).push(affine);
     counts.sourceScopedPaperEndpointsOffExactBinary64OriginalLine+=
      Number(!affine.nativeFromExactlyOnOriginalBinary64PaperLine)+
      Number(!affine.nativeToExactlyOnOriginalBinary64PaperLine);
     const exactBounds=exactPaper.nativeFromWithinExactBinary64OriginalParameterDomain&&
      exactPaper.nativeToWithinExactBinary64OriginalParameterDomain;
     if(!exactBounds)counts.sourceScopedPaperEndpointsOutsideExactBinary64Domain++;
     // Retain the RECEIVED binary64 paper endpoints independently of
     // Number-division candidate t. An interior t can round to 0 or 1,
     // falsely closing a positive original-source interval tail.
     if(exactBounds&&exactPaper.nativePaperSourceParameterPairHasExactPositiveSpan){
      const originalPaperSegment={from:{...w.from},to:{...w.to}};
      exactPaperSegments.get(source).push(originalPaperSegment);
      exactClassSegments[klass].get(source).push(originalPaperSegment);
     }
     const tFrom=paperParameter(w.from,source,view),
      tTo=paperParameter(w.to,source,view);
     if(exactPaper.nativePaperSourceParameterPairHasExactPositiveSpan&&
        tFrom!==null&&tTo!==null&&tFrom===tTo)
      counts.sourceScopedPaperPositiveIntervalsLostByRoundedInverse++;
     // A rounded t=0 or t=1 cannot override an exact one-ULP paper
     // overshoot. Likewise, two distinct dyadic positions whose rounded
     // inverse parameters coincide cannot certify a positive interval.
     const range=!exactBounds||
      !exactPaper.nativePaperSourceParameterPairHasExactPositiveSpan||
      tFrom===null||tTo===null||tFrom===tTo?null:
      [Math.min(tFrom,tTo),Math.max(tFrom,tTo)];
     exactPaperDiagnostics.get(source).push({
      hlrClass:w.hlrClass,measuredPaperFrom:{...w.from},
      measuredPaperTo:{...w.to},
      roundedPaperInverseParameters:[tFrom,tTo],
      paperDerivedCandidateIntervalRetained:range!==null,
      ...exactPaper,
      exactBinary64PaperAffineWitness:affine
     });
     if(range){
      sourceRanges.get(source).push(range);
      classRanges[klass].get(source).push(range);
     }else counts.sourceScopedPaperStrokesWithUnboundParameters++;
     const endpointCandidates=[
      originalEndpointCandidate(w.from,tFrom,source,view),
      originalEndpointCandidate(w.to,tTo,source,view)
     ];
     const ordinalSet=new Set();
     for(const ordinal of paper){
      if(!Number.isSafeInteger(ordinal)||ordinal<0||
         ordinal>=item.global.length||ordinalSet.has(ordinal))
       throw new RangeError('invalid or duplicate whole-solid HLR ordinal');
      ordinalSet.add(ordinal);
      const seg=item.global[ordinal];
      if(!valid(seg?.from)||!valid(seg?.to)||
         !Array.isArray(seg.projectedOriginalEdgeCandidates)||
         !seg.projectedOriginalEdgeCandidates.includes(source)||
         !nativeScopedPaperSegmentsSame(seg,w))
       throw new RangeError('native original source filter contradicts whole-solid HLR physical source');
      item.sources[ordinal].add(source);
      if(range)item.parameterCandidates[ordinal].push({
       originalPhysicalSourceEdgeId:source,
       paperDerivedOriginalSourceParameterCandidateRange:[...range],
       paperDerivedOriginal3DEndpointVertexCandidates:[...endpointCandidates],
       actualNativeTopoDSParameterHistoryProven:false,
       nativeOriginal3DEndpointTopologyProven:false
      });
     }
     for(const ordinal of native){
      if(!ordinalSet.has(ordinal))
       throw new RangeError('native generated IsSame is not a matching whole-solid HLR ordinal');
      if(item.nativeOwners.has(ordinal))
       throw new RangeError('duplicate native generated HLR ordinal identity claim');
      item.nativeOwners.set(ordinal,source);
     }
     total++;direct+=native.length;
    }
   }
  }
  if(seen.size!==expected.size||
     total!==scoped.nativeSourceScopedOutputEdgeCount||
     direct!==scoped.nativeScopedToWholeSolidGeneratedIsSameCount||
     total-direct!==scoped.paperOnlyScopedOutputEdgeCount)
   throw new RangeError('native source-scoped HLR output accounting mismatch');
  counts.nativeSourceScopedOutputEdges+=total;
  counts.nativeGeneratedIsSameMatches+=direct;
  counts.paperOnlySourceScopedEdges+=total-direct;
  // Project actual source-filtered native 3D curve parameters into M4
  // without inverting received rounded generated HLR paper coordinates.
  // Still held: generated-edge identity, co-projected depth, GB line type,
  // ConstructionIntent and the sole formal V5 player.
  const nativeOriginal3DM4Candidates=[];
  if(nativeM4Available){
   for(const source of scoped.rows){
    const [from,to]=projectedOriginalBySource.get(
     source.originalPhysicalSourceEdgeId)[view];
    if(from.u===to.u&&from.v===to.v){
     if((source.visible3D?.native3DGeneratedCurveIntervals.length??0)!==0||
        (source.hidden3D?.native3DGeneratedCurveIntervals.length??0)!==0)
      throw new RangeError('collapsed source cannot emit native 3D line in this view');
     continue;
    }
    const projected=projectC1Native3DSourceIntervalsToM4({
     geometry,revision:cad.revision,view,
     sourceEdgeId:source.originalPhysicalSourceEdgeId,
     originalCurve:nativeCurveBySource.get(source.originalPhysicalSourceEdgeId),
     scopedRow:source
    });
    nativeOriginal3DM4Candidates.push(projected);
    counts.nativeOriginal3DM4SourceViewCandidates++;
    counts.nativeOriginal3DM4ProjectedClassSegments+=projected.segments.length;
    counts.nativeOriginal3DM4PositiveIntervalsHeldForBinary64+=
     projected.M4ProjectedNative3DIntervalsHeldForBinary64Representation.length;
   }
  }
  // Same original TopoDS EdgeMap index, TWO independent source-filtered
  // native HLR result classes: generated 2D edge vs original native 3D
  // curve parameters. Check the exact dyadic source parameter support of
  // each received generated 2D segment, not a rounded 2D inverse t.
  // Direct native global-generated IsSame, M5 global visibility and V5
  // remain distinct unproven obligations.
  const nativeScoped2D3DClassBindings=[];
  if(nativeM4Available){
   const nativeM4ById=new Map(nativeOriginal3DM4Candidates.map(x=>
    [x.sourceEdgeId,x]));
   if(nativeM4ById.size!==nativeOriginal3DM4Candidates.length)
    throw new RangeError('duplicate original native 3D M4 source for 2D class binding');
   for(const source of scoped.rows){
    const originalId=source.originalPhysicalSourceEdgeId,
     nativeM4=nativeM4ById.get(originalId);
    if(!nativeM4)continue; // source collapses in this first-angle view
    const [sourceProjectedFrom,sourceProjectedTo]=
     projectedOriginalBySource.get(originalId)[view];
    const joined=auditC1RealNativeScoped2D3DClassBinding({
     view,sourceEdgeId:originalId,sourceProjectedFrom,sourceProjectedTo,
     scoped2DVisible:source.visible,scoped2DHidden:source.hidden,
     nativeOriginal3DM4:nativeM4
    });
    nativeScoped2D3DClassBindings.push(joined);
    counts.nativeSourceScoped2DGeneratedEdgesClassReconciledWith3D+=
     joined.counts.scoped2DGeneratedEdgesChecked;
    counts.nativeSourceScoped2DEdgesExactlyBackedBySame3DClass+=
     joined.counts.exactSameClassNative3DBackedEdges;
    counts.nativeSourceScoped2DEdgesClassOrRoundingHeld+=
     joined.counts.paperDriftOrClassCoverageHeld;
    counts.nativeSourceScoped2DEdgesWithOpposite3DClassOverlap+=
     joined.counts.exactOppositeClassPositiveOverlapEdges;
    counts.nativeSourceScoped2DEdgesWithFullSourceOneULPCompatibility+=
     joined.counts.originalFullEdgeOneULPPaperEnvelopeCompatible;
    counts.nativeSourceScoped2DEdgesPreciselyHeldButULPBounded+=
     joined.counts.roundedPaperRepresentationCompatibleButNotExactCertified;
    counts.nativeSourceScoped2DEdgesBeyondOneULPOrWithoutWholeNativeClass+=
     joined.counts.paperDriftOrClassCoverageHeld-
      joined.counts.roundedPaperRepresentationCompatibleButNotExactCertified;
   }
   if(nativeScoped2D3DClassBindings.length!==
      nativeOriginal3DM4Candidates.length||
      counts.nativeSourceScoped2DGeneratedEdgesClassReconciledWith3D!==
      counts.nativeSourceScoped2DEdgesExactlyBackedBySame3DClass+
      counts.nativeSourceScoped2DEdgesClassOrRoundingHeld)
    throw new RangeError('native source-scoped 2D/3D HLR class inventory incomplete');
  }
  views[view]={nativeOriginal3DM4Candidates,
   nativeScoped2D3DClassBindings};
  for(const [klass,item] of Object.entries(classes)){
   const rows=item.sources.map((sources,ordinal)=>({
    wholeSolidHLREdgeOrdinal:ordinal,
    original3DSourceCandidatesFromNativeFilter:[...sources].sort(),
    paperDerivedOriginalSourceParameterCandidates:
     item.parameterCandidates[ordinal].sort((a,b)=>
      a.originalPhysicalSourceEdgeId.localeCompare(b.originalPhysicalSourceEdgeId)),
    originalTopoDSHistoryProven:false,
    originalSourceParameterCoverageProven:false,
    continuousFrontRayProven:false,
    engineeringLineStyle:'undetermined',signedV5Action:false
   }));
   const missing=rows.filter(x=>
    !x.original3DSourceCandidatesFromNativeFilter.length).length;
   counts[klass==='visible'?'wholeSolidVisibleEdgesWithoutScopedSource':
    'wholeSolidHiddenEdgesWithoutScopedSource']+=missing;
   counts.paperAliasedWholeSolidEdgesWithMultipleOriginalSources+=
    rows.filter(x=>x.original3DSourceCandidatesFromNativeFilter.length>1).length;
   views[view][klass]=rows;
  }
  // Union the REAL source-filtered HLR outputs, but label all intervals
  // PAPER-DERIVED CANDIDATES. This reports exact binary64 gaps, including
  // one-ULP holes, without certifying original TopoDS parameter history.
  views[view].sourceParameterCandidates=ids.map(source=>{
   const [a,b]=projectedOriginalBySource.get(source)[view];
   const collapsed=!(Math.hypot(b.u-a.u,b.v-a.v)>0);
   const ranges=sourceRanges.get(source);
    const affineWitnesses=exactAffineWitnesses.get(source);
    const exactAffineCollinearity=affineWitnesses.length>0&&
     affineWitnesses.every(x=>x.bothNativeEndpointsExactlyOnOriginalBinary64PaperLine);
    if(!collapsed&&affineWitnesses.length>0&&!exactAffineCollinearity)
     counts.projectedSourcesWithExactAffinePaperMismatch++;
   const coverage=collapsed?null:
    exactCandidateIntervalCoverage([0,1],ranges);
   const exactPaperCoverage=collapsed?null:
    auditExactBinary64PaperCandidateCoverage({
     sourceFrom:a,sourceTo:b,segments:exactPaperSegments.get(source)
    });
   if(exactPaperCoverage?.exactBinary64PaperCandidateCoverageComplete)
    counts.projectedSourcesWithFullExactBinary64PaperCandidateCoverage++;
   else if(exactPaperCoverage)
    counts.projectedSourcesWithExactBinary64PaperCandidateGaps++;
   if(coverage?.entireOriginalParameterIntervalCovered===true&&
      exactPaperCoverage?.exactBinary64PaperCandidateCoverageComplete===false)
    counts.projectedSourcesWithRoundedFalseFullPaperCandidateCoverage++;
   const classOverlap=collapsed?null:exactCandidateVisibilityClassOverlap(
    classRanges.visible.get(source),classRanges.hidden.get(source)
   );
   const exactClassOverlap=collapsed?null:
    auditExactBinary64PaperVisibilityConflict({
     sourceFrom:a,sourceTo:b,
     visibleSegments:exactClassSegments.visible.get(source),
     hiddenSegments:exactClassSegments.hidden.get(source)
    });
   if(exactClassOverlap?.hasExactPositiveLengthVisibleHiddenPaperClassConflict){
    counts.projectedSourcesWithExactVisibleHiddenCandidateConflicts++;
    counts.exactPositiveLengthVisibleHiddenCandidateConflictIntervalCount+=
     exactClassOverlap.exactBinary64PaperPositiveLengthVisibleHiddenConflictIntervals.length;
    if(!classOverlap.hasPositiveLengthVisibleHiddenClassConflict)
     counts.projectedSourcesWithRoundedMissedVisibleHiddenCandidateConflicts++;
   }
   if(classOverlap?.hasPositiveLengthVisibleHiddenClassConflict){
    counts.projectedSourcesWithVisibleHiddenCandidateConflicts++;
    counts.positiveLengthVisibleHiddenCandidateConflictIntervalCount+=
     classOverlap.paperDerivedPositiveLengthVisibleHiddenConflictIntervals.length;
   }
   if(coverage?.entireOriginalParameterIntervalCovered)
    counts.projectedSourcesWithFullPaperCandidateCoverage++;
   else if(coverage)
    counts.projectedSourcesWithPositivePaperCandidateGaps++;
   return {
    originalPhysicalSourceEdgeId:source,
    originalProjectedEdgeCollapsed:collapsed,
    paperDerivedOriginalSourceParameterCandidateIntervals:
     ranges.map(range=>[...range]),
    exactBinary64PaperParameterDiagnostics:
     exactPaperDiagnostics.get(source),
     exactBinary64PaperAffineWitnesses:affineWitnesses,
     allReceivedNativePaperEndpointsExactlyCollinearWithOriginalSource:
      exactAffineCollinearity,
    // These exact rational gaps are PAPER candidate diagnostics only.
    // Never promote their absence to TopoDS history or V5 authority.
    exactBinary64PaperCandidateCoverage:exactPaperCoverage,
    exactBinary64PaperVisibleHiddenClassOverlap:exactClassOverlap,
    paperDerivedVisibleCandidateParameterUnion:
     classOverlap?.paperDerivedVisibleOriginalSourceParameterUnion??null,
    paperDerivedHiddenCandidateParameterUnion:
     classOverlap?.paperDerivedHiddenOriginalSourceParameterUnion??null,
    paperDerivedPositiveLengthVisibleHiddenConflictIntervals:
     classOverlap?.paperDerivedPositiveLengthVisibleHiddenConflictIntervals??null,
    paperDerivedPositiveLengthVisibleHiddenConflictDetected:
     classOverlap?.hasPositiveLengthVisibleHiddenClassConflict??false,
    paperDerivedPositiveLengthUncoveredCandidateIntervals:
     coverage?.positiveLengthUncoveredIntervals??null,
    entireOriginalSourcePaperCandidateIntervalCovered:
     coverage?.entireOriginalParameterIntervalCovered===true&&
     exactPaperCoverage?.exactBinary64PaperCandidateCoverageComplete===true,
    // A received paper segment can cover t=[0,1] yet drift transversely.
     // This stricter result remains paper-only, never TopoDS/M5/V5 proof.
     fullOriginalPaperCandidateCoverageWithExactAffineCollinearity:
      coverage?.entireOriginalParameterIntervalCovered===true&&
      exactPaperCoverage?.exactBinary64PaperCandidateCoverageComplete===true&&
      exactAffineCollinearity,
     fullOriginalPaperCandidateCoverageWithoutClassConflict:
     coverage?.entireOriginalParameterIntervalCovered===true&&
     exactPaperCoverage?.exactBinary64PaperCandidateCoverageComplete===true&&
     classOverlap?.hasPositiveLengthVisibleHiddenClassConflict===false&&
     exactClassOverlap?.hasExactPositiveLengthVisibleHiddenPaperClassConflict===false,
    actualOriginalTopoDSParameterCoverageCertified:false,
    nativeOriginal3DEndpointTopologyProven:false,
    continuousOcclusionCertified:false,
    engineeringLineStyle:'undetermined',signedV5Action:false
   };
  });
 }
 // Join all actual WHOLE-SOLID generated 2D HLR edge ordinals against
 // original TopoDS edge-filtered HLR, with strict original native 3D
 // same-class backing. A unique source-filtered candidate is evidence,
 // never a fabricated original/generated TShape or official line style.
 const globalNativeHLRSourceScopeRebinding=nativeM4Available?
  auditC1WholeSolidNativeHLRSourceScopeRebinding({cad,views}):null;
 if(nativeM4Available&&globalNativeHLRSourceScopeRebinding.counts.
    wholeSolidNativeHLREdges!==
      VIEWS.reduce((n,v)=>n+cad.views[v].length+
       cad.hiddenSharpViews[v].length,0))
  throw new RangeError('whole-solid OCCT generated 2D HLR edge inventory was not fully rebound');
 return frozen({schema:'draftai-c1-real-source-scoped-hlr-m5-consumer/1',
  sourceGeometryId:geometry.id,revision:cad.revision,unit:'mm',
  views,counts,globalNativeHLRSourceScopeRebinding,
  actualOriginalTopoDSSourceFilteredHLRConsumed:true,
  nativeOriginal3DToM4ProjectionConsumerAvailable:nativeM4Available,
  nativeOriginal3DProjectionIsNotGenerated2DSourceHistory:true,
  generatedToOriginalTopoDSFullHistoryCertified:false,
  paperDerivedVisibleHiddenSourceConflictsDetected:
   counts.projectedSourcesWithVisibleHiddenCandidateConflicts>0||
   counts.projectedSourcesWithExactVisibleHiddenCandidateConflicts>0,
  globalContinuousVisibilityCertified:false,
  formalEngineeringLineStyleCertified:false,signedV5ActionCount:0});
}
module.exports={auditC1NativeScopedHLRSourceConsumer};
