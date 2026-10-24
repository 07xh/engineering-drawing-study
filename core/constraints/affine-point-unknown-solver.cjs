'use strict';
/**
 * Scoped M3 affine constraints over UNKNOWN 2D/3D point coordinates (mm).
 * Reuses existing M0 Jacobian-rank diagnostics and canonical SolveResult.
 *
 * This solves an affine point system ONLY. A linear result cannot claim
 * image provenance, global uniqueness of a non-linear engineering problem,
 * complete ConstructionIntent, standard visibility or V5 authorization.
 */
const {diagnoseJacobian}=require('../numeric/jacobian-rank-evidence.cjs');
const {validateSolveResult}=require('../contracts/solve-result.js');
const ID=/^[A-Za-z][A-Za-z0-9_-]{0,79}$/;
const EPS=1e-10, MAX=1e6, MAX_UNKNOWN=16, MAX_EQUATIONS=64;
const finite=Number.isFinite;
const plain=o=>!!o&&typeof o==='object'&&!Array.isArray(o)&&
 (Object.getPrototypeOf(o)===Object.prototype||Object.getPrototypeOf(o)===null);
function fail(s){throw new TypeError('M3 affine unknown-point constraints: '+s);}
function deepFreeze(o){if(o&&typeof o==='object'&&!Object.isFrozen(o)){
 for(const v of Object.values(o))deepFreeze(v);Object.freeze(o);
}return o;}
function keys(o,want){if(!plain(o)||Object.keys(o).length!==want.length||
 Object.keys(o).some(k=>!want.includes(k)))fail('unknown or forged constraint fields');}
