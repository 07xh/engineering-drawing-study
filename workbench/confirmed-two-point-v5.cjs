'use strict';
/**
 * P3: user-confirmed two-point workbook input gate.
 * Does not OCR, invent a proof, or consult the answer key.
 * Keeps the existing single-point solver and canonical V5 player.
 */
const {verifiedLiveIntentTimeline}=require('./verified-live-intent-v1.cjs');
const TimelineV5=require('./teaching-timeline-v5.js');

function compileConfirmedTwoPoint(input){
  if(!input||input.confirmedBy!=='user'||!Number.isSafeInteger(input.revision)||input.revision<1||
    input.unit!=='mm'||!Array.isArray(input.points)||input.points.length!==2)
    throw new TypeError('two-point exercise requires explicit user confirmation and mm units');
  const ids=new Set();
  const results=input.points.map((p,index)=>{
    if(!p||typeof p.id!=='string'||!/^[AB]$/.test(p.id)||ids.has(p.id)||
      !['x','y','z'].every(k=>typeof p[k]==='number'&&Number.isFinite(p[k])))
      throw new TypeError('two distinct labeled finite spatial points required');
    ids.add(p.id);
    const given={knownPoint:{x:p.x,y:p.y,z:p.z},sheetTransform:input.sheetTransform};
    const result=verifiedLiveIntentTimeline('point-projection',given,null,input.revision);
    if(result.status!=='ready'||result.canonicalVerified!==true||result.revision!==input.revision)
      throw new RangeError('point has no canonical verified V5 timeline');
    return {id:p.id,result,index};
  });
  if(!ids.has('A')||!ids.has('B'))throw new TypeError('A and B both required');
  // Separate canonical DAGs: never pretend that their union is one proof.
  const steps=results.flatMap(({id,result})=>result.steps.map((step,i)=>({
    ...step,id:id+':'+step.id,
    actions:step.actions.map((a,j)=>({...a,id:id+':'+a.id}))
  })));
  const actionIds=steps.flatMap(s=>s.actions.map(a=>a.id));
  if(new Set(actionIds).size!==actionIds.length)throw new RangeError('duplicate V5 action IDs');
  return Object.freeze({revision:input.revision,confirmed:true,points:results,steps,
    // Player integration must use existing V5 API; no alternative renderer.
    canonicalVerified:true});
}
module.exports={compileConfirmedTwoPoint};
