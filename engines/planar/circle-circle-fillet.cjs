'use strict';
/**
 * P0 02-B finite analytical center candidates for fillet circles tangent
 * to two given circles. This only determines center/contact loci, NOT the
 * start/end orientation of a finite connecting arc or directed G1 traversal.
 * Model units are consistent (e.g. mm), never display pixels.
 */
const DEFAULT_EPSILON=1e-9;
function numeric(value,label){if(typeof value!=='number'||!Number.isFinite(value))
 throw new TypeError(label+' must be finite numeric');return value;}
function pos(value,label){numeric(value,label);if(value<=0)throw new RangeError(label+' must be positive');return value;}
function pt(v,label){if(!v||typeof v!=='object')throw new TypeError(label+' required');
 return {x:numeric(v.x,label+'.x'),y:numeric(v.y,label+'.y')};}
const deg=Math.PI/180;
const wrap=angle=>((angle%360)+360)%360;
function finiteArc(input,label){
 if(!input||typeof input!=='object'||Array.isArray(input))
  throw new TypeError(label+' must be a directed finite arc');
 const start=numeric(input.startAngle,label+'.startAngle');
 const end=numeric(input.endAngle,label+'.endAngle');
 if(!['cw','ccw'].includes(input.direction))
  throw new RangeError(label+'.direction must be cw or ccw');
 const difference=end-start;
 // Nonempty proper arc only. A full source circle is represented by an
 // absent arc field, not a degenerate start=end or ambiguous 360° winding.
 if(!Number.isFinite(difference)||Math.abs(difference)>=360||
    Math.abs(difference)<=1e-11)
  throw new RangeError(label+' must have a nonzero proper angular extent under 360 degrees');
 const sweepDegrees=wrap(input.direction==='ccw'?difference:-difference);
 if(!(sweepDegrees>1e-11)&&sweepDegrees!==360)
  throw new RangeError(label+' contains no measurable directed arc');
 return {startAngle:start,endAngle:end,direction:input.direction,sweepDegrees};
}
function contactOnFiniteArc(circleSpec,contact,epsilon){
 if(!circleSpec.arc)return true;
 const arc=circleSpec.arc;
 const angle=wrap(Math.atan2(contact.y-circleSpec.center.y,
   contact.x-circleSpec.center.x)/deg);
 const advance=wrap(arc.direction==='ccw'?
   angle-arc.startAngle:arc.startAngle-angle);
 const toleranceDegrees=Math.atan2(epsilon*Math.max(1,circleSpec.radius),
   circleSpec.radius)/deg;
 // Account for floating-point error at either true endpoint; never
 // accept points in a missing portion of the supporting full circle.
 return advance<=arc.sweepDegrees+toleranceDegrees||
   360-advance<=toleranceDegrees;
}
function circle(input,label){if(!input||typeof input!=='object')throw new TypeError(label+' required');
 return {center:pt(input.center,label+'.center'),radius:pos(input.radius,label+'.radius'),
  ...(input.arc===undefined?{}:{arc:finiteArc(input.arc,label+'.arc')})};}
