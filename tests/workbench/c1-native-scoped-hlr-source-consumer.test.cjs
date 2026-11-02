'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {
 auditC1NativeScopedHLRSourceConsumer:audit,
 auditC1ParameterizedSourceMatchAgainstNativeM4:auditParameterizedM4
}=require('../../workbench/c1-native-scoped-hlr-source-consumer.cjs');
const {project}=require('../../core/projection/conventions.js');
const {exactCandidateIntervalCoverage,exactCandidateVisibilityClassOverlap}=
 require('../../workbench/c1-original-source-interval-coverage.cjs');
function outlineSegment(view,sourceEdgeId,klass,nativeRange,m0Range){
 return {view,sourceEdgeId,native3DHLRClass:klass,
  originalNative3DParameterRange:[...nativeRange],
  originalM0UnitParameterRange:[...m0Range],
  derivedFromOriginalNative3DOutlineNotGeneratedHLRPaper:true,
  generated2DHLREdgeTopologyProven:false,
  completeGlobalCoProjectedVisibilityCertified:false,
  engineeringLineStyle:'undetermined',signedV5Action:false};
}
function fixture(){
 const geometry={id:'g',data:{points:{
  A:{x:0,y:0,z:0},B:{x:10,y:2,z:3},
  C:{x:0,y:1,z:0},D:{x:10,y:3,z:3}},
  edges:[['A','B'],['C','D']]}};
 const id0='g::A|B',id1='g::C|D';
 const paper=(view,source)=>{
  const edge=source===id0?geometry.data.edges[0]:geometry.data.edges[1];
  const [a,b]=edge.map(id=>project(geometry.data.points[id])[view]);
  return {from:{...a},to:{...b}};
 };
 const witness=(view,source)=>({
  view,hlrClass:'visible-sharp',originalPhysicalSourceEdgeId:source,
  globalPaperCandidateOrdinals:[0],
  globalDirectSameGeneratedTopoDSOrdinals:[],
  actualNativeScopedToGlobalGeneratedEdgeIsSameProven:false,
  fullOriginalSourceParameterCoverageProven:false,
  globalContinuousOcclusionProven:false,
  engineeringLineStyle:'undetermined',signedV5Action:false,
  ...paper(view,source)
 });
 const parameterMatch=(source,range=[0,1])=>({
  sourceEdgeId:source,matched:true,originalTopoDSEdgeIdentityProven:true,
  original3DCurveParameterRange:[0,1],originalBRepParameterRangeMatches:true,
  originalBRepSourceParameterRange:[0,1],
  sourceProjected2DParameterRange:[0,1],
  sourceProjected2DParameterRangeSorted:[0,1],
  sourceProjected2DParameterRangeMatchesGeneratedOutputRange:
   range[0]===0&&range[1]===1,
  sourceProjected2DParameterEndpointResiduals:[range[0],range[1]-1],
  source3DParameterRange:[...range],
  generated2DParameterRange:[...range],
  maximumProjectedPointResidualMm:0,maximumParameterRoundTripResidual:0,
  samples:[0,0.25,0.5,0.75,1].map(f=>{
   const t=range[0]+(range[1]-range[0])*f;
   return {generated2DParameter:t,source3DParameter:t,
    parameterRoundTripResidual:0,
    sourceProjectedPointMm:[t,2*t],generatedProjectedPointMm:[t,2*t],
    projectedPointResidualMm:0};
  }),
  generated2DTopoDSHistoryProven:false,
  engineeringLineStyle:'undetermined',signedV5Action:false
 });
 const parameterReport=(matches,generatedOutputEdgeCount)=>({
  schema:'draftai-c1-ocjs-generated-2d-source-parameter-match/1',
  sourceCurveCandidateCount:2,topoDSIdentityBoundSourceCurveCount:2,
  topoDSParameterDomainBoundSourceCurveCount:2,generatedOutputEdgeCount,
  uniqueParameterizedSourceMatchCount:matches.filter(x=>x.length===1).length,
  ambiguousParameterizedSourceMatchCount:matches.filter(x=>x.length>1).length,
  unmatchedGeneratedOutputEdgeCount:matches.filter(x=>x.length===0).length,
  rows:matches.map((candidateSourceMatches,ordinal)=>({
   ordinal,candidateSourceMatchCount:candidateSourceMatches.length,
   candidateSourceMatches,rejectedSourceCandidateCount:2-candidateSourceMatches.length,
   uniqueOriginalSourceEdgeId:candidateSourceMatches.length===1?
    candidateSourceMatches[0].sourceEdgeId:null,
   status:candidateSourceMatches.length===0?
    'no-parameterized-source-curve-match':
    candidateSourceMatches.length===1?
     'unique-parameterized-source-curve-match':
     'ambiguous-parameterized-source-curve-match'
  })),
  generated2DTopoDSHistoryProven:false,
  globalContinuousVisibilityProven:false,
  engineeringLineStyle:'undetermined',signedV5ActionCount:0
 });
 const cad={sourceGeometryId:'g',revision:3,views:{},hiddenSharpViews:{},
  nativeHLRSourceHistoryAPISurfaceByView:{},
  nativeSourceScopedSharpOutputByView:{}};
 for(const view of ['V','H','W']){
  cad.views[view]=[{...paper(view,id0),
   projectedOriginalEdgeCandidates:[id0],
   actualOCCTHLRCurveParameterRange:[0,1],
   actualOCCTHLRCurveSampleToleranceMm:1e-6}];
  cad.hiddenSharpViews[view]=[];
  cad.nativeHLRSourceHistoryAPISurfaceByView[view]={
   originalDataStructureIndex:{
    availability:'real-native-edge-map-inspected',
    everyOriginalBRepSourcePresentInHLRDataStructure:true,
    indexedOriginalSources:[
     {originalPhysicalSourceEdgeId:id0,hlrDataStructureOneBasedEdgeIndex:1,
      directlySameOriginalTopoDSInputEdge:true},
     {originalPhysicalSourceEdgeId:id1,hlrDataStructureOneBasedEdgeIndex:2,
      directlySameOriginalTopoDSInputEdge:true}
    ]}};
  cad.nativeSourceScopedSharpOutputByView[view]={
   schema:'draftai-c1-ocjs-real-original-topods-scoped-hlr/1',
   sourceEdgeCount:2,originalTopoDSEdgeIndexCheckedAgainstActualHLREdgeMap:true,
   allScopedOutputsReboundToWholeSolidPaper:true,
   fullGlobalGeneratedEdgeToOriginalSourceHistoryProven:false,
   fullContinuousVisibilityProven:false,signedV5ActionCount:0,
   nativeSourceScopedOutputEdgeCount:1,
   nativeScopedToWholeSolidGeneratedIsSameCount:0,
   paperOnlyScopedOutputEdgeCount:1,
   rows:[
    {originalPhysicalSourceEdgeId:id0,hlrDataStructureOneBasedEdgeIndex:1,
     visible:[witness(view,id0)],hidden:[]},
    {originalPhysicalSourceEdgeId:id1,hlrDataStructureOneBasedEdgeIndex:2,
     visible:[],hidden:[]}
   ],
   generated2DSourceParameterMatches:{
    visible:parameterReport([[parameterMatch(id0)]],1),
    hidden:parameterReport([],0)
   }
  };
  cad.nativeHLRSourceHistoryAPISurfaceByView[view].generated2DSourceParameterMatches=
   cad.nativeSourceScopedSharpOutputByView[view].generated2DSourceParameterMatches;
 }
 return {geometry,cad,id0,id1,witness,paper,parameterMatch,parameterReport};
}
test('actual native V/H/W scoped-source ledger is consumed but does not sign V5',()=>{
 const x=fixture(),r=audit(x);
 assert.equal(r.actualOriginalTopoDSSourceFilteredHLRConsumed,true);
 assert.equal(r.counts.nativeSourceScopedOutputEdges,3);
 assert.equal(r.counts.nativeGeneratedIsSameMatches,0);
 assert.equal(r.counts.paperOnlySourceScopedEdges,3);
 for(const view of ['V','H','W']){
  assert.deepEqual(r.views[view].visible[0].original3DSourceCandidatesFromNativeFilter,[x.id0]);
  assert.equal(r.views[view].visible[0].originalTopoDSHistoryProven,false);
  assert.equal(r.views[view].visible[0].signedV5Action,false);
 }
 assert.equal(r.signedV5ActionCount,0);
});
test('two different original 3D edges with identical paper output remain ambiguous',()=>{
 const x=fixture();
 // The original model edges differ in 3D depth; no 2D point can resolve it.
 // In the FRONT (V) view the two edges project onto the same line;
 // in H/W their different y positions must not be treated as identical.
 const view='V',c=x.cad.nativeSourceScopedSharpOutputByView[view];
 c.rows[1].visible.push(x.witness(view,x.id1));
 c.nativeSourceScopedOutputEdgeCount=2;c.paperOnlyScopedOutputEdgeCount=2;
 x.cad.views[view][0].projectedOriginalEdgeCandidates.push(x.id1);
 const r=audit(x);
 assert.equal(r.counts.paperAliasedWholeSolidEdgesWithMultipleOriginalSources,1);
 assert.deepEqual(r.views.V.visible[0].original3DSourceCandidatesFromNativeFilter,
  [x.id0,x.id1]);
 assert.equal(r.formalEngineeringLineStyleCertified,false);
});
test('one-ULP original source gap is not closed by native source-scoped paper matches',()=>{
 const x=fixture(),r=audit(x);
 assert.equal(r.counts.nativeSourceScopedOutputEdges,3);
 const next=0.5000000000000001;
 const gap=exactCandidateIntervalCoverage([0,1],[[0,0.5],[next,1]]);
 assert.deepEqual(gap.positiveLengthUncoveredIntervals,[[0.5,next]]);
 assert.equal(gap.entireOriginalParameterIntervalCovered,false);
 assert.equal(r.globalContinuousVisibilityCertified,false);
});
test('forged source-scoped V/H/W source identity or original EdgeMap index is rejected',()=>{
 for(const view of ['V','H','W']){
  for(const mutate of [
   c=>{c.rows[0].originalPhysicalSourceEdgeId='g::A|fake';},
   c=>{c.rows[0].hlrDataStructureOneBasedEdgeIndex=2;},
   c=>{c.rows[1].originalPhysicalSourceEdgeId='g::A|B';},
   c=>{c.rows[0].visible[0].originalPhysicalSourceEdgeId='g::C|D';},
   c=>{c.rows[0].visible[0].globalPaperCandidateOrdinals=[9];},
   c=>{c.rows[0].visible[0].globalPaperCandidateOrdinals=[0,0];},
   c=>{c.rows[0].visible[0].to.u=11;},
   c=>{c.rows[0].visible[0].signedV5Action=true;},
   c=>{c.rows[0].visible[0].engineeringLineStyle='solid';},
   c=>{c.nativeSourceScopedOutputEdgeCount=0;},
   c=>{c.fullGlobalGeneratedEdgeToOriginalSourceHistoryProven=true;}
  ]){
   const x=fixture();mutate(x.cad.nativeSourceScopedSharpOutputByView[view]);
   assert.throws(()=>audit(x),/source|HLR|OCCT|unsigned|ordinal|accounting|witness/i);
  }
 }
});
test('false native IsSame, stale revision, missing original source candidate and forged visibility cannot pass',()=>{
 const x=fixture();x.cad.nativeSourceScopedSharpOutputByView.W.rows[0].visible[0].
  actualNativeScopedToGlobalGeneratedEdgeIsSameProven=true;
 assert.throws(()=>audit(x),/unsigned OCCT source-scoped/);
 const y=fixture();y.cad.sourceGeometryId='different';
 assert.throws(()=>audit(y),/current C1 M0/);
 const z=fixture();z.cad.views.H[0].projectedOriginalEdgeCandidates=[];
 assert.throws(()=>audit(z),/contradicts whole-solid/);
 const w=fixture();w.cad.nativeSourceScopedSharpOutputByView.V.rows[0].
  visible[0].globalContinuousOcclusionProven=true;
 assert.throws(()=>audit(w),/unsigned OCCT/);
});

