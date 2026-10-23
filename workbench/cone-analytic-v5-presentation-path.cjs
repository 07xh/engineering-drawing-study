'use strict';
/**
 * Exact mathematical conic remains a rational trigonometric curve.
 * This SVG path is explicitly a bounded-error VISUAL approximation,
 * never a canonical ConstructionStep or analytic proof.
 */
const {coneSingleV5Composition}=require('./cone-single-v5-composition.cjs');
const {project,toSheet}=require('../core/projection/conventions.js');
function coneAnalyticV5Presentation(cone,plane,options={}){
 const base=coneSingleV5Composition(cone,plane,options);
 if(base.status!=='verified-single-v5-composition')
  return {status:'not-verified',reason:base.reason,views:null};
 const analytic=base.curveEvidence;
 const op=coneSingleV5Composition; // only existing single player; no second timeline
 const {coneBoundaryVisibilityComposition}=require('./cone-boundary-visibility-composition.cjs');
 const boundary=coneBoundaryVisibilityComposition(cone,plane,options);
 if(boundary.status!=='verified-boundary-composition'||boundary.revision!==base.revision)
  return {status:'not-verified',reason:'analytic evidence revision mismatch',views:null};
 const a=boundary.spatialIntent.operation.analytic;
 const views={};
 const maxStep=options.maxAngularStepRadians??Math.PI/180;
 if(!Number.isFinite(maxStep)||maxStep<=0||maxStep>Math.PI/18)
  throw new RangeError('angular presentation step must be in (0, pi/18]');
 const apex=a.apex;
 const evaluate=t=>{
  const denominator=a.denominator.constant+a.denominator.cosCoeff*Math.cos(t)+
   a.denominator.sinCoeff*Math.sin(t);
  const rho=a.numeratorMm/denominator;
  return {x:apex.x+rho*Math.cos(t),y:apex.y+rho*Math.sin(t),
   z:apex.z-cone.heightMm*rho/cone.radiusMm};
 };
 for(const view of ['V','H','W']){
  const transform=options.viewTransforms?.[view]||options.sheetTransform;
  views[view]=boundary.views[view].filter(s=>s.kind==='analytic-lateral-arc').map(s=>{
   const [start,end]=s.parameterRadians;
   const count=Math.max(1,Math.ceil((end-start)/maxStep));
   if(count>10000)throw new RangeError('visualization complexity bound exceeded');
   const coords=Array.from({length:count+1},(_,i)=>
    toSheet(view,project(evaluate(start+(end-start)*i/count))[view],transform));
   if(coords.some(p=>!Number.isFinite(p.x)||!Number.isFinite(p.y)))
    throw new RangeError('nonfinite conic presentation');
   return {id:s.id,visibility:s.visibility,parameterRadians:[start,end],
    svgPath:coords.map((p,i)=>(i?'L ':'M ')+p.x+' '+p.y).join(' '),
    exactMathematicalRepresentation:a,
    presentationApproximationOnly:true,
    certifiedPixelErrorBound:false};
  });
 }
 return {status:'analytic-evidence-with-v5-presentation-path',revision:base.revision,
  views,steps:base.steps,timing:base.timing,player:base.player,
  exactConicEvidencePreserved:true,visualPathIsExact:false,
  certifiedPixelErrorBound:false,fullContourV5Ready:false,
  completeSolidVisibilityVerified:false,publicWorkbenchConnected:false};
}
module.exports={coneAnalyticV5Presentation};