function xyz(p,axes){keys(p,axes);for(const k of axes){
 if(!finite(p[k])||Math.abs(p[k])>MAX)fail('model-mm coordinates must be finite and bounded');
}}
function solveAffinePointConstraints({frame,unit,points,constraints,revision,...extras}={}){
 if(Object.keys(extras).length)fail('unexpected proof/source payload');
 if(!Number.isSafeInteger(revision)||revision<0)fail('invalid source revision');
 if(!['model-mm-2d','model-mm-3d'].includes(frame)||unit!=='mm')
  fail('explicit 2D/3D model-mm coordinate frame required');
 const axes=frame==='model-mm-3d'?['x','y','z']:['x','y'];
 if(!Array.isArray(points)||!points.length||points.length>MAX_UNKNOWN||
   !Array.isArray(constraints)||constraints.length>MAX_EQUATIONS)
  fail('point or constraint set outside bounded scope');
 const byId=new Map();
 for(let i=0;i<points.length;i++){
  const p=points[i];keys(p,['id']);
  if(typeof p.id!=='string'||!ID.test(p.id)||byId.has(p.id))fail('duplicate/invalid unknown point ID');
  byId.set(p.id,i);
 }
 const n=points.length*axes.length;
 const rows=[],rhs=[],sources=[],seen=new Set();
 function index(id,k){if(typeof id!=='string'||!byId.has(id))fail('unknown point '+String(id));
  return byId.get(id)*axes.length+axes.indexOf(k);
 }
 function row(id,parts,value){
  if(!finite(value)||Math.abs(value)>2*MAX)fail('nonfinite or unbounded affine constant');
  if(rows.length>=MAX_EQUATIONS)fail('too many scalar equations');
  const coefficients=Array(n).fill(0);
  for(const [point,axis,factor] of parts){
   coefficients[index(point,axis)]+=factor;
  }
  rows.push(coefficients);rhs.push(value);sources.push(id);
 }
 for(const c of constraints){
  if(!plain(c)||typeof c.id!=='string'||!ID.test(c.id)||seen.has(c.id))
   fail('invalid or duplicate constraint ID');
  seen.add(c.id);
  switch(c.kind){
   case 'fixed':
    keys(c,['id','kind','point','at']);xyz(c.at,axes);
    for(const axis of axes)row(c.id,[[c.point,axis,1]],c.at[axis]);
    break;
   case 'axis':
    keys(c,['id','kind','point','axis','value']);
    if(!axes.includes(c.axis)||!finite(c.value)||Math.abs(c.value)>MAX)
     fail('unsupported locked coordinate axis/value');
    row(c.id,[[c.point,c.axis,1]],c.value);
    break;
   case 'coincident':
    keys(c,['id','kind','a','b']);
    if(c.a===c.b)fail('self-coincidence is not a useful condition');
    for(const axis of axes)row(c.id,[[c.b,axis,1],[c.a,axis,-1]],0);
    break;
   case 'offset':
    keys(c,['id','kind','from','to','delta']);xyz(c.delta,axes);
    if(c.from===c.to)fail('relative displacement must have different objects');
    for(const axis of axes)
     row(c.id,[[c.to,axis,1],[c.from,axis,-1]],c.delta[axis]);
    break;
   case 'midpoint':
    keys(c,['id','kind','mid','a','b']);
    if(new Set([c.mid,c.a,c.b]).size!==3)fail('midpoint needs three distinct objects');
    for(const axis of axes)
     row(c.id,[[c.mid,axis,2],[c.a,axis,-1],[c.b,axis,-1]],0);
    break;
   default:fail('non-affine or unsupported unknown-point relation '+String(c.kind));
  }
 }
 const m=rows.length;
 // The M0 evaluator takes at most 64 rows and 64 columns; coefficients of
 // coordinate equations are exactly dimensionless -1/0/1/2.
 let rankEvidence=null;
 if(m){
  rankEvidence=diagnoseJacobian({rows,normalized:true});
 }
 const aug=rows.map((line,i)=>[...line,rhs[i]]);
 let rank=0,sensitive=false;
 const pivotCols=[];
 for(let col=0;col<n&&rank<m;col++){
  let best=rank,max=Math.abs(aug[rank][col]);
  for(let k=rank+1;k<m;k++)if(Math.abs(aug[k][col])>max){
   best=k;max=Math.abs(aug[k][col]);
  }
  if(max<EPS){if(max>1e-14)sensitive=true;continue;}
  [aug[rank],aug[best]]=[aug[best],aug[rank]];
  const pivot=aug[rank][col];
  for(let j=col;j<=n;j++)aug[rank][j]/=pivot;
  for(let k=0;k<m;k++){
   if(k===rank)continue;
   const factor=aug[k][col];
   if(!factor)continue;
   for(let j=col;j<=n;j++)aug[k][j]-=factor*aug[rank][j];
  }
  pivotCols.push(col);rank++;
 }
 // If M0 independent SVD does not agree or is ill-conditioned we CANNOT
 // assert a dimension or globally unique solution from elimination alone.
 const robust=!sensitive&&(!rankEvidence||
   (rankEvidence.converged&&rankEvidence.rankEstimate===rank&&
    !rankEvidence.thresholdSensitive&&
    rankEvidence.conditionEstimate!==null&&rankEvidence.conditionEstimate<1e8)||
   (rankEvidence.converged&&rankEvidence.rankEstimate===rank&&
    !rankEvidence.thresholdSensitive&&rank<n&&
    rankEvidence.conditionEstimate===null));
 const tolerance=Math.max(1e-7,1e-10*Math.max(1,...rhs.map(Math.abs)));
 const impossible=aug.slice(rank).some(r=>Math.abs(r[n])>tolerance);
 let status,values=null,maximum=null;
 if(!robust)status='undetermined';
 else if(impossible)status='none';
 else {
  values=Array(n).fill(0);
  for(let i=rank-1;i>=0;i--)values[pivotCols[i]]=aug[i][n];
  maximum=0;
  for(let i=0;i<m;i++){
   const calc=rows[i].reduce((sum,a,j)=>sum+a*values[j],0);
   if(!finite(calc)){status='undetermined';break;}
   maximum=Math.max(maximum,Math.abs(calc-rhs[i]));
  }
  if(values.some(v=>!finite(v)||Math.abs(v)>1e8)||maximum>tolerance)
   status='undetermined';
  else status=rank===n?'unique':'continuous';
 }
 const diag=[
  'Only bounded affine unknown point coordinates in the specified model-mm frame are solved.',
  'Recomputed linear rank '+rank+'/'+n+'; independent M0 Jacobian '+(rankEvidence?.status??'empty')+'.',
  'No original-image approval, nonlinear branch proof, spatial visibility or V5 consent is conveyed.'
 ];
 const valid=status==='unique'||status==='continuous';
 const flat={};
 if(valid&&values)for(const [id,i] of byId)for(let a=0;a<axes.length;a++)
  flat[id+'_'+axes[a]]=values[i*axes.length+a];
 const solution={
  id:'AffinePointSystem',status,scope:frame+'-affine-unknown-points',
  solutions:status==='unique'?[flat]:[],
  solutionCount:status==='unique'?1:status==='none'?0:null,
  degrees:status==='unique'?0:status==='continuous'?n-rank:null,
  localDegrees:valid?n-rank:null,rank:robust?rank:null,
  globallyUnique:status==='unique'?true:status==='continuous'||status==='none'?false:null,
  maxResidual:valid?maximum:null,
  proofLevel:valid||status==='none'?'linear-algebra':'none',
  diagnostics:diag
 };
 const checked=validateSolveResult(solution);
 if(!checked.ok)fail('invalid canonical SolveResult: '+checked.errors.join('；'));
 const geometry=status==='unique'?points.map((p,i)=>({
  id:p.id,kind:'point',space:axes.length===2?'drawing-2d':'model-3d',
  unit:'mm',data:Object.fromEntries(axes.map((axis,j)=>
   [axis,values[i*axes.length+j]]))
 })):[];
 return deepFreeze({
  schema:'draftai-m3-affine-point-solver/1',
  revision,frame,unit,variableCount:n,equationCount:m,
  constraintIds:[...seen],rankEvidence,rank:robust?rank:null,
  nullity:valid?n-rank:null,status,
  solveResult:solution,geometry,
  residualMm:valid?maximum:null,toleranceMm:tolerance,
  mathematicallyVerifiedWithinAffineScope:status==='unique'&&robust,
  sourceProblemConfirmed:false,fullEngineeringDrawingVerified:false,
  constructionIntents:[],constructionSteps:[],v5Ready:false
 });
}
module.exports={solveAffinePointConstraints};
