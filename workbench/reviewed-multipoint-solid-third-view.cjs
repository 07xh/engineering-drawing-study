'use strict';
/**
 * C1: generic reviewed N-vertex convex polyhedron from ONE pair of first-angle
 * projections with a user-confirmed vertex ID correspondence AND edge/face
 * topology. Reuses the existing 03 linear point solver, canonical Geometry
 * Scene and M0 convex mesh proof. Never infers topology from silhouettes.
 * This is M3 scoped projection evidence, not full solid recognition, a
 * visibility certificate, ConstructionIntent, DAG or official V5.
 */
const {solveProjection}=require('../engines/projection/point-projection.cjs');
const {project,VIEWS}=require('../core/projection/conventions.js');
const {deriveGeometryScene}=require('../core/projection/geometry-scene-views.cjs');
const {verifiedConvexMeshHalfspaces}=
 require('../core/geometry/verified-convex-mesh-halfspaces.cjs');
const {validateGeometry}=require('../core/contracts/geometry.js');
const {identifier}=require('../core/contracts/common.js');
const deepFreeze=x=>{
 if(x&&typeof x==='object'&&!Object.isFrozen(x)){
  for(const v of Object.values(x))deepFreeze(v);
  Object.freeze(x);
 }return x;
};
function reviewedSolidThirdView(input){
 if(!input||input.confirmedBy!=='user'||input.topologyConfirmed!==true||
    !Number.isSafeInteger(input.revision)||input.revision<1||
    input.unit!=='mm'||!identifier(input.geometryId)||
    !Array.isArray(input.vertices)||input.vertices.length<4||
    input.vertices.length>128||!Array.isArray(input.edges)||
    !Array.isArray(input.faces))
  throw new TypeError('reviewed mm vertices, geometry ID, topology and current revision required');
 if(input.sheetTransform!==undefined)
  throw new TypeError('two-view mathematical geometry never consumes sheet pixels');
 const first=input.vertices[0]?.knownViews;
 const pair=first&&typeof first==='object'&&!Array.isArray(first)?
  Object.keys(first).sort().join(''):null;
 if(!['HV','VW','HW'].includes(pair))
  throw new TypeError('exactly one of VH, VW, HW first-angle source pairs required');
 const ids=new Set(),points=Object.create(null),individual=[];
 for(const row of input.vertices){
  if(!row||!identifier(row.id)||ids.has(row.id)||
    Object.keys(row).sort().join(',')!=='id,knownViews'||
    !row.knownViews||typeof row.knownViews!=='object'||
    Array.isArray(row.knownViews)||
    Object.keys(row.knownViews).sort().join('')!==pair)
   throw new TypeError('reviewed corresponding vertex IDs must use the same source views');
  ids.add(row.id);
  const views=row.knownViews;
  for(const view of Object.keys(views)){
   const uv=views[view];
   if(!Array.isArray(uv)||uv.length!==2||!uv.every(x=>
     typeof x==='number'&&Number.isFinite(x)&&Math.abs(x)<=100000))
    throw new TypeError('all reviewed source coordinates must be finite model mm');
  }
  const m3=solveProjection({knownViews:views});
  if(m3.status!=='unique'||m3.globallyUnique!==true||
     m3.solutionCount!==1||!m3.point||
     !Number.isFinite(m3.maxResidual)||m3.maxResidual>1e-8)
   throw new RangeError('corresponding view measurements cannot prove a unique 3D vertex');
  points[row.id]={...m3.point};
  individual.push({id:row.id,resultId:m3.resultId,
   maxResidualMm:m3.maxResidual,proofLevel:m3.proofLevel});
 }
 // The caller must explicitly review the edge/face identity. M0 confirms
 // adjacency, closedness and convexity before accepting an actual mesh.
 const geometry={id:input.geometryId,kind:'mesh',space:'model-3d',unit:'mm',
  data:{points,edges:input.edges.map(e=>[...e]),
   faces:input.faces.map(f=>[...f])}};
 const geometryContract=validateGeometry(geometry);
 if(!geometryContract.ok)
  throw new RangeError('invalid human-confirmed mesh topology: '+geometryContract.errors.join('; '));
 const convexProof=verifiedConvexMeshHalfspaces(geometry);
 const scene=deriveGeometryScene({geometry:[geometry],revision:input.revision,
  resultId:'ReviewedThirdView'});
 const representation=scene.objects[0].representations;
 const missing=VIEWS.find(v=>!pair.includes(v));
 const target=representation[missing];
 for(const [id,p] of Object.entries(points)){
  for(const v of VIEWS){
   const expected=project(p)[v],actual=representation[v].points[id];
   if(!actual||Math.hypot(expected.u-actual.u,expected.v-actual.v)>1e-8)
    throw new RangeError('scene projection disagrees with M3 point witnesses');
  }
 }
 return deepFreeze({schema:'draftai-reviewed-multipoint-third-view/1',revision:input.revision,
  status:'geometry-proven-in-confirmed-convex-scope',
  knownViews:[...pair],missingView:missing,
  geometry,scene,individual,convexProof,
  thirdView:{view:missing,representation:target},
  projections:{V:representation.V,H:representation.H,W:representation.W},
  provenVertexCount:individual.length,provenEdgeCount:geometry.data.edges.length,
  provenFaceCount:geometry.data.faces.length,
  geometryVerifiedWithinReviewedTopology:true,
  inferredUnknownTopology:false,verifiedVisibility:false,
  officialLineStylesVerified:false,constructionIntents:[],steps:[],
  v5Ready:false,canExportCertifiedDrawing:false,
  realTextbookProblemAccepted:false});
}
module.exports={reviewedSolidThirdView};
