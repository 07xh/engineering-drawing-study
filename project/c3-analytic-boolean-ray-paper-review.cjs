'use strict';
/**
 * C3 DISPLAY-ONLY consumer of the CURRENT M3 analytic source curves and
 * already-certified M5 strict-volume OPEN ray intervals.
 *
 * The source path is not redrawn as polyline geometry and no second V5
 * player or certified line style is constructed. Closed endpoints, source
 * graph crossings and true final projected visibility remain unsigned.
 */
const {validAnalyticCurve3D}=require('../core/geometry/analytic-curve-3d.cjs');
const {VIEWS}=require('../core/projection/conventions.js');
const freeze=o=>{if(o&&typeof o==='object'&&!Object.isFrozen(o)){
 for(const v of Object.values(o))freeze(v);Object.freeze(o);
}return o;};
function reviewC3AnalyticBooleanRayPaper({
 linked,sourceM3,selectedRays,revision,solidOperation
}={}){
 if(!Number.isSafeInteger(revision)||revision<0||
   ![null,'union','intersection'].includes(solidOperation))
  throw new TypeError('C3 current reviewed geometry revision and Boolean operation required');
 if(solidOperation===null)return null;
 if(linked?.schema!=='draftai-c3-3d-vhw-linked-scene/1'||
    linked.revision!==revision||
    linked.officialLineStylesVerified!==false||
    linked.entireCurveV5Ready!==false||
    sourceM3?.status!=='scoped-analytic-ready'||
    !Array.isArray(sourceM3.branches)||
    sourceM3.branchCount!==sourceM3.branches.length||
    selectedRays?.schema!=='draftai-c3-boolean-VHW-open-rays/1'||
    selectedRays.revision!==revision||
    selectedRays.solidOperation!==solidOperation||
    selectedRays.fullSourceOpenEdgeRayCoverageVerified!==true||
    selectedRays.officialLineStylesVerified!==false||
    selectedRays.finalV5CurveAuthorized!==false)
  throw new Error('C3 selected M5 Boolean open-ray proof and original M3 scene mismatch');
 const originals=new Map();
 for(const group of linked.groups.filter(g=>
  g.role==='analytic-lateral-intersection')){
  const obj=linked.scene.objects.find(o=>o.id===group.geometryId);
  if(!obj||obj.kind!=='analytic-curve'||obj.space!=='model-3d'||
     obj.model?.unit!=='mm'||!validAnalyticCurve3D(obj.model?.data)||
     group.sourceMathVerified!==true||
     group.certifiedEngineeringStroke!==false||
     originals.has(group.branchId))
   throw new Error('C3 ambiguous original source curve/Geometry identity');
  originals.set(group.branchId,{group,obj});
 }
 if(originals.size!==sourceM3.branchCount)
  throw new Error('C3 original analytic branch inventory incomplete');
 const rays=selectedRays.intervals.filter(row=>row.sourceKind==='analytic-curve');
 const expected=sourceM3.branchCount*VIEWS.length;
 if(rays.length<expected||rays.length>expected*6)
  throw new Error('C3 selected ray evidence lacks complete bounded curve inventory');
 const records=[];
 for(const branch of sourceM3.branches){
  const source=originals.get(branch.id);
  if(!source||source.obj.model.data.parameter.from!==branch.xRange[0]||
     source.obj.model.data.parameter.to!==branch.xRange[1])
   throw new Error('C3 source curve parameter/domain differs from original M3');
  for(const view of VIEWS){
   const parts=rays.filter(x=>x.sourceId===branch.id&&x.view===view)
    .sort((a,b)=>a.openParameterRange[0]-b.openParameterRange[0]);
   if(!parts.length||parts[0].openParameterRange[0]!==branch.xRange[0]||
      parts.at(-1).openParameterRange[1]!==branch.xRange[1]||
      parts.some((part,i)=>part.parameterKind!=='x'||
       part.sourceFirstAngleRayEntireIntervalProven!==true||
       !['strict-interior-ray-clear','opaque-interior-ahead'].includes(
         part.openInteriorVolumeRayStatus)||
       part.switchingPointsAndEndpointsCertified!==false||
       part.standardLineStyle!=='undetermined'||
       part.finalV5StrokeAuthorized!==false||
       part.openParameterRange.length!==2||
       !(part.openParameterRange[1]>part.openParameterRange[0])||
       (i>0&&part.openParameterRange[0]!==parts[i-1].openParameterRange[1])))
    throw new Error('C3 exact continuous source ray partitions have a gap or contradictory signed edge');
   for(const part of parts){
    records.push({
     branchId:branch.id,geometryId:source.group.geometryId,
     view,sourceEdgeId:part.edgeId,revision,
     xOpenRange:[...part.openParameterRange],
     originalCoordinates:source.obj.model.data.coordinates,
     strictVolumeRayStatus:part.openInteriorVolumeRayStatus,
     sourceFirstAngleRayEntireIntervalProven:true,
     projectedFeatureCoincidenceStillUnresolved:true,
     closedEndpointVisibilityCertified:false,
     engineeringLineStyle:'undetermined',formalV5StrokeApproved:false
    });
   }
  }
 }
 if(records.length!==rays.length||
    records.filter(x=>x.strictVolumeRayStatus==='strict-interior-ray-clear').length>
     selectedRays.certifiedClearCount||
    records.filter(x=>x.strictVolumeRayStatus==='opaque-interior-ahead').length>
     selectedRays.certifiedOpaqueCount)
  throw new Error('C3 M5 source ray record conservation failed');
 return freeze({
  schema:'draftai-c3-first-angle-analytic-open-ray-paper/1',
  revision,solidOperation,
  originalBranchCount:sourceM3.branchCount,
  sourceParameterIntervalCount:records.length,
  clearOpenIntervals:records.filter(x=>
   x.strictVolumeRayStatus==='strict-interior-ray-clear').length,
  opaqueOpenIntervals:records.filter(x=>
   x.strictVolumeRayStatus==='opaque-interior-ahead').length,
  intervals:records,
  original3DCurveSourceIdentityVerified:true,
  allProjectedCurveIntervalsAccountedFor:true,
  completeClosedEndpointVisibilityCertified:false,
  officialEngineeringLineStylesVerified:false,
  wholeCurveV5Approved:false
 });
}
module.exports={reviewC3AnalyticBooleanRayPaper};
