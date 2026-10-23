'use strict';
/**
 * Shared M3 -> canonical ConstructionIntent -> ConstructionStep -> single V5
 * verification edge for every currently supported planar/point specialist.
 *
 * IMPORTANT: verifies provenance *consistency* and exact mathematical-to-
 * presentation projection, not existence, correctness or uniqueness of
 * caller-supplied mathematics. Only trusted M3 adapters may invoke the
 * enclosing ready path. A forged "verified" field has no authority here.
 */
const {validateConstructionIntentDAG}=require('../core/contracts/construction-intent.js');
const {verifiedTeachingActionToV5}=require('./construction-step-v5-adapter.cjs');
const Timeline=require('./teaching-timeline-v5.js');

const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
function assertM3ToV5Consistency({revision,intents,steps,timing,sheet}={}){
 if(!Number.isSafeInteger(revision)||revision<0)
  throw new TypeError('current nonnegative source revision required');
 const verdict=validateConstructionIntentDAG(intents);
 if(!verdict.ok)throw new TypeError('invalid canonical Intent DAG: '+verdict.errors.join('; '));
 if(!Array.isArray(steps)||steps.length!==intents.length)
  throw new RangeError('ConstructionStep count differs from canonical Intent');
 const source=intents[0].source;
 if(source.revision!==revision||source.unit!=='mm')
  throw new RangeError('mixed unit or stale M3 evidence revision');
 for(let index=0;index<intents.length;index++){
  const intent=intents[index],step=steps[index];
  if(!step||step.id!==intent.id||step.role!==intent.role||
     !same(step.dependsOn,intent.dependsOn)||
     !Array.isArray(step.actions)||step.actions.length!==intent.operations.length)
   throw new RangeError('ConstructionStep semantic DAG differs from source Intent');
  const projected=intent.operations.map(op=>
   verifiedTeachingActionToV5({
    id:op.id,kind:op.kind==='directed-arc'?'arc':op.kind,
    coordinateSpace:op.coordinateSpace,...op.geometry
   },sheet));
  if(!same(step.actions,projected))
   throw new RangeError('V5 geometry differs from canonical Intent or mm/px transform');
 }
 const expected=Timeline.compileTimeline(steps);
 if(!same(timing,expected))
  throw new RangeError('V5 timeline differs from current ConstructionStep DAG');
 return true; // Presentation parity only. Never a mathematical proof certificate.
}
/**
 * The same production consistency gate for the existing 3D spatial Intent
 * variant. It checks spatial-source identity, every projected source segment,
 * graph references and recompilation by the ONE V5 timeline. This is NOT
 * a 2D ConstructionIntent DAG and does not certify occlusion or an answer.
 */
function assertConeM3ToV5Consistency({preview,revision}={}){
 const {validateSpatialConstructionIntent}=
  require('../core/contracts/spatial-construction-intent.js');
 if(!Number.isSafeInteger(revision)||revision<0||
    preview?.status!=='preview-only'||preview.revision!==revision||
    preview.v5ProjectionPreviewReady!==true||
    preview.firstAngleCoordinateMappingVerified!==true||
    preview.visibilityVerified!==false)
  throw new RangeError('stale or unverified cone projection preview');
 const source=preview.spatialIntent;
 const verdict=validateSpatialConstructionIntent(source);
 if(!verdict.ok||source.revision!==revision||source.source.revision!==revision)
  throw new TypeError('invalid or stale 3D spatial ConstructionIntent');
 if(!Array.isArray(preview.steps)||!preview.steps.length||
    !preview.timing||!preview.player?.canRender(revision))
  throw new RangeError('missing single V5 steps or player');
 const ids=new Set(),seen=new Set();
 for(const step of preview.steps){
  if(ids.has(step.id)||step.sourceSpatialIntentId!==source.id||
     step.sourceRevision!==revision||
     !Array.isArray(step.actions)||!step.actions.length)
   throw new RangeError('invalid spatial ConstructionStep provenance');
  for(const dependency of step.dependsOn||[])
   if(!ids.has(dependency))throw new RangeError('unresolved spatial DAG dependency');
  ids.add(step.id);
  for(const a of step.actions){
   if(a.sourceRevision!==undefined&&a.sourceRevision!==revision)
    throw new RangeError('stale V5 source revision');
   if(a.sourceSpatialIntentId!==undefined&&a.sourceSpatialIntentId!==source.id)
    throw new RangeError('different spatial source in V5 action');
   if(a.sourceBoundary!=='analytic-cone-lateral')continue;
   const match=/^cone_([VHW])_lateral_(\\d+)$/.exec(a.id);
   if(!match)throw new RangeError('unidentified cone lateral V5 action');
   const view=match[1],i=Number(match[2]);
   const points=preview.viewPositions?.[view];
   if(!points||i<1||i>=points.length||a.kind!=='line')
    throw new RangeError('missing 3D-to-2D source segment');
   const dist=(x,y)=>Math.hypot(x.x-y.x,x.y-y.y);
   if(dist(a.geometry.from,points[i-1])>1e-6||
      dist(a.geometry.to,points[i])>1e-6)
    throw new RangeError('V5 segment differs from source 3D projection');
   seen.add(view);
  }
 }
 if(seen.size!==3)throw new RangeError('incomplete V/H/W cone construction');
 const expected=Timeline.compileTimeline(preview.steps,{
  durations:{line:65},gapMs:120
 });
 if(!same(preview.timing,expected))
  throw new RangeError('cone timeline differs from single V5 ConstructionStep DAG');
 return true;
}

module.exports={assertM3ToV5Consistency,assertConeM3ToV5Consistency};
