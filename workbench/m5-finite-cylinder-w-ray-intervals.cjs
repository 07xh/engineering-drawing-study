'use strict';
/**
 * Shared M5 exact-sign open-interval observer-ray theorem, specialized by M3
 * input geometry rather than a drawing problem ID.
 *
 * Source: the already verified, nondegenerate lateral/lateral intersection of
 * one finite cylinder parallel to z and one parallel to y. Both volume axes
 * are perpendicular to the W observer direction +x. Every curve point is on
 * both positive-radius lateral boundaries. Holding axial coordinates y/z
 * fixed, travel toward observer by t>0:
 *
 *   qZ(x+t) - rZ² = 2*(x-Z.xCenter)*t + t²
 *   qY(x+t) - rY² = 2*(x-Y.xCenter)*t + t².
 *
 * Therefore when x >= max(two X centers), BOTH residuals are strictly >0 for
 * all t>0: no reviewed solid can occlude an OPEN curve interval.
 * When x < max(two X centers), at least one residual is strictly <0 for
 * sufficiently small t>0, with its axial coordinate strictly within its
 * finite caps on the OPEN curve interval: that solid provably occludes it.
 *
 * Partition the entire M3 x-domain at both centers. This establishes
 * continuous W ray visibility or interior occlusion without sampling or
 * interpolation. W curve endpoints and threshold joins remain unapproved;
 * V/H (generators or silhouettes along cylinder axes), standard line style,
 * ConstructionIntent and full V5 are deliberately withheld.
 */
const {evaluateUnifiedMath}=require('./unified-math-pipeline.cjs');
const {FIRST_ANGLE_OBSERVER_RAYS}=require('../core/projection/conventions.js');
const finite=Number.isFinite;
function freeze(v){if(v&&typeof v==='object'&&!Object.isFrozen(v)){
 for(const child of Object.values(v))freeze(child);
 Object.freeze(v);
 }return v;}
