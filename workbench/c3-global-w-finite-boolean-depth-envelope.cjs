'use strict';
/**
 * C3 M5 positive GLOBAL W frontmost-depth theorem for the finite UNION
 * or INTERSECTION of TWO convex orthogonal cylinders, on their SHARED
 * lateral/lateral analytic source arcs in the interior of both axial caps.
 *
 * W looks in +X and projects to (y,z). At an original M3 double-lateral
 * source point p=(x,y,z), its two radial identities imply
 *   Xz+sqrt(Rz^2-(y-Yz)^2) = max(x, 2*Xz-x)
 *   Xy+sqrt(Ry^2-(z-Zy)^2) = max(x, 2*Xy-x).
 * Both finite cylinders contain this source point and are convex along
 * the W ray, so the FULL CLOSED Boolean solid at this (y,z) has front:
 *   union        => max(x,2*max(Xz,Xy)-x)
 *   intersection => max(x,2*min(Xz,Xy)-x).
 * The source has strictly opaque OPEN ray ahead precisely for x below
 * the corresponding effective center. This is a global forward depth
 * envelope at each verified double-lateral source (not merely a local
 * normal test or a finite list of midpoint samples).
 *
 * It is NOT a complete projected visible drawing: edges on finite caps,
 * unrelated silhouettes/cap-source lines, lateral endpoints, projected
 * coincidences with other features, line styles and V5 are unsigned.
 */
const {evaluateUnifiedMath}=require('./unified-math-pipeline.cjs');
const {FIRST_ANGLE_OBSERVER_RAYS,project}=
 require('../core/projection/conventions.js');
const {partitionC3WDirectionalOpenIntervals}=
 require('./c3-selected-boolean-vhw-open-rays.cjs');
