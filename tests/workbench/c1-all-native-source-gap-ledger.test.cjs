'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {auditC1AllOriginalSourceNativeGaps:audit}=
 require('../../workbench/c1-all-native-source-gap-ledger.cjs');
function fixture(){
 const points={A:{x:0,y:0,z:0},C:{x:3,y:16,z:2},D:{x:5,y:6,z:23}};
 const geometry={id:'C1SkewTetra',data:{points,edges:[['A','C'],['A','D']]}};
 const source=edge=>{
  const [a,b]=edge.split('|'),sourceEdgeId=geometry.id+'::'+edge;
  return {sourceEdgeId,occtSourceCurveParameterRange:[0,
   Math.hypot(...['x','y','z'].map(k=>points[b][k]-points[a][k]))],
   occtSourceCurveFirstPoint3D:points[a],occtSourceCurveLastPoint3D:points[b],
   originalOCCTBRepVertexXYZMatched:true,occtCurveTypeIndependentlyVerified:true,
   occtSourceCurve3DEndpointsAndMidpointVerified:true,occtSourceCurveType:'line'};
 };
 const cad={schema:'draftai-c1-ocjs-real-visible-brep/1',engine:'opencascade.js',
  sourceGeometryId:geometry.id,revision:11,
  completeSourceTopology3DEndpointCorrespondence:true,
  actualOCCTCurveTypeIndependentlyVerified:true,
  actualOriginalTopoDSToHLRGeneratedEdgeLinkVerified:false,
  lineStyleCertified:false,v5Authorized:false,
  originalBRepSourceEdges:[source('A|C'),source('A|D')],
  views:{V:[],H:[],W:[]},hiddenSharpViews:{V:[],H:[],W:[]}};
 const m5Ledger={schema:'draftai-c1-ocjs-m5-convex-proof-gap-ledger/1',
  sourceGeometryId:geometry.id,revision:11,engine:'opencascade.js',
  realCadSourceCandidateOnly:true,officialLineStylesVerified:false,
  wholeSolidV5Ready:false,signedV5ActionCount:0,
  views:{V:{intervals:[]},H:{intervals:[]},W:{intervals:[]}}};
 const add=(view,edge,gap,range=[0,1])=>{
  const sourceEdgeId=geometry.id+'::'+edge;
  const covered=gap===null;
  m5Ledger.views[view].intervals.push({
   view,sourceEdgeId,engineeringLineStyle:'undetermined',signedV5:false,
   realNativeOriginal3DSourceParameterCovered:covered,
   exactNativeOriginal3DSourceCoverage:{
    sourceEdgeId,view,originalSourceParameterRange:range,
    entireOriginalParameterIntervalCovered:covered,
    positiveLengthUncoveredIntervals:covered?[]:[gap],
    status:covered?'exact-original-3d-native-source-covered':
     'exact-original-3d-native-source-positive-gap',
    engineeringLineStyle:'undetermined',signedV5Action:false}
  });
 };
 add('H','A|C',[0,5.02742501717052e-18]);
 add('W','A|C',[0,1.1102230246251565e-16]);
 add('W','A|D',[0,9.431983218054427e-18]);
 add('V','A|D',null);
 return {geometry,cad,m5Ledger};
}
test('generic C1 M5 traverses ALL native positive source gaps, not only a hard-coded three-record list',()=>{
 const x=fixture(),out=audit(x);
 assert.equal(out.status,'full-current-M5-interval-inventory-unsigned');
 assert.equal(out.originalM0PhysicalSourceCount,2);
 assert.equal(out.totals.currentM5SourceSpans,4);
 assert.equal(out.totals.positiveGapSourceSpans,3);
 assert.equal(out.totals.individualPositiveNativeGaps,3);
 assert.equal(out.totals.fullyNativeCoveredSpans,1);
 assert.equal(out.rows.length,4);
 assert.ok(out.rows.filter(row=>row.positiveGaps.length===1).every(row=>
  row.jointNativeGapForensics?.positiveGapCount===1&&
  row.jointNativeGapForensics?.signedV5ActionCount===0));
 assert.ok(Object.isFrozen(out.rows[0].positiveGaps));
 assert.equal(out.knownThreeGapCoordinatesNotUsedToSelectRecords,true);
 assert.equal(out.allNoncollapsedOriginalM0SourcesRepresentedInCurrentM5,false);
 assert.deepEqual(out.unrepresentedOriginalM0ProjectedSources.map(x=>
  [x.view,x.sourceEdgeId]),[
  ['V','C1SkewTetra::A|C'],['H','C1SkewTetra::A|D']]);
 assert.ok(out.unrepresentedOriginalM0ProjectedSources.every(x=>
  x.engineeringLineStyle==='undetermined'&&x.signedV5Action===false));
 assert.equal(out.generatedHLRToOriginalTopoDSHistoryCertified,false);
 assert.equal(out.officialV5Authorized,false);
});
test('generic C1 detects additional independent source gaps beyond known skew-tetra A-end regressions',()=>{
 const x=fixture();
 x.m5Ledger.views.V.intervals[0].realNativeOriginal3DSourceParameterCovered=false;
 const proof=x.m5Ledger.views.V.intervals[0].exactNativeOriginal3DSourceCoverage;
 proof.entireOriginalParameterIntervalCovered=false;
 proof.positiveLengthUncoveredIntervals=[[0.2,0.3],[0.8,0.9]];
 proof.status='exact-original-3d-native-source-positive-gap';
 const out=audit(x);
 assert.equal(out.totals.positiveGapSourceSpans,4);
 assert.equal(out.totals.individualPositiveNativeGaps,5);
 const v=out.rows.find(row=>row.view==='V');
 assert.deepEqual(v.positiveGaps,[[0.2,0.3],[0.8,0.9]]);
 assert.equal(v.jointNativeGapForensics.positiveGapCount,2);
 assert.equal(out.signedV5ActionCount,0);
});
test('canonical source with no reconstructable native parameter remains explicitly blocked',()=>{
 const x=fixture(),m=x.m5Ledger.views.V.intervals[0];
 m.realNativeOriginal3DSourceParameterCovered=false;
 m.exactNativeOriginal3DSourceCoverage={
  sourceEdgeId:m.sourceEdgeId,view:'V',originalSourceParameterRange:null,
  entireOriginalParameterIntervalCovered:false,
  positiveLengthUncoveredIntervals:[],
  status:'unreconstructable-original-3d-source-parameter',
  engineeringLineStyle:'undetermined',signedV5Action:false
 };
 const out=audit(x);
 assert.equal(out.totals.originalParameterUnreconstructableSpans,1);
 assert.equal(out.totals.currentM5SourceSpans,4);
 assert.equal(out.officialV5Authorized,false);
});
test('missing M5 source and absent native witness cannot impersonate complete source inventory',()=>{
 const x=fixture();
 x.m5Ledger.views.V.intervals[0].exactNativeOriginal3DSourceCoverage=null;
 x.m5Ledger.views.V.intervals[0].realNativeOriginal3DSourceParameterCovered=false;
 const out=audit(x);
 assert.equal(out.totals.missingOrUnboundSourceSpans,1);
 assert.equal(out.totals.currentM5SourceSpans,4);
 assert.equal(out.rows.find(row=>row.view==='V').jointNativeGapForensics,null);
});
test('an original 3D source identity, revision or gap partition cannot be forged',()=>{
 const changes=[
  x=>x.m5Ledger.revision++,
  x=>x.m5Ledger.views.H.intervals[0].sourceEdgeId='C1SkewTetra::A|B',
  x=>x.m5Ledger.views.H.intervals[0].exactNativeOriginal3DSourceCoverage.
   positiveLengthUncoveredIntervals=[[0,0]],
  x=>x.m5Ledger.views.H.intervals[0].exactNativeOriginal3DSourceCoverage.
   positiveLengthUncoveredIntervals=[[0,0.2],[0.1,0.5]],
  x=>x.m5Ledger.views.H.intervals[0].realNativeOriginal3DSourceParameterCovered=true,
  x=>x.m5Ledger.views.H.intervals[0].signedV5=true
 ];
 for(const change of changes){const x=fixture();change(x);
  assert.throws(()=>audit(x),/current unsigned|original M0|ordered positive|positive native gap count|incorrectly signed/);
 }
});

