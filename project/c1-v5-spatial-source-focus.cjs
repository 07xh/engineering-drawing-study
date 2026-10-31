'use strict';
/**
 * Read-only C1 CURRENT V5 -> original Geometry Scene focus.
 *
 * Only the one existing audited ConstructionStep DAG / V5 clock determines
 * which signed original source edge may be highlighted in the 3D viewer.
 * This is a visual cross-link, NOT a new original BRep->HLR causal witness,
 * 3D topology solver, M5 engineering line-style certificate or V5 action.
 */
const {SCHEMA}=require('../core/projection/geometry-scene-views.cjs');
const {project,VIEWS}=require('../core/projection/conventions.js');
const {sourceFeatureKey}=require('./geometry-scene-consumer.cjs');
const {inspectC1CanonicalV5Step}=
 require('../workbench/c1-canonical-v5-step-evidence.cjs');
const finite=Number.isFinite;
const equal2=(a,b)=>a&&b&&a.x===b.x&&a.y===b.y;
const equal3=(a,b)=>a&&b&&a.x===b.x&&a.y===b.y&&a.z===b.z;
const equalUV=(a,b)=>a&&b&&a.u===b.u&&a.v===b.v;
const either=(a,b,c,d,cmp)=>(cmp(a,c)&&cmp(b,d))||(cmp(a,d)&&cmp(b,c));
const at=(a,b,t)=>({
 x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,z:a.z+(b.z-a.z)*t
});
function currentC1V5SpatialSourceFocus({scene,solution,revision,frame}={}){
 if(scene?.schema!==SCHEMA||!Number.isSafeInteger(revision)||
    revision<0||scene.revision!==revision||
    solution?.sceneResult?.scene!==scene||
    solution.singleOriginalV5Player!==true)
  throw new RangeError('current original C1 Geometry Scene/V5 identity required');
 // The canonical inspector checks the complete DAG, signed/unsigned action
 // ownership and CURRENT player frame before this presentation code runs.
 const step=inspectC1CanonicalV5Step({solution,revision,frame});
 const bindings=[
  ...(solution.certifiedVisibleContourLineBindings||[]),
  ...(solution.certifiedPhysicalLineBindings||[])
 ];
 const byId=new Map(bindings.map(b=>[b.actionId,b]));
 if(byId.size!==bindings.length)
  throw new RangeError('duplicate signed C1 source bindings');
 const keys=[],details=[];
 for(const action of step.actions){
  if(!action.formalLineCertified||action.progress<=0)continue;
  const binding=byId.get(action.id);
  const original=solution.steps[step.stepIndex].actions.find(a=>a.id===action.id);
  if(!binding||!original||original.kind!=='line'||
     binding.actionId!==action.id||
     binding.sourceEdgeId!==action.originalSourceEdgeId||
     !VIEWS.includes(binding.view)||binding.view!==action.view||
     binding.revision!==revision||
     !equal2(binding.fromSheetPx,original.geometry?.from)||
     !equal2(binding.toSheetPx,original.geometry?.to))
   throw new RangeError('active signed V5 action and source-paper binding disagree');
  const object=scene.objects.find(obj=>obj.id===binding.sourceGeometryId);
  if(!object||object.kind!=='mesh'||object.space!=='model-3d'||
     object.model?.unit!=='mm')
   throw new RangeError('signed source cannot be located in the current 3D scene');
  const prefix=object.id+'::';
  if(!binding.sourceEdgeId.startsWith(prefix))
   throw new RangeError('C1 3D source edge belongs to another geometry');
  const ids=binding.sourceEdgeId.slice(prefix.length).split('|');
  if(ids.length!==2||ids[0]===ids[1]||ids.some(id=>!id)||
     ids.slice().sort().join('|')!==ids.join('|'))
   throw new RangeError('C1 source edge vertex IDs not canonical');
  const d=object.representations?.['3D']?.data;
  const originals=d?.edges?.filter(e=>Array.isArray(e)&&e.length===2&&
   e.slice().sort().join('|')===ids.join('|'))||[];
  if(originals.length!==1)
   throw new RangeError('C1 active source edge is missing or non-unique');
  const [aId,bId]=originals[0],a=d.points[aId],b=d.points[bId];
  if(!a||!b||!['x','y','z'].every(k=>finite(a[k])&&finite(b[k])))
   throw new RangeError('C1 original 3D physical edge endpoints unavailable');
  const expected=[project(a)[binding.view],project(b)[binding.view]];
  const range=binding.originalParameterRange;
  if(range!==undefined){
   // A subspan may be highlighted only when its TRUE original 3D
   // positions agree with the current scene, not when paper ink overlaps.
   if(!Array.isArray(range)||range.length!==2||
      !range.every(finite)||range[0]<0||!(range[1]>range[0])||
      range[1]>1||!equal3(binding.real3DFrom,at(a,b,range[0]))||
      !equal3(binding.real3DTo,at(a,b,range[1]))||
      !equalUV(project(binding.real3DFrom)[binding.view],
       {u:binding.fromModelMm?.u,v:binding.fromModelMm?.v})||
      !equalUV(project(binding.real3DTo)[binding.view],
       {u:binding.toModelMm?.u,v:binding.toModelMm?.v}))
    throw new RangeError('C1 current 3D subspan is not the signed original edge');
  }else if(!either(expected[0],expected[1],
    binding.fromModelMm,binding.toModelMm,equalUV))
   throw new RangeError('C1 visible contour does not match original 3D edge');
  const key=sourceFeatureKey(object,{edgeIds:[aId,bId]});
  if(!keys.includes(key))keys.push(key);
  details.push(Object.freeze({actionId:action.id,sourceEdgeId:binding.sourceEdgeId,
   sourceFeatureKey:key,view:binding.view,progress:action.progress,
   sourceParameterRange:range?[...range]:null,
   certifiedV5ActionIdOnly:true}));
 }
 return Object.freeze({
  schema:'draftai-c1-v5-active-original-3d-source-focus/1',
  revision,activeStepId:step.id,
  sourceFeatureKeys:Object.freeze(keys),
  originalSourceActions:Object.freeze(details),
  // Focus never releases or restyles ink, including partially certified
  // contour/physical source segments or unresolved textbook HLR gaps.
  engineeringLineStyle:'undetermined',
  globalGeneratedHLRHistoryCertifiedByThisFocus:false,
  formalV5ActionsCreated:0,
  displayOnly:true
 });
}
module.exports={currentC1V5SpatialSourceFocus};
