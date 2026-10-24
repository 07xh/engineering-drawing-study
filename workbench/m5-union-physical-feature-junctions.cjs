'use strict';
/**
 * M5 C2: joint 3D endpoint incidence ledger for EXISTING source creases and
 * NEW transverse face-intersection features in the bounded cuboid union.
 *
 * Input is RECOMPUTED from the same M0-reviewed Geometry, not a page-provided
 * vertex/join map. Geometric co-location and octant union occupancy are
 * strictly weaker than proven incident-stroke continuity, paper topology,
 * standards-based hidden/solid styles, and one-V5 action release.
 */
const {boxFromConfirmedConvexMesh}=
 require('../core/geometry/reviewed-box-contact-evidence.cjs');
const {auditOrthogonalUnionSourceEdges}=
 require('./m5-orthogonal-union-source-edges.cjs');
const {proveGeneratedOrthogonalUnionCreases}=
 require('./m5-generated-orthogonal-union-creases.cjs');
const {project,VIEWS}=require('../core/projection/conventions.js');
const axes=['x','y','z'];
const freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){
 for(const v of Object.values(x))freeze(v);Object.freeze(x);
}return x;};
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
const copy=p=>({x:p.x,y:p.y,z:p.z});
const key=p=>axes.map(k=>Object.is(p[k],-0)?0:p[k]).join(':');
const lerp=(a,b,t)=>Object.fromEntries(axes.map(k=>[k,
 a[k]+t*(b[k]-a[k])]));
