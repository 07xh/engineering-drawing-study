'use strict';
/**
 * M1/M2 bounded analytic local evidence for actual typed linear 2D point
 * constraints. Builds real equation rows, reuses M0 dimensionless Jacobian
 * and SVD rank diagnostics, but never infers global uniqueness/existence.
 */
const {buildConstraintIncidence}=require('./constraint-incidence.cjs');
const {normalizeLocalSystem}=require('../numeric/dimensionless-jacobian.cjs');
const {diagnoseJacobian}=require('../numeric/jacobian-rank-evidence.cjs');
const {policy}=require('../numeric/residual-evidence.cjs');
const finite=v=>typeof v==='number'&&Number.isFinite(v);
function analyzeLinearPointConstraints({
 geometry,constraints,sourceRevision,featureScaleMm,absoluteToleranceMm,
 relativeTolerance=0,relativeRankThreshold=1e-10
}={}){
 if(!Number.isSafeInteger(sourceRevision)||sourceRevision<0)
  throw new TypeError('current source revision required');
 if(!Array.isArray(geometry)||geometry.length<1||geometry.length>32||
    !Array.isArray(constraints)||constraints.length<1||constraints.length>64)
  throw new RangeError('expected bounded 1..32 points and 1..64 constraints');
 const tolerance=policy({absoluteTolerance:absoluteToleranceMm,
  relativeTolerance,characteristicScale:featureScaleMm,unit:'mm'});
 // Clone the full request exactly once to avoid validating one set of
 // mutable user data and analyzing a different set of getter values.
 const request=structuredClone({geometry,constraints});
 const g=request.geometry,c=request.constraints;
 const structure=buildConstraintIncidence({geometry:g,constraints:c});
 if(g.some(x=>x.kind!=='point'||x.space!=='drawing-2d'||x.unit!=='mm'))
  throw new TypeError('only explicit drawing-2d model-mm point geometry supported');
 if(c.some(x=>x.scope!=='multi-point-2d-linear'||
     !['fixed','coincident','horizontal','vertical'].includes(x.type)))
  throw new TypeError('only analytic fixed/coincident/horizontal/vertical constraints supported');
 const points=[...g].sort((a,b)=>a.id.localeCompare(b.id));
 const location=new Map(points.map((p,i)=>[p.id,i]));
 const entries=[];
 const variables=points.flatMap((p,i)=>[
  {id:'v'+i+'x',unit:'mm',scale:featureScaleMm},
  {id:'v'+i+'y',unit:'mm',scale:featureScaleMm}
 ]);
 const at=(id,axis)=> {
  const i=location.get(id);
  if(i===undefined)throw new TypeError('unknown geometry point');
  return points[i].data[axis];
 };
 const index=(id,axis)=>2*location.get(id)+(axis==='y'?1:0);
 const checked=n=>{if(!finite(n))throw new RangeError('nonfinite linear constraint residual');return n;};
 function row(sourceId,axis,parts,value){
  if(entries.length>=64)throw new RangeError('too many analytic equation rows');
  const coefficients=Array(variables.length).fill(0);
  for(const [id,coordinate,weight] of parts){
   const j=index(id,coordinate);
   coefficients[j]=checked(coefficients[j]+weight);
  }
  let lhs=0;
  for(const [id,coordinate,weight] of parts)
   lhs=checked(lhs+checked(at(id,coordinate)*weight));
  const residual=checked(lhs-value);
  entries.push({sourceConstraintId:sourceId,axis,
   id:'r'+entries.length,unit:'mm',scale:featureScaleMm,
   residual,absoluteTolerance:absoluteToleranceMm,relativeTolerance,
   derivatives:coefficients.map(value=>({value,unit:'mm/mm'}))});
 }
 for(const x of c){
  const d=x.data;
  if(x.type==='fixed')row(x.id,d.axis,[[d.point,d.axis,1]],d.value);
  else if(x.type==='coincident'){
   for(const axis of ['x','y'])
    row(x.id,axis,[[d.a,axis,1],[d.b,axis,-1]],0);
  }else{
   const axis=x.type==='horizontal'?'y':'x';
   row(x.id,axis,[[d.a,axis,1],[d.b,axis,-1]],0);
  }
 }
 // At a huge absolute origin, binary64 cannot resolve the requested mm
 // threshold; do not issue confident rank/consistency evidence.
 for(const p of points)for(const axis of ['x','y']){
  const resolution=2*Number.EPSILON*Math.abs(p.data[axis]);
  if(!finite(resolution)||resolution>tolerance.allowedDifference)
   throw new RangeError('model coordinate resolution exceeds declared mm tolerance');
 }
 const normalized=normalizeLocalSystem({variables,constraints:entries});
 const rank=diagnoseJacobian({rows:normalized.normalizedJacobian,
  normalized:true,relativeThreshold:relativeRankThreshold});
 const rankUsable=rank.status!=='undetermined'&&rank.converged===true;
 const compatible=normalized.atProvidedConfiguration;
 const status=!compatible?'configuration-residual-failed':
  !rankUsable?'local-rank-undetermined':'local-numeric-evidence';
 return Object.freeze({
  schema:'draftai-analytic-linear-point-local-evidence/1',
  status,sourceRevision,geometryCount:g.length,constraintCount:c.length,
  equationCount:entries.length,incidence:structure,
  equationSources:Object.freeze(entries.map(e=>Object.freeze({
   equationId:e.id,constraintId:e.sourceConstraintId,axis:e.axis}))),
  variableIds:Object.freeze(variables.map(v=>v.id)),
  normalizedResiduals:Object.freeze([...normalized.normalizedResiduals]),
  rankEstimate:rankUsable?rank.rankEstimate:null,
  localDegreesEstimate:rankUsable?rank.localDegreesEstimate:null,
  numericalRankStatus:rank.status,
  atProvidedConfiguration:compatible,
  proofOfExistence:false,proofOfNonexistence:false,
  proofOfGlobalUniqueness:false,globallyUnique:null
 });
}
module.exports={analyzeLinearPointConstraints};
