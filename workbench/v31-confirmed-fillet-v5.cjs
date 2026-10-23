'use strict';
/**
 * V3.1 Gate A (07): confirmed model geometry -> actual 02 solver -> proven
 * directed G1 construction -> existing V5 timeline. Never consumes OCR
 * candidates or prewritten answer coordinates; never manufactures a branch.
 *
 * This module is stacked on 01's strict candidate gateway (#245). It is
 * opt-in and does not change public pages, build outputs or player state.
 */
const {normalizeProblem,solveFiniteFillet}=
 require('../engines/constraints-2d/finite-fillet-gate.cjs');
const {filletTimeline}=require('./verified-plan-v5-bridge.cjs');
const {projectVerifiedPlan}=require('./verified-intent-projection.cjs');
const {assertVerifiedArcParity}=require('./verified-v5-arc-parity.cjs');

const typeToLegacy=Object.freeze({
 'two-segments':'segments',
 'segment-circle':'segment-circle',
 'two-circles':'circles'
});
const selectors=Object.freeze({
 'two-segments':['branchId','direction','firstTravel','secondTravel'],
 'segment-circle':['branchId','direction','lineTravel','knownCircleTravel'],
 'two-circles':['branchId','direction','knownFirstTravel','knownSecondTravel']
});
const pt=p=>p!==null&&typeof p==='object'&&
 typeof p.x==='number'&&Number.isFinite(p.x)&&
 typeof p.y==='number'&&Number.isFinite(p.y);
const close=(a,b)=>Number.isFinite(a)&&Number.isFinite(b)&&
 Math.abs(a-b)<=1e-7; // same strict mm-bound as current verified V5 consumer