const failed=(revision,status)=>freeze({
 schema:'draftai-m5-union-feature-3d-junctions/1',revision,status,
 segments:[],nodes:[],sourceSegmentCount:0,generatedSegmentCount:0,
 sharedPhysicalNodeCount:0,projectedAliases:[],
 exactEndpointIncidenceVerified:false,
 allBoundaryJunctionsVerified:false,officialLineStylesVerified:false,
 officialV5FeatureActionsSigned:0,wholeCompositionV5Ready:false
});
function auditUnionPhysicalFeatureJunctions({geometry,revision}={}){
 if(!Number.isSafeInteger(revision)||revision<0)
  throw new TypeError('current reviewed source revision required');
 if(!Array.isArray(geometry)||geometry.length<2||geometry.length>8)
  throw new TypeError('reviewed bounded composite source Geometry required');
 const boxes=[],ids=new Set();
 for(const g of geometry){
  if(!g||typeof g.id!=='string'||ids.has(g.id))
   throw new TypeError('duplicate or missing reviewed source identity');
  ids.add(g.id);
  const b=boxFromConfirmedConvexMesh(g);
  if(!b)return failed(revision,'not-covered-non-cuboid');
  boxes.push(b);
 }
 const tolerance=Math.max(...boxes.map(b=>b.toleranceMm));
 const original=auditOrthogonalUnionSourceEdges({geometry,revision});
 const generated=proveGeneratedOrthogonalUnionCreases({geometry,revision});
 if(original.status!=='source-orthogonal-union-open-sector-coverage'||
    generated.status!=='scoped-pairwise-new-perpendicular-face-open-features'||
    original.v5Ready!==false||generated.generatedFeatureV5Ready!==false)
  throw new TypeError('independent M0/M5 union feature proof unavailable');
 const mesh=new Map(geometry.map(g=>[g.id,g]));
 const sourceRows=original.edges.flatMap(e=>e.subintervals.filter(s=>
  s.positiveUnionExternalCreaseVerified).map(s=>{
  const parent=mesh.get(e.sourceGeometryId),
   [a,b]=e.sourceVertexIds.map(id=>parent.data.points[id]);
  for(const [point,t] of [[s.source3DFrom,s.sourceParameterOpenRange[0]],
                           [s.source3DTo,s.sourceParameterOpenRange[1]]])
   if(distance(point,lerp(a,b,t))>tolerance/10)
    throw new RangeError('source subinterval endpoint not on source mesh edge');
  return {id:'original:'+s.id,kind:'original-source-crease',
   sourceGeometryIds:[e.sourceGeometryId],
   sourceEdgeId:e.sourceEdgeId,sourceGeneratedFeatureId:null,
   sourceAxis:e.axis,
   sourceAxialEventParameters:[...s.sourceParameterOpenRange],
   sourceFeatureOpenStatus:s.status,source3DFrom:copy(s.source3DFrom),
   source3DTo:copy(s.source3DTo),
   sourcePhysicalFeatureOpenIntervalVerified:true};
 }));
 const generatedRows=generated.segments.filter(s=>
  s.positiveNewConcaveUnionOpenFeatureVerified).map(s=>{
  if(s.sourceFacePlanes.length!==2||
     s.sourceFacePlanes[0].axis===s.sourceFacePlanes[1].axis)
   throw new TypeError('generated feature is not the intersection of two distinct source planes');
  for(const pt of [s.source3DFrom,s.source3DTo]){
   for(const f of s.sourceFacePlanes){
    const box=boxes.find(b=>b.id===f.sourceGeometryId);
    if(!box||pt[f.axis]!==box[f.side][f.axis]||
       pt[f.axis]!==f.valueMm)
     throw new RangeError('generated endpoint violates its original source-face plane');
   }
  }
  return {id:'generated:'+s.id,kind:'generated-source-face-crease',
   sourceGeometryIds:[...s.sourceGeometryIds],
   sourceEdgeId:null,sourceGeneratedFeatureId:s.id,
   sourceAxis:s.sourceAxis,
   sourceAxialEventParameters:[...s.sourceParameterOpenRangeMm],
   sourceFeatureOpenStatus:s.status,source3DFrom:copy(s.source3DFrom),
   source3DTo:copy(s.source3DTo),
   sourcePhysicalFeatureOpenIntervalVerified:true};
 });
 const segments=[...sourceRows,...generatedRows];
 if(segments.length>700)throw new RangeError('physical union feature graph budget exceeded');
 const nodesByKey=new Map();
 for(const s of segments){
  if(distance(s.source3DFrom,s.source3DTo)<=tolerance)
   throw new RangeError('degenerate positive source feature segment');
  for(const role of ['from','to']){
   const p=s[role==='from'?'source3DFrom':'source3DTo'];
   if(!axes.every(axis=>Number.isFinite(p[axis])))
    throw new RangeError('nonfinite current 3D union junction');
   const k=key(p);
   if(!nodesByKey.has(k))
    nodesByKey.set(k,{id:'J'+nodesByKey.size,point3D:copy(p),incident:[]});
   nodesByKey.get(k).incident.push({segmentId:s.id,
    sourceFeatureKind:s.kind,sourceGeometryIds:[...s.sourceGeometryIds],
    endpointRole:role,physical3DSourceIdentityRecomputed:true,
    completeSourceStrokeEndpointJoinVerified:false});
  }
 }
 const raw=[...nodesByKey.values()];
 const nodes=raw.map((n,index)=>{
  const point=n.point3D,occupancy=[];
  let ambiguous=false;
  for(const sx of [-1,1])for(const sy of [-1,1])for(const sz of [-1,1]){
   const signs={x:sx,y:sy,z:sz};
   const inside=boxes.some(b=>axes.every(axis=>{
    const x=point[axis],lo=b.min[axis],hi=b.max[axis];
    if(x<lo||x>hi){
     if(Math.min(Math.abs(x-lo),Math.abs(x-hi))<=tolerance)
      ambiguous=true;
     return false;
    }
    if(x===lo)return signs[axis]===1;
    if(x===hi)return signs[axis]===-1;
    if(Math.min(x-lo,hi-x)<=tolerance)ambiguous=true;
    return true;
   }));
   occupancy.push(inside);
  }
  const nearDistinct=raw.some((v,j)=>j!==index&&
   distance(point,v.point3D)<=tolerance);
  const incidentIds=[...new Set(n.incident.map(i=>i.segmentId))];
  if(incidentIds.length!==n.incident.length)
   throw new RangeError('same source segment folds both ends onto a single node');
  const count=occupancy.filter(Boolean).length;
  const allFeatureEndpointsAgreeExactly=incidentIds.length>0&&
   n.incident.every(i=>i.physical3DSourceIdentityRecomputed);
  const physicalCandidate=incidentIds.length>=2&&!nearDistinct&&
   !ambiguous&&count>0&&count<8&&allFeatureEndpointsAgreeExactly;
  return {id:n.id,point3D:copy(point),revision,
   projections:project(point),incidences:n.incident,
   incidentSegmentCount:incidentIds.length,
   incidentOriginalSourceCount:n.incident.filter(i=>
    i.sourceFeatureKind==='original-source-crease').length,
   incidentGeneratedSourceCount:n.incident.filter(i=>
    i.sourceFeatureKind==='generated-source-face-crease').length,
   unionOctantInside:[...occupancy],occupiedOctantCount:count,
   original3DPhysicalCoincidenceVerified:allFeatureEndpointsAgreeExactly,
   nearButNotIdentical3DPointExists:nearDistinct,
   nearCriticalOctantBoundary:ambiguous,
   localMultiSourcePhysicalJunctionCandidate:physicalCandidate,
   lineOrientationAndContinuousFeatureOrderingVerified:false,
   fullProjectedIncidentDepthAndOverlapVerified:false,
   standardEngineeringLineStyle:'undetermined',
   approvedV5JunctionAction:false};
 });
 const projectedAliases=[];
 for(const view of VIEWS)for(let i=0;i<nodes.length;i++)
  for(let j=i+1;j<nodes.length;j++){
   const a=nodes[i],b=nodes[j],p=a.projections[view],q=b.projections[view];
   if(p.u!==q.u||p.v!==q.v)continue;
   projectedAliases.push({view,junctionIds:[a.id,b.id],
    sameProjectedPaperPoint:true,
    different3DPhysicalPoints:distance(a.point3D,b.point3D)>0,
    mayJoinDrawingStrokesOnProjectionAlone:false});
  }
 return freeze({schema:'draftai-m5-union-feature-3d-junctions/1',
  revision,status:'source-recomputed-physical-3d-feature-incidence',
  sourceGeometryIds:geometry.map(g=>g.id),
  segments,nodes,
  sourceSegmentCount:sourceRows.length,
  generatedSegmentCount:generatedRows.length,
  nodeCount:nodes.length,
  sharedPhysicalNodeCount:nodes.filter(n=>n.incidentSegmentCount>=2).length,
  positiveLocalJunctionCandidateCount:nodes.filter(n=>
   n.localMultiSourcePhysicalJunctionCandidate).length,
  nearCriticalOrDepthAliasCount:nodes.filter(n=>
   n.nearButNotIdentical3DPointExists||n.nearCriticalOctantBoundary).length,
  projectedAliases,
  originalAndGeneratedSourceEdgeKindsAccountedFor:true,
  exactEndpointIncidenceVerified:true,
  allBoundaryJunctionsVerified:false,
  allBooleanUnionFeaturesEnumerated:false,
  entireProjectedContourAndOcclusionVerified:false,
  officialLineStylesVerified:false,
  officialV5FeatureActionsSigned:0,wholeCompositionV5Ready:false});
}
module.exports={auditUnionPhysicalFeatureJunctions};
