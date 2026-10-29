'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {auditC1JointNativeGapEvidence:audit}=require('../../workbench/c1-joint-native-gap-evidence.cjs');
const gaps=[
 ['H','A|C',5.02742501717052e-18],
 ['W','A|C',1.1102230246251565e-16],
 ['W','A|D',9.431983218054427e-18]
];
function pair(view,sourceEdgeId,end,{collinear=0,offLine=0,native=0}={}){
 const gap=[0,end];
 return {
  curve:{view,sourceEdgeId,gapsExamined:1,
   generatedHLREdgeToOriginalTopoDSHistoryCertified:false,
   globalContinuousVisibilityCertified:false,signedV5ActionCount:0,
   rows:[{gapOrdinal:0,originalM0SourceParameterGap:gap,
    exactOriginalOcctCurveParameterGapHasPositiveLength:true,
    actualOriginalBRepCurveParametersOnly:true,
    roundedOriginalOcctCurveParameterGapCollapsed:true,signedV5Action:false}]},
  adjacency:{view,sourceEdgeId,generatedToOriginalTopoDSFullHistoryCertified:false,
   globalContinuousVisibilityCertified:false,signedV5ActionCount:0,
   rows:[{gapOrdinal:0,originalSourceParameterGap:gap,
    exactReceivedPaperCollinearCandidateStrictlyInsideGapCount:collinear,
    exactReceivedPaperOffLineCandidateStrictlyInsideGapCount:offLine,
    from:{directNativeOriginalVertexIsSameEndpointCount:native},
    sourceGapClosedByNativeEndpointEvidence:false,signedV5Action:false}]}
 };
}
for(const [view,edge,end] of gaps){
 test('positive original TopoDS gap remains unsigned: '+view+' '+edge,()=>{
  const result=audit(pair(view,'g::'+edge,end));
  assert.equal(result.positiveGapCount,1);
  assert.equal(result.rows[0].exactOriginalOcctCurvePositive,true);
  assert.equal(result.rows[0].generatedToOriginalTopoDSHistoryProven,false);
  assert.equal(result.rows[0].completeOriginalSourceIntervalCoverageProven,false);
  assert.equal(result.rows[0].engineeringLineStyle,'undetermined');
  assert.equal(result.signedV5ActionCount,0);
  assert.equal(Object.isFrozen(result.rows[0]),true);
 });
}
test('collinear paper endpoint cannot impersonate native history',()=>{
 const r=audit(pair('W','g::A|C',1e-16,{collinear:1,native:1}));
 assert.equal(r.rows[0].diagnosis,'paper-candidate-without-generated-history');
 assert.equal(r.fullOriginalSourceHistoryCertified,false);
});
test('transverse paper drift cannot close gap',()=>{
 const r=audit(pair('H','g::A|C',1e-18,{offLine:1}));
 assert.equal(r.rows[0].diagnosis,'off-line-paper-candidate-without-generated-history');
});
test('mismatched source interval fails closed',()=>{
 const p=pair('H','g::A|C',1e-18);
 p.adjacency.rows[0].originalSourceParameterGap=[0,2e-18];
 assert.throws(()=>audit(p),/mismatched/);
});
test('claimed native history or signed V5 is rejected',()=>{
 const p=pair('H','g::A|C',1e-18);
 p.curve.generatedHLREdgeToOriginalTopoDSHistoryCertified=true;
 assert.throws(()=>audit(p),/unsigned/);
});

test('shared raw OCCT input invokes both independent auditors for all three skew-tetra gaps',()=>{
 const {auditC1JointNativeGapFromRealHLR:run}=
  require('../../workbench/c1-joint-native-gap-evidence.cjs');
 const points={A:{x:0,y:0,z:0},C:{x:3,y:16,z:2},D:{x:5,y:6,z:23}};
 const geometry={id:'C1SkewTetra',data:{points,edges:[['A','C'],['A','D']]}};
 for(const [view,edge,end] of gaps){
  const [a,b]=edge.split('|');
  const sourceEdgeId='C1SkewTetra::'+edge;
  const originalBRepSource={
   sourceEdgeId,occtSourceCurveParameterRange:[0,
    Math.hypot(...['x','y','z'].map(k=>points[b][k]-points[a][k]))],
   occtSourceCurveFirstPoint3D:points[a],occtSourceCurveLastPoint3D:points[b],
   originalOCCTBRepVertexXYZMatched:true,occtCurveTypeIndependentlyVerified:true,
   occtSourceCurve3DEndpointsAndMidpointVerified:true,occtSourceCurveType:'line'
  };
  const input={geometry,view,sourceEdgeId,originalBRepSource,
   uncoveredIntervals:[[0,end]],visibleSegments:[],hiddenSegments:[]};
  const result=run(input);
  assert.equal(result.positiveGapCount,1);
  assert.equal(result.rows[0].diagnosis,'no-generated-history-for-positive-source-gap');
  assert.equal(result.constructionIntentAuthorized,false);
  assert.equal(result.signedV5ActionCount,0);
  assert.throws(()=>run({...input,originalBRepSource:{
   ...originalBRepSource,occtCurveTypeIndependentlyVerified:false}}),
   /actual original OCCT/);
 }
});

