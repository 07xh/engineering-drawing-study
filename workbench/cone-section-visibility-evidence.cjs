'use strict';
/**
 * M3 finite-cone section: analytic ray/surface visibility evidence.
 * The uncut cone ray test remains a diagnostic, never a cut-solid answer.
 * Actual per-sample open-ray classification requires an explicitly selected
 * retained cutting halfspace and reuses the EXISTING #432/#435 oracle.
 * Neither an isolated sample nor a 2D projection chord certifies continuous
 * silhouette, endpoint, cap, or engineering-standard line appearance.
 */
const {verifiedConeSpatialIntent}=require('./verified-cone-spatial-intent.cjs');
const {project}=require('../core/projection/conventions.js');
const {coneV5OpenRayEvidence,DIRS}=
 require('./cone-open-ray-v5-mapping.cjs');
const finite=Number.isFinite;
const dirs=DIRS;
const dot=(a,b)=>a.x*b.x+a.y*b.y+a.z*b.z;
// Ray direction is explicitly from the surface point toward the observer.
// V looks along -Y, H along +Z and W along +X in this coordinate system.
function coneSectionVisibilityEvidence(cone,plane,options={}){
 if(!options||typeof options!=='object'||Array.isArray(options))
  throw new TypeError('reviewed finite-cone section options required');
 const allowed=['kind','sourceConfirmed','revision','sheetTransform',
  'samples','retainedHalfspace'];
 if(Object.keys(options).some(k=>!allowed.includes(k)))
  throw new TypeError('untrusted visibility evidence or options field');
 const {retainedHalfspace,...geometryOptions}=options;
 if(retainedHalfspace!==undefined&&
    !['positive','negative'].includes(retainedHalfspace))
  throw new TypeError('explicit retained cone halfspace must be positive or negative');
 const source=verifiedConeSpatialIntent(cone,plane,geometryOptions);
 if(source.status!=='ready')
  return {status:'not-verified',reason:source.reason,visibilityVerified:false,views:null};
 const apex={x:cone.baseCenter.x,y:cone.baseCenter.y,
  z:cone.baseCenter.z+cone.heightMm};
 const k=cone.radiusMm/cone.heightMm;
 const count=source.spatialIntent.operation.samplePoints.length-1;
 const cutProof=retainedHalfspace===undefined?null:
  coneV5OpenRayEvidence(cone,plane,{
   kind:geometryOptions.kind||'full-ellipse',samples:count,
   sourceConfirmed:true,retainedHalfspace,
   observerDirections:{
    V:{...DIRS.V},H:{...DIRS.H},W:{...DIRS.W}
   },
   analytic:source.spatialIntent.operation.analytic
  });
 if(cutProof&&(
   cutProof.status!=='open-ray-evidence'||
   cutProof.partitionCoverageVerified!==true||
   cutProof.completeVisibilityVerified!==false||
   cutProof.sourceBoundaryEndpointsVerified!==false||
   cutProof.engineeringDrawingLineStylesCertified!==false))
  throw new TypeError('scoped cut-solid visibility proof required');
 const views={};
 const tolerance=1e-8*Math.max(1,cone.radiusMm,cone.heightMm);
 for(const [view,d] of Object.entries(dirs)){
  const entries=[];
  for(const [i,p] of source.spatialIntent.operation.samplePoints.entries()){
   // Ray toward the observer: p + t*d, t>0. Find a strictly closer
   // second intersection with the cone's finite lateral surface.
   const q={x:p.x-cone.baseCenter.x,y:p.y-cone.baseCenter.y,
    z:apex.z-p.z};
   const A=d.x*d.x+d.y*d.y-k*k*d.z*d.z;
   const B=2*(q.x*d.x+q.y*d.y+k*k*q.z*d.z);
   let occluded=false,ambiguous=false,nearest=null;
   if(Math.abs(A)<=1e-14){
    // A near-linear ray may be tangent/degenerate; do not certify visibility.
    ambiguous=true;
   }else{
    const t=-B/A;
    if(finite(t)&&t>tolerance){
     const hit={x:p.x+t*d.x,y:p.y+t*d.y,z:p.z+t*d.z};
     const rho=Math.hypot(hit.x-cone.baseCenter.x,hit.y-cone.baseCenter.y);
     const expected=k*(apex.z-hit.z);
     const surfaceError=Math.abs(rho-expected);
     if(hit.z>=cone.baseCenter.z-tolerance&&hit.z<=apex.z+tolerance&&
        surfaceError<=tolerance){
      occluded=true;nearest=t;
     }else if(surfaceError>tolerance&&
      hit.z>=cone.baseCenter.z&&hit.z<=apex.z)ambiguous=true;
    }
   }
   // Near silhouette/grazing rays have unstable visibility classification.
   const normal={x:q.x,y:q.y,z:k*k*q.z};
   const norm=Math.hypot(normal.x,normal.y,normal.z);
   if(norm<=tolerance||Math.abs(dot(normal,d))/norm<1e-7)ambiguous=true;
   // The H view can be blocked by the planar base disk only for rays
   // pointing toward -Z. Our H ray is +Z, so the base lies behind
   // lateral points. This does not certify cap boundary presentation.
   const uncutConeVisibility=ambiguous?'undetermined':
    occluded?'occluded':'visible';
   // Only the interior of two neighboring analytically certified arc
   // segments may establish a stable OPEN neighborhood around one sample.
   // This is deliberately weaker than full projected-line visibility.
   const labels=cutProof?.views[view]?.lateral;
   if(cutProof&&(!Array.isArray(labels)||labels.length!==count))
    throw new TypeError('nonmatching cone open-ray source samples');
   const left=i>0?labels?.[i-1]:null;
   const right=i<count?labels?.[i]:null;
   const agreed=left!==undefined&&left!==null&&left===right&&
    (left==='visible'||left==='hidden');
   const visibility=agreed?(left==='hidden'?'occluded':'visible'):
    'undetermined';
   entries.push({projection:project(p)[view],
    // The legacy uncut diagnostic is a distinct field. Never promote it
    // when retainedHalfspace was not reviewed or contradicts the oracle.
    visibility,uncutConeVisibility,lateralRayIntersectionMm:nearest,
    openNeighborhoodVerified:agreed,
    cutSolidScope:cutProof?'retained-halfspace-analytic-open-ray':
     'no-reviewed-retained-halfspace',
    endpointVisibilityVerified:false,
    completeProjectedOcclusionVerified:false});
  }
  views[view]=entries;
 }
 return {status:'lateral-sample-evidence',revision:source.revision,views,
  spatialIntent:source.spatialIntent,
  retainedHalfspace:retainedHalfspace??null,
  cutSolidOpenRayProofConnected:cutProof!==null,
  noHalfspaceDefaultsToUnknown:true,
  lateralRayTested:true,visibilityVerified:false,
  capOcclusionVerified:false,continuousCurveVisibilityVerified:false,
  fullContourVerified:false,firstAngleLayoutVerified:false};
}
module.exports={coneSectionVisibilityEvidence};
