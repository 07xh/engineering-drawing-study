'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {reviewC1NativeHiddenFinalM5Strokes:review}=
 require('../../workbench/c1-native-hidden-global-m5-stroke-gate.cjs');
const revision=73,geometry={id:'G',data:{points:{A:{x:0,y:0,z:0}}}};
const caseData=()=>{
 const rows=[{view:'H',revision,sourceGeometryId:'G',
  nativeHiddenSharpEdgeOrdinal:0,
  survivingOriginal3DSourceUnique:true,
  wholeOriginalModelOpenIntervalLocallyAccountedByRayMaskOrM0Source:true,
  realNativeHLRHiddenPaperLineLocallyExplainedByTrueHLRAndM0FullFront:true,
  nativeHLRGeneratedSourceTopoDSLinksAndAllJunctionsProven:false,
  signedV5Action:false}];
 return {geometry,revision,
  gapProof:{sourceGeometryId:'G',revision,signedV5ActionCount:0,
   actualNativeGeneratedHLRPaperCoverageAndOriginalModelProofNotConflated:true,rows},
  dualProof:{sourceGeometryId:'G',revision,signedV5ActionCount:0,rows:[{
   view:'H',nativeHiddenSharpEdgeOrdinal:0,
   remainingOriginal3DPhysicalSourceUnique:true,
   originalHiddenSourceEdgeId:'G::A|B',
   fullGBDashedLineOrVisibleLineAssignmentSigned:false,signedV5Action:false
  }]},
  endpointFans:{sourceGeometryId:'G',revision,
   nativeGeneratedTopoDSEdgeEndpointIdentityProven:false,
   signedV5ActionCount:0,rows:[{view:'H',nativeHiddenSharpEdgeOrdinal:0,
    nativeHLREdgeJunctionsCertified:false,signedV5Action:false,
    survivingOriginal3DEdgesWithEndpointFans:[{
     originalPhysicalSourceEdgeId:'G::A|B',
     endpointWitnesses:[{
      originalSource3DVertexId:'A',
      original3DSourceVertexPlusM4AndFanVerified:true
     },{
      originalSource3DVertexId:'B',
      original3DSourceVertexPlusM4AndFanVerified:false
     }]
    }]
   }]
  },
  globalM5Review:{schema:'draftai-c1-m5-final-source-obligation-review/1',
   sourceGeometryId:'G',revision,signedV5ActionCount:0,
   fullyCertifiedCount:0,rows:[{
    view:'H',sourceEdgeId:'G::A|B',
    originalSourceParameterRange:[0,1],
    independentGlobalProofGaps:{
     original3DSourceIdentity:true,completeIntervalVisibility:true,
     endpointAndProjectionTopology:true,engineeringLineStandard:true,
     soleConstructionIntentDAGV5:true
    },formalLineStyle:'undetermined',
    constructionIntentAuthorized:false,signedV5Action:false
   }]
  }
 };
};
test('entire native hidden HLR paper-open interval may be positive while genuine original vertex fan, TopoDS, GB and unique V5 still block',()=>{
 const r=review(caseData()),row=r.rows[0];
 assert.equal(r.counts.genuineHiddenHLRStrokesReviewed,1);
 assert.equal(r.counts.wholeRealNativeHiddenPaperOpenIntervalsLocallyProven,1);
 assert.equal(r.counts.original3DEndpointFanProofIncompleteStrokes,1);
 assert.equal(row.originalSourceM4AndClosed3DVertexFanIncompleteEndpointCount,1);
 assert.equal(row.entireRealOCCTHiddenPaperOpenIntervalLocallyVerified,true);
 assert.equal(row.additionalCanonicalM5GlobalBlockers.length,5);
 assert.equal(row.officialEngineeringLineStyle,'undetermined');
 assert.equal(r.officialEngineeringGBLineRulesCertified,false);
 assert.equal(r.signedConstructionStepDAGActions,0);
 assert.equal(r.signedV5ActionCount,0);
});
test('original physical M0 whole line alone without actual native OCCT full HLR paper proof is held separately',()=>{
 const x=caseData();x.gapProof.rows[0].realNativeHLRHiddenPaperLineLocallyExplainedByTrueHLRAndM0FullFront=false;
 const r=review(x);
 assert.equal(r.counts.wholeRealNativeHiddenPaperOpenIntervalsLocallyProven,0);
 assert.equal(r.counts.originalM0ModelPhysicalOpenRayEvidenceWithoutCompleteRealNativeHLR,1);
});
test('positive native paper evidence without original 3D model ray fails closed',()=>{
 const x=caseData();x.gapProof.rows[0].wholeOriginalModelOpenIntervalLocallyAccountedByRayMaskOrM0Source=false;
 assert.throws(()=>review(x),/native hidden true HLR paper mask cannot exist/);
});
test('original M5 source row must really exist and have same physical edge/view',()=>{
 const x=caseData();x.globalM5Review.rows[0].sourceEdgeId='G::C|D';
 assert.throws(()=>review(x),/no canonical original M5 global stroke review/);
});
test('no global engineering line style or ConstructionIntent/V5 signer may be forged by a local HLR source proof',()=>{
 const x=caseData();x.globalM5Review.rows[0].formalLineStyle='dashed';
 assert.throws(()=>review(x),/prematurely signed/);
 const y=caseData();y.globalM5Review.rows[0].independentGlobalProofGaps.engineeringLineStandard=false;
 assert.throws(()=>review(y),/prematurely signed/);
});

