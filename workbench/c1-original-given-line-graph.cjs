'use strict';
/** Exact read-only adjacency of reviewed original GIVEN DXF LINE entities.
 * No crossing, projected coincidence or inferred 3D edge can create a
 * source vertex junction. No formal M5/GB style or second V5 is signed.
 */
const {VIEWS}=require('../core/projection/conventions.js');
const {validateGivenPacket}=
 require('./c1-authenticated-dxf-to-reviewed-v5.cjs');
function freeze(o){
 if(o&&typeof o==='object'&&!Object.isFrozen(o)){
  for(const child of Object.values(o))freeze(child);
  Object.freeze(o);
 }
 return o;
}
function auditC1OriginalGivenLineGraph(packet){
 validateGivenPacket(packet);
 const views={};
 for(const view of VIEWS){
  const known=Object.hasOwn(packet.views,view);
  const sources=known?packet.givenOriginalHandleEndpoints[view]:[];
  const givenPoints=known?packet.views[view]:[];
  const givenLines=known?packet.givenOriginalStrokes?.[view]??[]:[];
  const vertices=sources.map((src,index)=>({
   index,sourcePointHandle:src.handle,sourcePointEndpoint:src.endpoint,
   uv:{...givenPoints[index]},incidentOriginalLineHandles:[]
  }));
  const lines=[],links=vertices.map(()=>new Set()),samePairs=new Map();
  for(const edge of givenLines){
   const a=edge.fromIndex,b=edge.toIndex,handle=edge.sourceHandle;
   vertices[a].incidentOriginalLineHandles.push(handle);
   vertices[b].incidentOriginalLineHandles.push(handle);
   links[a].add(b);links[b].add(a);
   const pair=[a,b].sort((x,y)=>x-y).join('|');
   if(!samePairs.has(pair))samePairs.set(pair,[]);
   samePairs.get(pair).push(handle);
   lines.push({
    view,sourceHandle:handle,sourceKind:edge.sourceKind,
    sourceLinetype:edge.sourceLinetype,fromIndex:a,toIndex:b,
    originalDXFConnectivityOnly:true,
    standardEngineeringLineStyle:'undetermined',
    certifiedM5Visibility:false,authorizedConstructionStep:false,
    signedV5Action:false
   });
  }
  const components=[],visited=new Set();
  for(let i=0;i<vertices.length;i++){
   if(visited.has(i))continue;
   const pending=[i],component=[];visited.add(i);
   while(pending.length){
    const current=pending.pop();component.push(current);
    for(const next of links[current]){
     if(!visited.has(next)){visited.add(next);pending.push(next);}
    }
   }
   components.push(component.sort((a,b)=>a-b));
  }
  views[view]={
   view,sourceRole:known?'GIVEN':'UNKNOWN',
   originalSourcePointCount:vertices.length,
   originalSourceLineCount:lines.length,
   originalLineInventoryExplicitlyReviewed:known&&
    packet.givenOriginalStrokes!==undefined,
   vertices,lines,connectedSourcePointIndexComponents:components,
   isolatedSourcePointIndices:vertices.filter(v=>
    !v.incidentOriginalLineHandles.length).map(v=>v.index),
   repeatedUnorientedSourceLinePairs:[...samePairs.entries()]
    .filter(([,handles])=>handles.length>1)
    .map(([pair,handles])=>({pointIndexPair:pair.split('|').map(Number),
     originalCADHandles:handles})),
   projectedCrossingsAreNeverAssumedToBeGraphJunctions:true,
   sourceTopologyIsNotCompletenessOrVisibilityProof:true,
   originalTextbookSourceCompletenessIndependentlyCertified:false,
   signedV5ActionCount:0
  };
 }
 return freeze({
  schema:'draftflow-c1-original-dxf-given-line-graph/1',
  sourceSha256:packet.sourceSha256,
  convertedDxfSha256:packet.convertedDxfSha256,
  missingView:packet.missingView,views,
  originalReferenceWasNotConsumed:true,
  originalSourceIsNotYetTextbookCertified:true,
  officialEngineeringLinesSigned:0
 });
}
module.exports={auditC1OriginalGivenLineGraph};
