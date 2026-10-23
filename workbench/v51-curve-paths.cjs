'use strict';
// Presentation only: preserve every source action and never upgrade ray evidence.
function curvePaths(steps,frame){
 const paths=[];let current=null;
 for(const step of steps)for(const action of step.actions){
  const g=action.geometry;
  const isCurve=action.sourceBoundary==='analytic-cone-lateral'&&action.kind==='line';
  if(!isCurve){current=null;continue;}
  const fraction=frame.actionFractions[action.id]??0;
  if(fraction<=0){current=null;continue;}
  const key=[action.sourceSpatialIntentId,action.sourceRevision,action.visibility,
   action.visibilityProof,action.branchId,action.view||action.id.split('_')[1]].join(':');
  const end={x:g.from.x+(g.to.x-g.from.x)*fraction,y:g.from.y+(g.to.y-g.from.y)*fraction};
  if(action.breakBefore||!current||current.key!==key||current.end.x!==g.from.x||current.end.y!==g.from.y){
   current={id:action.id,key,sourceRevision:action.sourceRevision,actionIds:[],stepIds:[],parameterIntervals:[],d:'M '+g.from.x+' '+g.from.y,end:g.from};paths.push(current);
  }
  current.d+=' L '+end.x+' '+end.y;current.end=end;
  current.parameterIntervals.push(action.parameterRadians??null);current.actionIds.push(action.id);current.stepIds.push(step.id);
  // Source only certifies open rays; the displayed chord is still a preview.
  current.visibility='undetermined';
  if(fraction<1)current=null;
 }
 return paths;
}
module.exports={curvePaths};
