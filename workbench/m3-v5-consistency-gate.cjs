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
module.exports={assertM3ToV5Consistency};