test('original M0 physical edges require distinct finite 3D endpoints in every view',()=>{
 for(const mutate of [
  x=>{x.geometry.data.edges[0]=['A','A'];},
  x=>{x.geometry.data.points.B={...x.geometry.data.points.A};},
  x=>{x.geometry.data.points.B.z=NaN;},
  x=>{x.geometry.data.points.A.x=Infinity;}
 ]){
  const x=fixture();mutate(x);
  assert.throws(()=>audit(x),/physical source|3D source edge/);
 }
});
test('V/H/W native EdgeMap source indices are injective, not merely source-ID unique',()=>{
 for(const view of ['V','H','W']){
  const x=fixture(),rows=x.cad.nativeHLRSourceHistoryAPISurfaceByView[view]
   .originalDataStructureIndex.indexedOriginalSources;
  rows[1].hlrDataStructureOneBasedEdgeIndex=rows[0].hlrDataStructureOneBasedEdgeIndex;
  x.cad.nativeSourceScopedSharpOutputByView[view].rows[1]
   .hlrDataStructureOneBasedEdgeIndex=rows[0].hlrDataStructureOneBasedEdgeIndex;
  assert.throws(()=>audit(x),/duplicated real native HLR source index/);
 }
});
test('one generated native HLR ordinal cannot certify two distinct original TopoDS edges',()=>{
 for(const view of ['V','H','W']){
  const x=fixture(),c=x.cad.nativeSourceScopedSharpOutputByView[view];
  // Deliberately distinct TopoDS source IDs with coincident 3D geometry:
  // both genuinely project to the same paper stroke in this view.
  x.geometry.data.points.C={...x.geometry.data.points.A};
  x.geometry.data.points.D={...x.geometry.data.points.B};
  x.cad.views[view][0].projectedOriginalEdgeCandidates.push(x.id1);
  c.rows[1].visible.push(x.witness(view,x.id1));
  c.nativeSourceScopedOutputEdgeCount=2;
  c.nativeScopedToWholeSolidGeneratedIsSameCount=2;
  c.paperOnlyScopedOutputEdgeCount=0;
  for(const row of c.rows){
   row.visible[0].globalDirectSameGeneratedTopoDSOrdinals=[0];
   row.visible[0].actualNativeScopedToGlobalGeneratedEdgeIsSameProven=true;
  }
  assert.throws(()=>audit(x),/duplicate native generated HLR ordinal identity claim/);
 }
});
test('repeated native identity for one original source also fails; paper-only aliases remain unsigned',()=>{
 const x=fixture(),c=x.cad.nativeSourceScopedSharpOutputByView.H;
 c.rows[0].visible.push({...x.witness('H',x.id0),
  globalDirectSameGeneratedTopoDSOrdinals:[0],
  actualNativeScopedToGlobalGeneratedEdgeIsSameProven:true});
 c.rows[0].visible[0].globalDirectSameGeneratedTopoDSOrdinals=[0];
 c.rows[0].visible[0].actualNativeScopedToGlobalGeneratedEdgeIsSameProven=true;
 c.nativeSourceScopedOutputEdgeCount=2;
 c.nativeScopedToWholeSolidGeneratedIsSameCount=2;
 c.paperOnlyScopedOutputEdgeCount=0;
 assert.throws(()=>audit(x),/duplicate native generated HLR ordinal identity claim/);
 const y=fixture(),r=audit(y);
 assert.equal(r.signedV5ActionCount,0);
 assert.equal(r.generatedToOriginalTopoDSFullHistoryCertified,false);
});


test('scoped source labels cannot forge a different M0 projected line in any first-angle view',()=>{
 for(const view of ['V','H','W']){
  const x=fixture(),c=x.cad.nativeSourceScopedSharpOutputByView[view];
  // Change the global stroke AND filtered native witness together:
  // simple scoped-to-global paper comparison would accept this forgery.
  c.rows[0].visible[0].from.v+=2;
  c.rows[0].visible[0].to.v+=2;
  x.cad.views[view][0].from.v+=2;
  x.cad.views[view][0].to.v+=2;
  assert.throws(()=>audit(x),/original M0 3D projection/);
 }
});
test('native source-scoped candidate cannot extend past either actual M0 edge endpoint',()=>{
 for(const view of ['V','H','W']){
  const x=fixture(),w=x.cad.nativeSourceScopedSharpOutputByView[view].rows[0].visible[0];
  const a=x.paper(view,x.id0).from,b=x.paper(view,x.id0).to;
  w.to={u:b.u+(b.u-a.u)*0.2,v:b.v+(b.v-a.v)*0.2};
  x.cad.views[view][0].to={...w.to};
  assert.throws(()=>audit(x),/original M0 3D projection/);
 }
});
test('genuine partial source-filtered HLR strokes stay candidates without GB or V5',()=>{
 for(const view of ['V','H','W']){
  const x=fixture(),w=x.cad.nativeSourceScopedSharpOutputByView[view].rows[0].visible[0];
  const a=x.paper(view,x.id0).from,b=x.paper(view,x.id0).to;
  w.from={u:a.u+(b.u-a.u)*0.25,v:a.v+(b.v-a.v)*0.25};
  w.to={u:a.u+(b.u-a.u)*0.75,v:a.v+(b.v-a.v)*0.75};
  x.cad.views[view][0].from={...w.from};
  x.cad.views[view][0].to={...w.to};
  const result=audit(x);
  assert.deepEqual(result.views[view].visible[0].original3DSourceCandidatesFromNativeFilter,[x.id0]);
  assert.equal(result.generatedToOriginalTopoDSFullHistoryCertified,false);
  assert.equal(result.globalContinuousVisibilityCertified,false);
  assert.equal(result.signedV5ActionCount,0);
 }
});
test('a source whose projection collapses to a point cannot own a positive native HLR line',()=>{
 const x=fixture();
 x.geometry.data.points.B.y=0;
 x.geometry.data.points.B.z=0;
 // W projects only Y,Z; the existing filtered stroke is nondegenerate
 // but the original M0 source has zero W-view projected length.
 assert.throws(()=>audit(x),/original M0 3D projection/);
});
test('zero-length native source-scoped HLR stroke is not a positive edge witness',()=>{
 const x=fixture(),view='V';
 const w=x.cad.nativeSourceScopedSharpOutputByView[view].rows[0].visible[0];
 w.to={...w.from};x.cad.views[view][0].to={...w.from};
 assert.throws(()=>audit(x),/original M0 3D projection/);
});
test('submicron CAD paper rounding is candidate-only and never repairs source coverage',()=>{
 const x=fixture(),view='V',w=x.cad.nativeSourceScopedSharpOutputByView[view].rows[0].visible[0];
 w.from.v+=5e-7;w.to.v+=5e-7;
 x.cad.views[view][0].from.v+=5e-7;
 x.cad.views[view][0].to.v+=5e-7;
 const r=audit(x);
 assert.equal(r.views.V.visible[0].originalTopoDSHistoryProven,false);
 assert.equal(r.signedV5ActionCount,0);
 const next=0.5000000000000001;
 const gap=exactCandidateIntervalCoverage([0,1],[[0,0.5],[next,1]]);
 assert.deepEqual(gap.positiveLengthUncoveredIntervals,[[0.5,next]]);
});


test('real scoped HLR candidate intervals cover V/H/W only as paper evidence, not native history',()=>{
 const x=fixture(),r=audit(x);
 assert.equal(r.counts.projectedSourcesWithFullPaperCandidateCoverage,3);
 assert.equal(r.counts.projectedSourcesWithPositivePaperCandidateGaps,3);
 for(const view of ['V','H','W']){
  const [present,missing]=r.views[view].sourceParameterCandidates;
  assert.equal(present.originalPhysicalSourceEdgeId,x.id0);
  assert.deepEqual(present.paperDerivedOriginalSourceParameterCandidateIntervals,[[0,1]]);
  assert.deepEqual(present.paperDerivedPositiveLengthUncoveredCandidateIntervals,[]);
  assert.equal(present.entireOriginalSourcePaperCandidateIntervalCovered,true);
  assert.equal(present.actualOriginalTopoDSParameterCoverageCertified,false);
  assert.equal(present.nativeOriginal3DEndpointTopologyProven,false);
  assert.deepEqual(missing.paperDerivedPositiveLengthUncoveredCandidateIntervals,[[0,1]]);
  const projected=r.views[view].visible[0].paperDerivedOriginalSourceParameterCandidates;
  assert.equal(projected.length,1);
  assert.deepEqual(projected[0].paperDerivedOriginal3DEndpointVertexCandidates,['A','B']);
  assert.equal(projected[0].nativeOriginal3DEndpointTopologyProven,false);
  assert.equal(r.views[view].visible[0].signedV5Action,false);
 }
});
test('partial and reversed source-filtered HLR paper segments expose bounded candidate t and endpoint IDs',()=>{
 for(const view of ['V','H','W']){
  const x=fixture(),w=x.cad.nativeSourceScopedSharpOutputByView[view].rows[0].visible[0];
  const {from:a,to:b}=x.paper(view,x.id0);
  w.from={u:a.u+(b.u-a.u)*0.25,v:a.v+(b.v-a.v)*0.25};
  w.to={u:a.u+(b.u-a.u)*0.75,v:a.v+(b.v-a.v)*0.75};
  x.cad.views[view][0].from={...w.from};
  x.cad.views[view][0].to={...w.to};
  const r=audit(x),row=r.views[view].sourceParameterCandidates[0];
  assert.deepEqual(row.paperDerivedPositiveLengthUncoveredCandidateIntervals,
   [[0,0.25],[0.75,1]]);
  assert.deepEqual(r.views[view].visible[0].paperDerivedOriginalSourceParameterCandidates[0].
   paperDerivedOriginal3DEndpointVertexCandidates,[null,null]);
  assert.equal(row.entireOriginalSourcePaperCandidateIntervalCovered,false);
 }
 const y=fixture(),w=y.cad.nativeSourceScopedSharpOutputByView.H.rows[0].visible[0];
 [w.from,w.to]=[w.to,w.from];
 const r=audit(y),edge=r.views.H.visible[0].paperDerivedOriginalSourceParameterCandidates[0];
 assert.deepEqual(edge.paperDerivedOriginalSourceParameterCandidateRange,[0,1]);
 assert.deepEqual(edge.paperDerivedOriginal3DEndpointVertexCandidates,['B','A']);
});
test('real native paper aliases at different 3D depths do not prove a unique source or V5',()=>{
 const x=fixture(),v='V',scoped=x.cad.nativeSourceScopedSharpOutputByView[v];
 scoped.rows[1].visible.push(x.witness(v,x.id1));
 scoped.nativeSourceScopedOutputEdgeCount=2;
 scoped.paperOnlyScopedOutputEdgeCount=2;
 x.cad.views[v][0].projectedOriginalEdgeCandidates.push(x.id1);
 const r=audit(x);
 assert.equal(r.views.V.visible[0].paperDerivedOriginalSourceParameterCandidates.length,2);
 assert.equal(r.views.V.sourceParameterCandidates[0].entireOriginalSourcePaperCandidateIntervalCovered,true);
 assert.equal(r.views.V.sourceParameterCandidates[1].entireOriginalSourcePaperCandidateIntervalCovered,true);
 assert.equal(r.generatedToOriginalTopoDSFullHistoryCertified,false);
 assert.equal(r.signedV5ActionCount,0);
});
test('source-filtered real HLR split retains one-ULP positive original t gap',()=>{
 const x=fixture(),view='V',scoped=x.cad.nativeSourceScopedSharpOutputByView[view];
 const {from:a,to:b}=x.paper(view,x.id0);
 const point=t=>({u:a.u+(b.u-a.u)*t,v:a.v+(b.v-a.v)*t});
 const next=0.5000000000000001;
 const w=scoped.rows[0].visible[0];
 w.to=point(0.5);
 scoped.rows[0].visible.push({...w,from:point(next),to:point(1),
  globalPaperCandidateOrdinals:[1]});
 x.cad.views[view]=[
  {from:point(0),to:point(0.5),projectedOriginalEdgeCandidates:[x.id0]},
  {from:point(next),to:point(1),projectedOriginalEdgeCandidates:[x.id0]}
 ];
 scoped.nativeSourceScopedOutputEdgeCount=2;
 scoped.paperOnlyScopedOutputEdgeCount=2;
 const report=scoped.generated2DSourceParameterMatches.visible;
 report.generatedOutputEdgeCount=2;
 report.rows=[
  {ordinal:0,candidateSourceMatchCount:1,
   candidateSourceMatches:[x.parameterMatch(x.id0,[0,0.5])],
   rejectedSourceCandidateCount:1,uniqueOriginalSourceEdgeId:x.id0,
   status:'unique-parameterized-source-curve-match'},
  {ordinal:1,candidateSourceMatchCount:1,
   candidateSourceMatches:[x.parameterMatch(x.id0,[next,1])],
   rejectedSourceCandidateCount:1,uniqueOriginalSourceEdgeId:x.id0,
   status:'unique-parameterized-source-curve-match'}
 ];
 report.uniqueParameterizedSourceMatchCount=2;
 report.ambiguousParameterizedSourceMatchCount=0;
 report.unmatchedGeneratedOutputEdgeCount=0;
 // One original TopoDS curve can legitimately be split into several HLR edges.
 report.topoDSIdentityBoundSourceCurveCount=1;
 report.topoDSParameterDomainBoundSourceCurveCount=1;
 const r=audit(x),coverage=r.views.V.sourceParameterCandidates[0];
 assert.equal(r.views.V.parameterizedGlobalHLRSourceLineage.counts.
  uniqueParameterizedSourceLineage,2);
 assert.deepEqual(coverage.paperDerivedPositiveLengthUncoveredCandidateIntervals,
  [[0.5,next]]);
 assert.equal(coverage.entireOriginalSourcePaperCandidateIntervalCovered,false);
 assert.equal(r.signedV5ActionCount,0);
});
test('rounded paper endpoints cannot impersonate exact 3D vertex topology',()=>{
 const x=fixture(),view='V',w=x.cad.nativeSourceScopedSharpOutputByView[view].rows[0].visible[0];
 w.from.v+=5e-7;w.to.v+=5e-7;
 x.cad.views[view][0].from.v+=5e-7;
 x.cad.views[view][0].to.v+=5e-7;
 const r=audit(x),candidate=r.views.V.visible[0].paperDerivedOriginalSourceParameterCandidates[0];
 assert.deepEqual(candidate.paperDerivedOriginal3DEndpointVertexCandidates,[null,null]);
 assert.equal(candidate.actualNativeTopoDSParameterHistoryProven,false);
 assert.equal(r.signedV5ActionCount,0);
});

