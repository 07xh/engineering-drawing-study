'use strict';
/* Real, user-editable single-point math. No textbook answers or external API. */
const {solveProjection}=require('../engines/projection/point-projection.cjs');
const {toSheet}=require('../core/projection/conventions.js');
const {gradeProjectionDrawing}=require('../workbench/verified-projection-drawing.cjs');
const TimelineV5=require('../workbench/teaching-timeline-v5.js');
const MotionV5=require('../workbench/teaching-motion-v5.js');
(function(){
  const SVG='http://www.w3.org/2000/svg';
  const $=id=>document.getElementById(id);
  const planes={V:'正面 V',H:'水平 H',W:'侧面 W'};
  const demos={VH:[[15,12],[15,10]],VW:[[15,12],[10,12]],HW:[[15,10],[10,12]]};
  const inputs=['firstU','firstV','secondU','secondV'];
  const COLOR={known:'#23744b',computed:'#236eb5',guide:'#c28133',axis:'#8a9d90'};
  const BOARD={x:360,y:210};
  let solution=null,shownStep=0,revision=0;
  let learningMode='full',hintStep=0,studentStrokes=[],redoStrokes=[];
  let pointer=null,playTimer=null,stageClock=null;
  const liveGuideNodes=new Map();
  const reducedMotion=()=>typeof window!=='undefined'&&
    !!window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  function pausePlayback(){
    if(playTimer!==null){cancelAnimationFrame(playTimer);playTimer=null;}
    if(stageClock)stageClock.pause(performance.now());
  }
  function stopPlayback(){
    if(playTimer!==null){cancelAnimationFrame(playTimer);playTimer=null;}
    stageClock=null;
  }
  function paintCurrentGuide(){
    if(!stageClock||!solution||learningMode!=='full')return;
    const frame=stageClock.snapshot();
    if(!frame.activeActionId)return;
    const i=frame.completedIds.length,step=solution.steps[i],node=liveGuideNodes.get(i);
    if(node&&step)MotionV5.updateSvg(node,
      {kind:'line',geometry:{from:step.from,to:step.to}},
      frame.actionFractions[frame.activeActionId]);
  }

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
    const ratio=$('scaleInput').valueAsNumber;
    if(!Number.isFinite(ratio)||ratio<.1||ratio>20)throw Error('显示比例必须在 0.1 到 20 之间');
    const sheetTransform={origin:BOARD,scale:ratio};
    if(pair==='XYZ'){
      const xyz=['spaceX','spaceY','spaceZ'].map(id=>{
        const input=$(id);
        if(input.value.trim()===''||!Number.isFinite(input.valueAsNumber))
          throw Error('空间点 x、y、z 必须都是有效的数学坐标');
        return input.valueAsNumber;
      });
      return {knownPoint:{x:xyz[0],y:xyz[1],z:xyz[2]},sheetTransform};
    }
    const values=inputs.map(id=>{
      const input=$(id);
      if(input.value.trim()==='')throw Error('请填写全部四个投影坐标');
      const n=input.valueAsNumber;
      if(!Number.isFinite(n))throw Error('投影坐标必须是有效数值');
      return n;
    });
    return {knownViews:{[pair[0]]:values.slice(0,2),[pair[1]]:values.slice(2,4)},
      sheetTransform};
  }
  function invalid(reason){
    stopPlayback();solution=null;shownStep=0;hintStep=0;studentStrokes=[];redoStrokes=[];pointer=null;$('solveStatus').textContent='输入尚未有效：'+reason;render();
  }
  function compute(){
    revision++;
    stopPlayback();studentStrokes=[];redoStrokes=[];hintStep=0;pointer=null;
    solution=null;shownStep=0; // erase old mathematically-derived state before reading input
    let given;
    try{given=projectInput();solution={...solveProjection(given),userInput:given,revision};
      const s=solution;
      $('solveStatus').textContent=s.status==='unique'
        ?(s.knownPoint?'已按空间点坐标计算 P = (':'已从两面投影求出 P = (')+
         ['x','y','z'].map(k=>format(s.point[k])).join(', ')+') mm；最大残差：'+format(s.maxResidual)+' mm。'
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
    const svg=$('paperSvg');svg.replaceChildren();liveGuideNodes.clear();axes(svg);
    const s=solution,pair=$('pairSelect').value;
    if(s){
      const {origin,scale}=s.userInput.sheetTransform;
      for(const name of s.knownViews){
        const uv=s.userInput.knownViews[name],xy=toSheet(name,{u:uv[0],v:uv[1]}, {origin,scale});
        svg.append(point(xy,'已知 '+name,COLOR.known));
      }
      if(s.status==='unique'&&learningMode==='full'){
        if($('showGuides').checked){
          for(const [i,guide] of s.guides.slice(0,shownStep).entries()){
            const stroke=line(guide.from,guide.to,COLOR.guide,2.2,'7 5');
            liveGuideNodes.set(i,stroke);
            svg.append(stroke);
          }
        }
        if(shownStep===s.steps.length){
         if(!stageClock||stageClock.snapshot().completedIds.length>=s.steps.length){
          for(const name of ['V','H','W']){
            if(s.knownPoint||!s.knownViews.includes(name))
              svg.append(point(s.sheet[name],s.knownPoint?'由空间点投影 '+name:'求得 '+name,COLOR.computed));
          }
         }
        }
      }
      if(s.status==='unique'&&learningMode==='draw'){
        for(const stroke of studentStrokes)svg.append(line(stroke.from,stroke.to,'#8651a8',3.3));
      }
    }
    svg.classList.toggle('draw-active',learningMode==='draw'&&!!s&&s.status==='unique');
    const active=!!s&&s.status==='unique'&&s.globallyUnique===true&&s.degrees===0;
    const full=learningMode==='full',hint=learningMode==='hint',drawing=learningMode==='draw';
    $('fullControls').hidden=!full;
    $('hintControls').hidden=!hint;
    $('drawControls').hidden=!drawing;
    const max=active?s.steps.length:0;
    $('previous').disabled=!active||!full||shownStep===0;
    $('next').disabled=!active||!full||shownStep>=max;
    $('restart').disabled=!active||!full||shownStep===0;
    $('playPause').disabled=!active||!full||reducedMotion()||
      (shownStep>=max&&(!stageClock||stageClock.snapshot().done));
    $('playPause').textContent=playTimer===null?'自动播放':'暂停播放';
    $('hintReveal').disabled=!active||!hint||hintStep>=max;
    $('hintCounter').textContent=hintStep+' / '+max;
    $('undoDraw').disabled=!drawing||!studentStrokes.length;
    $('redoDraw').disabled=!drawing||!redoStrokes.length;
    $('clearDraw').disabled=!drawing||!studentStrokes.length;
    $('checkDraw').disabled=!drawing||!active;
    $('stepCounter').textContent=shownStep+' / '+max;
    $('stepTitle').textContent=drawing?'自己作图｜数学检查':
      hint?'逐步提示｜'+hintStep+' / '+max:
      shownStep===0?'第 0 步｜观察已知条件':'第 '+shownStep+' 步｜辅助线';
    $('stepExplanation').textContent=shownStep===0
      ?(pair==='XYZ'
        ?'题目已知空间点 P(x,y,z)，由实际坐标求解三面投影；逐步显示对应线与 45° 深度转移。'
        :'题目已知 '+pair.split('').map(x=>planes[x]).join(' 与 ')+'，先按输入位置显示两个已知投影；空间点尚不能靠页面位置猜测。')
      :s.steps[shownStep-1].explanation+
        (shownStep===max?' 交点与第三投影已用求解器验证，现在标出蓝色结果点。':'');
    if(hint){
      $('stepExplanation').textContent=!active?'条件不足，不能生成标准提示':
        hintStep===0?'先观察已知投影与坐标轴，试着判断应使用哪些投影联系线。':
          s.steps[hintStep-1].explanation;
    }
    if(drawing){
      $('stepExplanation').textContent='请在画纸上完成投影联系线；判题只检查真实数学辅助线，不提前显示答案。';
      if(!active){$('drawStatus').textContent='当前没有经数学验证的唯一解，不能判题。';}
      else{
        try{
          const grade=gradeProjectionDrawing(s.steps,studentStrokes,{
            scale:s.userInput.sheetTransform.scale,revision:s.revision
          });
          $('drawStatus').textContent='已验证 '+grade.matchedCount+' / '+grade.targetCount+
            ' 条辅助线；额外线条 '+grade.extraCount+'。'+
            (grade.status==='correct'?'全部通过模型毫米单位的几何验证！':
              '请检查尚未符合方向或线段覆盖要求的辅助线。');
        }catch(error){$('drawStatus').textContent='无法数学判题：'+error.message;}
      }
    }
    paintCurrentGuide();
  }
  function resetPair(){
    const pair=$('pairSelect').value;
    $('spaceInputs').classList.toggle('hidden',pair!=='XYZ');
    $('projectionInputs').classList.toggle('hidden',pair==='XYZ');
    if(pair==='XYZ'){
      for(const [id,value] of [['spaceX',15],['spaceY',10],['spaceZ',12]])
        $(id).value=String(value);
    }else{
      const values=demos[pair].flat();
      for(let i=0;i<inputs.length;i++)$(inputs[i]).value=String(values[i]);
      $('firstULabel').firstChild.textContent=planes[pair[0]]+' u（mm）';
      $('firstVLabel').firstChild.textContent=planes[pair[0]]+' v（mm）';
      $('secondULabel').firstChild.textContent=planes[pair[1]]+' u（mm）';
      $('secondVLabel').firstChild.textContent=planes[pair[1]]+' v（mm）';
    }
    compute();
  }
  $('pairSelect').addEventListener('change',resetPair);
  for(const id of [...inputs,'spaceX','spaceY','spaceZ','scaleInput'])
    $(id).addEventListener('input',compute);
  $('showGuides').addEventListener('change',render);
  $('recompute').addEventListener('click',compute);
  $('resetExample').addEventListener('click',()=>{$('pairSelect').value='VH';$('scaleInput').value='4';resetPair();});
  $('previous').addEventListener('click',()=>{stopPlayback();if(solution?.status!=='unique')return;
    shownStep=Math.max(0,shownStep-1);render();});
  $('next').addEventListener('click',()=>{stopPlayback();if(solution?.status!=='unique')return;
    shownStep=Math.min(solution.steps.length,shownStep+1);render();});
  $('restart').addEventListener('click',()=>{stopPlayback();shownStep=0;render();});
  $('learningMode').addEventListener('change',()=>{
    stopPlayback();learningMode=$('learningMode').value;
    if(!['full','hint','draw'].includes(learningMode))learningMode='full';
    shownStep=0;hintStep=0;pointer=null;render();
  });
  $('hintReveal').addEventListener('click',()=>{
    if(learningMode!=='hint'||solution?.status!=='unique')return;
    hintStep=Math.min(solution.steps.length,hintStep+1);render();
  });
  $('playPause').addEventListener('click',()=>{
    if(playTimer!==null){pausePlayback();render();return;}
    if(learningMode!=='full'||solution?.status!=='unique'||reducedMotion())return;
    const max=solution.steps.length,clock=()=>performance.now();
    if(shownStep>=max&&(!stageClock||stageClock.snapshot().done))return;
    if(!stageClock){
      const timeline=TimelineV5.compileTimeline(Array.from({length:max},(_,i)=>({
        id:'projection-'+(i+1),actions:[{id:'guide-'+(i+1),kind:'line',durationMs:1200}]
      })),{gapMs:0});
      stageClock=TimelineV5.createPlayer(timeline,{
        speed:Number($('animationSpeed').value),revision});
      stageClock.seekStep(shownStep,clock());
    }
    stageClock.play(clock());
    const tick=()=>{
      if(!stageClock||learningMode!=='full'||solution?.status!=='unique'||reducedMotion()){
        stopPlayback();render();return;
      }
      const status=stageClock.snapshot(clock());
      const active=status.activeActionId!==null;
      const visible=Math.min(max,status.completedIds.length+(active?1:0));
      if(visible!==shownStep){shownStep=visible;render();}
      paintCurrentGuide();
      if(status.done){stopPlayback();shownStep=max;render();return;}
      playTimer=requestAnimationFrame(tick);
    };
    playTimer=requestAnimationFrame(tick);
    render();
  });
  $('animationSpeed').addEventListener('change',()=>{
    const speed=Number($('animationSpeed').value);
    TimelineV5.validateSpeed(speed);
    if(stageClock)stageClock.setSpeed(speed,performance.now());
  });
  $('undoDraw').addEventListener('click',()=>{
    if(learningMode!=='draw'||!studentStrokes.length)return;
    redoStrokes.push(studentStrokes.pop());render();
  });
  $('redoDraw').addEventListener('click',()=>{
    if(learningMode!=='draw'||!redoStrokes.length)return;
    studentStrokes.push(redoStrokes.pop());render();
  });
  $('clearDraw').addEventListener('click',()=>{
    if(learningMode!=='draw')return;
    studentStrokes=[];redoStrokes=[];pointer=null;render();
  });
  $('checkDraw').addEventListener('click',()=>{
    if(learningMode==='draw')render();
  });
  const svg=$('paperSvg');
  function canvasPosition(event){
    const rect=svg.getBoundingClientRect();
    if(!rect?.width||!rect?.height||!Number.isFinite(event.clientX)||
       !Number.isFinite(event.clientY))return null;
    // SVG viewBox 720×470; map touch/pen positions through the current view.
    return {x:Math.max(0,Math.min(720,(event.clientX-rect.left)*720/rect.width)),
            y:Math.max(0,Math.min(470,(event.clientY-rect.top)*470/rect.height))};
  }
  svg.addEventListener('pointerdown',event=>{
    if(learningMode!=='draw'||solution?.status!=='unique'||event.button>0)return;
    const from=canvasPosition(event);
    if(!from)return;
    pointer={id:event.pointerId,from,revision:solution.revision};
    svg.setPointerCapture?.(event.pointerId);
  });
  svg.addEventListener('pointerup',event=>{
    if(!pointer||pointer.id!==event.pointerId)return;
    const old=pointer;pointer=null;
    const to=canvasPosition(event);
    if(!to||learningMode!=='draw'||solution?.status!=='unique'||
       old.revision!==solution.revision)return;
    if(Math.hypot(to.x-old.from.x,to.y-old.from.y)<3)return;
    studentStrokes.push({from:old.from,to,revision:solution.revision});
    if(studentStrokes.length>200)studentStrokes.shift();
    redoStrokes=[];render();
  });
  svg.addEventListener('pointercancel',()=>{pointer=null});
  resetPair();
})();
