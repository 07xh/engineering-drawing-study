'use strict';
/**
 * Shared M3 -> section ConstructionStep DAG -> existing ONE V5 parity gate.
 *
 * This is NOT a second solver, a new V5 timeline, a visibility classifier,
 * nor a mathematical certification of a whole engineering drawing.
 * Two existing M3 previews (finite prism and pyramid) independently recompute
 * their section polygons; this gate compares them with the already audited
 * Geometry emitted by the unified pipeline before any playback is exposed.
 */
const {project,VIEWS}=require('../core/projection/conventions.js');
const {prismSectionV5Preview}=
 require('../engines/spatial/sections/rectangular-prism-v5-preview.cjs');
const {pyramidSectionV5Preview}=
 require('../engines/spatial/sections/rectangular-pyramid-v5-preview.cjs');
const Timeline=require('./teaching-timeline-v5.js');
const close=(a,b,tol=1e-6)=>Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=tol;
const axes=['x','y','z'];
const equalXYZ=(a,b)=>a&&b&&axes.every(k=>close(a[k],b[k]));
const safeCopy=value=>JSON.parse(JSON.stringify(value));
function deepFreeze(v){
 if(v&&typeof v==='object'&&!Object.isFrozen(v)){
  for(const item of Object.values(v))deepFreeze(item);
  Object.freeze(v);
 }
 return v;
}
function fail(reason){throw new RangeError('spatial M3/V5 projection parity: '+reason);}
const providers=Object.freeze({
 'rectangular-prism':prismSectionV5Preview,
 'rectangular-pyramid':pyramidSectionV5Preview
});
function assertSpatialSectionV5Parity({input,evidence,plan,revision}={}){
 if(!Number.isSafeInteger(revision)||revision<0)fail('invalid source revision');
 if(!input||!Object.hasOwn(providers,input.kind)||!plan||
   !evidence||evidence.geometryVerifiedWithinSpecialistScope!==true||
   evidence.sourceMethod!=='internal-specialist-recomputation')
  fail('trusted M3 source evidence required');
 const g=evidence.sectionPerimeterGeometry;
 if(g?.kind!=='polyline'||g.space!=='model-3d'||g.unit!=='mm'||
    !Array.isArray(g.data?.points)||g.data.closed!==true||
    g.data.points.length<3||g.data.points.length>6)
  fail('trusted ordered section polygon required');
 if(plan.status!=='ready'||plan.v5PreviewReady!==true||
    plan.mathematicalPerimeterVerified!==true||
    plan.visibilityVerified!==false||plan.firstAngleConventionSignedOff!==false||
    plan.completeEngineeringDrawingVerified!==false)
  fail('specialist preview must not certify visibility or whole drawing');
 const n=g.data.points.length,scale=plan.sheet?.scale;
 if(!Number.isFinite(scale)||scale<=0||
    plan.sectionEdgeCount!==n||plan.stations?.length!==n||
    !Array.isArray(plan.steps)||!plan.steps.length||!plan.timing)
  fail('incomplete finite polygon V5 plan');
 for(let i=0;i<n;i++){
  const station=plan.stations[i],p=g.data.points[i];
  if(!equalXYZ(station?.modelMm,p))fail('M3 polygon vertex and V5 station disagree');
  const mathematicallyProjected=project(p);
  for(const view of VIEWS){
   const q=station[view],uv=mathematicallyProjected[view];
   if(!q||!Number.isFinite(q.x)||!Number.isFinite(q.y)||
      !Number.isFinite(uv.u)||!Number.isFinite(uv.v))
    fail('missing first-angle projection');
   // Check DIFFERENCES: origin and zoom are a presentation choice.
   // Direction, scale and cross-view correspondence are not.
   const next=plan.stations[(i+1)%n],pp=project(g.data.points[(i+1)%n])[view];
   const du=pp.u-uv.u,dv=pp.v-uv.v;
   const dx=next[view]?.x-q.x,dy=next[view]?.y-q.y;
   const signX=view==='W'?1:1;
   const signY=view==='H'?1:-1;
   if(!close(dx,signX*scale*du)||!close(dy,signY*scale*dv))
    fail('first-angle V/H/W model-to-sheet edge direction mismatch');
  }
 }
 const seenSteps=new Set(),resultIds=new Set(),covered=new Set();
 for(const step of plan.steps){
  if(!step||typeof step.id!=='string'||seenSteps.has(step.id)||
     !['guide','result'].includes(step.role)||
     !Array.isArray(step.dependsOn)||!Array.isArray(step.actions)||
     step.dependsOn.some(id=>!seenSteps.has(id)))
   fail('invalid or forward-dependent ConstructionStep');
  seenSteps.add(step.id);
  for(const action of step.actions){
   if(step.role!=='result')continue;
   if(action.visibility!=='undetermined'||typeof action.id!=='string'||
      resultIds.has(action.id))fail('result visibility or identity was upgraded');
   resultIds.add(action.id);
   const suffix=action.id.match(/-(V|H|W)$/),view=suffix?.[1];
   const i=Number(action.sourceSectionEdgeId?.match(/^section-edge-(\d+)$/)?.[1])-1;
   if(!view||!Number.isInteger(i)||i<0||i>=n)fail('unknown V5 source section edge');
   const key=i+':'+view;
   if(covered.has(key))fail('duplicate V/H/W section edge');
   covered.add(key);
   const a=plan.stations[i][view],b=plan.stations[(i+1)%n][view];
   if(action.kind==='line'){
    if(!close(action.geometry?.from?.x,a.x)||!close(action.geometry?.from?.y,a.y)||
       !close(action.geometry?.to?.x,b.x)||!close(action.geometry?.to?.y,b.y))
      fail('V5 stroke coordinates disagree with trusted M3 station');
   }else if(action.kind==='point'){
    if(!close(a.x,b.x)||!close(a.y,b.y)||
       !close(action.geometry?.center?.x,a.x)||
       !close(action.geometry?.center?.y,a.y))
      fail('collapsed result projection is not a real point');
   }else fail('unsupported polygon result action');
  }
 }
 if(covered.size!==n*VIEWS.length)fail('missing V/H/W section construction actions');
 if(JSON.stringify(Timeline.compileTimeline(plan.steps))!==JSON.stringify(plan.timing))
  fail('single V5 timeline and ConstructionStep DAG disagree');
 return true;
}
function buildScopedSpatialSectionV5Preview({input,evidence,revision}={}){
 if(!input||!Object.hasOwn(providers,input.kind))return null;
 // Trusted wrapper calls recompute the old specialist as an independent oracle,
 // never accept a caller supplied plan or a claimed source-verified flag.
 if(!evidence||evidence.geometryVerifiedWithinSpecialistScope!==true||
    !evidence.sectionPerimeterGeometry)return null;
 const plan=providers[input.kind](input.solid,input.plane);
 assertSpatialSectionV5Parity({input,evidence,plan,revision});
 return deepFreeze({
  status:'preview-only',revision,sourceKind:input.kind,
  geometryId:evidence.sectionPerimeterGeometry.id,
  mathScope:'independently-audited-finite-polygon-perimeter',
  visibility:'undetermined',visibilityVerified:false,
  fullSpatialConstructionIntentVerified:false,
  completeEngineeringDrawingVerified:false,
  canPromoteToVerifiedResult:false,
  steps:safeCopy(plan.steps),timing:safeCopy(plan.timing),
  sheet:safeCopy(plan.sheet)
 });
}
module.exports={assertSpatialSectionV5Parity,buildScopedSpatialSectionV5Preview};