test('exact binary64 HLR class partition detects positive overlap, not an exactly shared endpoint',()=>{
 const touch=exactCandidateVisibilityClassOverlap(
  [[0,0.5]],[[0.5,1]]);
 assert.equal(touch.hasPositiveLengthVisibleHiddenClassConflict,false);
 assert.deepEqual(touch.paperDerivedPositiveLengthVisibleHiddenConflictIntervals,[]);
 const next=0.5000000000000001;
 const separated=exactCandidateVisibilityClassOverlap(
  [[0,0.5]],[[next,1]]);
 assert.equal(separated.hasPositiveLengthVisibleHiddenClassConflict,false);
 const real=exactCandidateVisibilityClassOverlap(
  [[0,0.8],[0.8,1]],[[0.2,0.6],[0.6,0.9]]);
 assert.deepEqual(real.paperDerivedVisibleOriginalSourceParameterUnion,[[0,1]]);
 assert.deepEqual(real.paperDerivedPositiveLengthVisibleHiddenConflictIntervals,[[0.2,0.9]]);
 assert.equal(real.hasPositiveLengthVisibleHiddenClassConflict,true);
 assert.equal(real.actualNativeOcctFullVisibilityCertification,false);
 assert.equal(real.officialEngineeringLineStyle,'undetermined');
 assert.throws(()=>exactCandidateVisibilityClassOverlap([[0,NaN]],[]),/interval/);
});
test('native source-scoped HLR never treats simultaneously visible and hidden original 3D t intervals as certified',()=>{
 const x=fixture(),view='V',scoped=x.cad.nativeSourceScopedSharpOutputByView[view];
 const w=x.witness(view,x.id0);
 scoped.rows[0].hidden=[{...w,hlrClass:'hidden-sharp'}];
 x.cad.hiddenSharpViews[view]=[{
  ...x.paper(view,x.id0),projectedOriginalEdgeCandidates:[x.id0]
 }];
 scoped.nativeSourceScopedOutputEdgeCount=2;
 scoped.paperOnlyScopedOutputEdgeCount=2;
 scoped.generated2DSourceParameterMatches.hidden=
  x.parameterReport([[x.parameterMatch(x.id0)]],1);
 const r=audit(x),row=r.views.V.sourceParameterCandidates[0];
 assert.equal(row.entireOriginalSourcePaperCandidateIntervalCovered,true);
 assert.equal(row.paperDerivedPositiveLengthVisibleHiddenConflictDetected,true);
 assert.deepEqual(row.paperDerivedPositiveLengthVisibleHiddenConflictIntervals,[[0,1]]);
 assert.deepEqual(row.paperDerivedVisibleCandidateParameterUnion,[[0,1]]);
 assert.deepEqual(row.paperDerivedHiddenCandidateParameterUnion,[[0,1]]);
 assert.equal(row.fullOriginalPaperCandidateCoverageWithoutClassConflict,false);
 assert.equal(r.paperDerivedVisibleHiddenSourceConflictsDetected,true);
 assert.equal(r.counts.projectedSourcesWithVisibleHiddenCandidateConflicts,1);
 assert.equal(r.counts.positiveLengthVisibleHiddenCandidateConflictIntervalCount,1);
 assert.equal(r.generatedToOriginalTopoDSFullHistoryCertified,false);
 assert.equal(r.globalContinuousVisibilityCertified,false);
 assert.equal(r.formalEngineeringLineStyleCertified,false);
 assert.equal(r.signedV5ActionCount,0);
});


const {auditExactBinary64PaperParameterPair:exactPaperPair}=
 require('../../workbench/c1-exact-binary64-paper-parameter.cjs');
const paper=(u,v=0)=>({u,v});
test('M0 dyadic paper parameters reject a one-ULP overshoot and preserve reversed orientation',()=>{
 const relation=exactPaperPair({sourceFrom:paper(0),sourceTo:paper(1),
  measuredFrom:paper(-Number.MIN_VALUE),measuredTo:paper(1+Number.EPSILON)});
 assert.equal(relation.nativeFromWithinExactBinary64OriginalParameterDomain,false);
 assert.equal(relation.nativeToWithinExactBinary64OriginalParameterDomain,false);
 assert.equal(relation.nativePaperSourceParameterPairHasExactPositiveSpan,true);
 assert.equal(relation.generatedToOriginalTopoDSHistoryCertified,false);
 assert.equal(relation.engineeringLineStyle,'undetermined');
 assert.equal(relation.signedV5Action,false);
 const reversed=exactPaperPair({sourceFrom:paper(10),sourceTo:paper(0),
  measuredFrom:paper(2),measuredTo:paper(8)});
 assert.equal(reversed.exactBinary64OriginalSourceParameterOrder,-1);
 assert.equal(reversed.nativeFromWithinExactBinary64OriginalParameterDomain,true);
 assert.equal(reversed.nativeToWithinExactBinary64OriginalParameterDomain,true);
 const vertical=exactPaperPair({sourceFrom:paper(4,0),sourceTo:paper(4,5),
  measuredFrom:paper(4,1),measuredTo:paper(4,3)});
 assert.equal(vertical.dominantOriginalProjectionAxis,'v');
 assert.equal(vertical.exactBinary64OriginalSourceParameterOrder,1);
 assert.throws(()=>exactPaperPair({sourceFrom:paper(0),sourceTo:paper(0),
  measuredFrom:paper(0),measuredTo:paper(0)}),/invertible/);
});
test('positive exact binary64 paper interval survives even if rounded t inverse underflows',()=>{
 const relation=exactPaperPair({sourceFrom:paper(0),sourceTo:paper(1e300),
  measuredFrom:paper(0),measuredTo:paper(Number.MIN_VALUE)});
 assert.equal(Number.MIN_VALUE/1e300,0);
 assert.equal(relation.nativePaperSourceParameterPairHasExactPositiveSpan,true);
 assert.equal(relation.exactBinary64OriginalSourceParameterOrder,1);
 assert.equal(relation.nativeToWithinExactBinary64OriginalParameterDomain,true);
});
test('source-scoped HLR one-ULP outside M0 domain cannot fill paper parameter coverage',()=>{
 const x=fixture(),w=x.cad.nativeSourceScopedSharpOutputByView.V.rows[0].visible[0];
 w.from.u=-Number.MIN_VALUE;
 x.cad.views.V[0].from.u=-Number.MIN_VALUE;
 const result=audit(x),row=result.views.V.sourceParameterCandidates[0];
 assert.equal(result.counts.sourceScopedPaperEndpointsOutsideExactBinary64Domain,1);
 assert.equal(row.exactBinary64PaperParameterDiagnostics.length,1);
 assert.equal(row.exactBinary64PaperParameterDiagnostics[0].
  nativeFromWithinExactBinary64OriginalParameterDomain,false);
 assert.equal(row.exactBinary64PaperParameterDiagnostics[0].
  paperDerivedCandidateIntervalRetained,false);
 assert.deepEqual(row.paperDerivedPositiveLengthUncoveredCandidateIntervals,[[0,1]]);
 assert.equal(row.actualOriginalTopoDSParameterCoverageCertified,false);
 assert.equal(result.signedV5ActionCount,0);
});
test('distinct native HLR paper endpoints whose rounded inverse t collapses stay unbound',()=>{
 const x=fixture(),w=x.cad.nativeSourceScopedSharpOutputByView.V.rows[0].visible[0];
 w.to={u:Number.MIN_VALUE,v:0};
 x.cad.views.V[0].to={...w.to};
 const result=audit(x),row=result.views.V.sourceParameterCandidates[0];
 assert.equal(result.counts.sourceScopedPaperPositiveIntervalsLostByRoundedInverse,1);
 assert.equal(result.counts.sourceScopedPaperStrokesWithUnboundParameters,1);
 assert.equal(row.exactBinary64PaperParameterDiagnostics[0].
  nativePaperSourceParameterPairHasExactPositiveSpan,true);
 assert.deepEqual(row.exactBinary64PaperParameterDiagnostics[0].
  roundedPaperInverseParameters,[0,0]);
 assert.deepEqual(row.paperDerivedPositiveLengthUncoveredCandidateIntervals,[[0,1]]);
 assert.equal(result.globalContinuousVisibilityCertified,false);
 assert.equal(result.signedV5ActionCount,0);
});

test('cross-axis exact affine witness separates paper rounding from full 3D source proof',()=>{
 const x=fixture(),base=audit(x);
 for(const view of ['V','H','W']){
  const row=base.views[view].sourceParameterCandidates[0];
  assert.equal(row.allReceivedNativePaperEndpointsExactlyCollinearWithOriginalSource,true);
  assert.equal(row.fullOriginalPaperCandidateCoverageWithExactAffineCollinearity,true);
  assert.equal(row.actualOriginalTopoDSParameterCoverageCertified,false);
 }
 const view='V',w=x.cad.nativeSourceScopedSharpOutputByView[view].rows[0].visible[0];
 w.from.v+=5e-7;w.to.v+=5e-7;
 x.cad.views[view][0].from.v+=5e-7;
 x.cad.views[view][0].to.v+=5e-7;
 const result=audit(x),row=result.views.V.sourceParameterCandidates[0];
 // The previous weaker dominant-axis check once returned TRUE here.
 // This must now remain FALSE because received u,v are transversely
 // displaced from the actual original M0 source's exact affine line.
 assert.equal(row.exactBinary64PaperCandidateCoverage.
  exactBinary64PaperCandidateCoverageComplete,true);
 assert.equal(row.entireOriginalSourcePaperCandidateIntervalCovered,false);
 assert.equal(row.strictTwoAxisPaperOnlyCoverageComplete,false);
 assert.equal(row.exactTwoAxisQualifiedNativePaperCoverage.
  falseDominantAxisFullCoverageVetoed,true);
 assert.equal(row.allReceivedNativePaperEndpointsExactlyCollinearWithOriginalSource,false);
 assert.equal(row.fullOriginalPaperCandidateCoverageWithExactAffineCollinearity,false);
 assert.equal(result.counts.sourceScopedPaperEndpointsOffExactBinary64OriginalLine,2);
 assert.equal(result.counts.projectedSourcesWithExactAffinePaperMismatch,1);
 assert.equal(row.exactBinary64PaperAffineWitnesses.length,1);
 assert.equal(row.exactBinary64PaperParameterDiagnostics[0].
  exactBinary64PaperAffineWitness.bothNativeEndpointsExactlyOnOriginalBinary64PaperLine,false);
 assert.equal(row.engineeringLineStyle,'undetermined');
 assert.equal(result.signedV5ActionCount,0);
});

test('V/H/W independent consumer rejects disjoint tiny native scoped fragments even with forged paper ordinal',()=>{
 for(const view of ['V','H','W']){
  const x=fixture();
  x.geometry.data.points.B={x:1e-10,y:2e-10,z:3e-10};
  for(const v of ['V','H','W']){
   const p=x.paper(v,x.id0);
   x.cad.views[v][0].from={...p.from};
   x.cad.views[v][0].to={...p.to};
   const w=x.cad.nativeSourceScopedSharpOutputByView[v].rows[0].visible[0];
   w.from={...p.from};w.to={...p.to};
  }
  const p=x.paper(view,x.id0);
  const midpoint={u:(p.from.u+p.to.u)/2,v:(p.from.v+p.to.v)/2};
  x.cad.views[view][0].to={...midpoint};
  x.cad.nativeSourceScopedSharpOutputByView[view].rows[0].visible[0].from={...midpoint};
  assert.throws(()=>audit(x),/contradicts whole-solid HLR physical source/);
 }
});

test('V/H/W tiny original M0 sources cannot absorb remote native HLR lines within old absolute paper tolerance',()=>{
 for(const view of ['V','H','W']){
  const x=fixture();
  x.geometry.data.points.B={x:1e-10,y:2e-10,z:3e-10};
  for(const v of ['V','H','W']){
   const p=x.paper(v,x.id0);
   const global=x.cad.views[v][0];
   const w=x.cad.nativeSourceScopedSharpOutputByView[v].rows[0].visible[0];
   global.from={...p.from};global.to={...p.to};
   w.from={...p.from};w.to={...p.to};
  }
  const global=x.cad.views[view][0];
  const w=x.cad.nativeSourceScopedSharpOutputByView[view].rows[0].visible[0];
  for(const seg of [global,w]){
   seg.from.v+=1e-8;seg.to.v+=1e-8;
  }
  assert.throws(()=>audit(x),/original M0 3D projection/);
 }
});

