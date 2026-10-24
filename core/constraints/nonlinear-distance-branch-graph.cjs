'use strict';
/**
 * M3 constraint GRAPH inspector: reusable local two-distance primitive
 * evidence derived from explicitly anchored source point constraints.
 *
 * This NEVER claims a full nonlinear graph is solved. Extra constraints
 * and other unknowns may shrink or invalidate the local locus pair.
 */
const {classifyTwoCircleLoci}=
 require('./two-circle-branch-evidence.cjs');
const freeze=x=>{
 if(x&&typeof x==='object'&&!Object.isFrozen(x)){
  for(const v of Object.values(x))freeze(v);Object.freeze(x);
 }return x;
};
function deriveTwoDistanceSubgraphEvidence({frame,unit,points,constraints,revision}={}){
 if(frame!=='model-mm-2d')return freeze({schema:'draftai-m3-two-distance-graph-evidence/1',
  revision,status:'not-covered',subgraphs:[],budgetExceeded:false,
  fullConstraintGraphVerified:false,v5Ready:false});
 if(unit!=='mm'||!Number.isSafeInteger(revision)||revision<0||
    !Array.isArray(points)||!Array.isArray(constraints))
  throw new TypeError('reviewed nonlinear M3 model-mm graph required');
 const ids=new Set();
 for(const c of constraints){
  if(!c||typeof c.id!=='string'||!/^[A-Za-z][A-Za-z0-9_-]{0,79}$/.test(c.id)||
     ids.has(c.id))
   throw new TypeError('ambiguous or duplicated original constraint ID');
  ids.add(c.id);
 }
 const fixed=new Map(),counts=new Map();
 for(const c of constraints)if(c.kind==='fixed'){
  counts.set(c.point,(counts.get(c.point)||0)+1);
  if(!fixed.has(c.point))fixed.set(c.point,c.at);
 }
 // Ambiguous and conflicting duplicate fixed anchors cannot be promoted to
 // a coherent source circle even when their numeric values appear equal.
 for(const [id,count] of counts)if(count!==1)fixed.delete(id);
 const targets=new Map();
 for(const c of constraints){
  if(c.kind!=='distance')continue;
  for(const [anchor,target] of [[c.a,c.b],[c.b,c.a]]){
   if(!fixed.has(anchor)||fixed.has(target))continue;
   const items=targets.get(target)||[];
   items.push({constraintId:c.id,anchorId:anchor,
    center:fixed.get(anchor),radiusMm:c.value});
   targets.set(target,items);
  }
 }
 const subgraphs=[],cap=24;
 let budgetExceeded=false;
 for(const [targetPointId,items] of targets){
  for(let i=0;i<items.length;i++)for(let j=i+1;j<items.length;j++){
   const a=items[i],b=items[j];
   if(a.constraintId===b.constraintId)continue;
   if(subgraphs.length>=cap){budgetExceeded=true;continue;}
   const proof=classifyTwoCircleLoci({
    first:{id:a.constraintId,center:a.center,radiusMm:a.radiusMm},
    second:{id:b.constraintId,center:b.center,radiusMm:b.radiusMm},
    revision
   });
   subgraphs.push({
    targetPointId,anchorObjectIds:[a.anchorId,b.anchorId],
    sourceConstraintIds:[a.constraintId,b.constraintId],
    status:proof.status,branchCount:proof.branchCount,
    exhaustiveWithinTwoDistanceLoci:
      proof.exhaustiveAlgebraicTopologyWithinTwoLoci,
    // The witness is a projection of this constraint GRAPH to just TWO
    // distance factors, never evidence of complete graph root coverage.
    completeFullConstraintGraphVerified:false,
    additionalFactorsMayExcludeOrRestrictBranches:true,
    proof
   });
  }
 }
 return freeze({schema:'draftai-m3-two-distance-graph-evidence/1',
  revision,status:budgetExceeded?'partial-budget-limited':
   subgraphs.length?'local-analytic-subgraphs':'no-matching-subgraph',
  subgraphs,budgetExceeded,
  fullConstraintGraphVerified:false,
  solutionsCertifiedForFullGraph:false,
  sourceImageVerified:false,
  constructionIntentReady:false,v5Ready:false});
}
module.exports={deriveTwoDistanceSubgraphEvidence};
