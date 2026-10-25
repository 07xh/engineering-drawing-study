'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {project}=require('../../core/projection/conventions.js');
const {auditC1NativeHiddenUncoveredOriginalFrontRay:audit}=
 require('../../workbench/c1-native-hidden-exact-original-front-gap.cjs');
const gap=[.9999999999999998,1],revision=43;
const points={
 H0:{x:0,y:0,z:0},H1:{x:10,y:0,z:0},
 F0:{x:0,y:0,z:9},F1:{x:10,y:0,z:9}
};
const g=()=>({id:'G',data:{points:structuredClone(points),
 edges:[['H0','H1'],['F0','F1']]}});
const nativeSource=(id,full)=>({
 sourceEdgeId:id,
 originalSourceParameterRange:full?[0,1]:[0,.9999999999999998],
 fromCandidate3D:{...(id==='G::H0|H1'?points.H0:points.F0)},
 toCandidate3D:{...(id==='G::H0|H1'?points.H1:points.F1)},
 actualOriginalOCCTBRepEdge3DEndpointsVerified:true,
 originalOCCTSourceLineCurveVerified:true,
 originalXYZReprojectsToHLR:true,v5Authorized:false
});
const sourceBrep=id=>({
 sourceEdgeId:id,originalOCCTBRepVertexXYZMatched:true,
 occtCurveTypeIndependentlyVerified:true,occtSourceCurveType:'line',
 occtSourceCurve3DEndpointsAndMidpointVerified:true,
 generatedHLREdgeTopoDSIdentityMatched:false
});
function fixture(){
 const geometry=g();
 const h0=project(points.H0).H,h1=project(points.H1).H,
  f0=project(points.F0).H;
 const cad={
  sourceGeometryId:'G',revision,hiddenHLROutputFromActualOCCT:true,
  actualOCCTHLREdgeToOriginalTopoDSIdentityMatched:false,
  v5Authorized:false,
  originalBRepSourceEdges:[sourceBrep('G::H0|H1'),sourceBrep('G::F0|F1')],
  hiddenSharpViews:{V:[],H:[{
   view:'H',from:h0,to:h1,
   occtHLRVisibilityClass:'hidden-sharp',
   actualOCCTHLRFlattenedBRepLineVerified:true,
   actualOCCTHLRCurveEntireFiniteIntervalIsLine:true,
   v5Authorized:false,sourceCandidate3DLifts:[
    nativeSource('G::H0|H1',true)]
  }],W:[]},
  views:{V:[],H:[{
   view:'H',from:f0,
   // The TRUE visible BRep stops short of the ORIGINAL M0 endpoint.
   to:{u:10-Number.EPSILON*10,v:f0.v},
   occtHLRVisibilityClass:'visible-sharp',
   actualOCCTHLRFlattenedBRepLineVerified:true,
   actualOCCTHLRCurveEntireFiniteIntervalIsLine:true,
   v5Authorized:false,sourceCandidate3DLifts:[
    nativeSource('G::F0|F1',false)]
  }],W:[]}
 };
 const refinements=[{
  view:'H',projectedFrom:h0,projectedTo:h1,
  nativeHLRToSourceTopoDSIdentityRecovered:false,
  remainingPhysicalSourcePossibilities:[{sourceEdgeId:'G::H0|H1'}]
 }];
 const dual={
  sourceGeometryId:'G',revision,allGeneratedTopoDSOriginalSourceHistoryProven:false,
  signedV5ActionCount:0,rows:[{
   view:'H',sourceGeometryId:'G',revision,nativeHiddenSharpEdgeOrdinal:0,
   signedV5Action:false,locallyExplainedNativeHiddenOpenPaperInterval:false,
   remainingOriginal3DPhysicalSourceUnique:true,
   originalHiddenSourceEdgeId:'G::H0|H1',
   independentOpenIntervalRayAndFrontVisibleUnion:{
    outstandingUnprovedOriginalParameterIntervals:[gap]
   }
  }]
 };
 const m5={
  sourceGeometryId:'G',revision,signedV5ActionCount:0,
  rows:[{
   originalPhysicalSourceEdgeId:'G::F0|F1',view:'H',
   originalPhysicalCreaseProven:true,
   completeSourceOriginal3DRayClosedIntervalClear:true,
   signedV5Action:false
  }]
 };
 return {geometry,revision,cad,refinements,dual,m5,
  exactIntervalCoverage:()=>{throw new Error('not needed')}};
}
test('a true original 3D front entire source ray strictly masks final original open source gap, even when generated OCCT front tail is not present',()=>{
 const result=audit(fixture()),c=result.counts;
 assert.equal(c.existingDualUnprovenNativeHiddenStrokes,1);
 assert.equal(c.originalOpenParameterGapIntervalsReviewed,1);
 assert.equal(c.exactM0FullFrontPhysicalSourceGapIntervalsCorroborated,1);
 assert.equal(c.newlyFullOriginalModelOpenIntervalLocallyCorroborated,1);
 assert.equal(c.remainingOriginalModelOpenIntervalUnresolvedNativeEdges,0);
 const row=result.rows[0],w=row.originalM4OrNativePaperPositiveGapWitnesses[0];
 assert.equal(row.wholeOriginalModelOpenIntervalLocallyAccountedByRayMaskOrM0Source,true);
 assert.equal(w.gapOpenIntervalLocallyCoveredByIndependentM0FrontGeometry,true);
 assert.deepEqual(w.originalHiddenSourceParameterRange,gap);
 assert.equal(w.nativeTrueVisibleAndHiddenHLROpenPaperLineCoverageProven,false);
 assert.equal(w.generatedHLRSourceTopoDSHistoryAndAllJunctionsCertified,false);
 assert.equal(w.officialEngineeringLineStyle,'undetermined');
 assert.equal(w.signedV5Action,false);
 const proof=w.exactFullOriginal3DPhysicalFrontSourceWitnesses[0];
 assert.equal(proof.exactDyadicStrictOriginal3DWholeOpenFrontDepth,true);
 assert.equal(proof.missingOCCTGeneratedHLREdgePaperTailStillRequiresSeparateProof,true);
 assert.equal(proof.actualGeneratedTopoDSEdgeIdentityCertified,false);
 assert.equal(result.signedV5ActionCount,0);
});
test('an absent genuine OCCT VCompound front stroke can never be inferred from M0 geometry alone',()=>{
 const x=fixture();x.cad.views.H=[];
 const p=audit(x);
 assert.equal(p.counts.exactM0FullFrontPhysicalSourceGapIntervalsCorroborated,0);
 assert.equal(p.counts.remainingOriginalModelOpenIntervalUnresolvedNativeEdges,1);
});
test('missing independent M5 exact CLOSED front ray proof cannot mask tiny source gap',()=>{
 const x=fixture();
 x.m5.rows[0].completeSourceOriginal3DRayClosedIntervalClear=false;
 assert.equal(audit(x).counts.unprovenOriginalOpenParameterGapIntervalsHeld,1);
});
test('genuine source curve must be verified by original 3D OCCT BRep, never just a projected paper alias',()=>{
 const x=fixture();
 x.cad.originalBRepSourceEdges[1].originalOCCTBRepVertexXYZMatched=false;
 assert.equal(audit(x).counts.exactM0FullFrontPhysicalSourceGapIntervalsCorroborated,0);
});
test('strict exact original endpoint coincidence fails when true front model vertex is different by one ULP',()=>{
 const x=fixture();
 x.geometry.data.points.F1.x+=Number.EPSILON*10;
 assert.equal(audit(x).counts.exactM0FullFrontPhysicalSourceGapIntervalsCorroborated,0);
});
test('a malicious or stale original source parameter gap outside actual native hidden source interval fails closed',()=>{
 const x=fixture();
 x.cad.hiddenSharpViews.H[0].sourceCandidate3DLifts[0].
  originalSourceParameterRange=[0,.99];
 assert.throws(()=>audit(x),/residual source parameter/);
});
test('complete TRUE OCCT VCompound native endpoints and HCompound native source reproject exactly: entire hidden open paper line now has independent positive proof',()=>{
 const x=fixture(),v=x.cad.views.H[0];
 v.to=project(points.F1).H;
 v.sourceCandidate3DLifts[0].originalSourceParameterRange=[0,1];
 const proof=audit(x);
 assert.equal(proof.counts.verifiedCompleteRealNativeVCompoundPaperCoveringSourceGaps,1);
 assert.equal(proof.counts.completeNativeHiddenOpenPaperLinesExplainedByDualOrExactM0WithRealVisibleBRep,1);
 assert.equal(proof.counts.nativeHiddenOpenPaperLinesWithUnverifiedGeneratedHLRTail,0);
 const row=proof.rows[0],gap=row.originalM4OrNativePaperPositiveGapWitnesses[0];
 assert.equal(row.realNativeHLRHiddenPaperLineLocallyExplainedByTrueHLRAndM0FullFront,true);
 assert.equal(gap.nativeTrueVisibleAndHiddenHLROpenPaperLineCoverageProven,true);
 assert.equal(gap.generatedHLRSourceTopoDSHistoryAndAllJunctionsCertified,false);
 assert.equal(row.nativeHLRGeneratedSourceTopoDSLinksAndAllJunctionsProven,false);
 assert.equal(proof.signedV5ActionCount,0);
});
test('forged HCompound paper endpoint breaks real generated front-mask proof even if original M0 full-ray truth remains',()=>{
 const x=fixture(),v=x.cad.views.H[0];
 v.to=project(points.F1).H;
 v.sourceCandidate3DLifts[0].originalSourceParameterRange=[0,1];
 // Hidden original source lifted XYZ projects to u=10, but untrusted native
 // projected BRep reports an altered u. Matching pruning ledger is updated,
 // so this reaches the independent HCompound 3D-to-paper check.
 x.cad.hiddenSharpViews.H[0].to={u:10-Number.EPSILON*10,v:0};
 x.refinements[0].projectedTo={u:10-Number.EPSILON*10,v:0};
 const result=audit(x);
 assert.equal(result.counts.exactM0FullFrontPhysicalSourceGapIntervalsCorroborated,1);
 assert.equal(result.counts.verifiedCompleteRealNativeVCompoundPaperCoveringSourceGaps,0);
 assert.equal(result.rows[0].realNativeHLRHiddenPaperLineLocallyExplainedByTrueHLRAndM0FullFront,false);
});

test('no proof writes an official GB style or authorizes V5, even after local open-ray source resolution',()=>{
 const x=fixture();
 const row=audit(x).rows[0];
 assert.equal(row.nativeHLRGeneratedSourceTopoDSLinksAndAllJunctionsProven,false);
 assert.equal(row.allOriginalPhysical3DJunctionsAndGBLineStyleCertified,false);
 assert.equal(row.constructionIntentAuthorized,false);
 assert.equal(row.signedV5Action,false);
});
