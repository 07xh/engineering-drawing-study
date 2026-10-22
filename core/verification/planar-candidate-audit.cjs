'use strict';
/**
 * Independent M2 residual audit for explicitly model-mm 2D intersection
 * candidates. Does not solve, classify globally, or choose a branch.
 */
const {checkResidual,policy}=require('../numeric/residual-evidence.cjs');
const finite=v=>typeof v==='number'&&Number.isFinite(v);
const id=v=>typeof v==='string'&&/^[A-Za-z][A-Za-z0-9_-]{0,79}$/.test(v);
function dense(a,max,label){
 if(!Array.isArray(a)||a.length>max)throw new TypeError(label+' must be a bounded array');
 for(let i=0;i<a.length;i++)if(!Object.hasOwn(a,i))throw new TypeError(label+' must be dense');
 return a;
}
function point(value,label){
 if(!value||typeof value!=='object'||Array.isArray(value))throw new TypeError(label+' must be a point');
 const {x,y}=value;
 if(!finite(x)||!finite(y))throw new TypeError(label+' must have finite x/y');
 return Object.freeze({x,y});
}
function primitive(raw){
 if(!raw||typeof raw!=='object'||Array.isArray(raw))throw new TypeError('model-mm primitive required');
 const {id:primitiveId,kind,frame,unit}=raw;
 if(!id(primitiveId)||frame!=='model-mm-2d'||unit!=='mm')
  throw new TypeError('primitive requires id, model-mm frame and mm units');
 if(kind==='circle'){
  const {x,y,r}=raw;
  if(!finite(x)||!finite(y)||!finite(r)||r<=0)throw new TypeError('invalid model circle');
  return Object.freeze({id:primitiveId,kind,x,y,r});
 }
 if(kind==='line'){
  const {a,b,offset}=raw;
  if(!finite(a)||!finite(b)||!finite(offset))throw new TypeError('invalid model line');
  const norm=Math.hypot(a,b);
  if(!finite(norm)||norm===0)throw new TypeError('invalid model line normal');
  const nx=a/norm,ny=b/norm,shift=offset/norm;
  if(!finite(nx)||!finite(ny)||!finite(shift)||
      (a!==0&&nx===0)||(b!==0&&ny===0)||(offset!==0&&shift===0))
   throw new RangeError('line normalization loses model information');
  return Object.freeze({id:primitiveId,kind,nx,ny,shift});
 }
 throw new TypeError('only analytic line/circle primitives supported');
}
function residual(p,c){
 if(c.kind==='circle'){
  const dx=p.x-c.x,dy=p.y-c.y;
  if(!finite(dx)||!finite(dy))throw new RangeError('circle difference overflow');
  const distance=Math.hypot(dx,dy);
  if(!finite(distance))throw new RangeError('circle norm overflow');
  const value=distance-c.r;
  if(!finite(value))throw new RangeError('circle residual overflow');
  return value;
 }
 const productX=c.nx*p.x,productY=c.ny*p.y;
 if(!finite(productX)||!finite(productY))throw new RangeError('line product overflow');
 const value=(productX+productY)-c.shift;
 if(!finite(value))throw new RangeError('line residual overflow');
 return value;
}
function auditPlanarCandidates({primitives,candidates,featureScaleMm,absoluteToleranceMm,
 relativeTolerance=0,sourceRevision}={}){
 if(!Number.isSafeInteger(sourceRevision)||sourceRevision<0)
  throw new TypeError('current source revision required');
 const rawPrimitives=dense(primitives,2,'primitives');
 if(rawPrimitives.length!==2)throw new TypeError('two analytic constraints required');
 const ps=rawPrimitives.map(primitive);
 if(ps[0].id===ps[1].id)throw new TypeError('duplicate primitive ID');
 const cs=dense(candidates,16,'candidates');
 const spec={absoluteTolerance:absoluteToleranceMm,relativeTolerance,
  characteristicScale:featureScaleMm,unit:'mm'};
 const tol=policy(spec).allowedDifference;
 const used=new Set();
 const details=cs.map(raw=>{
  if(!raw||typeof raw!=='object'||Array.isArray(raw))throw new TypeError('candidate record required');
  const {id:branchId,point:rawPoint}=raw;
  if(!id(branchId)||used.has(branchId))throw new TypeError('unique branchId required');
  used.add(branchId);
  const p=point(rawPoint,'candidate');
  const checks=ps.map(g=>{
   const result=checkResidual({residual:residual(p,g),...spec});
   return Object.freeze({primitiveId:g.id,absoluteResidualMm:result.absoluteResidual,
    normalizedResidual:result.normalizedResidual,status:result.status});
  });
  return Object.freeze({branchId,point:p,checks:Object.freeze(checks),
   withinTolerance:checks.every(c=>c.status==='within-tolerance')});
 });
 let insufficientSeparation=false;
 for(let i=0;i<details.length;i++)for(let j=i+1;j<details.length;j++){
  const a=details[i].point,b=details[j].point;
  const dx=a.x-b.x,dy=a.y-b.y;
  if(!finite(dx)||!finite(dy))throw new RangeError('candidate separation overflow');
  const d=Math.hypot(dx,dy);
  if(!finite(d))throw new RangeError('candidate distance overflow');
  if(d<=tol)insufficientSeparation=true;
 }
 const allWithin=details.every(x=>x.withinTolerance);
 const status=details.length===0?'no-candidates-to-audit':
  !allWithin?'candidate-residual-failed':
  insufficientSeparation?'branch-separation-undetermined':'within-declared-tolerances';
 return Object.freeze({schema:'draftai-planar-candidate-numeric-audit/1',
  status,sourceRevision,featureScaleMm,allowedDifferenceMm:tol,
  candidates:Object.freeze(details),checkedPrimitiveIds:Object.freeze(ps.map(p=>p.id)),
  hasCandidateGeometry:details.length>0,hasInsufficientBranchSeparation:insufficientSeparation,
  numericalResidualCheckOnly:true,proofOfExistence:false,proofOfNonexistence:false,
  proofOfGlobalUniqueness:false,globallyUnique:null});
}
module.exports={auditPlanarCandidates};
