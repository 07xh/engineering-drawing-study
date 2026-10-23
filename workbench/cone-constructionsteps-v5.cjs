'use strict';
/**
 * Single-V5 bridge: proven M3 cone generator and V/H/W transfer
 * ConstructionSteps -> existing 07 adapter -> existing timeline/player.
 * It is NOT a full cone contour proof or hidden-line visibility solution.
 */
const {coneProvenConstructionSteps}=require('./cone-proven-construction-steps.cjs');
const {constructionStepsToV5}=require('./construction-step-v5-adapter.cjs');
const Timeline=require('./teaching-timeline-v5.js');
function coneConstructionStepsV5(cone,plane,options={}){
 const proof=coneProvenConstructionSteps(cone,plane,options);
 if(proof.status!=='verified-guide-steps')
  return {status:'not-verified',revision:proof.source?.revision??options.revision??0,
   reason:proof.reason,steps:[],timing:null,player:null,
   mathematicallyVerified:false,visibilityVerified:false};
 const {steps,timing}=constructionStepsToV5({
  steps:proof.steps,frame:'model-mm-2d',unit:'mm',
  // The 3D-to-sheet projection has already happened upstream. Identity
  // transform prevents a second scale/axis flip in the 2D adapter.
  sheet:{origin:{x:0,y:0},scale:1},revision:proof.revision
 });
 return {status:'verified-guides-preview',revision:proof.revision,
  spatialIntent:proof.spatialIntent,proof:proof.proof,
  steps,timing,player:Timeline.createPlayer(timing,{revision:proof.revision}),
  mathematicallyVerified:true,visibilityVerified:false,
  fullContourConstructionVerified:false,publicWorkbenchConnected:false,
  presentationOnly:true};
}
module.exports={coneConstructionStepsV5};
