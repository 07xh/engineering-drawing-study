'use strict';

/**
 * M0 numeric evidence utilities, consumed by real M2 local linear constraints.
 *
 * A tolerance is relative to the explicitly supplied *geometric feature*
 * scale, NEVER inferred from the absolute location of a drawing in space.
 * This is not an exact-arithmetic implementation or a global proof system.
 */

const UNITS=Object.freeze(['mm','rad','deg','unitless']);
const finite=value=>typeof value==='number'&&Number.isFinite(value);
const validUnits=unit=>UNITS.includes(unit);

function policy(input){
  if(!input||typeof input!=='object'||Array.isArray(input))
    throw new TypeError('numeric policy must be an object');
  const {absoluteTolerance,relativeTolerance=0,characteristicScale,unit}=input;
  if(!finite(absoluteTolerance)||absoluteTolerance<0||
     !finite(relativeTolerance)||relativeTolerance<0||
     (absoluteTolerance===0&&relativeTolerance===0))
    throw new RangeError('tolerances must be nonnegative finite and at least one positive');
  if(!finite(characteristicScale)||characteristicScale<=0)
    throw new RangeError('characteristicScale must describe a positive finite local geometric feature');
  if(!validUnits(unit))
    throw new TypeError('numeric policy unit must be mm, rad, deg or unitless');

  // Evaluate multiply and sum in a stable order; overflow is an explicit
  // rejection rather than silently accepting every candidate.
  const allowedDifference=absoluteTolerance+relativeTolerance*characteristicScale;
  if(!finite(allowedDifference)||allowedDifference<=0)
    throw new RangeError('computed tolerance is zero or nonfinite');
  return {absoluteTolerance,relativeTolerance,characteristicScale,
    unit,allowedDifference};
}

function checkResidual({residual,...spec}={}){
  const p=policy(spec);
  if(!finite(residual))
    throw new TypeError('residual must be finite');
  const magnitude=Math.abs(residual);
  const normalized=magnitude/p.allowedDifference;
  if(!finite(normalized))
    throw new RangeError('residual ratio overflow');
  return {...p,absoluteResidual:magnitude,normalizedResidual:normalized,
    status:magnitude<=p.allowedDifference?'within-tolerance':'outside-tolerance',
    proofOfExistence:false,proofOfUniqueness:false,
    kind:'local-numeric-residual-check'};
}

function compareCoordinates({a,b,...spec}={}){
  const p=policy(spec);
  if(!finite(a)||!finite(b))
    throw new TypeError('coordinate pair must be finite');
  const difference=Math.abs(a-b);
  if(!finite(difference))
    throw new RangeError('coordinate subtraction overflow');

  // This is a deliberately conservative floating-point *resolution
  // heuristic*, not a rigorous interval arithmetic error bound.
  // A large absolute origin may make tiny mm offsets unrepresentable.
  const resolution=2*Number.EPSILON*Math.max(1,Math.abs(a),Math.abs(b));
  if(!finite(resolution))
    throw new RangeError('coordinate resolution estimate overflow');
  const threshold=p.allowedDifference;
  let status;
  if(difference>threshold+resolution)status='different';
  else if(difference<=threshold&&resolution<=threshold)status='within-tolerance';
  else status='resolution-limited';

  return {...p,absoluteDifference:difference,
    approximateFloatingResolution:resolution,status,
    resolutionIsHeuristic:true,
    proofOfExistence:false,proofOfUniqueness:false,
    kind:'coordinate-consistency-diagnostic'};
}

module.exports={UNITS,policy,checkResidual,compareCoordinates};