test('an omitted entire M0 source is not silently counted as a complete native inventory',()=>{
 const x=fixture();
 // Remove one canonical M5 row: remaining rows are internally consistent,
 // but the physical source is still present in the original 3D geometry.
 x.m5Ledger.views.V.intervals.length=0;
 const out=audit(x);
 assert.equal(out.allCurrentM5SourceSpansAccountedFor,true);
 assert.equal(out.allNoncollapsedOriginalM0SourcesRepresentedInCurrentM5,false);
 assert.deepEqual(out.unrepresentedOriginalM0ProjectedSources.filter(x=>
  x.view==='V').map(x=>x.sourceEdgeId),[
  'C1SkewTetra::A|C','C1SkewTetra::A|D']);
 assert.equal(out.officialV5Authorized,false);
});
test('collapsed original source projection is not a missing positive HLR stroke',()=>{
 const x=fixture();
 // A|C collapses only in V (same x,z, different y); do not run native
 // gap forensics on altered source BRep witnesses in this counterexample.
 x.geometry.data.points.C={x:0,y:16,z:0};
 for(const view of ['V','H','W'])x.m5Ledger.views[view].intervals=[];
 const out=audit(x);
 assert.equal(out.unrepresentedOriginalM0ProjectedSources.some(x=>
  x.view==='V'&&x.sourceEdgeId==='C1SkewTetra::A|C'),false);
 assert.equal(out.unrepresentedOriginalM0ProjectedSources.some(x=>
  x.view==='H'&&x.sourceEdgeId==='C1SkewTetra::A|C'),true);
 assert.equal(out.officialV5Authorized,false);
});

