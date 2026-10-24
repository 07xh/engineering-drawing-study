'use strict';
/**
 * General 3D source-edge graph. Never infer 3D joins from coincident
 * projected V/H/W positions. Split straight source edges at all verified
 * 3D line-line contacts and known analytic-curve vertices lying within.
 * Curved interiors remain symbolic: no sampling promoted to topology.
 */
const {project,VIEWS}=require('../projection/conventions.js');
const finite=Number.isFinite;
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
const minus=(a,b)=>({x:a.x-b.x,y:a.y-b.y,z:a.z-b.z});
const plus=(a,d,t)=>({x:a.x+d.x*t,y:a.y+d.y*t,z:a.z+d.z*t});
const dot=(a,b)=>a.x*b.x+a.y*b.y+a.z*b.z;
const valid=p=>p&&['x','y','z'].every(k=>finite(p[k]));
const freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){
 for(const v of Object.values(x))freeze(v);Object.freeze(x);
}return x;};
function build3DSourceFeatureGraph({lineSources,curveSources,curveVertices,
 tolerance=1e-7}={}){
 if(!Array.isArray(lineSources)||!Array.isArray(curveSources)||
    !Array.isArray(curveVertices)||lineSources.length>128||
    curveSources.length>128||curveVertices.length>256||
    !finite(tolerance)||tolerance<=0||tolerance>1)
  throw new TypeError('bounded 3D source graph with explicit tolerance required');
 const all=[...lineSources,...curveSources,...curveVertices];
 if(all.some(s=>!s||typeof s.id!=='string'||!s.id)||
    new Set(all.map(s=>s.id)).size!==all.length)
  throw new TypeError('unique source identities required');
 if(lineSources.concat(curveSources).some(s=>
   !valid(s.from)||!valid(s.to)||dist(s.from,s.to)<=tolerance)||
    curveVertices.some(s=>!valid(s.point3D)))
  throw new RangeError('independently verified nonzero 3D sources required');
 const verts=[];
 function vertex(p,ref){
  const matches=verts.filter(v=>dist(v.point3D,p)<=tolerance);
  if(matches.length>1)throw new RangeError('ambiguous nearby 3D source vertices');
  let found=matches[0];
  if(!found){
   found={id:'vertex'+verts.length,point3D:{...p},sourceRefs:[]};
   verts.push(found);
  }
  if(!found.sourceRefs.some(r=>r.kind===ref.kind&&r.id===ref.id&&r.role===ref.role))
   found.sourceRefs.push({...ref});
  return found.id;
 }
 const junctionIds=new Map(curveVertices.map(v=>[v.id,
  vertex(v.point3D,{kind:'curve-junction',id:v.id,role:'vertex'})]));
 const marks=lineSources.map(s=>[
  {t:0,id:vertex(s.from,{kind:'line-end',id:s.id,role:'from'})},
  {t:1,id:vertex(s.to,{kind:'line-end',id:s.id,role:'to'})}]);
 function onLine(p,s){
  const d=minus(s.to,s.from),len2=dot(d,d),t=dot(minus(p,s.from),d)/len2;
  const e=tolerance/Math.sqrt(len2);
  if(t< -e||t>1+e||dist(p,plus(s.from,d,t))>tolerance)return null;
  return Math.max(0,Math.min(1,t));
 }
 let crossingCount=0,curveNodeSplits=0;
 for(let i=0;i<lineSources.length;i++)for(let j=i+1;j<lineSources.length;j++){
  const a=lineSources[i],b=lineSources[j],u=minus(a.to,a.from),
   v=minus(b.to,b.from),w=minus(a.from,b.from);
  const A=dot(u,u),B=dot(u,v),C=dot(v,v),D=dot(u,w),E=dot(v,w);
  const den=A*C-B*B;let contact=null;
  if(den>1e-12*A*C){
   const t=(B*E-C*D)/den,q=(A*E-B*D)/den;
   if(t< -tolerance/Math.sqrt(A)||t>1+tolerance/Math.sqrt(A)||
      q< -tolerance/Math.sqrt(C)||q>1+tolerance/Math.sqrt(C))continue;
   const p=plus(a.from,u,t),r=plus(b.from,v,q);
   if(dist(p,r)>tolerance)continue; // skew, only same paper position
   contact={point:{x:(p.x+r.x)/2,y:(p.y+r.y)/2,z:(p.z+r.z)/2},
    t:Math.max(0,Math.min(1,t)),q:Math.max(0,Math.min(1,q))};
  }else{
   const lineDistance=p=>{
    const t=dot(minus(p,a.from),u)/A;
    return dist(p,plus(a.from,u,t));
   };
   if(lineDistance(b.from)>tolerance||lineDistance(b.to)>tolerance)
    continue;
   const p0=dot(minus(b.from,a.from),u)/A,
    p1=dot(minus(b.to,a.from),u)/A;
   const lo=Math.max(0,Math.min(p0,p1)),hi=Math.min(1,Math.max(p0,p1)),
    eps=tolerance/Math.sqrt(A);
   if(hi<lo-eps)continue;
   if(hi>lo+eps)
    throw new RangeError('collinear positive-length source overlap needs independent owner');
   const t=Math.max(0,Math.min(1,(lo+hi)/2));
   const point=plus(a.from,u,t),q=onLine(point,b);
   if(q===null)continue;
   contact={point,t,q};
  }
  const id=vertex(contact.point,
   {kind:'3d-line-crossing',id:a.id+'|'+b.id,role:'contact'});
  marks[i].push({t:contact.t,id});marks[j].push({t:contact.q,id});
  crossingCount++;
 }
 for(const c of curveVertices){
  for(let i=0;i<lineSources.length;i++){
   const t=onLine(c.point3D,lineSources[i]);
   if(t===null)continue;
   marks[i].push({t,id:junctionIds.get(c.id)});curveNodeSplits++;
  }
 }
 const edges=[];
 for(let i=0;i<lineSources.length;i++){
  const s=lineSources[i],ts=marks[i].sort((a,b)=>a.t-b.t||a.id.localeCompare(b.id)),
   clean=[],minDelta=tolerance/dist(s.from,s.to);
  for(const x of ts){
   const last=clean.at(-1);
   if(last&&Math.abs(x.t-last.t)<=minDelta){
    if(last.id!==x.id)throw new RangeError('distinct 3D nodes collapsed on source line');
   }else clean.push(x);
  }
  for(let j=1;j<clean.length;j++){
   const a=clean[j-1],b=clean[j];
   if(a.id===b.id||b.t-a.t<=minDelta)
    throw new RangeError('source graph acquired zero-length line');
   edges.push({id:'lineEdge'+i+'_'+(j-1),kind:'line',
    sourceId:s.id,fromVertexId:a.id,toVertexId:b.id,
    sourceRange:[a.t,b.t],sourceFacePairKind:s.pairKind||null,
    sourceEndpointIncidenceVerified:true,
    officialLineStyle:'undetermined',v5CertifiedStrokeAuthorized:false});
  }
 }
 for(let i=0;i<curveSources.length;i++){
  const c=curveSources[i];
  const from=vertex(c.from,{kind:'curve-end',id:c.id,role:'from'});
  const to=vertex(c.to,{kind:'curve-end',id:c.id,role:'to'});
  if(from===to)throw new RangeError('collapsed symbolic 3D curve source');
  edges.push({id:'curveEdge'+i,kind:'analytic-curve',sourceId:c.id,
   fromVertexId:from,toVertexId:to,sourceRange:null,
   sourceEndpointIncidenceVerified:true,
   officialLineStyle:'undetermined',v5CertifiedStrokeAuthorized:false});
 }
 const adjacency=new Map(verts.map(v=>[v.id,[]]));
 for(const e of edges){
  if(!adjacency.has(e.fromVertexId)||!adjacency.has(e.toVertexId))
   throw new RangeError('graph edge lost vertex');
  adjacency.get(e.fromVertexId).push(e.id);
  adjacency.get(e.toVertexId).push(e.id);
 }
 const byId=new Map(edges.map(e=>[e.id,e])),
  seen=new Set(),components=[];
 for(const e of edges){
  if(seen.has(e.id))continue;
  const queue=[e.id],vIds=new Set(),eIds=[];
  while(queue.length){
   const id=queue.pop();
   if(seen.has(id))continue;
   seen.add(id);eIds.push(id);
   const row=byId.get(id);
   for(const v of [row.fromVertexId,row.toVertexId]){
    vIds.add(v);
    for(const adj of adjacency.get(v))if(!seen.has(adj))queue.push(adj);
   }
  }
  const degrees=[...vIds].map(vertexId=>({
   vertexId,degree:adjacency.get(vertexId).length}));
  components.push({id:'component'+components.length,
   vertexIds:[...vIds],edgeIds:eIds,
   sourceGraphShape:degrees.some(d=>d.degree>2)?'branched-source-network':
    degrees.every(d=>d.degree===2)?'closed-cycle':
    degrees.filter(d=>d.degree===1).length===2?'open-path':
    'undetermined',
   degreeWitnesses:degrees,fullCompositeBoundaryTopologyVerified:false});
 }
 const projectedCoincidences=[];
 for(let i=0;i<verts.length;i++)for(let j=i+1;j<verts.length;j++){
  const a=verts[i],b=verts[j];
  if(dist(a.point3D,b.point3D)<=tolerance)
   throw new RangeError('duplicate three-dimensional source vertex identity');
  const pa=project(a.point3D),pb=project(b.point3D);
  for(const view of VIEWS)
   if(Math.hypot(pa[view].u-pb[view].u,
     pa[view].v-pb[view].v)<=tolerance)
    projectedCoincidences.push({view,vertexIds:[a.id,b.id],
     distinct3DPoints:true,mayJoinFrom2DProjection:false});
 }
 if(seen.size!==edges.length||
    edges.filter(e=>e.kind==='analytic-curve').length!==curveSources.length||
    new Set(edges.filter(e=>e.kind==='line').map(e=>e.sourceId)).size!==
     lineSources.length)
  throw new RangeError('3D graph lost part of the source geometry');
 return freeze({schema:'draftai-3d-source-feature-graph/1',
  vertices:verts.map(v=>({...v,projections:project(v.point3D),
   incidentEdgeIds:[...adjacency.get(v.id)]})),
  edges,components,projectedCoincidences,
  sourceLineCount:lineSources.length,sourceCurveCount:curveSources.length,
  sourceCrossingCount:crossingCount,curveVertexOnLineCount:curveNodeSplits,
  allSourceEdgesCoveredExactlyOnce:true,
  all3DPointIdentitiesUsed:true,
  fullCompositeBoundaryTopologyVerified:false,
  allViewsContinuousVisibilityVerified:false,
  officialLineStylesVerified:false,finalV5StrokeAuthorized:false});
}
module.exports={build3DSourceFeatureGraph};
