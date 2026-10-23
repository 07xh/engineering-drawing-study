'use strict';
/**
 * DraftAI V3.1 Gate A: strictly typed entry for three existing 02 analytic
 * center solvers. Input is confirmed mathematical geometry in mm, NEVER a
 * pixel fit, OCR candidate, or an unverified SVG arc.
 *
 * The returned centers/contacts are candidate geometry only. Neither a
 * directed finite connecting arc nor full G1 contour continuity is proven.
 * "unique" is relative to explicit input/side/tangency-mode assumptions.
 */
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const record=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const keys=(obj,allowed,label)=>{
 if(!record(obj))throw new TypeError(label+' must be an object');
 for(const key of Object.keys(obj))if(!allowed.includes(key))
  throw new TypeError(label+' contains unsupported field '+key);
};
const point=(p,label)=>{
 keys(p,['x','y'],label);
 if(!finite(p.x)||!finite(p.y))throw new TypeError(label+' must have finite x/y');
 return {x:p.x,y:p.y};
};
const radius=(r,label)=>{
 if(!finite(r)||r<=0)throw new RangeError(label+' must be finite and positive');
 return r;
};
const segment=(s,label)=>{
 keys(s,['a','b'],label);
 const a=point(s.a,label+'.a'),b=point(s.b,label+'.b');
 const distance=Math.hypot(b.x-a.x,b.y-a.y);
 if(!finite(distance)||distance<=1e-12)throw new RangeError(label+' is degenerate');
 return {a,b};
};
const circle=(c,label)=>{
 keys(c,['center','radius','arc'],label);
 const source={center:point(c.center,label+'.center'),radius:radius(c.radius,label+'.radius')};
 // The existing 02 specialist owns directed finite source-arc normalization.
 // Snapshot optional human-reviewed arc parameters once, then delegate its
 // angular validity test. Do not invent a second angle-membership formula.
 const requestedArc=c.arc;
 if(requestedArc===undefined)return source;
 keys(requestedArc,['startAngle','endAngle','direction'],label+'.arc');
 const {startAngle,endAngle,direction}=requestedArc;
 const raw={startAngle,endAngle,direction};
 const checked=require('../planar/circle-circle-fillet.cjs')
  .normalizeKnownCircle({...source,arc:raw},label);
 return {...source,arc:{startAngle:checked.arc.startAngle,
  endAngle:checked.arc.endAngle,direction:checked.arc.direction}};
};
const side=(x,label)=>{
 if(x!==undefined&&x!==1&&x!==-1)throw new RangeError(label+' must be +1 or -1');
 return x;
};
const mode=(x,label)=>{
 if(x!==undefined&&!['external','internal'].includes(x))
  throw new RangeError(label+' must be external or internal');
 return x;
};
const STATUS=new Set(['unique','multiple','none','continuous','coincident','unstable']);
const SHAPES=Object.freeze({
 'two-segments':['first','second'],
 'segment-circle':['segment','circle'],
 'two-circles':['first','second']
});
function normalizeProblem(input){
 keys(input,['kind','unit','geometry','filletRadius','options','revision'], 'problem');
 if(!Object.hasOwn(SHAPES,input.kind))throw new RangeError('unsupported finite fillet kind');
 if(input.unit!=='mm')throw new RangeError('explicit model unit mm required; no SVG pixels');
 if(input.revision!==undefined&&(!Number.isSafeInteger(input.revision)||input.revision<0))
  throw new RangeError('revision must be a nonnegative safe integer');
 const opts=input.options===undefined?{}:input.options;
 const allowed=input.kind==='two-segments'?['firstSide','secondSide']:
  input.kind==='segment-circle'?['side']:['firstMode','secondMode'];
 keys(opts,allowed,'options');
 const spec=input.kind==='two-segments'
  ?{first:segment(input.geometry?.first,'geometry.first'),second:segment(input.geometry?.second,'geometry.second')}
  :input.kind==='segment-circle'
   ?{segment:segment(input.geometry?.segment,'geometry.segment'),circle:circle(input.geometry?.circle,'geometry.circle')}
   :{first:circle(input.geometry?.first,'geometry.first'),second:circle(input.geometry?.second,'geometry.second')};
 keys(input.geometry,SHAPES[input.kind],'geometry');
 const options=input.kind==='two-segments'
  ?{firstSide:side(opts.firstSide,'firstSide'),secondSide:side(opts.secondSide,'secondSide')}
  :input.kind==='segment-circle'
   ?{side:side(opts.side,'side')}
   :{firstMode:mode(opts.firstMode,'firstMode'),secondMode:mode(opts.secondMode,'secondMode')};
 return {kind:input.kind,unit:'mm',revision:input.revision??0,
  geometry:spec,filletRadius:radius(input.filletRadius,'filletRadius'),options};
}
function realSolvers(){return {
 'two-segments':require('../planar/two-segment-fillet.cjs').finiteTwoSegmentFillets,
 'segment-circle':require('../planar/segment-circle-fillet.cjs').finiteSegmentCircleFillets,
 'two-circles':require('../planar/circle-circle-fillet.cjs').circleCircleFilletCenters
};}
function solveFiniteFillet(input,{solvers}={}){
 const p=normalizeProblem(input);
 const implementations=solvers||realSolvers();
 const solve=implementations[p.kind];
 if(typeof solve!=='function')throw new TypeError('missing analytic solver for '+p.kind);
 const raw=solve({...p.geometry,filletRadius:p.filletRadius,...p.options});
 if(!record(raw)||!STATUS.has(raw.status)||!Array.isArray(raw.candidates))
  throw new TypeError('analytic solver returned invalid status or candidate array');
 const status=raw.status==='unstable'?'undetermined':raw.status;
 const candidates=raw.candidates.map((c,i)=>{
  if(!record(c)||typeof c.id!=='string'||!c.id||!finite(c.maxResidual)||c.maxResidual<0)
   throw new TypeError('candidate '+i+' lacks id or finite residual evidence');
  const contacts=c.contacts;
  const first=contacts?.first??c.lineContact;
  const second=contacts?.second??c.circleContact;
  if(!first||!second)throw new TypeError('candidate '+i+' lacks two geometric contacts');
  const contactA=point(first,'candidate '+i+' first contact');
  const contactB=point(second,'candidate '+i+' second contact');
  if(p.kind==='two-segments'&&c.sourceContactsOnSegments!==true)
   throw new TypeError('finite line contacts not verified');
  if(p.kind==='segment-circle'&&
     (c.lineContactOnSegment!==true||c.sourceArcRangeVerified!==true))
   throw new TypeError('bounded source contacts not verified');
  // A supporting-circle contact is not a finite-arc contact. When the user
  // limits either given circle to a directed arc, only the actual specialist
  // may assert angular membership for BOTH source contacts.
  if(p.kind==='two-circles'&&
     (p.geometry.first.arc!==undefined||p.geometry.second.arc!==undefined)&&
     (c.sourceArcRangeVerified!==true||
      c.sourceArcChecks?.first!==true||c.sourceArcChecks?.second!==true))
   throw new TypeError('finite source-circle arc contacts not verified');
  return {branchId:c.id,center:point(c.center,'candidate '+i+' center'),
   contacts:{first:contactA,second:contactB},
   maxResidual:c.maxResidual,finiteSourceContactsVerified:true,
   directedG1Verified:false,finishedArcVerified:false};
 });
 if(new Set(candidates.map(c=>c.branchId)).size!==candidates.length)
  throw new TypeError('duplicate candidate branch ID');
 if(['none','coincident','continuous','unstable'].includes(raw.status)&&candidates.length)
  throw new TypeError('non-discrete status cannot expose verified discrete candidates');
 if((status==='unique'&&candidates.length!==1)||
    (status==='multiple'&&candidates.length<2)||
    (raw.candidateCount!==undefined&&raw.candidateCount!==candidates.length))
  throw new TypeError('analytic solver candidate count conflicts with status');
 return {kind:p.kind,unit:'mm',revision:p.revision,status,
  candidateCount:candidates.length,
  solutionCount:['unique','multiple','none'].includes(status)?candidates.length:null,
  globallyUnique:null,proofScope:'fixed finite sources, chosen side/mode assumptions',
  finishedArcVerified:false,directedG1Verified:false,
  candidates,diagnostics:status==='undetermined'?['analytic solver reports numerical instability']:[],
  sourceSolverScope:raw.scope??null};
}
module.exports={normalizeProblem,solveFiniteFillet};
