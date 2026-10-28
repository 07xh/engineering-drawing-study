'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {auditC1NativeScopedHLRSourceConsumer:audit}=
 require('../../workbench/c1-native-scoped-hlr-source-consumer.cjs');
const {exactCandidateIntervalCoverage}=
 require('../../workbench/c1-original-source-interval-coverage.cjs');
function fixture(){
 const geometry={id:'g',data:{points:{
  A:{x:0,y:0,z:0},B:{x:10,y:0,z:0},
  C:{x:0,y:1,z:0},D:{x:10,y:1,z:0}},
  edges:[['A','B'],['C','D']]}};
 const id0='g::A|B',id1='g::C|D';
 const witness=(view,source)=>({
  view,hlrClass:'visible-sharp',originalPhysicalSourceEdgeId:source,
  globalPaperCandidateOrdinals:[0],
  globalDirectSameGeneratedTopoDSOrdinals:[],
  actualNativeScopedToGlobalGeneratedEdgeIsSameProven:false,
  fullOriginalSourceParameterCoverageProven:false,
  globalContinuousOcclusionProven:false,
  engineeringLineStyle:'undetermined',signedV5Action:false,
  from:{u:0,v:0},to:{u:10,v:0}
 });
 const cad={sourceGeometryId:'g',revision:3,views:{},hiddenSharpViews:{},
  nativeHLRSourceHistoryAPISurfaceByView:{},
  nativeSourceScopedSharpOutputByView:{}};
 for(const view of ['V','H','W']){
  cad.views[view]=[{from:{u:0,v:0},to:{u:10,v:0},
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
 return {geometry,cad,id0,id1,witness};
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
