'use strict';
/**
 * C3 M5: reconcile two genuinely independent 3D proofs on ALL original
 * W analytic mirror/cap/outline atomic open cells:
 *
 * 1. finite Boolean +X ray first exit on each original M3 signed branch;
 * 2. signed-branch W mirror depth (front/rear) AFTER every enumerated
 *    original cap and 8 cylinder-outline crossing was used as a cut.
 *
 * With both cylinder x centers exactly c, p_rear(x) on both lateral
 * cylinder walls has a positive strict interior ray ending at
 * x_exit=2c-x. The *front* signed-radical source point is located at
 * precisely x_exit and projects to the identical W=(y,z). Therefore
 * each rear W mirror atom is obscured by real finite solid volume up to
 * the corresponding verified FRONT source, and the front is free of
 * further strict volume along the same +X W ray. We DO NOT infer that
 * all other composite contours, closed contacts or GB strokes are solved.
 */
const {evaluateUnifiedMath}=require('./unified-math-pipeline.cjs');
const {FIRST_ANGLE_OBSERVER_RAYS}=require('../core/projection/conventions.js');
const freeze=o=>{if(o&&typeof o==='object'&&!Object.isFrozen(o)){
 for(const v of Object.values(o))freeze(v);Object.freeze(o);
}return o;};
function auditC3WMirrorExitOutlineConcordance({
 input,revision,exitEvidence,outlineEvidence
}={}){
 if(!Number.isSafeInteger(revision)||revision<0||
    exitEvidence?.schema!=='draftai-c3-w-Boolean-first-exit-depth/1'||
    outlineEvidence?.schema!=='draftai-c3-W-mirror-all-source-outlines/1'||
    exitEvidence.revision!==revision||outlineEvidence.revision!==revision||
    exitEvidence.solidOperation!==outlineEvidence.solidOperation||
    exitEvidence.officialV5Authorized!==false||
    outlineEvidence.officialV5Authorized!==false||
    exitEvidence.engineeringLineStylesVerified!==false||
    outlineEvidence.engineeringLineStylesCertified!==false)
  throw new TypeError('same-revision unsigned finite W Boolean exit and source-outline atom evidence required');
 const op=exitEvidence.solidOperation;
 const blocked=reason=>freeze({
  schema:'draftai-c3-w-mirror-exit-outline-concordance/1',
  revision,solidOperation:op,status:'not-covered',reason,
  atomicSourceMirrorCells:[],checkedMirroredAtomicOpenCells:0,
  rearFirstExitOntoFrontSourceCellCount:0,
  unprovedSourceMirrorExitCellCount:0,
  allMirroredOpenSourceCellsCrossCertified:false,
  allOriginalOutlineAndCapEventsResolved:false,
  completeCompositeSourceDepthRankingCertified:false,
  allClosedCurveAndCapJunctionsCertified:false,
  standardEngineeringLineStylesVerified:false,officialV5Authorized:false});
 if(!['intersection','union'].includes(op)||
    exitEvidence.status==='not-covered'||
    !outlineEvidence.allSourceOutlineAtomicOpenCells?.length)
  return blocked('selected finite W mirror source or Boolean proof not available');
 const m3=evaluateUnifiedMath({
  kind:'finite-orthogonal-cylinder-intersection',input,revision
 });
 if(m3.status!=='scoped-analytic-ready'||m3.sourceConfirmed!==true||
    m3.verifiedCapClipping!==true||m3.analyticallyCompleteWithinScope!==true||
    m3.officialLineStylesVerified!==false)
  return blocked('current finite M3 signed source unavailable');
 const {zCylinder:Z,yCylinder:Y}=m3.source;
 if(Z.xCenter!==Y.xCenter)
  return blocked('only exactly coincident X centers have same-source mirrored far boundary');
 const c=Z.xCenter;
 if(FIRST_ANGLE_OBSERVER_RAYS.W.x!==1||
    FIRST_ANGLE_OBSERVER_RAYS.W.y!==0||
    FIRST_ANGLE_OBSERVER_RAYS.W.z!==0)
  throw new RangeError('W +X observer convention not verified');
 const branches=new Map(m3.branches.map(b=>[b.id,b]));
 const rowSource=exitEvidence.sourceOpenCells;
 const atoms=outlineEvidence.allSourceOutlineAtomicOpenCells;
 if(!Array.isArray(rowSource)||!rowSource.length||rowSource.length>1024||
    atoms.length>2048||branches.size!==m3.branches.length)
  throw new RangeError('bounded current original M3 sources and W atomic mirror cells required');
 if(exitEvidence.allWSourceOpenCellsAccountedFor!==true)
  throw new RangeError('W source ray exit ledger lacks original M3 cell coverage');
 const locate=(id,[lo,hi])=>{
  const rows=rowSource.filter(row=>
   row.sourceM3BranchId===id&&row.view==='W'&&
   row.originalSourceXOpenRange?.[0]<=lo&&
   row.originalSourceXOpenRange?.[1]>=hi);
  if(rows.length!==1)
   throw new RangeError('C3 W mirrored source atom lacks exactly one full M3 ray exit interval');
  return rows[0];
 };
 const out=[];
 for(const [index,atom] of atoms.entries()){
  const [fa,fb]=atom.frontOriginalXOpenRange||[],
   [ra,rb]=atom.rearOriginalXOpenRange||[];
  const frontBranch=branches.get(atom.frontM3BranchId),
   backBranch=branches.get(atom.rearM3BranchId);
  if(!frontBranch||!backBranch||
     atom.officialLineStyle!=='undetermined'||atom.v5ActionAuthorized!==false||
     atom.sameSourceMirrorFrontBackDepthProven!==true||
     atom.noEnumeratedOriginalSourceOutlineCrossingInOpenInterior!==true||
     ![fa,fb,ra,rb].every(Number.isFinite)||
     !(fb>fa&&rb>ra&&fa>=c&&rb<=c)||
     !(ra===2*c-fb&&rb===2*c-fa)||
     frontBranch.signY!==backBranch.signY||
     frontBranch.signZ!==backBranch.signZ||
     fa<frontBranch.xRange[0]||fb>frontBranch.xRange[1]||
     ra<backBranch.xRange[0]||rb>backBranch.xRange[1])
   throw new RangeError('C3 W original source mirror atom not a true equal-sign 3D branch pair');
  const rear=locate(backBranch.id,[ra,rb]);
  const front=locate(frontBranch.id,[fa,fb]);
  // These two independent analytic full-interval rays (not midpoint
  // samples) must corroborate the source mirror theorem exactly.
  if(rear.strictForwardVolumeRayStatus!==
        'certified-entire-W-open-ray-opaque-first-exit'||
     front.strictForwardVolumeRayStatus!==
        'certified-entire-W-open-ray-clear'||
     rear.fullOpenSourceRayForwardVolumeCertified!==true||
     front.fullOpenSourceRayForwardVolumeCertified!==true||
     rear.sourceFiniteAxialCapsStrictInOpenCellVerified!==true||
     front.sourceFiniteAxialCapsStrictInOpenCellVerified!==true||
     rear.sourceFirstExitXAffine?.twiceXCenter!==2*c||
     rear.sourceFirstExitXAffine?.slope!==-1||
     rear.sourceFirstExitSourceIds?.length!==2||
     !rear.sourceFirstExitSourceIds.includes('zCylinder')||
     !rear.sourceFirstExitSourceIds.includes('yCylinder')||
     front.sourceFirstExitXAffine!==null||
     front.sourceFirstExitSourceIds?.length!==0)
   throw new RangeError('C3 W finite intersection/union ray exit contradicts mirrored source depth');
  const exitRange=[2*c-rb,2*c-ra];
  if(!(exitRange[1]>exitRange[0])||
     !(exitRange[0]===fa&&exitRange[1]===fb))
   throw new RangeError('C3 W rear ray far exit does not coincide with front 3D source span');
  out.push({atomicSourceCellIndex:index,
   rearM3BranchId:backBranch.id,frontM3BranchId:frontBranch.id,
   signedRadicalPair:atom.signedRadicalPair,
   rearOriginalXOpenRange:[ra,rb],frontOriginalXOpenRange:[fa,fb],
   rearForwardFirstExitXOpenRange:exitRange,
   original3DMirrorProjectionSharedForEveryOpenX:true,
   rearEntireCellOccludedByFiniteBooleanVolume:true,
   rearExactFirstExitAtFrontSource3DPoint:true,
   frontEntireCellHasNoFurtherStrictBooleanVolume:true,
   bothPhysicalCylinderExitSurfacesIdentified:true,
   otherProjectedContoursAndLineOverlapsResolved:false,
   allClosedOriginalContactPointsCertified:false,
   officialLineStyle:'undetermined',v5ActionAuthorized:false});
 }
 const eventComplete=outlineEvidence.
   allEightOriginalFiniteCylinderSourceOutlinesAccountedFor===true&&
  outlineEvidence.unassignedSourceOutlineEventCount===0;
 return freeze({
  schema:'draftai-c3-w-mirror-exit-outline-concordance/1',
  revision,solidOperation:op,
  status:eventComplete?
   'scoped-all-original-W-mirror-ray-exits-and-source-events':
   'scoped-W-mirror-ray-exits-with-unresolved-source-events',
  atomicSourceMirrorCells:out,checkedMirroredAtomicOpenCells:out.length,
  rearFirstExitOntoFrontSourceCellCount:out.length,
  unprovedSourceMirrorExitCellCount:0,
  allMirroredOpenSourceCellsCrossCertified:out.length===atoms.length,
  allOriginalOutlineAndCapEventsResolved:eventComplete,
  completeCompositeSourceDepthRankingCertified:false,
  allClosedCurveAndCapJunctionsCertified:false,
  standardEngineeringLineStylesVerified:false,officialV5Authorized:false});
}
module.exports={auditC3WMirrorExitOutlineConcordance};
