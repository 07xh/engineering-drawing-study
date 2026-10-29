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
