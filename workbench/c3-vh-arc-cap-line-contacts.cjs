'use strict';
/**
 * M5 first-angle C3 EXACT V/H analytic projected seam-arc vs finite-cap
 * 3D source-line contacts. Keeps the physical 3D source identities and
 * compares source depth at EACH mathematical 2D crossing, separately
 * for every independent M3 signed-radical 3D branch.
 */
const {buildC3VHProjectionDedup}=
 require('./c3-vh-projection-dedup.cjs');
const {auditC3ProjectedCapLineArrangement}=
 require('./c3-projected-cap-line-arrangement.cjs');
const {evaluateUnifiedMath}=require('./unified-math-pipeline.cjs');
const {intersectCircleSubarcWithLine}=
 require('../core/projection/analytic-arc-line-contacts.cjs');
const {project,FIRST_ANGLE_OBSERVER_RAYS}=
 require('../core/projection/conventions.js');
const freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){
 for(const v of Object.values(x))freeze(v);Object.freeze(x);
}return x;};
const interp=(a,b,t)=>({x:a.x+(b.x-a.x)*t,
 y:a.y+(b.y-a.y)*t,z:a.z+(b.z-a.z)*t});
const depth=(p,ray)=>p.x*ray.x+p.y*ray.y+p.z*ray.z;
function auditC3VHArcCapLineContacts({input,revision}={}){
 if(!Number.isSafeInteger(revision)||revision<0)
  throw new TypeError('reviewed C3 source revision required');
 const arcs=buildC3VHProjectionDedup({input,revision});
 const lines=auditC3ProjectedCapLineArrangement({input,revision});
 const m3=evaluateUnifiedMath({kind:'finite-orthogonal-cylinder-intersection',
  input,revision});
 const blocked=reason=>freeze({
  schema:'draftai-c3-VH-arc-line-contacts/1',revision,
  status:'not-covered',reason,contacts:[],tangentBlockers:[],
  signedArcAtoms:[],allVHCircularArcLineContactsResolved:false,
  allProjectedCurvesAndLinesResolved:false,
  officialLineStylesVerified:false,finalV5StrokeAuthorized:false});
 if(arcs.status!=='scoped-projected-analytic-interval-deduplicated'||
   lines.status!=='scoped-source-cap-line-three-view-arrangement'||
   m3.status!=='scoped-analytic-ready'||
   !arcs.projectionOwnershipVerified||
   !lines.allProjectedCapLinesAccountedFor)
  return blocked('source M3 projected circular arc or M4 source line unavailable');
 const Z=m3.source.zCylinder,Y=m3.source.yCylinder,
  tol=1e-8*Math.max(1,Z.radius,Y.radius);
 const branches=new Map(m3.branches.map(b=>[b.id,b]));
 const contacts=[],tangentBlockers=[],atoms=[];
 for(const span of arcs.spans){
  const view=span.view;
  const sourceLines=lines.views[view].projectedLineAtoms;
  const split=[...span.xOpenRange];
  for(const line of sourceLines){
   const result=intersectCircleSubarcWithLine({
    circle:span.projectedSourceCircle,sign:span.retainedSign,
    xRange:span.xOpenRange,
    from:line.projectedFrom,to:line.projectedTo,tolerance:tol});
   if(result.classification==='tangent-or-near-degenerate-undetermined'){
    tangentBlockers.push({view,projectedArcId:span.id,
     projectedLineAtomId:line.id,sourceCapEdgeId:line.edgeId,
     reason:'circular arc line tangent or nearly degenerate',
     finalLineStyle:'undetermined'});
    continue;
   }
   for(const contact of result.contacts){
    const x=contact.uv.u;
    const matched=span.sourceBranchIds.map(id=>branches.get(id))
     .filter(b=>b&&x>=b.xRange[0]-tol&&x<=b.xRange[1]+tol);
    if(!matched.length)
     throw new RangeError('projected arc lost source 3D signed branch');
    const capPoint=interp(line.original3DFrom,line.original3DTo,
     contact.parameter);
    const capProjected=project(capPoint)[view];
    if(Math.hypot(capProjected.u-contact.uv.u,
      capProjected.v-contact.uv.v)>tol*5)
     throw new RangeError('source cap 3D line point differs from 2D quadratic root');
    const pDepth=depth(capPoint,FIRST_ANGLE_OBSERVER_RAYS[view]);
    const branchDepths=matched.map(b=>{
     const y=Z.yCenter+b.signY*Math.sqrt(Math.max(0,
      (Z.radius-Math.abs(x-Z.xCenter))*
      (Z.radius+Math.abs(x-Z.xCenter))));
     const z=Y.zCenter+b.signZ*Math.sqrt(Math.max(0,
      (Y.radius-Math.abs(x-Y.xCenter))*
      (Y.radius+Math.abs(x-Y.xCenter))));
     const p={x,y,z},uv=project(p)[view];
     if(Math.hypot(uv.u-contact.uv.u,uv.v-contact.uv.v)>tol*5)
      throw new RangeError('independent C3 source branch projection mismatch');
     const d=depth(p,FIRST_ANGLE_OBSERVER_RAYS[view]);
     const delta=pDepth-d;
     return {sourceBranchId:b.id,point3D:p,observerDepth:d,
      signedCapMinusCurveDepth:delta,
      pointwiseCapDepthOrder:Math.abs(delta)<=tol?
       'same-projected-and-spatial-point':
       delta>0?'cap-point-in-front':'curve-point-in-front',
      sourceBranchIdentityVerified:true,
      adjacentIntervalDepthOrderProven:false};
    });
    // Same source line can be split into adjacent atoms by M4. De-dup
    // identical 2D contact roots without combining different 3D branches.
    const duplicate=contacts.find(row=>row.view===view&&
     row.projectedArcId===span.id&&row.sourceCapEdgeId===line.edgeId&&
     Math.hypot(row.projectedUV.u-contact.uv.u,
      row.projectedUV.v-contact.uv.v)<=tol);
    if(duplicate){
     if(duplicate.sourceBranchDepths.length!==branchDepths.length)
      throw new RangeError('inconsistent source branch ownership at split');
     continue;
    }
    contacts.push({id:'VHArcCapContact'+contacts.length,view,
     projectedArcId:span.id,projectedLineAtomId:line.id,
     sourceCapEdgeId:line.edgeId,sourceCapFeatureId:line.sourceId,
     projectedUV:{...contact.uv},
     sourceLineAtomParameter:contact.parameter,
     sourceCap3DPoint:capPoint,sourceCapObserverDepth:pDepth,
     sourceBranchDepths:branchDepths,
     exactQuadraticArcLineEquationVerified:true,
     firstAnglePhysicalDepthAtIntersectionCompared:true,
     atAnalyticArcTerminal:contact.atSourceArcTerminal,
     atProjectedCapLineAtomTerminal:contact.atSourceLineTerminal,
     entireCurveLineContinuityVerified:false,
     officialLineStyle:'undetermined',
     finalV5StrokeAuthorized:false});
    if(x>span.xOpenRange[0]+tol&&x<span.xOpenRange[1]-tol)
     split.push(x);
   }
  }
  split.sort((a,b)=>a-b);
  const distinct=[];
  for(const x of split){
   if(!distinct.length||x-distinct.at(-1)>tol)distinct.push(x);
  }
  if(distinct[0]!==span.xOpenRange[0]||
     distinct.at(-1)!==span.xOpenRange[1])
   throw new RangeError('projected analytic arc coverage lost at split');
  for(let i=1;i<distinct.length;i++){
   const a=distinct[i-1],b=distinct[i],mid=(a+b)/2;
   const matched=span.sourceBranchIds.filter(id=>{
    const row=branches.get(id);
    return row&&mid>=row.xRange[0]-tol&&mid<=row.xRange[1]+tol;
   });
   if(!matched.length)throw new RangeError('arc atom lacks real 3D source branch');
   atoms.push({id:'VHArcAtom'+atoms.length,view,
    projectedArcId:span.id,openXRange:[a,b],
    sourceBranchIds:matched,
    adjacentContactIds:contacts.filter(c=>
     c.view===view&&c.projectedArcId===span.id&&
     (Math.abs(c.projectedUV.u-a)<=tol||
      Math.abs(c.projectedUV.u-b)<=tol)).map(c=>c.id),
    sourceAnalyticCircleEquationUnchanged:true,
    allCapLinePotentialCrossingsSegmentedWithinSupportedScope:
     !tangentBlockers.some(t=>t.view===view&&t.projectedArcId===span.id),
    standardLineStyle:'undetermined',finalV5StrokeAuthorized:false});
  }
 }
 return freeze({schema:'draftai-c3-VH-arc-line-contacts/1',revision,
  status:tangentBlockers.length?'scoped-partial-transverse-VH-arc-cap-contacts':
   'scoped-transverse-VH-arc-cap-contacts',
  contacts,tangentBlockers,signedArcAtoms:atoms,
  projectedArcSourceCount:arcs.spans.length,
  capSourceStraightEdgeCount:lines.true3DSourceCapEdgeCount,
  firstAngleViewsCovered:['V','H'],
  exactQuadraticContactCount:contacts.length,
  allVHCircularArcLineContactsResolved:tangentBlockers.length===0,
  threeDimensionalSourceDepthRetainedAtEveryContact:true,
  allProjectedCurvesAndLinesResolved:false,
  allProjectedOriginalShapeOutlinesResolved:false,
  all3DTo2DCompositeLineStyleJoinsVerified:false,
  officialLineStylesVerified:false,finalV5StrokeAuthorized:false});
}
module.exports={auditC3VHArcCapLineContacts};