test('existing HLR consumer exposes original native 3D M4 candidates without signing false paper history',()=>{
 const x=fixture();
 Object.assign(x.geometry,{kind:'mesh',space:'model-3d',unit:'mm'});
 x.cad.actualOCCTCurveTypeIndependentlyVerified=true;
 x.cad.originalBRepSourceEdges=x.geometry.data.edges.map(edge=>{
  const [a,b]=edge.map(id=>x.geometry.data.points[id]);
  return {sourceEdgeId:x.geometry.id+'::'+[...edge].sort().join('|'),
   occtSourceCurveType:'line',
   // Synthetic test BRep agrees exactly with this fixture's original M0
   // vertices. This is not a claim about any production generated HLR edge.
   originalOCCTBRepVertexXYZMatched:true,
   fromOCCT3D:{...a},toOCCT3D:{...b},
   occtSourceCurve3DEndpointsAndMidpointVerified:true,
   occtSourceCurveParameterRange:[0,1],
   occtSourceCurveFirstPoint3D:a,occtSourceCurveLastPoint3D:b};
 });
 for(const view of ['V','H','W']){
  for(const row of x.cad.nativeSourceScopedSharpOutputByView[view].rows){
   const source=x.cad.originalBRepSourceEdges.find(c=>
    c.sourceEdgeId===row.originalPhysicalSourceEdgeId);
   const edge={
    nativeSourceFilterOriginalEdgeId:source.sourceEdgeId,
    native3DHLRClass:'visible-sharp',
    nativeOriginalCurveParameterRange:[...source.occtSourceCurveParameterRange],
    native3DCurveExactlySameAsOriginalAtThreeParameters:true,
    originalGeneratedTopoDSHistoryCertified:false,signedV5Action:false
   };
   row.visible3D={nativeSourceFilteredOriginalTopoDSEdge:true,
    native3DGeneratedCurveIntervals:row.visible.length?[edge]:[]};
   row.hidden3D={nativeSourceFilteredOriginalTopoDSEdge:true,
    native3DGeneratedCurveIntervals:[]};
  }
 }
 const out=audit(x);
 assert.equal(out.nativeOriginal3DToM4ProjectionConsumerAvailable,true);
 assert.equal(out.counts.nativeOriginal3DM4SourceViewCandidates,6);
 assert.equal(out.counts.nativeOriginal3DM4ProjectedClassSegments,3);
 for(const view of ['V','H','W']){
  const rows=out.views[view].nativeOriginal3DM4Candidates;
  assert.equal(rows.length,2);
  assert.equal(rows[0].M4OriginalUnitIntervalCandidateCoverageComplete,true);
  assert.equal(rows[0].segments[0].native3DHLRClass,'visible-sharp');
  assert.equal(rows[0].segments[0].generated2DHLREdgeTopologyProven,false);
  assert.equal(rows[1].M4OriginalUnitIntervalCandidateCoverageComplete,false);
  assert.equal(rows[1].officialV5Authorized,false);
 }
 assert.equal(out.formalEngineeringLineStyleCertified,false);
 assert.equal(out.signedV5ActionCount,0);
});

test('native V/H/W source consumer now jointly certifies only exact BOTH-axis candidate paper',()=>{
 const x=fixture(),r=audit(x);
 assert.equal(r.counts.projectedSourcesWithStrictTwoAxisFullPaperCoverage,3);
 assert.equal(r.counts.projectedSourcesWithStrictTwoAxisPositivePaperResiduals,3);
 assert.equal(r.counts.projectedSourcesWithFalseDominantAxisFullCoverageVetoed,0);
 assert.equal(r.counts.sourceScopedGenerated2DSegmentsTransverselyOffOriginalSource,0);
 for(const v of ['V','H','W']){
  const [present,absent]=r.views[v].sourceParameterCandidates;
  assert.equal(present.strictTwoAxisPaperOnlyCoverageComplete,true);
  assert.equal(present.entireOriginalSourcePaperCandidateIntervalCovered,true);
  assert.equal(present.exactTwoAxisQualifiedNativePaperCoverage.
   strictReceivedTwoAxisPaperCoverageComplete,true);
  assert.equal(absent.strictTwoAxisPaperOnlyCoverageComplete,false);
  assert.deepEqual(absent.exactTwoAxisQualifiedNativePaperCoverage.
   exactTwoAxisQualifiedPaperCoverage.
   exactBinary64PaperPositiveLengthUncoveredIntervals,[['0','1']]);
  assert.equal(absent.signedV5Action,false);
 }
 assert.equal(r.generatedToOriginalTopoDSFullHistoryCertified,false);
 assert.equal(r.formalEngineeringLineStyleCertified,false);
 assert.equal(r.signedV5ActionCount,0);
});
test('all three real native view consumers veto false dominant-axis full coverage after transverse submicron drift',()=>{
 for(const [view,coordinate] of [['V','v'],['H','v'],['W','u']]){
  const x=fixture();
  const edge=x.cad.nativeSourceScopedSharpOutputByView[view].rows[0].visible[0];
  // Stay within the pre-existing 1e-6 candidate tolerance, but perturb
  // one orthogonal binary64 coordinate at one endpoint. The old single
  // dominant-axis inverse t will falsely cover t=[0,1].
  edge.from[coordinate]+=2e-7;
  x.cad.views[view][0].from[coordinate]=edge.from[coordinate];
  const r=audit(x),row=r.views[view].sourceParameterCandidates[0],
   measured=row.exactTwoAxisQualifiedNativePaperCoverage;
  assert.equal(row.exactBinary64PaperCandidateCoverage.
   exactBinary64PaperCandidateCoverageComplete,true,view);
  assert.equal(measured.unsafeDominantAxisOnlyCoverage.
   exactBinary64PaperCandidateCoverageComplete,true,view);
  assert.equal(measured.transverseDisplacedGeneratedSegments,1,view);
  assert.equal(measured.falseDominantAxisFullCoverageVetoed,true,view);
  assert.equal(row.strictTwoAxisPaperOnlyCoverageComplete,false,view);
  assert.equal(row.entireOriginalSourcePaperCandidateIntervalCovered,false,view);
  assert.equal(row.fullOriginalPaperCandidateCoverageWithoutClassConflict,false,view);
  assert.equal(row.fullOriginalPaperCandidateCoverageWithExactAffineCollinearity,false,view);
  assert.deepEqual(measured.exactTwoAxisQualifiedPaperCoverage.
   exactBinary64PaperPositiveLengthUncoveredIntervals,[['0','1']],view);
  assert.equal(r.counts.projectedSourcesWithFalseDominantAxisFullCoverageVetoed,1,view);
  assert.equal(r.counts.sourceScopedGenerated2DSegmentsTransverselyOffOriginalSource,1,view);
  assert.equal(r.signedV5ActionCount,0);
 }
});
test('genuine half-source native W paper remains an exact positive source gap, never invented hidden line',()=>{
 const x=fixture(),view='W';
 const w=x.cad.nativeSourceScopedSharpOutputByView[view].rows[0].visible[0];
 // Exactly collinear original W source (u,v): (0,0)->(2,3).
 w.to={u:1,v:1.5};x.cad.views[view][0].to={...w.to};
 const r=audit(x),row=r.views.W.sourceParameterCandidates[0];
 const strict=row.exactTwoAxisQualifiedNativePaperCoverage;
 assert.equal(strict.transverseDisplacedGeneratedSegments,0);
 assert.equal(strict.strictReceivedTwoAxisPaperCoverageComplete,false);
 assert.deepEqual(strict.exactTwoAxisQualifiedPaperCoverage.
  exactBinary64PaperPositiveLengthUncoveredIntervals,[['1/2','1']]);
 assert.equal(r.counts.projectedSourcesWithFalseDominantAxisFullCoverageVetoed,0);
 assert.equal(row.entireOriginalSourcePaperCandidateIntervalCovered,false);
 assert.equal(row.originalM0SourcePaperTransverseDriftNeverClosesGap,true);
 assert.equal(row.actualOriginalTopoDSParameterCoverageCertified,false);
 assert.equal(row.engineeringLineStyle,'undetermined');
 assert.equal(row.signedV5Action,false);
});


test('same-run parameterized original HLR curve lineage is reconciled with native source filters in V/H/W',()=>{
 const x=fixture(),r=audit(x);
 assert.equal(r.counts.globalGeneratedHLREdgesWithUniqueParameterizedSourceLineage,3);
 assert.equal(r.counts.globalGeneratedHLREdgesWithNativeFilterNarrowedAmbiguousParameterizedLineage,0);
 assert.equal(r.counts.globalGeneratedHLREdgesWithAmbiguousParameterizedSourceLineage,0);
 assert.equal(r.counts.globalGeneratedHLREdgesWithoutParameterizedSourceLineage,0);
 assert.equal(r.counts.globalGeneratedHLREdgesWithParameterizedSourceDisagreement,0);
 for(const view of ['V','H','W']){
  const lineage=r.views[view].parameterizedGlobalHLRSourceLineage;
  assert.equal(lineage.counts.uniqueParameterizedSourceLineage,1);
  assert.equal(lineage.classes.visible.rows[0].sameRunOriginalHLRCurveParameterLineageProven,true);
  assert.equal(lineage.generated2DTopoDSHistoryProven,false);
  assert.equal(lineage.engineeringLineStyle,'undetermined');
  assert.equal(lineage.signedV5ActionCount,0);
 }
});

test('a unique parameterized curve match that conflicts with native source filter is held, not promoted',()=>{
 const x=fixture(),report=x.cad.nativeSourceScopedSharpOutputByView.V.
  generated2DSourceParameterMatches.visible;
 report.rows[0].candidateSourceMatches[0].sourceEdgeId=x.id1;
 report.rows[0].uniqueOriginalSourceEdgeId=x.id1;
 const r=audit(x),lineage=r.views.V.parameterizedGlobalHLRSourceLineage;
 assert.equal(lineage.counts.uniqueParameterizedSourceLineage,0);
 assert.equal(lineage.counts.sourceFilterOrPaperCandidateDisagreements,1);
 assert.equal(lineage.classes.visible.rows[0].status,
  'source-filter-or-paper-candidate-disagreement');
 assert.equal(lineage.classes.visible.rows[0].sameRunOriginalHLRCurveParameterLineageProven,false);
 assert.equal(r.counts.globalGeneratedHLREdgesWithParameterizedSourceDisagreement,1);
 assert.equal(r.signedV5ActionCount,0);
});

test('coincident original curves remain ambiguous even when both native source filters agree',()=>{
 const x=fixture(),view='V',scoped=x.cad.nativeSourceScopedSharpOutputByView[view],
  report=scoped.generated2DSourceParameterMatches.visible;
 scoped.rows[1].visible.push(x.witness(view,x.id1));
 scoped.nativeSourceScopedOutputEdgeCount=2;
 scoped.paperOnlyScopedOutputEdgeCount=2;
 x.cad.views[view][0].projectedOriginalEdgeCandidates.push(x.id1);
 const row=report.rows[0];
 row.candidateSourceMatches.push(x.parameterMatch(x.id1));
 row.candidateSourceMatchCount=2;
 row.rejectedSourceCandidateCount=0;
 row.uniqueOriginalSourceEdgeId=null;
 row.status='ambiguous-parameterized-source-curve-match';
 report.uniqueParameterizedSourceMatchCount=0;
 report.ambiguousParameterizedSourceMatchCount=1;
 const r=audit(x),lineage=r.views[view].parameterizedGlobalHLRSourceLineage;
 assert.equal(lineage.counts.ambiguousParameterizedSourceLineage,1);
 assert.equal(lineage.counts.nativeFilterNarrowedAmbiguousParameterizedSourceLineage,0);
 assert.equal(lineage.classes.visible.rows[0].status,'ambiguous-parameterized-source-lineage');
 assert.equal(lineage.classes.visible.rows[0].sameRunOriginalHLRCurveParameterLineageProven,false);
 assert.equal(r.signedV5ActionCount,0);
});

test('unmatched global HLR output remains explicitly unmatched rather than inheriting a paper label',()=>{
 const x=fixture(),report=x.cad.nativeSourceScopedSharpOutputByView.H.
  generated2DSourceParameterMatches.visible;
 const row=report.rows[0];
 row.candidateSourceMatches=[];
 row.candidateSourceMatchCount=0;
 row.rejectedSourceCandidateCount=2;
 row.uniqueOriginalSourceEdgeId=null;
 row.status='no-parameterized-source-curve-match';
 report.uniqueParameterizedSourceMatchCount=0;
 report.ambiguousParameterizedSourceMatchCount=0;
 report.unmatchedGeneratedOutputEdgeCount=1;
 const r=audit(x),lineage=r.views.H.parameterizedGlobalHLRSourceLineage;
 assert.equal(lineage.counts.unmatchedGeneratedOutputEdges,1);
 assert.equal(lineage.classes.visible.rows[0].status,'unmatched');
 assert.equal(lineage.classes.visible.rows[0].sameRunOriginalHLRCurveParameterLineageProven,false);
});

test('M4 rejects forged generated Sharp one-ULP source-domain overhang in V/H/W',()=>{
 for(const view of ['V','H','W'])for(const interval of [
  [-Number.MIN_VALUE,1],[0,1+Number.EPSILON]]){
  const x=fixture();
  const report=x.cad.nativeSourceScopedSharpOutputByView[view].
   generated2DSourceParameterMatches.visible;
  const match=report.rows[0].candidateSourceMatches[0];
  match.generated2DParameterRange=[...interval];
  match.sourceProjected2DParameterEndpointResiduals=[interval[0],interval[1]-1];
  match.sourceProjected2DParameterRangeMatchesGeneratedOutputRange=false;
  x.cad.views[view][0].actualOCCTHLRCurveParameterRange=[...interval];
  assert.throws(()=>audit(x),/invalid same-run original HLR parameterized source witness/);
 }
});

