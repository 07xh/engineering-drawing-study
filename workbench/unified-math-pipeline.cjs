'use strict';
/**
 * The single production M3 -> M4 entry for currently trusted 02/03 families.
 * Reuses existing specialists, independent former-path parity, canonical
 * Intent and ONE V5. No new solver, result schema, geometry inference or
 * separate playback implementation is introduced.
 *
 * Extension rule: a new M3 specialist must recompute proof and emit a
 * canonical Intent; it cannot register raw client steps as a mathematical
 * answer. Source image review remains upstream of this API.
 */
const {filletTimeline,pointTimeline}=require('./verified-plan-v5-bridge.cjs');
const {verifiedConstructionIntentV1}=require('./verified-construction-intent-v1.cjs');
const {verifiedPolygonIntentTimeline}=require('./verified-polygon-intent-v1.cjs');
const {assertM3ToV5Consistency}=require('./m3-v5-consistency-gate.cjs');
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const FILLET_KINDS=new Set(['segments','circles','segment-circle']);
const DEFAULT_POINT_SHEET={origin:{x:360,y:175},scale:4};

function evaluateUnifiedMath({kind,input,sheet,revision=0}={}){
 if(!Number.isSafeInteger(revision)||revision<0)
  throw new TypeError('current input revision required');
 if(kind==='inscribed-polygon'){
  if(input?.revision!==revision)
   throw new RangeError('stale polygon input revision');
  const result=verifiedPolygonIntentTimeline(input,sheet);
  if(result.status!=='ready')return result;
  if(result.mathematicallyVerified!==true||
     result.canonicalVerified!==true||result.revision!==revision)
   throw new RangeError('polygon M3/Intent evidence not ready');
  assertM3ToV5Consistency({
   revision,intents:result.constructionIntents,
   steps:result.steps,timing:result.timing,sheet
  });
  return Object.freeze({...result,unifiedMathPipeline:'m3-canonical-intent-v5/1'});
 }
 if(kind!=='point-projection'&&!FILLET_KINDS.has(kind))
  throw new TypeError('unsupported M3 specialist kind');
 const projection=kind==='point-projection';
 const paper=projection?(input?.sheetTransform||DEFAULT_POINT_SHEET):sheet;
 // Both former and canonical paths recompute the REAL specialist.
 const previous=projection?pointTimeline(input,revision):
  filletTimeline(kind,input,sheet,revision);
 const canonical=verifiedConstructionIntentV1(kind,input,sheet,revision);
 if(previous.status!=='ready'){
  if(canonical.status==='ready')
   throw new RangeError('canonical/legacy readiness disagreement');
  return previous;
 }
 if(canonical.status!=='ready'||canonical.mathematicallyVerified!==true||
    canonical.revision!==revision||
    canonical.selectedBranchId!==(previous.selectedBranchId??null)||
    !same(canonical.steps,previous.steps)||!same(canonical.timing,previous.timing))
  throw new RangeError('canonical intent or original V5 parity unavailable');
 assertM3ToV5Consistency({
  revision,intents:canonical.intents,steps:canonical.steps,
  timing:canonical.timing,sheet:paper
 });
 return Object.freeze({...previous,steps:canonical.steps,timing:canonical.timing,
  constructionIntentSchema:canonical.schema,
  constructionIntents:canonical.intents,canonicalVerified:true,
  unifiedMathPipeline:'m3-canonical-intent-v5/1'});
}
module.exports={evaluateUnifiedMath};