const freeze=o=>{if(o&&typeof o==='object'&&!Object.isFrozen(o)){
 for(const v of Object.values(o))freeze(v);Object.freeze(o);
}return o;};
function auditC3GlobalWFiniteBooleanDepthEnvelope({
 input,revision,selectedRayEvidence
}={}){
 if(!Number.isSafeInteger(revision)||revision<0||
    selectedRayEvidence?.schema!=='draftai-c3-boolean-VHW-open-rays/1'||
    selectedRayEvidence.revision!==revision||
    selectedRayEvidence.officialLineStylesVerified!==false||
    selectedRayEvidence.finalV5CurveAuthorized!==false)
  throw new TypeError('current unsigned C3 M5 finite Boolean source-ray ledger required');
 const op=selectedRayEvidence.solidOperation;
 const blocked=reason=>freeze({
  schema:'draftai-c3-global-W-finite-Boolean-depth-envelope/1',
  revision,solidOperation:op,status:'not-covered',reason,
  sourceAnalyticBranchCount:0,verifiedGlobalWOpenCellCount:0,
  globallyFrontmostSourceOpenCellCount:0,
  globallyOccludedSourceOpenCellCount:0,
  openCells:[],allOriginalAnalyticWSourceSpansAccountedFor:false,
  entireWSourceCurveEndpointContinuityCertified:false,
  allFiniteCapAndCompositeOutlineDepthCertified:false,
  officialEngineeringLineStylesVerified:false,finalV5Authorized:false
 });
 if(selectedRayEvidence.fullSourceOpenEdgeRayCoverageVerified!==true){
  if(selectedRayEvidence.intervals?.length||
     selectedRayEvidence.fullSourceOpenEdgeRayCoverageVerified!==false)
   throw new RangeError('partial selected C3 W source-ray ledger cannot certify global depth');
  return blocked('explicit Boolean solid with full M5 source rays required');
 }
 if(!['union','intersection'].includes(op)||
    selectedRayEvidence.undeterminedCount!==0||
    !Array.isArray(selectedRayEvidence.intervals))
  throw new RangeError('complete explicitly selected finite Boolean solid required');
 const source=evaluateUnifiedMath({
  kind:'finite-orthogonal-cylinder-intersection',input,revision});
 if(source.status!=='scoped-analytic-ready'||source.sourceConfirmed!==true||
    source.geometryVerifiedWithinSpecialistScope!==true||
    source.analyticallyCompleteWithinScope!==true||
    source.verifiedCapClipping!==true||
    source.officialLineStylesVerified!==false)
  return blocked('complete genuine reviewed finite double-lateral M3 source required');
 const {zCylinder:Z,yCylinder:Y}=source.source;
 const observer=FIRST_ANGLE_OBSERVER_RAYS.W;
 if(observer.x!==1||observer.y!==0||observer.z!==0||
    project({x:8,y:7,z:6}).W.u!==7||
    project({x:8,y:7,z:6}).W.v!==6)
  throw new RangeError('C3 original W observer depth convention changed');
 const center=op==='union'?
  Math.max(Z.xCenter,Y.xCenter):Math.min(Z.xCenter,Y.xCenter);
 const sourceIds=new Set(),result=[];
 const W=selectedRayEvidence.intervals.filter(row=>
  row.view==='W'&&row.sourceKind==='analytic-curve');
 if(source.branches.length<1||source.branches.length>128||W.length>768)
  throw new RangeError('C3 bounded authentic W analytic source count required');
 for(const b of source.branches){
  if(typeof b.id!=='string'||sourceIds.has(b.id)||
     b.finiteDomainVerified!==true||
     ![-1,1].includes(b.signY)||![-1,1].includes(b.signZ)||
     !Array.isArray(b.xRange)||b.xRange.length!==2||
     !b.xRange.every(Number.isFinite)||!(b.xRange[1]>b.xRange[0])||
     !Array.isArray(b.witnesses)||b.witnesses.length!==3)
   throw new RangeError('genuine C3 M3 signed source branch incomplete');
  sourceIds.add(b.id);
  // Independent numerical witnesses corroborate the exact 3D circle
  // equations & finite axial caps. Tolerance here is ONLY a check of
  // already calculated floats, NEVER a source interval/occlusion cut.
  for(const witness of b.witnesses){
   const p=witness.point;
   if(!p||!['x','y','z'].every(k=>Number.isFinite(p[k]))||
      p.x<b.xRange[0]||p.x>b.xRange[1]||
      p.z<Z.zMin||p.z>Z.zMax||p.y<Y.yMin||p.y>Y.yMax||
      Math.abs((p.x-Z.xCenter)**2+(p.y-Z.yCenter)**2-Z.radius**2)>
       1e-8*Math.max(1,Z.radius**2)||
      Math.abs((p.x-Y.xCenter)**2+(p.z-Y.zCenter)**2-Y.radius**2)>
       1e-8*Math.max(1,Y.radius**2))
    throw new RangeError('true finite cylinder radial and axial source identity not proved');
  }
  const expected=partitionC3WDirectionalOpenIntervals(
   b.xRange,Z.xCenter,Y.xCenter);
  const actual=W.filter(row=>row.sourceId===b.id).sort((a,c)=>
   a.openParameterRange[0]-c.openParameterRange[0]);
  if(actual.length!==expected.length)
   throw new RangeError('C3 global W finite Boolean source coverage omitted root cells');
  for(let j=0;j<expected.length;j++){
   const e=expected[j],a=actual[j];
   if(!a||a.sourceId!==b.id||a.parameterKind!=='x'||
      !Array.isArray(a.openParameterRange)||
      a.openParameterRange.length!==2||
      a.openParameterRange[0]!==e.xOpenRange[0]||
      a.openParameterRange[1]!==e.xOpenRange[1]||
      a.zCylinderOutwardRaySign!==e.zCylinderOutwardRaySign||
      a.yCylinderOutwardRaySign!==e.yCylinderOutwardRaySign||
      a.sourceFirstAngleRayEntireIntervalProven!==true||
      a.switchingPointsAndEndpointsCertified!==false||
      a.standardLineStyle!=='undetermined'||
      a.finalV5StrokeAuthorized!==false)
    throw new RangeError('W global-depth envelope contradicts current authentic M5 radial source partition');
   const [lo,hi]=e.xOpenRange;
   if(!(hi>lo)||lo<center&&hi>center)
    throw new RangeError('global finite Boolean frontmost-depth switch missing source cut');
   const behind=hi<=center;
   const status=behind?'opaque-interior-ahead':'strict-interior-ray-clear';
   if(a.openInteriorVolumeRayStatus!==status)
    throw new RangeError('current local M5 source ray contradicts exact global Boolean frontmost depth');
   result.push({
    view:'W',sourceBranchId:b.id,revision,
    original3DSourceParameterOpenRange:[lo,hi],
    effectiveFrontmostCylinderXCenter:center,
    frontmostClosedFiniteBooleanDepthExpression:behind?
     'xFront=2*center-x':'xFront=x',
    frontmostDepthAffineSlope:behind?-1:1,
    frontmostDepthAffineIntercept:behind?2*center:0,
    sourceDepthStrictlyBehindGlobalBooleanFront:behind,
    sourceDepthEqualsGlobalBooleanFront:!behind,
    entireSourceOpenCellGlobalWFrontmostDepthVerified:true,
    strictForwardInteriorMatchesIndependentM5:true,
    originalBothFiniteCylinderCapInclusionVerified:true,
    nonSourceProjectedFeatureOcclusionVerified:false,
    closedEndpointsAndSwitchesCertified:false,
    engineeringLineStyle:'undetermined',finalV5Authorized:false
   });
  }
 }
 if(W.length!==result.length||
    W.some(row=>!sourceIds.has(row.sourceId))||
    result.length<source.branches.length)
  throw new RangeError('complete global W M3 source and M5 ray inventory mismatch');
 return freeze({
  schema:'draftai-c3-global-W-finite-Boolean-depth-envelope/1',
  revision,solidOperation:op,
  status:'scoped-entire-W-double-lateral-open-source-global-Boolean-depth',
  sourceAnalyticBranchCount:source.branches.length,
  verifiedGlobalWOpenCellCount:result.length,
  globallyFrontmostSourceOpenCellCount:
   result.filter(x=>x.sourceDepthEqualsGlobalBooleanFront).length,
  globallyOccludedSourceOpenCellCount:
   result.filter(x=>x.sourceDepthStrictlyBehindGlobalBooleanFront).length,
  effectiveFrontmostCylinderXCenter:center,
  proofUsesWholeClosedFiniteBooleanCrossSection:true,
  proofMethod:'analytic-closed-W-ray-intersection-of-two-original-finite-cylinders',
  openCells:result,
  allOriginalAnalyticWSourceSpansAccountedFor:true,
  entireWSourceCurveEndpointContinuityCertified:false,
  allFiniteCapAndCompositeOutlineDepthCertified:false,
  officialEngineeringLineStylesVerified:false,finalV5Authorized:false
 });
}
module.exports={auditC3GlobalWFiniteBooleanDepthEnvelope};
