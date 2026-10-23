'use strict';
/**
 * P0 DA-07. Grade ONE student-drawn directed connecting ARC against the
 * *recomputed* verified DA-02 fillet; never accept UI-provided answer geometry.
 *
 * This checks curve geometry and ordered traversal in model millimeters.
 * It does not certify auxiliary offset constructions, finite SOURCE-circle
 * arc boundaries or unrestricted arbitrary-polygon freehand curves.
 */
const {chooseDirectedFillet}=require('../engines/planar/directed-circle-fillet.cjs');
const {chooseFiniteTwoSegmentArc}=require('../engines/planar/directed-two-segment-fillet.cjs');
const {chooseDirectedSegmentCircleFillet}=
 require('../engines/planar/directed-segment-circle-fillet.cjs');
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const pt=p=>!!p&&typeof p==='object'&&finite(p.x)&&finite(p.y);
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const RAD=Math.PI/180;
const MAX_SAMPLE_GAP=30*RAD;
function gradeFilletArcDrawing(args,stroke,{kind,origin,scale,revision,toleranceMm=0.75}={}){
 if(!['circles','segments','segment-circle'].includes(kind))throw new TypeError('recognized geometry kind required');
 if(!pt(origin)||!finite(scale)||scale<=0||
    !finite(toleranceMm)||toleranceMm<=0||toleranceMm>2||
    !Number.isSafeInteger(revision)||revision<0)
  throw new TypeError('valid sheet origin, scale, positive mm tolerance and revision required');
 const solved=kind==='circles'?chooseDirectedFillet(args):
  kind==='segment-circle'?chooseDirectedSegmentCircleFillet(args):
  chooseFiniteTwoSegmentArc(args);
 const fullProof=solved.status==='selected'&&solved.g1Verified===true&&
   !!solved.geometry&&!!solved.contacts&&
   (kind==='circles'?(solved.sourceArcRangeVerified===true):
    kind==='segment-circle'?
     solved.finiteSegmentContactVerified===true&&solved.sourceArcRangeVerified===true:
     solved.finiteArcSweepVerified===true);
 const base={gradeScope:'single-directed-fillet-arc-only',kind,revision,
  sourceProofVerified:fullProof,geometryValidated:false,
  sourceBoundsVerified:kind==='segment-circle'?solved.sourceArcRangeVerified===true&&
   solved.finiteSegmentContactVerified===true:
    kind==='circles'?solved.sourceArcRangeVerified===true:undefined};
 if(!fullProof)return {...base,status:'not-verified',sampleCount:0,
  reason:'需选择真实有效分支、明确圆弧方向并通过两端有向 G1，才可判曲线'};
 if(stroke===null||stroke===undefined)
  return {...base,status:'incomplete',sampleCount:0,
   reason:'尚未提供手绘连接圆弧'};
 if(!stroke||stroke.revision!==revision||!Array.isArray(stroke.points)||
    stroke.points.length>800||stroke.points.length<2||
    stroke.points.some(p=>!pt(p)))
  throw new TypeError('stale, invalid or out-of-range arc samples');
 const g=solved.geometry.data;
 if(!pt(g.center)||!finite(g.radius)||g.radius<=0||
    !finite(g.startAngle)||!finite(g.endAngle)||
    !['cw','ccw'].includes(g.direction)||
    !pt(solved.contacts.first)||!pt(solved.contacts.second))
  throw new RangeError('selected mathematical arc is incomplete');
 const radSweep=(g.endAngle-g.startAngle)*RAD;
 const sign=g.direction==='ccw'?1:-1;
 if(!finite(radSweep)||sign*radSweep<=0||Math.abs(radSweep)>=2*Math.PI)
  throw new RangeError('selected directed arc has invalid sweep');
 const tolerance=Math.min(toleranceMm,g.radius*0.12);
 const modelPoints=stroke.points.map(p=>{
  const v={x:(p.x-origin.x)/scale,y:(origin.y-p.y)/scale};
  if(!pt(v))throw new RangeError('stroke model coordinate overflow');
  return v;
 });
 const nearStart=dist(modelPoints[0],solved.contacts.first);
 const nearEnd=dist(modelPoints[modelPoints.length-1],solved.contacts.second);
 const radial=modelPoints.map(p=>Math.abs(dist(p,g.center)-g.radius));
 const maxRadialResidualMm=Math.max(...radial);
 let total=0,largestAngularGap=0,backwardMotion=0,actualLength=0;
 for(let i=1;i<modelPoints.length;i++){
  const p=modelPoints[i-1],q=modelPoints[i];
  const a=Math.atan2(p.y-g.center.y,p.x-g.center.x);
  const b=Math.atan2(q.y-g.center.y,q.x-g.center.x);
  // Principal signed angle in (-pi, pi] allows crossing +/-pi,
  // but each sample step must stay small enough to rule out aliasing.
  const delta=Math.atan2(Math.sin(b-a),Math.cos(b-a));
  const progress=sign*delta;
  largestAngularGap=Math.max(largestAngularGap,Math.abs(progress));
  if(progress<0)backwardMotion+=-progress;
  total+=progress;
  actualLength+=dist(p,q);
 }
 const expected=Math.abs(radSweep);
 // Fewer than 9 samples cannot establish an actual curved path instead of
 // a straight chord, even if its endpoints happen to be correct.
 const enough=stroke.points.length>=9;
 const continuous=largestAngularGap<=MAX_SAMPLE_GAP&&
    backwardMotion<=3*RAD&&
    actualLength>0&&finite(actualLength);
 const sweepResidualDegrees=Math.abs(total-expected)/RAD;
 const angleAllowedDegrees=Math.min(7,Math.max(2,tolerance/g.radius/RAD));
 const correct=enough&&continuous&&nearStart<=tolerance&&nearEnd<=tolerance&&
    maxRadialResidualMm<=tolerance&&sweepResidualDegrees<=angleAllowedDegrees;
 // Each diagnostic is an independently checked BOOLEAN. Neither the arc
 // geometry nor any ideal contact coordinates are exposed in student feedback.
 const checks={
  enoughSamples:enough,
  endpointsWithinTolerance:nearStart<=tolerance&&nearEnd<=tolerance,
  radiusWithinTolerance:maxRadialResidualMm<=tolerance,
  sampleSpacingValid:largestAngularGap<=MAX_SAMPLE_GAP,
  traversalDirectionValid:backwardMotion<=3*RAD,
  nondegenerate:actualLength>0&&finite(actualLength),
  sweepWithinTolerance:sweepResidualDegrees<=angleAllowedDegrees
 };
 return {...base,status:correct?'correct':'incorrect',
  checks,
  geometryValidated:correct,sampleCount:stroke.points.length,
  maxRadialResidualMm,endpointResidualMm:{start:nearStart,end:nearEnd},
  sweepResidualDegrees,largestAngularGapDegrees:largestAngularGap/RAD,
  backwardMotionDegrees:backwardMotion/RAD,toleranceMm:tolerance,
  reason:correct
   ?kind==='segment-circle'?
    '线段切点与给定有限圆弧范围均经数学求解器核实，且学生圆弧半径、两端切点、连续轨迹与有向扫角已通过；尚不能代表全部辅助线或整题正确':
    '手绘圆弧的模型半径、两个切点、连续曲率轨迹与有向扫角已验证；不能据此认定全部辅助线或有限已知圆弧范围正确'
   :'手绘弧未同时满足切点、半径残差、连续采样与规定旋向的数学检验'};
}
module.exports={gradeFilletArcDrawing};
