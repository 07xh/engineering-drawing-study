'use strict';
/**
 * 07 view-only bidirectional focus contract: one M3 XYZ sample maps to all
 * three already-computed first-angle model and sheet projections and one
 * existing V5 timeline segment per view. No implicit rendering proof.
 */
const {project}=require('../core/projection/conventions.js');
const finite=Number.isFinite;
const VIEWS=Object.freeze(['V','H','W']);
const near=(a,b,tol)=>finite(a)&&finite(b)&&Math.abs(a-b)<=tol;
function coneSpatialProjectionFocus(plan,sampleIndex){
 if(!plan||plan.status!=='preview-only'||plan.mathematicallyVerified!==true||
    plan.firstAngleCoordinateMappingVerified!==true||
    plan.presentationMode!=='split-sheet'||plan.v5ProjectionPreviewReady!==true||
    !plan.spatialIntent?.operation?.samplePoints||
    !plan.viewPositions||!Array.isArray(plan.steps)||!plan.timing||
    typeof plan.stillCurrent!=='function'||!plan.stillCurrent(plan.revision))
  throw new TypeError('current reviewed M3 three-view/V5 plan required');
 const pts=plan.spatialIntent.operation.samplePoints;
 const count=pts.length-1;
 if(!Number.isSafeInteger(sampleIndex)||sampleIndex<0||sampleIndex>count||
    count<32||count>256)
  throw new RangeError('bounded spatial section source index required');
 const q=pts[sampleIndex],m=plan.spatialIntent.operation.cone;
 const modelProjection=project(q);
 const scale=Math.max(1,m.radiusMm,m.heightMm,...Object.values(q).map(Math.abs));
 const tol=1e-7*scale,viewLinks={};
 const actionIndex=new Map(plan.steps.flatMap((step,stepIndex)=>
  step.actions.map(a=>[a.id,{step,stepIndex,action:a}])));
 const timeIndex=new Map(plan.timing.segments.map(s=>[s.id,s]));
 const intervalIndex=sampleIndex===0?1:sampleIndex;
 for(const view of VIEWS){
  const uv=plan.spatialIntent.projectionSamples[view]?.[sampleIndex];
  const xy=plan.viewPositions[view]?.[sampleIndex];
  if(!uv||!xy||!near(uv.u,modelProjection[view].u,tol)||
     !near(uv.v,modelProjection[view].v,tol)||
     ![xy.x,xy.y].every(finite))
   throw new RangeError('spatial XYZ / first-angle projection mismatch');
  const actionId='cone_'+view+'_lateral_'+intervalIndex;
  const item=actionIndex.get(actionId),seg=timeIndex.get(actionId);
  if(!item||!seg||item.step.role!=='result'||
     item.action.sampledPolylineOnly!==true)
   throw new RangeError('missing canonical M3/V5 sample action');
  const g=item.action.geometry;
  const from=plan.viewPositions[view][intervalIndex-1];
  const to=plan.viewPositions[view][intervalIndex];
  if(item.action.kind==='line'){
   if(!near(g.from.x,from.x,tol)||!near(g.from.y,from.y,tol)||
      !near(g.to.x,to.x,tol)||!near(g.to.y,to.y,tol))
    throw new RangeError('V5 stroke and 3D model projection disagree');
  }else if(item.action.kind==='point'){
   if(!near(g.center.x,from.x,tol)||!near(g.center.y,from.y,tol)||
      Math.hypot(from.x-to.x,from.y-to.y)>tol)
    throw new RangeError('collapsed V5 projection sample disagrees');
  }else throw new TypeError('unsupported sampled projected action');
  viewLinks[view]=Object.freeze({
   view,modelUv:{u:uv.u,v:uv.v},sheetPx:{x:xy.x,y:xy.y},
   sourceActionId:actionId,sourceStepId:item.step.id,
   sourceStepIndex:item.stepIndex,actionEndMs:seg.endMs,
   overlayOnly:true,certifiedWholeStrokeVisibility:false
  });
 }
 const guideSamples=[0,Math.floor(count/4),Math.floor(count/2),
  Math.floor(3*count/4)];
 const index=guideSamples.indexOf(sampleIndex);
 const generators=index<0?[]:VIEWS.map(v=>{
  const id='cone_generator_'+index+'_'+v;
  const s=plan.steps.find(step=>step.sourceStepId===id);
  if(!s)throw new TypeError('verified generator projection step missing');
  const mark=s.actions.at(-1),xy=viewLinks[v].sheetPx;
  if(!mark||mark.kind!=='point'||!near(mark.geometry.center.x,xy.x,tol)||
     !near(mark.geometry.center.y,xy.y,tol))
   throw new RangeError('canonical source generator / focus mismatch');
  return s.id;
 });
 return Object.freeze({
  revision:plan.revision,sourceSpatialIntentId:plan.spatialIntent.id,
  sourceIndex:sampleIndex,world:{x:q.x,y:q.y,z:q.z},
  views:Object.freeze(viewLinks),canonicalGeneratorStepIds:generators,
  exactXYZFromM3:true,firstAngleXYZProjectionVerified:true,
  allThreeViewsLinked:true,oneExistingV5Timeline:true,
  overlaysNotConstructionSteps:true,visibilityVerified:false
 });
}
module.exports={coneSpatialProjectionFocus};
