'use strict';
/**
 * C1: one user-identified AB segment from two corresponded first-angle views.
 * Reuses the accepted 03 M3 point solver, the canonical Geometry Scene and
 * the SINGLE existing point ConstructionIntent/DAG/V5. An AB line only has a
 * geometrical projection preview: no visibility or certified line-style proof.
 */
const {compileConfirmedTwoPoint}=require('./confirmed-two-point-v5.cjs');
const {solveProjection}=require('../engines/projection/point-projection.cjs');
const {deriveGeometryScene}=require('../core/projection/geometry-scene-views.cjs');
const {VIEWS,project,toSheet}=require('../core/projection/conventions.js');

function compileReviewedSegmentPreview(input){
 const compiled=compileConfirmedTwoPoint(input); // formal M3 → Intent/DAG → one V5
 const endpoints=new Map(),sources=new Set();
 for(const record of compiled.points){
  const p=input.points.find(p=>p.id===record.id);
  if(!p)throw new TypeError('lost reviewed point correspondence');
  const views=p.knownViews;
  if(views){
   sources.add(Object.keys(views).sort().join(''));
  }else sources.add('XYZ');
  const solved=solveProjection({
   ...(views?{knownViews:views}:{knownPoint:{x:p.x,y:p.y,z:p.z}}),
   sheetTransform:input.sheetTransform
  }); // independent public M3 recheck: never infer geometry from drawn frames
  if(solved.status!=='unique'||solved.globallyUnique!==true||
    solved.solutionCount!==1||!solved.point||
    !Number.isFinite(solved.maxResidual)||solved.maxResidual>1e-8)
   throw new RangeError('segment endpoint lacks unique 03 projection proof');
  endpoints.set(record.id,solved.point);
 }
 // Two unrelated pairs may describe two points, but not a single reviewed
 // segment topology from a COMMON pair of orthographic source views.
 if(sources.size!==1)
  throw new RangeError('AB endpoints require the same confirmed source-view pair');
 const a=endpoints.get('A'),b=endpoints.get('B');
 if(!a||!b||!Number.isFinite(Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z))||
   Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z)<=1e-9)
  throw new RangeError('zero-length or non-finite AB segment is not a model edge');
 const scene=deriveGeometryScene({revision:input.revision,
  geometry:[{id:'SegmentAB',kind:'segment',space:'model-3d',unit:'mm',
   data:{start:{...a},end:{...b}}}]});
 const rep=scene.objects[0].representations;
 const px={},views={};
 for(const v of VIEWS){
  const start=project(a)[v],end=project(b)[v];
  const projected=rep[v];
  if(projected.kind==='segment'){
   for(const key of ['u','v']){
    if(Math.abs(projected.start[key]-start[key])>1e-8||
       Math.abs(projected.end[key]-end[key])>1e-8)
     throw new RangeError('geometry scene first-angle projection disagrees with M3');
   }
  }else if(projected.kind==='point'){
   if(Math.hypot(start.u-end.u,start.v-end.v)>1e-12)
    throw new RangeError('segment incorrectly collapsed in projected view');
  }else throw new RangeError('unsupported AB segment projection');
  views[v]={...projected};
  px[v]={from:toSheet(v,start,input.sheetTransform),
   to:toSheet(v,end,input.sheetTransform),collapsed:projected.kind==='point'};
 }
 const segmentPreview=Object.freeze({
  id:'SegmentAB',revision:input.revision,
  provenance:'user-confirmed-A-B-correspondence + 03-M3 + canonical-Geometry-Scene',
  kind:'segment',unit:'mm',geometry:scene.objects[0].model,
  scene,views,screen: px,
  projectionVerifiedWithinIdentifiedEndpoints:true,
  visibility:'undetermined',lineStyle:'undetermined',
  certifiedAsConstructionStep:false,officialV5SegmentReady:false,
  solidReconstructionVerified:false
 });
 return Object.freeze({...compiled,segmentPreview});
}
module.exports={compileReviewedSegmentPreview};
