'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {auditC1NativeScopedHLRSourceConsumer:audit}=
 require('../../workbench/c1-native-scoped-hlr-source-consumer.cjs');
const {project}=require('../../core/projection/conventions.js');
const {exactCandidateIntervalCoverage}=
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
