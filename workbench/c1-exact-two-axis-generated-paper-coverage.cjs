'use strict';
/**
 * STRICT exact two-dimensional paper coverage over ORIGINAL M0 projection.
 * A segment must lie on the WHOLE source's actual original u,v line before
 * its dominant-axis rational parameter range is allowed to cover source t.
 *
 * OCCT's generated HLR 2D paper coordinates are received binary64 values.
 * A transverse displacement as small as 1 ULP cannot be erased by an axis
 * inverse, epsilon or 3D source-curve identity.
 *
 * This is measured-paper forensic coverage, not generated-TopoDS lineage,
 * visibility of every opaque scene element, engineering line style or V5.
 */
const {dyadic,difference,product,sign}=
 require('../core/numeric/binary64-dyadic.cjs');
const {auditExactBinary64PaperCandidateCoverage}=
 require('./c1-exact-binary64-paper-parameter.cjs');
const freeze=x=>{
 if(x&&typeof x==='object'&&!Object.isFrozen(x)){
  for(const value of Object.values(x))freeze(value);
  Object.freeze(x);
 }
 return x;
};
const valid=p=>p&&Number.isFinite(p.u)&&Number.isFinite(p.v);

function auditC1ExactTwoAxisGeneratedPaperCoverage({
 sourceFrom,sourceTo,segments
}={}){
 if(!valid(sourceFrom)||!valid(sourceTo)||
    !Array.isArray(segments)||segments.length>256||
    segments.some(s=>!valid(s?.from)||!valid(s?.to)))
  throw new TypeError('bounded exact source and real native paper coordinates required');
 const du=difference(dyadic(sourceTo.u),dyadic(sourceFrom.u)),
  dv=difference(dyadic(sourceTo.v),dyadic(sourceFrom.v));
 if(sign(du)===0&&sign(dv)===0)
  throw new RangeError('original projected physical source collapses to one point');
 const onLine=p=>sign(difference(
  product(du,difference(dyadic(p.v),dyadic(sourceFrom.v))),
  product(dv,difference(dyadic(p.u),dyadic(sourceFrom.u)))))===0;
 const retained=[],rejected=[];
 for(const [index,s] of segments.entries()){
  const fromOnLine=onLine(s.from),toOnLine=onLine(s.to);
  if(fromOnLine&&toOnLine)retained.push(s);
  else rejected.push({
   generatedPaperOrdinal:index,
   fromExactlyOnOriginalSourceLine:fromOnLine,
   toExactlyOnOriginalSourceLine:toOnLine,
   transverseNativePaperDisplacementMustNotCoverSource:true,
   signedV5Action:false
  });
 }
 // These two independent unions are both exact rational source t:
 // (1) unsafe on-axis-only diagnostic; and (2) legitimate 2D collinear
 //     received segments. Neither gives original 2D TopoDS history.
 const raw=auditExactBinary64PaperCandidateCoverage({
  sourceFrom,sourceTo,segments
 });
 const eligible=auditExactBinary64PaperCandidateCoverage({
  sourceFrom,sourceTo,segments:retained
 });
 const allReceivedSegmentsCollinear=rejected.length===0;
 return freeze({
  schema:'draftai-c1-generated-hlr-exact-two-axis-paper-source-coverage/1',
  originalSourceFrom:{...sourceFrom},originalSourceTo:{...sourceTo},
  generatedPaperSegmentCount:segments.length,
  exactlyCollinearGeneratedSegments:retained.length,
  transverseDisplacedGeneratedSegments:rejected.length,
  transverseDisplacedSegmentsHeld:rejected,
  unsafeDominantAxisOnlyCoverage:raw,
  exactTwoAxisQualifiedPaperCoverage:eligible,
  receivedGeneratedSegmentsAllExactlyOnOriginalSourceLine:
   allReceivedSegmentsCollinear,
  strictReceivedTwoAxisPaperCoverageComplete:
   allReceivedSegmentsCollinear&&eligible.exactBinary64PaperCandidateCoverageComplete,
  falseDominantAxisFullCoverageVetoed:
   raw.exactBinary64PaperCandidateCoverageComplete&&
   !allReceivedSegmentsCollinear,
  positiveLengthTwoAxisPaperResidualsStillPresent:
   eligible.exactBinary64PaperPositiveLengthUncoveredIntervals.length>0,
  originalHLR3DCurveParameterUnionIsSeparate:true,
  generated2DTopoDSHistoryCertified:false,
  globalOpaqueSceneContinuousOcclusionCertified:false,
  officialEngineeringLineStyle:'undetermined',
  signedV5Action:false
 });
}
module.exports={auditC1ExactTwoAxisGeneratedPaperCoverage};