test('batch rejects absent, duplicate, altered and invented native HLR records',()=>{
 const {auditC1ThreeNativeGapBatch:batch}=
  require('../../workbench/c1-joint-native-gap-evidence.cjs');
 const points={A:{x:0,y:0,z:0},C:{x:3,y:16,z:2},D:{x:5,y:6,z:23}};
 const geometry={id:'C1SkewTetra',data:{points,edges:[['A','C'],['A','D']]}};
 const records=gaps.map(([view,edge,end])=>{
  const [a,b]=edge.split('|'),sourceEdgeId=geometry.id+'::'+edge;
  return {view,sourceEdgeId,uncoveredIntervals:[[0,end]],
   visibleSegments:[],hiddenSegments:[],
   originalBRepSource:{sourceEdgeId,
    occtSourceCurveParameterRange:[0,
     Math.hypot(...['x','y','z'].map(k=>points[b][k]-points[a][k]))],
    occtSourceCurveFirstPoint3D:points[a],
    occtSourceCurveLastPoint3D:points[b],
    originalOCCTBRepVertexXYZMatched:true,
    occtCurveTypeIndependentlyVerified:true,
    occtSourceCurve3DEndpointsAndMidpointVerified:true,
    occtSourceCurveType:'line'}
  };
 });
 const result=batch({geometry,records:[...records].reverse()});
 assert.equal(result.recordsExamined,3);
 assert.equal(result.gapsClosed,0);
 assert.equal(result.signedV5ActionCount,0);
 assert.ok(result.results.every(r=>r.positiveGapCount===1));
 assert.throws(()=>batch({geometry,records:records.slice(1)}),/three actual/);
 assert.throws(()=>batch({geometry,records:[records[0],records[0],records[2]]}),
  /missing or duplicated/);
 const altered=records.map(r=>({...r}));
 altered[1]={...altered[1],uncoveredIntervals:[[0,1e-16]]};
 assert.throws(()=>batch({geometry,records:altered}),/native gap intervals/);
 const invented=records.map(r=>({...r}));
 invented[2]={...invented[2],sourceEdgeId:'C1SkewTetra::B|C'};
 assert.throws(()=>batch({geometry,records:invented}),/missing or duplicated/);
});

test('actual-shaped HLR native IsSame and transverse dyadic drift remain unsigned together',()=>{
 const {auditC1JointNativeGapFromRealHLR:run}=
  require('../../workbench/c1-joint-native-gap-evidence.cjs');
 const points={A:{x:0,y:0,z:0},C:{x:3,y:16,z:2}};
 const geometry={id:'C1SkewTetra',data:{points,edges:[['A','C']]}};
 const sourceEdgeId='C1SkewTetra::A|C';
 const originalBRepSource={sourceEdgeId,
  occtSourceCurveParameterRange:[0,Math.hypot(3,16,2)],
  occtSourceCurveFirstPoint3D:points.A,occtSourceCurveLastPoint3D:points.C,
  originalOCCTBRepVertexXYZMatched:true,occtCurveTypeIndependentlyVerified:true,
  occtSourceCurve3DEndpointsAndMidpointVerified:true,occtSourceCurveType:'line'};
 const native=id=>({directlySameOriginalM0VertexId:id,
  directOriginal3DVertexTopoDSIdentityProven:id!==null});
 const segment=(from,fromId,edgeSame)=>({
  view:'W',occtHLRVisibilityClass:'visible-sharp',from,to:{u:16,v:2},
  sourceCandidate3DLifts:[{sourceEdgeId,originalVertexIds:['A','C'],
   paperOnlyUnclampedOriginalSourceParameters:[0,1]}],
  directNativeVertexOriginalSource:[native(fromId),native('C')],
  actualOCCTGeneratedEdgeDirectOriginalBRepIsSameProven:edgeSame
 });
 const input={geometry,view:'W',sourceEdgeId,originalBRepSource,
  uncoveredIntervals:[[0,1.1102230246251565e-16]],hiddenSegments:[]};
 const nativeSame=run({...input,visibleSegments:[
  segment({u:0,v:0},'A',true)]});
 assert.equal(nativeSame.rows[0].nativeGeneratedOriginalVertexAtGapStart,true);
 assert.equal(nativeSame.rows[0].generatedToOriginalTopoDSHistoryProven,false);
 assert.equal(nativeSame.signedV5ActionCount,0);
 const drift=run({...input,visibleSegments:[
  segment({u:8.881784197001252e-16,v:0},null,false)]});
 assert.equal(drift.rows[0].transversePaperEndpointInsideGap,true);
 assert.equal(drift.rows[0].diagnosis,'off-line-paper-candidate-without-generated-history');
 assert.equal(drift.rows[0].completeOriginalSourceIntervalCoverageProven,false);
});