function auditFiniteCylinderWRayIntervals({input,revision}={}){
 if(!Number.isSafeInteger(revision)||revision<0)
  throw new TypeError('current M3 model revision required');
 const result=evaluateUnifiedMath({
  kind:'finite-orthogonal-cylinder-intersection',input,revision
 });
 if(result.status!=='scoped-analytic-ready'||
    result.geometryVerifiedWithinSpecialistScope!==true||
    result.analyticallyCompleteWithinScope!==true||
    result.verifiedCapClipping!==true||
    result.v5Ready!==false||result.officialLineStylesVerified!==false||
    result.sourceConfirmed!==true)
  return freeze({schema:'draftai-m5-analytic-finite-cylinder-ray-intervals/1',
   revision,status:'not-covered',sourceStatus:result.status,
   intervals:[],intervalCount:0,certifiedOpenVisibleCount:0,
   certifiedOpenOccludedCount:0,undeterminedCount:0,
   sourceBranchCoverageVerified:false,endpointJoinsVerified:false,
   viewCoverage:{V:'undetermined',H:'undetermined',W:'not-covered'},
   standardLineStylesVerified:false,continuousCurveV5Ready:false});
 if(!result.source?.zCylinder||!result.source?.yCylinder||
    result.branches.length>64)
  throw new RangeError('M3 source axes absent or too many analytic branches');
 const z=result.source.zCylinder,y=result.source.yCylinder;
 const expected=FIRST_ANGLE_OBSERVER_RAYS.W;
 if(expected.x!==1||expected.y!==0||expected.z!==0)
  throw new RangeError('first-angle W observer geometry changed');
 const centers=[z.xCenter,y.xCenter];
 const furthest=Math.max(...centers);
 const lengthTol=Math.max(1e-10,
  1e-12*Math.max(1,z.radius,y.radius,Math.abs(furthest)));
 const intervals=[];
 let visible=0,hidden=0,unknown=0;
 for(const branch of result.branches){
  const [a,b]=branch.xRange;
  if(!finite(a)||!finite(b)||!(b>a)||
     branch.finiteDomainVerified!==true||
     ![-1,1].includes(branch.signY)||
     ![-1,1].includes(branch.signZ)||
     branch.officialLineStyle!=='undetermined')
   throw new RangeError('invalid independently verified analytic M3 curve branch');
  const cuts=[a,...centers.filter(c=>c>a&&c<b),b]
   .sort((v,w)=>v-w).filter((v,i,arr)=>i===0||v>arr[i-1]);
  if(cuts.length<2||cuts[0]!==a||cuts.at(-1)!==b)
   throw new RangeError('missing M3 source parameter interval coverage');
  for(let k=0;k<cuts.length-1;k++){
   const lo=cuts[k],hi=cuts[k+1],width=hi-lo;
   if(width<=0)throw new RangeError('invalid certified W ray subinterval');
   const bounded=width<=lengthTol;
   const frontOpen=!bounded&&lo>=furthest;
   const blockedOpen=!bounded&&hi<=furthest;
   const status=frontOpen?'certified-continuously-visible-open-interval':
    blockedOpen?'certified-continuously-occluded-open-interval':
    'undetermined-near-critical-ray-event';
   if(frontOpen)visible++;
   else if(blockedOpen)hidden++;
   else unknown++;
   intervals.push({
    id:'w'+intervals.length,branchId:branch.id,sourceM3BranchId:branch.id,
    sourceSignY:branch.signY,sourceSignZ:branch.signZ,
    view:'W',observerDirection:{...expected},xOpenRange:[lo,hi],
    status,positiveViewerRayClearVerified:frontOpen,
    positiveOtherSolidInteriorAheadVerified:blockedOpen,
    axialCapsStrictOnOpenBranchVerified:frontOpen||blockedOpen,
    polynomialWitness:{
     zCylinderRayDifference:'2*(x-zCylinder.xCenter)*t+t*t',
     yCylinderRayDifference:'2*(x-yCylinder.xCenter)*t+t*t',
     observerRayParameter:'t>0',
     sourceXCenters:[...centers],
     frontmostThresholdX:furthest,
     exactSignDomain:frontOpen?'both-radial-residuals-strictly-positive':
      blockedOpen?'at-least-one-residual-negative-for-small-positive-t':
      'undetermined'
    },
    originalCurveEndpointJoinsVerified:false,
    officialVisibleHiddenStrokeVerified:false,
    V5LineActionAuthorized:false
   });
  }
 }
 // The partitions must cover the original M3 branch intervals exactly,
 // without replacing a missing sign branch by interpolation.
 for(const b of result.branches){
  const span=intervals.filter(x=>x.branchId===b.id);
  if(!span.length||span[0].xOpenRange[0]!==b.xRange[0]||
    span.at(-1).xOpenRange[1]!==b.xRange[1]||
    span.some((x,i)=>i>0&&x.xOpenRange[0]!==span[i-1].xOpenRange[1]))
   throw new RangeError('incomplete full-branch x-interval coverage');
 }
 return freeze({schema:'draftai-m5-analytic-finite-cylinder-ray-intervals/1',
  revision,status:'source-bounded-W-open-rays',
  sourceBranchCount:result.branchCount,
  sourceGeometryScope:'M3-two-perpendicular-finite-convex-cylinders',
  sourceBranchCoverageVerified:true,
  intervals,intervalCount:intervals.length,
  certifiedOpenVisibleCount:visible,
  certifiedOpenOccludedCount:hidden,
  undeterminedCount:unknown,
  viewCoverage:{V:'undetermined-generator-direction',
   H:'undetermined-generator-direction',W:'scoped-open-interior-certified'},
  endpointJoinsVerified:false,
  sourceAnalyticContinuityVerifiedWithinOpenIntervals:true,
  standardLineStylesVerified:false,
  canonicalConstructionReady:false,
  continuousCurveV5Ready:false
 });
}
module.exports={auditFiniteCylinderWRayIntervals};
