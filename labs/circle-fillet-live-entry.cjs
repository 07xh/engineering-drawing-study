'use strict';
const {circleCircleFilletCenters}=require('../engines/planar/circle-circle-fillet.cjs');
const {chooseDirectedFillet}=require('../engines/planar/directed-circle-fillet.cjs');
(function(){
 const SVG='http://www.w3.org/2000/svg',$=id=>document.getElementById(id);
 const FIELDS=['x1','y1','r1','mode1','x2','y2','r2','mode2','filletRadius','branch','direction','travel1','travel2'];
 const O={x:360,y:220},scale=8;let centers=null,chosen=null,input=null,stage=0;
 const fmt=n=>Number.isFinite(n)?Number(n.toFixed(6)).toString():'?';
 const elem=(tag,attr={},value)=>{
  const e=document.createElementNS(SVG,tag);
  for(const [k,v] of Object.entries(attr))e.setAttribute(k,String(v));
  if(value!==undefined)e.textContent=String(value);
  return e;
 };
 const sheet=p=>({x:O.x+scale*p.x,y:O.y-scale*p.y});
 const ring=(center,radius,color,dash='')=>elem('circle',{cx:sheet(center).x,cy:sheet(center).y,r:scale*radius,
   fill:'none',stroke:color,'stroke-width':2,'stroke-dasharray':dash||'none'});
 const dot=(p,color,label)=>{
  const g=elem('g'),v=sheet(p);
  g.append(elem('circle',{cx:v.x,cy:v.y,r:4.5,fill:color}));
  g.append(elem('text',{x:v.x+7,y:v.y-8,'font-size':12,fill:color},label));
  return g;
 };
 function parse(){
  const n=id=>{const e=$(id);if(e.value.trim()===''||!Number.isFinite(e.valueAsNumber))
    throw Error('请填写有效有限数值：'+id);return e.valueAsNumber};
  const args={first:{center:{x:n('x1'),y:n('y1')},radius:n('r1')},
   second:{center:{x:n('x2'),y:n('y2')},radius:n('r2')},
   filletRadius:n('filletRadius'),firstMode:$('mode1').value,secondMode:$('mode2').value};
  const branch=$('branch').value,direction=$('direction').value;
  return {...args,...(branch?{branchId:branch}:{}),...(direction?{direction}:{}),
   ...($('travel1').value?{knownFirstTravel:$('travel1').value}:{}),
   ...($('travel2').value?{knownSecondTravel:$('travel2').value}:{})};
 }
 function compute(){
  centers=null;chosen=null;input=null;stage=0;
  try{
   const args=parse();
   const result=circleCircleFilletCenters(args);
   const picked=chooseDirectedFillet(args);
   centers=result;chosen=picked;input=args;
   const short=result.status==='multiple'?'存在 '+result.candidateCount+' 个候选圆心。':
    result.status==='unique'?'存在 1 个候选圆心。':
    result.status==='none'?'当前相切条件无解。':'两辅助圆心轨迹退化重合，不能推断唯一圆心。';
   $('status').textContent=short+' '+(
    picked.status==='selected'
     ?'已选 '+picked.selectedId+'，连接弧扫掠 '+fmt(picked.sweepDegrees)+'°。'+
      (picked.g1Verified?'两端有向 G1 已经通过向量检验。':'尚未提供完整轮廓走向，仅验证无向相切。')
     :picked.reason||'尚未给出有限弧段。');
  }catch(e){$('status').textContent='条件无效：'+(e.message||'请重新填写');}
  render();
 }
 function drawArc(svg,g){
  const a=g.data, start=a.startAngle*Math.PI/180,end=a.endAngle*Math.PI/180;
  const startPoint=sheet({x:a.center.x+a.radius*Math.cos(start),y:a.center.y+a.radius*Math.sin(start)});
  const endPoint=sheet({x:a.center.x+a.radius*Math.cos(end),y:a.center.y+a.radius*Math.sin(end)});
  const large=Math.abs(a.endAngle-a.startAngle)>180?1:0,sweep=a.direction==='cw'?1:0;
  const d='M '+startPoint.x+' '+startPoint.y+' A '+a.radius*scale+' '+a.radius*scale+
   ' 0 '+large+' '+sweep+' '+endPoint.x+' '+endPoint.y;
  svg.append(elem('path',{d,stroke:'#246da5','stroke-width':3.5,fill:'none'}));
 }
 function render(){
  const svg=$('diagram');svg.replaceChildren();
  svg.append(elem('rect',{width:720,height:440,fill:'#fff'}));
  for(let x=30;x<720;x+=30)svg.append(elem('line',{x1:x,y1:0,x2:x,y2:440,stroke:'#edf1ed','stroke-width':.65}));
  for(let y=10;y<440;y+=30)svg.append(elem('line',{x1:0,y1:y,x2:720,y2:y,stroke:'#edf1ed','stroke-width':.65}));
  svg.append(elem('line',{x1:0,y1:O.y,x2:720,y2:O.y,stroke:'#93a49a','stroke-width':1}));
  svg.append(elem('line',{x1:O.x,y1:0,x2:O.x,y2:440,stroke:'#93a49a','stroke-width':1}));
  if(input){
   svg.append(ring(input.first.center,input.first.radius,'#257650'));
   svg.append(ring(input.second.center,input.second.radius,'#257650'));
   svg.append(dot(input.first.center,'#257650','O₁'));
   svg.append(dot(input.second.center,'#257650','O₂'));
   if(centers?.auxiliary&&stage>=1){
    svg.append(ring(centers.auxiliary.firstLocus.center,centers.auxiliary.firstLocus.radius,'#c38536','7 6'));
    svg.append(ring(centers.auxiliary.secondLocus.center,centers.auxiliary.secondLocus.radius,'#c38536','7 6'));
   }
   if(centers?.candidates&&stage>=2)for(const c of centers.candidates)
    svg.append(dot(c.center,'#9d6529',c.id));
   if(chosen?.contacts&&stage>=3){
    svg.append(dot(chosen.contacts.first,'#2477b0','T₁'));
    svg.append(dot(chosen.contacts.second,'#2477b0','T₂'));
   }
   if(chosen?.status==='selected'&&chosen.geometry&&stage>=4)drawArc(svg,chosen.geometry);
  }
  $('prev').disabled=stage===0;$('next').disabled=!centers||stage>=4;
  $('counter').textContent=stage+' / 4';
  const copy=[
   '仅显示已知圆心与半径，不把猜测的连接圆弧当成标准解。',
   '根据内切／外切和连接半径画出两个辅助圆心轨迹。',
   '两条圆心轨迹的交点是候选连接圆心。存在多个就保留所有候选。',
   '选择圆心后，沿圆心连线计算两处接触点。没有选择就不编造切点。',
   '在明确圆心分支和 cw/ccw 方向后画出有限圆弧；如已知原轮廓方向冲突，则不显示未通过 G1 的结果。'
  ];
  $('stepTitle').textContent='第 '+stage+' 步';
  $('stepText').textContent=copy[stage];
 }
 for(const id of FIELDS){
  $(id).addEventListener(id.includes('mode')||['branch','direction','travel1','travel2'].includes(id)?'change':'input',compute);
 }
 $('calculate').addEventListener('click',compute);
 $('prev').addEventListener('click',()=>{stage=Math.max(0,stage-1);render()});
 $('next').addEventListener('click',()=>{if(centers)stage=Math.min(4,stage+1);render()});
 $('reset').addEventListener('click',()=>{
  for(const [id,value] of Object.entries({x1:0,y1:0,r1:5,mode1:'external',
   x2:20,y2:0,r2:5,mode2:'external',filletRadius:10,branch:'',direction:'',travel1:'',travel2:''}))$(id).value=String(value);
  compute();
 });
 compute();
})();