test('malformed parameterized source reports and forged generated-edge history are rejected',()=>{
 for(const mutate of [
  report=>{report.rows[0].ordinal=4;},
  report=>{report.rows[0].candidateSourceMatches[0].sourceEdgeId='g::foreign';},
  report=>{report.rows[0].candidateSourceMatches[0].originalTopoDSEdgeIdentityProven=false;},
  report=>{report.rows[0].candidateSourceMatches[0].originalBRepParameterRangeMatches=false;},
  report=>{report.rows[0].candidateSourceMatches[0].originalBRepSourceParameterRange=[0,2];},
  report=>{report.rows[0].candidateSourceMatches[0].generated2DTopoDSHistoryProven=true;},
  report=>{report.generated2DTopoDSHistoryProven=true;},
  report=>{report.rows[0].candidateSourceMatches[0].source3DParameterRange=[-1,2];}
 ]){
  const x=fixture();
  mutate(x.cad.nativeSourceScopedSharpOutputByView.V.
   generated2DSourceParameterMatches.visible);
  assert.throws(()=>audit(x),/parameterized|source|HLR|TopoDS|curve/i);
 }
});


test('native class-specific HLR filter narrows a projected curve alias but never upgrades it to unique',()=>{
 const x=fixture(),view='V',report=x.cad.nativeSourceScopedSharpOutputByView[view].
  generated2DSourceParameterMatches.visible;
 const row=report.rows[0];
 row.candidateSourceMatches.push(x.parameterMatch(x.id1));
 row.candidateSourceMatchCount=2;
 row.rejectedSourceCandidateCount=0;
 row.uniqueOriginalSourceEdgeId=null;
 row.status='ambiguous-parameterized-source-curve-match';
 report.uniqueParameterizedSourceMatchCount=0;
 report.ambiguousParameterizedSourceMatchCount=1;
 x.cad.views[view][0].projectedOriginalEdgeCandidates.push(x.id1);
 const r=audit(x),lineage=r.views[view].parameterizedGlobalHLRSourceLineage;
 const measured=lineage.classes.visible.rows[0];
 assert.equal(measured.status,'ambiguous-parameterized-source-lineage-native-filter-narrowed');
 assert.deepEqual(measured.parameterizedOriginalSourceEdgeIds,[x.id0,x.id1].sort());
 assert.deepEqual(measured.nativeSourceFilterCandidateIds,[x.id0]);
 assert.equal(measured.nativeFilterNarrowsParameterizedCandidates,true);
 assert.equal(measured.sameRunOriginalHLRCurveParameterLineageProven,false);
 assert.equal(lineage.counts.nativeFilterNarrowedAmbiguousParameterizedSourceLineage,1);
 assert.equal(lineage.counts.sourceFilterOrPaperCandidateDisagreements,0);
 assert.equal(r.signedV5ActionCount,0);
});


test('parameterized generated HLR source interval is backed by the same native M4 visibility class',()=>{
 const match={original3DCurveParameterRange:[0,10],source3DParameterRange:[2,8]};
 const nativeM4={
  schema:'draftai-c1-ocjs-source-native-3d-to-original-m4-view-candidates/2',
  native3DOutlineSegments:[],
  sourceEdgeId:'g::E0',view:'V',original3DSourceCurveDirection:'forward',
  segments:[{native3DHLRClass:'visible-sharp',originalM0UnitParameterRange:[0.2,0.8]}]
 };
 const r=auditParameterizedM4({view:'V',sourceId:'g::E0',match,
  klass:'visible',nativeM4});
 assert.equal(r.availability,'available');
 assert.deepEqual(r.originalM0UnitParameterRange,[0.2,0.8]);
 assert.equal(r.nativeM4SameClassCoverageComplete,true);
 assert.deepEqual(r.nativeM4SameClassCoverageGaps,[]);
 assert.equal(r.nativeM4OppositeClassPositiveOverlap,false);
 assert.equal(r.nativeM4ClassBacked,true);
});

test('native outline class intervals independently back a parameterized visible HLR source',()=>{
 const match={original3DCurveParameterRange:[0,10],source3DParameterRange:[2,8]};
 const nativeM4={
  schema:'draftai-c1-ocjs-source-native-3d-to-original-m4-view-candidates/2',
  sourceEdgeId:'g::E0',view:'V',original3DSourceCurveDirection:'forward',
  segments:[{native3DHLRClass:'visible-sharp',originalM0UnitParameterRange:[0.2,0.8]}],
  native3DOutlineEvidenceAvailable:true,
  native3DOutlineSegments:[outlineSegment('V','g::E0','visible-outline',[2,8],[0.2,0.8])]
 };
 const r=auditParameterizedM4({view:'V',sourceId:'g::E0',match,
  klass:'visible',nativeM4});
 assert.equal(r.nativeOutlineEvidenceAvailable,true);
 assert.equal(r.nativeOutlineSameClassCoverageComplete,true);
 assert.deepEqual(r.nativeOutlineSameClassCoverageGaps,[]);
 assert.equal(r.nativeOutlineOppositeClassPositiveOverlap,false);
 assert.equal(r.nativeOutlineClassBacked,true);
});

test('native outline one-ULP positive gap cannot vanish in rounded M0 source coverage',()=>{
 const lo=0.015,hi=0.015000000000000001;
 assert.ok(hi>lo);
 assert.equal(lo/3,hi/3,'native gap endpoints intentionally normalize to one binary64 t');
 const nativeM4={
  schema:'draftai-c1-ocjs-source-native-3d-to-original-m4-view-candidates/2',
  sourceEdgeId:'g::E0',view:'V',original3DSourceCurveDirection:'forward',
  segments:[{native3DHLRClass:'visible-sharp',originalM0UnitParameterRange:[0,1]}],
  native3DOutlineEvidenceAvailable:true,
  native3DOutlineSegments:[
   outlineSegment('V','g::E0','visible-outline',[0,lo],[0,lo/3]),
   outlineSegment('V','g::E0','visible-outline',[hi,3],[hi/3,1])
  ],
  M4ProjectedNative3DOutlineIntervalsHeldForBinary64Representation:[]
 };
 const r=auditParameterizedM4({view:'V',sourceId:'g::E0',
  match:{original3DCurveParameterRange:[0,3],source3DParameterRange:[0,3]},
  klass:'visible',nativeM4});
 assert.equal(r.nativeOutlineSameClassCoverageComplete,true,
  'rounded [0,1] coverage alone falsely looks complete');
 assert.deepEqual(r.nativeOutlineOriginalParameterCoverage.nativeOriginalParameterPositiveGaps,
  [[lo,hi]]);
 assert.equal(r.nativeOutlineClassBacked,false);
});

test('binary64-collapsed opposite outline interval vetoes an otherwise full class',()=>{
 const lo=0.015,hi=0.015000000000000001;
 assert.equal(lo/3,hi/3);
 const nativeM4={
  schema:'draftai-c1-ocjs-source-native-3d-to-original-m4-view-candidates/2',
  sourceEdgeId:'g::E0',view:'V',original3DSourceCurveDirection:'forward',
  segments:[{native3DHLRClass:'visible-sharp',originalM0UnitParameterRange:[0,1]}],
  native3DOutlineEvidenceAvailable:true,
  native3DOutlineSegments:[
   outlineSegment('V','g::E0','visible-outline',[0,3],[0,1])
  ],
  M4ProjectedNative3DOutlineIntervalsHeldForBinary64Representation:[{
   native3DHLRClass:'hidden-outline',
   originalNative3DParameterRange:[lo,hi],
   roundedOriginalM0UnitParameterRange:[lo/3,hi/3],
   reason:'positive-native-outline-interval-collapsed-by-binary64-normalization',
   engineeringLineStyle:'undetermined',signedV5Action:false
  }]
 };
 const r=auditParameterizedM4({view:'V',sourceId:'g::E0',
  match:{original3DCurveParameterRange:[0,3],source3DParameterRange:[0,3]},
  klass:'visible',nativeM4});
 assert.equal(r.nativeOutlineSameClassCoverageComplete,true);
 assert.equal(r.nativeOutlineOppositeClassPositiveOverlap,false,
  'rounded M4 opposite class does not expose the native positive interval');
 assert.deepEqual(r.nativeOutlineOriginalParameterCoverage.nativeOriginalHeldBinary64PositiveOverlaps,
  [[lo,hi]]);
 assert.equal(r.nativeOutlineClassBacked,false);
});

test('native outline complete original curve and reversed parameter source remain candidates only',()=>{
 const nativeM4={
  schema:'draftai-c1-ocjs-source-native-3d-to-original-m4-view-candidates/2',
  sourceEdgeId:'g::E0',view:'W',original3DSourceCurveDirection:'reversed',
  segments:[{native3DHLRClass:'hidden-sharp',originalM0UnitParameterRange:[0,1]}],
  native3DOutlineEvidenceAvailable:true,
  native3DOutlineSegments:[
   outlineSegment('W','g::E0','hidden-outline',[0,3],[0,1])
  ],
  M4ProjectedNative3DOutlineIntervalsHeldForBinary64Representation:[]
 };
 const r=auditParameterizedM4({view:'W',sourceId:'g::E0',
  match:{original3DCurveParameterRange:[0,3],source3DParameterRange:[0,3]},
  klass:'hidden',nativeM4});
 assert.equal(r.nativeOutlineOriginalParameterCoverage.nativeOriginalClassBackedWithoutNormalization,true);
 assert.equal(r.nativeOutlineClassBacked,true);
 assert.equal(r.nativeM4ClassBacked,true);
 assert.equal(r.availability,'available');
});

test('same-class native outline overlap cannot be hidden by union coverage',()=>{
 const nativeM4={
  schema:'draftai-c1-ocjs-source-native-3d-to-original-m4-view-candidates/2',
  sourceEdgeId:'g::E0',view:'V',original3DSourceCurveDirection:'forward',
  segments:[{native3DHLRClass:'visible-sharp',originalM0UnitParameterRange:[0.2,0.8]}],
  native3DOutlineEvidenceAvailable:true,
  native3DOutlineSegments:[
   outlineSegment('V','g::E0','visible-outline',[2,6],[0.2,0.6]),
   outlineSegment('V','g::E0','visible-outline',[4,8],[0.4,0.8])
  ]
 };
 const r=auditParameterizedM4({view:'V',sourceId:'g::E0',
  match:{original3DCurveParameterRange:[0,10],source3DParameterRange:[2,8]},
  klass:'visible',nativeM4});
 assert.equal(r.nativeOutlineSameClassCoverageComplete,true);
 assert.deepEqual(r.nativeOutlineSameClassPositiveOverlaps,[[0.4,0.6]]);
 assert.equal(r.nativeOutlineClassBacked,false);
});
test('native outline segment from a foreign source or mismatched M0 interval is rejected',()=>{
 for(const mutate of [
  x=>{x.native3DOutlineSegments[0].sourceEdgeId='g::FOREIGN';},
  x=>{x.native3DOutlineSegments[0].originalM0UnitParameterRange=[0.1,0.9];},
  x=>{x.native3DOutlineSegments[0].signedV5Action=true;}
 ]){
  const nativeM4={
   schema:'draftai-c1-ocjs-source-native-3d-to-original-m4-view-candidates/2',
   sourceEdgeId:'g::E0',view:'V',original3DSourceCurveDirection:'forward',
   segments:[{native3DHLRClass:'visible-sharp',originalM0UnitParameterRange:[0.2,0.8]}],
   native3DOutlineEvidenceAvailable:true,
   native3DOutlineSegments:[outlineSegment('V','g::E0','visible-outline',[2,8],[0.2,0.8])]
  };
  mutate(nativeM4);
  assert.throws(()=>auditParameterizedM4({view:'V',sourceId:'g::E0',
   match:{original3DCurveParameterRange:[0,10],source3DParameterRange:[2,8]},
   klass:'visible',nativeM4}),/outline|source|M0|identity/i);
 }
});
test('opposite native outline class overlap prevents a parameterized contour source claim',()=>{
 const match={original3DCurveParameterRange:[0,10],source3DParameterRange:[2,8]};
 const nativeM4={
  schema:'draftai-c1-ocjs-source-native-3d-to-original-m4-view-candidates/2',
  sourceEdgeId:'g::E0',view:'V',original3DSourceCurveDirection:'forward',
  segments:[{native3DHLRClass:'visible-sharp',originalM0UnitParameterRange:[0.2,0.8]}],
  native3DOutlineEvidenceAvailable:true,
  native3DOutlineSegments:[
   outlineSegment('V','g::E0','visible-outline',[2,8],[0.2,0.8]),
   outlineSegment('V','g::E0','hidden-outline',[4,6],[0.4,0.6])
  ]
 };
 const r=auditParameterizedM4({view:'V',sourceId:'g::E0',match,
  klass:'visible',nativeM4});
 assert.equal(r.nativeOutlineSameClassCoverageComplete,true);
 assert.equal(r.nativeOutlineOppositeClassPositiveOverlap,true);
 assert.deepEqual(r.nativeOutlineOppositeClassOverlaps,[[0.4,0.6]]);
 assert.equal(r.nativeOutlineClassBacked,false);
});

