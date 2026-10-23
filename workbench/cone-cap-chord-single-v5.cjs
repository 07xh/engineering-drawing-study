'use strict';
/** Verified cap-chord ConstructionStep -> existing sheet-px adapter -> ONE V5. */
const {coneContourConstructionEvidence}=require('./cone-contour-construction-evidence.cjs');
const {verifiedTeachingActionToV5}=require('./construction-step-v5-adapter.cjs');
const Timeline=require('./teaching-timeline-v5.js');
const sheetIdentity={origin:{x:0,y:0},scale:1};
function coneCapChordSingleV5(cone,plane,options={}){
 const proof=coneContourConstructionEvidence(cone,plane,options);
 if(proof.status!=='verified-contour-construction-evidence')
  return {status:'not-verified',reason:proof.reason,steps:[],timing:null,player:null};
 const steps=proof.steps.map((s,i)=>({
  id:'v5_step_'+(i+1),sourceStepId:s.id,
  title:s.explanation,explanation:s.explanation,
  reason:s.reason,solveResultRef:s.solveResultRef,
  dependsOn:[],role:'cap-chord-visibility-undetermined',
  actions:s.actions.map((a,j)=>{
   const g=a.geometry;
   const source=a.kind==='line'?
    {id:'v5_action_'+(i+1)+'_'+(j+1),kind:'line',
     coordinateSpace:'sheet-px',from:{x:g.x1,y:g.y1},to:{x:g.x2,y:g.y2}}:
    {id:'v5_action_'+(i+1)+'_'+(j+1),kind:'point',
     coordinateSpace:'sheet-px',at:{x:g.x,y:g.y}};
   return Object.freeze({...verifiedTeachingActionToV5(source,sheetIdentity),
    sourceVisibility:'undetermined',sourceCoordinates:'verified-first-angle-sheet-px'});
  })
 }));
 const timing=Timeline.compileTimeline(steps);
 return {status:'cap-chord-v5-preview',revision:proof.revision,
  steps,timing,player:Timeline.createPlayer(timing,{revision:proof.revision}),
  curveEvidence:proof.curveEvidence,
  capChordGeometryVerified:true,capChordVisibilityVerified:false,
  analyticCurveV5Ready:false,completeContourV5Ready:false,
  completeSolidVisibilityVerified:false,publicWorkbenchConnected:false};
}
module.exports={coneCapChordSingleV5};
