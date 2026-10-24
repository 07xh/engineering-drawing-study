'use strict';
/**
 * C3 first-angle V/H analytic projection ownership and deterministic de-dup.
 *
 * V=(x,z): z=Y.zCenter+signZ*sqrt(Y.r²-(x-Y.xCenter)²).
 * H=(x,y): y=Z.yCenter+signY*sqrt(Z.r²-(x-Z.xCenter)²).
 *
 * The OTHER branch sign is eliminated by projection. Two different 3D M3
 * branches with the same retained sign have precisely the SAME projected
 * curve wherever their x ranges overlap. Moreover their projection lies
 * ON the owning cylinder's ORIGINAL circular view outline, not a separate
 * independent contour to be drawn twice. Merge only same-view/same-sign
 * overlapping or touching source x ranges. The output is a source-identity
 * geometry preview; no line style or source ownership of official strokes
 * is certified without full composite/depth/topology evidence.
 */
const {evaluateUnifiedMath}=require('./unified-math-pipeline.cjs');
const {project}=require('../core/projection/conventions.js');
const freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){
 for(const v of Object.values(x))freeze(v);Object.freeze(x);
}return x;};
function buildC3VHProjectionDedup({input,revision}={}){
 if(!Number.isSafeInteger(revision)||revision<0)
  throw new TypeError('current C3 model revision required');
 const M=evaluateUnifiedMath({kind:'finite-orthogonal-cylinder-intersection',
  input,revision});
 const no=()=>freeze({schema:'draftai-c3-vh-projection-dedup/1',
  revision,status:'not-covered',spans:[],sourceBranchCount:0,
  projectionOwnershipVerified:false,officialLineStylesVerified:false,
  v5CurveActionsAuthorized:false});
 if(M.status!=='scoped-analytic-ready'||M.sourceConfirmed!==true||
   M.geometryVerifiedWithinSpecialistScope!==true||
   M.analyticallyCompleteWithinScope!==true||
   M.verifiedCapClipping!==true)return no();
 const Z=M.source.zCylinder,Y=M.source.yCylinder;
 const sample=project({x:5,y:7,z:11});
 if(sample.V.u!==5||sample.V.v!==11||
    sample.H.u!==5||sample.H.v!==7)
  throw new RangeError('first-angle V/H geometry convention changed');
 const definitions=[
  {view:'V',sourceCylinder:'yCylinder',retainedSign:'signZ',
   xCenter:Y.xCenter,coordinateCenter:Y.zCenter,radius:Y.radius},
  {view:'H',sourceCylinder:'zCylinder',retainedSign:'signY',
   xCenter:Z.xCenter,coordinateCenter:Z.yCenter,radius:Z.radius}
 ];
 const spans=[];
 for(const def of definitions){
  for(const sign of [-1,1]){
   const matching=M.branches.filter(b=>b[def.retainedSign]===sign)
    .sort((a,b)=>a.xRange[0]-b.xRange[0]||
      a.xRange[1]-b.xRange[1]||a.id.localeCompare(b.id));
   const merged=[];
   for(const b of matching){
    if(b.finiteDomainVerified!==true||b.officialLineStyle!=='undetermined'||
       !Array.isArray(b.xRange)||!(b.xRange[1]>b.xRange[0]))
     throw new RangeError('unverified C3 analytic source branch');
    const last=merged.at(-1);
    if(last&&b.xRange[0]<=last.xRange[1]){
     last.xRange[1]=Math.max(last.xRange[1],b.xRange[1]);
     last.sourceBranchIds.push(b.id);
    }else merged.push({xRange:[...b.xRange],sourceBranchIds:[b.id]});
   }
   for(const piece of merged){
    const [lo,hi]=piece.xRange;
    if(!(lo<hi)||lo<def.xCenter-def.radius-1e-8||
        hi>def.xCenter+def.radius+1e-8)
     throw new RangeError('projection union outside owner circle radial support');
    spans.push({id:'c3-'+def.view+'-'+(sign<0?'minus':'plus')+
      '-'+spans.length,
     view:def.view,sourceCylinder:def.sourceCylinder,
     retainedSign:sign,xOpenRange:[lo,hi],
     sourceBranchIds:[...new Set(piece.sourceBranchIds)].sort(),
     projectedAnalyticFormula:
      'v=c+s*sqrt(r*r-(x-xCenter)*(x-xCenter))',
     projectedSourceCircle:{xCenter:def.xCenter,
      coordinateCenter:def.coordinateCenter,radius:def.radius},
     coincidesWithOriginalCylinderCircularViewContour:true,
     exactDifferent3DBranchProjectionOverlapDeduplicated:true,
     originalEngineeringContourOwnershipVerified:false,
     officialLineStyle:'undetermined',v5CurveActionAuthorized:false});
   }
  }
 }
 // Every original M3 branch contributes once per projection, and EVERY
 // original x point is represented by the merged source interval.
 for(const view of ['V','H'])for(const branch of M.branches){
  const matches=spans.filter(s=>s.view===view&&
   s.sourceBranchIds.includes(branch.id)&&
   s.xOpenRange[0]<=branch.xRange[0]&&
   s.xOpenRange[1]>=branch.xRange[1]);
  if(matches.length!==1)
   throw new RangeError('missing or duplicated C3 source projection coverage');
 }
 return freeze({schema:'draftai-c3-vh-projection-dedup/1',
  revision,status:'scoped-projected-analytic-interval-deduplicated',
  sourceBranchCount:M.branchCount,
  sourceVBranchCount:M.branchCount,sourceHBranchCount:M.branchCount,
  visibleUniqueVSpanCount:spans.filter(s=>s.view==='V').length,
  visibleUniqueHSpanCount:spans.filter(s=>s.view==='H').length,
  spans,projectionOwnershipVerified:true,
  originalCylinderContourCoincidenceProven:true,
  allOriginal3DFeatureDepthOrderVerified:false,
  completeContourLineStyleVerified:false,
  officialLineStylesVerified:false,v5CurveActionsAuthorized:false});
}
function evaluateC3VHProjectedSpan(span,x){
 if(!span||!['V','H'].includes(span.view)||
    !Number.isFinite(x)||!Array.isArray(span.xOpenRange)||
    x<span.xOpenRange[0]||x>span.xOpenRange[1]||
    ![-1,1].includes(span.retainedSign)||
    span.officialLineStyle!=='undetermined'||
    span.v5CurveActionAuthorized!==false||
    span.coincidesWithOriginalCylinderCircularViewContour!==true)
  throw new TypeError('only reviewed C3 projected source span may be drawn');
 const c=span.projectedSourceCircle;
 if(!c||![c.xCenter,c.coordinateCenter,c.radius].every(Number.isFinite)||
    c.radius<=0)throw new TypeError('invalid source circle');
 const radical=(c.radius-Math.abs(x-c.xCenter))*
  (c.radius+Math.abs(x-c.xCenter));
 if(radical< -1e-9*Math.max(1,c.radius*c.radius))
  throw new RangeError('projected analytic source left circle');
 const uv={u:x,v:c.coordinateCenter+
  span.retainedSign*Math.sqrt(Math.max(0,radical))};
 if(!Object.values(uv).every(Number.isFinite))
  throw new RangeError('non-finite C3 source projection');
 return Object.freeze(uv);
}
module.exports={buildC3VHProjectionDedup,evaluateC3VHProjectedSpan};
