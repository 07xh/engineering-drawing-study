'use strict';
/* Real, user-editable single-point math. No textbook answers or external API. */
const {solveProjection}=require('../engines/projection/point-projection.cjs');
const {toSheet}=require('../core/projection/conventions.js');
(function(){
  const SVG='http://www.w3.org/2000/svg';
  const $=id=>document.getElementById(id);
  const planes={V:'正面 V',H:'水平 H',W:'侧面 W'};
  const demos={VH:[[15,12],[15,10]],VW:[[15,12],[10,12]],HW:[[15,10],[10,12]]};
  const inputs=['firstU','firstV','secondU','secondV'];
  const COLOR={known:'#23744b',computed:'#236eb5',guide:'#c28133',axis:'#8a9d90'};
  const BOARD={x:360,y:210};
  let solution=null,shownStep=0,revision=0;

  function el(tag,attributes={},value){
    const node=document.createElementNS(SVG,tag);
    for(const [key,data] of Object.entries(attributes))node.setAttribute(key,String(data));
    if(value!==undefined)node.textContent=String(value);
    return node;
  }
  function line(a,b,color,width=2,dash=''){
    return el('line',{x1:a.x,y1:a.y,x2:b.x,y2:b.y,stroke:color,'stroke-width':width,
      'stroke-dasharray':dash||'none','vector-effect':'non-scaling-stroke'});
  }
  function point(p,label,color){
    const group=el('g');
    group.append(el('circle',{cx:p.x,cy:p.y,r:5.3,fill:color}));
    group.append(el('text',{x:p.x+10,y:p.y-10,fill:color,'font-size':14,'font-weight':700},label));
    return group;
  }
  const format=n=>Number.isFinite(n)?Number(n.toFixed(6)).toString():'?';
  function projectInput(){
    const pair=$('pairSelect').value;
    const values=inputs.map(id=>{
      const input=$(id);
      if(input.value.trim()==='')throw Error('请填写全部四个投影坐标');
      const n=input.valueAsNumber;
      if(!Number.isFinite(n))throw Error('投影坐标必须是有效数值');
      return n;
    });
    const ratio=$('scaleInput').valueAsNumber;
    if(!Number.isFinite(ratio)||ratio<.1||ratio>20)throw Error('显示比例必须在 0.1 到 20 之间');
    return {knownViews:{[pair[0]]:values.slice(0,2),[pair[1]]:values.slice(2,4)},
      sheetTransform:{origin:BOARD,scale:ratio}};
  }
  function invalid(reason){
    solution=null;shownStep=0;$('solveStatus').textContent='输入尚未有效：'+reason;render();
  }
  function compute(){
    revision++;
    solution=null;shownStep=0; // erase old mathematically-derived state before reading input
    let given;
    try{given=projectInput();solution={...solveProjection(given),userInput:given,revision};
      const s=solution;
      $('solveStatus').textContent=s.status==='unique'
        ?'已求出空间点 P = ('+['x','y','z'].map(k=>format(s.point[k])).join(', ')+') mm；最大残差：'+format(s.maxResidual)+' mm。'
        :s.status==='none'?'给定投影矛盾，无解。未显示第三投影和推测辅助线。'
        :'投影条件不足，无法唯一确定空间点。';
    }catch(e){return invalid(e.message||'输入无效');}
    render();
  }
  function axes(svg){
    const x=BOARD.x,y=BOARD.y;
    svg.append(el('rect',{width:720,height:470,fill:'#fff'}));
    for(let xx=0;xx<=720;xx+=30)svg.append(line({x:xx,y:0},{x:xx,y:470},'#eef3ef',.6));
    for(let yy=0;yy<=470;yy+=30)svg.append(line({x:0,y:yy},{x:720,y:yy},'#eef3ef',.6));
    svg.append(line({x:0,y},{x:720,y},COLOR.axis,1.4));
    svg.append(line({x,y:0},{x,y:470},COLOR.axis,1.4));
    svg.append(line({x,y},{x:x+225,y:y+225},COLOR.axis,1.4,'5 6'));
    for(const [v,tx,ty] of [['V',x-305,25],['H',x-305,y+245],['W',x+275,25],['45°',x+205,y+225]]){
      svg.append(el('text',{x:tx,y:ty,'font-size':14,fill:'#63766a'},v));
    }
    svg.append(el('text',{x:x+7,y:y-8,'font-size':13,fill:'#63766a'},'O'));
  }
  function render(){
    const svg=$('paperSvg');svg.replaceChildren();axes(svg);
    const s=solution,pair=$('pairSelect').value;
    if(s){
      const {origin,scale}=s.userInput.sheetTransform;
      for(const name of s.knownViews){
        const uv=s.userInput.knownViews[name],xy=toSheet(name,{u:uv[0],v:uv[1]}, {origin,scale});
        svg.append(point(xy,'已知 '+name,COLOR.known));
      }
      if(s.status==='unique'){
        for(const guide of s.guides.slice(0,shownStep))svg.append(line(guide.from,guide.to,COLOR.guide,2.2,'7 5'));
        if(shownStep===s.steps.length){
          for(const name of ['V','H','W']){
            if(!s.knownViews.includes(name))svg.append(point(s.sheet[name],'求得 '+name,COLOR.computed));
          }
        }
      }
    }
    const active=!!s&&s.status==='unique';
    const max=active?s.steps.length:0;
    $('previous').disabled=!active||shownStep===0;
    $('next').disabled=!active||shownStep>=max;
    $('restart').disabled=!active||shownStep===0;
    $('stepCounter').textContent=shownStep+' / '+max;
    $('stepTitle').textContent=shownStep===0?'第 0 步｜观察已知条件':'第 '+shownStep+' 步｜辅助线';
    $('stepExplanation').textContent=shownStep===0
      ?'题目已知 '+pair.split('').map(x=>planes[x]).join(' 与 ')+'，先按输入位置显示两个已知投影；空间点尚不能靠页面位置猜测。'
      :s.steps[shownStep-1].explanation+
        (shownStep===max?' 交点与第三投影已用求解器验证，现在标出蓝色结果点。':'');
  }
  function resetPair(){
    const pair=$('pairSelect').value,values=demos[pair].flat();
    for(let i=0;i<inputs.length;i++)$(inputs[i]).value=String(values[i]);
    $('firstULabel').firstChild.textContent=planes[pair[0]]+' u（mm）';
    $('firstVLabel').firstChild.textContent=planes[pair[0]]+' v（mm）';
    $('secondULabel').firstChild.textContent=planes[pair[1]]+' u（mm）';
    $('secondVLabel').firstChild.textContent=planes[pair[1]]+' v（mm）';
    compute();
  }
  $('pairSelect').addEventListener('change',resetPair);
  for(const id of [...inputs,'scaleInput'])$(id).addEventListener('input',compute);
  $('recompute').addEventListener('click',compute);
  $('resetExample').addEventListener('click',()=>{$('pairSelect').value='VH';$('scaleInput').value='4';resetPair();});
  $('previous').addEventListener('click',()=>{if(solution?.status!=='unique')return;
    shownStep=Math.max(0,shownStep-1);render();});
  $('next').addEventListener('click',()=>{if(solution?.status!=='unique')return;
    shownStep=Math.min(solution.steps.length,shownStep+1);render();});
  $('restart').addEventListener('click',()=>{shownStep=0;render();});
  resetPair();
})();
