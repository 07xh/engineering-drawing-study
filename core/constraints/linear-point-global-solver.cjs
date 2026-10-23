'use strict';
/**
 * Shared M1/M2 analytic solution of bounded planar point EQUALITY systems.
 *
 * Supports typed fixed-x/y, coincident, horizontal and vertical constraints.
 * This class has exact symbolic rank via coordinate-equality classes (DSU);
 * it is NOT a generic nonlinear optimizer, curve solver, or 3D solver.
 * It creates a canonical SolveResult from actual input equations, never from
 * caller-supplied proof flags or arbitrary initial drawing point positions.
 *
 * Float64 anchors are only certified when representable at declared mm
 * tolerance. Distinct near-equal anchors fail closed, not "snapped" to a
 * convenient standard answer; distant contradictory anchors prove no solution
 * under the exact declared equality relations.
 *
 * Source image/provenance and ConstructionIntent/V5 are separate gates.
 */
const {buildConstraintIncidence}=require('./constraint-incidence.cjs');
const {policy}=require('../numeric/residual-evidence.cjs');
const {validateSolveResult}=require('../contracts/solve-result.js');

const finite=n=>typeof n==='number'&&Number.isFinite(n);
function solveLinearPointSystem({
 geometry,constraints,sourceRevision,featureScaleMm,
 absoluteToleranceMm,relativeTolerance=0
}={}){
 if(!Number.isSafeInteger(sourceRevision)||sourceRevision<0)
  throw new TypeError('nonnegative sourceRevision required');
 if(!Array.isArray(geometry)||geometry.length<1||geometry.length>32||
    !Array.isArray(constraints)||constraints.length<1||constraints.length>64)
  throw new RangeError('bounded 1..32 point geometry and 1..64 constraints required');
 const tolerance=policy({absoluteTolerance:absoluteToleranceMm,relativeTolerance,
  characteristicScale:featureScaleMm,unit:'mm'});
 // One immutable logical snapshot. Never inspect live inputs again.
 const snapshot=structuredClone({geometry,constraints});
 const g=snapshot.geometry,c=snapshot.constraints;
 const incidence=buildConstraintIncidence({geometry:g,constraints:c});
 if(g.some(x=>x.kind!=='point'||x.space!=='drawing-2d'||x.unit!=='mm')||
    c.some(x=>x.scope!=='multi-point-2d-linear'||
      !['fixed','coincident','horizontal','vertical'].includes(x.type)))
  throw new TypeError('only typed planar model-mm linear point equalities supported');
 const ordered=[...g].sort((a,b)=>a.id.localeCompare(b.id));
 const map=new Map(ordered.map((p,i)=>[p.id,i]));
 const count=2*ordered.length;
 const parent=Array.from({length:count},(_,i)=>i);
 const idx=(id,axis)=>{
  const i=map.get(id);
  if(i===undefined||!['x','y'].includes(axis))
   throw new TypeError('unknown typed point coordinate');
  return 2*i+(axis==='y'?1:0);
 };
 function find(i){
  while(parent[i]!==i){parent[i]=parent[parent[i]];i=parent[i];}
  return i;
 }
 function union(a,b){
  a=find(a);b=find(b);
  if(a!==b)parent[Math.max(a,b)]=Math.min(a,b);
 }
 const anchors=[];
 for(const constraint of c){
  const d=constraint.data;
  if(constraint.type==='fixed'){
   anchors.push({index:idx(d.point,d.axis),value:d.value,id:constraint.id});
  }else if(constraint.type==='coincident'){
   union(idx(d.a,'x'),idx(d.b,'x'));
   union(idx(d.a,'y'),idx(d.b,'y'));
  }else{
   const axis=constraint.type==='horizontal'?'y':'x';
   union(idx(d.a,axis),idx(d.b,axis));
  }
 }
 const groups=new Map();
 for(let i=0;i<count;i++){
  const root=find(i);
  if(!groups.has(root))groups.set(root,{members:[],anchors:[]});
  groups.get(root).members.push(i);
 }
 for(const anchor of anchors)groups.get(find(anchor.index)).anchors.push(anchor);
 const allowed=tolerance.allowedDifference;
 const floatingResolution=value=>2*Number.EPSILON*Math.max(1,Math.abs(value));
 const closeLimit=(a,b)=>Math.max(floatingResolution(a),floatingResolution(b));
 function deliver(status,diagnostic,{values=null,rank=null,degrees=null,maxResidual=null}={}){
  const single=status==='unique';
  const solveResult={scope:'m2/planar-linear-coordinate-equalities',
   status,solutions:single?[values]:[],solutionCount:
    single?1:status==='none'?0:null,
   rank,degrees,localDegrees:degrees,
   globallyUnique:single?true:status==='continuous'?false:null,
   maxResidual,proofLevel:status==='undetermined'?'none':'analytic',
   diagnostics:[diagnostic]};
  const report=validateSolveResult(solveResult);
  if(!report.ok)throw new TypeError('invalid canonical SolveResult: '+report.errors.join('; '));
  const solvedGeometry=single?ordered.map(p=>({
   id:p.id,kind:'point',space:'drawing-2d',unit:'mm',
   data:{x:values[p.id+'_x'],y:values[p.id+'_y']}
  })):[];
  return Object.freeze({
   schema:'draftai-m2-planar-linear-equalities/1',sourceRevision,unit:'mm',
   status,variableCount:count,independentRank:rank,
   degrees,solvedGeometry:Object.freeze(solvedGeometry.map(Object.freeze)),
   solveResult:Object.freeze({...solveResult,
    solutions:Object.freeze(solveResult.solutions.map(Object.freeze)),
    diagnostics:Object.freeze(solveResult.diagnostics)}),
   incidence,sourceConfirmed:false,
   sourceImageProven:false,readyForV5:false
  });
 }
 let uncertain=null;
 for(const group of groups.values()){
  const fixed=group.anchors;
  for(let i=0;i<fixed.length;i++){
   if(!finite(fixed[i].value))throw new TypeError('nonfinite fixed coordinate');
   for(let j=i+1;j<fixed.length;j++){
    const diff=Math.abs(fixed[i].value-fixed[j].value);
    if(!finite(diff))throw new RangeError('fixed coordinate difference overflow');
    const resolution=closeLimit(fixed[i].value,fixed[j].value);
    if(diff>allowed+resolution)
     return deliver('none','incompatible fixed coordinates within a symbolic equality class');
    if(diff!==0)uncertain='distinct but numerically close fixed anchors cannot prove exact equality';
   }
  }
  if(fixed.some(a=>floatingResolution(a.value)>allowed))
   uncertain='floating-point coordinate resolution exceeds declared mm tolerance';
 }
 if(uncertain)return deliver('undetermined',uncertain);
 const free=[...groups.values()].filter(x=>!x.anchors.length).length;
 const rank=count-free;
 if(free)return deliver('continuous','unfixed coordinate equality classes leave continuous translations',
  {rank,degrees:free});
 const values={};
 for(const p of ordered){
  for(const axis of ['x','y']){
   const root=find(idx(p.id,axis));
   const value=groups.get(root).anchors[0].value;
   if(!finite(value))throw new RangeError('unrepresentable solved coordinate');
   values[p.id+'_'+axis]=value;
  }
 }
 return deliver('unique','all coordinate equality classes fixed by consistent explicit anchors',
  {values,rank,degrees:0,maxResidual:0});
}
module.exports={solveLinearPointSystem};
