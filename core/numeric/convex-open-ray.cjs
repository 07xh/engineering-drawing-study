'use strict';
/**
 * M0: sign-only observer-ray classifier shared by convex finite solids.
 *
 * Preconditions must be proved by the M3 specialist, not by this function:
 *   - an open interval on a genuine section-boundary face,
 *   - a convex retained solid and outward boundary support normal,
 *   - a ray d from boundary toward observer,
 *   - an explicitly chosen retained halfspace s of the cut plane n.
 *
 * halfspaceSlope = s * dot(n, d)
 * outwardSlope   = dot(faceOutwardNormal, d)
 *
 * Negative halfspace slope aims directly into REMOVED space. Otherwise an
 * observer ray into retained material is hidden, while an outward ray exits.
 * Plane tangency and boundary silhouettes are NOT certified; endpoint
 * visibility, full solid occlusion, first-angle mapping and V5 style remain
 * entirely outside this numerical sign test.
 *
 * Both slopes must be expressed in comparable normalized ray units by the
 * caller; tolerance is an ABSOLUTE threshold in those slope units.
 */
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const OPEN_RAY_SIGNS=Object.freeze({
 REMOVED:'removed',EXITING:'exiting',ENTERING:'entering',
 UNDETERMINED:'undetermined'
});
function classifyConvexOpenRaySign(halfspaceSlope,outwardSlope,tolerance=1e-10){
 if(!finite(halfspaceSlope)||!finite(outwardSlope)||
    !finite(tolerance)||tolerance<=0||tolerance>1e-3)
  throw new TypeError('finite ray slopes and bounded positive tolerance required');
 if(halfspaceSlope< -tolerance)return OPEN_RAY_SIGNS.REMOVED;
 if(halfspaceSlope>tolerance){
  if(outwardSlope>tolerance)return OPEN_RAY_SIGNS.EXITING;
  if(outwardSlope< -tolerance)return OPEN_RAY_SIGNS.ENTERING;
 }
 return OPEN_RAY_SIGNS.UNDETERMINED;
}
module.exports={OPEN_RAY_SIGNS,classifyConvexOpenRaySign};
