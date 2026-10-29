'use strict';
/**
 * C3 M3/M5 theorem: COMPLETE W-paper collision inventory among original
 * finite lateral/lateral intersection curves when both source cylinders
 * have exactly the same X center c.
 *
 * For any STRICT open M3 source point:
 *   y=Yz+sy*sqrt(Rz^2-(x-c)^2)
 *   z=Zy+sz*sqrt(Ry^2-(x-c)^2).
 * Both radicals are strictly positive away from their source-domain
 * endpoints. The paper W=(y,z) therefore uniquely determines (sy,sz),
 * and then |x-c|. There are only two possible spatial source points:
 * x=c-d, x=c+d, with the same signed radical identity.
 *
 * Reconcile the ENTIRE original M3 x-parameter inventory on each side of
 * c with the independent existing exact open atom + real selected Boolean
 * first-exit ledger. No missing positive cell, double-claimed source or
 * an invented third projected lateral curve is accepted.
 *
 * This excludes ONLY other lateral/lateral source CURVE collisions in the
 * open intervals. Finite cap edges/faces, silhouettes of the RETAINED
 * composite solid, closed c or radial endpoints, GB line style and V5 are
 * separate obligations and are never certified here.
 */
const {evaluateUnifiedMath}=require('./unified-math-pipeline.cjs');
const {project,FIRST_ANGLE_OBSERVER_RAYS}=
 require('../core/projection/conventions.js');