test('unrepresented M0 edge is linked only to genuine native HLR paper candidates, not TopoDS history',()=>{
 const x=fixture();
 const sourceEdgeId='C1SkewTetra::A|C';
 x.cad.views.V.push({
  from:{u:0,v:0},to:{u:3,v:2},
  sourceCandidate3DLifts:[{sourceEdgeId}],
  engineeringLineStyle:'undetermined',v5Authorized:false
 });
 const out=audit(x);
 const v=out.unrepresentedM0NativeHLRCandidateForensics.find(x=>
  x.view==='V'&&x.sourceEdgeId===sourceEdgeId);
 assert.equal(v.nativeHLRPaperCandidateCount,1);
 assert.deepEqual(v.nativeHLRPaperCandidates.map(x=>[x.hlrClass,x.ordinal]),
  [['visible-sharp',0]]);
 assert.equal(v.nativeHLRPaperCandidates[0].original3DLiftCount,1);
 assert.equal(v.nativeHLRPaperCandidates[0].nativeGeneratedTopoDSToOriginalSourceHistoryCertified,false);
 assert.equal(v.continuousOcclusionCertified,false);
 assert.equal(v.signedV5Action,false);
 assert.equal(out.officialV5Authorized,false);
});
test('a native HLR paper candidate from an unknown M0 edge fails closed',()=>{
 const x=fixture();
 x.cad.hiddenSharpViews.V.push({
  from:{u:0,v:0},to:{u:3,v:2},
  sourceCandidate3DLifts:[{sourceEdgeId:'C1SkewTetra::A|B'}]
 });
 assert.throws(()=>audit(x),/lacks M0 provenance bounds/);
});
test('no native HLR paper candidate is not evidence of continuous occlusion',()=>{
 const out=audit(fixture());
 assert.ok(out.unrepresentedM0NativeHLRCandidateForensics.every(x=>
  x.nativeHLRPaperCandidateCount===0&&
  x.noHLRPaperCandidateDoesNotProveGlobalOcclusion===true&&
  x.continuousOcclusionCertified===false));
});

