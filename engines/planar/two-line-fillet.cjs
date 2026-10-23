'use strict';
/**
 * P0 / 02: every mathematical center for a fixed-radius circle tangent to
 * two INFINITE directed straight lines. All model coordinates share a unit
 * (normally mm). No finite-segment, arc-sweep or directed G1 claim is made.
 *
 * Each line has two signed offset loci at +/- radius. Intersecting lines
 * yield up to four distinct discrete centers. Coincident offset loci yield
 * continuous families; parallel disjoint loci yield no centers. Near-parallel
 * geometry is explicitly marked unstable rather than drawing a huge guess.
 */
const {normalizedLine,offsetLine,DEFAULT_TOLERANCE}=
  require('./offset-tangency.cjs');

const EXACT_PARALLEL_SINE=1e-14;
const DEFAULT_ANGULAR_TOLERANCE=1e-8;
const finite=x=>typeof x==='number'&&Number.isFinite(x);
function positive(x,label){
 if(!finite(x)||x<=0)throw new RangeError(label+' must be finite and positive');
 return x;
}
function sideList(side,label){
 if(side===undefined)return [-1,1];
 if(side!==-1&&side!==1)throw new RangeError(label+' must be +1 or -1');
 return [side];
}
function dot(a,b){return a.x*b.x+a.y*b.y}
function add(a,b,s){return {x:a.x+s*b.x,y:a.y+s*b.y}}
function determinant(a,b){return a.x*b.y-a.y*b.x}
function checkedPoint(point,label){
 if(!finite(point.x)||!finite(point.y))
  throw new RangeError(label+' exceeds finite coordinate range');
 return point;
}
function twoLineFilletCenters({
 first,second,filletRadius,firstSide,secondSide,
 epsilon=DEFAULT_TOLERANCE,angularTolerance=DEFAULT_ANGULAR_TOLERANCE
}={}){
 const A=normalizedLine(first),B=normalizedLine(second);
 const r=positive(filletRadius,'filletRadius');
 const eps=positive(epsilon,'epsilon');
 const angular=positive(angularTolerance,'angularTolerance');
 if(angular<=EXACT_PARALLEL_SINE||angular>0.1)
  throw new RangeError('angularTolerance out of valid range');
 const sidesA=sideList(firstSide,'firstSide');
 const sidesB=sideList(secondSide,'secondSide');
 const det=determinant(A.normal,B.normal);
 const delta={x:B.a.x-A.a.x,y:B.a.y-A.a.y};
 checkedPoint(delta,'line separation');
 const separation=Math.hypot(delta.x,delta.y);
 if(!finite(separation))throw new RangeError('line separation overflow');
 const scale=eps*Math.max(1,r);
 const pairs=[];
 for(const sa of sidesA)for(const sb of sidesB)
  pairs.push({first:sa,second:sb,id:'s'+(sa>0?'+':'-')+(sb>0?'+':'-')});
 const result={
  scope:'two-infinite-lines-fixed-radius-signed-offsets',unit:'input-math-unit',
  uniquenessScope:'specified line sides and fixed circle radius; finite contours not considered',
  candidates:[],candidateCount:0,continuousFamilies:[],rejectedBranches:[],
  solutionCount:0,continuousDegreesOfFreedom:null,
  directedG1Verified:false,finiteContactVerified:false,
  angularSeparationSine:Math.abs(det)
 };
 if(Math.abs(det)>EXACT_PARALLEL_SINE&&Math.abs(det)<angular){
  return {...result,status:'unstable',solutionCount:null,
   reason:'near-parallel offset-line intersection is ill-conditioned',
   rejectedBranches:pairs.map(p=>({...p,reason:'near-parallel-numerical-instability'}))};
 }
 for(const pair of pairs){
  const sa=pair.first,sb=pair.second;
  // Local origin A.a avoids multiplying enormous absolute world coordinates.
  const rhsA=sa*r;
  const rhsB=dot(B.normal,delta)+sb*r;
  if(!finite(rhsB))throw new RangeError('offset scalar overflow');
  const firstOffset=offsetLine(first,sa*r);
  const secondOffset=offsetLine(second,sb*r);
  if(Math.abs(det)<=EXACT_PARALLEL_SINE){
   // Signed distance of a point from the first offset line to second locus.
   // Compare an ABSOLUTE model-unit discrepancy, never a relative coordinate
   // tolerance which could accept 10mm at a 1e12mm world origin.
   const gap=dot(B.normal,{x:A.a.x-B.a.x,y:A.a.y-B.a.y})+
    r*(sa*dot(B.normal,A.normal)-sb);
   if(!finite(gap))throw new RangeError('offset gap overflow');
   if(Math.abs(gap)<=scale){
    result.continuousFamilies.push({
     id:pair.id,sides:{first:sa,second:sb},degrees:1,
     firstOffsetLine:firstOffset,secondOffsetLine:secondOffset,
     reason:'coincident offset loci; infinitely many tangent centers'
    });
   }else{
    result.rejectedBranches.push({...pair,reason:'parallel-offset-lines-disjoint'});
   }
   continue;
  }
  const local={
   x:(rhsA*B.normal.y-rhsB*A.normal.y)/det,
   y:(A.normal.x*rhsB-B.normal.x*rhsA)/det
  };
  checkedPoint(local,'offset intersection');
  const center=checkedPoint(add(A.a,local,1),'center');
  const c1=checkedPoint(add(center,A.normal,-sa*r),'first contact');
  const c2=checkedPoint(add(center,B.normal,-sb*r),'second contact');
  const residuals={
   firstOffset:Math.abs(dot(A.normal,{x:center.x-A.a.x,y:center.y-A.a.y})-sa*r),
   secondOffset:Math.abs(dot(B.normal,{x:center.x-B.a.x,y:center.y-B.a.y})-sb*r),
   firstContactOnLine:Math.abs(dot(A.normal,{x:c1.x-A.a.x,y:c1.y-A.a.y})),
   secondContactOnLine:Math.abs(dot(B.normal,{x:c2.x-B.a.x,y:c2.y-B.a.y})),
   firstRadius:Math.abs(Math.hypot(center.x-c1.x,center.y-c1.y)-r),
   secondRadius:Math.abs(Math.hypot(center.x-c2.x,center.y-c2.y)-r),
   firstNormality:Math.abs(dot(A.tangent,{x:center.x-c1.x,y:center.y-c1.y})),
   secondNormality:Math.abs(dot(B.tangent,{x:center.x-c2.x,y:center.y-c2.y}))
  };
  const maxResidual=Math.max(...Object.values(residuals));
  if(!finite(maxResidual)||maxResidual>scale*8)
   throw new RangeError('candidate fails mathematical residual check');
  result.candidates.push({
   id:pair.id,sides:{first:sa,second:sb},center,
   contacts:{first:c1,second:c2},filletRadius:r,
   residuals,maxResidual,arcDirection:null,arcSweep:null,
   // True mathematical construction steps, not a fabricated textbook answer.
   steps:[
    {id:pair.id+'-offset1',kind:'offset-line',role:'auxiliary',
     geometry:firstOffset,reason:'沿第一条直线指定侧作半径距离的平行线'},
    {id:pair.id+'-offset2',kind:'offset-line',role:'auxiliary',
     geometry:secondOffset,reason:'沿第二条直线指定侧作半径距离的平行线'},
    {id:pair.id+'-intersection',kind:'intersection',role:'auxiliary',
     point:center,reason:'两条偏移直线的交点是候选连接圆心'},
    {id:pair.id+'-perpendiculars',kind:'perpendicular-feet',role:'result',
     points:{first:c1,second:c2},maxResidual,
     reason:'从候选圆心向两条已知直线作垂线，垂足是相切点'}
   ]
  });
 }
 result.candidateCount=result.candidates.length;
 if(result.continuousFamilies.length){
  return {...result,status:'continuous',solutionCount:null,
   continuousDegreesOfFreedom:1,
   reason:'at least one signed offset branch has infinitely many circle centers'};
 }
 result.solutionCount=result.candidateCount;
 result.status=result.candidateCount===0?'none':
  result.candidateCount===1?'unique':'multiple';
 result.continuousDegreesOfFreedom=result.candidateCount?0:null;
 result.reason=result.candidateCount
  ?'each candidate has both tangent contact points; arc direction still unspecified'
  :'no selected signed offset lines intersect';
 return result;
}
module.exports={DEFAULT_ANGULAR_TOLERANCE,twoLineFilletCenters};
