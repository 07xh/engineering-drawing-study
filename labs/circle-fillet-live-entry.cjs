'use strict';
const {circleCircleFilletCenters}=require('../engines/planar/circle-circle-fillet.cjs');
const {chooseDirectedFillet}=require('../engines/planar/directed-circle-fillet.cjs');
const {finiteTwoSegmentFillets}=require('../engines/planar/two-segment-fillet.cjs');
const {chooseFiniteTwoSegmentArc}=require('../engines/planar/directed-two-segment-fillet.cjs');
(function(){
 const SVG='http://www.w3.org/2000/svg',$=id=>document.getElementById(id);
 const FIELDS=['x1','y1','r1','mode1','x2','y2','r2','mode2','filletRadius',
  'branch','direction','travel1','travel2',
  'line1Ax','line1Ay','line1Bx','line1By','line2Ax','line2Ay','line2Bx','line2By',
  'lineSide1','lineSide2','lineTravel1','lineTravel2'];
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
 const drawLine=(a,b,color='#257650',dash='')=>{
  const start=sheet(a),end=sheet(b);
  return elem('line',{x1:start.x,y1:start.y,x2:end.x,y2:end.y,
   stroke:color,'stroke-width':2,'stroke-dasharray':dash||'none'});
 };
 const dot=(p,color,label)=>{
  const g=elem('g'),v=sheet(p);
  g.append(elem('circle',{cx:v.x,cy:v.y,r:4.5,fill:color}));
  g.append(elem('text',{x:v.x+7,y:v.y-8,'font-size':12,fill:color},label));
  return g;
 };
 function parse(){
  const n=id=>{
   const e=$(id);
   if(e.value.trim()===''||!Number.isFinite(e.valueAsNumber))
    throw Error('请填写有效有限数值：'+id);
   return e.valueAsNumber;
  };
  const branch=$('branch').value,direction=$('direction').value;
  if($('modeSelect').value==='segments'){
   const side=id=>$(id).value===''?{}:{value:Number($(id).value)};
   const args={
    first:{a:{x:n('line1Ax'),y:n('line1Ay')},b:{x:n('line1Bx'),y:n('line1By')}},
    second:{a:{x:n('line2Ax'),y:n('line2Ay')},b:{x:n('line2Bx'),y:n('line2By')}},
    filletRadius:n('filletRadius'),
    ...($('lineSide1').value===''?{}:{firstSide:Number($('lineSide1').value)}),
    ...($('lineSide2').value===''?{}:{secondSide:Number($('lineSide2').value)})
   };
   return {...args,...(branch?{branchId:branch}:{}),...(direction?{direction}:{}),
    ...($('lineTravel1').value?{firstTravel:$('lineTravel1').value}:{}),
    ...($('lineTravel2').value?{secondTravel:$('lineTravel2').value}:{})};
  }
  const args={first:{center:{x:n('x1'),y:n('y1')},radius:n('r1')},
   second:{center:{x:n('x2'),y:n('y2')},radius:n('r2')},
   filletRadius:n('filletRadius'),firstMode:$('mode1').value,secondMode:$('mode2').value};
  return {...args,...(branch?{branchId:branch}:{}),...(direction?{direction}:{}),
   ...($('travel1').value?{knownFirstTravel:$('travel1').value}:{}),
   ...($('travel2').value?{knownSecondTravel:$('travel2').value}:{})};
 }
 function refreshCandidates(result){
  const selector=$('branch'),previous=selector.value;
  selector.replaceChildren();
  const add=(value,label)=>{
   const option=document.createElement('option');
   option.value=value;option.textContent=label;selector.append(option);
  };
  add('','请选择有效候选圆心');
  for(const c of result.candidates??[])add(c.id,c.id+' ('+
   fmt(c.center.x)+', '+fmt(c.center.y)+')');
  selector.value=(result.candidates??[]).some(c=>c.id===previous)?previous:'';
 }
 function compute(){
  centers=null;chosen=null;input=null;stage=0;
  try{
   let args=parse();
   const isSegments=$('modeSelect').value==='segments';
   const result=isSegments?finiteTwoSegmentFillets(args):circleCircleFilletCenters(args);
   refreshCandidates(result);
   // A parameter change can invalidate the previously selected branch.
   // Re-parse after revalidating the actual candidate IDs so a stale branch
   // cannot be used as a fabricated final answer.
   args=parse();
   const picked=isSegments?chooseFiniteTwoSegmentArc(args):chooseDirectedFillet(args);
   centers=result;chosen=picked;input=args;
   const short=result.status==='multiple'?'存在 '+result.candidateCount+' 个有效候选圆心。':
    result.status==='unique'?'存在 1 个有效候选圆心。':
    result.status==='none'?'当前相切条件无解。':
    result.status==='unstable'?'当前条件数值不稳定，拒绝推测圆心。':
    '存在连续多解，不能自动选定连接圆心。';
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
  const isSegments=$('modeSelect').value==='segments';
  let max=0;
  if(input&&isSegments){
   svg.append(drawLine(input.first.a,input.first.b));
   svg.append(drawLine(input.second.a,input.second.b));
   svg.append(dot(input.first.a,'#257650','A₁'));
   svg.append(dot(input.first.b,'#257650','B₁'));
   svg.append(dot(input.second.a,'#257650','A₂'));
   svg.append(dot(input.second.b,'#257650','B₂'));
   if(stage>=1){
    const drawn=new Set();
    const loci=(centers?.candidates??[]).map(c=>c.steps)
      .concat((centers?.continuousFamilies??[]).map(f=>[
       {geometry:f.firstOffsetLine},{geometry:f.secondOffsetLine}]));
    for(const parts of loci){
     const first=parts[0]?.geometry,second=parts[1]?.geometry;
     for(const [i,line] of [[0,first],[1,second]]){
      if(stage<i+1||!line)continue;
      const key=JSON.stringify(line);
      if(drawn.has(key))continue;
      drawn.add(key);
      svg.append(drawLine(line.a,line.b,'#c38536','7 6'));
     }
    }
   }
   if(stage>=3){
    for(const c of centers?.candidates??[])svg.append(dot(c.center,'#9d6529',c.id));
    for(const f of centers?.continuousFamilies??[]){
     svg.append(drawLine(f.start.center,f.end.center,'#c38536','3 3'));
    }
   }
   if(stage>=4&&chosen?.contacts){
    svg.append(dot(chosen.contacts.first,'#2477b0','T₁'));
    svg.append(dot(chosen.contacts.second,'#2477b0','T₂'));
   }
   if(stage>=5&&chosen?.trimmedSourceSegments){
    for(const key of ['first','second']){
     const line=chosen.trimmedSourceSegments[key].segment;
     svg.append(drawLine(line.a,line.b,'#236eb5'));
    }
   }
   if(chosen?.status==='selected'&&chosen.geometry&&stage>=6)drawArc(svg,chosen.geometry);
   const exists=!!(centers?.candidates?.length||centers?.continuousFamilies?.length);
   max=exists?(chosen?.status==='selected'?6:3):0;
   $('stepTitle').textContent='第 '+stage+' 步';
   $('stepText').textContent=stage===0
    ?'先观察两条有限线段，切点必须位于各自的真实端点之间。'
    :chosen?.status==='selected'&&chosen.steps?.[stage-1]
     ?chosen.steps[stage-1].reason:
     ['','沿第一条直线作半径距离偏移线。','沿第二条直线作半径距离偏移线。',
      '观察所有有效圆心（或平行条件下的连续族），先选分支和走向才能继续。'][stage];
  }else{
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
   max=centers?4:0;
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
  $('prev').disabled=stage===0;
  $('next').disabled=stage>=max;
  $('counter').textContent=stage+' / '+max;
 }

 for(const id of FIELDS){
  const selectIds=['mode1','mode2','branch','direction','travel1','travel2',
   'lineSide1','lineSide2','lineTravel1','lineTravel2'];
  $(id).addEventListener(selectIds.includes(id)?'change':'input',compute);
 }
 $('modeSelect').addEventListener('change',()=>{
  $('branch').value='';
  const isSegments=$('modeSelect').value==='segments';
  for(const node of document.querySelectorAll('.circle-only'))node.hidden=isSegments;
  for(const node of document.querySelectorAll('.line-only'))node.hidden=!isSegments;
  compute();
 });
 $('calculate').addEventListener('click',compute);
 $('prev').addEventListener('click',()=>{stage=Math.max(0,stage-1);render()});
 $('next').addEventListener('click',()=>{
  const max=$('modeSelect').value==='segments'
   ?(chosen?.status==='selected'?6:
      (centers?.candidates?.length||centers?.continuousFamilies?.length?3:0))
   :(centers?4:0);
  stage=Math.min(max,stage+1);render();
 });
 $('reset').addEventListener('click',()=>{
  for(const [id,value] of Object.entries({x1:0,y1:0,r1:5,mode1:'external',
   x2:20,y2:0,r2:5,mode2:'external',filletRadius:10,branch:'',direction:'',
   travel1:'',travel2:'',line1Ax:-20,line1Ay:0,line1Bx:20,line1By:0,
   line2Ax:0,line2Ay:-20,line2Bx:0,line2By:20,
   lineSide1:'',lineSide2:'',lineTravel1:'',lineTravel2:''}))$(id).value=String(value);
  compute();
 });
 compute();
})();
