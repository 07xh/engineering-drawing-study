'use strict';
/**
 * C2: mathematically reviewed COMMON FACE PATCHES between closed convex
 * axis-aligned cuboids, with M5's already-recomputed projected-union coverage.
 *
 * A patch's strict interior is not exposed on the two-body union. Its border
 * may or may not be an apparent edge; this NEVER licenses suppressing a
 * perimeter edge, asserting hidden-line styles, or emitting V5 actions.
 * No new depth renderer or boolean mesh construction.
 */
const {evaluateReviewedBoxContacts,boxFromConfirmedConvexMesh}=
 require('../core/geometry/reviewed-box-contact-evidence.cjs');
const {project,VIEWS}=require('../core/projection/conventions.js');
const finite=Number.isFinite,AXES=['x','y','z'];
const freeze=v=>{if(v&&typeof v==='object'&&!Object.isFrozen(v)){
 for(const x of Object.values(v))freeze(x);Object.freeze(v);
}return v;};
function evaluateReviewedCompositeInterfaces({geometry,revision,contactEvidence,sceneDepthEvidence}={}){
 if(!Number.isSafeInteger(revision)||revision<0||!Array.isArray(geometry))
  throw new TypeError('current source geometry and revision required');
 // Refuse stale or client-written contact evidence. Source mesh topology is
 // re-checked through M0 closed-convex proof inside evaluateReviewedBoxContacts.
 const fresh=evaluateReviewedBoxContacts({geometry,revision});
 if(!contactEvidence||JSON.stringify(contactEvidence)!==JSON.stringify(fresh))
  throw new TypeError('source contact relation is outdated or substituted');
 if(!sceneDepthEvidence||sceneDepthEvidence.revision!==revision||
    !['scoped-face-probes-only','not-covered'].includes(sceneDepthEvidence.status))
  throw new TypeError('current M5 source visibility audit required');
 const boxMap=new Map();
 for(const g of geometry){
  const b=g?.kind==='mesh'?boxFromConfirmedConvexMesh(g):null;
  if(b)boxMap.set(g.id,b);
 }
 const patches=[];
 for(const pair of fresh.pairs){
  if(pair.relation!=='face-contact')continue;
  const [a,b]=pair.objectIds.map(id=>boxMap.get(id));
  if(!a||!b)throw new RangeError('face-contact source boxes not found');
  const axis=AXES.find(k=>pair.axisOverlapMm[k]===0);
  if(!axis)throw new RangeError('no exact source contact plane');
  const plane=a.max[axis]===b.min[axis]?a.max[axis]:
    b.max[axis]===a.min[axis]?b.max[axis]:null;
  if(plane===null)throw new RangeError('source cuboids lack common exact face');
  const others=AXES.filter(k=>k!==axis),limits=others.map(k=>
    [Math.max(a.min[k],b.min[k]),Math.min(a.max[k],b.max[k])]);
  const lengths=limits.map(([lo,hi])=>hi-lo),areaMm2=lengths[0]*lengths[1];
  if(!lengths.every(v=>finite(v)&&v>0)||!finite(areaMm2)||areaMm2<=0)
   throw new RangeError('contact face lacks positive-area rectangular interior');
  const corners=[];
  for(const i of [0,1])for(const j of [0,1]){
   corners.push({[axis]:plane,[others[0]]:limits[0][i],
    [others[1]]:limits[1][j]});
  }
  const projection=Object.fromEntries(VIEWS.map(v=>
   [v,corners.map(p=>project(p)[v])]));
  // Exact 3D contact-rectangle side incidence relative to EACH verified
  // original face boundary, rather than guessing a junction from 2D overlap.
  // A cut within one face need not lie on any original mesh edge.
  const boundarySegments=[];
  for(let k=0;k<2;k++)for(let side=0;side<2;side++){
   const fixedAxis=others[k],sweepAxis=others[1-k],fixed=limits[k][side];
   const from={[axis]:plane,[fixedAxis]:fixed,[sweepAxis]:limits[1-k][0]};
   const to={[axis]:plane,[fixedAxis]:fixed,[sweepAxis]:limits[1-k][1]};
   const onA=fixed===a.min[fixedAxis]||fixed===a.max[fixedAxis];
   const onB=fixed===b.min[fixedAxis]||fixed===b.max[fixedAxis];
   const sourceFaceBoundaryClass=onA&&onB?
     'shared-original-face-boundaries':onA||onB?
     'single-original-face-boundary':'interior-face-cut';
   const projected=Object.fromEntries(VIEWS.map(view=>{
    const p=project(from)[view],q=project(to)[view];
    return [view,{kind:p.u===q.u&&p.v===q.v?'point':'segment',
      from:p,to:q,physicalSourceEdgeNotProvenVisible:true,
      standardLineStyle:'undetermined'}];
   }));
   boundarySegments.push({id:pair.objectIds.join('_')+'_'+k+'_'+side,
    fixedAxis,variableAxis:sweepAxis,from3D:from,to3D:to,
    originalSourceFaceBoundaryContainment:{[a.id]:onA,[b.id]:onB},
    sourceFaceBoundaryClass,projections:projected,
    complete3DSourceJoinVerified:false,
    fullSegmentVisibilityVerified:false,officialLineStyleVerified:false});
  }
  patches.push({objectIds:[...pair.objectIds],axis,coordinateMm:plane,
   strictInteriorAreaMm2:areaMm2,otherAxisIntervalsMm:
     Object.fromEntries(others.map((a,i)=>[a,[...limits[i]]])),
   source3DCorners:corners,projectedCornerWitnesses:projection,
   boundarySegments,sourceBoundaryIncidenceVerifiedWithinCuboidScope:true,
   interiorPatchNotExteriorToUnion:true,
   patchPerimeterLineStyle:'undetermined',
   junctionContinuityVerified:false,visibleHiddenLineStylesVerified:false});
 }
 const union=sceneDepthEvidence.projectedUnionOutlines;
 const projectedUnionEvidence=union&&union.revision===revision?
  {status:union.status,
   segmentCount:union.segmentCount??0,
   openBoundaryCount:union.openBoundaryCount??0,
   coveredBoundaryCount:union.coveredBoundaryCount??0,
   undeterminedCount:union.undeterminedCount??0,
   unionClosedContourVerified:union.unionClosedContourVerified===true,
   multiBody3DVisibilityVerified:union.multiBody3DVisibilityVerified===true,
   officialLineStylesVerified:union.officialLineStylesVerified===true}:
  {status:'not-covered',segmentCount:0,
   openBoundaryCount:0,coveredBoundaryCount:0,undeterminedCount:0,
   unionClosedContourVerified:false,multiBody3DVisibilityVerified:false,
   officialLineStylesVerified:false};
 // The M5 projected union explicitly withholds depth and endpoint joins.
 // A future M5 gate, not this contact-patch summarizer, owns formal line style.
 return freeze({schema:'draftai-reviewed-composite-interface/1',
  revision,status:patches.length?'partial-shared-face-proof':'no-proven-face-patches',
  sourceGeometryIds:[...boxMap.keys()],patches,contactPatchCount:patches.length,
  contactBoundarySegmentCount:patches.reduce((n,p)=>n+p.boundarySegments.length,0),
  sourceBoundaryIncidenceProofScope:'exact-closed-axis-aligned-cuboid-face-patches',
  projectedUnionEvidence,
  interiorContactFaceVerifiedWithinScope:patches.length>0,
  canEraseSourceBoundaryEdges:false,allJunctionsVerified:false,
  officialLineStylesVerified:false,canonicalConstructionReady:false,
  v5Ready:false});
}
module.exports={evaluateReviewedCompositeInterfaces};