test('real OCJS result schema adapter reads original BRep ledger and rejects forged authority',()=>{
 const {auditC1JointNativeGapFromCad:fromCad}=
  require('../../workbench/c1-joint-native-gap-evidence.cjs');
 const points={A:{x:0,y:0,z:0},C:{x:3,y:16,z:2}};
 const geometry={id:'C1SkewTetra',data:{points,edges:[['A','C']]}};
 const sourceEdgeId='C1SkewTetra::A|C';
 const original={sourceEdgeId,
  occtSourceCurveParameterRange:[0,Math.hypot(3,16,2)],
  occtSourceCurveFirstPoint3D:points.A,
  occtSourceCurveLastPoint3D:points.C,
  originalOCCTBRepVertexXYZMatched:true,
  occtCurveTypeIndependentlyVerified:true,
  occtSourceCurve3DEndpointsAndMidpointVerified:true,
  occtSourceCurveType:'line'};
 const cad={schema:'draftai-c1-ocjs-real-visible-brep/1',
  engine:'opencascade.js',sourceGeometryId:geometry.id,revision:1,
  completeSourceTopology3DEndpointCorrespondence:true,
  actualOCCTCurveTypeIndependentlyVerified:true,
  actualOriginalTopoDSToHLRGeneratedEdgeLinkVerified:false,
  lineStyleCertified:false,v5Authorized:false,
  originalBRepSourceEdges:[original],
  views:{W:[]},hiddenSharpViews:{W:[]}};
 const input={geometry,cad,view:'W',sourceEdgeId,
  uncoveredIntervals:[[0,1.1102230246251565e-16]]};
 const result=fromCad(input);
 assert.equal(result.positiveGapCount,1);
 assert.equal(result.fullOriginalSourceHistoryCertified,false);
 assert.equal(result.signedV5ActionCount,0);
 for(const forged of [
  {...cad,sourceGeometryId:'wrong'},
  {...cad,revision:0},
  {...cad,actualOriginalTopoDSToHLRGeneratedEdgeLinkVerified:true},
  {...cad,v5Authorized:true},
  {...cad,originalBRepSourceEdges:[original,original]},
  {...cad,views:{}}
 ])assert.throws(()=>fromCad({...input,cad:forged}),/OCJS CAD|unique real original/);
});

test('single OCJS CAD payload drives all three gap auditors; forged source data fails closed',()=>{
 const {auditC1ThreeNativeGapBatchFromCad:batch}=
  require('../../workbench/c1-joint-native-gap-evidence.cjs');
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
  sourceGeometryId:geometry.id,revision:1,
  completeSourceTopology3DEndpointCorrespondence:true,
  actualOCCTCurveTypeIndependentlyVerified:true,
  actualOriginalTopoDSToHLRGeneratedEdgeLinkVerified:false,
  lineStyleCertified:false,v5Authorized:false,
  originalBRepSourceEdges:[source('A|C'),source('A|D')],
  views:{V:[],H:[],W:[]},hiddenSharpViews:{V:[],H:[],W:[]}};
 const uncoveredByViewAndSource=Object.fromEntries(gaps.map(([view,edge,end])=>
  [view+'::'+geometry.id+'::'+edge,[[0,end]]]));
 const input={geometry,cad,uncoveredByViewAndSource};
 const result=batch(input);
 assert.equal(result.recordsExamined,3);
 assert.equal(result.gapsClosed,0);
 assert.ok(result.results.every(r=>r.signedV5ActionCount===0));
 assert.equal(result.constructionIntentAuthorized,false);
 assert.throws(()=>batch({...input,cad:{...cad,v5Authorized:true}}),
  /unsigned complete OCJS/);
 assert.throws(()=>batch({...input,uncoveredByViewAndSource:{
  ...uncoveredByViewAndSource,'H::C1SkewTetra::A|C':[[0,0]]}}),
  /unverified original-source gap/);
 assert.throws(()=>batch({...input,uncoveredByViewAndSource:{
  ...uncoveredByViewAndSource,'V::C1SkewTetra::A|C':[[0,1e-18]]}}),
  /exactly three/);
});

