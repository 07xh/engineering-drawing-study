'use strict';
/**
 * Conservative interval bound for projected cone conic chord approximation.
 * Bound uses the second derivative of the rational parametric curve via
 * interval-safe finite upper bounds; does NOT certify mathematical exactness.
 */
const {coneBoundaryVisibilityComposition}=require('./cone-boundary-visibility-composition.cjs');
const {project,toSheet}=require('../core/projection/conventions.js');
function coneCertifiedDisplaySegments(cone,plane,options={}){
 const source=coneBoundaryVisibilityComposition(cone,plane,options);
 if(source.status!=='verified-boundary-composition')
  return {status:'not-verified',reason:source.reason,views:null};
 const a=source.spatialIntent.operation.analytic;
 const D=a.denominator,N=a.numeratorMm;
 const A=Math.abs(D.constant)-Math.hypot(D.cosCoeff,D.sinCoeff);
 const B=Math.hypot(D.cosCoeff,D.sinCoeff);
 const scale=Math.max(...['V','H','W'].map(v=>
  (options.viewTransforms?.[v]||options.sheetTransform)?.scale||0));
 const maxErrorPx=options.maxErrorPx??0.5;
 if(!Number.isFinite(maxErrorPx)||maxErrorPx<=0||maxErrorPx>5)
  throw new RangeError('positive display tolerance <=5px required');
 if(!Number.isFinite(A)||A<=0||!Number.isFinite(scale)||scale<=0)
  return {status:'not-verified',reason:'analytic denominator bound unavailable',views:null};
 // rho=N/D. |rho| <= |N|/A, |rho'| <= |N| B/A²,
 // |rho''| <= |N|(B/A²+2B²/A³).
 const R=Math.abs(N)/A,P=Math.abs(N)*B/(A*A);
 const Q=Math.abs(N)*(B/(A*A)+2*B*B/(A*A*A));
 // q=(rho cos t,rho sin t, apexZ-h*rho/r).
 // Each orthographic projection has derivative norm bounded by the
 // full 3D second derivative: |q''| <= Q*sqrt(1+(h/r)^2)+2P+R.
 const curvatureBound=scale*(Q*Math.hypot(1,cone.heightMm/cone.radiusMm)+2*P+R);
 const step=Math.min(Math.PI/18,Math.sqrt(8*maxErrorPx/Math.max(curvatureBound,1e-20)));
 if(!Number.isFinite(step)||step<=0)
  return {status:'not-verified',reason:'display resolution unavailable',views:null};
 const evaluate=t=>{
  const rho=N/(D.constant+D.cosCoeff*Math.cos(t)+D.sinCoeff*Math.sin(t));
  return {x:a.apex.x+rho*Math.cos(t),y:a.apex.y+rho*Math.sin(t),
   z:a.apex.z-cone.heightMm*rho/cone.radiusMm};
 };
 const views={};
 for(const view of ['V','H','W']){
  const transform=options.viewTransforms?.[view]||options.sheetTransform;
  views[view]=source.views[view].filter(s=>s.kind==='analytic-lateral-arc').map(s=>{
   const [lo,hi]=s.parameterRadians;
   const count=Math.max(1,Math.ceil((hi-lo)/step));
   if(count>10000)throw new RangeError('curve too complex for certified display');
   const delta=(hi-lo)/count;
   const points=Array.from({length:count+1},(_,i)=>
    toSheet(view,project(evaluate(lo+delta*i))[view],transform));
   const boundPx=curvatureBound*delta*delta/8;
   return {id:s.id,visibility:s.visibility,
    svgPath:points.map((p,i)=>(i?'L ':'M ')+p.x+' '+p.y).join(' '),
    parameterRadians:[lo,hi],maxChordDeviationPx:boundPx,
    errorBoundMethod:'analytic-second-derivative-supremum',
    visualPolylineOnly:true,exactAnalyticCurve:a};
  });
 }
 return {status:'bounded-display-approximation',revision:source.revision,
  views,maxErrorPx,secondDerivativeBoundPx:curvatureBound,mathematicallyExactPolyline:false,
  exactAnalyticCurvePreserved:true,capChordVisibilityVerified:false,
  fullContourV5Ready:false,publicWorkbenchConnected:false};
}
module.exports={coneCertifiedDisplaySegments};
