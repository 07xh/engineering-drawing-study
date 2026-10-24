'use strict';
/**
 * M4 generic analytic circle-arc / projected segment arrangement on model-mm
 * paper coordinates. No SVG chords, raster sampling, 3D joins or engineering
 * line-style inference. Tangency / approximate boundary matches are retained
 * as explicit indeterminate events rather than falsely signing crossings.
 */
const finite=Number.isFinite;
const freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){
 for(const value of Object.values(x))freeze(value);Object.freeze(x);
}return x;};
const valid=p=>p&&finite(p.u)&&finite(p.v)&&
 Math.max(Math.abs(p.u),Math.abs(p.v))<=1e5;
const distance=(a,b)=>Math.hypot(a.u-b.u,a.v-b.v);
const lerp=(a,b,t)=>({u:a.u+(b.u-a.u)*t,v:a.v+(b.v-a.v)*t});
function arrangeProjectedCircleArcsAndLines({view,arcs,lines,tolerance=1e-8}={}){
 if(!['V','H','W'].includes(view)||!Array.isArray(arcs)||
    !Array.isArray(lines)||arcs.length>128||lines.length>128||
    !finite(tolerance)||tolerance<=0||tolerance>1)
  throw new TypeError('bounded first-angle circle-arc and line sources required');
 const ids=new Set();
 const unique=id=>{
  if(typeof id!=='string'||!id||ids.has(id))
   throw new TypeError('unique projected source identity required');
  ids.add(id);
 };
 const A=arcs.map(row=>{
  if(!row||row.view!==view||!valid(row.center)||
     !finite(row.radius)||row.radius<=1e-9||row.radius>1e5||
     ![-1,1].includes(row.sign)||!Array.isArray(row.uRange)||
     row.uRange.length!==2||!row.uRange.every(finite)||
     !(row.uRange[1]>row.uRange[0])||
     row.uRange[0]<row.center.u-row.radius-tolerance||
     row.uRange[1]>row.center.u+row.radius+tolerance)
   throw new TypeError('reviewed bounded circle branch required');
  unique(row.id);
  return row;
 });
 const L=lines.map(row=>{
  if(!row||row.view!==view||!valid(row.from)||!valid(row.to))
   throw new TypeError('bounded exact projected line endpoints required');
  unique(row.id);
  return row;
 });
 const events=[],unresolved=[];
 const record=(arc,line,t,kind,point,reason)=>{
  const u=point.u,c=arc.center;
  const r=(arc.radius-Math.abs(u-c.u))*
          (arc.radius+Math.abs(u-c.u));
  if(r< -tolerance*Math.max(1,arc.radius))
   throw new RangeError('candidate departed true circle radial domain');
  const expected=c.v+arc.sign*Math.sqrt(Math.max(0,r));
  if(Math.abs(point.v-expected)>tolerance*4)return;
  if(u<arc.uRange[0]-tolerance||u>arc.uRange[1]+tolerance)return;
  const lineEnd=t<=tolerance||t>=1-tolerance;
  const arcEnd=u<=arc.uRange[0]+tolerance||
   u>=arc.uRange[1]-tolerance;
  const status=kind==='transverse'&&!lineEnd&&!arcEnd?
   'strict-projected-open-interior-crossing':'critical-or-endpoint-undetermined';
  const row={id:'arcLine'+events.length,view,arcId:arc.id,lineId:line.id,
   projectedUV:{u,v:point.v},lineParameter:t,curveParameterU:u,
   classification:status,criticalReason:reason||
    (status==='critical-or-endpoint-undetermined'?
     kind==='transverse'?'source-boundary-event':'projected-tangency-or-collapse':null),
   sourceCircleEquationVerified:true,
   actual3DSourceJoinVerified:false,
   endpointContinuityVerified:false,officialLineStyle:'undetermined',
   finalV5StrokeAuthorized:false};
  events.push(row);
  if(status!=='strict-projected-open-interior-crossing')unresolved.push(row.id);
 };
 for(const arc of A)for(const line of L){
  const p=line.from,q=line.to,d={u:q.u-p.u,v:q.v-p.v};
  const aa=d.u*d.u+d.v*d.v;
  const dx=p.u-arc.center.u,dy=p.v-arc.center.v;
  if(aa<=tolerance*tolerance){
   const radial=dx*dx+dy*dy-arc.radius*arc.radius;
   if(Math.abs(radial)<=tolerance*Math.max(1,arc.radius))
    record(arc,line,0,'collapsed',p,'line-projection-collapsed-to-point');
   continue;
  }
  const bb=2*(dx*d.u+dy*d.v);
  const cc=dx*dx+dy*dy-arc.radius*arc.radius;
  const discriminant=bb*bb-4*aa*cc;
  const guard=1e-12*Math.max(1,bb*bb,Math.abs(4*aa*cc));
  if(discriminant< -guard)continue;
  const critical=Math.abs(discriminant)<=guard;
  const sq=Math.sqrt(Math.max(0,discriminant));
  const roots=critical?[-bb/(2*aa)]:
   [(-bb-sq)/(2*aa),(-bb+sq)/(2*aa)];
  for(const t of roots){
   if(t< -tolerance/Math.sqrt(aa)||t>1+tolerance/Math.sqrt(aa))
    continue;
   const clipped=Math.max(0,Math.min(1,t));
   const point=lerp(p,q,clipped);
   const residual=Math.abs((point.u-arc.center.u)**2+
    (point.v-arc.center.v)**2-arc.radius**2);
   if(residual>tolerance*4*Math.max(1,arc.radius))
    throw new RangeError('analytic circle line root failed residual proof');
   record(arc,line,clipped,critical?'tangent':'transverse',point,
    critical?'tangent-or-near-tangent-root-unresolved':null);
  }
 }
 return freeze({schema:'draftai-m4-projected-circle-arc-line-events/1',
  view,status:'exact-circle-line-candidate-arrangement',
  circleArcSourceCount:A.length,projectedLineSourceCount:L.length,
  events,strictTransverseOpenEventCount:events.filter(e=>
   e.classification==='strict-projected-open-interior-crossing').length,
  unresolvedProjectedEventCount:unresolved.length,
  allAnalyticPairsEnumeratedWithinCircleLineScope:true,
  physical3DSourceJoinInferredFrom2D:false,
  completeProjectedContourVerified:false,
  officialLineStylesVerified:false,finalV5StrokeAuthorized:false});
}
module.exports={arrangeProjectedCircleArcsAndLines};