const freeze=o=>{if(o&&typeof o==='object'&&!Object.isFrozen(o)){
 for(const x of Object.values(o))freeze(x);Object.freeze(o);
}return o;};
function auditC3WAllLateralProjectionCollisions({input,revision,mirrorExitEvidence}={}){
 if(!Number.isSafeInteger(revision)||revision<0||
    mirrorExitEvidence?.schema!=='draftai-c3-w-mirror-exit-outline-concordance/1'||
    mirrorExitEvidence.revision!==revision||
    mirrorExitEvidence.officialV5Authorized!==false||
    mirrorExitEvidence.standardEngineeringLineStylesVerified!==false)
  throw new TypeError('current unsigned W M3/M5 finite Boolean mirror-exit concordance required');
 const op=mirrorExitEvidence.solidOperation;
 const blocked=reason=>freeze({schema:'draftai-c3-W-all-lateral-projection-collisions/1',
  revision,solidOperation:op,status:'not-covered',reason,
  currentM3LateralSourceBranchCount:0,sourceFlankInventories:[],
  checkedSourceOpenFlankCount:0,completeSourceOpenFlankCount:0,
  checkedMirrorAtomicOpenCells:0,exactlyTwoSpatialLateralSourcesPerWInterior:true,
  entireOriginalM3OpenSourceInventoryExactlyOnce:false,
  allPositiveWSourceCurveProjectionCollisionsClassified:false,
  differentSignLateralWProjectionCollisionExcluded:false,
  otherFiniteCapAndCompositeContourOcclusionProven:false,
  closedCenterAndRadicalEndpointTopologyCertified:false,
  officialEngineeringLineStylesVerified:false,officialV5Authorized:false});
 if(!['union','intersection'].includes(op)||
    mirrorExitEvidence.status==='not-covered'||
    mirrorExitEvidence.allMirroredOpenSourceCellsCrossCertified!==true||
    !Array.isArray(mirrorExitEvidence.atomicSourceMirrorCells)||
    !mirrorExitEvidence.atomicSourceMirrorCells.length)
  return blocked('complete current first-exit W mirror source atoms unavailable');
 const m3=evaluateUnifiedMath({kind:'finite-orthogonal-cylinder-intersection',
  input,revision});
 if(m3.status!=='scoped-analytic-ready'||
    m3.sourceConfirmed!==true||
    m3.geometryVerifiedWithinSpecialistScope!==true||
    m3.verifiedCapClipping!==true||
    m3.analyticallyCompleteWithinScope!==true||
    m3.officialLineStylesVerified!==false)
  return blocked('actual finite signed-radical M3 source not complete');
 const Z=m3.source.zCylinder,Y=m3.source.yCylinder,c=Z.xCenter;
 if(c!==Y.xCenter)
  return blocked('different X centers do not have universal reflected W curve pairs');
 const dir=FIRST_ANGLE_OBSERVER_RAYS.W,paper=project({x:6,y:7,z:8}).W;
 if(dir.x!==1||dir.y!==0||dir.z!==0||paper.u!==7||paper.v!==8)
  throw new RangeError('source W view projection/observer is not first-angle +X');
 if(!(Z.radius>0&&Y.radius>0)||!Number.isFinite(c))
  throw new RangeError('two finite positive original cylinder radii required');
 const branches=new Map(),signGroups=new Map();
 for(const branch of m3.branches){
  const range=branch.xRange||[],[a,b]=range;
  if(typeof branch.id!=='string'||!branch.id||branches.has(branch.id)||
     branch.finiteDomainVerified!==true||
     branch.officialLineStyle!=='undetermined'||
     ![-1,1].includes(branch.signY)||![-1,1].includes(branch.signZ)||
     range.length!==2||![a,b].every(Number.isFinite)||!(b>a)||
     a<c-Z.radius||b>c+Z.radius||
     a<c-Y.radius||b>c+Y.radius)
   throw new RangeError('invalid source-domain closed bounds for complete signed W curves');
  branches.set(branch.id,branch);
  const sign=branch.signY+'|'+branch.signZ;
  if(!signGroups.has(sign))signGroups.set(sign,[]);
  signGroups.get(sign).push(branch.id);
 }
 if(!branches.size||branches.size>128||
    mirrorExitEvidence.atomicSourceMirrorCells.length>2048)
  throw new RangeError('bounded original signed finite C3 W M3 source inventory required');
 const atoms=mirrorExitEvidence.atomicSourceMirrorCells;
 const byBranch=new Map([...branches.keys()].map(k=>[k,{rear:[],front:[]}]));
 const out=[];
 for(const [index,a] of atoms.entries()){
  const back=branches.get(a.rearM3BranchId),
   front=branches.get(a.frontM3BranchId);
  const [rl,rh]=a.rearOriginalXOpenRange||[],
   [fl,fh]=a.frontOriginalXOpenRange||[];
  if(!back||!front||
     back.signY!==front.signY||back.signZ!==front.signZ||
     a.signedRadicalPair!==back.signY+'|'+back.signZ||
     a.officialLineStyle!=='undetermined'||a.v5ActionAuthorized!==false||
     a.original3DMirrorProjectionSharedForEveryOpenX!==true||
     a.rearEntireCellOccludedByFiniteBooleanVolume!==true||
     a.rearExactFirstExitAtFrontSource3DPoint!==true||
     a.frontEntireCellHasNoFurtherStrictBooleanVolume!==true||
     ![rl,rh,fl,fh].every(Number.isFinite)||
     !(rh>rl&&fh>fl&&rh<=c&&fl>=c)||
     !(rl===2*c-fh&&rh===2*c-fl)||
     rl<back.xRange[0]||rh>back.xRange[1]||
     fl<front.xRange[0]||fh>front.xRange[1])
   throw new RangeError('W original-source mirror atom has inconsistent M3 branches or 3D depth');
  for(const [sourceId,side,range] of [
   [back.id,'rear',[rl,rh]],[front.id,'front',[fl,fh]]
  ])byBranch.get(sourceId)[side].push(range);
  // The inequalities below are about the interiors of nonempty OPEN
  // subspans, not samples of the M3 curve. Both radicands are >0 at every
  // interior x because R>0 and original closed source bounds lie in
  // [c-R,c+R]. Thus sign(y-Yz) and sign(z-Zy) are uniquely (sy,sz).
  if(rl<c-Z.radius||rh>c+Z.radius||
     fl<c-Z.radius||fh>c+Z.radius||
     rl<c-Y.radius||rh>c+Y.radius||
     fl<c-Y.radius||fh>c+Y.radius)
   throw new RangeError('W signed radical projection ambiguous inside positive source cell');
  out.push({atomicSourceMirrorCellIndex:index,signedRadicalPair:a.signedRadicalPair,
   rearM3BranchId:back.id,frontM3BranchId:front.id,
   rearOriginalXOpenRange:[rl,rh],frontOriginalXOpenRange:[fl,fh],
   exactFirstAngleWProjectionSameForMirrorPair:true,
   positiveRadicalsForEveryInteriorSourceParameter:true,
   otherSignedLateralSourceWProjectionCollisionExcluded:true,
   onlyTwoPossibleSpatialLateralPointsAtEachWInterior:true,
   rearSpatialSourceStrictlyBehindFront:true,
   completeCompositeContourAndCapProjectionCollisionCertified:false,
   closedM3EndpointsAndAxisContactCertified:false,
   officialLineStyle:'undetermined',v5ActionAuthorized:false});
 }
 const inventories=[];
 // Exact-once coverage MUST be checked against every original M3 signed
 // source branch independently, not merely whether every supplied atom
 // was locally consistent. Do not snap a one-ULP hole or overlap closed.
 function inspect(id,side,want,parts){
  const sorted=[...parts].sort((p,q)=>p[0]-q[0]||p[1]-q[1]);
  if(!sorted.length||sorted.length>512||
     sorted[0][0]!==want[0]||sorted.at(-1)[1]!==want[1]||
     sorted.some(([a,b],i)=>!Number.isFinite(a)||!Number.isFinite(b)||
      !(b>a)||(i>0&&a!==sorted[i-1][1])))
   throw new RangeError('C3 W positive original M3 branch '+id+
    ' '+side+' interval has missing or double-claimed x source');
  return {sourceM3BranchId:id,sourceSide:side,
   originalM3OpenRange:[...want],originalAtomCellCount:sorted.length,
   positiveSourceOpenRangeExactlyOnce:true,
   noDifferentSignLateralCurveCanProjectHere:true,
   engineeringLineStyle:'undetermined',v5ActionAuthorized:false};
 }
 for(const [id,b] of branches){
  const [lo,hi]=b.xRange;
  const source=byBranch.get(id);
  if(lo<c)inventories.push(inspect(id,'rear',
   [lo,Math.min(hi,c)],source.rear));
  else if(source.rear.length)
   throw new RangeError('C3 W rear source atom outside original M3 branch');
  if(hi>c)inventories.push(inspect(id,'front',
   [Math.max(lo,c),hi],source.front));
  else if(source.front.length)
   throw new RangeError('C3 W front source atom outside original M3 branch');
 }
 if(inventories.reduce((n,row)=>n+row.originalAtomCellCount,0)!==atoms.length*2)
  throw new RangeError('W lateral/lateral original M3 branch source inventory incomplete');
 return freeze({schema:'draftai-c3-W-all-lateral-projection-collisions/1',
  revision,solidOperation:op,
  status:'scoped-every-original-M3-lateral-W-projection-collision',
  currentM3LateralSourceBranchCount:branches.size,
  differentSignedRadicalSourceFamilies:signGroups.size,
  sourceFlankInventories:inventories,
  checkedSourceOpenFlankCount:inventories.length,
  completeSourceOpenFlankCount:inventories.length,
  checkedMirrorAtomicOpenCells:out.length,
  atomicSourceMirrorCollisionProofs:out,
  exactlyTwoSpatialLateralSourcesPerWInterior:true,
  entireOriginalM3OpenSourceInventoryExactlyOnce:true,
  allPositiveWSourceCurveProjectionCollisionsClassified:true,
  differentSignLateralWProjectionCollisionExcluded:true,
  otherFiniteCapAndCompositeContourOcclusionProven:false,
  closedCenterAndRadicalEndpointTopologyCertified:false,
  officialEngineeringLineStylesVerified:false,officialV5Authorized:false});
}
module.exports={auditC3WAllLateralProjectionCollisions};
