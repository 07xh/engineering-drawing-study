'use strict';
/**
 * C3/M5 TRUE GLOBAL solid-relative W depth theorem for the special
 * EXACT shared-X-center finite orthogonal-cylinder family. Compared with
 * a projected edge/edge rank, this proves against BOTH COMPLETE finite
 * source SOLIDS and therefore against their INTERSECTION and UNION.
 *
 * On a signed lateral/lateral 3D source curve, for each fixed W=(y,z):
 *   (x-c)^2+(y-Yz)^2 = Rz^2
 *   (x-c)^2+(z-Zy)^2 = Ry^2.
 * A real interior source point at rear x=c-d has d>0 and matches front
 * x=c+d. For any x>c+d, BOTH radial squared differences are strictly
 * POSITIVE, so there is no point from EITHER cylinder, regardless of
 * axial caps, cap faces or which Boolean op the user chose.
 * For every x in (c-d,c+d), BOTH radial squared differences are negative.
 * If the independent M3 cap certificate proves y,z strictly inside both
 * axial slabs for the WHOLE open curve cell, this OPEN forward interval
 * lies in the strict INTERSECTION, hence also in UNION.
 *
 * Thus front curve: globally frontmost against ALL selected solid points.
 * Rear curve: hidden by open strict selected solid volume until FRONT.
 *
 * This is stronger than comparison only to other original lateral edges.
 * It does NOT prove closed source endpoints, line-overlap representation,
 * self-coincident planar strokes, full drawn contour completeness, GB
 * line-style authorization or final V5. No edge is signed here.
 */
const {evaluateUnifiedMath}=require('./unified-math-pipeline.cjs');
const {FIRST_ANGLE_OBSERVER_RAYS,project}=
 require('../core/projection/conventions.js');
