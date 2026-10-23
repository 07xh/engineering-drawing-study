'use strict';
const {compileConfirmedTwoPoint}=require('../workbench/confirmed-two-point-v5.cjs');
const Motion=require('../workbench/teaching-motion-v5.js');
const $=id=>document.getElementById(id),NS='http://www.w3.org/2000/svg';
let current=null,revision=0,playing=false,raf=null,last=0;
function stop(){playing=false;if(raf!==null)cancelAnimationFrame(raf);raf=null;}
function clear(){stop();current=null;$('sheet').replaceChildren();$('picked').textContent='点击辅助线可查看步骤。';}
function draw(){const svg=$('sheet');svg.replaceChildren();if(!current)return;
 const frame=current.player.snapshot();for(const step of current.steps)for(const action of step.actions){
 const fraction=frame.actionFractions[action.id]||0;if(fraction<=0)continue;
 if(!['line','circle','arc','point'].includes(action.kind))continue;
 const node=document.createElementNS(NS,action.kind==='line'?'line':action.kind==='arc'?'path':'circle');
 node.setAttribute('fill','none');node.setAttribute('stroke',action.id.startsWith('A-')?'#c28133':'#236eb5');node.setAttribute('stroke-width','2.5');
 Motion.updateSvg(node,action,fraction);node.setAttribute('data-action',action.id);
 node.addEventListener('click',()=>{$('picked').textContent='已选择 '+action.id+'；来源：'+(action.id.startsWith('A-')?'A':'B')+' 点的独立数学作图步骤。';});
 svg.append(node);
 }
 $('status').textContent='已确认第 '+revision+' 版；步骤 '+frame.completedIds.length+'/'+current.timeline.segments.length+(frame.done?'，绘制完成':'');
}
function tick(now){if(!playing||!current)return;current.player.snapshot(now);draw();if(current.player.snapshot().done){stop();return;}raf=requestAnimationFrame(tick);}
function solve(){clear();revision++;try{
 const points=['a','b'].map(id=>({id:id.toUpperCase(),...Object.fromEntries(['x','y','z'].map(k=>{const el=$(id+k);if(el.value.trim()===''||!Number.isFinite(el.valueAsNumber))throw Error('坐标不能为空或无效');return [k,el.valueAsNumber];}))}));
 current=compileConfirmedTwoPoint({confirmedBy:$('confirmed').checked?'user':null,revision,unit:'mm',points,sheetTransform:{origin:{x:360,y:210},scale:3}});
 draw();
 }catch(e){clear();$('status').textContent='拒绝作图：'+e.message;}}
$('solve').addEventListener('click',solve);
for(const id of ['ax','ay','az','bx','by','bz'])$(id).addEventListener('input',()=>{revision++;clear();$('status').textContent='条件已修改，请重新确认并计算。';$('confirmed').checked=false;});
$('previous').addEventListener('click',()=>{if(!current)return;const now=performance.now();current.player.pause(now);stop();const f=current.player.snapshot();const steps=current.timeline.steps;const i=steps.findIndex(s=>s.startMs>=f.elapsedMs-1);const target=i<0?steps.length-1:(Math.abs(steps[i].startMs-f.elapsedMs)<1?i-1:i-1);current.player.seekStep(Math.max(0,target),now);draw();});
$('next').addEventListener('click',()=>{if(!current)return;stop();const f=current.player.snapshot();const i=current.timeline.steps.findIndex(s=>s.startMs>f.elapsedMs);current.player.seekStep(i<0?current.timeline.steps.length:i,performance.now());draw();});
$('speed').addEventListener('change',()=>{if(current)current.player.setSpeed(Number($('speed').value),performance.now());});
$('play').addEventListener('click',()=>{if(!current)return;if(playing){stop();current.player.pause(performance.now());return;}current.player.play(performance.now());playing=true;raf=requestAnimationFrame(tick);});

$('confirmed').addEventListener('change',()=>{revision++;clear();$('status').textContent=$('confirmed').checked?'条件已确认，请点击确认并计算。':'已取消原题确认。';});
