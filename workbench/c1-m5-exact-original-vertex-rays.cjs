'use strict';
/**
 * Current first-angle C1 original 3D VERTEX endpoint observer rays.
 * The existing M0 exact dyadic proof is the only classifier. This is
 * original source-vertex evidence, not an M4 paper-crossing or V5 join.
 */
const {VIEWS}=require('../core/projection/conventions.js');
const {verifiedConvexMeshHalfspaces}=
 require('../core/geometry/verified-convex-mesh-halfspaces.cjs');
const {originalVertexRayProof}=
 require('../core/numeric/convex-incident-source-open-ray.cjs');
const freeze=o=>{
 if(o&&typeof o==='object'&&!Object.isFrozen(o)){
  for(const v of Object.values(o))freeze(v);
  Object.freeze(o);
 }return o;
};
function auditC1ExactOriginalVertexObserverRays({geometry,revision}={}){
 if(!Number.isSafeInteger(revision)||revision<1)
  throw new TypeError('current C1 original vertex revision required');
 const m0=verifiedConvexMeshHalfspaces(geometry);
 if(m0.status!=='validated-closed-convex-mesh'||
    m0.sourceGeometryId!==geometry.id||m0.v5Ready!==false)
  throw new RangeError('current reviewed closed convex M0 original geometry required');
 const rows=[],ids=Object.keys(geometry.data.points);
 let clear=0,entering=0,unknown=0;
 for(const view of VIEWS)for(const vertexId of ids){
  const witness=originalVertexRayProof({
   geometry,sourceVertexId:vertexId,view,convexProof:m0});
  if(witness.sourceGeometryId!==geometry.id||
     witness.sourceVertexId!==vertexId||witness.view!==view||
     witness.officialLineStyleVerified!==false||
     witness.endpointAndCrossSourceJoinCertified!==false||
     witness.v5Ready!==false)
   throw new RangeError('original source vertex exact proof cannot sign 3D junction');
  if(witness.positiveForwardRayClear)clear++;
  else if(witness.strictInteriorNearOriginalVertex)entering++;
  else unknown++;
  rows.push({
   sourceGeometryId:geometry.id,revision,view,
   originalVertexId:vertexId,
   originalModel3DPoint:{...geometry.data.points[vertexId]},
   proof:witness,exactOriginalVertex3DRayStatus:witness.status,
   allSourceLineAndPaperJunctionsCertified:false,
   engineeringLineStyle:'undetermined',signedV5Action:false
  });
 }
 if(rows.length!==ids.length*VIEWS.length||
    clear+entering+unknown!==rows.length||
    new Set(rows.map(x=>x.view+'@'+x.originalVertexId)).size!==rows.length)
  throw new RangeError('incomplete source vertex ray scene');
 return freeze({
  schema:'draftai-c1-m5-exact-original-vertex-observer-ray/1',
  sourceGeometryId:geometry.id,revision,unit:'mm',
  reviewedOriginalVertexCount:ids.length,
  counts:{originalVertexViewRayCount:rows.length,
   exactWholeForwardOpenRayClearCount:clear,
   exactStrictInteriorNearVertexCount:entering,
   tangentOrDegenerateUnresolvedCount:unknown,
   signedV5ActionCount:0},
  rows,
  everyOriginalVertexAndFirstAngleViewAccountedFor:true,
  allM4ProjectedPaperCutJunctionsResolved:false,
  fullSourceEdgeEndpointLineStylesSigned:false,
  signedV5ActionCount:0,wholeSolidV5Ready:false
 });
}
module.exports={auditC1ExactOriginalVertexObserverRays};
