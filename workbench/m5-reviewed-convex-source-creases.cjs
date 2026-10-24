'use strict';
/**
 * Shared M5 source-geometry crease theorem for a REVIEWED closed convex mesh.
 * M0 verifies a two-face-per-edge convex source manifold and each outward
 * supporting face plane. A mesh edge is a real SINGLE-SOLID geometric crease
 * only if its two supporting face normals meet with a certified nonzero
 * exterior dihedral angle. A diagonal between coplanar triangulated faces is
 * merely a mesh subdivision and is not a physical engineering feature edge.
 *
 * This theorem does NOT decide whether an original crease is exposed on a
 * COMPOSITE union, what part survives projection/occlusion, standard visible
 * or hidden stroke style, or whether V5 can draw that edge.
 */
const {verifiedConvexMeshHalfspaces}=
 require('../core/geometry/verified-convex-mesh-halfspaces.cjs');
const {dotObject3:dot,crossObject3:cross,normObject3:len}=
 require('../core/numeric/object-vector3.cjs');
const freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){
 for(const v of Object.values(x))freeze(v);Object.freeze(x);
}return x;};
const key=(a,b)=>[a,b].sort().join('|');
function auditReviewedConvexSourceCreases({geometry,revision}={}){
 if(!Number.isSafeInteger(revision)||revision<0)
  throw new TypeError('M5 source crease requires current geometry revision');
 const convex=verifiedConvexMeshHalfspaces(geometry);
 if(convex.status!=='validated-closed-convex-mesh'||
    convex.officialLineStylesVerified!==false)
  throw new TypeError('M0 closed convex source plane proof required');
 const halfspaces=convex.halfspaces;
 const incidence=new Map();
 for(const [i,face] of geometry.data.faces.entries()){
  for(let j=0;j<face.length;j++){
   const a=face[j],b=face[(j+1)%face.length],k=key(a,b);
   if(!incidence.has(k))incidence.set(k,[]);
   incidence.get(k).push(i);
  }
 }
 const minCreaseAngle=1e-6; // radians; near-coplanarity is NOT a line
 const coplanarNormalTol=1e-9;
 const rows=[];
 for(const [a,b] of geometry.data.edges){
  const k=key(a,b),faces=incidence.get(k);
  if(faces?.length!==2||faces[0]===faces[1])
   throw new TypeError('unproven original face-edge manifold incidence');
  const n0=halfspaces[faces[0]].normal,
    n1=halfspaces[faces[1]].normal;
  const cs=len(cross(n0,n1)),c=Math.max(-1,Math.min(1,dot(n0,n1)));
  const angle=Math.atan2(cs,c);
  if(!Number.isFinite(angle))throw new RangeError('invalid original face normal angle');
  const aligned=c>0&&cs<=coplanarNormalTol&&
    Math.abs(halfspaces[faces[0]].offsetMm-
      halfspaces[faces[1]].offsetMm)<=convex.toleranceMm;
  const crease=angle>minCreaseAngle&&angle<Math.PI-minCreaseAngle;
  const status=crease?'proven-single-solid-source-crease':
    aligned?'proven-coplanar-source-mesh-subdivision':
    'undetermined-dihedral-degeneracy';
  rows.push({
   sourceGeometryId:geometry.id,
   sourceEdgeId:geometry.id+'::'+k,
   originalVertexIds:[a,b],
   adjacentFaceIds:faces.map(i=>halfspaces[i].id),
   adjacentOutwardNormals:[{...n0},{...n1}],
   exteriorDihedralAngleRad:angle,
   sourceClosedConvexTopologyAndSupportPlanesVerified:true,
   sourceIsPhysicalCreaseWithinSingleSolid:crease,
   sourceIsCoplanarSubdivisionWithinSingleSolid:aligned,
   sourceFeatureClassification:status,
   positiveFeatureProofScope:'one-reviewed-closed-convex-source-only',
   compositeUnionFeatureSemanticsVerified:false,
   completeProjectedStrokeVisibilityVerified:false,
   officialEngineeringLineStyle:'undetermined',
   finalV5LineActionAuthorized:false
  });
 }
 if(rows.length!==convex.sourceEdgeCount||
    new Set(rows.map(e=>e.sourceEdgeId)).size!==rows.length)
  throw new TypeError('incomplete source crease accounting');
 return freeze({
  schema:'draftai-m5-convex-source-creases/1',
  revision,status:'single-source-dihedral-feature-evidence',
  sourceGeometryId:geometry.id,edges:rows,sourceEdgeCount:rows.length,
  certifiedSingleSolidCreaseCount:rows.filter(x=>
   x.sourceIsPhysicalCreaseWithinSingleSolid).length,
  provenCoplanarSubdivisionCount:rows.filter(x=>
   x.sourceIsCoplanarSubdivisionWithinSingleSolid).length,
  ambiguousDihedralCount:rows.filter(x=>
   x.sourceFeatureClassification==='undetermined-dihedral-degeneracy').length,
  exactTwoFaceIncidenceVerified:true,
  sourceConvexSupportPlanesVerified:true,
  multiBodyFeatureSemanticsVerified:false,
  officialLineStylesVerified:false,
  finalStrokeV5Ready:false
 });
}
module.exports={auditReviewedConvexSourceCreases};
