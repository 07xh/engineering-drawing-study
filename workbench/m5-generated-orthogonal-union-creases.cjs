'use strict';
/**
 * M5 C2: exact NEW open union crease from the intersection of two
 * PERPENDICULAR source box face planes (not an original mesh edge).
 *
 * Every source is revalidated through the existing M0-verified closed
 * axis-aligned cuboid adapter. Each pair contributes a candidate when the
 * FIRST face plane cuts strictly inside the SECOND box and vice versa on
 * the other transverse axis. Both source face identities survive.
 * Intersect the source finite axial caps, split at ALL scene axial face
 * events, and prove the union's infinitesimal four-quadrant occupancy on
 * each OPEN interval. Three occupied quadrants = a real concave union
 * feature; four = buried by another entity; near/tangent = undetermined.
 *
 * This is NOT a general boolean mesh/feature graph, and contains NO
 * approved final source endpoint joins, first-angle occlusion conclusions,
 * standardized solid/dashed lines, ConstructionIntent, DAG, or V5 action.
 */
const {boxFromConfirmedConvexMesh}=
 require('../core/geometry/reviewed-box-contact-evidence.cjs');
const {project,VIEWS}=require('../core/projection/conventions.js');
const AXES=['x','y','z'];
const freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){
 for(const child of Object.values(x))freeze(child);Object.freeze(x);
}return x;};
const between=(x,lo,hi)=>x>lo&&x<hi;
const pt=(axis,lo,hi,fixed)=>Object.fromEntries(AXES.map(k=>
 [k,k===axis?lo:fixed[k]]));
