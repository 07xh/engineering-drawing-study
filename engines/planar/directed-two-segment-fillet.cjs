'use strict';
/**
 * P0 02 finite directed line-line fillet.
 *
 * This is a strict *consumer* of the previously validated finite tangent
 * center solver, not an alternative implementation of offset intersections.
 * A candidate is a completed finite arc ONLY after explicit choices of
 * center branch, cw/ccw sweep and each original segment's travel direction.
 * Travel on the first segment means approaching its tangent point;
 * travel on the second means departing from its tangent point.
 *
 * Both mathematical tangent vectors must match the finite arc's directed
 * tangents. Merely being perpendicular to a common radius is insufficient.
 */
const {finiteTwoSegmentFillets}=require('./two-segment-fillet.cjs');
const {normalizedLine}=require('./offset-tangency.cjs');

const TO_DEGREES=180/Math.PI;
const VECTOR_TOLERANCE=1e-7;
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const vec=(p,q)=>({x:p.x-q.x,y:p.y-q.y});
const length=v=>Math.hypot(v.x,v.y);
const negate=v=>({x:-v.x,y:-v.y});
const gap=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const copyPoint=p=>({x:p.x,y:p.y});
function angle(center,contact){
 const theta=Math.atan2(contact.y-center.y,contact.x-center.x)*TO_DEGREES;
 return theta<0?theta+360:theta;
}
function unitArcTangent(center,contact,direction){
 const r=vec(contact,center),mag=length(r);
 if(!finite(mag)||mag<=0)throw new RangeError('undefined tangent at arc center');
 const factor=direction==='ccw'?1:-1;
 return {x:-factor*r.y/mag,y:factor*r.x/mag};
}
function validTravel(travel,label){
 if(travel!==undefined&&travel!=='forward'&&travel!=='reverse')
  throw new RangeError(label+' must be forward or reverse');
 return travel;
}
function trimmedSource(input,contact,travel,role){
 const line=normalizedLine(input);
 // first segment: retain the portion ending at contact.
 // second segment: retain the portion starting at contact.
 const from=role==='first'?(travel==='forward'?line.a:line.b):contact;
 const to=role==='first'?contact:(travel==='forward'?line.b:line.a);
 const segment={a:copyPoint(from),b:copyPoint(to)};
 const retainedLength=length(vec(segment.b,segment.a));
 if(!finite(retainedLength))throw new RangeError('trimmed segment length overflow');
 return {segment,retainedLength,travel};
}
function chooseFiniteTwoSegmentArc({
 first,second,filletRadius,firstSide,secondSide,
 epsilon,angularTolerance,branchId,direction,firstTravel,secondTravel
}={}){
 const raw={first,second,filletRadius,firstSide,secondSide,
  ...(epsilon===undefined?{}:{epsilon}),
  ...(angularTolerance===undefined?{}:{angularTolerance})};
 const solved=finiteTwoSegmentFillets(raw);
 const ids=solved.candidates.map(c=>c.id);
 const base={scope:'finite-segment-directed-fillet',
  unit:'input-math-unit',candidateIds:ids,
  candidateCount:solved.candidateCount,
  finiteSourceContactsVerified:solved.finiteSourceContactsVerified,
  geometry:null,steps:[],g1Verified:false,
  selectedId:null,maxG1Mismatch:null,
  sourceStatus:solved.status,continuousFamilies:solved.continuousFamilies};
 if(!['unique','multiple'].includes(solved.status))
  return {...base,status:solved.status,
   reason:solved.reason||'no discrete finite fillet center'};
 if(branchId!==undefined&&!ids.includes(branchId))
  throw new RangeError('branchId is not an actual finite-contact candidate');
 if(solved.status==='multiple'&&branchId===undefined)
  return {...base,status:'branch-choice-required',
   reason:'multiple finite-contact centers exist; choose an explicit branchId'};
 const candidate=solved.candidates.find(c=>c.id===(branchId??ids[0]));
 const selected={...base,selectedId:candidate.id,
  center:copyPoint(candidate.center),
  contacts:{first:copyPoint(candidate.contacts.first),
   second:copyPoint(candidate.contacts.second)},
  maxTangencyResidual:candidate.maxResidual,
  contactSegments:candidate.contactSegments};
 if(direction!==undefined&&direction!=='cw'&&direction!=='ccw')
  throw new RangeError('direction must be cw or ccw');
 if(direction===undefined)
  return {...selected,status:'direction-required',
   reason:'the chosen tangent center does not determine finite arc sweep direction'};
 validTravel(firstTravel,'firstTravel');
 validTravel(secondTravel,'secondTravel');
 if(firstTravel===undefined||secondTravel===undefined)
  return {...selected,status:'travel-required',
   reason:'both source contour travel directions are required for directed G1 proof'};
 const sourceFirst=trimmedSource(first,candidate.contacts.first,firstTravel,'first');
 const sourceSecond=trimmedSource(second,candidate.contacts.second,secondTravel,'second');
 // A zero-length retained side has no drawable tangent at that join, even
 // if the *infinite extension* would have matching tangent vectors.
 if(sourceFirst.retainedLength<=0||sourceSecond.retainedLength<=0)
  return {...selected,status:'zero-source-trim',
   reason:'selected traversal leaves a zero-length source segment at the contact'};
 const firstNormalized=normalizedLine(first);
 const secondNormalized=normalizedLine(second);
 const firstVector=firstTravel==='forward'
  ?firstNormalized.tangent:negate(firstNormalized.tangent);
 const secondVector=secondTravel==='forward'
  ?secondNormalized.tangent:negate(secondNormalized.tangent);
 const arcFirst=unitArcTangent(candidate.center,candidate.contacts.first,direction);
 const arcSecond=unitArcTangent(candidate.center,candidate.contacts.second,direction);
 const mismatch={
  first:gap(firstVector,arcFirst),second:gap(arcSecond,secondVector)
 };
 const maxG1Mismatch=Math.max(mismatch.first,mismatch.second);
 if(!finite(maxG1Mismatch))throw new RangeError('G1 residual overflow');
 if(maxG1Mismatch>VECTOR_TOLERANCE)
  return {...selected,status:'direction-conflict',maxG1Mismatch,
   vectorResiduals:mismatch,
   reason:'chosen directed arc does not preserve the approach/departure tangent'};
 const startAngle=angle(candidate.center,candidate.contacts.first);
 const targetAngle=angle(candidate.center,candidate.contacts.second);
 const sweepDegrees=direction==='ccw'
  ?(targetAngle-startAngle+360)%360
  :-((startAngle-targetAngle+360)%360);
 const chord=length(vec(candidate.contacts.second,candidate.contacts.first));
 // If the contacts coincide, the segment-arc boundary would require a
 // zero sweep / full-circle ambiguity; neither is a finite join.
 if(!finite(chord)||chord<=1e-9*Math.max(1,filletRadius)||
    Math.abs(sweepDegrees)<=1e-9||
    Math.abs(sweepDegrees)>=360-1e-9)
  return {...selected,status:'degenerate-arc',maxG1Mismatch,
   reason:'tangency contacts do not define a nonzero finite connecting arc'};
 const arc={id:'segment-fillet-'+candidate.id,kind:'arc',
  space:'drawing-2d',unit:'input-math-unit',
  data:{center:copyPoint(candidate.center),radius:filletRadius,
   startAngle,endAngle:startAngle+sweepDegrees,direction}};
 const steps=[
  ...candidate.steps.map(s=>({...s,dependsOn:s.id.endsWith('offset1')?[]:
   s.id.endsWith('offset2')?[candidate.id+'-offset1']:
   s.id.endsWith('intersection')?[candidate.id+'-offset2']:
   [candidate.id+'-intersection']})),
  {id:candidate.id+'-trim',kind:'finite-segment-trim',role:'auxiliary',
   dependsOn:[candidate.id+'-perpendiculars'],
   sourceSegments:{first:sourceFirst.segment,second:sourceSecond.segment},
   reason:'按明确的走向保留切点前后有效线段；两段非零长度'},
  {id:candidate.id+'-arc',kind:'directed-arc',role:'result',
   dependsOn:[candidate.id+'-trim'],geometry:arc,
   maxG1Mismatch,maxTangencyResidual:candidate.maxResidual,
   reason:'依据两个切点、圆心、旋向绘制有限圆弧，并验证两端有向 G1 切线一致'}
 ];
 return {...selected,status:'selected',geometry:arc,
  trimmedSourceSegments:{first:sourceFirst,second:sourceSecond},
  steps,sweepDegrees,maxG1Mismatch,
  vectorResiduals:mismatch,g1Verified:true,
  finiteArcSweepVerified:true,
  reason:'finite contacts, nonzero trimmed sources, finite arc sweep and both directed G1 joins verified'};
}
module.exports={chooseFiniteTwoSegmentArc};
