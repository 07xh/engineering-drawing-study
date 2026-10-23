'use strict';
/**
 * R1 opt-in, READ-ONLY bridge from verified P0 solvers to a single lesson
 * playback plan. This is NOT the canonical core ConstructionStep contract
 * and does not alter existing math, student strokes or public pages.
 *
 * Geometry stays in its native space: first-angle guides are sheet-px;
 * fillet construction is drawing-plane millimetres. A renderer must never
 * treat px as mm, use the old SVG arc-angle action, or infer its own branch.
 */
const {solveProjection}=require('../engines/projection/point-projection.cjs');
const {chooseDirectedFillet}=require('../engines/planar/directed-circle-fillet.cjs');
const {chooseFiniteTwoSegmentArc}=require('../engines/planar/directed-two-segment-fillet.cjs');
const {chooseDirectedSegmentCircleFillet}=
 require('../engines/planar/directed-segment-circle-fillet.cjs');
const {validateGeometry}=require('../core/contracts/geometry.js');

const finite=x=>typeof x==='number'&&Number.isFinite(x);
const point=p=>!!p&&typeof p==='object'&&finite(p.x)&&finite(p.y);
const copy=p=>({x:p.x,y:p.y});
const demand=(ok,msg)=>{if(!ok)throw new TypeError(msg)};
const version=(revision)=>{
 demand(Number.isSafeInteger(revision)&&revision>=0,'invalid input revision');
 return revision;
};
function segment(from,to,space){
 demand(point(from)&&point(to)&&Math.hypot(from.x-to.x,from.y-to.y)>1e-9,
  'invalid construction segment');
 return {kind:'line',coordinateSpace:space,from:copy(from),to:copy(to)};
}
function circle(center,radius){
 demand(point(center)&&finite(radius)&&radius>0,'invalid construction circle');
 return {kind:'circle',coordinateSpace:'model-mm',center:copy(center),radius};
}
function mark(where){
 demand(point(where),'invalid construction point');
 return {kind:'point',coordinateSpace:'model-mm',at:copy(where)};
}
function arc(geometry){
 demand(geometry&&geometry.kind==='arc'&&geometry.space==='drawing-2d',
  'directed arc missing mathematical geometry');
 const d=geometry.data;
 demand(d&&point(d.center)&&finite(d.radius)&&d.radius>0&&
   finite(d.startAngle)&&finite(d.endAngle)&&['cw','ccw'].includes(d.direction),
   'invalid directed mathematical arc');
 const g={id:'verified_fillet_geometry',kind:'arc',space:'drawing-2d',unit:'mm',
  data:{center:copy(d.center),radius:d.radius,startAngle:d.startAngle,
    endAngle:d.endAngle,direction:d.direction}};
 const validation=validateGeometry(g);
 demand(validation.ok,'directed arc fails geometry contract: '+validation.errors.join('; '));
 return {kind:'arc',coordinateSpace:'model-mm',
  center:copy(d.center),radius:d.radius,
  startAngle:d.startAngle,endAngle:d.endAngle,direction:d.direction,
  solverGeometryId:geometry.id};
}
function verifiedPlan(type,revision,solver,result,steps,extra={}){
 const ids=new Set(),graph=new Set(),actionIds=new Set();
 for(const [index,s] of steps.entries()){
  demand(s&&typeof s.id==='string'&&s.id.length>0&&!ids.has(s.id),
   'duplicate or invalid step id');
  demand(Array.isArray(s.dependsOn)&&s.dependsOn.every(dep=>graph.has(dep)),
   'step depends on future or missing predecessor');
  demand(Array.isArray(s.actions),'missing step drawing actions');
  for(const a of s.actions){
   demand(a&&typeof a.id==='string'&&!actionIds.has(a.id),'duplicate drawing action id');
   actionIds.add(a.id);
  }
  ids.add(s.id);graph.add(s.id);
  if(index>100)throw new RangeError('too many construction steps');
 }
 return {
  schema:'draftai-teaching-plan/0.1',
  type,revision,readiness:'ready',solver,
  result,steps,stepCount:steps.length,
  proof:{kind:'recomputed-solver',verified:true,
   scope:type==='point-projection'?'single-point-first-angle':'selected-directed-fillet'},
  ...extra
 };
}
function blocked(type,revision,solver,status,reason,candidateIds=[],extra={}){
 return {schema:'draftai-teaching-plan/0.1',type,revision,solver,
  readiness:['branch-choice-required','direction-required','travel-required'].includes(status)
   ?'requires-choice':'blocked',
  result:{status,reason,candidateIds:[...candidateIds],globallyUnique:null},
  steps:[],stepCount:0,proof:{kind:'recomputed-solver',verified:false},
  ...extra};
}
function adaptPointProjection(input,{revision=0}={}){
 version(revision);
 const solved=solveProjection(input);
 if(solved.status!=='unique'||solved.globallyUnique!==true||
    solved.degrees!==0||!point(solved.point)||
    !['analytic','linear-algebra'].includes(solved.proofLevel)||
    !finite(solved.maxResidual)||solved.maxResidual>1e-8)
  return blocked('point-projection',revision,'engines/projection/point-projection',
   solved.status,solved.reason);
 demand(Array.isArray(solved.steps)&&solved.steps.length===4,'unverified guide count');
 const steps=solved.steps.map((s,i)=>{
  demand(s.source==='computed-first-angle-guides'&&s.unit==='px'&&
   typeof s.explanation==='string','unverified first-angle guide source');
  return {id:s.id,dependsOn:[...(s.dependsOn||[])],
   rule:s.kind,explanation:s.explanation,role:'auxiliary',
   provenance:{solverResultId:solved.resultId,source:s.source},
   actions:[{id:s.id+'_line',...segment(s.from,s.to,'sheet-px')}]};
 });
 return verifiedPlan('point-projection',revision,
  'engines/projection/point-projection',
  {status:'unique',globallyUnique:true,solutionCount:1,
   degrees:0,maxResidual:solved.maxResidual,proofLevel:solved.proofLevel,
   point:{...solved.point},views:solved.views,
   unit:'mm',resultId:solved.resultId},
  steps,{sheet:solved.sheet});
}
function adaptDirectedSegmentCircle(input,{revision=0}={}){
 version(revision);
 const solver='engines/planar/directed-segment-circle-fillet';
 const result=chooseDirectedSegmentCircleFillet(input);
 const candidateIds=[...(result.candidateIds||[])];
 const ready=result.status==='selected'&&result.g1Verified===true&&
  result.finiteSegmentContactVerified===true&&result.sourceArcRangeVerified===true&&
  result.geometry&&result.contacts&&point(result.contacts.first)&&
  point(result.contacts.second)&&finite(result.maxTangencyResidual)&&
  result.maxTangencyResidual<=1e-7&&finite(result.maxG1Mismatch)&&
  result.maxG1Mismatch<=1e-7;
 if(!ready)return blocked('directed-fillet',revision,solver,result.status,
  result.reason||'selected real segment-circle G1 proof missing',candidateIds,
  {kind:'segment-circle'});
 const finalArc=arc(result.geometry);
 demand(Array.isArray(result.steps)&&result.steps.length===5,
  'expected 5 real segment-circle construction steps');
 const steps=result.steps.map((step,i)=>{
  let actions;
  switch(step.id){
   case 'offset-line':
    actions=[{id:'segment_offset_line',
     ...segment(step.geometry.a,step.geometry.b,'model-mm')}];break;
   case 'concentric-locus':
    actions=[{id:'circle_center_locus',
     ...circle(step.geometry.center,step.geometry.radius)}];break;
   case 'center-intersection':
    actions=[{id:'chosen_segment_circle_center',...mark(step.point)}];break;
   case 'contact-points':
    actions=[{id:'segment_contact',...mark(step.contacts.first)},
     {id:'circle_contact',...mark(step.contacts.second)}];break;
   case 'directed-fillet':
    actions=[{id:'verified_segment_circle_arc',...finalArc}];break;
   default:throw new RangeError('unsupported verified segment-circle construction step');
  }
  return {id:step.id,dependsOn:i?[result.steps[i-1].id]:[],
   rule:step.kind,role:step.role,explanation:step.reason,
   provenance:{source:solver,selectedBranch:result.selectedId},actions};
 });
 return verifiedPlan('directed-fillet',revision,solver,{
  status:'selected',candidateIds,globallyUnique:candidateIds.length===1?null:false,
  selectedBranch:result.selectedId,maxResidual:result.maxTangencyResidual,
  maxG1Mismatch:result.maxG1Mismatch,g1Verified:true,
  finiteSegmentContactVerified:true,
  finiteCircleArcCount:result.finiteCircleArcCount,
  // Same explicit proof provenance contract as the two-source-circle solver.
  sourceFiniteArcCount:result.finiteCircleArcCount,
  sourceArcRangeVerified:result.sourceArcRangeVerified,
  unit:'mm',arc:finalArc
 },steps,{kind:'segment-circle'});
}
function adaptDirectedFillet(kind,input,{revision=0}={}){
 version(revision);
 demand(['circles','segments','segment-circle'].includes(kind),'unsupported fillet source kind');
 if(kind==='segment-circle')return adaptDirectedSegmentCircle(input,{revision});
 const solver=kind==='circles'
  ?'engines/planar/directed-circle-fillet'
  :'engines/planar/directed-two-segment-fillet';
 const s=kind==='circles'?chooseDirectedFillet(input):chooseFiniteTwoSegmentArc(input);
 const candidateIds=[...(s.candidateIds||[])];
 const ready=s.status==='selected'&&s.g1Verified===true&&s.geometry&&
  s.contacts&&point(s.contacts.first)&&point(s.contacts.second)&&
  finite(s.maxTangencyResidual)&&s.maxTangencyResidual<=1e-7&&
  finite(s.maxG1Mismatch)&&s.maxG1Mismatch<=1e-7&&
  (kind==='circles'
   ?(s.sourceArcRangeVerified===true&&
      Number.isSafeInteger(s.sourceFiniteArcCount)&&
      s.sourceFiniteArcCount>=0&&s.sourceFiniteArcCount<=2&&
      s.sourceFiniteArcCount===
       Number(input.first?.arc!==undefined)+Number(input.second?.arc!==undefined))
   :s.finiteArcSweepVerified===true);
 if(!ready)
  return blocked('directed-fillet',revision,solver,s.status,
   s.reason||'directed G1 mathematical proof absent',candidateIds,{kind});
 const finalArc=arc(s.geometry);
 const steps=s.steps.map((step,i)=>{
  let actions=[];
  if(kind==='circles'){
   if(step.id==='auxiliary-loci')
    actions=step.circles.map((c,k)=>({id:'locus_'+k,...circle(c.center,c.radius)}));
   else if(step.id==='center-intersection')
    actions=[{id:'fillet_center',...mark(step.center)}];
   else if(step.id==='contact-points')
    actions=[{id:'fillet_contact_first',...mark(step.contacts.first)},
     {id:'fillet_contact_second',...mark(step.contacts.second)}];
   else if(step.id==='directed-fillet')
    actions=[{id:'verified_fillet_arc',...finalArc}];
   else throw new RangeError('unsupported proven circle construction step');
  }else{
   if(step.kind==='offset-line')
    actions=[{id:step.id+'_line',...segment(step.geometry.a,step.geometry.b,'model-mm')}];
   else if(step.kind==='intersection')
    actions=[{id:step.id+'_center',...mark(step.point)}];
   else if(step.kind==='perpendicular-feet')
    actions=[{id:step.id+'_first',...mark(step.points.first)},
     {id:step.id+'_second',...mark(step.points.second)}];
   else if(step.kind==='finite-segment-trim')
    actions=['first','second'].map(k=>({id:step.id+'_'+k,
     ...segment(step.sourceSegments[k].a,step.sourceSegments[k].b,'model-mm')}));
   else if(step.kind==='directed-arc')
    actions=[{id:'verified_fillet_arc',...finalArc}];
   else throw new RangeError('unsupported proven segment construction step');
  }
  return {id:step.id,dependsOn:kind==='circles'?(i?[s.steps[i-1].id]:[]):
   [...(step.dependsOn||[])],
   rule:step.kind||step.id,
   role:step.role||'auxiliary',explanation:step.reason,
   provenance:{source:solver,selectedBranch:s.selectedId},
   actions};
 });
 return verifiedPlan('directed-fillet',revision,solver,{
  status:'selected',globallyUnique:candidateIds.length===1?null:false,
  candidateIds,selectedBranch:s.selectedId,
  maxResidual:s.maxTangencyResidual,maxG1Mismatch:s.maxG1Mismatch,
  g1Verified:true,unit:'mm',arc:finalArc,
  ...(kind==='circles'?{
   sourceFiniteArcCount:s.sourceFiniteArcCount,
   sourceArcRangeVerified:s.sourceArcRangeVerified,
   sourceBoundsProof:'recomputed-two-source-circle-contact-membership'
  }:{})
 },steps,{kind});
}
module.exports={adaptPointProjection,adaptDirectedFillet,adaptDirectedSegmentCircle};
