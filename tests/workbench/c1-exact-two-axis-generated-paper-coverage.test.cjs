'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {auditC1ExactTwoAxisGeneratedPaperCoverage:audit}=
 require('../../workbench/c1-exact-two-axis-generated-paper-coverage.cjs');
test('real SkewTetra A|C: collinear generated W HLR still has a strictly positive rational final tail',()=>{
 const out=audit({sourceFrom:{u:0,v:0},sourceTo:{u:16,v:2},
  segments:[{from:{u:0,v:0},to:{
   u:15.999999999999998,v:1.9999999999999998}}]});
 assert.equal(out.exactlyCollinearGeneratedSegments,1);
 assert.equal(out.transverseDisplacedGeneratedSegments,0);
 assert.deepEqual(out.exactTwoAxisQualifiedPaperCoverage
  .exactBinary64PaperPositiveLengthUncoveredIntervals,
  [['9007199254740991/9007199254740992','1']]);
 assert.equal(out.strictReceivedTwoAxisPaperCoverageComplete,false);
 assert.equal(out.falseDominantAxisFullCoverageVetoed,false);
 assert.equal(out.officialEngineeringLineStyle,'undetermined');
 assert.equal(out.signedV5Action,false);
});
test('real SkewTetra A|D: dominant-axis falsely says [0,1] full despite transverse W source displacement',()=>{
 const out=audit({sourceFrom:{u:0,v:0},sourceTo:{u:6,v:23},
  segments:[{from:{u:8.881784197001252e-16,v:0},
   to:{u:6,v:23}}]});
 assert.equal(out.unsafeDominantAxisOnlyCoverage
  .exactBinary64PaperCandidateCoverageComplete,true);
 assert.equal(out.transverseDisplacedGeneratedSegments,1);
 assert.equal(out.falseDominantAxisFullCoverageVetoed,true);
 assert.deepEqual(out.exactTwoAxisQualifiedPaperCoverage
  .exactBinary64PaperPositiveLengthUncoveredIntervals,[['0','1']]);
 assert.equal(out.strictReceivedTwoAxisPaperCoverageComplete,false);
 assert.equal(out.generated2DTopoDSHistoryCertified,false);
});
test('strict 2D coverage can diagnose perfectly measured original paper without upgrading M5/V5',()=>{
 const result=audit({sourceFrom:{u:1,v:2},sourceTo:{u:7,v:14},
  segments:[{from:{u:1,v:2},to:{u:4,v:8}},
   {from:{u:4,v:8},to:{u:7,v:14}}]});
 assert.equal(result.strictReceivedTwoAxisPaperCoverageComplete,true);
 assert.equal(result.exactTwoAxisQualifiedPaperCoverage
  .exactBinary64PaperCandidateCoverageComplete,true);
 assert.equal(result.generated2DTopoDSHistoryCertified,false);
 assert.equal(result.globalOpaqueSceneContinuousOcclusionCertified,false);
 assert.equal(result.signedV5Action,false);
});
test('exact transverse veto rejects arbitrary positive drift smaller than any practical pixel tolerance',()=>{
 const offset=Number.MIN_VALUE;
 const result=audit({sourceFrom:{u:0,v:0},sourceTo:{u:6,v:23},
  segments:[{from:{u:offset,v:0},to:{u:6,v:23}}]});
 assert.equal(result.falseDominantAxisFullCoverageVetoed,true);
 assert.equal(result.transverseDisplacedSegmentsHeld[0].fromExactlyOnOriginalSourceLine,false);
 assert.equal(result.strictReceivedTwoAxisPaperCoverageComplete,false);
});
test('malformed, outside-domain or collapsed original source never becomes positive proof',()=>{
 for(const args of [
  {sourceFrom:{u:0,v:0},sourceTo:{u:0,v:0},segments:[]},
  {sourceFrom:{u:0,v:0},sourceTo:{u:1,v:2},segments:[{
   from:{u:0,v:0},to:{u:1.1,v:2.2}}]},
  {sourceFrom:{u:0,v:0},sourceTo:{u:1,v:2},segments:[{
   from:{u:0,v:0},to:{u:Infinity,v:2}}]},
  {sourceFrom:{u:0,v:0},sourceTo:{u:1,v:2},segments:null}
 ]){
  assert.throws(()=>audit(args),/source|paper|bounded|candidate|domain|collapses/i);
 }
});
