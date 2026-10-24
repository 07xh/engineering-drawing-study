'use strict';
/**
 * M4 reusable FIRST-ANGLE projected straight-source arrangement.
 *
 * A spatial source line may cross, overlap or collapse under V/H/W.
 * This computes REAL 2D intersection and overlap parameters, divides
 * projected nonzero lines at all such events, and compares source depths
 * along their shared projection. 2D crossing never creates a 3D join.
 *
 * Scope: straight 3D source edges only. Analytic curved interiors,
 * final silhouette ownership, endpoint engineering style and V5 remain
 * unverified. Screen pixels never enter the proof.
 */
const {project,FIRST_ANGLE_OBSERVER_RAYS,VIEWS}=
 require('../projection/conventions.js');
const finite=Number.isFinite;
const cross=(a,b)=>a.u*b.v-a.v*b.u;
const plus=(p,d,t)=>({u:p.u+d.u*t,v:p.v+d.v*t});
const sub=(a,b)=>({u:a.u-b.u,v:a.v-b.v});
const dot=(a,b)=>a.u*b.u+a.v*b.v;
const dist=(a,b)=>Math.hypot(a.u-b.u,a.v-b.v);
const diff3=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
const mix3=(a,b,t)=>({x:a.x+(b.x-a.x)*t,
 y:a.y+(b.y-a.y)*t,z:a.z+(b.z-a.z)*t});
const freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){
 for(const y of Object.values(x))freeze(y);Object.freeze(x);
}return x;};
function arrangeProjected3DSourceLines({view,segments,tolerance=1e-8}={}){
 if(!VIEWS.includes(view)||!Array.isArray(segments)||segments.length>128||
    !finite(tolerance)||tolerance<=0||tolerance>1)
  throw new TypeError('first-angle view and bounded 3D sources required');
 const ids=new Set(),eye=FIRST_ANGLE_OBSERVER_RAYS[view];
 const entries=segments.map(s=>{
  if(!s||typeof s.id!=='string'||!s.id||ids.has(s.id)||
     !s.from3D||!s.to3D||
     ![...Object.values(s.from3D),...Object.values(s.to3D)].every(finite))
   throw new TypeError('unique finite 3D source endpoints required');
  ids.add(s.id);
  const A={...s.from3D},B={...s.to3D};
  if(diff3(A,B)<=tolerance)throw new RangeError('collapsed 3D source edge');
  const p=project(A)[view],q=project(B)[view],r=sub(q,p);
  const length=Math.hypot(r.u,r.v);
  return {id:s.id,sourceId:s.sourceId||s.id,A,B,p,q,r,
   length,collapsed:length<=tolerance,marks:[0,1]};
 });
 const depth=p=>p.x*eye.x+p.y*eye.y+p.z*eye.z;
 const interp=(row,t)=>mix3(row.A,row.B,t);
 const projectedAt=(row,t)=>plus(row.p,row.r,t);
 const rayDifference=(a,t,b,u)=>depth(interp(a,t))-depth(interp(b,u));
 const events=[],overlaps=[];
 let trueSpatialContactCount=0;
 function mark(row,t){
  if(t>0&&t<1)row.marks.push(t);
 }
 function event(a,b,t,u,kind){
  const pa=interp(a,t),pb=interp(b,u),point=projectedAt(a,t);
  const same3D=diff3(pa,pb)<=tolerance;
  events.push({id:'event'+events.length,view,
   kind,sourceIds:[a.id,b.id],
   projectedUV:point,sourceParameters:[t,u],
   signedObserverDepths:[depth(pa),depth(pb)],
   sameTrue3DSourcePoint:same3D,
   projectedCrossingAloneDoesNotAuthorize3DJoin:!same3D,
   officialLineStyle:'undetermined'});
  mark(a,t);mark(b,u);
  if(same3D)trueSpatialContactCount++;
 }
 const pointOn=(p,row)=>{
  const v=sub(p,row.p),length2=dot(row.r,row.r);
  const t=dot(v,row.r)/length2;
  if(t< -tolerance/row.length||t>1+tolerance/row.length||
     dist(p,projectedAt(row,t))>tolerance)return null;
  return Math.max(0,Math.min(1,t));
 };
 for(let i=0;i<entries.length;i++)for(let j=i+1;j<entries.length;j++){
  const a=entries[i],b=entries[j];
  if(a.collapsed&&b.collapsed){
   if(dist(a.p,b.p)<=tolerance)
    event(a,b,0,0,'both-3d-segments-project-to-a-point');
   continue;
  }
  if(a.collapsed||b.collapsed){
   const point=a.collapsed?a:b,line=a.collapsed?b:a;
   const t=pointOn(point.p,line);
   if(t!==null){
    if(a.collapsed)event(a,b,0,t,'collapsed-source-on-projected-line');
    else event(a,b,t,0,'collapsed-source-on-projected-line');
   }
   continue;
  }
  const q=sub(b.p,a.p),den=cross(a.r,b.r);
  const lenProd=a.length*b.length;
  if(Math.abs(den)>1e-12*lenProd){
   const t=cross(q,b.r)/den,u=cross(q,a.r)/den;
   if(t< -tolerance/a.length||t>1+tolerance/a.length||
      u< -tolerance/b.length||u>1+tolerance/b.length)continue;
   const tc=Math.max(0,Math.min(1,t)),
    uc=Math.max(0,Math.min(1,u));
   if(dist(projectedAt(a,tc),projectedAt(b,uc))>tolerance)
    continue;
   event(a,b,tc,uc,'transverse-projected-crossing');
   continue;
  }
  if(Math.abs(cross(q,a.r))/a.length>tolerance)continue;
  const l=dot(q,a.r)/dot(a.r,a.r);
  const m=dot(sub(b.q,a.p),a.r)/dot(a.r,a.r);
  const lo=Math.max(0,Math.min(l,m)),
   hi=Math.min(1,Math.max(l,m));
  if(hi<lo-tolerance/a.length)continue;
  if(hi-lo<=tolerance/a.length){
   const t=Math.max(0,Math.min(1,(lo+hi)/2));
   const u=pointOn(projectedAt(a,t),b);
   if(u!==null)event(a,b,t,u,'collinear-projected-endpoint-touch');
   continue;
  }
  const uAt=t=>dot(sub(projectedAt(a,t),b.p),b.r)/dot(b.r,b.r);
  const ua=uAt(lo),ub=uAt(hi);
  const first=rayDifference(a,lo,b,ua),last=rayDifference(a,hi,b,ub);
  const sign=x=>Math.abs(x)<=tolerance?0:x>0?1:-1;
  let status='undetermined-depth-contact-or-switch',frontSourceId=null;
  if(sign(first)!==0&&sign(first)===sign(last)){
   status='strict-projected-overlap-depth-order';
   frontSourceId=first>0?a.id:b.id;
  }else if(Math.abs(first)<=tolerance&&Math.abs(last)<=tolerance){
   status='coincident-projected-depth-undetermined-owner';
  }
  let switchSourceParameters=null;
  // Affine depth difference: a unique zero is the only possible
  // front/back order switch along a straight overlap.
  if(first*last<0){
   const switchT=lo+(hi-lo)*first/(first-last),
    switchU=uAt(switchT);
   switchSourceParameters=[switchT,switchU];
   mark(a,switchT);mark(b,switchU);
  }
  mark(a,lo);mark(a,hi);mark(b,ua);mark(b,ub);
  overlaps.push({id:'overlap'+overlaps.length,view,
   sourceIds:[a.id,b.id],firstSourceParameterRange:[lo,hi],
   secondSourceParameterRange:[ua,ub],
   projectedFrom:projectedAt(a,lo),projectedTo:projectedAt(a,hi),
   observerDepthDifferenceAtEnds:[first,last],
   status,frontSourceId,switchSourceParameters,
   sourceOwnershipOfOfficialStrokeVerified:false,
   officialLineStyle:'undetermined'});
 }
 // Source atomic intervals cover each noncollapsed projected source ONCE.
 // Ordered pairwise overlaps annotate actual front/back only when the
 // entire atomic interval shares a proven strict linear depth order.
 const atoms=[];
 for(const row of entries){
  if(row.collapsed)continue;
  const eps=tolerance/row.length;
  const marks=row.marks.sort((a,b)=>a-b);
  const distinct=[];
  for(const m of marks){
   if(!distinct.length||m-distinct.at(-1)>eps)distinct.push(m);
  }
  if(distinct[0]!==0||distinct.at(-1)!==1)
   throw new RangeError('projection arrangement lost original line endpoints');
  for(let i=1;i<distinct.length;i++){
   const lo=distinct[i-1],hi=distinct[i];
   if(!(hi-lo>eps))throw new RangeError('projection split created zero-length stroke');
   const front=[],behind=[],unresolved=[];
   for(const overlap of overlaps.filter(o=>o.sourceIds.includes(row.id))){
    const isFirst=overlap.sourceIds[0]===row.id;
    const other=entries.find(e=>e.id===overlap.sourceIds[isFirst?1:0]);
    const tMid=(lo+hi)/2,p=projectedAt(row,tMid);
    const ownRange=isFirst?overlap.firstSourceParameterRange:
      overlap.secondSourceParameterRange;
    const sMin=Math.min(...ownRange),sMax=Math.max(...ownRange);
    if(tMid<sMin-eps||tMid>sMax+eps)continue;
    const otherT=pointOn(p,other);
    if(otherT===null)throw new RangeError('projected overlapping source changed');
    const difference=rayDifference(row,lo,other,pointOn(projectedAt(row,lo),other));
    const last=rayDifference(row,hi,other,pointOn(projectedAt(row,hi),other));
    if(Math.abs(difference)>tolerance&&Math.abs(last)>tolerance&&
       Math.sign(difference)===Math.sign(last)){
      (difference>0?behind:front).push(other.id);
    }else unresolved.push(other.id);
   }
   atoms.push({id:'projectedAtom'+atoms.length,view,
    edgeId:row.id,sourceId:row.sourceId,
    parameterRange:[lo,hi],projectedFrom:projectedAt(row,lo),
    projectedTo:projectedAt(row,hi),
    original3DFrom:interp(row,lo),original3DTo:interp(row,hi),
    otherProjectedSourcesInFront:[...new Set(front)].sort(),
    otherProjectedSourcesBehind:[...new Set(behind)].sort(),
    unresolvedProjectedDepthOverlap:[...new Set(unresolved)].sort(),
    source3DGeometryPreserved:true,
    standardLineStyle:'undetermined',finalV5StrokeAuthorized:false});
  }
 }
 const pointProjections=entries.filter(e=>e.collapsed).map(e=>({
  edgeId:e.id,sourceId:e.sourceId,view,projectedUV:{...e.p},
  true3DEndpointsAreDifferent:true,
  projectedDimension:'point-not-line',
  officialLineStyle:'undetermined'}));
 const complete=entries.filter(e=>!e.collapsed).every(e=>{
  const parts=atoms.filter(a=>a.edgeId===e.id)
   .sort((a,b)=>a.parameterRange[0]-b.parameterRange[0]);
  return parts.length&&parts[0].parameterRange[0]===0&&
    parts.at(-1).parameterRange[1]===1&&
    parts.every((x,i)=>i===0||
       Math.abs(x.parameterRange[0]-parts[i-1].parameterRange[1])<=1e-12);
 });
 if(!complete)throw new RangeError('original straight sources lost projected coverage');
 return freeze({schema:'draftai-first-angle-source-line-arrangement/1',
  view,sourceEdgeCount:entries.length,
  projectedLineSourceCount:entries.length-pointProjections.length,
  projectedPointSourceCount:pointProjections.length,
  projectedEvents:events,projectedPositiveLengthOverlaps:overlaps,
  projectedLineAtoms:atoms,collapsedPointSources:pointProjections,
  true3DContactEventCount:trueSpatialContactCount,
  allProjectedStraightSourceParametersCoveredExactlyOnce:complete,
  strictPairwiseOverlapDepthOrderCertifiedWherePresent:overlaps.every(x=>
    x.status==='strict-projected-overlap-depth-order'),
  allAnalyticCurvedSourceProjectionsIncluded:false,
  fullProjectedCompositeContourCertified:false,
  officialLineStylesVerified:false,finalV5StrokeAuthorized:false});
}
module.exports={arrangeProjected3DSourceLines};
