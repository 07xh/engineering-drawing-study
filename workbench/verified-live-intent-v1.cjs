'use strict';
/**
 * DraftAI 07 F2 public workbench gate. A canonical Intent is required for
 * each drawable 02/03 proof. Preserve existing UI-only evidence fields;
 * only canonical output may supply active V5 steps/timing.
 * No separate solver, no separate V5 player and no caller supplied proof.
 */
const {filletTimeline,pointTimeline}=require('./verified-plan-v5-bridge.cjs');
const {verifiedConstructionIntentV1}=require('./verified-construction-intent-v1.cjs');
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
function verifiedLiveIntentTimeline(kind,input,sheet,revision=0){
 const projection=kind==='point-projection';
 const previous=projection?pointTimeline(input,revision):
  filletTimeline(kind,input,sheet,revision);
 const canonical=verifiedConstructionIntentV1(kind,input,sheet,revision);
 if(previous.status!=='ready'){
  if(canonical.status==='ready')
   throw new RangeError('canonical/legacy readiness disagreement');
  return previous; // no previously unverified case gains a drawable timeline
 }
 if(canonical.status!=='ready'||canonical.mathematicallyVerified!==true||
    canonical.revision!==revision||
    canonical.selectedBranchId!==(previous.selectedBranchId??null)||
    !same(canonical.steps,previous.steps)||!same(canonical.timing,previous.timing))
  throw new RangeError('canonical intent proof or V5 parity unavailable');
 // Keep solver-derived metadata used by the existing UI annotations.
 // Only canonical steps/timing drive the public V5 animation.
 return Object.freeze({...previous,steps:canonical.steps,timing:canonical.timing,
  constructionIntentSchema:canonical.schema,
  constructionIntents:canonical.intents,
  canonicalVerified:true});
}
module.exports={verifiedLiveIntentTimeline};
