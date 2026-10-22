'use strict';
/**
 * DraftAI 04: derive paper-drafting stations from the independently verified
 * analytic cylinder lateral-section proof. These are model-mm construction
 * facts (special points + corresponding generators + V/H/W coordinates),
 * NOT user-source OCR, paper pixels, a rendered V5 timeline or cap contours.
 */
const {intersectCylinderSidePlane,normalizePlane}=
 require('./axis-cylinder-plane.cjs');
const TAU=2*Math.PI,finite=n=>typeof n==='number'&&Number.isFinite(n);
const normAngle=t=>((t%TAU)+TAU)%TAU;
const angularDelta=(a,b)=>Math.min(Math.abs(a-b),TAU-Math.abs(a-b));
const pt=p=>({x:p.x,y:p.y,z:p.z});
function project(p){
 return {V:{u:p.x,v:p.z},H:{u:p.x,v:p.y},W:{u:p.y,v:p.z}};
}
const sub=(a,b)=>({x:a.x-b.x,y:a.y-b.y,z:a.z-b.z});
const dot=(a,b)=>a.x*b.x+a.y*b.y+a.z*b.z;
function cylinderSectionStations(cylinder,plane,{ordinaryDivisions=8}={}){
 if(!Number.isSafeInteger(ordinaryDivisions)||ordinaryDivisions<4||
    ordinaryDivisions>32||ordinaryDivisions%4!==0)
  throw new RangeError('ordinaryDivisions must be 4..32 and divisible by four');
 // Recompute the trusted analytic section, never consume a preverified DTO.
 const result=intersectCylinderSidePlane(cylinder,plane,{samples:32});
 if(result.status!=='ready'||result.verified!==true||
    result.analyticCurveVerified!==true||!result.closedCurve)
  return {status:'blocked',sourceStatus:result.status,stations:[],
    modelGeometryVerified:false,constructionStepsReady:false,
    reason:result.reason||'no complete analytic ellipse/circle on finite lateral surface',
    globallyUnique:null};
 const pl=normalizePlane(plane),curve=result.analytic;
 const base=cylinder.baseCenter,r=cylinder.radiusMm,top=base.z+cylinder.heightMm;
 const tolerance=1e-8*Math.max(1,r,cylinder.heightMm);
 const angles=[];
 const add=(t,label)=>{
  const theta=normAngle(t);
  const found=angles.find(s=>angularDelta(s.theta,theta)<1e-9);
  if(found){if(!found.labels.includes(label))found.labels.push(label);}
  else angles.push({theta,labels:[label]});
 };
 for(let i=0;i<ordinaryDivisions;i++){
  const theta=i*TAU/ordinaryDivisions;
  add(theta,i% (ordinaryDivisions/4)===0?'quadrant':'ordinary');
 }
 const verticalSwing=Math.hypot(curve.cosine.z,curve.sine.z);
 if(verticalSwing>tolerance*1e-4){
  const maximum=normAngle(Math.atan2(curve.sine.z,curve.cosine.z));
  add(maximum,'maximum-height');
  add(maximum+Math.PI,'minimum-height');
 }
 angles.sort((a,b)=>a.theta-b.theta);
 const stations=[];
 let maxResidualMm=0;
 for(const [index,s] of angles.entries()){
  const co=Math.cos(s.theta),si=Math.sin(s.theta);
  const q={x:curve.center.x+curve.cosine.x*co+curve.sine.x*si,
   y:curve.center.y+curve.cosine.y*co+curve.sine.y*si,
   z:curve.center.z+curve.cosine.z*co+curve.sine.z*si};
  const planeResidual=Math.abs(dot(pl.normal,sub(q,pl.point)));
  const sideResidual=Math.abs(Math.hypot(q.x-base.x,q.y-base.y)-r);
  const capResidual=Math.max(0,base.z-q.z,q.z-top);
  const residual=Math.max(planeResidual,sideResidual,capResidual);
  if(!finite(residual)||residual>tolerance*4)
   return {status:'blocked',sourceStatus:'undetermined',stations:[],
    modelGeometryVerified:false,constructionStepsReady:false,
    reason:'special-point mathematical residual not verified',
    globallyUnique:null};
  maxResidualMm=Math.max(maxResidualMm,residual);
  const origin={x:q.x,y:q.y,z:base.z},end={x:q.x,y:q.y,z:top};
  stations.push({
   id:'section-point-'+(index+1),thetaRadians:s.theta,
   labels:[...s.labels],intersectionMm:pt(q),
   auxiliaryGeneratorMm:{a:origin,b:end},
   projectedPoint:project(q),
   projectedGenerator:{a:project(origin),b:project(end)},
   planeResidualMm:planeResidual,sideResidualMm:sideResidual,
   capResidualMm:capResidual
  });
 }
 // Result contains only mathematical construction facts. V5 frame and step DAG
 // need separate 03/07 schema review and cannot be inferred from these alone.
 return {status:'ready',sourceStatus:'ready',stations,
  extremaPresent:verticalSwing>tolerance*1e-4,
  maxResidualMm,modelGeometryVerified:true,
  constructionStepsReady:false,modelUnit:'mm',
  projectionMode:'coordinate-VHW-only',
  supportedCurveKind:result.curveKind,
  sectionZRange:curve.zRange,
  globallyUnique:null,
  proofScope:'analytic finite Z-axis cylinder lateral section; no visibility, cap faces or V5 step proof'};
}
module.exports={cylinderSectionStations};
