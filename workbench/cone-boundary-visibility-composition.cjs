'use strict';
/**
 * Composes independent analytic lateral visibility with independently
 * verified finite-cone cap-chord topology. No sampled-polyline proof.
 * Cap-chord visibility remains unknown until full solid ray analysis.
 */
const {continuousConeLateralVisibility}=require('./cone-continuous-lateral-visibility.cjs');
const {conePlaneClippedEllipseBoundary}=require('../engines/spatial/sections/finite-cone-plane.cjs');
const {project}=require('../core/projection/conventions.js');
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
function coneBoundaryVisibilityComposition(cone,plane,options={}){
 const lateral=continuousConeLateralVisibility(cone,plane,options);
 if(lateral.status!=='analytic-lateral-intervals')
  return {status:'not-verified',reason:lateral.reason,views:null};
 const kind=lateral.spatialIntent.operation.geometryKind;
 const interval=lateral.spatialIntent.operation.analytic.parameterRadians;
 const eps=1e-8*Math.max(1,cone.radiusMm,cone.heightMm);
 let capChord=null;
 if(kind==='clipped-ellipse'){
  const source=conePlaneClippedEllipseBoundary(cone,plane,
   {samplesPerArc:options.samples??64});
  if(source.status!=='ready'||source.boundaryVerified!==true||
   source.solidSectionPerimeterVerified!==true||
   source.contourLoops?.[0]?.closed!==true)
   return {status:'not-verified',reason:'finite cap contour proof unavailable',views:null};
  const arc=source.boundaryEdges[0],chord=source.boundaryEdges[1];
  if(dist(arc.end,chord.start)>eps||dist(chord.end,arc.start)>eps)
   return {status:'not-verified',reason:'oriented arc/chord seam mismatch',views:null};
  capChord={start:chord.start,end:chord.end,lengthMm:chord.lengthMm};
 }
 const views={};
 for(const view of ['V','H','W']){
  views[view]=lateral.views[view].map((s,i)=>({
   id:view+'-lateral-'+i,kind:'analytic-lateral-arc',
   parameterRadians:[s.fromRadians,s.toRadians],
   visibility:s.visibility,visibilityProof:'analytic-azimuth-partition'
  }));
  if(capChord)views[view].push({
   id:view+'-cap-chord',kind:'cap-chord',
   start:project(capChord.start)[view],end:project(capChord.end)[view],
   visibility:'undetermined',
   visibilityProof:'not-proven-cap-occlusion'
  });
 }
 return {status:'verified-boundary-composition',revision:lateral.revision,
  geometryKind:kind,parameterRadians:interval,
  spatialIntent:lateral.spatialIntent,capChord,views,
  lateralIntervalsVerified:true,
  orientedBoundaryClosureVerified:true,
  capChordVisibilityVerified:false,
  completeSolidVisibilityVerified:false,
  fullContourPresentationVerified:false,
  publicWorkbenchConnected:false};
}
module.exports={coneBoundaryVisibilityComposition};
