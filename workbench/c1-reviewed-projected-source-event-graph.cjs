'use strict';
/**
 * C1 source-scoped projected event graph for ONE M0-reviewed closed convex
 * solid. Reuse the SAME M4 original-source pairwise crossing / projected
 * overlap / endpoint events; no new intersection or drawing engine.
 *
 * Cut original 3D edges in V/H/W at EVERY known source event and M5
 * exterior-contour edge-bound endpoint. Distinguish an EXACT shared original
 * 3D vertex ID from a PAPER-ONLY crossing / overlap / endpoint coincidence.
 * No inferred 3D joins at interior cuts, no tolerance-snapped fake vertices,
 * no engineering line styles, ConstructionIntent, DAG, or V5 authority.
 */
const {project,VIEWS}=require('../core/projection/conventions.js');
const {verifiedConvexMeshHalfspaces}=
 require('../core/geometry/verified-convex-mesh-halfspaces.cjs');
const {recomputeReviewedProjectedEdgeEvents}=
 require('./recomputed-projected-pairwise-events.cjs');
const {auditC1GlobalVisibleContourProof}=
 require('./m5-c1-global-visible-contour-proof.cjs');
const {positiveCollinearOverlap}=
 require('./c1-ocjs-reviewed-solid-v5.cjs');
const finite=Number.isFinite;
const freeze=o=>{
 if(o&&typeof o==='object'&&!Object.isFrozen(o)){
  for(const item of Object.values(o))freeze(item);
  Object.freeze(o);
 }return o;
};
const key=(id,a,b)=>id+'::'+[a,b].sort().join('|');
const lerp=(a,b,t)=>({x:a.x+(b.x-a.x)*t,
 y:a.y+(b.y-a.y)*t,z:a.z+(b.z-a.z)*t});