function locusRadius(R,r,mode){
 if(mode==='external')return R+r;
 if(mode==='internal')return Math.abs(R-r);
 throw new RangeError('tangency mode must be external or internal');
}
function circleCircleFilletCenters({first,second,filletRadius,firstMode='external',
 secondMode='external',epsilon=DEFAULT_EPSILON}={}){
 const A=circle(first,'first'),B=circle(second,'second');
 const r=pos(filletRadius,'filletRadius'),eps=pos(epsilon,'epsilon');
 const a=locusRadius(A.radius,r,firstMode),b=locusRadius(B.radius,r,secondMode);
 if(!Number.isFinite(a)||!Number.isFinite(b))throw new RangeError('auxiliary radius overflow');
 const delta={x:B.center.x-A.center.x,y:B.center.y-A.center.y};
 const d=Math.hypot(delta.x,delta.y),margin=eps*Math.max(1,a,b,d);
 const unit='input-math-unit';
 const empty=(status,reason)=>({
  status,reason,candidateCount:0,candidates:[],
  continuousDegreesOfFreedom:status==='coincident'?1:null,
  scope:'two-given-circles-and-fixed-fillet-radius',unit,
  provenArcDirection:false
 });
 if(!Number.isFinite(d))throw new RangeError('input coordinate difference overflow');
 if(a<=margin||b<=margin)
  return empty('coincident','internal tangency has concentric equal-radius circles; contact location is not unique');
 if(d<=margin){
  if(Math.abs(a-b)<=margin)
   return empty('coincident','auxiliary center loci coincide; infinitely many possible centers');
  return empty('none','concentric auxiliary loci have different radii');
 }
 if(d>a+b+margin||d<Math.abs(a-b)-margin)
  return empty('none','auxiliary circles do not intersect');
 const along=(a*a-b*b+d*d)/(2*d);
 const h2=(a-along)*(a+along);
 if(!Number.isFinite(along)||!Number.isFinite(h2))
  throw new RangeError('intersection conditioning overflow');
 const tangent=Math.abs(h2)<=margin*margin;
 if(h2<0&&!tangent)return empty('none','auxiliary circles do not intersect');
 const h=tangent?0:Math.sqrt(Math.max(0,h2));
 const ux=delta.x/d,uy=delta.y/d;
 const foot={x:A.center.x+along*ux,y:A.center.y+along*uy};
 const contact=(c,known,mode)=>{
  const from={x:c.x-known.center.x,y:c.y-known.center.y};
  const distance=Math.hypot(from.x,from.y);
  if(distance<=margin)throw new RangeError('coincident contact not identifiable');
  const sign=mode==='external'?1:Math.sign(known.radius-r);
  return {x:known.center.x+sign*from.x/distance*known.radius,
          y:known.center.y+sign*from.y/distance*known.radius};
 };
 const make=(side,i)=>{
  const center={x:foot.x+side*h*(-uy),y:foot.y+side*h*ux};
  const c1=contact(center,A,firstMode),c2=contact(center,B,secondMode);
  const res={
   firstCenter:Math.abs(Math.hypot(center.x-A.center.x,center.y-A.center.y)-a),
   secondCenter:Math.abs(Math.hypot(center.x-B.center.x,center.y-B.center.y)-b),
   firstKnownCircle:Math.abs(Math.hypot(c1.x-A.center.x,c1.y-A.center.y)-A.radius),
   secondKnownCircle:Math.abs(Math.hypot(c2.x-B.center.x,c2.y-B.center.y)-B.radius),
   firstFilletCircle:Math.abs(Math.hypot(c1.x-center.x,c1.y-center.y)-r),
   secondFilletCircle:Math.abs(Math.hypot(c2.x-center.x,c2.y-center.y)-r)
  };
  const maxResidual=Math.max(...Object.values(res));
  if(!Number.isFinite(maxResidual)||maxResidual>margin*8)
   throw new RangeError('candidate fails mathematical residual checks');
  return {id:'center-'+i,center,contacts:{first:c1,second:c2},
   residuals:res,maxResidual,unorientedTangentContinuity:true,
   arcDirection:null,arcSweep:null};
 };
 const rawCandidates=h===0?[make(0,1)]:[make(-1,1),make(1,2)];
 // Preserve IDs from the full supporting circles. Filtering must never
 // silently relabel center-2 to center-1 after an input arc is shortened.
 const excludedCandidates=[],candidates=[];
 for(const c of rawCandidates){
  const arcChecks={first:contactOnFiniteArc(A,c.contacts.first,eps),
   second:contactOnFiniteArc(B,c.contacts.second,eps)};
  if(arcChecks.first&&arcChecks.second)
   candidates.push({...c,sourceArcChecks:arcChecks,sourceArcRangeVerified:true});
  else excludedCandidates.push({id:c.id,
   invalidSources:Object.keys(arcChecks).filter(k=>!arcChecks[k])});
 }
 const finiteSourceArcCount=Number(!!A.arc)+Number(!!B.arc);
 const status=candidates.length===0?'none':candidates.length===1?'unique':'multiple';
 return {status,scope:'two-given-circles-and-fixed-fillet-radius',unit,
  reason:candidates.length===0?
   'Supporting circles intersect but contact lies outside a given finite source arc':
   'All candidates on the given source-arc ranges returned; connection traversal remains unproven',
  candidateCount:candidates.length,candidates,excludedCandidates,finiteSourceArcCount,
  continuousDegreesOfFreedom:candidates.length===0?null:0,
  provenArcDirection:false,
  auxiliary:{firstLocus:{center:A.center,radius:a},secondLocus:{center:B.center,radius:b},
   separation:d,tangencyModes:{first:firstMode,second:secondMode}}};
}
module.exports={DEFAULT_EPSILON,circleCircleFilletCenters,contactOnFiniteArc};