const freeze=o=>{if(o&&typeof o==='object'&&!Object.isFrozen(o)){
 for(const v of Object.values(o))freeze(v);Object.freeze(o);
}return o;};
function auditC3WGlobalSourceCurveSolidDepth({
 input,revision,collisionEvidence,forwardExitEvidence
}={}){
 if(!Number.isSafeInteger(revision)||revision<0||
    collisionEvidence?.schema!=='draftai-c3-W-all-lateral-projection-collisions/1'||
    forwardExitEvidence?.schema!=='draftai-c3-w-Boolean-first-exit-depth/1'||
    collisionEvidence.revision!==revision||
    forwardExitEvidence.revision!==revision||
    collisionEvidence.solidOperation!==forwardExitEvidence.solidOperation||
    collisionEvidence.officialV5Authorized!==false||
    forwardExitEvidence.officialV5Authorized!==false||
    collisionEvidence.officialEngineeringLineStylesVerified!==false||
    forwardExitEvidence.engineeringLineStylesVerified!==false)
  throw new TypeError('current same-revision unsigned C3 signed-curve and finite selected-solid witnesses required');
 const op=collisionEvidence.solidOperation;
 const blocked=reason=>freeze({
  schema:'draftai-c3-W-global-selected-solid-source-curve-depth/1',
  revision,solidOperation:op,status:'not-covered',reason,
  provedWSourceCurveOpenCells:[],certifiedGlobalFrontmostCells:0,
  certifiedRearFullInteriorOcclusionCells:0,
  allOriginalM3WSourceCurveAtomsGloballyDepthProven:false,
  originalM3BranchSourceParameterInventoryRechecked:false,
  fullProjectedDrawingStrokeSetCertified:false,
  closedEndpointsCapTouchesCertified:false,
  standardEngineeringLineStylesVerified:false,officialV5Authorized:false
 });
 if(!['union','intersection'].includes(op)||
    collisionEvidence.allPositiveWSourceCurveProjectionCollisionsClassified!==true||
    collisionEvidence.entireOriginalM3OpenSourceInventoryExactlyOnce!==true||
    forwardExitEvidence.allWSourceOpenCellsAccountedFor!==true||
    forwardExitEvidence.allSourceForwardVolumeSegmentsProven!==true)
  return blocked('full positive W source/open-interval depth evidence absent');
 const m3=evaluateUnifiedMath({
  kind:'finite-orthogonal-cylinder-intersection',input,revision
 });
 if(m3.status!=='scoped-analytic-ready'||m3.sourceConfirmed!==true||
    m3.verifiedCapClipping!==true||m3.analyticallyCompleteWithinScope!==true||
    m3.geometryVerifiedWithinSpecialistScope!==true||
    m3.officialLineStylesVerified!==false)
  return blocked('independent current M3 finite signed-radical input unavailable');
 const {zCylinder:Z,yCylinder:Y}=m3.source,c=Z.xCenter;
 if(c!==Y.xCenter)return blocked('requires EXACT common X center');
 const obs=FIRST_ANGLE_OBSERVER_RAYS.W,paper=project({x:2,y:3,z:4}).W;
 if(obs.x!==1||obs.y!==0||obs.z!==0||
    paper.u!==3||paper.v!==4)
  throw new RangeError('W first-angle +X observer changed');
 const src=new Map(m3.branches.map(b=>[b.id,b]));
 if(src.size!==m3.branches.length||
    src.size!==collisionEvidence.currentM3LateralSourceBranchCount||
    src.size===0||src.size>128||
    !Array.isArray(collisionEvidence.atomicSourceMirrorCollisionProofs)||
    collisionEvidence.atomicSourceMirrorCollisionProofs.length<1||
    collisionEvidence.atomicSourceMirrorCollisionProofs.length>2048||
    !Array.isArray(forwardExitEvidence.sourceOpenCells)||
    forwardExitEvidence.sourceOpenCells.length>1024)
  throw new RangeError('full bounded actual M3 source and real W M5 forward exits required');
 const locate=(sourceId,[lo,hi])=>{
  const found=forwardExitEvidence.sourceOpenCells.filter(row=>
   row.sourceM3BranchId===sourceId&&row.view==='W'&&
   row.originalSourceXOpenRange?.[0]<=lo&&
   row.originalSourceXOpenRange?.[1]>=hi);
  if(found.length!==1)
   throw new RangeError('source W forward-exit interval absent or overlapping');
  return found[0];
 };
 const originalInventory=new Map(m3.branches.map(b=>
  [b.id,{rear:[],front:[]}]));
 const rows=[];
 for(const [i,atom] of collisionEvidence.atomicSourceMirrorCollisionProofs.entries()){
  const behind=src.get(atom.rearM3BranchId),
   front=src.get(atom.frontM3BranchId),
   [rl,rh]=atom.rearOriginalXOpenRange||[],
   [fl,fh]=atom.frontOriginalXOpenRange||[];
  if(!behind||!front||
     behind.signY!==front.signY||behind.signZ!==front.signZ||
     atom.signedRadicalPair!==behind.signY+'|'+behind.signZ||
     atom.positiveRadicalsForEveryInteriorSourceParameter!==true||
     atom.otherSignedLateralSourceWProjectionCollisionExcluded!==true||
     atom.onlyTwoPossibleSpatialLateralPointsAtEachWInterior!==true||
     atom.rearSpatialSourceStrictlyBehindFront!==true||
     atom.officialLineStyle!=='undetermined'||atom.v5ActionAuthorized!==false||
     ![rl,rh,fl,fh].every(Number.isFinite)||
     !(rh>rl&&fh>fl&&rh<=c&&fl>=c)||
     !(rl===2*c-fh&&rh===2*c-fl)||
     rl<behind.xRange[0]||rh>behind.xRange[1]||
     fl<front.xRange[0]||fh>front.xRange[1])
   throw new RangeError('false original M3 front/rear W solid-source pairing');
  const rearRay=locate(behind.id,[rl,rh]),
   frontRay=locate(front.id,[fl,fh]);
  if(rearRay.strictForwardVolumeRayStatus!==
      'certified-entire-W-open-ray-opaque-first-exit'||
     frontRay.strictForwardVolumeRayStatus!==
      'certified-entire-W-open-ray-clear'||
     rearRay.fullOpenSourceRayForwardVolumeCertified!==true||
     frontRay.fullOpenSourceRayForwardVolumeCertified!==true||
     rearRay.sourceFiniteAxialCapsStrictInOpenCellVerified!==true||
     frontRay.sourceFiniteAxialCapsStrictInOpenCellVerified!==true||
     rearRay.sourceFirstExitXAffine?.twiceXCenter!==2*c||
     rearRay.sourceFirstExitXAffine?.slope!==-1||
     !Array.isArray(rearRay.sourceFirstExitSourceIds)||
     !['zCylinder','yCylinder'].every(id=>
       rearRay.sourceFirstExitSourceIds.includes(id))||
     frontRay.sourceFirstExitXAffine!==null||
     frontRay.sourceFirstExitSourceIds?.length!==0)
   throw new RangeError('real entire-cell finite Boolean forward rays contradict global source depth');
  // BOTH finite axial caps are strict at every interior source point.
  // Each source’s radial constraint is strictly exterior for ALL X>front;
  // so a cap plane or any other real original boundary cannot be farther
  // along the same W observer ray.
  const radialBound=fh-c;
  if(!(radialBound>0&&c-rl>0&&
       fl>=c&&rh<=c&&
       [Z.radius,Y.radius].every(R=>R>0&&R>=radialBound)))
   throw new RangeError('original finite cylinder front radial bound missing');
  originalInventory.get(behind.id).rear.push([rl,rh]);
  originalInventory.get(front.id).front.push([fl,fh]);
  rows.push({
   sourceAtomicCellIndex:i,signedRadicalPair:atom.signedRadicalPair,
   rearOriginal3DSourceBranchId:behind.id,
   frontOriginal3DSourceBranchId:front.id,
   rearOriginalXOpenRange:[rl,rh],frontOriginalXOpenRange:[fl,fh],
   sameWPaperImageHasExactlyTheseTwoLateral3DSourcePoints:true,
   frontSourceIsGloballyFrontmostAmongALLSelectedFiniteSolidPoints:true,
   noPointOfEitherCompleteFiniteCylinderBeyondFrontAlongW:true,
   anyCapFaceOrOriginalSurfaceBeyondFrontExcludedByBothRadialInequalities:true,
   rearToFrontOpenWRayStrictlyInsideBothFiniteCylinderSolids:true,
   rearToFrontOpenWRayStrictlyInsideSelectedBooleanSolid:true,
   rearSelectedSolidOccludedOnEntireSourceOpenCell:true,
   analyticRadialWitness:'for t>0 beyond front, (front-c+t)^2-(front-c)^2=t*(2*(front-c)+t)>0 for BOTH source radial disks',
   unionAndIntersectionBothHandledByStrictContainment:true,
   projectedLineOrCapFeatureOverlapStyleAuthorized:false,
   closedOriginalSourceJunctionsCertified:false,
   engineeringLineStyle:'undetermined',v5ActionAuthorized:false
  });
 }
 const inventories=[];
 for(const [id,b] of src){
  const segments=originalInventory.get(id),[lo,hi]=b.xRange;
  for(const [side,expected] of [
    ['rear',lo<c?[lo,Math.min(hi,c)]:null],
    ['front',hi>c?[Math.max(lo,c),hi]:null]
  ]){
   const parts=segments[side].sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
   if(expected===null){
    if(parts.length)throw new RangeError('global W solid source ray has wrong-side M3 fragment');
    continue;
   }
   if(!parts.length||parts.length>512||
      parts[0][0]!==expected[0]||
      parts.at(-1)[1]!==expected[1]||
      parts.some(([a,b],i)=>!(b>a)||
        (i>0&&a!==parts[i-1][1])))
    throw new RangeError('global W solid source-ray atoms omit or overlap original M3 x domain');
   inventories.push({originalM3BranchId:id,side,
    originalSourceXOpenRange:[...expected],
    completePositiveOriginalM3ParameterCoveredExactlyOnce:true});
  }
 }
 if(rows.length!==collisionEvidence.checkedMirrorAtomicOpenCells||
    inventories.length!==collisionEvidence.completeSourceOpenFlankCount)
  throw new RangeError('current W entire-source-curve inventory differs from finite original branch proof');
 return freeze({
  schema:'draftai-c3-W-global-selected-solid-source-curve-depth/1',
  revision,solidOperation:op,
  status:'scoped-all-W-original-lateral-curves-globally-frontmost-or-behind-finite-Boolean-volume',
  currentM3SignedLateralSourceBranchCount:src.size,
  provedWSourceCurveOpenCells:rows,
  certifiedGlobalFrontmostCells:rows.length,
  certifiedRearFullInteriorOcclusionCells:rows.length,
  sourceFlankInventory:inventories,
  allOriginalM3WSourceCurveAtomsGloballyDepthProven:true,
  originalM3BranchSourceParameterInventoryRechecked:true,
  fullProjectedDrawingStrokeSetCertified:false,
  closedEndpointsCapTouchesCertified:false,
  standardEngineeringLineStylesVerified:false,officialV5Authorized:false
 });
}
module.exports={auditC3WGlobalSourceCurveSolidDepth};
