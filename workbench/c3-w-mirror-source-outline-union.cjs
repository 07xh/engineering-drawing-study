'use strict';
/**
 * C3 M4: join ALL original W cylinder-projection outline events (two
 * lateral silhouettes and both finite cap boundaries for each source)
 * to already-split same-source W mirror/cap-line atomic OPEN intervals.
 *
 * This does not treat projected paper coincidences as physical 3D joins.
 * It rebinds every event to the real M3 signed-radical source and original
 * finite cylinder outline, and partitions mirrored parameter cells at
 * any extra outline contact. Closed centers/endpoints stay unsigned.
 *
 * Coverage here is limited to the 8 original constant-coordinate SOURCE
 * outlines, not every retained composite-solid silhouette, coplanar
 * face, depth alias, curve tangent or GB line style.
 */
const {evaluateUnifiedMath}=require('./unified-math-pipeline.cjs');
const {project,FIRST_ANGLE_OBSERVER_RAYS}=
 require('../core/projection/conventions.js');
const freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){
 for(const v of Object.values(x))freeze(v);Object.freeze(x);
}return x;};
function auditC3WMirrorSourceOutlineUnion({
 input,revision,capPartitionEvidence,wRayPreview
}={}){
 if(!Number.isSafeInteger(revision)||revision<0||
    capPartitionEvidence?.revision!==revision||
    capPartitionEvidence?.schema!=='draftai-c3-W-mirror-cap-contact-partition/1'||
    wRayPreview?.revision!==revision||
    wRayPreview?.schema!=='draftai-c3-w-ray-preview/1')
  throw new TypeError('current source-verified C3 W mirror/cap and original outline witnesses required');
 const blocked=reason=>freeze({
  schema:'draftai-c3-W-mirror-all-source-outlines/1',
  revision,solidOperation:capPartitionEvidence.solidOperation,
  status:'not-covered',reason,sourceOutlineContactCount:0,
  mappedSourceOutlineContactCount:0,
  excludedClosedCenterEventCount:0,
  unassignedSourceOutlineEventCount:0,
  originalCapPartitionOpenCellCount:0,
  allSourceOutlinePartitionOpenCellCount:0,
  sourceOutlineEvents:[],unassignedSourceOutlineEvents:[],
  allSourceOutlineAtomicOpenCells:[],
  allEightOriginalFiniteCylinderSourceOutlinesAccountedFor:false,
  fullyGloballyFrontmostOutlineCertified:false,
  closedContactContinuityVerified:false,
  engineeringLineStylesCertified:false,officialV5Authorized:false});
 if(!['scoped-mirror-depth-and-cap-line-event-partition',
       'partial-unassigned-mirror-cap-source-events']
     .includes(capPartitionEvidence.status)||
    capPartitionEvidence.originalMirroredOpenCellCount===0||
    !Array.isArray(capPartitionEvidence.atomicMirroredOpenCells)||
    wRayPreview.status!=='source-bounded-W-open-ray-preview'||
    wRayPreview.originalSourceOutlineOpenOverlapExcluded!==true||
    !Array.isArray(wRayPreview.sourceOutlineEvents)||
    wRayPreview.sourceOutlineEventCount!==wRayPreview.sourceOutlineEvents.length)
  return blocked('M4 original W source outline or mirrored cap-source partition not available');
 const source=evaluateUnifiedMath({
  kind:'finite-orthogonal-cylinder-intersection',input,revision});
 if(source.status!=='scoped-analytic-ready'||source.sourceConfirmed!==true||
    source.geometryVerifiedWithinSpecialistScope!==true)
  return blocked('current original finite M3 source not proved');
 const Z=source.source.zCylinder,Y=source.source.yCylinder;
 if(Z.xCenter!==Y.xCenter)
  throw new RangeError('W same-source mirror partition requires coincident cylinder axes');
 const dir=FIRST_ANGLE_OBSERVER_RAYS.W;
 if(dir.x!==1||dir.y!==0||dir.z!==0||
    project({x:8,y:6,z:3}).W.u!==6||
    project({x:8,y:6,z:3}).W.v!==3)
  throw new RangeError('C3 W first-angle observer or paper convention changed');
 const center=Z.xCenter,sourceIds=new Map(source.branches.map(b=>[b.id,b]));
 const outlines=new Map([
  ['z-silhouette-minus',{solid:'zCylinder',kind:'silhouette',
   axis:'y',value:Z.yCenter-Z.radius}],
  ['z-silhouette-plus',{solid:'zCylinder',kind:'silhouette',
   axis:'y',value:Z.yCenter+Z.radius}],
  ['z-cap-low',{solid:'zCylinder',kind:'finite-cap-edge',
   axis:'z',value:Z.zMin}],
  ['z-cap-high',{solid:'zCylinder',kind:'finite-cap-edge',
   axis:'z',value:Z.zMax}],
  ['y-silhouette-minus',{solid:'yCylinder',kind:'silhouette',
   axis:'z',value:Y.zCenter-Y.radius}],
  ['y-silhouette-plus',{solid:'yCylinder',kind:'silhouette',
   axis:'z',value:Y.zCenter+Y.radius}],
  ['y-cap-low',{solid:'yCylinder',kind:'finite-cap-edge',
   axis:'y',value:Y.yMin}],
  ['y-cap-high',{solid:'yCylinder',kind:'finite-cap-edge',
   axis:'y',value:Y.yMax}]
 ]);
 const srcCells=capPartitionEvidence.atomicMirroredOpenCells;
 if(srcCells.length<1||srcCells.length>2048||
    wRayPreview.sourceOutlineEvents.length>2048)
  throw new RangeError('unbounded C3 W current mirrored source/outline inventory');
 const cells=srcCells.map((cell,index)=>{
  const [a,b]=cell.frontOriginalXOpenRange;
  const [rl,rh]=cell.rearOriginalXOpenRange;
  if(!Number.isFinite(a)||!Number.isFinite(b)||!(b>a)||
     !Number.isFinite(rl)||!Number.isFinite(rh)||!(rh>rl)||
     !(2*center-b===rl&&2*center-a===rh)||
     cell.sameSourceMirrorStrictFrontDepthProven!==true||
     cell.standardLineStyle!=='undetermined'||cell.v5ActionAuthorized!==false)
   throw new RangeError('untrusted same-source C3 W cap-mirror atomic interval');
  return {cell,index,cuts:[a,b],lower:[],upper:[],events:[]};
 });
 const unassigned=[],mapped=[],closedCenter=[];
 for(const [i,e] of wRayPreview.sourceOutlineEvents.entries()){
  const spec=outlines.get(e?.id),branch=sourceIds.get(e?.sourceBranchId);
  if(!spec||!branch||
     e.sourceSolid!==spec.solid||
     e.sourceFeatureKind!==spec.kind||
     e.sourceLineCoordinate!==spec.axis||
     e.sourceLineValue!==spec.value||
     e.officialLineStyle!=='undetermined'||e.v5CurveActionAuthorized!==false||
     !Number.isFinite(e.x)||!e.point3D||
     !['x','y','z'].every(k=>Number.isFinite(e.point3D[k]))||
     e.x<branch.xRange[0]||e.x>branch.xRange[1])
   throw new RangeError('C3 W original projected source outline lacks true M3 identity');
  const x=e.x,
   y2=(Z.radius-Math.abs(x-Z.xCenter))*(Z.radius+Math.abs(x-Z.xCenter)),
   z2=(Y.radius-Math.abs(x-Y.xCenter))*(Y.radius+Math.abs(x-Y.xCenter));
  if(y2<0||z2<0)throw new RangeError('C3 source outline event outside real signed radicals');
  const expected={x,y:Z.yCenter+branch.signY*Math.sqrt(y2),
   z:Y.zCenter+branch.signZ*Math.sqrt(z2)};
  const scale=Math.max(1,Z.radius,Y.radius,Math.abs(x),
   Math.abs(expected.y),Math.abs(expected.z));
  if(Math.hypot(...['x','y','z'].map(k=>e.point3D[k]-expected[k]))>
      1e-7*scale||
     Math.abs(e.point3D[spec.axis]-spec.value)>1e-7*scale||
     !e.projectedW||
     Math.hypot(e.projectedW.u-e.point3D.y,
      e.projectedW.v-e.point3D.z)>1e-7*scale)
   throw new RangeError('C3 original source outline crossing is not on real W projected curve');
  // The original source center is a CLOSED physical point, not inside
  // either mirrored OPEN source depth interval. Keep it separate.
  if(x===center){
   closedCenter.push({outlineId:e.id,branchId:branch.id,x,
    closedPointGlobalOcclusionCertified:false,
    engineeringLineStyle:'undetermined'});
   continue;
  }
  const frontX=x<center?2*center-x:x;
  const found=cells.filter(({cell})=>{
   const range=x<center?cell.rearOriginalXOpenRange:
     cell.frontOriginalXOpenRange;
   return cell[x<center?'rearM3BranchId':'frontM3BranchId']===branch.id&&
    x>=range[0]&&x<=range[1];
  });
  if(!Number.isFinite(frontX)||!found.length){
   unassigned.push({eventIndex:i,outlineId:e.id,
    branchId:branch.id,reason:'source-outline-event-outside-mirrored-open-source'});
   continue;
  }
  const everyMapped=found.every(row=>{
   const [lo,hi]=row.cell.frontOriginalXOpenRange;
   return frontX>=lo&&frontX<=hi;
  });
  if(!everyMapped){
   unassigned.push({eventIndex:i,outlineId:e.id,
    branchId:branch.id,reason:'reflected-source-outline-event-not-in-real-open-interval'});
   continue;
  }
  for(const row of found){
   const [lo,hi]=row.cell.frontOriginalXOpenRange;
   if(frontX>lo&&frontX<hi)row.cuts.push(frontX);
   row.events.push({outlineId:e.id,branchId:branch.id,
    sourceOriginalX:x,reflectedFrontX:frontX,
    originalSourceOutlineKind:e.sourceFeatureKind,
    closedEventVisibleHiddenStyleCertified:false});
  }
  mapped.push({outlineId:e.id,sourceBranchId:branch.id,
   sourceOriginalX:x,reflectedFrontX:frontX,
   matchedAtomicCapCellCount:found.length,
   sourceLineCoordinate:e.sourceLineCoordinate,
   sourceLineValue:e.sourceLineValue,
   physical3DDepthJoinProven:false,engineeringLineStyle:'undetermined'});
 }
 const result=[];
 for(const row of cells){
  const cuts=[...new Set(row.cuts)].sort((a,b)=>a-b);
  const parent=row.cell;
  for(let i=1;i<cuts.length;i++){
   const [a,b]=[cuts[i-1],cuts[i]];
   const rear=[2*center-b,2*center-a];
   if(!(b>a&&rear[1]>rear[0])||
      row.events.some(ev=>ev.reflectedFrontX>a&&ev.reflectedFrontX<b))
    throw new RangeError('C3 W source silhouette contact remains in positive interior');
   result.push({sourceCapAtomicCellIndex:row.index,
    signedRadicalPair:parent.signedRadicalPair,
    rearM3BranchId:parent.rearM3BranchId,
    frontM3BranchId:parent.frontM3BranchId,
    frontOriginalXOpenRange:[a,b],rearOriginalXOpenRange:rear,
    lowerOutlineBoundaryEventIds:row.events.filter(e=>e.reflectedFrontX===a)
     .map(e=>e.outlineId),
    upperOutlineBoundaryEventIds:row.events.filter(e=>e.reflectedFrontX===b)
     .map(e=>e.outlineId),
    sameSourceMirrorFrontBackDepthProven:true,
    noEnumeratedOriginalSourceOutlineCrossingInOpenInterior:true,
    closedOutlineEventPhysicalJunctionProven:false,
    allRetainedCompositeSolidContourOcclusionProven:false,
    officialLineStyle:'undetermined',v5ActionAuthorized:false});
  }
 }
 const complete=unassigned.length===0&&
  capPartitionEvidence.allProjectedCapLineContactsAssignedToMirroredSourceCells===true;
 return freeze({schema:'draftai-c3-W-mirror-all-source-outlines/1',
  revision,solidOperation:capPartitionEvidence.solidOperation,
  status:complete?'scoped-original-W-source-outline-event-partition':
   'partial-original-W-outline-source-coverage',
  sourceOutlineContactCount:wRayPreview.sourceOutlineEvents.length,
  mappedSourceOutlineContactCount:mapped.length,
  excludedClosedCenterEventCount:closedCenter.length,
  unassignedSourceOutlineEventCount:unassigned.length,
  originalCapPartitionOpenCellCount:srcCells.length,
  allSourceOutlinePartitionOpenCellCount:result.length,
  sourceOutlineEvents:mapped,
  excludedClosedCenterEvents:closedCenter,
  unassignedSourceOutlineEvents:unassigned,
  allSourceOutlineAtomicOpenCells:result,
  allEightOriginalFiniteCylinderSourceOutlinesAccountedFor:complete,
  fullyGloballyFrontmostOutlineCertified:false,
  closedContactContinuityVerified:false,
  engineeringLineStylesCertified:false,officialV5Authorized:false});
}
module.exports={auditC3WMirrorSourceOutlineUnion};
