'use strict';
/**
 * 07 cut-solid PRESENTATION mesh derived from the EXISTING validated M3
 * analytic full-ellipse cone intersection. Never claims certified exact mesh,
 * complete visibility, true silhouette, or engineering hidden-line styles.
 *
 * Source tangent envelope is analytic, but faces are finitely tessellated.
 * A clipped-ellipse must await a separately proven base-cap/sector fill.
 */
const {validateSpatialConstructionIntent}=
 require('../core/contracts/spatial-construction-intent.js');
const xyz=p=>p&&['x','y','z'].every(k=>Number.isFinite(p[k]));
const sub=(a,b)=>({x:a.x-b.x,y:a.y-b.y,z:a.z-b.z});
const dot=(a,b)=>a.x*b.x+a.y*b.y+a.z*b.z;
const cross=(a,b)=>({x:a.y*b.z-a.z*b.y,y:a.z*b.x-a.x*b.z,
 z:a.x*b.y-a.y*b.x});
const norm=a=>Math.hypot(a.x,a.y,a.z);
const means=a=>({x:a.reduce((s,p)=>s+p.x,0)/a.length,
 y:a.reduce((s,p)=>s+p.y,0)/a.length,
 z:a.reduce((s,p)=>s+p.z,0)/a.length});
const block=(reason,revision)=>Object.freeze({
 status:'not-supported',reason,revision,triangles:[],
 trueSilhouetteVerified:false,completeSolidVisibilityVerified:false
});
function coneCutSolidPresentation(intent,{retainedHalfspace}={}){
 const v=validateSpatialConstructionIntent(intent);
 if(!v.ok||intent.source.mathStatus!=='ready')
  throw new TypeError('validated M3 3D cone section required');
 if(!['positive','negative'].includes(retainedHalfspace))
  throw new TypeError('explicit retained cutting halfspace required');
 const op=intent.operation;
 if(op.geometryKind!=='full-ellipse')
  return block('Clipped arc/base-disk sector surface not independently filled',intent.revision);
 const {cone,plane,analytic,samplePoints}=op;
 const size=samplePoints.length-1,r=cone.radiusMm,h=cone.heightMm;
 if(size<32||size>256||analytic.parameterRadians.length!==2||
    analytic.closed!==true)
  throw new RangeError('bounded full-ellipse source ring required');
 const apex={x:cone.baseCenter.x,y:cone.baseCenter.y,
  z:cone.baseCenter.z+h};
 const world=Math.max(1,...Object.values(apex).map(Math.abs),
  ...Object.values(plane.point).map(Math.abs));
 const tol=Math.max(1e-7*Math.max(1,r,h),128*Number.EPSILON*world);
 const normal=plane.normal,planeVal=p=>dot(sub(p,plane.point),normal);
 const normN=norm(normal);
 if(normN<=1e-12)throw new TypeError('plane normal is degenerate');
 const sign=retainedHalfspace==='positive'?1:-1;
 const apexDistance=planeVal(apex)/normN;
 if(Math.abs(apexDistance)<tol)
  throw new RangeError('apex too close to cutting plane');
 const keepApex=sign*apexDistance>0;
 const count=size;
 const source=samplePoints.slice(0,count);
 const seam=samplePoints[count];
 if(norm(sub(seam,source[0]))>8*tol)
  throw new RangeError('analytic full-ellipse seam disconnected');
 const vertices=[],faces=[];
 const vertex=(p,role)=>{
  if(!xyz(p))throw new TypeError('nonfinite 3D source mesh vertex');
  const id=vertices.length;
  vertices.push({id,world:{x:p.x,y:p.y,z:p.z},role});
  return id;
 };
 const section=source.map(p=>{
  if(Math.abs(planeVal(p))/normN>8*tol)
   throw new RangeError('section boundary not on cutting plane');
  return vertex(p,'analytic-section-sample');
 });
 const center=means(source);
 if(Math.abs(planeVal(center))/normN>8*tol)
  throw new RangeError('section tessellation center fails plane');
 const centerId=vertex(center,'section-interior-presentation');
 const rim=source.map((_,i)=>{
  const a=analytic.parameterRadians[0]+
   (analytic.parameterRadians[1]-analytic.parameterRadians[0])*i/count;
  return {x:cone.baseCenter.x+r*Math.cos(a),
   y:cone.baseCenter.y+r*Math.sin(a),z:cone.baseCenter.z};
 });
 const addFace=(ids,kind)=>{
  const [a,b,c]=ids.map(i=>vertices[i].world);
  const area2=norm(cross(sub(b,a),sub(c,a)));
  if(area2<=1e-11*tol*tol)
   throw new RangeError('degenerate cut-solid triangle');
  faces.push({indices:ids,kind});
 };
 if(keepApex){
  const apexId=vertex(apex,'apex');
  for(let i=0;i<count;i++){
   const next=(i+1)%count;
   addFace([apexId,section[i],section[next]],'lateral');
   addFace([centerId,section[next],section[i]],'cut-face');
  }
 }else{
  const bottom=rim.map(p=>{
   if(sign*planeVal(p)<-8*tol*normN)
    throw new RangeError('base rim violates retained cutting halfspace');
   return vertex(p,'base-rim');
  });
  const baseCenterId=vertex(cone.baseCenter,'base-center');
  if(sign*planeVal(cone.baseCenter)<-8*tol*normN)
   throw new RangeError('base center violates retained cutting halfspace');
  for(let i=0;i<count;i++){
   const next=(i+1)%count;
   addFace([section[i],bottom[i],bottom[next]],'lateral');
   addFace([section[i],bottom[next],section[next]],'lateral');
   addFace([centerId,section[i],section[next]],'cut-face');
   addFace([baseCenterId,bottom[next],bottom[i]],'base');
  }
 }
 // Verify topology independently of drawing: every undirected edge in this
 // bounded approximate surface mesh has exactly two incident triangles.
 const edges=new Map();
 for(const face of faces)
  for(let j=0;j<3;j++){
   const a=face.indices[j],b=face.indices[(j+1)%3];
   const id=Math.min(a,b)+'/'+Math.max(a,b);
   edges.set(id,(edges.get(id)||0)+1);
  }
 if([...edges.values()].some(n=>n!==2))
  throw new RangeError('tessellated cut solid has an unclosed seam');
 for(const p of vertices){
  if(sign*planeVal(p.world)/normN< -8*tol)
   throw new RangeError('mesh vertex lies on removed halfspace');
 }
 return Object.freeze({
  status:'sampled-closed-cut-mesh',revision:intent.revision,
  sourceSpatialIntentId:intent.id,retainedHalfspace,
  retainedPiece:keepApex?'apex':'base',
  vertices,triangles:faces,
  meshEdgesTwoIncidentTriangles:true,
  boundaryProjectionSource:'existing-M3-analytic-ellipse',
  sectionOnSourcePlaneVerified:true,
  sourceMathVerified:true,
  actualHalfspaceApplied:true,
  tessellationOnly:true,exactConicFaceVerified:false,
  trueSilhouetteVerified:false,completeSolidVisibilityVerified:false,
  capOcclusionVerified:false,standardLineStyleVerified:false,
  noSecondSolverOrPlayer:true
 });
}
module.exports={coneCutSolidPresentation};