test('an empty native outline ledger is available evidence but cannot back a contour interval',()=>{
 const nativeM4={
  schema:'draftai-c1-ocjs-source-native-3d-to-original-m4-view-candidates/2',
  sourceEdgeId:'g::E0',view:'V',original3DSourceCurveDirection:'forward',
  segments:[{native3DHLRClass:'visible-sharp',originalM0UnitParameterRange:[0.2,0.8]}],
  native3DOutlineEvidenceAvailable:true,
  native3DOutlineSegments:[]
 };
 const r=auditParameterizedM4({view:'V',sourceId:'g::E0',
  match:{original3DCurveParameterRange:[0,10],source3DParameterRange:[2,8]},
  klass:'visible',nativeM4});
 assert.equal(r.nativeOutlineEvidenceAvailable,true);
 assert.equal(r.nativeOutlineSameClassCoverageComplete,false);
 assert.equal(r.nativeOutlineClassBacked,false);
});

test('native M4 positive same-class gaps prevent parameterized generated HLR class backing',()=>{
 const match={original3DCurveParameterRange:[0,10],source3DParameterRange:[2,8]};
 const nativeM4={
  schema:'draftai-c1-ocjs-source-native-3d-to-original-m4-view-candidates/2',
  native3DOutlineSegments:[],
  sourceEdgeId:'g::E0',view:'V',original3DSourceCurveDirection:'forward',
  segments:[{native3DHLRClass:'visible-sharp',originalM0UnitParameterRange:[0.2,0.5]}]
 };
 const r=auditParameterizedM4({view:'V',sourceId:'g::E0',match,
  klass:'visible',nativeM4});
 assert.equal(r.nativeM4SameClassCoverageComplete,false);
 assert.deepEqual(r.nativeM4SameClassCoverageGaps,[[0.5,0.8]]);
 assert.equal(r.nativeM4ClassBacked,false);
});

test('opposite native M4 visibility class overlap prevents generated HLR source class backing',()=>{
 const match={original3DCurveParameterRange:[0,10],source3DParameterRange:[2,8]};
 const nativeM4={
  schema:'draftai-c1-ocjs-source-native-3d-to-original-m4-view-candidates/2',
  native3DOutlineSegments:[],
  sourceEdgeId:'g::E0',view:'V',original3DSourceCurveDirection:'forward',
  segments:[
   {native3DHLRClass:'visible-sharp',originalM0UnitParameterRange:[0.2,0.8]},
   {native3DHLRClass:'hidden-sharp',originalM0UnitParameterRange:[0.4,0.6]}
  ]
 };
 const r=auditParameterizedM4({view:'V',sourceId:'g::E0',match,
  klass:'visible',nativeM4});
 assert.equal(r.nativeM4SameClassCoverageComplete,true);
 assert.equal(r.nativeM4OppositeClassPositiveOverlap,true);
 assert.deepEqual(r.nativeM4OppositeClassOverlaps,[[0.4,0.6]]);
 assert.equal(r.nativeM4ClassBacked,false);
});

test('reversed original BRep parameter direction is normalized against native M4 without clamping',()=>{
 const match={original3DCurveParameterRange:[0,10],source3DParameterRange:[0,2]};
 const nativeM4={
  schema:'draftai-c1-ocjs-source-native-3d-to-original-m4-view-candidates/2',
  native3DOutlineSegments:[],
  sourceEdgeId:'g::E0',view:'W',original3DSourceCurveDirection:'reversed',
  segments:[{native3DHLRClass:'hidden-sharp',originalM0UnitParameterRange:[0.8,1]}]
 };
 const r=auditParameterizedM4({view:'W',sourceId:'g::E0',match,
  klass:'hidden',nativeM4});
 assert.deepEqual(r.originalM0UnitParameterRange,[0.8,1]);
 assert.equal(r.nativeM4ClassBacked,true);
});

test('native M4 parameterized-source class audit stays unavailable when no 3D M4 record exists',()=>{
 const r=auditParameterizedM4({view:'H',sourceId:'g::E0',
  match:{original3DCurveParameterRange:[0,1],source3DParameterRange:[0,1]},
  klass:'visible',nativeM4:null});
 assert.equal(r.availability,'unavailable');
 assert.equal(r.nativeM4ClassBacked,false);
 assert.equal(r.originalM0UnitParameterRange,null);
});

test('a forged forward endpoint flag cannot resolve an inverse parameter overshoot',()=>{
 const nativeM4={
  schema:'draftai-c1-ocjs-source-native-3d-to-original-m4-view-candidates/2',
  native3DOutlineSegments:[],
  sourceEdgeId:'g::E0',view:'V',original3DSourceCurveDirection:'forward',
  segments:[{native3DHLRClass:'visible-sharp',originalM0UnitParameterRange:[0,1]}]
 };
 const r=auditParameterizedM4({view:'V',sourceId:'g::E0',
  match:{original3DCurveParameterRange:[0,1],
   source3DParameterRange:[0,1+2*Number.EPSILON],
   generated2DParameterRange:[0,0.9],
   sourceProjected2DParameterRange:[0,1],
   sourceProjected2DParameterRangeSorted:[0,1],
   sourceProjected2DParameterEndpointResiduals:[0,-0.1],
   sourceProjected2DParameterRangeMatchesGeneratedOutputRange:true},
  klass:'visible',nativeM4});
 assert.equal(r.sourceParameterDomainContainment,'within-tolerance-but-outside');
 assert.equal(r.nativeM4ClassBacked,false);
});

test('tolerance-bounded one-ULP source overshoot is recorded and held without clamping',()=>{
 const nativeM4={
  schema:'draftai-c1-ocjs-source-native-3d-to-original-m4-view-candidates/2',
  native3DOutlineSegments:[],
  sourceEdgeId:'g::E0',view:'V',original3DSourceCurveDirection:'forward',
  segments:[{native3DHLRClass:'visible-sharp',originalM0UnitParameterRange:[0,1]}]
 };
 const r=auditParameterizedM4({view:'V',sourceId:'g::E0',
  match:{original3DCurveParameterRange:[0,1],
   source3DParameterRange:[-Number.EPSILON,0.5]},
  klass:'visible',nativeM4});
 assert.equal(r.availability,'available');
 assert.equal(r.sourceParameterDomainContainment,'within-tolerance-but-outside');
 assert.ok(r.originalM0UnitParameterRange[0]<0);
 assert.equal(r.nativeM4ClassBacked,false);
 assert.match(r.reason,/no-clamp/);
});

test('exact forward paper endpoints cannot rebind an out-of-domain native 3D source interval',()=>{
 const nativeM4={
  schema:'draftai-c1-ocjs-source-native-3d-to-original-m4-view-candidates/2',
  native3DOutlineSegments:[],
  sourceEdgeId:'g::E0',view:'V',original3DSourceCurveDirection:'forward',
  segments:[{native3DHLRClass:'visible-sharp',originalM0UnitParameterRange:[0,1]}]
 };
 const r=auditParameterizedM4({view:'V',sourceId:'g::E0',
  match:{original3DCurveParameterRange:[0,1],
   source3DParameterRange:[0,1+2*Number.EPSILON],
   generated2DParameterRange:[0,1],
   sourceProjected2DParameterRange:[0,1],
   sourceProjected2DParameterRangeSorted:[0,1],
   sourceProjected2DParameterEndpointResiduals:[0,0],
   sourceProjected2DParameterRangeMatchesGeneratedOutputRange:true},
  klass:'visible',nativeM4});
 assert.deepEqual(r.originalM0UnitParameterRange,[0,1+2*Number.EPSILON]);
 assert.deepEqual(r.inverseMappedOriginalM0UnitParameterRange,[0,1+2*Number.EPSILON]);
 assert.deepEqual(r.source3DParameterRangeFromInverse,[0,1+2*Number.EPSILON]);
 assert.equal(r.sourceParameterDomainContainment,'within-tolerance-but-outside');
 assert.equal(r.sourceProjected2DForwardEndpointAgreementOnly,true);
 assert.equal(r.sourceDomainEndpointForwardMapProof,false);
 assert.equal(r.nativeM4ClassBacked,false);
 assert.match(r.reason,/no-clamp/);
});

test('parameterized source interval outside the original M0 domain is rejected, never clamped',()=>{
 const nativeM4={
  schema:'draftai-c1-ocjs-source-native-3d-to-original-m4-view-candidates/2',
  native3DOutlineSegments:[],
  sourceEdgeId:'g::E0',view:'V',original3DSourceCurveDirection:'forward',
  segments:[{native3DHLRClass:'visible-sharp',originalM0UnitParameterRange:[0,1]}]
 };
 assert.throws(()=>auditParameterizedM4({view:'V',sourceId:'g::E0',
  match:{original3DCurveParameterRange:[0,10],source3DParameterRange:[-1,1]},
  klass:'visible',nativeM4}),/original M0|parameterized/i);
});

test('paper-only aliases in each missing-view orientation never become signed V5 strokes',()=>{
 for(const view of ['V','H','W']){
  const x=fixture(),c=x.cad.nativeSourceScopedSharpOutputByView[view];
  // Each orientation needs a GENUINE paper alias. The default second
  // source is coincident only in V: it is shifted in H and W, so claiming
  // its global ordinal there is correctly rejected by the strict matcher.
  // Keep the two physical 3D sources distinct in the eliminated axis.
  if(view==='H'){
   x.geometry.data.points.C.y=0;
   x.geometry.data.points.D.y=2;
   x.geometry.data.points.C.z=1;
   x.geometry.data.points.D.z=4;
  }else if(view==='W'){
   x.geometry.data.points.C.y=0;
   x.geometry.data.points.D.y=2;
   x.geometry.data.points.C.x=1;
   x.geometry.data.points.D.x=11;
  }
  assert.deepEqual(x.paper(view,x.id1),x.paper(view,x.id0),
   'the negative source-alias fixture must match the actual view');
  c.rows[1].visible.push(x.witness(view,x.id1));
  c.nativeSourceScopedOutputEdgeCount=2;
  c.paperOnlyScopedOutputEdgeCount=2;
  x.cad.views[view][0].projectedOriginalEdgeCandidates.push(x.id1);
  const r=audit(x);
  assert.equal(r.signedV5ActionCount,0);
  assert.equal(r.formalEngineeringLineStyleCertified,false);
  assert.equal(r.views[view].visible[0].signedV5Action,false);
  assert.equal(r.views[view].visible[0].originalTopoDSHistoryProven,false);
 }
});

test('all three views reject a forged formal line style on a paper-only native candidate',()=>{
 for(const view of ['V','H','W']){
  for(const style of ['solid','dashed']){
   const x=fixture();
   x.cad.nativeSourceScopedSharpOutputByView[view].rows[0].
    visible[0].engineeringLineStyle=style;
   assert.throws(()=>audit(x),/unsigned|OCCT|witness|source/i);
  }
 }
});
test('all three views reject a forged continuous-occlusion proof on source-filtered paper',()=>{
 for(const view of ['V','H','W']){
  const x=fixture();
  x.cad.nativeSourceScopedSharpOutputByView[view].rows[0].
   visible[0].globalContinuousOcclusionProven=true;
  assert.throws(()=>audit(x),/unsigned|OCCT|witness|source/i);
 }
});
test('all three views retain unsigned status when a paper candidate has no direct native IsSame',()=>{
 for(const view of ['V','H','W']){
  const x=fixture(),r=audit(x);
  const row=r.views[view].visible[0];
  assert.equal(row.originalTopoDSHistoryProven,false);
  assert.equal(row.signedV5Action,false);
  assert.equal(r.globalContinuousVisibilityCertified,false);
 }
});

