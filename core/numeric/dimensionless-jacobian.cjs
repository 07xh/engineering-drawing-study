'use strict';

/**
 * M0-D opt-in preparation of dimensionless residuals and Jacobian rows.
 * No existing solver imports this file. All raw derivatives are caller-provided:
 * explicit unit tags are checked for consistency but cannot certify calculus.
 */
const MODEL_VARIABLE_UNITS=Object.freeze(['mm','rad','deg','unitless']);
const RESIDUAL_UNITS=Object.freeze(['mm','mm2','rad','deg','unitless']);
const finite=v=>typeof v==='number'&&Number.isFinite(v);
const record=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const validId=v=>typeof v==='string'&&/^[A-Za-z][A-Za-z0-9_-]{0,79}$/.test(v)&&
  !['__proto__','constructor','prototype'].includes(v);

// Do not accept a silent overflow or underflow on a nonzero Jacobian entry.
// Reordering multiplication/division allows a finite result even if one order
// has an intermediate overflow, while retaining the input's signed direction.
function scaled(value,numerator,denominator){
  if(value===0)return 0;
  const options=[(value/denominator)*numerator,
    (value*numerator)/denominator,value*(numerator/denominator)];
  const result=options.find(v=>finite(v)&&v!==0);
  if(result===undefined)
    throw new RangeError('normalization lost a nonzero value or overflowed');
  return result;
}
function normalizeLocalSystem({variables,constraints}={}){
  if(!Array.isArray(variables)||variables.length<1||variables.length>64||
     !Array.isArray(constraints)||constraints.length<1||constraints.length>64)
    throw new RangeError('expected 1..64 variables and constraints');
  if(variables.some(v=>!record(v)||!validId(v.id)||
     !MODEL_VARIABLE_UNITS.includes(v.unit)||!finite(v.scale)||v.scale<=0))
    throw new TypeError('each variable needs id, explicit model unit and positive finite scale');
  if(new Set(variables.map(v=>v.id)).size!==variables.length)
    throw new TypeError('duplicate variable id');
  if(constraints.some(c=>!record(c)||!validId(c.id)||
     !RESIDUAL_UNITS.includes(c.unit)||!finite(c.scale)||c.scale<=0||
     !finite(c.residual)||!finite(c.absoluteTolerance)||c.absoluteTolerance<0||
     (c.relativeTolerance!==undefined&&(!finite(c.relativeTolerance)||c.relativeTolerance<0))||
     (c.absoluteTolerance===0&&(c.relativeTolerance??0)===0)||
     !Array.isArray(c.derivatives)||c.derivatives.length!==variables.length))
    throw new TypeError('each constraint needs id, residual unit, scale, tolerance and full derivative row');
  if(new Set(constraints.map(c=>c.id)).size!==constraints.length)
    throw new TypeError('duplicate constraint id');
  const normalizedJacobian=[];
  const normalizedResiduals=[];
  const residualChecks=[];
  for(const c of constraints){
    const derivativeRow=c.derivatives.map((d,j)=>{
      const expectedUnit=c.unit+'/'+variables[j].unit;
      if(!record(d)||d.unit!==expectedUnit||!finite(d.value))
        throw new TypeError('derivative unit mismatch or nonfinite at '+c.id+'/'+variables[j].id+
          ': expected '+expectedUnit);
      return scaled(d.value,variables[j].scale,c.scale);
    });
    const relativeTolerance=c.relativeTolerance??0;
    const allowedDifference=c.absoluteTolerance+relativeTolerance*c.scale;
    if(!finite(allowedDifference)||allowedDifference<=0)
      throw new RangeError('nonfinite or zero allowed difference for '+c.id);
    const normalizedResidual=scaled(c.residual,1,c.scale);
    const normalizedTolerance=scaled(allowedDifference,1,c.scale);
    const ratio=scaled(Math.abs(c.residual),1,allowedDifference);
    const check={id:c.id,unit:c.unit,scale:c.scale,absoluteTolerance:c.absoluteTolerance,
      relativeTolerance,allowedDifference,absoluteResidual:Math.abs(c.residual),
      normalizedResidual,normalizedTolerance,residualToTolerance:ratio,
      status:Math.abs(c.residual)<=allowedDifference?'within-tolerance':'outside-tolerance'};
    normalizedJacobian.push(derivativeRow);
    normalizedResiduals.push(normalizedResidual);
    residualChecks.push(check);
  }
  const atProvidedConfiguration=residualChecks.every(c=>c.status==='within-tolerance');
  return {schema:'draftai-dimensionless-local-system/0.1',
    kind:'local-numerical-evidence',variableIds:variables.map(v=>v.id),
    constraintIds:constraints.map(c=>c.id),
    variableScales:variables.map(v=>({id:v.id,unit:v.unit,scale:v.scale})),
    constraintScales:constraints.map(c=>({id:c.id,unit:c.unit,scale:c.scale})),
    normalizedJacobian,normalizedResiduals,residualChecks,atProvidedConfiguration,
    status:atProvidedConfiguration?'within-declared-tolerances':'residual-outside-tolerance',
    rankEstimate:null,localDegreesEstimate:null,solutionCount:null,globallyUnique:null,
    proofOfExistence:false,proofOfGlobalUniqueness:false,
    normalizationCertified:false,
    warning:'Unit tags and scales were provided by the caller; formulas, scaling suitability, rank and solution existence are not independently certified.'};
}
module.exports={normalizeLocalSystem,MODEL_VARIABLE_UNITS,RESIDUAL_UNITS};
