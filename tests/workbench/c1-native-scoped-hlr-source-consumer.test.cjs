'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {auditC1NativeScopedHLRSourceConsumer:audit}=
 require('../../workbench/c1-native-scoped-hlr-source-consumer.cjs');
const {project}=require('../../core/projection/conventions.js');
const {auditC1ScopedHLRSourceIdentityConflicts:checkNativeClaims}=
 require('../../engines/spatial/hlr/c1-ocjs-scoped-source-matcher.cjs');
const {exactCandidateIntervalCoverage,exactCandidateVisibilityClassOverlap}=
 require('../../workbench/c1-original-source-interval-coverage.cjs');
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
 const cad={sourceGeometryId:'g',revision:3,views:{},hiddenSharpViews:{},
  nativeHLRSourceHistoryAPISurfaceByView:{},
  nativeSourceScopedSharpOutputByView:{}};
 for(const view of ['V','H','W']){
  cad.views[view]=[{...paper(view,id0),
   projectedOriginalEdgeCandidates:[id0]}];
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
   ]
  };
 }
 for(const view of ['V','H','W']){
  const scoped=cad.nativeSourceScopedSharpOutputByView[view];
  scoped.nativeSourceIdentityConflicts=checkNativeClaims({
   matches:scoped.rows.flatMap(row=>[...row.visible,...row.hidden]),
   wholeSolidCounts:{
    'visible-sharp':cad.views[view].length,
    'hidden-sharp':cad.hiddenSharpViews[view].length
   }
  });
 }
 return {geometry,cad,id0,id1,witness,paper};
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
 const r=audit(x),coverage=r.views.V.sourceParameterCandidates[0];
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
 // The latest main requires strict BOTH-axis HLR alignment, not a
 // dominant-axis [0,1] inverse that hides transverse paper displacement.
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
   occtSourceCurveParameterRange:[0,Math.hypot(
    b.x-a.x,b.y-a.y,b.z-a.z)],
   occtSourceCurveFirstPoint3D:a,occtSourceCurveLastPoint3D:b};
 });
 for(const view of ['V','H','W']){
  for(const row of x.cad.nativeSourceScopedSharpOutputByView[view].rows){
   const source=x.cad.originalBRepSourceEdges.find(c=>
    c.sourceEdgeId===row.originalPhysicalSourceEdgeId);
   const edge={
    nativeSourceFilterOriginalEdgeId:source.sourceEdgeId,
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
 // The strict causal source rebind now also consumes the genuine
 // original EdgeMap -> original HLR EdgeStatus inventory. Supply an
 // internally consistent synthetic source-status ledger for this M4
 // contract test, without inventing generated-2D TopoDS history.
 for(const view of ['V','H','W']){
  const status=x.cad.nativeHLRSourceHistoryAPISurfaceByView[view];
  status.originalDataStructureIndex.edgeMapSourceBijectionVerified=true;
  status.originalEdgeStatusAPI={
   originalHLROpenSourceClassBoundToOriginalEdgeMap:true,
   nativeOriginalSourceEdgeStatusRows:[x.id0,x.id1].map((source,index)=>({
    view,originalPhysicalSourceEdgeId:source,
    nativeHLROriginalEdgeMapIndex:index+1,
    originalSourceClass:index===0?'all-visible':'all-hidden',
    originalEdgeStatusAllVisible:index===0,
    originalEdgeStatusAllHidden:index!==0,
    nativeOriginalVisiblePartCount:index===0?1:0,
    sourceOriginalNativeParameterBoundsStillRequireSeparateCurveAudit:true,
    generated2DHLREdgeToOriginalSourceHistoryCertified:false,
    globalContinuousM5OcclusionCertified:false,
    engineeringLineStyle:'undetermined',signedV5Action:false
   }))
  };
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

test('M4/M5 independently reconciles serialized native source claims with whole-solid HLR',()=>{
 for(const view of ['V','H','W']){
  const x=fixture(),scoped=x.cad.nativeSourceScopedSharpOutputByView[view];
  const w=scoped.rows[0].visible[0];
  w.globalDirectSameGeneratedTopoDSOrdinals=[0];
  w.actualNativeScopedToGlobalGeneratedEdgeIsSameProven=true;
  scoped.nativeScopedToWholeSolidGeneratedIsSameCount=1;
  scoped.paperOnlyScopedOutputEdgeCount=0;
  // An authentic native claim has to be represented by the complete
  // producer ledger. Even then, it does not certify original BRep history.
  assert.throws(()=>audit(x),/native scoped\/global HLR source identity ledger/);
  scoped.nativeSourceIdentityConflicts=checkNativeClaims({
   matches:scoped.rows.flatMap(row=>[...row.visible,...row.hidden]),
   wholeSolidCounts:{'visible-sharp':1,'hidden-sharp':0}
  });
  const r=audit(x);
  assert.equal(r.counts.nativeGeneratedIsSameMatches,1);
  assert.equal(r.generatedToOriginalTopoDSFullHistoryCertified,false);
  assert.equal(r.globalContinuousVisibilityCertified,false);
  assert.equal(r.signedV5ActionCount,0);
 }
});
test('dropped, invented, or stale native generated-edge ledger evidence fails closed',()=>{
 for(const view of ['V','H','W']){
  for(const mutate of [
   ledger=>{ledger.unclaimedWholeSolidGeneratedEdgeOrdinals=[];},
   ledger=>{ledger.everyWholeSolidGeneratedEdgeHasNativeScopedIdentityClaim=true;},
   ledger=>{ledger.uniqueNativeClaims=1;},
   ledger=>{ledger.rows=[{view,hlrClass:'visible-sharp',
    nativeWholeSolidEdgeOrdinal:0,originalPhysicalSourceEdgeId:'g::A|B',
    nativeScopedGeneratedEdgeIsSame:true,
    completeOriginalSourceHistoryCertified:true,
    globalContinuousOcclusionCertified:true,signedV5Action:true}];},
   ledger=>{ledger.signedV5ActionCount=1;},
   ledger=>{ledger.fullOriginalSourceHistoryCertified=true;}
  ]){
   const x=fixture(),scoped=x.cad.nativeSourceScopedSharpOutputByView[view];
   scoped.nativeSourceIdentityConflicts=
    structuredClone(scoped.nativeSourceIdentityConflicts);
   mutate(scoped.nativeSourceIdentityConflicts);
   assert.throws(()=>audit(x),/native scoped\/global HLR source identity ledger/);
  }
  const missing=fixture();
  delete missing.cad.nativeSourceScopedSharpOutputByView[view].
   nativeSourceIdentityConflicts;
  assert.throws(()=>audit(missing),/native scoped\/global HLR source identity ledger/);
 }
});
