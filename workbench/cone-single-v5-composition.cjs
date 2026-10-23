'use strict';
/**
 * One deterministic V5 timeline for independently verified cone generator
 * guides and cap-chord steps. Exact conic evidence remains separate.
 */
const {coneConstructionStepsV5}=require('./cone-constructionsteps-v5.cjs');
const {coneCapChordSingleV5}=require('./cone-cap-chord-single-v5.cjs');
const Timeline=require('./teaching-timeline-v5.js');
function coneSingleV5Composition(cone,plane,options={}){
 const guides=coneConstructionStepsV5(cone,plane,options);
 const cap=coneCapChordSingleV5(cone,plane,options);
 if(guides.status!=='verified-guides-preview'||cap.status!=='cap-chord-v5-preview'||
    guides.revision!==cap.revision)
  return {status:'not-verified',steps:[],timing:null,player:null,
   reason:'both reviewed geometry sources must be valid at same revision'};
 const steps=[],known=new Map();
 for(const [origin,batch] of [['guide',guides.steps],['cap',cap.steps]]){
  for(const step of batch){
   const id='v5_step_'+(steps.length+1);
   const deps=step.dependsOn.map(d=>{
    const translated=known.get(origin+':'+d);
    if(!translated)throw new TypeError('unresolved source DAG dependency');
    return translated;
   });
   const actions=step.actions.map((a,i)=>({
    ...a,id:'v5_action_'+(steps.length+1)+'_'+(i+1)}));
   known.set(origin+':'+step.id,id);
   steps.push({...step,id,actions,dependsOn:deps,
    sourceGroup:origin,sourceStepId:step.sourceStepId});
  }
 }
 const timing=Timeline.compileTimeline(steps);
 return {status:'verified-single-v5-composition',revision:guides.revision,
  steps,timing,player:Timeline.createPlayer(timing,{revision:guides.revision}),
  curveEvidence:cap.curveEvidence,
  guideGeometryVerified:true,capChordGeometryVerified:true,
  capChordVisibilityVerified:false,exactConicV5Ready:false,
  fullContourV5Ready:false,completeSolidVisibilityVerified:false,
  publicWorkbenchConnected:false};
}
module.exports={coneSingleV5Composition};
