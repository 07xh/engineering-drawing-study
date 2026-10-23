'use strict';
/**
 * 02-D: geometric candidates for EXTERNAL fillets tangent to a FINITE line
 * segment and a full circle OR a finite given circle arc. Infinite-line
 * candidates are valid only when BOTH source contacts lie on supplied bounds.
 *
 * The line side remains oriented relative to segment a -> b. This API
 * filters finite given-circle-arc contacts, but does NOT prove the final
 * connecting fillet arc traversal or directional G1 continuity.
 * Geometry input and output use the same caller-selected math unit, not pixels.
 */
const {
  normalizedLine, externalLineCircleFillets
}=require('./offset-tangency.cjs');
const {normalizeKnownCircle,contactOnFiniteArc}=
  require('./circle-circle-fillet.cjs');

function finiteSegmentCircleFillets({
  segment, circle, filletRadius, side=1, epsilon=1e-9
}={}){
  // Validation of geometry, side and epsilon is delegated to the already
  // tested infinite-line solver. Keep one mathematical implementation.
  const line=normalizedLine(segment);
  // Reuse the two-circle source-arc normalization for an identical
  // angular membership rule; malformed arc metadata fails before solving.
  const known=normalizeKnownCircle(circle,'circle');
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
    const withinSourceArc=contactOnFiniteArc(known,candidate.circleContact,epsilon);
    if(!withinSourceArc){
      rejected.push({id:candidate.id,reason:'tangent-point-outside-given-circle-arc'});
      continue;
    }
    candidates.push({
      ...candidate,
      lineContactOnSegment:true,
      segmentParameter:t,
      segmentDistanceFromStart:distance,
      atEndpoint:distance===0||distance===line.length,
      sourceArcChecks:{circle:withinSourceArc},
      sourceArcRangeVerified:true
    });
  }

  const finiteCircleArcCount=known.arc?1:0;
  return {
    scope:known.arc?'finite-segment-and-given-finite-circle-arc-external-tangency':
      'finite-segment-and-full-circle-external-tangency',
    unit:'input-math-unit',
    status:candidates.length===0?'none':candidates.length===1?'unique':'multiple',
    candidateCount:candidates.length,
    continuousDegreesOfFreedom:candidates.length>0?0:null,
    uniquenessScope:known.arc?
      'fixed finite segment, chosen side, given finite circle arc, external tangency':
      'fixed finite segment, chosen side, fixed full circle, external tangency',
    candidates,
    rejectedCandidates:rejected,
    reason:candidates.length===0
      ?infinite.candidateCount===0?'no-infinite-line-solution':
       rejected.some(c=>c.reason==='tangent-point-outside-given-circle-arc')?
        'tangent-contacts-outside-given-circle-arc':
        'tangent-contacts-fall-outside-segment':
       known.arc?'only finite segment and given finite circle-arc contacts are retained':
        'only candidates with line tangency on the finite segment are retained',
    // Source-arc membership is NOT a proof of oriented G1 or the final fillet.
    directedG1Verified:false,
    finiteCircleArcCount,
    finiteCircleArcVerified:!!known.arc&&candidates.length>0,
    auxiliary:infinite.auxiliary??null
  };
}
module.exports={finiteSegmentCircleFillets};