test('current OCJS/M5 proof ledger supplies three gaps without caller-provided interval map',()=>{
 const {auditC1ThreeNativeGapBatchFromM5Ledger:run}=
  require('../../workbench/c1-joint-native-gap-evidence.cjs');
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
  sourceGeometryId:geometry.id,revision:7,
  completeSourceTopology3DEndpointCorrespondence:true,
  actualOCCTCurveTypeIndependentlyVerified:true,
  actualOriginalTopoDSToHLRGeneratedEdgeLinkVerified:false,
  lineStyleCertified:false,v5Authorized:false,
  originalBRepSourceEdges:[source('A|C'),source('A|D')],
  views:{V:[],H:[],W:[]},hiddenSharpViews:{V:[],H:[],W:[]}};
 const m5Ledger={schema:'draftai-c1-ocjs-m5-convex-proof-gap-ledger/1',
  sourceGeometryId:geometry.id,revision:7,engine:'opencascade.js',
  realCadSourceCandidateOnly:true,officialLineStylesVerified:false,
  wholeSolidV5Ready:false,signedV5ActionCount:0,
  views:{V:{intervals:[]},H:{intervals:[]},W:{intervals:[]}}};
 for(const [view,edge,end] of gaps){
  const sourceEdgeId=geometry.id+'::'+edge;
  m5Ledger.views[view].intervals.push({
   sourceEdgeId,engineeringLineStyle:'undetermined',signedV5:false,
   realNativeOriginal3DSourceParameterCovered:false,
   exactNativeOriginal3DSourceCoverage:{
    sourceEdgeId,view,originalSourceParameterRange:[0,1],
    entireOriginalParameterIntervalCovered:false,
    positiveLengthUncoveredIntervals:[[0,end]],
    status:'exact-original-3d-native-source-positive-gap',
    engineeringLineStyle:'undetermined',signedV5Action:false}
  });
 }
 const input={geometry,cad,m5Ledger};
 const result=run(input);
 assert.equal(result.recordsExamined,3);
 assert.equal(result.canonicalM5GapLedgerBound,true);
 assert.equal(result.revision,7);
 assert.equal(result.gapsClosed,0);
 assert.equal(result.signedV5ActionCount,0);
 assert.equal(result.originalTopoDSHistoryCertified,false);
 assert.ok(Object.isFrozen(result.results[0]));
 const mutated=change=>{
  const copy=structuredClone(m5Ledger);change(copy);
  assert.throws(()=>run({...input,m5Ledger:copy}),
   /current unsigned|nonunique canonical|M5 native source gap/);
 };
 mutated(x=>x.revision=6);
 mutated(x=>x.signedV5ActionCount=1);
 mutated(x=>x.views.H.intervals[0].exactNativeOriginal3DSourceCoverage
  .positiveLengthUncoveredIntervals=[[0,0]]);
 mutated(x=>x.views.W.intervals.push(
  structuredClone(x.views.W.intervals[0])));
 mutated(x=>x.views.H.intervals[0].realNativeOriginal3DSourceParameterCovered=true);
 mutated(x=>x.views.W.intervals[1].exactNativeOriginal3DSourceCoverage
  .originalSourceParameterRange=[Number.MIN_VALUE,1]);
 // A single representable binary64 ULP is positive source-space geometry,
 // even if both paper endpoints round to the same displayed pixel.
 const dv=new DataView(new ArrayBuffer(8));
 dv.setFloat64(0,5.02742501717052e-18);
 dv.setBigUint64(0,dv.getBigUint64(0)-1n);
 const oneUlpShorter=dv.getFloat64(0);
 assert.ok(oneUlpShorter>0&&oneUlpShorter<5.02742501717052e-18);
 mutated(x=>x.views.H.intervals[0].exactNativeOriginal3DSourceCoverage
  .positiveLengthUncoveredIntervals=[[0,oneUlpShorter]]);
});
