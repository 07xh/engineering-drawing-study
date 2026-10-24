'use strict';
/**
 * C2/M5: exact local cross-section of the UNION of bounded, individually
 * verified axis-aligned convex cuboids along every ORIGINAL physical crease.
 *
 * A true union feature cannot be inferred from the crease of one constituent:
 * another box can bury it, continue its face flat, or introduce a re-entrant
 * union crease. On an OPEN source-edge parameter interval, all cuboids have
 * constant axial interior membership after splitting at every other box's
 * min/max on that axis. Their transverse epsilon-neighborhood occupancy is
 * determined by the exact signs of comparisons to the fixed edge coordinates.
 * No midpoint image ray or 2D line overlap is used to invent 3D adjacency.
 *
 * Four quadrant mask proof (perpendicular to the edge):
 * 1 inside = external 90-degree convex union crease;
 * 3 inside = external 270-degree re-entrant union crease;
 * 2 adjacent = smooth/flat union boundary, original edge disappears;
 * 4 inside = buried interior edge;
 * 2 diagonally opposite = non-manifold contact, NOT certified;
 * all near-critical boundaries, cap events, and non-cuboid shapes = held.
 *
 * The proof applies on OPEN interval interiors. The t=0/1 edge endpoints,
 * newly CREATED contact-feature edges, complete projected contour,
 * engineering stroke conventions and sole V5 are NOT certified here.
 */
const {boxFromConfirmedConvexMesh}=
 require('../core/geometry/reviewed-box-contact-evidence.cjs');
const {auditReviewedConvexSourceCreases}=
 require('./m5-reviewed-convex-source-creases.cjs');
const freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){
 for(const child of Object.values(x))freeze(child);Object.freeze(x);
}return x;};
const AXES=['x','y','z'];
const near=(a,b,t)=>Math.abs(a-b)<=t;
function auditOrthogonalUnionSourceEdges({geometry,revision}={}){
 if(!Number.isSafeInteger(revision)||revision<0)
  throw new TypeError('current M5 union geometry revision required');
 if(!Array.isArray(geometry)||geometry.length<1||geometry.length>8)
  throw new TypeError('one to eight reviewed closed convex bodies required');
 const ids=new Set(),boxes=[],creases=[];
 for(const g of geometry){
  if(!g||ids.has(g.id)||typeof g.id!=='string')
   throw new TypeError('duplicate or missing source Geometry identity');
  ids.add(g.id);
  const box=boxFromConfirmedConvexMesh(g);
  if(!box)return freeze({schema:'draftai-m5-orthogonal-union-source-edges/1',
   revision,status:'not-covered-non-cuboid',sourceGeometryIds:geometry.map(s=>s.id),
   edges:[],intervalCount:0,verifiedConvexOpenCreaseCount:0,
   verifiedConcaveOpenCreaseCount:0,flatNoCreaseCount:0,
   buriedSourceIntervalCount:0,ambiguousCount:0,
   globalLineStylesVerified:false,v5Ready:false});
  boxes.push(box);
  creases.push(auditReviewedConvexSourceCreases({geometry:g,revision}));
 }
 const byId=new Map(boxes.map(b=>[b.id,b])),rows=[];
 for(const [meshIndex,g] of geometry.entries()){
  const base=boxes[meshIndex],creaseMap=new Map(
   creases[meshIndex].edges.map(e=>[e.sourceEdgeId,e]));
  for(const [startId,endId] of g.data.edges){
   const a=g.data.points[startId],b=g.data.points[endId],
    sourceEdgeId=g.id+'::'+[startId,endId].sort().join('|'),
    sourceCrease=creaseMap.get(sourceEdgeId);
   if(!sourceCrease)throw new RangeError('missing independent two-face source crease proof');
   const axisDiff=AXES.filter(k=>a[k]!==b[k]);
   const axis=axisDiff[0],transverse=AXES.filter(k=>k!==axis);
   const orthogonal=axisDiff.length===1&&
     transverse.every(k=>a[k]===b[k]&&
      (a[k]===base.min[k]||a[k]===base.max[k]));
   const baseRow={sourceGeometryId:g.id,sourceEdgeId,
    sourceVertexIds:[startId,endId],originalSourceEdge3D:[{...a},{...b}],
    singleSourceDihedralCreaseVerified:
     sourceCrease.sourceIsPhysicalCreaseWithinSingleSolid,
    sourceCoplanarSubdivisionVerified:
     sourceCrease.sourceIsCoplanarSubdivisionWithinSingleSolid,
    axis:orthogonal?axis:null,orthogonalLocalSectorScopeVerified:orthogonal,
    subintervals:[],allOpenIntervalsClassified:false,
    completeFinalSourceFeatureVerified:false,
    standardLineStyle:'undetermined',v5LineActionSigned:false};
   if(!orthogonal||!sourceCrease.sourceIsPhysicalCreaseWithinSingleSolid){
    rows.push({...baseRow,status:'not-covered-original-edge',reason:
     !orthogonal?'not-an-exact-original-orthogonal-cuboid-edge':
      'original-mesh-edge-is-not-proven-physical-crease'});
    continue;
   }
   const delta=b[axis]-a[axis],tol=Math.max(...boxes.map(q=>q.toleranceMm));
   if(!Number.isFinite(delta)||Math.abs(delta)<=tol)
    throw new RangeError('degenerate original source crease cannot be partitioned');
   const cuts=[0,1];
   for(const box of boxes)for(const coord of [box.min[axis],box.max[axis]]){
    const t=(coord-a[axis])/delta;
    if(t>0&&t<1)cuts.push(t);
   }
   cuts.sort((x,y)=>x-y);
   const unique=cuts.filter((t,i)=>!i||t!==cuts[i-1]);
   if(unique.length>18)throw new RangeError('bounded exact interval event budget exceeded');
   const subintervals=[];
   for(let i=0;i<unique.length-1;i++){
    const lo=unique[i],hi=unique[i+1],t=(lo+hi)/2,
     axial=a[axis]+t*delta,
     thin=Math.abs(delta)*(hi-lo)<=2*tol;
    let ambiguous=thin;
    const sectorMask=[];
    // Represent the exact infinitesimal transverse cross-section as four
    // named quadrants. Occupancy includes the source cuboid itself.
    for(const s0 of [-1,1])for(const s1 of [-1,1]){
     let occupied=false;
     for(const box of boxes){
      if(axial<=box.min[axis]||axial>=box.max[axis]){
       if(near(axial,box.min[axis],tol)||near(axial,box.max[axis],tol))
        ambiguous=true;
       continue;
      }
      let within=true;
      for(const [j,sign] of [[0,s0],[1,s1]]){
       const coord=a[transverse[j]],k=transverse[j],
        min=box.min[k],max=box.max[k];
       if(coord<min||coord>max){
        if(near(coord,min,tol)||near(coord,max,tol))ambiguous=true;
        within=false;break;
       }
       if(coord===min&&sign!==1)within=false;
       else if(coord===max&&sign!==-1)within=false;
       else if(coord!==min&&coord!==max&&
         (near(coord,min,tol)||near(coord,max,tol))){
        ambiguous=true;within=false;break;
       }
      }
      if(within)occupied=true;
     }
     sectorMask.push(occupied);
    }
    const n=sectorMask.filter(Boolean).length;
    if(!n)throw new RangeError('original source boundary has no verified occupied sector');
    const occupiedIndices=sectorMask.flatMap((v,i)=>v?[i]:[]);
    const adjacent=n===2&&
     (Math.abs(occupiedIndices[0]-occupiedIndices[1])===1||
       Math.abs(occupiedIndices[0]-occupiedIndices[1])===2);
    const status=ambiguous?'undetermined-near-critical-cross-section':
     n===1?'certified-convex-exterior-open-crease':
     n===3?'certified-concave-exterior-open-crease':
     n===4?'certified-source-crease-buried-inside-union':
     adjacent?'certified-flat-union-boundary-no-crease':
     'undetermined-nonmanifold-quadrant-touch';
    const external=status==='certified-convex-exterior-open-crease'||
       status==='certified-concave-exterior-open-crease';
    subintervals.push({
     id:sourceEdgeId+'@'+i,revision,sourceEdgeId,
     sourceParameterOpenRange:[lo,hi],
     source3DFrom:Object.fromEntries(AXES.map(k=>[k,
       a[k]+lo*(b[k]-a[k])])),
     source3DTo:Object.fromEntries(AXES.map(k=>[k,
       a[k]+hi*(b[k]-a[k])])),
     sourceAxis:axis,sourceAxialInteriorWitness:axial,
     transverseAxes:[...transverse],
     quadrantInsideSolidUnion:[...sectorMask],
     occupiedQuadrantCount:n,
     sourceCrossSectionEventComplete:true,
     positiveUnionExternalCreaseVerified:external,
     positiveUnionBuriedOrFlatVerified:
       status==='certified-source-crease-buried-inside-union'||
       status==='certified-flat-union-boundary-no-crease',
     status,originalSourceEndpointJunctionsVerified:false,
     novelUnionIntersectionFeaturesVerified:false,
     projectedContourAndFullDepthVerified:false,
     standardVisibleHiddenLineStyle:'undetermined',
     canonicalV5LineActionAuthorized:false
    });
   }
   if(subintervals.length<1||subintervals[0].sourceParameterOpenRange[0]!==0||
      subintervals.at(-1).sourceParameterOpenRange[1]!==1||
      subintervals.some((x,i)=>i&&
       x.sourceParameterOpenRange[0]!==subintervals[i-1].sourceParameterOpenRange[1]))
    throw new RangeError('source edge parameter partition incompletely covered');
   rows.push({...baseRow,status:'source-crease-local-union-quadrants-audited',
    subintervals,allOpenIntervalsClassified:subintervals.every(s=>
     !s.status.startsWith('undetermined')),
    completeFinalSourceFeatureVerified:false});
  }
 }
 const intervals=rows.flatMap(r=>r.subintervals);
 return freeze({
  schema:'draftai-m5-orthogonal-union-source-edges/1',
  revision,status:'source-orthogonal-union-open-sector-coverage',
  sourceGeometryIds:geometry.map(g=>g.id),
  edges:rows,sourceEdgeCount:rows.length,intervalCount:intervals.length,
  verifiedConvexOpenCreaseCount:intervals.filter(s=>
   s.status==='certified-convex-exterior-open-crease').length,
  verifiedConcaveOpenCreaseCount:intervals.filter(s=>
   s.status==='certified-concave-exterior-open-crease').length,
  flatNoCreaseCount:intervals.filter(s=>
   s.status==='certified-flat-union-boundary-no-crease').length,
  buriedSourceIntervalCount:intervals.filter(s=>
   s.status==='certified-source-crease-buried-inside-union').length,
  ambiguousCount:intervals.filter(s=>s.status.startsWith('undetermined')).length,
  allOriginal3DFeatureBreakpointsVerified:false,
  allGeneratedUnionFeatureEdgesVerified:false,
  completeDepthAndContourVerified:false,
  globalLineStylesVerified:false,v5Ready:false
 });
}
module.exports={auditOrthogonalUnionSourceEdges};
