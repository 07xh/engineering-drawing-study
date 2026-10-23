'use strict';
/**
 * 04: analytic observer-ray classification for OPEN interiors of the verified
 * cut-polygon edges of a single axis-aligned convex rectangular prism.
 *
 * Kept plane halfspace and 3D observer direction are EXPLICIT; no standard
 * view mapping is invented. Corner and tangent cases are not certified.
 */
const {prismPlaneSection}=require('./rectangular-prism-plane.cjs');
const {normalizePlane}=require('./axis-cylinder-plane.cjs');
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const point=v=>v&&['x','y','z'].every(k=>finite(v[k])&&Math.abs(v[k])<1e8);
const dot=(a,b)=>a.x*b.x+a.y*b.y+a.z*b.z;
const normalize=v=>{
 if(!point(v))throw new TypeError('finite observer ray is required');
 const mag=Math.hypot(v.x,v.y,v.z);
 if(!finite(mag)||mag<=1e-12)throw new RangeError('observer ray must be nonzero');
 return {x:v.x/mag,y:v.y/mag,z:v.z/mag};
};
const midpoint=(a,b)=>({x:(a.x+b.x)/2,y:(a.y+b.y)/2,z:(a.z+b.z)/2});
function blocked(source){
 return {status:'blocked',sourceStatus:source.status,
  reason:source.reason||'no verified prism perimeter',
  edgeRuns:[],counts:{visible:0,hidden:0,undetermined:0},
  edgeInteriorsVerified:false,visibilityVerified:false,
  standardViewMappingVerified:false,v5LineStylesReady:false,
  globallyUnique:null};
}
function classifyPrismSectionVisibility(box,plane,options={}){
 if(!options||typeof options!=='object'||Array.isArray(options))
  throw new TypeError('explicit retained halfspace and observer ray required');
 const {retainedHalfspace,observerDirection}=options;
 if(!['positive','negative'].includes(retainedHalfspace))
  throw new TypeError('retainedHalfspace must be positive or negative');
 const ray=normalize(observerDirection),pl=normalizePlane(plane);
 const section=prismPlaneSection(box,plane);
 if(section.status!=='ready'||section.perimeterVerified!==true)
  return blocked(section);
 const epsilon=Math.max(1e-8,
  section.proof.planeDistanceToleranceMm);
 const sign=retainedHalfspace==='positive'?1:-1;
 const planeSlope=sign*dot(pl.normal,ray);
 const DIR_EPS=1e-10;
 const counts={visible:0,hidden:0,undetermined:0},edgeRuns=[];
 for(const edge of section.perimeter){
  const mid=midpoint(edge.from,edge.to);
  // A nondegenerate plane cut through a rectangular prism intersects
  // each open polygon edge in the interior of ONE original box face.
  const faces=[];
  for(const axis of ['x','y','z']){
   if(Math.abs(mid[axis]-box.min[axis])<=epsilon*4)
    faces.push({axis,bound:'min',outwardSign:-1});
   if(Math.abs(mid[axis]-box.max[axis])<=epsilon*4)
    faces.push({axis,bound:'max',outwardSign:1});
  }
  if(faces.length!==1)return blocked({
   status:'face-ambiguous',
   reason:'open section edge is not confidently inside one prism face'
  });
  const face=faces[0];
  const outward=face.outwardSign*ray[face.axis];
  let visibility='undetermined',reason='cut-plane-or-view-tangency';
  if(planeSlope< -DIR_EPS){
   visibility='visible';reason='ray-enters-removed-halfspace';
  }else if(planeSlope>DIR_EPS){
   if(outward>DIR_EPS){
    visibility='visible';reason='ray-leaves-convex-prism-through-section-face';
   }else if(outward< -DIR_EPS){
    visibility='hidden';reason='ray-enters-retained-prism-through-section-face';
   }
  }
  if(!['visible','hidden','undetermined'].includes(visibility))
   return blocked({status:'numeric-failure'});
  // Independent midpoint plane and face residual, no ray-only guess.
  const delta={x:mid.x-pl.point.x,y:mid.y-pl.point.y,
   z:mid.z-pl.point.z};
  const planeResidualMm=Math.abs(dot(pl.normal,delta));
  const faceResidualMm=Math.abs(mid[face.axis]-
   (face.bound==='min'?box.min[face.axis]:box.max[face.axis]));
  if(!finite(planeResidualMm)||!finite(faceResidualMm)||
    planeResidualMm>epsilon*4||faceResidualMm>epsilon*4)
   return blocked({status:'numeric-failure',
    reason:'prism cut face-point residual failed'});
  counts[visibility]++;
  edgeRuns.push({
   id:edge.id+'-ray',sourceEdgeId:edge.id,
   from:{...edge.from},through:mid,to:{...edge.to},
   projectedEndpoints:edge.projectedEndpoints,
   boxFace:face.axis+'-'+face.bound,
   normalOutwardComponent:outward,
   visibility,reason,
   midpointPlaneResidualMm:planeResidualMm,
   midpointFaceResidualMm:faceResidualMm,
   endpointVisibilityVerified:false,
   openEdgeVerified:visibility!=='undetermined'
  });
 }
 return {
  status:'ready',modelUnit:'mm',sourcePerimeterVerified:true,
  observerDirection:ray,retainedHalfspace,
  edgeRuns,totalEdges:edgeRuns.length,counts,
  edgeInteriorsVerified:counts.undetermined===0,
  visibilityVerified:counts.undetermined===0,
  boundaryEndpointsVerified:false,
  firstAngleViewConventionsSignedOff:false,
  standardViewMappingVerified:false,
  v5LineStylesReady:false,globallyUnique:null,
  maxResidualMm:Math.max(section.maxResidualMm,
   ...edgeRuns.flatMap(x=>[x.midpointPlaneResidualMm,x.midpointFaceResidualMm])),
  proofScope:'known finite axis-aligned convex prism, one given plane and retained halfspace; open section edges only, no corners or other solids'
 };
}
module.exports={classifyPrismSectionVisibility};