test('omitted M0 source paper alias cannot borrow a different native TopoDS owner',()=>{
 const x=fixture(),sourceEdgeId='C1SkewTetra::A|C';
 x.cad.views.V.push({from:{u:0,v:0},to:{u:3,v:2},
  sourceCandidate3DLifts:[{sourceEdgeId}]});
 x.cad.nativeSourceScopedSharpOutputByView={V:{
  nativeSourceIdentityConflicts:{rows:[{
   view:'V',hlrClass:'visible-sharp',nativeWholeSolidEdgeOrdinal:0,
   originalPhysicalSourceEdgeId:'C1SkewTetra::A|D',
   nativeScopedGeneratedEdgeIsSame:true
  }]}}};
 const out=audit(x),row=out.unrepresentedM0NativeHLRCandidateForensics.find(
  x=>x.view==='V'&&x.sourceEdgeId===sourceEdgeId);
 assert.equal(row.nativeHLRPaperCandidateCount,1);
 assert.equal(row.directNativeGeneratedIdentityCandidateCount,0);
 assert.deepEqual(row.paperCandidatesClaimedByDifferentOriginalNativeSource,
  [{hlrClass:'visible-sharp',ordinal:0}]);
 assert.equal(row.signedV5Action,false);
 x.cad.nativeSourceScopedSharpOutputByView.V.nativeSourceIdentityConflicts.rows[0].
  originalPhysicalSourceEdgeId=sourceEdgeId;
 const same=audit(x).unrepresentedM0NativeHLRCandidateForensics.find(
  x=>x.view==='V'&&x.sourceEdgeId===sourceEdgeId);
 assert.equal(same.directNativeGeneratedIdentityCandidateCount,1);
 assert.equal(same.nativeIdentityDoesNotCertifyOriginalSourceParameterCoverage,true);
 assert.equal(same.continuousOcclusionCertified,false);
 assert.equal(same.signedV5Action,false);
});

test('native owner claims reject unknown original source, invalid ordinal and duplicates',()=>{
 const changes=[
  rows=>{rows[0].originalPhysicalSourceEdgeId='C1SkewTetra::A|B';},
  rows=>{rows[0].nativeWholeSolidEdgeOrdinal=1;},
  rows=>{rows.push({...rows[0]});},
  rows=>{rows[0].nativeScopedGeneratedEdgeIsSame=false;}
 ];
 for(const change of changes){
  const x=fixture(),sourceEdgeId='C1SkewTetra::A|C';
  x.cad.views.V.push({from:{u:0,v:0},to:{u:3,v:2},
   sourceCandidate3DLifts:[{sourceEdgeId}]});
  const rows=[{view:'V',hlrClass:'visible-sharp',
   nativeWholeSolidEdgeOrdinal:0,originalPhysicalSourceEdgeId:sourceEdgeId,
   nativeScopedGeneratedEdgeIsSame:true}];
  change(rows);
  x.cad.nativeSourceScopedSharpOutputByView={V:{
   nativeSourceIdentityConflicts:{rows}}};
  assert.throws(()=>audit(x),/invalid actual native HLR|duplicate actual native HLR/);
 }
});

test('canonical M5 row present for original M0 source cannot conceal an unrepresented tail',()=>{
 const x=fixture();
 const row=x.m5Ledger.views.V.intervals[0];
 row.exactNativeOriginal3DSourceCoverage.originalSourceParameterRange=[0,0.5];
 const out=audit(x);
 const v=out.originalM0CanonicalSourceInventory.rows.find(row=>
  row.view==='V'&&row.sourceEdgeId==='C1SkewTetra::A|D');
 assert.deepEqual(v.positiveLengthUnrepresentedM5ParameterIntervals,[[0.5,1]]);
 assert.equal(v.wholeOriginalM0SourceParameterInventoryComplete,false);
 assert.equal(out.originalM0CanonicalSourceInventory.
  allNoncollapsedOriginalM0SourceParametersRepresentedExactlyOnce,false);
 assert.equal(out.officialV5Authorized,false);
});
test('canonical M5 original source overlap remains unsigned even when union covers [0,1]',()=>{
 const x=fixture();
 const row=x.m5Ledger.views.V.intervals[0];
 row.exactNativeOriginal3DSourceCoverage.originalSourceParameterRange=[0,0.75];
 const second=structuredClone(row);
 second.exactNativeOriginal3DSourceCoverage.originalSourceParameterRange=[0.5,1];
 x.m5Ledger.views.V.intervals.push(second);
 const out=audit(x);
 const v=out.originalM0CanonicalSourceInventory.rows.find(row=>
  row.view==='V'&&row.sourceEdgeId==='C1SkewTetra::A|D');
 assert.deepEqual(v.positiveLengthUnrepresentedM5ParameterIntervals,[]);
 assert.deepEqual(v.positiveLengthOverlappingM5ParameterIntervals,[[0.5,0.75]]);
 assert.equal(v.wholeOriginalM0SourceParameterInventoryComplete,false);
 assert.equal(out.originalM0CanonicalSourceInventory.counts.
  sourceViewsWithOverlappingM5ParameterSpans,1);
 assert.equal(out.officialV5Authorized,false);
});
