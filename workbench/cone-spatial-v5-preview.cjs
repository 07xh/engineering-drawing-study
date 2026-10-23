'use strict';
/**
 * Cone M3 -> independently verified spatial Intent -> V/H/W presentation
 * segments -> the existing V5 Timeline. No invented 3D visibility or
 * claim that sampled chords are exact analytic construction steps.
 */
const {verifiedConeSpatialIntent}=require('./verified-cone-spatial-intent.cjs');
const Timeline=require('./teaching-timeline-v5.js');
const Motion=require('./teaching-motion-v5.js');
function coneSpatialV5Preview(cone,plane,options={}){
 const result=verifiedConeSpatialIntent(cone,plane,options);
 if(result.status!=='ready')return {...result,steps:[],timing:null,player:null};
 if(!result.mathematicallyVerified||!result.firstAngleCoordinateMappingVerified||
    result.v5StepsReady!==false||result.firstAngleLayoutVerified!==false)
  throw new RangeError('spatial source proof scope mismatch');
 const revision=result.revision,steps=[];
 for(const view of ['V','H','W']){
  const points=result.sheetViews[view];
  if(!Array.isArray(points)||points.length<2)throw new TypeError('missing verified projection');
  const actions=[];
  for(let i=1;i<points.length;i++){
   const from=points[i-1],to=points[i];
   if(![from.x,from.y,to.x,to.y].every(Number.isFinite))
    throw new TypeError('nonfinite projected segment');
   if(Math.hypot(from.x-to.x,from.y-to.y)<1e-9)continue;
   const action={id:'cone_'+view+'_lateral_'+i,kind:'line',geometry:{from,to}};
   Motion.actionShapeAttrs(action,1);
   actions.push(action);
  }
  if(result.spatialIntent.operation.geometryKind==='clipped-ellipse'){
   const {capChord}=result.spatialIntent.operation;
   const {project,toSheet}=require('../core/projection/conventions.js');
   const sheet=options.sheetTransform;
   const from=toSheet(view,project(capChord.start)[view],sheet);
   const to=toSheet(view,project(capChord.end)[view],sheet);
   if(Math.hypot(from.x-to.x,from.y-to.y)>=1e-9){
    const action={id:'cone_'+view+'_cap_chord',kind:'line',geometry:{from,to}};
    Motion.actionShapeAttrs(action,1);actions.push(action);
   }
  }
  if(!actions.length)throw new RangeError('projection has no drawable segments');
  steps.push({id:'cone_'+view,dependsOn:steps.length?[steps.at(-1).id]:[],
   title:view+' view: sampled analytic cone section (visibility unverified)',actions});
 }
 const timing=Timeline.compileTimeline(steps,{durations:{line:65},gapMs:120});
 return {status:'preview-only',revision,spatialIntent:result.spatialIntent,
  mathematicallyVerified:true,firstAngleCoordinateMappingVerified:true,
  firstAngleLayoutVerified:false,visibilityVerified:false,
  constructionStepsReady:false,publicWorkbenchConnected:false,
  steps,timing,player:Timeline.createPlayer(timing,{revision}),
  presentationKind:'sampled-projection-polyline-not-exact-compass-construction'};
}
module.exports={coneSpatialV5Preview};
