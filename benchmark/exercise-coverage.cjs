'use strict';
/**
 * #380: private textbook exercise acceptance INDEX, never an answer bank.
 * Stores short original metadata and *verified* test statuses only.
 * No scans, answer images, copyrighted explanations, or geometry solutions.
 * This structural gate cannot replace M5 independent mathematical review.
 */
const MAX_PAGE=86;
const STAGES=Object.freeze(['recognition','math','construction','animation','standards']);
const RESULTS=new Set(['unreviewed','unsupported','needs-confirmation','multiple','underdetermined','solved']);
const STAGE_VALUES=new Set(['untested','passed','failed','not-applicable']);
const META_KEYS=new Set(['printedPage','questionLabel','localOrdinal','textbookChapter','topic','solver','kind','result','stages','blindTest','answerHidden','evidenceRefs']);
const SAFE_REF=/^(?:tests\/[a-zA-Z0-9_./-]+|https:\/\/github\.com\/07xh\/engineering-drawing-study\/(?:pull|actions|commit|issues)\/[a-zA-Z0-9_./#-]+)$/;
function short(value,label,length=60){
 if(value===undefined||value===null||value==='')return null;
 if(typeof value!=='string'||value.length>length||/[\r\n<>]/.test(value))throw new TypeError(label+' must be short metadata');
 return value.trim()||null;
}
function makeId(entry){
 const page=entry?.printedPage;
 if(!Number.isInteger(page)||page<1||page>MAX_PAGE)throw new RangeError('printedPage must be 1..86');
 let q=entry.questionLabel;
 if(q!==undefined&&q!==null){
  if(typeof q!=='string'||!/^\d+(?:-\d+){0,4}$/.test(q))throw new TypeError('invalid printed question label');
 } else {
  if(!Number.isInteger(entry.localOrdinal)||entry.localOrdinal<1||entry.localOrdinal>99)throw new TypeError('localOrdinal required when original question label unavailable');
  q='LOCAL-'+String(entry.localOrdinal).padStart(2,'0');
 }
 return 'BENCH-086-P'+String(page).padStart(3,'0')+'-Q'+q;
}
function validateEntry(entry){
 if(!entry||typeof entry!=='object'||Array.isArray(entry))throw new TypeError('entry must be an object');
 for(const k of Object.keys(entry))if(!META_KEYS.has(k))throw new TypeError('unexpected field: '+k);
 const id=makeId(entry);
 const kind=entry.kind??'original-exercise';
 if(!['original-exercise','synthetic-control'].includes(kind))throw new TypeError('invalid kind');
 const result=entry.result??'unreviewed';
 if(!RESULTS.has(result))throw new TypeError('invalid result');
 if(entry.stages!==undefined&&(!entry.stages||typeof entry.stages!=='object'||Array.isArray(entry.stages)))throw new TypeError('invalid stages');
 for(const k of Object.keys(entry.stages??{}))if(!STAGES.includes(k))throw new TypeError('unknown stage: '+k);
 const stages={};
 for(const k of STAGES){
  stages[k]=entry.stages?.[k]??'untested';
  if(!STAGE_VALUES.has(stages[k]))throw new TypeError('invalid stage '+k);
 }
 const evidenceRefs=entry.evidenceRefs??{};
 if(!evidenceRefs||typeof evidenceRefs!=='object'||Array.isArray(evidenceRefs))throw new TypeError('invalid evidenceRefs');
 for(const [k,v] of Object.entries(evidenceRefs)){
  if(!STAGES.includes(k)||typeof v!=='string'||!SAFE_REF.test(v))throw new TypeError('invalid evidence ref');
 }
 if(typeof (entry.blindTest??false)!=='boolean'||typeof (entry.answerHidden??false)!=='boolean')throw new TypeError('invalid isolation flags');
 if(result==='solved'){
  if(kind!=='original-exercise'||entry.blindTest!==true||entry.answerHidden!==true)throw new TypeError('solved requires original blind, answer-isolated input');
  if(STAGES.some(k=>stages[k]!=='passed'&&!(k==='standards'&&stages[k]==='not-applicable')))throw new TypeError('solved requires independently passed stages');
  for(const k of ['math','construction','animation'])if(!evidenceRefs[k])throw new TypeError('solved requires traceable math/step/V5 evidence');
 }
 return Object.freeze({
  id,printedPage:entry.printedPage,
  questionLabel:entry.questionLabel??null,localOrdinal:entry.localOrdinal??null,
  textbookChapter:short(entry.textbookChapter,'textbookChapter',30),
  topic:short(entry.topic,'topic'),solver:short(entry.solver,'solver',40),
  kind,result,blindTest:entry.blindTest===true,answerHidden:entry.answerHidden===true,
  stages:Object.freeze(stages),evidenceRefs:Object.freeze({...evidenceRefs})
 });
}
function summarize(entries){
 if(!Array.isArray(entries))throw new TypeError('entries must be an array');
 const seen=new Set();
 const summary={indexed:0,originalExercises:0,syntheticControls:0,solved:0,safeHandling:0,pending:0,failedStages:0};
 for(const source of entries){
  const e=validateEntry(source);
  if(seen.has(e.id))throw new TypeError('duplicate exercise id: '+e.id);
  seen.add(e.id);
  summary.indexed++;
  if(e.kind==='synthetic-control'){summary.syntheticControls++;continue;}
  summary.originalExercises++;
  if(e.result==='solved')summary.solved++;
  else if(['unsupported','needs-confirmation','multiple','underdetermined'].includes(e.result))summary.safeHandling++;
  else summary.pending++;
  if(STAGES.some(k=>e.stages[k]==='failed'))summary.failedStages++;
 }
 return Object.freeze(summary);
}
module.exports={MAX_PAGE,STAGES,makeId,validateEntry,summarize};
