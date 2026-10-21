/* Original concept practice only. No textbook scans or unverified exercise answers. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.PointCoach=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const storageKey='drawing-point-coach-v1';
const initial={x:26,y:34,z:44};
const reasons={correct:'height-depth',height:'height-only',wrong:'x-height'};
function validProblem(p){return !!p&&['x','y','z'].every(k=>Number.isInteger(p[k])&&p[k]>=8&&p[k]<=58);}
function validCandidate(p){return !!p&&['y','z'].every(k=>Number.isFinite(p[k])&&p[k]>=0&&p[k]<=70);}
function id(p){return [p.x,p.y,p.z].join('-');}
function create(problem=initial){if(!validProblem(problem))throw Error('Invalid concept problem');return {problem:{...problem},candidate:null,reason:'',hint:0,explanation:false,model:false,stage:0,assisted:false,checks:0,solved:false,feedback:null};}
function grade(state){
 if(!validCandidate(state.candidate))return {kind:'missing-point',correct:false,text:'先在 W 区放置候选点，或填写深度和高度。'};
 if(!Object.values(reasons).includes(state.reason))return {kind:'missing-reason',correct:false,text:'再选择作图依据：这个位置需要同时满足哪些条件？'};
 const depth=Math.abs(state.candidate.y-state.problem.y)<=0.5,height=Math.abs(state.candidate.z-state.problem.z)<=0.5;
 if(!height&&!depth)return {kind:'both',correct:false,text:'高度和深度都还不对应。先比较 a″ 与 a′ 的高度，再比较 a″ 到 Z 轴和 a 到 X 轴的距离。'};
 if(!height)return {kind:'height',correct:false,text:'深度对应了，高度还不对应。观察 a′，a″ 应与它高平齐。'};
 if(!depth)return {kind:'depth',correct:false,text:'高度对应了，深度还不对应。观察 a 到 X 轴的距离，把同一个深度转移到 W 面。'};
 if(state.reason!==reasons.correct)return {kind:'reason',correct:false,text:'位置正确，但依据不完整。W 面保留深度 y 和高度 z；仅有等高条件，还不能确定唯一点。'};
 return {kind:'correct',correct:true,text:'高度、深度与作图依据均正确。a″ 与 a′ 高平齐，且与 a 表示同一个深度。'};
}
function act(state,action){
 const next={...state};
 switch(action.type){
  case 'candidate':next.candidate=validCandidate(action.value)?{...action.value}:null;next.feedback=null;next.solved=false;break;
  case 'reason':next.reason=Object.values(reasons).includes(action.value)?action.value:'';next.feedback=null;next.solved=false;break;
  case 'hint':next.hint=Math.min(3,state.hint+1);next.assisted=true;break;
  case 'explain':next.explanation=true;next.assisted=true;break;
  case 'practice':next.explanation=false;break;
  case 'model':next.model=true;next.assisted=true;break;
  case 'stage':next.stage=Math.max(0,Math.min(4,Number.isInteger(action.value)?action.value:0));break;
  case 'reset':next.candidate=null;next.reason='';next.feedback=null;next.solved=false;next.explanation=false;break;
  case 'check':{
   if(state.solved)return state;
   next.feedback=grade(state);
   if(!next.feedback.kind.startsWith('missing')){
    next.checks=state.checks+1;next.solved=next.feedback.correct;
    if(!next.solved)next.assisted=true;
   }
   break;
  }
  default:return state;
 }
 return next;
}
function performance(state){return state.solved?(state.assisted?'guided':'independent'):'in-progress';}
function generate(random=Math.random,excluded=[]){
 for(let i=0;i<100;i++){
  const p={x:10+2*Math.floor(random()*23),y:10+2*Math.floor(random()*23),z:10+2*Math.floor(random()*23)};
  if(validProblem(p)&&!excluded.includes(id(p)))return p;
 }
 // Deterministic fallback also avoids recycling a previously revealed answer.
 for(let y=8;y<=58;y+=2)for(let z=8;z<=58;z+=2){const p={x:26,y,z};if(!excluded.includes(id(p)))return p;}
 throw Error('本轮参数已用完，请保留记录后开始新的学习。');
}
function restore(raw){
 const empty={version:1,active:create(),records:[],seen:[],reviewAt:null};
 try{
  const data=JSON.parse(raw);if(data?.version!==1)return empty;
  const records=Array.isArray(data.records)?data.records.filter(r=>validProblem(r.problem)&&['guided','independent'].includes(r.mode)&&Number.isFinite(r.at)).slice(-100):[];
  const seen=Array.isArray(data.seen)?data.seen.filter(x=>typeof x==='string'&&/^\d+-\d+-\d+$/.test(x)).slice(-500):[];
  let active=create();
  if(validProblem(data.active?.problem)){
   const a=data.active;active=create(a.problem);
   active.candidate=validCandidate(a.candidate)?{y:a.candidate.y,z:a.candidate.z}:null;
   active.reason=Object.values(reasons).includes(a.reason)?a.reason:'';
   active.hint=Number.isInteger(a.hint)?Math.max(0,Math.min(3,a.hint)):0;
   active.stage=Number.isInteger(a.stage)?Math.max(0,Math.min(4,a.stage)):0;
   active.model=a.model===true;active.explanation=a.explanation===true;
   active.checks=Number.isInteger(a.checks)?Math.max(0,Math.min(10000,a.checks)):0;
   active.assisted=a.assisted===true||active.hint>0||active.model||active.explanation;
   active.solved=a.solved===true&&grade(active).correct;
   if(active.solved)active.feedback=grade(active);
  }
  return {version:1,active,records,seen,reviewAt:Number.isFinite(data.reviewAt)?data.reviewAt:null};
 }catch(e){return empty;}
}
return {storageKey,initial,reasons,validProblem,validCandidate,id,create,grade,act,performance,generate,restore};
});
