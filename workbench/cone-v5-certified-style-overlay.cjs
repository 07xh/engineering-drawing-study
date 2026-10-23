'use strict';
/**
 * Read-only style overlay for the ONE existing V5 player.
 * Never creates a timeline or upgrades a display polyline to exact geometry.
 */
const {coneSingleV5Composition}=require('./cone-single-v5-composition.cjs');
const {coneCertifiedDisplaySegments}=require('./cone-certified-display-segments.cjs');
const {coneVisibilityBoundaryCertification}=require('./cone-visibility-boundary-certification.cjs');
function coneV5CertifiedStyleOverlay(cone,plane,options={}){
 const base=coneSingleV5Composition(cone,plane,options);
 const display=coneCertifiedDisplaySegments(cone,plane,options);
 const proof=coneVisibilityBoundaryCertification(cone,plane,options);
 if(base.status!=='verified-single-v5-composition'||
    display.status!=='bounded-display-approximation'||
    proof.status!=='verified-open-lateral-interval-styles'||
    base.revision!==display.revision||base.revision!==proof.revision)
  return {status:'not-verified',reason:'V5 and analytic style evidence must share revision',views:null};
 const views={};
 for(const view of ['V','W']){
  const paths=display.views[view],certified=proof.intervals[view];
  if(paths.length!==certified.length)
   return {status:'not-verified',reason:'visibility interval count mismatch',views:null};
  views[view]=paths.map((path,i)=>{
   const interval=certified[i],bounds=path.parameterRadians;
   if(Math.abs(bounds[0]-interval.fromRadians)>1e-8||
      Math.abs(bounds[1]-interval.toRadians)>1e-8||
      path.visibility!==interval.visibility)
    return null;
   return {id:path.id,svgPath:path.svgPath,
    lineStyle:interval.lineStyle,visibility:interval.visibility,
    maxChordDeviationPx:path.maxChordDeviationPx,
    mathematicalEvidence:interval.proof,
    openIntervalOnly:true,endpointsVisibility:'undetermined',
    displayApproximationOnly:true};
  });
  if(views[view].some(x=>x===null))
   return {status:'not-verified',reason:'visibility interval evidence mismatch',views:null};
 }
 return {status:'certified-style-overlay-for-existing-v5',revision:base.revision,
  views,steps:base.steps,timing:base.timing,player:base.player,
  createsSecondPlayer:false,exactConicEvidencePreserved:true,
  overlayConnectedToPublicWorkbench:false,
  capChordVisibilityVerified:false,fullContourVisibilityVerified:false};
}
module.exports={coneV5CertifiedStyleOverlay};
