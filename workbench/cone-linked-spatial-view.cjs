'use strict';
/**
 * 07: presentation-only orbitable 3D SVG companion to the EXISTING cone M3
 * proof and V5 timeline. No solver, visibility oracle, second timeline, or
 * certified cap/solid model. The cutting-plane quadrilateral is a schematic
 * patch on the mathematical plane, NOT a proven cut-solid boundary.
 */
const {validateSpatialConstructionIntent}=
 require('../core/contracts/spatial-construction-intent.js');
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const xyz=p=>p&&['x','y','z'].every(k=>finite(p[k]));
const add=(a,b)=>({x:a.x+b.x,y:a.y+b.y,z:a.z+b.z});
const sub=(a,b)=>({x:a.x-b.x,y:a.y-b.y,z:a.z-b.z});
const mul=(a,s)=>({x:a.x*s,y:a.y*s,z:a.z*s});
const cross=(a,b)=>({x:a.y*b.z-a.z*b.y,
 y:a.z*b.x-a.x*b.z,z:a.x*b.y-a.y*b.x});
const unit=p=>{const n=Math.hypot(p.x,p.y,p.z);
 if(!finite(n)||n<=1e-12)throw new RangeError('degenerate 3D plane basis');
 return mul(p,1/n);
};
const guideIndices=n=>[0,Math.floor(n/4),Math.floor(n/2),
 Math.floor(3*n/4)];
function coneLinkedSpatialScene(intent,{azimuthDeg=35,elevationDeg=25,
 width=360,height=300}={}){
 const check=validateSpatialConstructionIntent(intent);
 if(!check.ok||intent.source.mathStatus!=='ready')
  throw new TypeError('confirmed, validated analytic M3 spatial intent required');
 if(![azimuthDeg,elevationDeg,width,height].every(finite)||
    azimuthDeg < -180||azimuthDeg > 180||
    elevationDeg < 5||elevationDeg > 85||
    width < 160||width > 2000||height < 150||height > 2000)
  throw new RangeError('bounded 3D presentation camera required');
 const op=intent.operation,c=op.cone,b=c.baseCenter;
 const apex={x:b.x,y:b.y,z:b.z+c.heightMm};
 const samples=op.samplePoints,segments=[];
 const r=c.radiusMm;
 const rim=Array.from({length:65},(_,i)=>{
  const a=2*Math.PI*i/64;
  return {x:b.x+r*Math.cos(a),y:b.y+r*Math.sin(a),z:b.z};
 });
 const rails=[0,2,4,6,8,10].map(i=>[apex,rim[i*4]]);
 const n=unit(op.plane.normal),basisU=unit(cross(
  Math.abs(n.z)<0.9?{x:0,y:0,z:1}:{x:0,y:1,z:0},n));
 const basisV=unit(cross(n,basisU));
 const center=mul(samples.reduce(add,{x:0,y:0,z:0}),1/samples.length);
 const patchRadius=Math.max(r,c.heightMm)*0.75;
 const patch=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([x,y])=>
  add(center,add(mul(basisU,x*patchRadius),mul(basisV,y*patchRadius))));
 const a=azimuthDeg*Math.PI/180,e=elevationDeg*Math.PI/180;
 const ca=Math.cos(a),sa=Math.sin(a),ce=Math.cos(e),se=Math.sin(e);
 const flat=p=>{const d=sub(p,b);
  return {x:ca*d.x-sa*d.y,y:ce*d.z-se*(sa*d.x+ca*d.y)};};
 const all=[apex,...rim,...patch,...samples];
 const flattened=all.map(flat);
 const xMin=Math.min(...flattened.map(p=>p.x)),xMax=Math.max(...flattened.map(p=>p.x));
 const yMin=Math.min(...flattened.map(p=>p.y)),yMax=Math.max(...flattened.map(p=>p.y));
 const spanX=xMax-xMin,spanY=yMax-yMin;
 if(![spanX,spanY].every(finite)||spanX<=0||spanY<=0)
  throw new RangeError('unrepresentable spatial presentation projection');
 const scale=Math.min((width-36)/spanX,(height-36)/spanY);
 if(!finite(scale)||scale<=0)throw new RangeError('invalid 3D camera scale');
 const screen=p=>{const q=flat(p);return {
  x:width/2+(q.x-(xMin+xMax)/2)*scale,
  y:height/2-(q.y-(yMin+yMax)/2)*scale
 };};
 const sourcePoints=samples.map((p,i)=>({
  index:i,world:{x:p.x,y:p.y,z:p.z},screen:screen(p)
 }));
 for(let i=0;i<samples.length-1;i++)
  segments.push({index:i+1,from:sourcePoints[i].screen,
   to:sourcePoints[i+1].screen,
   sourceActionId:'cone_V_lateral_'+(i+1)});
 const anchors=guideIndices(samples.length-1).map((index,j)=>({
  index,guideOrdinal:j,sourceStepId:'cone_generator_'+j+'_V',
  point:sourcePoints[index]
 }));
 const cap=op.capChord&&{from:screen(op.capChord.start),
  to:screen(op.capChord.end)};
 return {
  revision:intent.revision,sourceSpatialIntentId:intent.id,
  azimuthDeg,elevationDeg,width,height,
  apex:screen(apex),rim:rim.map(screen),rails:rails.map(pair=>pair.map(screen)),
  cuttingPlanePatch:patch.map(screen),sourcePoints,anchors,segments,
  capChord:cap,projectionOnly:true,modelSourceVerified:true,
  physicalCutSolidVerified:false,visibilityVerified:false,
  trueSilhouetteVerified:false,planePatchSchematic:true,
  constructionStepTimelineOwnedByV5:true
 };
}
module.exports={coneLinkedSpatialScene};