function fixtureWithRealStatusReplay({collapseSecondInW=false}={}){
 const x=fixture();
 if(collapseSecondInW)x.geometry.data.points.D={x:10,y:1,z:0};
 Object.assign(x.geometry,{kind:'mesh',space:'model-3d',unit:'mm'});
 x.cad.actualOCCTCurveTypeIndependentlyVerified=true;
 x.cad.originalBRepSourceEdges=x.geometry.data.edges.map(edge=>{
  const [a,b]=edge.map(id=>x.geometry.data.points[id]),
   range=[0,1];
  return {sourceEdgeId:x.geometry.id+'::'+[...edge].sort().join('|'),
   occtSourceCurveType:'line',originalOCCTBRepVertexXYZMatched:true,
   fromOCCT3D:{...a},toOCCT3D:{...b},
   occtSourceCurve3DEndpointsAndMidpointVerified:true,
   occtSourceCurveParameterRange:range,
   occtSourceCurveFirstPoint3D:{...a},occtSourceCurveLastPoint3D:{...b}};
 });
 const {auditOriginalEdgeStatusVsSourceScoped3DSharp:auditStatus}=
  require('../../engines/spatial/hlr/c1-ocjs-edgestatus-abi.cjs');
 for(const view of ['V','H','W']){
  const scoped=x.cad.nativeSourceScopedSharpOutputByView[view],
   statuses=[];
  for(const row of scoped.rows){
   const curve=x.cad.originalBRepSourceEdges.find(z=>
    z.sourceEdgeId===row.originalPhysicalSourceEdgeId);
   const range=[...curve.occtSourceCurveParameterRange],
    part={nativeSourceFilterOriginalEdgeId:curve.sourceEdgeId,
     native3DHLRClass:'visible-sharp',
     nativeOriginalCurveParameterRange:range,
     native3DCurveExactlySameAsOriginalAtThreeParameters:true,
     originalGeneratedTopoDSHistoryCertified:false,signedV5Action:false};
   row.visible3D={nativeSourceFilteredOriginalTopoDSEdge:true,
    native3DGeneratedCurveIntervals:row.visible.length?[part]:[]};
   row.hidden3D={nativeSourceFilteredOriginalTopoDSEdge:true,
    native3DGeneratedCurveIntervals:[]};
   const status={sourceEdgeId:curve.sourceEdgeId,
    parameterPartitionValidated:true,bounds:range,
    visibleParts:row.visible.length?[range]:[]};
   statuses.push(status);
   row.originalEdgeStatusVsNative3DSharp=auditStatus({
    sourceEdgeId:curve.sourceEdgeId,originalNativeParameterRange:range,
    statusRow:status,
    visibleNativeIntervals:row.visible3D.native3DGeneratedCurveIntervals
     .map(z=>z.nativeOriginalCurveParameterRange),
    hiddenNativeIntervals:[]
   });
  }
  x.cad.nativeHLRSourceHistoryAPISurfaceByView[view].originalEdgeStatusAbi={
   rows:statuses};
  scoped.originalStatusVsNative3DSharpSummary={
   comparedOriginalSources:2,concordantOriginalSources:1,
   mismatchedOriginalSources:1,heldUncomparableOriginalSources:0,
   directGenerated2DTopoDSHistoryCertified:false,
   officialV5Authorized:false
  };
 }
 return x;
}
test('source M4 independently replays real indexed EdgeStatus/3D diagnostics without V5 promotion',()=>{
 const x=fixtureWithRealStatusReplay(),r=audit(x);
 assert.equal(r.counts.originalStatusVsNative3DCompared,6);
 assert.equal(r.counts.originalStatusVsNative3DConcordant,3);
 assert.equal(r.counts.originalStatusVsNative3DConflicting,3);
 assert.equal(r.counts.originalStatusVsNative3DHeld,0);
 assert.equal(r.views.V.originalStatusReconciliation.length,2);
 assert.equal(r.generatedToOriginalTopoDSFullHistoryCertified,false);
 assert.equal(r.signedV5ActionCount,0);
});
test('source M4 rejects a forged native status report, source index and aggregate',()=>{
 for(const mutate of [
  x=>{x.cad.nativeSourceScopedSharpOutputByView.V.rows[0].
   originalEdgeStatusVsNative3DSharp.nativeOriginalStatusClassAgreesWith3DSharp=false;},
  x=>{x.cad.nativeSourceScopedSharpOutputByView.W.
   originalStatusVsNative3DSharpSummary.concordantOriginalSources=2;},
  x=>{x.cad.nativeHLRSourceHistoryAPISurfaceByView.H.
   originalEdgeStatusAbi.rows[0].sourceEdgeId='g::invented';},
  x=>{x.cad.nativeSourceScopedSharpOutputByView.V.rows[1].
   originalEdgeStatusVsNative3DSharp.signedV5Action=true;}
 ]){
  const x=fixtureWithRealStatusReplay();mutate(x);
  assert.throws(()=>audit(x),/status|source|replayable|aggregate|invented/i);
 }
});

test('forward paper endpoint witness cannot expand a partial inverse source interval into a full original BRep edge',()=>{
 for(const view of ['V','H','W']){
  for(const sourceRange of [
   [-Number.EPSILON,0.5],
   [0.5,1+2*Number.EPSILON],
   [1+2*Number.EPSILON,0.5]
  ]){
   const nativeM4={
    schema:'draftai-c1-ocjs-source-native-3d-to-original-m4-view-candidates/2',
    native3DOutlineSegments:[],
    sourceEdgeId:'g::E0',view,original3DSourceCurveDirection:'forward',
    segments:[{native3DHLRClass:'visible-sharp',originalM0UnitParameterRange:[0,1]}]
   };
   const r=auditParameterizedM4({view,sourceId:'g::E0',
    match:{original3DCurveParameterRange:[0,1],
     source3DParameterRange:sourceRange,
     generated2DParameterRange:[0,1],
     sourceProjected2DParameterRange:[0,1],
     sourceProjected2DParameterRangeSorted:[0,1],
     sourceProjected2DParameterEndpointResiduals:[0,0],
     sourceProjected2DParameterRangeMatchesGeneratedOutputRange:true},
    klass:'visible',nativeM4});
   assert.equal(r.sourceParameterDomainContainment,'within-tolerance-but-outside');
   assert.equal(r.sourceDomainEndpointForwardMapProof,false);
   assert.equal(r.nativeM4ClassBacked,false);
   assert.deepEqual(r.source3DParameterRangeFromInverse,sourceRange);
  }
 }
});
test('reversed native source overshoot is held even with exact forward paper endpoints',()=>{
 const nativeM4={
  schema:'draftai-c1-ocjs-source-native-3d-to-original-m4-view-candidates/2',
  native3DOutlineSegments:[],
  sourceEdgeId:'g::E0',view:'W',original3DSourceCurveDirection:'reversed',
  segments:[{native3DHLRClass:'visible-sharp',originalM0UnitParameterRange:[0,1]}]
 };
 const r=auditParameterizedM4({view:'W',sourceId:'g::E0',
  match:{original3DCurveParameterRange:[0,1],
   source3DParameterRange:[1+2*Number.EPSILON,0],
   generated2DParameterRange:[0,1],
   sourceProjected2DParameterRange:[0,1],
   sourceProjected2DParameterRangeSorted:[0,1],
   sourceProjected2DParameterEndpointResiduals:[0,0],
   sourceProjected2DParameterRangeMatchesGeneratedOutputRange:true},
  klass:'visible',nativeM4});
 assert.ok(r.originalM0UnitParameterRange[0]<0);
 assert.equal(r.nativeM4ClassBacked,false);
 assert.equal(r.sourceProjected2DForwardEndpointAgreementOnly,true);
 assert.equal(r.sourceDomainEndpointForwardMapProof,false);
 assert.equal(r.sourceParameterDomainContainment,'within-tolerance-but-outside');
});

test('M4 native same-class partition must not double-assign positive source length',()=>{
 const mk=(ranges,held=[],partition=true)=>({
  schema:'draftai-c1-ocjs-source-native-3d-to-original-m4-view-candidates/2',
  sourceEdgeId:'g::E0',view:'V',original3DSourceCurveDirection:'forward',
  segments:ranges.map(originalM0UnitParameterRange=>({
   native3DHLRClass:'visible-sharp',originalM0UnitParameterRange
  })),
  native3DSourceParameterPartitionCompleteExactlyOnce:partition,
  M4OriginalUnitIntervalCandidateCoverageComplete:partition,
  M4ProjectedNative3DIntervalsHeldForBinary64Representation:held
 });
 const match={original3DCurveParameterRange:[0,1],source3DParameterRange:[0,1]};
 const check=nativeM4=>auditParameterizedM4({
  view:'V',sourceId:'g::E0',match,klass:'visible',nativeM4
 });
 const adjacent=check(mk([[0,.5],[.5,1]]));
 assert.equal(adjacent.nativeM4ClassBacked,true);
 assert.deepEqual(adjacent.nativeM4SameClassPositiveOverlaps,[]);
 const duplicated=check(mk([[0,.7],[.4,1]]));
 assert.deepEqual(duplicated.nativeM4SameClassPositiveOverlaps,[[.4,.7]]);
 assert.equal(duplicated.nativeM4SameClassCoverageComplete,true);
 assert.equal(duplicated.nativeM4ClassBacked,false);
 const tiny=check(mk([[0,.5],[.5,1]],[{
  originalNative3DParameterRange:[.5,.5+Number.EPSILON]
 }]));
 assert.equal(tiny.nativeM4HeldOriginalParameterPositiveOverlap,true);
 assert.equal(tiny.nativeM4ClassBacked,false);
 const incomplete=check(mk([[0,1]],[],false));
 assert.equal(incomplete.nativeM4IndependentPartitionNotDisproven,false);
 assert.equal(incomplete.nativeM4ClassBacked,false);
});

test('W-collapsed original source with real native outline is rejected, not silently omitted',()=>{
 for(const klass of ['visible-outline','hidden-outline']){
  const x=fixtureWithRealStatusReplay({collapseSecondInW:true});
  const row=x.cad.nativeSourceScopedSharpOutputByView.W.rows[1];
  const curve=x.cad.originalBRepSourceEdges.find(z=>z.sourceEdgeId===x.id1);
  const group={nativeSourceFilteredOriginalTopoDSEdge:true,
   nativeResultingEdgeType:'HLRBRep_OutLine',
   native3DGeneratedCurveIntervals:[{
    nativeSourceFilterOriginalEdgeId:x.id1,
    nativeOriginalCurveParameterRange:[...curve.occtSourceCurveParameterRange],
    nativeResultingEdgeType:'HLRBRep_OutLine',native3DHLRClass:klass,
    native3DCurveExactlySameAsOriginalAtThreeParameters:true,
    generated2DHLREdgeTopologyProven:false,signedV5Action:false
   }]};
  row[klass==='visible-outline'?'visibleOutline3D':'hiddenOutline3D']=group;
  assert.throws(()=>audit(x),/collapsed source cannot emit native 3D sharp or outline interval/);
 }
});
test('W-collapsed source with malformed native outline group is rejected',()=>{
 const x=fixtureWithRealStatusReplay({collapseSecondInW:true});
 x.cad.nativeSourceScopedSharpOutputByView.W.rows[1].visibleOutline3D={
  native3DGeneratedCurveIntervals:{length:0}
 };
 assert.throws(()=>audit(x),/malformed native 3D HLR interval group/);
});

test('W-collapsed original source without native intervals stays an unsigned candidate',()=>{
 const x=fixtureWithRealStatusReplay({collapseSecondInW:true});
 const r=audit(x);
 assert.equal(r.signedV5ActionCount,0);
 assert.equal(r.generatedToOriginalTopoDSFullHistoryCertified,false);
 assert.equal(r.views.W.nativeOriginal3DM4Candidates.some(z=>z.sourceEdgeId===x.id1),false);
});

test('raw Sharp native BRep micro-gap cannot be erased by rounded M0 union in V/H/W',()=>{
 const lo=0.015,hi=0.015000000000000001;
 assert.ok(hi>lo);
 assert.equal(lo/3,hi/3);
 for(const view of ['V','H','W']){
  const native=(a,b)=>({
   view,sourceEdgeId:'g::E0',native3DHLRClass:'visible-sharp',
   originalNative3DParameterRange:[a,b],
   originalM0UnitParameterRange:[a/3,b/3],
   derivedFromOriginalNative3DCurveNotGeneratedHLRPaper:true,
   generated2DHLREdgeTopologyProven:false,
   completeGlobalCoProjectedVisibilityCertified:false,
   engineeringLineStyle:'undetermined',signedV5Action:false
  });
  const nativeM4={
   schema:'draftai-c1-ocjs-source-native-3d-to-original-m4-view-candidates/2',
   sourceEdgeId:'g::E0',view,original3DSourceCurveDirection:'forward',
   segments:[native(0,lo),native(hi,3)],
   native3DSourceParameterPartitionCompleteExactlyOnce:true,
   M4OriginalUnitIntervalCandidateCoverageComplete:true
  };
  const query={view,sourceId:'g::E0',
   match:{original3DCurveParameterRange:[0,3],source3DParameterRange:[0,3]},
   klass:'visible',nativeM4};
  const gap=auditParameterizedM4(query);
  assert.equal(gap.nativeM4SameClassCoverageComplete,true);
  assert.equal(gap.nativeSharpOriginalParameterEvidenceAvailable,true);
  assert.deepEqual(gap.nativeSharpOriginalParameterCoverage.nativeOriginalParameterPositiveGaps,[[lo,hi]]);
  assert.equal(gap.nativeSharpOriginalParameterClassBacked,false);
  assert.equal(gap.nativeM4ClassBacked,false);
  nativeM4.segments=[native(0,lo),native(lo,3)];
  const joined=auditParameterizedM4(query);
  assert.deepEqual(joined.nativeSharpOriginalParameterCoverage.nativeOriginalParameterPositiveGaps,[]);
  assert.equal(joined.nativeSharpOriginalParameterClassBacked,true);
  assert.equal(joined.nativeM4ClassBacked,true);
  nativeM4.segments[0].originalM0UnitParameterRange=[0,0.5];
  assert.throws(()=>auditParameterizedM4(query),/native Sharp parameter interval/);
 }
});
test('reversed native Sharp source intervals retain raw parameter proof without M0 guessing',()=>{
 const view='W',sourceEdgeId='g::E0';
 const native=(a,b)=>({
  view,sourceEdgeId,native3DHLRClass:'hidden-sharp',
  originalNative3DParameterRange:[a,b],
  originalM0UnitParameterRange:[(3-b)/3,(3-a)/3],
  derivedFromOriginalNative3DCurveNotGeneratedHLRPaper:true,
  generated2DHLREdgeTopologyProven:false,
  completeGlobalCoProjectedVisibilityCertified:false,
  engineeringLineStyle:'undetermined',signedV5Action:false
 });
 const nativeM4={
  schema:'draftai-c1-ocjs-source-native-3d-to-original-m4-view-candidates/2',
  sourceEdgeId,view,original3DSourceCurveDirection:'reversed',
  segments:[native(0,1.5),native(1.5,3)],
  native3DSourceParameterPartitionCompleteExactlyOnce:true,
  M4OriginalUnitIntervalCandidateCoverageComplete:true
 };
 const r=auditParameterizedM4({view,sourceId:sourceEdgeId,
  match:{original3DCurveParameterRange:[0,3],source3DParameterRange:[0,3]},
  klass:'hidden',nativeM4});
 assert.equal(r.nativeSharpOriginalParameterClassBacked,true);
 assert.equal(r.nativeM4ClassBacked,true);
});

