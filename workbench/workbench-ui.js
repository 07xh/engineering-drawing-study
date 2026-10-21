/* Browser-only isolated synthetic workbench shell; no production or core imports. */
(function(){
  'use strict';
  const Core=window.DA07WorkbenchCore, fixtures=window.DA07SyntheticFixtures;
  const $=id=>document.getElementById(id);
  const SVG='http://www.w3.org/2000/svg';
  const byId=new Map((fixtures||[]).map(f=>[f.id,f]));
  let doc, state, interval=null, pointer=null;
  function element(tag,attributes={},text){
    const el=document.createElementNS(SVG,tag);
    for(const [key,value] of Object.entries(attributes))el.setAttribute(key,String(value));
    if(text!==undefined)el.textContent=String(text);
    return el;
  }
  const colors={given:'#27724f',auxiliary:'#c08636',result:'#257bb4',axis:'#82988a',mark:'#ad874b'};
  function makeShape(shape){
    const {geometry:g,kind,role}=shape,color=colors[role];
    let el;
    if(kind==='point')el=element('circle',{cx:g.x,cy:g.y,r:5,fill:color});
    else if(kind==='line')el=element('line',{x1:g.x1,y1:g.y1,x2:g.x2,y2:g.y2,stroke:color,'stroke-width':role==='axis'?1.5:2.8,'stroke-dasharray':role==='auxiliary'?'7 5':'none'});
    else el=element('circle',{cx:g.cx,cy:g.cy,r:g.r,fill:'none',stroke:color,'stroke-width':2.6,'stroke-dasharray':role==='auxiliary'?'7 5':'none'});
    el.setAttribute('data-entity-id',shape.id);
    return el;
  }
  function drawBoard(){
    const board=$('drawingBoard');board.replaceChildren();
    board.append(element('rect',{width:720,height:430,fill:'#fff'}));
    for(let x=30;x<=690;x+=30)board.append(element('line',{x1:x,y1:0,x2:x,y2:430,stroke:'#e8eeea','stroke-width':.75}));
    for(let y=10;y<=420;y+=30)board.append(element('line',{x1:0,y1:y,x2:720,y2:y,stroke:'#e8eeea','stroke-width':.75}));
    for(const shape of Core.displayed(doc,state)){
      board.append(makeShape(shape));
      if(shape.kind==='point'&&shape.label)board.append(element('text',{x:shape.geometry.x+9,y:shape.geometry.y-10,fill:colors[shape.role],'font-size':18},shape.label));
    }
    if(!state.stale&&state.mode==='draw'){
      for(const line of state.drawings)board.append(element('line',{...line,stroke:'#387fba','stroke-width':3,'data-student':'true'}));
    }
    board.append(element('rect',{x:10,y:392,width:365,height:27,rx:5,fill:'#f7ebdb',opacity:.94}));
    board.append(element('text',{x:17,y:411,fill:'#82562d','font-size':15,'font-weight':600},'SYNTHETIC · 纸面示意，不是标准答案'));
    board.classList.toggle('draw-active',state.mode==='draw'&&!state.stale&&state.statusProbe==='preview');
  }
  function currentStepText(){
    if(state.stale)return ['输入已修改','旧数据已失效。当前页没有接通求解器，请重新选择合成示例载入新状态。'];
    if(state.statusProbe!=='preview')return ['求解状态测试',Core.displayStatus(state)];
    if(state.mode==='draw')return ['自己作图','按下鼠标/触笔并拖动可画蓝色学生线。这里只测试交互与撤销，不按像素猜答案。'];
    if(state.mode==='hint'){
      const hints=doc.steps.flatMap(st=>st.hints);
      return state.hint===0?['逐步提示','先自己观察图纸。右侧“再给一点提示”不会把未来答案图元画出来。']:
        ['提示 '+state.hint+' / '+hints.length,hints[state.hint-1]];
    }
    if(state.stage===0)return ['第 0 帧｜已知条件','当前只显示 fixture 已知图元；不能据此判断任何标准答案。'];
    const step=doc.steps[state.stage-1];
    return [step.title,step.explanation];
  }
  function render(){
    drawBoard();const [title,desc]=currentStepText();
    $('stepTitle').textContent=title;$('stepExplanation').textContent=desc;
    $('paperNote').textContent=doc.note;
    const available=!state.stale&&state.statusProbe==='preview';
    const full=state.mode==='full', hint=state.mode==='hint',draw=state.mode==='draw';
    $('previous').disabled=!available||!full||state.stage===0;
    $('next').disabled=!available||!full||state.stage>=doc.steps.length;
    $('playPause').disabled=!available||!full||state.stage>=doc.steps.length||window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    $('playPause').textContent=state.playing?'暂停播放':'自动播放';
    $('stepCounter').textContent=full?state.stage+' / '+doc.steps.length:'—';
    $('nextHint').disabled=!available||!hint||state.hint>=doc.steps.reduce((n,s)=>n+s.hints.length,0);
    $('hintCounter').textContent=state.hint+' / '+doc.steps.reduce((n,s)=>n+s.hints.length,0);
    $('undoDraw').disabled=!draw||!state.drawings.length;
    $('redoDraw').disabled=!draw||!state.redo.length;
    $('drawCounter').textContent=state.drawings.length+' 条学生线';
    $('drawingHint').hidden=!draw;
    $('threePane').hidden=!state.threeVisible;
    $('toggleThree').setAttribute('aria-expanded',String(state.threeVisible));
    $('toggleThree').textContent=state.threeVisible?'关闭三维占位窗口':'打开可选三维窗口';
    document.querySelector('.playback-controls').hidden=!full;
    document.querySelector('.hint-controls').hidden=!hint;
    document.querySelector('.draw-controls').hidden=!draw;
    for(const button of document.querySelectorAll('[data-mode]'))button.setAttribute('aria-pressed',String(button.dataset.mode===state.mode));
    $('statusProbe').value=state.statusProbe;
    $('residual').textContent='未计算';$('degree').textContent='未计算';
    $('status').textContent=Core.displayStatus(state);
  }
  function stopTimer(){if(interval!==null){clearInterval(interval);interval=null}}
  function dispatch(action){
    if(action.type!=='PLAY')stopTimer();
    try{state=Core.transition(doc,state,action);render();}catch(error){$('status').textContent='工作台输入错误：'+error.message;return;}
    if(state.playing){
      stopTimer();interval=setInterval(()=>{
        if(!state.playing||state.mode!=='full'||state.stale||state.statusProbe!=='preview')return stopTimer();
        state=Core.transition(doc,state,{type:'NEXT'});render();if(!state.playing)stopTimer();
      },1200);
    }
  }
  function load(key){
    stopTimer();doc=byId.get(key);
    const valid=Core.validateFixture(doc);
    if(!valid.ok){$('status').textContent='拒绝加载非法 fixture：'+valid.errors.join('；');return;}
    state=Core.initialState(doc);pointer=null;$('fixtureSelect').value=key;render();
  }
  if(!Core||!fixtures||!Array.isArray(fixtures)||!fixtures.length){$('status').textContent='工作台文件缺失，未加载任何题目。';return;}
  for(const fixture of fixtures){const option=document.createElement('option');option.value=fixture.id;option.textContent=fixture.title;$('fixtureSelect').append(option);}
  $('fixtureSelect').addEventListener('change',()=>load($('fixtureSelect').value));
  for(const button of document.querySelectorAll('[data-mode]'))button.addEventListener('click',()=>dispatch({type:'MODE',value:button.dataset.mode}));
  $('previous').addEventListener('click',()=>dispatch({type:'PREV'}));$('next').addEventListener('click',()=>dispatch({type:'NEXT'}));
  $('playPause').addEventListener('click',()=>dispatch({type:state.playing?'PAUSE':'PLAY'}));
  $('reset').addEventListener('click',()=>dispatch({type:'RESET'}));
  $('nextHint').addEventListener('click',()=>dispatch({type:'HINT'}));
  $('undoDraw').addEventListener('click',()=>dispatch({type:'UNDO'}));$('redoDraw').addEventListener('click',()=>dispatch({type:'REDO'}));
  $('statusProbe').addEventListener('change',()=>dispatch({type:'STATUS_PROBE',value:$('statusProbe').value}));
  $('mutateInput').addEventListener('click',()=>dispatch({type:'INPUT_CHANGED'}));
  $('toggleThree').addEventListener('click',()=>dispatch({type:'THREE'}));
  function position(event){
    const rect=$('drawingBoard').getBoundingClientRect();
    if(!rect.width||!rect.height)return null;
    return {x:Math.max(0,Math.min(720,Math.round((event.clientX-rect.left)*720/rect.width))),
            y:Math.max(0,Math.min(430,Math.round((event.clientY-rect.top)*430/rect.height)))};
  }
  const board=$('drawingBoard');
  board.addEventListener('pointerdown',event=>{
    if(state.mode!=='draw'||state.stale||state.statusProbe!=='preview'||event.button>0)return;
    const p=position(event);if(!p)return;pointer={id:event.pointerId,...p};board.setPointerCapture?.(event.pointerId);
  });
  board.addEventListener('pointerup',event=>{
    if(!pointer||event.pointerId!==pointer.id)return;
    const start=pointer;pointer=null;const end=position(event);if(!end)return;
    if(Math.hypot(end.x-start.x,end.y-start.y)<4)return;
    dispatch({type:'DRAW',line:{x1:start.x,y1:start.y,x2:end.x,y2:end.y}});
  });
  board.addEventListener('pointercancel',()=>{pointer=null});
  document.addEventListener('keydown',event=>{
    if(event.altKey||event.ctrlKey||event.metaKey||event.target?.matches?.('button,select,input,textarea'))return;
    if(event.key==='ArrowLeft'){event.preventDefault();dispatch({type:'PREV'});}
    else if(event.key==='ArrowRight'){event.preventDefault();dispatch({type:'NEXT'});}
  });
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  reduced.addEventListener?.('change',()=>{if(reduced.matches)dispatch({type:'PAUSE'});else render();});
  load(fixtures[0].id);
})();
