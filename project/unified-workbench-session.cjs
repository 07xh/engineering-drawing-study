'use strict';
/**
 * V7 user-facing adapter to the ALREADY deployed 03 M3->Intent->DAG->V5
 * pipeline and the canonical Geometry scene. No secondary solver or player.
 * Explicit human-reviewed model-mm point input only; raster is a reference.
 */
const {solveProjection}=require('../engines/projection/point-projection.cjs');
const {evaluateUnifiedMath}=require('../workbench/unified-math-pipeline.cjs');
const {deriveGeometryScene,projectSelectionLinks}=
  require('../core/projection/geometry-scene-views.cjs');
const Timeline=require('../workbench/teaching-timeline-v5.js');
const SHEET=Object.freeze({origin:{x:360,y:208},scale:5});
const finite=x=>typeof x==='number'&&Number.isFinite(x);
function verifiedPointFromInputs(data){
  if(!data||data.task!=='projection'||!Number.isSafeInteger(data.revision)||
     !Array.isArray(data.conditions)||data.conditions.length!==1)
    throw new Error('仅支持一条人工确认的空间点毫米条件');
  const c=data.conditions[0],v=c?.value;
  if(c.confirmed!==true||c.objectId!=='Point1'||v?.type!=='point-xyz'||
     v.unit!=='mm'||!Array.isArray(v.xyz)||v.xyz.length!==3||
     !v.xyz.every(finite)||v.xyz.some(n=>Math.abs(n)>100000))
    throw new Error('请人工确认空间点 P 的 x/y/z（mm），不能使用未经确认的识图候选');
  if(v.imageId!==undefined&&v.imageId!==data.source?.imageId)
    throw new Error('标注已不属于当前原图，必须重新核对');
  if(data.objects?.length!==1||data.objects[0]?.id!=='Point1')
    throw new Error('点对象身份与求解输入不一致');
  return {x:v.xyz[0],y:v.xyz[1],z:v.xyz[2]};
}
function createUnifiedProjectSession(){
 let latest=null,current=null,clock=null;
 const listeners=new Set(),emit=()=>{for(const f of listeners)f();};
 const api={
  subscribe(f){listeners.add(f);return()=>listeners.delete(f);},
  stopPlayback(){if(clock)clock.pause(performance.now());},
  invalidate(){current=null;clock=null;emit();},
  loadInputs(data){latest=data;current=null;clock=null;emit();},
  readSnapshot(){return current;},
  dispose(){latest=null;current=null;clock=null;listeners.clear();},
  solve(){
   current=null;clock=null;
   const point=verifiedPointFromInputs(latest);
   const knownViews={V:[point.x,point.z],H:[point.x,point.y]};
   const input={knownViews,sheetTransform:SHEET};
   const actual=solveProjection(input);
   const plan=evaluateUnifiedMath({kind:'point-projection',input,revision:latest.revision});
   const tolerance=1e-7;
   if(actual.status!=='unique'||actual.globallyUnique!==true||
      plan.status!=='ready'||plan.mathematicallyVerified!==true||
      plan.canonicalVerified!==true||plan.revision!==latest.revision||
      !['x','y','z'].every(k=>Math.abs(actual.point[k]-point[k])<=tolerance)||
      !Array.isArray(plan.steps)||!plan.steps.length||!plan.timing)
     throw new Error('数学结果、已确认坐标与唯一 V5 意图不一致，已拒绝播放');
   // Geometry is emitted from the specialist result, NEVER caller display data.
   const scene=deriveGeometryScene({
    geometry:[{id:'Point1',kind:'point',space:'model-3d',unit:'mm',data:actual.point}],
    revision:latest.revision,resultId:'PointSolve',branchId:plan.selectedBranchId||null
   });
   const links=projectSelectionLinks(scene);
   clock=Timeline.createPlayer(plan.timing,{revision:latest.revision});
   current=Object.freeze({
    projectId:latest.projectId,inputRevision:latest.revision,verified:true,
    status:'unique',point:actual.point,residualMm:actual.maxResidual,
    plan,scene,links,clock
   });
   emit();return current;
  }
 };
 return api;
}
module.exports={createUnifiedProjectSession,verifiedPointFromInputs,SHEET};
