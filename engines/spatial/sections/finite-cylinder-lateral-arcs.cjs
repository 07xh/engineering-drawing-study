'use strict';
/**
 * 04 independent analytic clipping of a Z-axis finite cylinder LATERAL side
 * against a plane. Unlike a full solid section, no cap-face segments, section
 * region, hidden-line decisions, or engineering-sheet construction is claimed.
 */
const {intersectCylinderSidePlane,normalizePlane}=
 require('./axis-cylinder-plane.cjs');
const TAU=2*Math.PI;
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const dot=(a,b)=>a.x*b.x+a.y*b.y+a.z*b.z;
const sub=(a,b)=>({x:a.x-b.x,y:a.y-b.y,z:a.z-b.z});
const project=p=>({V:{u:p.x,v:p.z},H:{u:p.x,v:p.y},W:{u:p.y,v:p.z}});
const rad=n=>((n%TAU)+TAU)%TAU;
function blocked(source){
 return {status:'blocked',sourceStatus:source.status,
  reason:source.reason||'cannot verify finite nonvertical cylinder lateral arcs',
  arcs:[],verified:false,analyticalLateralVerified:false,
  completeSolidIntersectionVerified:false,globallyUnique:null};
}
function finiteCylinderLateralArcs(cylinder,plane,{samplesPerTurn=64}={}){
 if(!Number.isSafeInteger(samplesPerTurn)||samplesPerTurn<16||
    samplesPerTurn>256||samplesPerTurn%4!==0)
  throw new RangeError('samplesPerTurn must be a multiple of four in 16..256');
 const initial=intersectCylinderSidePlane(cylinder,plane,{samples:32});
 if(!['ready','clipped'].includes(initial.status))
  return blocked(initial);
 const pl=normalizePlane(plane),base=cylinder.baseCenter,r=cylinder.radiusMm,
  bottom=base.z,top=bottom+cylinder.heightMm,n=pl.normal;
 if(!finite(top)||Math.abs(n.z)<1e-10)
  return blocked({status:'undetermined',
   reason:'near-vertical plane requires a separate generator solver'});
 const delta=dot(n,sub(base,pl.point));
 const centerHeight=bottom-delta/n.z;
 const cosineZ=-r*n.x/n.z,sineZ=-r*n.y/n.z;
 const amplitude=Math.hypot(cosineZ,sineZ),phase=Math.atan2(sineZ,cosineZ);
 const tolerance=1e-8*Math.max(1,r,cylinder.heightMm);
 if(![centerHeight,cosineZ,sineZ,amplitude,phase].every(finite)||
    amplitude>1e10||Math.abs(centerHeight)>1e10)
  return blocked({status:'undetermined',reason:'nonfinite or ill-conditioned conic'});
 const zAt=angle=>centerHeight+cosineZ*Math.cos(angle)+sineZ*Math.sin(angle);
 const makePoint=theta=>{
  const cs=Math.cos(theta),sn=Math.sin(theta);
  return {x:base.x+r*cs,y:base.y+r*sn,z:zAt(theta)};
 };
 const candidates=[0,TAU];
 // Plane∩cap planes on the cylindrical SIDE => analytic polar roots.
 if(amplitude>1e-12){
  for(const height of [bottom,top]){
   const d=(height-centerHeight)/amplitude;
   if(d>1+1e-12||d< -1-1e-12)continue;
   if(d>=1-1e-12)candidates.push(rad(phase));
   else if(d<=-1+1e-12)candidates.push(rad(phase+Math.PI));
   else{
    const offset=Math.acos(d);
    candidates.push(rad(phase+offset),rad(phase-offset));
   }
  }
 }
 candidates.sort((a,b)=>a-b);
 const boundaries=[];
 for(const theta of candidates)
  if(!boundaries.length||Math.abs(theta-boundaries.at(-1))>1e-9)
   boundaries.push(theta);
 const arcs=[],allPoints=[];let maxResidualMm=0;
 for(let i=0;i<boundaries.length-1;i++){
  const start=boundaries[i],end=boundaries[i+1];
  if(end-start<1e-9)continue;
  const midpoint=zAt((start+end)/2);
  if(midpoint<bottom-tolerance||midpoint>top+tolerance)continue;
  // This is NOT a fitted SVG: endpoints and intermediate coordinates all
  // come from the original exact conic parameterization.
  const count=Math.max(1,Math.ceil(samplesPerTurn*(end-start)/TAU));
  const pts=[],projections=[];
  for(let j=0;j<=count;j++){
   const theta=start+(end-start)*j/count;
   const q=makePoint(theta);
   const residual=Math.max(
    Math.abs(dot(n,sub(q,pl.point))),
    Math.abs(Math.hypot(q.x-base.x,q.y-base.y)-r),
    Math.max(0,bottom-q.z,q.z-top));
   if(!Object.values(q).every(finite)||!finite(residual)||residual>tolerance*4)
    return blocked({status:'undetermined',reason:'clipped arc residual check failed'});
   maxResidualMm=Math.max(maxResidualMm,residual);
   pts.push(q);projections.push(project(q));
   allPoints.push(q);
  }
  const nearCap=(q)=>Math.abs(q.z-bottom)<=tolerance?'bottom':
    Math.abs(q.z-top)<=tolerance?'top':null;
  arcs.push({
   id:'lateral-interval-'+(arcs.length+1),
   angularInterval:[start,end],sampledPolylineOnly:true,
   samples:pts,projections,
   endpoints:{first:pts[0],last:pts.at(-1),
    firstCap:nearCap(pts[0]),lastCap:nearCap(pts.at(-1))},
   maxResidualMm:Math.max(...pts.map(q=>Math.max(
    Math.abs(dot(n,sub(q,pl.point))),
    Math.abs(Math.hypot(q.x-base.x,q.y-base.y)-r),
    Math.max(0,bottom-q.z,q.z-top))))
  });
 }
 if(!arcs.length)return blocked({status:'no-finite-arcs',
  reason:'at most isolated tangential contact; no nonzero clipped lateral arc proven'});
 const totalSpan=arcs.reduce((sum,a)=>sum+a.angularInterval[1]-a.angularInterval[0],0);
 const full=Math.abs(totalSpan-TAU)<1e-8;
 const chordBoundMm=Math.hypot(
  r,r,cosineZ,sineZ)*(1-Math.cos(Math.PI/samplesPerTurn));
 return {
  status:full?'complete-lateral':'clipped-lateral',
  sourceStatus:initial.status,
  verified:true,analyticalLateralVerified:true,
  completeSolidIntersectionVerified:false,
  requiresCapFaceTopology:true,
  modelUnit:'mm',globallyUnique:null,arcs,
  polarRootAngles:boundaries.filter(t=>t>1e-9&&t<TAU-1e-9),
  totalAngularSpanRadians:totalSpan,
  maxResidualMm,pointsCount:allPoints.length,
  chordErrorUpperBoundMm:chordBoundMm,
  sampledPolylineOnly:true,
  proofScope:'finite Z-axis cylinder LATERAL SIDE∩nonvertical plane only; cap faces and hidden lines excluded'
 };
}
module.exports={finiteCylinderLateralArcs};
