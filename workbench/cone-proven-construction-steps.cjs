'use strict';
/**
 * Conservative mathematical step DAG for reviewed finite cone sections.
 * Each generator is an exact apex-to-lateral-point segment on the original
 * cone; transfer points are independently projected from the same XYZ.
 * Sampled lateral chords remain presentation-only, never exact conics.
 */
const {verifiedConeSpatialIntent}=require('./verified-cone-spatial-intent.cjs');
const {validateConstructionStep}=require('../core/contracts/construction-step.js');
const {project,toSheet}=require('../core/projection/conventions.js');
const finite=n=>typeof n==='number'&&Number.isFinite(n);
function coneProvenConstructionSteps(cone,plane,options={}){
 const source=verifiedConeSpatialIntent(cone,plane,options);
 if(source.status!=='ready')return {status:'not-verified',reason:source.reason,steps:[],source};
 const g=source.spatialIntent.operation,sheet=options.sheetTransform;
 const apex={x:cone.baseCenter.x,y:cone.baseCenter.y,z:cone.baseCenter.z+cone.heightMm};
 const indices=[0,Math.floor((g.samplePoints.length-1)/4),
  Math.floor((g.samplePoints.length-1)/2),
  Math.floor(3*(g.samplePoints.length-1)/4)];
 const steps=[],proof=[];
 for(const [j,i] of [...new Set(indices)].entries()){
  const q=g.samplePoints[i],radial=Math.hypot(q.x-apex.x,q.y-apex.y);
  const expected=cone.radiusMm*(apex.z-q.z)/cone.heightMm;
  const residual=Math.abs(radial-expected);
  const planeResidual=Math.abs((q.x-plane.point.x)*plane.normal.x+
   (q.y-plane.point.y)*plane.normal.y+(q.z-plane.point.z)*plane.normal.z)/
   Math.hypot(plane.normal.x,plane.normal.y,plane.normal.z);
  const tolerance=1e-7*Math.max(1,cone.radiusMm,cone.heightMm);
  if(!finite(residual)||!finite(planeResidual)||
    residual>tolerance||planeResidual>tolerance)
   throw new RangeError('unproven cone generator intersection');
  for(const view of ['V','H','W']){
   const a=toSheet(view,project(apex)[view],sheet);
   const b=toSheet(view,project(q)[view],sheet);
   if(![a.x,a.y,b.x,b.y].every(finite))throw new RangeError('nonfinite sheet transfer');
   const prior=steps.at(-1);
   const actions=[];
   // A generator may collapse to a point in one projection. Never fake a line.
   if(Math.hypot(a.x-b.x,a.y-b.y)>1e-9)
    actions.push({kind:'line',style:'auxiliary',
     geometry:{x1:a.x,y1:a.y,x2:b.x,y2:b.y}});
   actions.push({kind:'point',style:'mark',label:'P'+(j+1)+'-'+view,
    geometry:{x:b.x,y:b.y}});
   const step={id:'cone_generator_'+j+'_'+view,
    explanation:'由圆锥母线与截平面求得空间交点 P'+(j+1)+
     '，再按第一角投影映射到 '+view+' 面；不推断遮挡。',
    dependsOn:prior?[prior.id]:[],actions,
    reason:'analytic-cone-plane-intersection-and-verified-first-angle-transfer',
    solveResultRef:'cone_section_'+source.revision};
   const check=validateConstructionStep(step);
   if(!check.ok)throw new TypeError('invalid canonical step: '+check.errors.join('; '));
   steps.push(step);
  }
  proof.push({pointIndex:i,generatorResidualMm:residual,planeResidualMm:planeResidual});
 }
 return {status:'verified-guide-steps',revision:source.revision,
  spatialIntent:source.spatialIntent,steps,proof,
  mathematicallyVerified:true,visibilityVerified:false,
  fullContourConstructionVerified:false,publicWorkbenchConnected:false};
}
module.exports={coneProvenConstructionSteps};
