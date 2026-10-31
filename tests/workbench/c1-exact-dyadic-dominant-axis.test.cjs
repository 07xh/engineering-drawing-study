'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {auditExactBinary64PaperParameterPair:pair,
 auditExactBinary64PaperCandidateCoverage:coverage,
 auditExactBinary64PaperVisibilityConflict:conflict}=
 require('../../workbench/c1-exact-binary64-paper-parameter.cjs');
const {auditC1ExactTwoAxisGeneratedPaperCoverage:twoAxis}=
 require('../../workbench/c1-exact-two-axis-generated-paper-coverage.cjs');
const M=Number.MAX_VALUE,point=(u,v)=>({u,v});
// Both binary64 source-span subtractions overflow. Actual |dv|=2*M
// exceeds |du|=1.5*M, so exact rational source parameter MUST use v.
const from=point(-M/2,-M),to=point(M,M);
test('original C1 dominant paper axis is exact when BOTH binary64 subtractions overflow',()=>{
 assert.equal(Math.abs(to.u-from.u),Infinity);
 assert.equal(Math.abs(to.v-from.v),Infinity);
 const mid=point(M/4,0),end=point(M,M);
 const r=pair({sourceFrom:from,sourceTo:to,
  measuredFrom:mid,measuredTo:end});
 assert.equal(r.dominantOriginalProjectionAxis,'v');
 assert.equal(r.nativePaperSourceParameterPairHasExactPositiveSpan,true);
 assert.equal(r.nativeFromWithinExactBinary64OriginalParameterDomain,true);
 assert.equal(r.nativeToWithinExactBinary64OriginalParameterDomain,true);
 assert.equal(r.generatedToOriginalTopoDSHistoryCertified,false);
});
test('huge source (u,v) keeps exact half-source GAP instead of false full from wrong u-axis',()=>{
 // Transverse u-from is deliberately at the original start; using u
 // falsely returns [0,1], while the TRUE longer original v gives [1/2,1].
 const segment={from:point(from.u,0),to:point(to.u,to.v)};
 const c=coverage({sourceFrom:from,sourceTo:to,segments:[segment]});
 assert.equal(c.dominantOriginalProjectionAxis,'v');
 assert.equal(c.exactBinary64PaperCandidateCoverageComplete,false);
 assert.deepEqual(c.exactBinary64PaperPositiveLengthUncoveredIntervals,[['0','1/2']]);
 assert.deepEqual(c.exactBinary64PaperPositiveLengthCoveredIntervals,[['1/2','1']]);
 const strict=twoAxis({sourceFrom:from,sourceTo:to,segments:[segment]});
 assert.equal(strict.transverseDisplacedGeneratedSegments,1);
 assert.equal(strict.strictReceivedTwoAxisPaperCoverageComplete,false);
 assert.equal(strict.generated2DTopoDSHistoryCertified,false);
 assert.equal(strict.signedV5Action,false);
});
test('real exact midpoint on huge original diagonal is retained without invented source gap',()=>{
 const onSource={from:point(M/4,0),to:point(to.u,to.v)};
 const r=coverage({sourceFrom:from,sourceTo:to,segments:[onSource]});
 assert.equal(r.dominantOriginalProjectionAxis,'v');
 assert.deepEqual(r.exactBinary64PaperPositiveLengthUncoveredIntervals,[['0','1/2']]);
 const strict=twoAxis({sourceFrom:from,sourceTo:to,segments:[onSource]});
 assert.equal(strict.transverseDisplacedGeneratedSegments,0);
 assert.deepEqual(strict.exactTwoAxisQualifiedPaperCoverage.
  exactBinary64PaperPositiveLengthUncoveredIntervals,[['0','1/2']]);
});
test('huge visible/hidden native source intervals keep exact positive collision, never sign a GB line',()=>{
 const v=conflict({sourceFrom:from,sourceTo:to,
  visibleSegments:[{from:point(from.u,from.v),to:point(M/4,0)}],
  hiddenSegments:[{from:point(0,-M/2),to:point(M/2,M/2)}]});
 assert.equal(v.dominantOriginalProjectionAxis,'v');
 assert.deepEqual(v.exactBinary64PaperPositiveLengthVisibleHiddenConflictIntervals,
  [['1/4','1/2']]);
 assert.equal(v.hasExactPositiveLengthVisibleHiddenPaperClassConflict,true);
 assert.equal(v.officialEngineeringLineStyle,'undetermined');
 assert.equal(v.signedV5Action,false);
});
test('both axes huge and EXACTLY equal tie always chooses u, reversed endpoints preserve source intervals',()=>{
 const a=point(-M,-M),b=point(M,M);
 const c=coverage({sourceFrom:a,sourceTo:b,segments:[{from:a,to:b}]});
 assert.equal(c.dominantOriginalProjectionAxis,'u');
 assert.equal(c.exactBinary64PaperCandidateCoverageComplete,true);
 const reversed=coverage({sourceFrom:b,sourceTo:a,segments:[{from:b,to:a}]});
 assert.equal(reversed.dominantOriginalProjectionAxis,'u');
 assert.equal(reversed.exactBinary64PaperCandidateCoverageComplete,true);
 assert.deepEqual(reversed.exactBinary64PaperPositiveLengthUncoveredIntervals,[]);
});
test('nonfinite source, collapsed genuine paper source and forged outside-domain extreme values fail closed',()=>{
 assert.throws(()=>coverage({sourceFrom:point(NaN,0),sourceTo:to,segments:[]}),TypeError);
 assert.throws(()=>pair({sourceFrom:from,sourceTo:point(Infinity,1),
  measuredFrom:from,measuredTo:to}),TypeError);
 assert.throws(()=>coverage({sourceFrom:from,sourceTo:from,segments:[]}),RangeError);
 assert.throws(()=>coverage({sourceFrom:point(-M/2,-M/2),
  sourceTo:point(M/2,M/2),
  segments:[{from:point(-M,-M),to:point(M/2,M/2)}]}),
  /source|domain/i);
});
