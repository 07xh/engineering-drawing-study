/* 2-6-1 的描图证据分步高亮；不修改原图、个人画线或审核通过的答案层。 */
(function(){'use strict';
const $=id=>document.getElementById(id),api=window.Exercise261Evidence,lib=window.VerifiedExerciseGeometry;
if(!api||!lib||!$('exercise261Panel'))return;
const layer=$('sourceEvidence'),ns='http://www.w3.org/2000/svg';
let step=0,report=null,original=null,selected='';
function resetLayer(){layer.replaceChildren()}
function render(){
 resetLayer();
 $('exercise261Panel').hidden=selected!=='2-6-1';
 if(selected!=='2-6-1')return;
 const ok=report&&report.safe;
 $('exercise261Status').textContent=report?report.reason:'资料结构核对不可用';
 $('exercise261Notice').textContent=report?report.notice:'';
 const stage=ok?report.stages[step]:null;
 $('exercise261Prev').disabled=!stage||step===0;
 $('exercise261Next').disabled=!stage||step>=report.stages.length-1;
 $('exercise261Reset').disabled=!stage;
 $('exercise261Count').textContent=stage?'证据 '+(step+1)+' / '+report.stages.length:'需要核对描图结构';
 $('exercise261Title').textContent=stage?stage.title:'无法安全显示逐帧证据';
 $('exercise261Why').textContent=stage?stage.why:'原始资料尚未完成校验；不会绘制任何猜测图形。';
 const facts=$('exercise261Facts'),missing=$('exercise261Missing');facts.replaceChildren();missing.replaceChildren();
 for(const fact of report?.facts||[]){
  const li=document.createElement('li');
  li.textContent=(fact.ok?'已通过数字化结构检查：':'待核对：')+fact.label+'。'+fact.detail;
  facts.append(li);
 }
 for(const issue of report?.missing||[]){
  const li=document.createElement('li');li.textContent=issue;missing.append(li);
 }
 if(!ok)return;
 for(const line of api.highlight(original,report,step)){
  // 绘制的每个坐标都直接取自现有已知线段，不产生新线段、新点或答案。
  const [x1,y1,x2,y2]=line.segment;
  const copy=document.createElementNS(ns,'line');
  for(const [name,value] of Object.entries({x1,y1,x2,y2,stroke:'#196fb4','stroke-width':5,'stroke-linecap':'round','data-existing-source-index':line.index,'pointer-events':'none'}))copy.setAttribute(name,String(value));
  layer.append(copy);
 }
}
function choose(id){
 selected=id;
 resetLayer();
 if(id!=='2-6-1'){$('exercise261Panel').hidden=true;return}
 original=lib.get(id);report=api.scan(original);step=0;render();
}
$('exercise261Prev').addEventListener('click',()=>{step=Math.max(0,step-1);render()});
$('exercise261Next').addEventListener('click',()=>{if(report)step=Math.min(report.stages.length-1,step+1);render()});
$('exercise261Reset').addEventListener('click',()=>{resetLayer();$('exercise261Why').textContent='证据高亮已隐藏。原图、已存笔迹与答案层均未改变。'});
$('question').addEventListener('change',()=>choose($('question').value));
choose($('question').value);
window.Exercise261EvidenceUI={choose,render};
})();