test('invalid canonical source interval is rejected before native HLR review',()=>{
 const x=caseData();
 x.globalM5Review.rows[0].originalSourceParameterRange=[0,Number.NaN];
 assert.throws(()=>review(x),/finite positive partition/);
});
test('overlapping source/view intervals cannot be treated as one global source proof',()=>{
 const x=caseData(),first=x.globalM5Review.rows[0];
 first.originalSourceParameterRange=[0,0.7];
 x.globalM5Review.rows.push({
  ...first,originalSourceParameterRange:[0.5,1],
  independentGlobalProofGaps:{...first.independentGlobalProofGaps}
 });
 assert.throws(()=>review(x),/overlapping canonical original M5 source intervals/);
});
test('adjacent disjoint source intervals remain reviewable without signing',()=>{
 const x=caseData(),first=x.globalM5Review.rows[0];
 first.originalSourceParameterRange=[0,0.5];
 x.globalM5Review.rows.push({
  ...first,originalSourceParameterRange:[0.5,1],
  independentGlobalProofGaps:{...first.independentGlobalProofGaps}
 });
 const r=review(x);
 assert.equal(r.rows[0].originalGlobalSourceM5StrokeRowsReviewed,2);
 assert.equal(r.signedV5ActionCount,0);
});

test('positive full source partition coverage has no unexplained parameter gap',()=>{
 const r=review(caseData());
 assert.equal(r.rows[0].canonicalOriginalSourceParameterPartitionComplete,true);
 assert.deepEqual(r.rows[0].canonicalOriginalSourceParameterGaps,[]);
 assert.equal(r.counts.incompleteCanonicalOriginalSourcePartitions,0);
 assert.equal(r.signedV5ActionCount,0);
});
test('missing middle source parameter interval is explicitly held as a gap',()=>{
 const x=caseData(),first=x.globalM5Review.rows[0];
 first.originalSourceParameterRange=[0,0.3];
 x.globalM5Review.rows.push({
  ...first,originalSourceParameterRange:[0.6,1],
  independentGlobalProofGaps:{...first.independentGlobalProofGaps}
 });
 const r=review(x);
 assert.equal(r.rows[0].canonicalOriginalSourceParameterPartitionComplete,false);
 assert.deepEqual(r.rows[0].canonicalOriginalSourceParameterGaps,[[0.3,0.6]]);
 assert.equal(r.counts.incompleteCanonicalOriginalSourcePartitions,1);
 assert.equal(r.signedV5ActionCount,0);
});
test('missing start and end of original source are both reported',()=>{
 const x=caseData();
 x.globalM5Review.rows[0].originalSourceParameterRange=[0.2,0.8];
 const r=review(x);
 assert.deepEqual(r.rows[0].canonicalOriginalSourceParameterGaps,[[0,0.2],[0.8,1]]);
 assert.equal(r.signedV5ActionCount,0);
});

test('three positive local prerequisites do not authorize engineering line style or V5',()=>{
 const x=caseData();
 x.endpointFans.rows[0].survivingOriginal3DEdgesWithEndpointFans[0].endpointWitnesses[1].original3DSourceVertexPlusM4AndFanVerified=true;
 const r=review(x),row=r.rows[0];
 assert.deepEqual(row.jointPositiveM5Prerequisites,{
  completeSourceParameterCoverage:true,
  original3DEndpointAndM4FanTopology:true,
  continuousOriginalModelAndRealNativeHLROcclusion:true
 });
 assert.equal(row.jointPositiveM5PrerequisitesSatisfied,true);
 assert.equal(row.officialEngineeringLineStyle,'undetermined');
 assert.equal(row.signedV5Action,false);
});
test('endpoint fan defect blocks conjunctive positive M5 prerequisite',()=>{
 const r=review(caseData());
 assert.equal(r.rows[0].jointPositiveM5Prerequisites.original3DEndpointAndM4FanTopology,false);
 assert.equal(r.rows[0].jointPositiveM5PrerequisitesSatisfied,false);
});
test('missing native HLR occlusion blocks joint positive evidence even with endpoints',()=>{
 const x=caseData();
 x.endpointFans.rows[0].survivingOriginal3DEdgesWithEndpointFans[0].endpointWitnesses[1].original3DSourceVertexPlusM4AndFanVerified=true;
 x.gapProof.rows[0].realNativeHLRHiddenPaperLineLocallyExplainedByTrueHLRAndM0FullFront=false;
 const r=review(x);
 assert.equal(r.rows[0].jointPositiveM5Prerequisites.continuousOriginalModelAndRealNativeHLROcclusion,false);
 assert.equal(r.rows[0].jointPositiveM5PrerequisitesSatisfied,false);
});