test('native M4 outline consumer refuses forged paper drawability and missing held source',()=>{
 const mk=()=>({
  schema:'draftai-c1-ocjs-source-native-3d-to-original-m4-view-candidates/2',
  sourceEdgeId:'g::E0',view:'W',original3DSourceCurveDirection:'forward',
  segments:[{native3DHLRClass:'visible-sharp',originalM0UnitParameterRange:[0,1]}],
  native3DOutlineEvidenceAvailable:true,
  native3DOutlineSegments:[{
   ...outlineSegment('W','g::E0','visible-outline',[0,10],[0,1]),
   fromModelMm:{x:0,y:0,z:0},toModelMm:{x:10,y:0,z:0},
   fromPaper:{u:0,v:0},toPaper:{u:0,v:0},paperDrawableCandidate:false
  }],
  M4ProjectedNative3DOutlineIntervalsHeldForBinary64Representation:[]
 });
 const check=nativeM4=>auditParameterizedM4({
  view:'W',sourceId:'g::E0',
  match:{original3DCurveParameterRange:[0,10],source3DParameterRange:[0,10]},
  klass:'visible',nativeM4
 });
 const missing=mk();
 assert.throws(()=>check(missing),/paper-collapsed native outline missing held/);
 const forged=mk();
 forged.native3DOutlineSegments[0].paperDrawableCandidate=true;
 assert.throws(()=>check(forged),/paper drawable witness is inconsistent/);
 const valid=mk();
 valid.M4ProjectedNative3DOutlineIntervalsHeldForBinary64Representation=[{
  native3DHLRClass:'visible-outline',originalNative3DParameterRange:[0,10]
 }];
 const result=check(valid);
 assert.equal(result.nativeOutlineClassBacked,false);
 assert.deepEqual(result.nativeOutlineOriginalParameterCoverage.
  nativeOriginalHeldBinary64PositiveOverlaps,[[0,10]]);
});

test('V/H/W native outline evidence cannot be hidden by a false or missing availability flag',()=>{
 for(const view of ['V','H','W']){
  const base=()=>({
   schema:'draftai-c1-ocjs-source-native-3d-to-original-m4-view-candidates/2',
   view,sourceEdgeId:'g::E0',original3DSourceCurveDirection:'forward',
   segments:[{native3DHLRClass:'visible-sharp',originalM0UnitParameterRange:[0.2,0.8]}],
   native3DOutlineSegments:[
    outlineSegment(view,'g::E0','visible-outline',[2,8],[0.2,0.8])]
  });
  const run=nativeM4=>auditParameterizedM4({view,sourceId:'g::E0',
   match:{original3DCurveParameterRange:[0,10],source3DParameterRange:[2,8]},
   klass:'visible',nativeM4});
  for(const flag of [false,undefined]){
   const invalid=base();
   if(flag!==undefined)invalid.native3DOutlineEvidenceAvailable=flag;
   assert.throws(()=>run(invalid),/nonempty native outline source evidence cannot be marked unavailable/);
  }
  const heldOnly=base();
  heldOnly.native3DOutlineSegments=[];
  heldOnly.native3DOutlineEvidenceAvailable=false;
  heldOnly.M4ProjectedNative3DOutlineIntervalsHeldForBinary64Representation=[
   {native3DHLRClass:'visible-outline',originalNative3DParameterRange:[2,8]}];
  assert.throws(()=>run(heldOnly),/nonempty native outline source evidence cannot be marked unavailable/);
  const available=base();
  available.native3DOutlineEvidenceAvailable=true;
  assert.equal(run(available).nativeOutlineClassBacked,true);
  const legacy=base();
  legacy.native3DOutlineSegments=[];
  assert.equal(run(legacy).nativeOutlineClassBacked,false);
  const missing=base();
  missing.native3DOutlineEvidenceAvailable=true;
  delete missing.native3DOutlineSegments;
  assert.throws(()=>run(missing),/available native outline evidence requires an interval inventory/);
 }
});

function fixtureWithNative2DOutLine(){
 const x=fixture();
 for(const view of ['V','H','W']){
  const scoped=x.cad.nativeSourceScopedSharpOutputByView[view];
  const original=x.paper(view,x.id0);
  const witness={...x.witness(view,x.id0),hlrClass:'visible-outline',
   globalDirectSameGeneratedTopoDSOrdinals:[0],
   actualNativeScopedToGlobalGeneratedEdgeIsSameProven:true};
  scoped.rows[0].visibleOutline2D=[witness];
  scoped.rows[0].hiddenOutline2D=[];
  scoped.rows[1].visibleOutline2D=[];
  scoped.rows[1].hiddenOutline2D=[];
  scoped.native2DOutlineSourceHistory={
   schema:'draftai-c1-ocjs-original-filtered-generated-2d-outline/1',
   wholeSolid:{visible:[{...original,originalSourceCandidateOnly:true,
    engineeringLineStyle:'undetermined',signedV5Action:false}],hidden:[]},
   sourceScopedOutputEdges:1,
   nativeScopedToWholeSolidGeneratedIsSameCount:1,
   identityConflicts:{uniqueNativeClaims:1,wholeSolidNativeGeneratedEdgeCount:1,
    unclaimedWholeSolidGeneratedEdgeOrdinals:[],
    conflictingSourceClaimsRejected:true,
    fullOriginalSourceHistoryCertified:false,
    globalContinuousOcclusionCertified:false,signedV5ActionCount:0},
   originalBRepToGenerated2DParameterHistoryCertified:false,
   allSceneContinuousVisibilityCertified:false,
   engineeringLineStyle:'undetermined',signedV5ActionCount:0
  };
 }
 return x;
}
test('V/H/W real 2D outline native identity is consumed but cannot certify original BRep ancestry',()=>{
 const x=fixtureWithNative2DOutLine(),r=audit(x);
 assert.equal(r.counts.nativeGenerated2DOutlineSourceScopedEdges,3);
 assert.equal(r.counts.nativeGenerated2DOutlineIsSameClaims,3);
 assert.equal(r.counts.nativeGenerated2DOutlineUnclaimedEdges,0);
 for(const view of ['V','H','W']){
  const result=r.views[view].native2DOutlineSourceHistory;
  assert.equal(result.nativeScopedToGlobalGeneratedIsSame,1);
  assert.equal(result.generated2DOriginalParameterAncestryCertified,false);
  assert.equal(result.signedV5ActionCount,0);
 }
 assert.equal(r.formalEngineeringLineStyleCertified,false);
 assert.equal(r.signedV5ActionCount,0);
});
test('native 2D outline forged source, ordinal, style, global endpoint and identity count are rejected',()=>{
 for(const view of ['V','H','W'])for(const mutate of [
  c=>{c.rows[0].visibleOutline2D[0].originalPhysicalSourceEdgeId='g::invented';},
  c=>{c.rows[0].visibleOutline2D[0].globalPaperCandidateOrdinals=[3];},
  c=>{c.rows[0].visibleOutline2D[0].signedV5Action=true;},
  c=>{c.native2DOutlineSourceHistory.wholeSolid.visible[0].from.u+=2;},
  c=>{c.native2DOutlineSourceHistory.nativeScopedToWholeSolidGeneratedIsSameCount=0;},
  c=>{c.native2DOutlineSourceHistory.originalBRepToGenerated2DParameterHistoryCertified=true;}
 ]){
  const x=fixtureWithNative2DOutLine();
  mutate(x.cad.nativeSourceScopedSharpOutputByView[view]);
  assert.throws(()=>audit(x),/outline|source|identity|ordinal|forged/i);
 }
});

test('forged same-run 2D outline native IsSame cannot move both copies off the original 3D projection',()=>{
 for(const view of ['V','H','W']){
  const x=fixtureWithNative2DOutLine();
  const c=x.cad.nativeSourceScopedSharpOutputByView[view];
  c.rows[0].visibleOutline2D[0].from.u+=1;
  c.rows[0].visibleOutline2D[0].to.u+=1;
  c.native2DOutlineSourceHistory.wholeSolid.visible[0].from.u+=1;
  c.native2DOutlineSourceHistory.wholeSolid.visible[0].to.u+=1;
  assert.throws(()=>audit(x),/forged source-scoped generated 2D outline/);
 }
});


test('M4 independently rejects duplicate or folded native generated-to-original parameters in V/H/W',()=>{
 for(const view of ['V','H','W']){
  for(const corrupt of [
   match=>{match.samples[2].source3DParameter=match.samples[1].source3DParameter;},
   match=>{match.samples[2].source3DParameter=0.1;},
   match=>{match.samples[2].generated2DParameter=match.samples[1].generated2DParameter;},
   match=>{match.samples[4].source3DParameter=0.9999999999999999;}
  ]){
   const x=fixture();
   const match=x.cad.nativeSourceScopedSharpOutputByView[view].
    generated2DSourceParameterMatches.visible.rows[0].candidateSourceMatches[0];
   corrupt(match);
   assert.throws(()=>audit(x),
    /noninjective generated HLR|generated HLR sample endpoints disagree/,
    'received M4 native witness must be injective and endpoint-consistent');
  }
 }
});

test('same-run generated Sharp HLR source samples cannot launder residuals, parameter grid or native curve coordinates',()=>{
 for(const view of ['V','H','W']){
  const make=()=>{
   const x=fixture();
   const samples=x.cad.nativeSourceScopedSharpOutputByView[view].
    generated2DSourceParameterMatches.visible.rows[0].candidateSourceMatches[0].samples;
   x.cad.views[view][0].actualOCCTHLRCurveSamplesProjectedMm=
    samples.map(s=>({u:s.generatedProjectedPointMm[0],v:s.generatedProjectedPointMm[1]}));
   return {x,samples};
  };
  // A native sample inventory that exactly agrees with the source report
  // remains a candidate, never a certified 3D TopoDS history or V5 stroke.
  const good=make();
  assert.equal(audit(good.x).signedV5ActionCount,0);
  const forgedResidual=make();
  forgedResidual.samples[2].generatedProjectedPointMm[0]+=0.125;
  assert.throws(()=>audit(forgedResidual.x),
   /generated HLR source sample projected residual is inconsistent/);
  const forgedGrid=make();
  forgedGrid.samples[2].generated2DParameter+=0.01;
  assert.throws(()=>audit(forgedGrid.x),
   /generated HLR source sample parameter grid is inconsistent/);
  const forgedNative=make();
  forgedNative.x.cad.views[view][0].actualOCCTHLRCurveSamplesProjectedMm[2].u+=0.25;
  assert.throws(()=>audit(forgedNative.x),
   /generated HLR source sample disagrees with native OCCT curve/);
 }
});

test('original M0 whole-edge forward endpoint agrees without masking native inverse overrun',()=>{
 const {auditC1OriginalM0FullForwardHLRPaperEndpoints:audit}=
  require('../../workbench/c1-native-scoped-hlr-source-consumer.cjs');
 const a={u:0,v:3},b={u:6,v:23},end=20.615528128088304;
 const native=[a,{u:1.5,v:8},{u:3,v:13},{u:4.5,v:18},b];
 const args={originalProjectedEndpoints:[a,b],
  sourceProjected2DParameterRangeSorted:[0,end],
  generated2DParameterRange:[0,end],generatedHLRCurveSamples:native};
 const good=audit(args);
 assert.equal(good.exactBinary64OriginalM0WholeSourceProjectedEndpointAgreement,true);
 assert.equal(good.originalForward2DParameterDomainFullyMatchesGenerated,true);
 assert.equal(good.signedV5Action,false);
 assert.equal(good.originalToGeneratedTopoDSHistoryCertified,false);
 assert.equal(audit({...args,generatedHLRCurveSamples:[...native].reverse()})
  .exactBinary64OriginalM0WholeSourceProjectedEndpointAgreement,true);
 assert.equal(audit({...args,generatedHLRCurveSamples:[
  {...a,v:3+Number.EPSILON*4},...native.slice(1)]})
  .exactBinary64OriginalM0WholeSourceProjectedEndpointAgreement,false);
 assert.equal(audit({...args,generated2DParameterRange:[0,end/2]})
  .exactBinary64OriginalM0WholeSourceProjectedEndpointAgreement,false);
 assert.throws(()=>audit({...args,originalProjectedEndpoints:[a,{u:Infinity,v:23}]}),
  /finite original M0 paper/);
});
