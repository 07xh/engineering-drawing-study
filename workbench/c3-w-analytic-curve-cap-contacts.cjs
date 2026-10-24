'use strict';
/**
 * C3 bridge for the reusable W radical-curve / axis-line math theorem.
 * Exact CURRENT 3D source M3 and finite cap feature proofs only.
 *
 * A paper crossing may have two genuine 3D curve sources at DIFFERENT X;
 * record each separately. Coincident W paper points never merge spatial
 * vertices or prove standard line styles.
 */
const {evaluateUnifiedMath}=require('./unified-math-pipeline.cjs');
const {auditC3CapBoundaryIncidence}=
 require('./c3-cap-boundary-incidence.cjs');
const {intersectSignedRadicalCurveWithAxisLine}=
 require('../core/projection/signed-radical-axis-line-events.cjs');
const {project}=require('../core/projection/conventions.js');
const freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){
 for(const a of Object.values(x))freeze(a);Object.freeze(x);
}return x;};
const mix=(a,b,t)=>({x:a.x+(b.x-a.x)*t,
 y:a.y+(b.y-a.y)*t,z:a.z+(b.z-a.z)*t});
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
function auditC3WAnalyticCurveCapContacts({input,revision}={}){
 if(!Number.isSafeInteger(revision)||revision<0)
  throw new TypeError('current C3 W model revision required');
 const m3=evaluateUnifiedMath({
  kind:'finite-orthogonal-cylinder-intersection',input,revision});
 const absent=reason=>freeze({schema:'draftai-c3-W-radical-cap-contacts/1',
  revision,status:'not-covered',reason,events:[],
  allWCurveCapPairsEnumerated:false,fullC3ProjectedContourVerified:false,
  officialLineStylesVerified:false,finalV5StrokeAuthorized:false});
 if(m3.status!=='scoped-analytic-ready'||m3.sourceConfirmed!==true||
    m3.geometryVerifiedWithinSpecialistScope!==true||
    !m3.analyticallyCompleteWithinScope)return absent('current finite M3 source unavailable');
 const cap=auditC3CapBoundaryIncidence({input,revision});
 if(!['scoped-analytic-cap-junction-incidence',
       'undetermined-unmatched-lateral-cap-junction'].includes(cap.status)||
    cap.capSourceStatus!=='scoped-analytic-cap-boundary-pairs'||
    cap.standardLineStylesVerified!==false)return absent('finite cap geometry unverified');
 const Z=m3.source.zCylinder,Y=m3.source.yCylinder;
 const tolerance=1e-8*Math.max(1,Z.radius,Y.radius);
 const events=[];
 for(const branch of m3.branches){
  if(branch.finiteDomainVerified!==true||
     branch.officialLineStyle!=='undetermined')
   throw new RangeError('unverified C3 source analytic curve');
  const curve={parameter:{from:branch.xRange[0],to:branch.xRange[1]},
   coordinates:{
    x:{kind:'affine',offset:0,slope:1},
    y:{kind:'signed-circle-radical',center:Z.xCenter,
     offset:Z.yCenter,radius:Z.radius,sign:branch.signY},
    z:{kind:'signed-circle-radical',center:Y.xCenter,
     offset:Y.zCenter,radius:Y.radius,sign:branch.signZ}
   }};
  for(const capSource of cap.capSegments){
   const from=project(capSource.from).W,to=project(capSource.to).W;
   const proof=intersectSignedRadicalCurveWithAxisLine({
    curve,from,to,tolerance});
   if(proof.allAxisLineContactsWithinSupportedScopeEnumerated!==true||
      proof.officialLineStylesVerified!==false)
    throw new RangeError('unverified W exact axis line crossing enumeration');
   for(const e of proof.events){
    const capPoint=e.projectedLineCollapsed?
     {x:e.parameterX,y:capSource.from.y,z:capSource.from.z}:
     mix(capSource.from,capSource.to,e.projectedLineParameter);
    const bounded=e.projectedLineCollapsed?
     e.parameterX>=Math.min(capSource.from.x,capSource.to.x)-tolerance&&
     e.parameterX<=Math.max(capSource.from.x,capSource.to.x)+tolerance:
     true;
    const residual=dist(capPoint,e.sourceCurvePoint3D);
    const coincident=bounded&&residual<=tolerance;
    const paper=project(capPoint).W;
    if(!Object.values(paper).every(Number.isFinite)||
       Math.hypot(paper.u-e.projectedUV.u,
        paper.v-e.projectedUV.v)>tolerance*5)
     throw new RangeError('C3 cap source does not project to candidate W crossing');
    events.push({id:'C3WCurveCapEvent'+events.length,view:'W',
     sourceBranchId:branch.id,sourceCapFeatureId:capSource.id,
     sourceCapPairKind:capSource.pairKind,
     sourceXParameter:e.parameterX,
     projectedUV:{...e.projectedUV},
     sourceCurve3DPoint:{...e.sourceCurvePoint3D},
     sourceCap3DPoint:{...capPoint},
     sourceCap3DXDomainContainsCurveX:bounded,
     signedCapMinusCurveObserverDepth:capPoint.x-e.sourceCurvePoint3D.x,
     pointwiseTrue3DSourceCoincidenceVerified:coincident,
     projectedSourceOnlyNotPhysicalJoin:!coincident,
     projectedLineCollapsed:e.projectedLineCollapsed,
     projectedSourceClassification:e.classification,
     projectedSourceCriticalReason:e.criticalReason,
     original3DFeatureGraphSplitAtCrossing:false,
     completeProjectedCurveLineTopologyVerified:false,
     officialLineStyle:'undetermined',finalV5StrokeAuthorized:false});
   }
  }
 }
 return freeze({schema:'draftai-c3-W-radical-cap-contacts/1',
  revision,status:'scoped-exact-W-analytic-curve-cap-line-events',
  sourceM3BranchCount:m3.branchCount,
  sourceFiniteCapPairCount:cap.capSegments.length,
  events,projectedContactCandidateCount:events.length,
  true3DContactCandidateCount:events.filter(e=>
   e.pointwiseTrue3DSourceCoincidenceVerified).length,
  paperOnlyContactCount:events.filter(e=>
   e.projectedSourceOnlyNotPhysicalJoin).length,
  allWCurveCapPairsEnumerated:true,
  exactAnalyticParameterPreservesDistinct3DSources:true,
  fullyPartitionedWOpenCurveContinuityVerified:false,
  completeProjectedCurveLineTopologyVerified:false,
  fullC3ProjectedContourVerified:false,
  officialLineStylesVerified:false,finalV5StrokeAuthorized:false});
}
module.exports={auditC3WAnalyticCurveCapContacts};
