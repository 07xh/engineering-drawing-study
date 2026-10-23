'use strict';
/**
 * Certified topology -> canonical ConstructionStep evidence.
 * The canonical action contract has no ellipse/conic primitive: never
 * replace an exact analytic curve with a supposedly exact polyline.
 */
const {coneBoundaryVisibilityComposition}=require('./cone-boundary-visibility-composition.cjs');
const {validateConstructionStep}=require('../core/contracts/construction-step.js');
const {project,toSheet}=require('../core/projection/conventions.js');
function coneContourConstructionEvidence(cone,plane,options={}){
 const boundary=coneBoundaryVisibilityComposition(cone,plane,options);
 if(boundary.status!=='verified-boundary-composition')
  return {status:'not-verified',reason:boundary.reason,steps:[],boundary};
 const transforms=options.viewTransforms;
 const steps=[],curveEvidence=[];
 for(const view of ['V','H','W']){
  const transform=transforms?.[view]||options.sheetTransform;
  for(const segment of boundary.views[view]){
   if(segment.kind==='analytic-lateral-arc'){
    curveEvidence.push({id:segment.id,view,kind:segment.kind,
     parameterRadians:[...segment.parameterRadians],
     visibility:segment.visibility,proof:'analytic-not-polyline',
     constructionStepId:null});
    continue;
   }
   if(segment.kind!=='cap-chord')throw new TypeError('unexpected contour segment');
   const a=toSheet(view,segment.start,transform);
   const b=toSheet(view,segment.end,transform);
   const actions=Math.hypot(a.x-b.x,a.y-b.y)>1e-9
    ?[{kind:'line',style:'result',geometry:{x1:a.x,y1:a.y,x2:b.x,y2:b.y}}]
    :[{kind:'point',style:'mark',geometry:{x:a.x,y:a.y},label:'cap-endpoint'}];
   const step={id:'cone_cap_chord_'+view,dependsOn:[],
    explanation:'截平面与圆锥底面圆盘的交线；遮挡状态尚未证明。',
    reason:'independently-verified-oriented-cap-chord',
    solveResultRef:'cone_section_'+boundary.revision,actions};
   const check=validateConstructionStep(step);
   if(!check.ok)throw new TypeError(check.errors.join('; '));
   steps.push({...step,visibility:'undetermined'});
  }
 }
 return {status:'verified-contour-construction-evidence',revision:boundary.revision,
  spatialIntent:boundary.spatialIntent,steps,curveEvidence,
  exactLateralCurvesPreserved:true,capChordGeometryVerified:true,
  capChordVisibilityVerified:false,continuousContourV5Ready:false,
  completeSolidVisibilityVerified:false,publicWorkbenchConnected:false};
}
module.exports={coneContourConstructionEvidence};