function auditC1ReviewedProjectedSourceEventGraph({geometry,revision}={}){
 if(!Number.isSafeInteger(revision)||revision<1)
  throw new TypeError('reviewed C1 source event revision required');
 const m0=verifiedConvexMeshHalfspaces(geometry);
 const hull=auditC1GlobalVisibleContourProof({geometry,revision});
 if(hull.sourceGeometryId!==geometry.id||hull.revision!==revision||
    hull.nonExteriorInternalEdgesSigned!==false||
    m0.sourceGeometryId!==geometry.id)
  throw new RangeError('matching original unsigned M5 exterior contour required');
 if(geometry.data.edges.length>40)
  throw new RangeError('existing shared M4 pairwise event budget 40 exceeded');
 const original=new Map();
 const input=geometry.data.edges.map(([a,b],i)=>{
  const id=key(geometry.id,a,b),p=geometry.data.points;
  original.set(id,{id,a,b,from:p[a],to:p[b]});
  return {sourceGeometryId:geometry.id,sourceEdgeId:id,
   edge:{id:'C1SourceEvent'+i,from:p[a],to:p[b]}};
 });
 const events=recomputeReviewedProjectedEdgeEvents(input);
 if(events.status!=='pairwise-depth-events-only'||
    events.completeContourVerified!==false)
  throw new RangeError('actual original-source M4 pairwise event graph required');
 const per=new Map(),all=[];
 const idKey=(id,view)=>id+'@'+view;
 for(const edge of original.values())for(const view of VIEWS){
  const a=project(edge.from)[view],b=project(edge.to)[view],
   length=Math.hypot(b.u-a.u,b.v-a.v);
  if(!finite(length))throw new RangeError('nonfinite first-angle projection');
  per.set(idKey(edge.id,view),{edge,view,a,b,length,cuts:[0,1],
   encounters:[]});
 }
 let paperOnlySourceEncounters=0,exactSharedOriginalVertexEncounters=0;
 const add=(edgeId,view,t,incident)=>{
  const row=per.get(idKey(edgeId,view));
  if(!row||!finite(t)||t<0||t>1)
   throw new RangeError('unproven projected source parameter');
  row.cuts.push(t);
  row.encounters.push({...incident,sourceParameter:t});
 };
 const atVertex=(edge,t)=>t===0?edge.a:t===1?edge.b:null;
 const addPair=(e,ta,tb,kind)=>{
  const A=original.get(e.firstSourceEdgeId),
   B=original.get(e.secondSourceEdgeId);
  if(!A||!B||!finite(ta)||!finite(tb))
   throw new RangeError('recomputed M4 event references untrusted source');
  const va=atVertex(A,ta),vb=atVertex(B,tb);
  const shared=va!==null&&vb!==null&&va===vb;
  if(shared)exactSharedOriginalVertexEncounters++;
  else paperOnlySourceEncounters++;
  add(A.id,e.view,ta,{otherSourceEdgeId:B.id,kind,
   exactSharedOriginalVertexId:shared?va:null,
   original3DPhysicalJunctionProven:shared,
   projectedOnlyUnresolved:!shared});
  add(B.id,e.view,tb,{otherSourceEdgeId:A.id,kind,
   exactSharedOriginalVertexId:shared?vb:null,
   original3DPhysicalJunctionProven:shared,
   projectedOnlyUnresolved:!shared});
 };
 for(const ev of events.events){
  if(!VIEWS.includes(ev.view)||
     !original.has(ev.firstSourceEdgeId)||
     !original.has(ev.secondSourceEdgeId))
   throw new RangeError('untrusted M4 first-angle original-source event');
  for(const e of ev.events??[])
   addPair(ev,e.firstParameter,e.secondParameter,ev.relation);
  for(const range of ev.ranges??[]){
   addPair(ev,range.firstParameterRange[0],
    range.secondParameterRange[0],ev.relation);
   addPair(ev,range.firstParameterRange[1],
    range.secondParameterRange[1],ev.relation);
  }
 }
 let hullBoundCutCount=0;
 for(const view of VIEWS){
  const pv=hull.views.find(x=>x.view===view);
  if(!pv)throw new TypeError('complete C1 M5 three-view exterior evidence required');
  for(const stroke of pv.candidateIntervals){
   if(!stroke.sourceContourCoverageVerified||
      !original.has(stroke.sourceEdgeId))continue;
   const row=per.get(idKey(stroke.sourceEdgeId,view));
   const {edge}=row;
   const dir=['x','y','z'].map(k=>edge.to[k]-edge.from[k]);
   const axis=dir.findIndex(x=>Math.abs(x)===Math.max(...dir.map(Math.abs)));
   if(axis<0||dir[axis]===0)
    throw new RangeError('degenerate M5 source-bound original 3D edge');
   for(const q of [stroke.real3DFrom,stroke.real3DTo]){
    if(!q||!finite(q[['x','y','z'][axis]]))
     throw new RangeError('missing current M5 real 3D source endpoint');
    const t=(q[['x','y','z'][axis]]-edge.from[['x','y','z'][axis]])/
     dir[axis];
    if(!finite(t)||t< -1e-8||t>1+1e-8)
     throw new RangeError('M5 exterior source endpoint outside original edge');
    const clipped=Math.max(0,Math.min(1,t));
    const implied=lerp(edge.from,edge.to,clipped);
    if(Math.hypot(implied.x-q.x,implied.y-q.y,implied.z-q.z)>1e-7)
     throw new RangeError('M5 exterior 3D endpoint disconnected from source');
    row.cuts.push(clipped);hullBoundCutCount++;
   }
  }
 }
 let partitionedSourceSubintervalCount=0,hullMaskedSubintervalCount=0,
  nonHullSourceSubintervalCount=0,internalPaperEventCutCount=0;
 for(const row of per.values()){
  const {edge,view,a,b,length}=row;
  const source=row.edge.id,unique=[...new Set(row.cuts)].sort((x,y)=>x-y);
  if(unique.length>130)
   throw new RangeError('C1 M4 projected source event cut budget exceeded');
  const contour=hull.views.find(x=>x.view===view).candidateIntervals;
  const spans=[];
  if(length>1e-8)for(let i=0;i<unique.length-1;i++){
   const lo=unique[i],hi=unique[i+1];
   if(!(hi>lo))continue;
   const from3=lerp(edge.from,edge.to,lo),
    to3=lerp(edge.from,edge.to,hi),
    from=project(from3)[view],to=project(to3)[view];
   if(Math.hypot(from.u-to.u,from.v-to.v)<=1e-10)continue;
   const overlaps=contour.filter(h=>positiveCollinearOverlap(
    from,to,h.projectedFromModelMm,h.projectedToModelMm));
   const coveredByExterior=overlaps.length>0;
   if(coveredByExterior)hullMaskedSubintervalCount++;
   else nonHullSourceSubintervalCount++;
   spans.push({view,sourceGeometryId:geometry.id,sourceEdgeId:source,
    originalVertexIds:[edge.a,edge.b],
    originalParameterRange:[lo,hi],
    fromModelMm:from,toModelMm:to,
    from3D:from3,to3D:to3,
    projectedExteriorHullOverlap:coveredByExterior,
    matchingExteriorContourSourceIds:[...new Set(overlaps.map(x=>
     x.sourceEdgeId).filter(Boolean))].sort(),
    eligibleForNonHullCandidate:!coveredByExterior,
    fullProjectedJunctionAndDepthOrderVerified:false,
    engineeringLineStyle:'undetermined',signedV5Action:false});
  }
  partitionedSourceSubintervalCount+=spans.length;
  internalPaperEventCutCount+=row.encounters.filter(x=>
   x.sourceParameter>0&&x.sourceParameter<1&&
   !x.original3DPhysicalJunctionProven).length;
  all.push({view,sourceGeometryId:geometry.id,sourceEdgeId:source,
   sourceOriginalVertexIds:[edge.a,edge.b],collapsedProjection:length<=1e-8,
   cutParameters:unique,encounters:row.encounters,
   spans,officialLineStylesVerified:false,signedV5ActionCount:0});
 }
 return freeze({schema:'draftai-c1-original-source-m4-projected-event-graph/1',
  sourceGeometryId:geometry.id,revision,unit:'mm',
  currentM0ClosedConvexVerified:true,
  actualM4OriginalSourcePairwiseEventCount:events.events.length,
  exactSharedOriginalVertexEncounters,
  paperOnlySourceEncounters,internalPaperEventCutCount,
  hullBoundCutCount,originalSourceEdgeViewCount:all.length,
  partitionedSourceSubintervalCount,hullMaskedSubintervalCount,
  nonHullSourceSubintervalCount,
  rows:all,
  allPhysicalJunctionsCertified:false,
  exactSourceDepthForAllProjectedAliasesCertified:false,
  sourceIntervalEngineeringLineStylesCertified:false,
  signedV5ActionCount:0,wholeSolidV5Ready:false});
}
module.exports={auditC1ReviewedProjectedSourceEventGraph};
