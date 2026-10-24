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

 // Snapshot every caller-provided datum exactly once. Array#some/#map
 // silently skip sparse indexes, and getter-backed input may change after
 // validation. Neither is valid evidence for a mathematical Jacobian.
 const vars=Array.from({length:variables.length},(_,i)=>{
  if(!Object.hasOwn(variables,i)||!record(variables[i]))
   throw new TypeError('every variable index must contain a complete record');
  const v=variables[i],id=v.id,unit=v.unit,scale=v.scale;
  if(!validId(id)||!MODEL_VARIABLE_UNITS.includes(unit)||
     !finite(scale)||scale<=0)
   throw new TypeError('each variable needs id, explicit model unit and positive finite scale');
  return {id,unit,scale};
 });
 if(new Set(vars.map(v=>v.id)).size!==vars.length)
  throw new TypeError('duplicate variable id');

 const cs=Array.from({length:constraints.length},(_,i)=>{
  if(!Object.hasOwn(constraints,i)||!record(constraints[i]))
   throw new TypeError('every constraint index must contain a complete record');
  const c=constraints[i];
  const id=c.id,unit=c.unit,scale=c.scale,residual=c.residual,
   absoluteTolerance=c.absoluteTolerance,relativeTolerance=c.relativeTolerance??0,
   derivatives=c.derivatives;
  if(!validId(id)||!RESIDUAL_UNITS.includes(unit)||
     !finite(scale)||scale<=0||!finite(residual)||
     !finite(absoluteTolerance)||absoluteTolerance<0||
     !finite(relativeTolerance)||relativeTolerance<0||
     (absoluteTolerance===0&&relativeTolerance===0)||
     !Array.isArray(derivatives)||derivatives.length!==vars.length)
   throw new TypeError('each constraint needs id, residual unit, scale, tolerance and full derivative row');
  const derivativeRow=Array.from({length:vars.length},(_,j)=>{
   if(!Object.hasOwn(derivatives,j)||!record(derivatives[j]))
    throw new TypeError('missing derivative coefficient at '+id+'/'+vars[j].id);
   const d=derivatives[j],value=d.value,derivativeUnit=d.unit;
   const expectedUnit=unit+'/'+vars[j].unit;
   if(derivativeUnit!==expectedUnit||!finite(value))
    throw new TypeError('derivative unit mismatch or nonfinite at '+id+'/'+vars[j].id+
     ': expected '+expectedUnit);
   return {value,unit:derivativeUnit};
  });
  return {id,unit,scale,residual,absoluteTolerance,relativeTolerance,
   derivatives:derivativeRow};
 });
 if(new Set(cs.map(c=>c.id)).size!==cs.length)
  throw new TypeError('duplicate constraint id');

 const normalizedJacobian=[],normalizedResiduals=[],residualChecks=[];
 for(const c of cs){
  const derivativeRow=c.derivatives.map((d,j)=>
   scaled(d.value,vars[j].scale,c.scale));
  const allowedDifference=c.absoluteTolerance+c.relativeTolerance*c.scale;
  if(!finite(allowedDifference)||allowedDifference<=0)
   throw new RangeError('nonfinite or zero allowed difference for '+c.id);
  const normalizedResidual=scaled(c.residual,1,c.scale);
  const normalizedTolerance=scaled(allowedDifference,1,c.scale);
  const ratio=scaled(Math.abs(c.residual),1,allowedDifference);
  const check={id:c.id,unit:c.unit,scale:c.scale,
   absoluteTolerance:c.absoluteTolerance,
   relativeTolerance:c.relativeTolerance,allowedDifference,
   absoluteResidual:Math.abs(c.residual),normalizedResidual,
   normalizedTolerance,residualToTolerance:ratio,
   status:Math.abs(c.residual)<=allowedDifference?
    'within-tolerance':'outside-tolerance'};
  normalizedJacobian.push(derivativeRow);
  normalizedResiduals.push(normalizedResidual);
  residualChecks.push(check);
 }
 const atProvidedConfiguration=residualChecks.every(c=>c.status==='within-tolerance');
 return {schema:'draftai-dimensionless-local-system/0.1',
  kind:'local-numerical-evidence',variableIds:vars.map(v=>v.id),
  constraintIds:cs.map(c=>c.id),
  variableScales:vars.map(v=>({id:v.id,unit:v.unit,scale:v.scale})),
  constraintScales:cs.map(c=>({id:c.id,unit:c.unit,scale:c.scale})),
  normalizedJacobian,normalizedResiduals,residualChecks,atProvidedConfiguration,
  status:atProvidedConfiguration?'within-declared-tolerances':'residual-outside-tolerance',
  rankEstimate:null,localDegreesEstimate:null,solutionCount:null,globallyUnique:null,
  proofOfExistence:false,proofOfGlobalUniqueness:false,
  normalizationCertified:false,
  warning:'Unit tags and scales were provided by the caller; formulas, scaling suitability, rank and solution existence are not independently certified.'};
}

module.exports={normalizeLocalSystem,MODEL_VARIABLE_UNITS,RESIDUAL_UNITS};
