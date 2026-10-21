'use strict';
/**
 * 02-D: geometric candidates for EXTERNAL fillets tangent to a FINITE line
 * segment and a full circle. An infinite-line solution is NOT necessarily a
 * valid segment solution: the line contact must be inside the actual segment.
 *
 * The line side remains oriented relative to segment a -> b. This API does
 * not decide a finite circle-arc interval or directed G1 traversal.
 * Geometry input and output use the same caller-selected math unit, not pixels.
 */
const {
  normalizedLine, externalLineCircleFillets
}=require('./offset-tangency.cjs');

function finiteSegmentCircleFillets({
  segment, circle, filletRadius, side=1, epsilon=1e-9
}={}){
  // Validation of geometry, side and epsilon is delegated to the already
  // tested infinite-line solver. Keep one mathematical implementation.
  const line=normalizedLine(segment);
  const infinite=externalLineCircleFillets({
    line:segment,circle,filletRadius,side,epsilon
  });

  const candidates=[];
  const rejected=[];
  for(const candidate of infinite.candidates){
    const contact=candidate.lineContact;
    const relativeX=contact.x-line.a.x;
    const relativeY=contact.y-line.a.y;
    const distance=relativeX*line.tangent.x+relativeY*line.tangent.y;
    if(!Number.isFinite(distance))
      throw new RangeError('segment parameter overflow');
    // Conservative range check: no tangency on an extension of the line
    // becomes a valid on-segment result by increasing an arbitrary tolerance.
    if(distance<0||distance>line.length){
      rejected.push({id:candidate.id,reason:'tangent-point-outside-segment'});
      continue;
    }
    const t=distance/line.length;
    if(!Number.isFinite(t))
      throw new RangeError('normalized segment parameter overflow');
    candidates.push({
      ...candidate,
      lineContactOnSegment:true,
      segmentParameter:t,
      segmentDistanceFromStart:distance,
      atEndpoint:distance===0||distance===line.length
    });
  }

  return {
    scope:'finite-segment-and-full-circle-external-tangency',
    unit:'input-math-unit',
    status:candidates.length===0?'none':candidates.length===1?'unique':'multiple',
    candidateCount:candidates.length,
    continuousDegreesOfFreedom:candidates.length>0?0:null,
    uniquenessScope:'fixed finite segment, chosen side, fixed full circle, external tangency',
    candidates,
    rejectedCandidates:rejected,
    reason:candidates.length===0
      ?infinite.candidateCount===0?'no-infinite-line-solution':'tangent-contacts-fall-outside-segment'
      :'only candidates with line tangency on the finite segment are retained',
    // Segment endpoints limit the permitted contact points; arc sweep,
    // source contour orientation and directed G1 are NOT yet proven.
    directedG1Verified:false,
    finiteCircleArcVerified:false,
    auxiliary:infinite.auxiliary??null
  };
}
module.exports={finiteSegmentCircleFillets};
