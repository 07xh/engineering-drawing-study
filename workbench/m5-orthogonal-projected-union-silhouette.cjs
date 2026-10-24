'use strict';
/**
 * C2/M5. COMPLETE 2D projected occupancy boundary for the UNION of reviewed,
 * axis-aligned, bounded cuboids in first-angle V/H/W.
 *
 * Every cuboid's exact orthographic projection is a closed axis-aligned
 * rectangle. All source rectangle u/v bounds partition the plane into OPEN
 * grid cells with CONSTANT occupancy. A projected segment is on the union
 * boundary iff its two adjacent cells have different occupancy. Empty
 * grid components touching the outer grid border are the unbounded exterior;
 * remaining empty components are bounded holes, NOT the outer contour.
 *
 * This independently proves the complete silhouette of the PROJECTED SOLID
 * SET within the stated cuboid scope; it does NOT prove all internal visible
 * creases, all 3D Boolean feature provenance, standard solid/dashed hidden
 * strokes, endpoint animation continuity, or canonical V5 readiness.
 */
const {boxFromConfirmedConvexMesh}=
 require('../core/geometry/reviewed-box-contact-evidence.cjs');
const {project,VIEWS}=require('../core/projection/conventions.js');
const {auditExactPhysicalFeatureDedup}=
 require('./m5-exact-physical-feature-dedup.cjs');
const freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){
 for(const y of Object.values(x))freeze(y);
 Object.freeze(x);
}return x;};
const min=Math.min,max=Math.max;
const fail=message=>{throw new TypeError('M5 projected union silhouette: '+message);};
const key=(i,j)=>i+':'+j;
const distinct=values=>[...new Set(values)].sort((a,b)=>a-b);
const cover=({isVertical,fixed,lo,hi},edges)=>{
 const intervals=[];
 for(const line of edges){
  const a=line.from,b=line.to;
  if(isVertical?
    !(a.u===fixed&&b.u===fixed):
    !(a.v===fixed&&b.v===fixed))continue;
  const lower=isVertical?min(a.v,b.v):min(a.u,b.u),
   upper=isVertical?max(a.v,b.v):max(a.u,b.u);
  if(upper<=lo||lower>=hi)continue;
  intervals.push([max(lo,lower),min(hi,upper),line.id]);
 }
 intervals.sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
 let reached=lo;const ids=new Set();
 for(const [a,b,id] of intervals){
  if(a>reached)break;
  if(b>reached){reached=b;ids.add(id);}
  if(reached>=hi)break;
 }
 return {covered:reached>=hi,sourceIds:[...ids].sort()};
};
function auditOrthogonalProjectedUnionSilhouette({geometry,revision,
 projectedStrokePartitions,generatedSubspanRayEvidence,
 unifiedProjectedFeatureEventEvidence,unifiedPaperSourceIdentityEvidence,
 exactPhysicalDedupEvidence}={}){
 if(!Number.isSafeInteger(revision)||revision<0)
  fail('current geometry revision required');
 if(!Array.isArray(geometry)||geometry.length<2||geometry.length>8)
  fail('2..8 source solids required');
 const ids=new Set(),boxes=[];
 for(const g of geometry){
  if(!g||typeof g.id!=='string'||ids.has(g.id))fail('distinct current reviewed solid IDs required');
  ids.add(g.id);
  const box=boxFromConfirmedConvexMesh(g);
  if(!box)return freeze({schema:'draftai-m5-orthogonal-projected-union-silhouette/1',
   revision,status:'not-covered-non-orthogonal-solid',
   projectedViews:[],projectedBoundarySegmentCount:0,
   allProjectedOccupancyRegionBoundariesComplete:false,
   allBoundaryGeometryHasReviewedSourceCoverage:false,
   fullEngineeringDrawingLineStylesVerified:false,
   signedV5LineActions:0,v5Ready:false});
  boxes.push(box);
 }
 const source=auditExactPhysicalFeatureDedup({geometry,revision,
  projectedStrokePartitions,generatedSubspanRayEvidence,
  unifiedProjectedFeatureEventEvidence,unifiedPaperSourceIdentityEvidence});
 if(source.status!=='exact-current-original-generated-3d-physical-feature-classes'||
    JSON.stringify(source)!==JSON.stringify(exactPhysicalDedupEvidence)||
    source.officialLineStylesVerified!==false||
    source.signedV5LineActions!==0||source.v5Ready!==false)
  fail('stale or forged physical feature source dedup proof');
 const projectedViews=[];
 for(const view of VIEWS){
  const rectangles=boxes.map(box=>{
   const a=project(box.min)[view],b=project(box.max)[view];
   const u0=min(a.u,b.u),u1=max(a.u,b.u),
    v0=min(a.v,b.v),v1=max(a.v,b.v);
   if(![u0,u1,v0,v1].every(Number.isFinite)||
      !(u1>u0&&v1>v0))
    fail('finite positive area exact orthographic source rectangle required');
   return {sourceGeometryId:box.id,u0,u1,v0,v1};
  });
  const us=distinct(rectangles.flatMap(x=>[x.u0,x.u1])),
   vs=distinct(rectangles.flatMap(x=>[x.v0,x.v1])),
   nx=us.length-1,ny=vs.length-1;
  if(nx*ny>300||nx<=0||ny<=0)
   fail('bounded finite source plane occupancy cell arrangement required');
  const occupied=Array.from({length:nx},()=>Array(ny).fill(false));
  let occupiedCount=0,projectedArea=0;
  for(let i=0;i<nx;i++)for(let j=0;j<ny;j++){
   // Every projected rectangle boundary is a CUT: midpoint is an exact
   // representative of the entire open cell, not a sample approximation.
   const u=(us[i]+us[i+1])/2,v=(vs[j]+vs[j+1])/2;
   occupied[i][j]=rectangles.some(r=>
    u>r.u0&&u<r.u1&&v>r.v0&&v<r.v1);
   if(occupied[i][j]){
    occupiedCount++;
    projectedArea+=(us[i+1]-us[i])*(vs[j+1]-vs[j]);
   }
  }
  const exteriorEmpty=new Set(),queue=[];
  const seed=(i,j)=>{
   if(i<0||i>=nx||j<0||j>=ny||occupied[i][j])return;
   const k=key(i,j);
   if(exteriorEmpty.has(k))return;
   exteriorEmpty.add(k);queue.push([i,j]);
  };
  for(let i=0;i<nx;i++){seed(i,0);seed(i,ny-1);}
  for(let j=0;j<ny;j++){seed(0,j);seed(nx-1,j);}
  for(let z=0;z<queue.length;z++){
   const [i,j]=queue[z];
   seed(i-1,j);seed(i+1,j);seed(i,j-1);seed(i,j+1);
  }
  const sourceLines=source.groups.filter(g=>g.view===view).
   flatMap(g=>g.physicalFeatureClasses.map(c=>({
    id:c.key,
    from:project(c.physical3DFrom)[view],
    to:project(c.physical3DTo)[view]
   })));
  const boundaries=[];
  const maybeBoundary=(i,j,ni,nj,dir)=>{
   if(ni>=0&&ni<nx&&nj>=0&&nj<ny&&occupied[ni][nj])return;
   let a,b;
   if(dir==='left'){a={u:us[i],v:vs[j]};b={u:us[i],v:vs[j+1]};}
   else if(dir==='right'){a={u:us[i+1],v:vs[j]};b={u:us[i+1],v:vs[j+1]};}
   else if(dir==='bottom'){a={u:us[i],v:vs[j]};b={u:us[i+1],v:vs[j]};}
   else {a={u:us[i],v:vs[j+1]};b={u:us[i+1],v:vs[j+1]};}
   const outside=ni<0||ni>=nx||nj<0||nj>=ny||
     exteriorEmpty.has(key(ni,nj));
   const support=cover({isVertical:a.u===b.u,
    fixed:a.u===b.u?a.u:a.v,
    lo:a.u===b.u?a.v:a.u,
    hi:a.u===b.u?b.v:b.u},sourceLines);
   boundaries.push({id:'UnionSilhouette'+boundaries.length,view,
    projectedFromModelMm:a,projectedToModelMm:b,
    type:outside?'exterior-projected-region-boundary':
     'bounded-hole-projected-region-boundary',
    exactOpenCellOppositeOccupancyVerified:true,
    sourceGeometryIds:rectangles.map(r=>r.sourceGeometryId),
    originalOrGeneratedProjectedPhysicalSourceCoverageVerified:
     support.covered,
    matchingReviewedPhysicalSourceClassKeys:support.sourceIds,
    whole3DBooleanFeatureProvenanceAndOcclusionVerified:false,
    projectedEngineeringSolidDashedStyle:'undetermined',
    canonicalIntentDAGAndV5Approved:false});
  };
  for(let i=0;i<nx;i++)for(let j=0;j<ny;j++){
   if(!occupied[i][j])continue;
   maybeBoundary(i,j,i-1,j,'left');
   maybeBoundary(i,j,i+1,j,'right');
   maybeBoundary(i,j,i,j-1,'bottom');
   maybeBoundary(i,j,i,j+1,'top');
  }
  const allMatched=boundaries.every(x=>
   x.originalOrGeneratedProjectedPhysicalSourceCoverageVerified);
  const holeCount=boundaries.filter(x=>x.type===
   'bounded-hole-projected-region-boundary').length;
  projectedViews.push({view,
   projectedRectangles:rectangles,
   exactSourceUGrid:us,exactSourceVGrid:vs,
   openCellCount:nx*ny,filledOpenCellCount:occupiedCount,
   completeProjectedUnionAreaMm2:projectedArea,
   exteriorReachableEmptyCellCount:exteriorEmpty.size,
   boundaries,
   completeProjectedOccupancyRegionBoundaryVerified:true,
   outerBoundarySegmentCount:boundaries.length-holeCount,
   boundedHoleBoundarySegmentCount:holeCount,
   allProjectedBoundarySegmentsCoveredByReviewedFeatureSources:allMatched,
   completeDistinctFrontmost3DSourceStrokeAndHiddenLineAnalysis:false,
   officialLineStylesVerified:false,signedV5LineActions:0});
 }
 const segments=projectedViews.flatMap(v=>v.boundaries);
 return freeze({schema:'draftai-m5-orthogonal-projected-union-silhouette/1',
  revision,status:'complete-first-angle-orthogonal-projected-occupancy-boundary',
  sourceGeometryIds:geometry.map(x=>x.id),
  projectedViews,viewCount:projectedViews.length,
  projectedBoundarySegmentCount:segments.length,
  projectedExternalBoundarySegmentCount:segments.filter(x=>
   x.type==='exterior-projected-region-boundary').length,
  projectedHoleBoundarySegmentCount:segments.filter(x=>
   x.type==='bounded-hole-projected-region-boundary').length,
  sourceUncoveredProjectedBoundarySegmentCount:segments.filter(x=>
   !x.originalOrGeneratedProjectedPhysicalSourceCoverageVerified).length,
  allProjectedOccupancyRegionBoundariesComplete:true,
  allBoundaryGeometryHasReviewedSourceCoverage:segments.every(x=>
   x.originalOrGeneratedProjectedPhysicalSourceCoverageVerified),
  allOriginalAndGenerated3DSourceFeatureLineStylesCertified:false,
  internalVisibleHiddenDrawingLinesCertified:false,
  fullEngineeringDrawingLineStylesVerified:false,
  signedV5LineActions:0,v5Ready:false});
}
module.exports={auditOrthogonalProjectedUnionSilhouette};
