'use strict';
/**
 * P3: user-confirmed two-point workbook input gate.
 * Does not OCR, invent a proof, or consult the answer key.
 * Keeps the existing single-point solver and canonical V5 player.
 */
const {verifiedLiveIntentTimeline}=require('./verified-live-intent-v1.cjs');
const TimelineV5=require('./teaching-timeline-v5.js');

function compileConfirmedTwoPoint(input){
  if(!input||!input.sheetTransform||!input.sheetTransform.origin||!['x','y'].every(k=>Number.isFinite(input.sheetTransform.origin[k]))||!Number.isFinite(input.sheetTransform.scale)||input.sheetTransform.scale<=0||input.confirmedBy!=='user'||!Number.isSafeInteger(input.revision)||input.revision<1||
    input.unit!=='mm'||!Array.isArray(input.points)||input.points.length!==2)
    throw new TypeError('two-point exercise requires explicit user confirmation and mm units');
  const ids=new Set();
  const results=input.points.map((p,index)=>{
    if(!p||typeof p.id!=='string'||!/^[AB]$/.test(p.id)||ids.has(p.id))
      throw new TypeError('two distinct labeled finite spatial points required');
    ids.add(p.id);
    let given;
    if(Object.hasOwn(p,'knownViews')){
      if(Object.keys(p).some(k=>!['id','knownViews'].includes(k)))
        throw new TypeError('known view pair cannot mix with guessed spatial XYZ');
      const views=p.knownViews;
      if(!views||typeof views!=='object'||Array.isArray(views)||
         Object.keys(views).length!==2||
         Object.keys(views).some(v=>!['V','H','W'].includes(v))||
         Object.values(views).some(uv=>!Array.isArray(uv)||uv.length!==2||
           uv.some(n=>typeof n!=='number'||!Number.isFinite(n)||Math.abs(n)>100000)))
        throw new TypeError('exactly two finite reviewed first-angle mm projections required');
      given={knownViews:Object.fromEntries(
        Object.entries(views).map(([v,uv])=>[v,[...uv]])),sheetTransform:input.sheetTransform};
    }else{
      if(Object.keys(p).some(k=>!['id','x','y','z'].includes(k))||
         !['x','y','z'].every(k=>typeof p[k]==='number'&&
           Number.isFinite(p[k])&&Math.abs(p[k])<=100000))
        throw new TypeError('two distinct labeled finite spatial points required');
      given={knownPoint:{x:p.x,y:p.y,z:p.z},sheetTransform:input.sheetTransform};
    }
    const result=verifiedLiveIntentTimeline('point-projection',given,null,input.revision);
    if(result.status!=='ready'||result.canonicalVerified!==true||result.revision!==input.revision)
      throw new RangeError('point has no canonical verified V5 timeline');
    return {id:p.id,result,index};
  });
  if(!ids.has('A')||!ids.has('B'))throw new TypeError('A and B both required');
  // Separate canonical DAGs: never pretend that their union is one proof.
  const steps=results.flatMap(({id,result})=>result.steps.map((step,i)=>({
    ...step,id:id+'-'+step.id,
    dependsOn:Array.isArray(step.dependsOn)?step.dependsOn.map(dep=>id+'-'+dep):undefined,
    actions:step.actions.map((a,j)=>({...a,id:id+'-'+a.id}))
  })));
  const actionIds=steps.flatMap(s=>s.actions.map(a=>a.id));
  if(new Set(actionIds).size!==actionIds.length)throw new RangeError('duplicate V5 action IDs');
  const timeline=TimelineV5.compileTimeline(steps);
  const player=TimelineV5.createPlayer(timeline,{revision:input.revision});
  return Object.freeze({revision:input.revision,confirmed:true,points:results,steps,
    timeline,player,canonicalVerified:true});
}
module.exports={compileConfirmedTwoPoint};
