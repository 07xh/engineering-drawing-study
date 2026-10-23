'use strict';
/**
 * #433 04 verified 3D cone -> canonical ConstructionStep (already sheet-px)
 * -> EXISTING 07 verifiedTeachingActionToV5 -> ONE V5 Timeline/player.
 *
 * IMPORTANT: M3 has already called projection.toSheet(V/H/W) for each action.
 * Passing those sheet pixels to constructionStepsToV5 with the "identity"
 * model-mm transform still negates Y. That silently mirrors every result!
 *
 * The existing trusted sheet-px action adapter consumes coordinates unchanged.
 * This is strictly a proven AUXILIARY guide preview, not a conic contour,
 * actual visible/hidden drawing, standard first-angle layout or photo result.
 */
const {coneProvenConstructionSteps}=require('./cone-proven-construction-steps.cjs');
const {verifiedTeachingActionToV5}=
 require('./construction-step-v5-adapter.cjs');
const Timeline=require('./teaching-timeline-v5.js');
const identitySheet={origin:{x:0,y:0},scale:1};
const finite=n=>typeof n==='number'&&Number.isFinite(n);
function convertProvenSheetStep(a,id){
 const g=a?.geometry;
 if(!g||!['line','point'].includes(a.kind))
  throw new TypeError('unsupported proven cone guide action');
 const source=a.kind==='line'?
  {id,kind:'line',coordinateSpace:'sheet-px',
   from:{x:g.x1,y:g.y1},to:{x:g.x2,y:g.y2}}:
  {id,kind:'point',coordinateSpace:'sheet-px',
   at:{x:g.x,y:g.y}};
 if(a.kind==='line'&&![g.x1,g.y1,g.x2,g.y2].every(finite))
  throw new RangeError('nonfinite source sheet line');
 if(a.kind==='point'&&![g.x,g.y].every(finite))
  throw new RangeError('nonfinite source sheet point');
 // Existing adapter, existing motion, and no implicit extra Y reversal.
 const converted=verifiedTeachingActionToV5(source,identitySheet);
 return Object.freeze({...converted,sourceStyle:a.style||null,
  sourceCoordinates:'verified-3d-to-sheet-px',sourceVisibility:'undetermined',
  sourceGuideOnly:true});
}
function coneConstructionStepsV5(cone,plane,options={}){
 const proof=coneProvenConstructionSteps(cone,plane,options);
 if(proof.status!=='verified-guide-steps')
  return {status:'not-verified',revision:proof.source?.revision??options.revision??0,
   reason:proof.reason,steps:[],timing:null,player:null,
   mathematicallyVerified:false,visibilityVerified:false};
 const known=new Map(),steps=[];
 for(const [index,s] of proof.steps.entries()){
  if(!Array.isArray(s.actions)||!Array.isArray(s.dependsOn))
   throw new TypeError('malformed certified cone ConstructionStep DAG');
  const id='v5_step_'+(index+1),deps=s.dependsOn.map(x=>{
   if(!known.has(x))throw new TypeError('missing or future proven guide dependency');
   return known.get(x);
  });
  if(known.has(s.id))throw new TypeError('duplicate certified source step');
  known.set(s.id,id);
  steps.push({id,sourceStepId:s.id,role:'guide',dependsOn:deps,
   title:s.explanation,explanation:s.explanation,reason:s.reason||null,
   solveResultRef:s.solveResultRef||null,
   actions:s.actions.map((a,j)=>convertProvenSheetStep(
    a,'v5_action_'+(index+1)+'_'+(j+1)))});
 }
 const timing=Timeline.compileTimeline(steps);
 return {status:'verified-guides-preview',revision:proof.revision,
  spatialIntent:proof.spatialIntent,proof:proof.proof,
  steps,timing,player:Timeline.createPlayer(timing,{revision:proof.revision}),
  mathematicallyVerified:true,sheetProjectionPreserved:true,
  visibilityVerified:false,fullContourConstructionVerified:false,
  firstAngleLayoutVerified:false,completeEngineeringDrawingVerified:false,
  publicWorkbenchConnected:false,presentationOnly:true};
}
module.exports={coneConstructionStepsV5};