const closePoint=(a,b)=>pt(a)&&pt(b)&&close(a.x,b.x)&&close(a.y,b.y);
const arcPoint=(arc,degrees)=>({
 x:arc.center.x+arc.radius*Math.cos(degrees*Math.PI/180),
 y:arc.center.y+arc.radius*Math.sin(degrees*Math.PI/180)
});
function strictSelection(value,kind){
 if(value===undefined)return {};
 if(value===null||typeof value!=='object'||Array.isArray(value))
  throw new TypeError('selection must be an object');
 for(const field of Object.keys(value))
  if(!selectors[kind].includes(field))
   throw new TypeError('unsupported choice field '+field);
 const s={...value};
 if(s.branchId!==undefined&&(typeof s.branchId!=='string'||!s.branchId))
  throw new TypeError('branchId must be a nonempty candidate identifier');
 if(s.direction!==undefined&&!['cw','ccw'].includes(s.direction))
  throw new RangeError('direction must be cw or ccw');
 for(const name of selectors[kind].filter(x=>x!=='branchId'&&x!=='direction')){
  const allowed=kind==='two-circles'||name==='knownCircleTravel'
   ?['cw','ccw']:['forward','reverse'];
  if(s[name]!==undefined&&!allowed.includes(s[name]))
   throw new RangeError(name+' is not a valid source travel');
 }
 return s;
}
function blocked(revision,status,reason,candidateIds=[],proofScope=null){
 return {status,reason,revision,selectedBranchId:null,
  candidateIds:[...candidateIds],proofScope,mathematicallyVerified:false,
  steps:[],timing:null};
}
function confirmedFilletTimeline(input){
 if(input===null||typeof input!=='object'||Array.isArray(input))
  throw new TypeError('input must be an object');
 for(const k of Object.keys(input))
  if(!['problem','selection','sheet'].includes(k))
   throw new TypeError('unsupported input field '+k);
 const problem=normalizeProblem(input.problem);
 const selection=strictSelection(input.selection,problem.kind);
 const solved=solveFiniteFillet(problem);
 const ids=solved.candidates.map(c=>c.branchId);
 if(!['unique','multiple'].includes(solved.status))
  return blocked(problem.revision,'blocked','math solve status: '+solved.status,
   ids,solved.proofScope);
 const selectedId=selection.branchId??(ids.length===1?ids[0]:null);
 if(!selectedId)
  return blocked(problem.revision,'requires-branch',
   'multiple legitimate centers; select a branch before constructing an arc',
   ids,solved.proofScope);
 const candidate=solved.candidates.find(c=>c.branchId===selectedId);
 if(!candidate)throw new RangeError('selected branch is not in verified finite candidates');
 if(!selection.direction)
  return blocked(problem.revision,'requires-direction',
   'a circle center does not prove the connecting arc sweep',ids,solved.proofScope);
 // A strict G1 proof needs both source approach and departure orientations.
 const travelFields=selectors[problem.kind].slice(2);
 if(travelFields.some(name=>selection[name]===undefined))
  return blocked(problem.revision,'requires-travel',
   'both source contour travel directions are needed to prove directed G1',
   ids,solved.proofScope);
 const solverInput={
  ...problem.geometry,filletRadius:problem.filletRadius,...problem.options,
  branchId:selectedId,direction:selection.direction,
  [travelFields[0]]:selection[travelFields[0]],
  [travelFields[1]]:selection[travelFields[1]]
 };
 // The original 02 solvers, not OCR or the UI, recompute and verify G1.
 const renderSheet=input.sheet===undefined?
  {origin:{x:360,y:220},scale:8}:input.sheet;
 const playback=filletTimeline(typeToLegacy[problem.kind],
  solverInput,renderSheet,problem.revision);
 if(playback.status!=='ready'||playback.mathematicallyVerified!==true)
  return blocked(problem.revision,'blocked',
   playback.reason||playback.originalLesson?.result?.reason||
    'directed G1 or finite source proof is not established',
   ids,solved.proofScope);
 const original=playback.originalLesson?.result;
 const arc=original?.arc;
 const actual=playback.steps.at(-1)?.actions?.find(a=>a.kind==='arc');
 if(original?.g1Verified!==true||original?.selectedBranch!==selectedId||
    playback.revision!==problem.revision||
    !closePoint(arc?.center,candidate.center)||
    !close(arc?.radius,problem.filletRadius)||
    !Number.isFinite(arc?.startAngle)||!Number.isFinite(arc?.endAngle)||
    !closePoint(arcPoint(arc,arc.startAngle),candidate.contacts.first)||
    !closePoint(arcPoint(arc,arc.endAngle),candidate.contacts.second)||
    !close(original.maxResidual,candidate.maxResidual)||
    !Number.isFinite(original.maxG1Mismatch)||
    original.maxG1Mismatch>1e-7||
    !actual||actual.geometry===null||
    !Array.isArray(playback.steps)||playback.steps.length<3)
  throw new RangeError('independent mathematical evidence disagrees with V5 plan');
 // Verify actual V5 output still ends at both independently solved contacts.
 // Never accept a pretty but mathematically reversed or displaced SVG arc.
 assertVerifiedArcParity({sourceArc:arc,contacts:candidate.contacts,
  sheet:renderSheet,action:actual});
 // #377 F2: the source-backed semantic intent projection is now the drawing
 // path consumed by the existing session/V5. The original trusted V5 plan
 // remains an independent parity oracle; no new player is created.
 const intentV5=projectVerifiedPlan(typeToLegacy[problem.kind],
  solverInput,renderSheet,problem.revision);
 if(intentV5.status!=='ready'||intentV5.mathematicallyVerified!==true||
    intentV5.revision!==problem.revision||
    intentV5.selectedBranchId!==selectedId||
    intentV5.intents?.length!==playback.steps.length||
    JSON.stringify(intentV5.steps)!==JSON.stringify(playback.steps)||
    JSON.stringify(intentV5.timing)!==JSON.stringify(playback.timing)||
    intentV5.intents.some((intent,i)=>
     intent.sourceRevision!==problem.revision||
     intent.branchId!==selectedId||
     intent.id!==playback.steps[i].id||
     JSON.stringify(intent.dependsOn)!==
      JSON.stringify(playback.steps[i].dependsOn)||
     JSON.stringify(intent.outputEntityIds)!==
      JSON.stringify(playback.steps[i].actions.map(a=>a.id))))
  throw new RangeError('F2 intent-to-V5 projection differs from verified original timeline');
 return {...playback,
  // V5 truly consumes the steps and timebase produced with the intent DAG.
  steps:intentV5.steps,timing:intentV5.timing,
  constructionIntentPrototype:intentV5.intents,
  intentSchema:'draftai-r1-intent-projection/0.1',
  source:'V3.1 confirmed-mm geometry + verified 02 G1',
  proofScope:solved.proofScope,
  selectedBranchId:selectedId,
  typedMathEvidence:{kind:problem.kind,unit:'mm',revision:problem.revision,
   solverStatus:solved.status,branchCount:solved.candidateCount,
   branchId:selectedId,center:{...candidate.center},
   contacts:{first:{...candidate.contacts.first},
    second:{...candidate.contacts.second}},
   maxResidualMm:candidate.maxResidual,
   g1Verified:true,finishedArcVerified:true,
   globallyUnique:null}};
}
module.exports={confirmedFilletTimeline};
