'use strict';
/**
 * Generic first-angle W analytic radical-curve / projected AXIS-ALIGNED
 * source-line contacts. Exact algebraic inverse roots; no sampled chords.
 * A 3D cap-cap X-line collapses to a 2D POINT (many possible source depths).
 * Physical source identity and line style belong to higher M4/M5.
 */
const {validAnalyticCurve3D,atAnalyticCurve3D}=
 require('../geometry/analytic-curve-3d.cjs');
const {project}=require('./conventions.js');
const finite=Number.isFinite;
const freeze=v=>{if(v&&typeof v==='object'&&!Object.isFrozen(v)){
 for(const a of Object.values(v))freeze(a);Object.freeze(v);
}return v;};
function intersectSignedRadicalCurveWithAxisLine({
 curve,from,to,tolerance=1e-8}={}){
 const valid2=p=>p&&finite(p.u)&&finite(p.v)&&
  Math.max(Math.abs(p.u),Math.abs(p.v))<=1e5;
 if(!validAnalyticCurve3D(curve)||
    curve.coordinates.x.kind!=='affine'||
    curve.coordinates.x.offset!==0||curve.coordinates.x.slope!==1||
    curve.coordinates.y.kind!=='signed-circle-radical'||
    curve.coordinates.z.kind!=='signed-circle-radical'||
    !valid2(from)||!valid2(to)||!finite(tolerance)||
    tolerance<=0||tolerance>1)
  throw new TypeError('bounded exact W signed-radical source and axis-line required');
 const du=to.u-from.u,dv=to.v-from.v;
 const horizontal=Math.abs(dv)<=tolerance;
 const vertical=Math.abs(du)<=tolerance;
 if(!horizontal&&!vertical)
  throw new TypeError('only exact axis-aligned source lines supported');
 const collapsed=horizontal&&vertical;
 const inversion=(coordinate,target)=>{
  const diff=target-coordinate.offset;
  if(diff*coordinate.sign< -tolerance)return [];
  const rad=(coordinate.radius-Math.abs(diff))*
    (coordinate.radius+Math.abs(diff));
  const eps=1e-11*Math.max(1,coordinate.radius**2);
  if(rad< -eps)return [];
  if(Math.abs(rad)<=eps)
   return [{x:coordinate.center,
    reason:'radial-stationary-tangency-or-degeneracy'}];
  const t=Math.sqrt(rad);
  return [coordinate.center-t,coordinate.center+t].map(x=>({
   x,reason:Math.abs(diff)<=tolerance?
    'radical-sign-branch-coalescence':null}));
 };
 const restrict=(coord,value)=>inversion(coord,value);
 const candidates=collapsed||vertical?
  restrict(curve.coordinates.y,from.u):
  restrict(curve.coordinates.z,from.v);
 const events=[];
 const ratio=(u,v)=>{
  if(collapsed)return null;
  return vertical?(v-from.v)/dv:(u-from.u)/du;
 };
 for(const row of candidates){
  const x=row.x,[lo,hi]=[curve.parameter.from,curve.parameter.to];
  if(x<lo-tolerance||x>hi+tolerance)continue;
  const point3D=atAnalyticCurve3D(curve,Math.max(lo,Math.min(hi,x)));
  const W=project(point3D).W;
  // For collapsed source lines, both projected coordinates must agree.
  if(Math.hypot(W.u-from.u,W.v-from.v)<=tolerance*3&&collapsed||
    !collapsed){
   const t=ratio(W.u,W.v);
   if(!collapsed&&(t< -tolerance||t>1+tolerance))continue;
   const match=collapsed?
    Math.hypot(W.u-from.u,W.v-from.v)<=tolerance*3:
    Math.abs(vertical?W.u-from.u:W.v-from.v)<=tolerance*3;
   if(!match)continue;
   const projectedTerminal=!collapsed&&
    (t<=tolerance||t>=1-tolerance);
   const analyticTerminal=x<=lo+tolerance||x>=hi-tolerance;
   const regular=!collapsed&&!row.reason&&
     !projectedTerminal&&!analyticTerminal;
   if(events.some(e=>Math.abs(e.parameterX-x)<=tolerance))continue;
   events.push({parameterX:x,
    projectedUV:{...W},sourceCurvePoint3D:{...point3D},
    projectedLineParameter:collapsed?null:Math.max(0,Math.min(1,t)),
    projectedLineCollapsed:collapsed,
    classification:regular?
     'strict-projected-interior-contact':'critical-or-endpoint-undetermined',
    criticalReason:collapsed?'projected-source-line-collapsed':
      row.reason||(!regular?'source-interval-boundary':null),
    exactInverseRadicalAndProjectionVerified:true,
    physical3DSourceJoinVerified:false,
    completeCurveVisibilityVerified:false,
    officialLineStyle:'undetermined',finalV5StrokeAuthorized:false});
  }
 }
 events.sort((a,b)=>a.parameterX-b.parameterX);
 return freeze({schema:'draftai-m4-W-radical-axis-line-events/1',
  status:'exact-source-inverse-root-candidates',
  projectedLineCollapsed:collapsed,
  events,
  originalParameterXMultiplicityPreserved:true,
  allAxisLineContactsWithinSupportedScopeEnumerated:true,
  true3DSourceTopologyVerified:false,
  officialLineStylesVerified:false,finalV5StrokeAuthorized:false});
}
module.exports={intersectSignedRadicalCurveWithAxisLine};
