'use strict';
/**
 * P0 02 finite-segment consumer of the already tested two-INFINITE-line
 * tangent-circle solver. A valid infinite-line tangent contact may lie past
 * the segment endpoints; never silently accept those extensions.
 *
 * Both source segments are oriented a -> b and optional signed sides are
 * relative to these orientations. Outputs are in model units, NOT pixels.
 * Neither a circle arc sweep nor directed G1 is proven here.
 */
const {normalizedLine,DEFAULT_TOLERANCE}=require('./offset-tangency.cjs');
const {twoLineFilletCenters}=require('./two-line-fillet.cjs');
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const dot=(a,b)=>a.x*b.x+a.y*b.y;
const minus=(a,b)=>({x:a.x-b.x,y:a.y-b.y});
const add=(a,b,s)=>({x:a.x+s*b.x,y:a.y+s*b.y});
const reportContact=(point,line)=>{
 const along=dot(minus(point,line.a),line.tangent);
 if(!finite(along))throw new RangeError('finite segment contact parameter overflow');
 const t=along/line.length;
 if(!finite(t))throw new RangeError('finite segment normalized parameter overflow');
 // A tangent point on the geometric extension is not a segment contact.
 return {inRange:along>=0&&along<=line.length,t,distance:along,
  atEndpoint:along===0||along===line.length};
};
const locusEndPoint=(firstOffset,otherPoint,tangent)=>
 dot(minus(otherPoint,firstOffset),tangent);
const emptyBase={
 scope:'two-finite-segments-fixed-radius-signed-offsets',
 unit:'input-math-unit',
 uniquenessScope:'fixed finite segments, fixed radius and optional signed sides',
 directedG1Verified:false,
 // Evidence exists only when a finite contact or clipped family exists.
 finiteSourceContactsVerified:false,
 finiteArcSweepVerified:false
};
function finiteTwoSegmentFillets({
 first,second,filletRadius,firstSide,secondSide,
 epsilon=DEFAULT_TOLERANCE,angularTolerance
}={}){
 const A=normalizedLine(first),B=normalizedLine(second);
 const math=twoLineFilletCenters({
  first,second,filletRadius,firstSide,secondSide,epsilon,
  ...(angularTolerance===undefined?{}:{angularTolerance})
 });
 const accepted=[],rejected=[];
 for(const c of math.candidates){
  const firstHit=reportContact(c.contacts.first,A);
  const secondHit=reportContact(c.contacts.second,B);
  if(!firstHit.inRange||!secondHit.inRange){
   rejected.push({id:c.id,reason:'contact-outside-finite-segment',
    firstInRange:firstHit.inRange,secondInRange:secondHit.inRange});
   continue;
  }
  accepted.push({...c,contactSegments:{
   first:{t:firstHit.t,distance:firstHit.distance,atEndpoint:firstHit.atEndpoint},
   second:{t:secondHit.t,distance:secondHit.distance,atEndpoint:secondHit.atEndpoint}
  },sourceContactsOnSegments:true});
 }
 // A parallel pair may have a continuous FAMILY of valid centers.
 // Unlike discrete infinite-line solutions, it must be clipped as a 1D
 // overlap between both finite offset SEGMENTS; an empty overlap is NONE.
 const families=[];
 for(const f of math.continuousFamilies){
  const base=f.firstOffsetLine.a;
  const u0=locusEndPoint(base,f.secondOffsetLine.a,A.tangent);
  const u1=locusEndPoint(base,f.secondOffsetLine.b,A.tangent);
  const lo=Math.max(0,Math.min(u0,u1));
  const hi=Math.min(A.length,Math.max(u0,u1));
  if(!finite(lo)||!finite(hi))throw new RangeError('parallel overlap parameter overflow');
  if(lo>hi){
   rejected.push({id:f.id,reason:'parallel-offset-overlap-outside-finite-segments'});
   continue;
  }
  const makeEndpoint=u=>{
   const center=add(base,A.tangent,u);
   const firstContact=add(center,A.normal,-f.sides.first*filletRadius);
   const secondContact=add(center,B.normal,-f.sides.second*filletRadius);
   const hit1=reportContact(firstContact,A),hit2=reportContact(secondContact,B);
   // The offset solver has already checked coincidence within epsilon;
   // avoid fabricating an endpoint when catastrophic rounding leaves the
   // other segment outside its actual range.
   if(!hit1.inRange||!hit2.inRange)
    return null;
   const mismatch=Math.max(
    Math.abs(dot(minus(firstContact,A.a),A.normal)),
    Math.abs(dot(minus(secondContact,B.a),B.normal)),
    Math.abs(Math.hypot(center.x-firstContact.x,center.y-firstContact.y)-filletRadius),
    Math.abs(Math.hypot(center.x-secondContact.x,center.y-secondContact.y)-filletRadius)
   );
   const bound=epsilon*Math.max(1,filletRadius)*8;
   if(!finite(mismatch)||mismatch>bound)
    throw new RangeError('parallel family fails residual validation');
   return {center,contacts:{first:firstContact,second:secondContact},
    contactSegments:{first:{t:hit1.t,distance:hit1.distance,atEndpoint:hit1.atEndpoint},
     second:{t:hit2.t,distance:hit2.distance,atEndpoint:hit2.atEndpoint}},
    maxResidual:mismatch};
  };
  const start=makeEndpoint(lo),end=makeEndpoint(hi);
  if(!start||!end){
   rejected.push({id:f.id,reason:'parallel-overlap-boundary-roundoff'});
   continue;
  }
  if(lo===hi){
   accepted.push({id:f.id+'-isolated-boundary',sides:f.sides,
    ...start,sourceContactsOnSegments:true,filletRadius,
    arcDirection:null,arcSweep:null,
    steps:[{id:f.id+'-boundary',kind:'parallel-offset-boundary',
     role:'auxiliary',point:start.center,
     reason:'两条有限偏移线段仅在边界点相接，得到唯一候选圆心'}]});
  }else{
   families.push({id:f.id,sides:f.sides,degrees:1,
    start,end,centerParameterRange:[lo,hi],
    firstOffsetLine:f.firstOffsetLine,
    secondOffsetLine:f.secondOffsetLine,
    reason:'overlap of two finite offset line segments yields a bounded continuous center family'});
  }
 }
 const result={...emptyBase,
  finiteSourceContactsVerified:accepted.length>0||families.length>0,
  candidates:accepted,candidateCount:accepted.length,
  continuousFamilies:families,rejectedCandidates:rejected,
  angularSeparationSine:math.angularSeparationSine};
 if(math.status==='unstable')
  return {...result,status:'unstable',solutionCount:null,
   continuousDegreesOfFreedom:null,reason:math.reason};
 if(families.length)
  return {...result,status:'continuous',solutionCount:null,
   continuousDegreesOfFreedom:1,
   reason:'finite parallel offsets overlap across a nonzero interval'};
 const count=accepted.length;
 return {...result,status:count===0?'none':count===1?'unique':'multiple',
  solutionCount:count,continuousDegreesOfFreedom:count?0:null,
  reason:count?'only candidates contacting both finite segments are retained'
   :'all mathematical centers are absent or contact outside the finite segments'};
}
module.exports={finiteTwoSegmentFillets};