function proveGeneratedOrthogonalUnionCreases({geometry,revision}={}){
 if(!Number.isSafeInteger(revision)||revision<0)
  throw new TypeError('current source revision required');
 if(!Array.isArray(geometry)||geometry.length<2||geometry.length>8)
  throw new TypeError('two to eight reviewed source solids required');
 const ids=new Set(),boxes=[];
 for(const g of geometry){
  if(!g||typeof g.id!=='string'||ids.has(g.id))
   throw new TypeError('duplicate or missing source Geometry identity');
  ids.add(g.id);
  const box=boxFromConfirmedConvexMesh(g);
  if(!box)return freeze({schema:'draftai-m5-generated-orthogonal-union-creases/1',
   revision,status:'not-covered-non-cuboid',sourceGeometryIds:[...ids],
   segments:[],segmentCount:0,certifiedNewConcaveOpenCount:0,
   buriedNewFaceIntersectionCount:0,uncertainCount:0,
   sourceFaceIntersectionsComplete:false,
   generatedFeatureV5Ready:false,officialLineStylesVerified:false});
  boxes.push(box);
 }
 const maxTol=Math.max(...boxes.map(b=>b.toleranceMm));
 const candidates=[];
 for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){
  const A=boxes[i],B=boxes[j];
  for(const axisA of AXES)for(const axisB of AXES){
   if(axisA===axisB)continue;
   const along=AXES.find(k=>k!==axisA&&k!==axisB);
   const low=Math.max(A.min[along],B.min[along]);
   const high=Math.min(A.max[along],B.max[along]);
   if(high-low<=maxTol)continue;
   for(const sideA of ['min','max'])for(const sideB of ['min','max']){
    const coordA=A[sideA][axisA],coordB=B[sideB][axisB];
    // The pair's face-plane crossing must be new, not an original
    // 3D vertex/edge already present at either source face boundary.
    if(!between(coordA,B.min[axisA],B.max[axisA])||
       !between(coordB,A.min[axisB],A.max[axisB]))continue;
    const close=Math.min(
     coordA-B.min[axisA],B.max[axisA]-coordA,
     coordB-A.min[axisB],A.max[axisB]-coordB);
    const nearCritical=close<=maxTol;
    const fixed={[axisA]:coordA,[axisB]:coordB};
    const cut=[low,high];
    for(const body of boxes)for(const bound of [
     body.min[along],body.max[along]]){
     if(bound>low&&bound<high)cut.push(bound);
    }
    const events=[...new Set(cut)].sort((a,b)=>a-b);
    if(events.length>20)throw new RangeError(
     'finite source-face event complexity budget exceeded');
    const sourceFacePlanes=[
     {sourceGeometryId:A.id,axis:axisA,side:sideA,valueMm:coordA},
     {sourceGeometryId:B.id,axis:axisB,side:sideB,valueMm:coordB}
    ];
    for(let k=0;k<events.length-1;k++){
     const lo=events[k],hi=events[k+1],mid=(lo+hi)/2;
     let undecided=nearCritical||hi-lo<=2*maxTol;
     const mask=[];
     for(const signA of [-1,1])for(const signB of [-1,1]){
      let occupied=false;
      for(const body of boxes){
       if(mid<=body.min[along]||mid>=body.max[along]){
        if(Math.abs(mid-body.min[along])<=maxTol||
           Math.abs(mid-body.max[along])<=maxTol)undecided=true;
        continue;
       }
       let inside=true;
       for(const [axis,coord,sign] of [
        [axisA,coordA,signA],[axisB,coordB,signB]]){
        const l=body.min[axis],h=body.max[axis];
        if(coord<l||coord>h){
         if(Math.min(Math.abs(coord-l),Math.abs(coord-h))<=maxTol)
          undecided=true;
         inside=false;break;
        }
        if(coord===l){if(sign!==1)inside=false;}
        else if(coord===h){if(sign!==-1)inside=false;}
        else if(Math.min(coord-l,h-coord)<=maxTol){
         undecided=true;inside=false;break;
        }
       }
       if(inside)occupied=true;
      }
      mask.push(occupied);
     }
     const count=mask.filter(Boolean).length;
     // Two perpendicular source face halfspaces in their mutual
     // interiors always cover at least 3 quadrants. Anything else is
     // outside the strictly positive reviewed theorem.
     const status=undecided||count<3?
      'undetermined-near-critical-source-face-events':
      count===3?'certified-new-concave-union-open-crease':
      count===4?'certified-new-face-intersection-buried-in-union':
      'undetermined-nonmanifold-generated-feature';
     const from=pt(along,lo,hi,fixed),to=pt(along,hi,lo,fixed);
     const projected=Object.fromEntries(VIEWS.map(v=>{
      const p=project(from)[v],q=project(to)[v];
      return [v,{from:p,to:q,kind:
       p.u===q.u&&p.v===q.v?'collapsed-point':'source-line-candidate',
       standardLineStyle:'undetermined',
       completeForwardRayAndEndpointProofVerified:false}];
     }));
     const sourceCapEndEvents=[lo,hi].map(x=>boxes.filter(body=>
      x===body.min[along]||x===body.max[along]).map(body=>({
       sourceGeometryId:body.id,axis:along,coordinateMm:x})));
     const id='new:'+A.id+':'+axisA+sideA+'+'+B.id+':'+
      axisB+sideB+':'+along+':'+k;
     candidates.push({id,revision,
      sourceGeometryIds:[A.id,B.id],sourceFacePlanes,
      originalSourceMeshEdgeId:null,generatedByTwoSourceFacePlanes:true,
      sourceAxis:along,sourceParameterOpenRangeMm:[lo,hi],
      source3DFrom:from,source3DTo:to,
      sourceCapEndEvents,
      supportingFacePlaneIncidenceIndependentlyVerified:true,
      originalSourceMeshVertexInferred:false,
      originalSourceMeshEdgeInferred:false,
      sourceCutEventsCoverWholeFiniteAxisOpenRange:true,
      allSceneOpaqueSolidsIncluded:boxes.length===geometry.length,
      quadrantInsideSolidUnion:mask,occupiedQuadrantCount:count,
      status,positiveNewConcaveUnionOpenFeatureVerified:
       status==='certified-new-concave-union-open-crease',
      positiveNewFeatureBuriedVerified:
       status==='certified-new-face-intersection-buried-in-union',
      projected,
      allGeneratedUnionFeatureLinesEnumerated:false,
      originalAndNovelFeatureEndpointTopologyVerified:false,
      entireProjectedContourAndDepthVerified:false,
      officialEngineeringLineStyle:'undetermined',
      officialConstructionStepV5ActionAuthorized:false});
    }
   }
  }
 }
 if(candidates.length>400)throw new RangeError(
  'generated face intersection witness budget exceeded');
 return freeze({schema:'draftai-m5-generated-orthogonal-union-creases/1',
  revision,status:'scoped-pairwise-new-perpendicular-face-open-features',
  sourceGeometryIds:geometry.map(g=>g.id),
  segments:candidates,segmentCount:candidates.length,
  certifiedNewConcaveOpenCount:candidates.filter(s=>
   s.positiveNewConcaveUnionOpenFeatureVerified).length,
  buriedNewFaceIntersectionCount:candidates.filter(s=>
   s.positiveNewFeatureBuriedVerified).length,
  uncertainCount:candidates.filter(s=>s.status.startsWith('undetermined')).length,
  noOriginalSourceMeshEdgeSubstituted:true,
  sourceFaceIntersectionsCompleteWithinPairwiseScope:true,
  allBooleanUnionGeneratedFeaturesComplete:false,
  allGeneratedStrokeEndpointJoinsVerified:false,
  entireMultiViewOcclusionVerified:false,
  officialLineStylesVerified:false,generatedFeatureV5Ready:false});
}
module.exports={proveGeneratedOrthogonalUnionCreases};
