/* DraftFlow V11: AI candidate analysis, per-output preferences and secure optional API.
 * No token or personal question image is persisted; unavailable API => fail closed.
 */
(function(){
 'use strict';
 const form=document.getElementById('ai-solve-form');
 if(!form)return;
 const $=id=>document.getElementById(id);
 const image=$('ai-solve-image'),question=$('ai-solve-question'),run=$('ai-solve-run');
 const status=$('ai-solve-status'),result=$('ai-solve-result'),parts=$('ai-solve-sections');
 const detail=$('ai-solve-detail'),preset=$('ai-solve-preset'),note=$('ai-solve-image-note');
 const consent=$('ai-solve-consent'),token=$('ai-solve-access-token');
 const ids=['answer','approach','steps','twoD','threeD','animation','verification'];
 const boxes=Object.fromEntries(ids.map(key=>[key,form.querySelector('[data-ai-output="'+key+'"]')]));
 const sets={
  standard:['answer','approach','steps','twoD','threeD','animation'],
  answer:['answer'],
  teaching:['answer','approach','steps','twoD','threeD','animation','verification'],
  visual:['answer','twoD','threeD','animation']
 };
 const detailFor={standard:'standard',answer:'brief',teaching:'teaching',visual:'standard'};
 const links={
  planar:'labs/polygon-live.html',projection:'labs/point-projection-live.html',
  third_view:'labs/solid-third-view-live.html',composite:'labs/composite-geometry.html',
  section:'labs/cone-cut-live.html',intersection:'labs/finite-cylinder-intersection-live.html'
 };
 let enabled=false;
 function currentOutputs(){return Object.fromEntries(ids.map(key=>[key,boxes[key].checked]));}
 function storePrefs(){
  try{localStorage.setItem('draftflow-ai-output-v1',JSON.stringify({
   outputs:currentOutputs(),detail:detail.value,preset:preset.value
  }));}catch(_error){/* private storage may be disabled */ }
 }
 function applyPreset(name){
  if(!sets[name])return;
  for(const id of ids)boxes[id].checked=sets[name].includes(id);
  detail.value=detailFor[name];
  storePrefs();
 }
 try{
  const saved=JSON.parse(localStorage.getItem('draftflow-ai-output-v1')||'null');
  if(saved&&saved.outputs&&typeof saved.outputs==='object'){
   for(const id of ids)if(typeof saved.outputs[id]==='boolean')boxes[id].checked=saved.outputs[id];
   if(['brief','standard','teaching'].includes(saved.detail))detail.value=saved.detail;
   if([...Object.keys(sets),'custom'].includes(saved.preset))preset.value=saved.preset;
  }
 }catch(_error){/* no storage required */ }
 preset.addEventListener('change',()=>applyPreset(preset.value));
 for(const checkbox of Object.values(boxes))checkbox.addEventListener('change',()=>{
  preset.value='custom';storePrefs();
 });
 detail.addEventListener('change',()=>{preset.value='custom';storePrefs();});
 image.addEventListener('change',()=>{
  const file=image.files&&image.files[0];
  if(!file){note.textContent='题图尚未选择；可以仅输入题目文字。';return;}
  if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>3*1024*1024){
   image.value='';note.textContent='请选 PNG/JPG/WebP，原始文件不得超过 3MB。';return;
  }
  note.textContent='已在本机选中：'+file.name+'。只有勾选同意并点击解题后才会发送。';
 });
 function statusText(message){status.textContent=message;}
 function cleanText(x){return typeof x==='string'?x.slice(0,8000):'';}
 function section(label,value){
  if(value==null||value===''||(Array.isArray(value)&&!value.length))return;
  const h=document.createElement('h4');h.textContent=label;parts.append(h);
  if(Array.isArray(value)){
   const ol=document.createElement('ol');
   for(const entry of value.slice(0,30)){
    const li=document.createElement('li');li.textContent=cleanText(entry);ol.append(li);
   }
   parts.append(ol);
  }else{
   const p=document.createElement('p');p.textContent=cleanText(value);parts.append(p);
  }
 }

 function goodNumber(raw,{positive=false}={}){
  const v=String(raw).trim();
  if(!v||!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[Ee][+-]?\d+)?$/.test(v))return null;
  const n=Number(v);
  return Number.isFinite(n)&&Math.abs(n)<=100000&&(!positive||n>0)?n:null;
 }
 function checkedC1Rows(raw,pair){
  const ids=['V000','V001','V010','V011','V100','V101','V110','V111'];
  const lines=raw.trim().split(/\r?\n/);
  if(!['VH','VW','HW'].includes(pair)||lines.length!==8||raw.length>16000)return null;
  const shared={VH:[0,2],VW:[1,3],HW:[1,2]}[pair],seen=new Map();
  for(const line of lines){
   const columns=line.split(/[,，]/).map(x=>x.trim());
   if(columns.length!==5||!ids.includes(columns[0])||seen.has(columns[0]))return null;
   const v=columns.slice(1).map(x=>goodNumber(x));
   if(v.some(x=>x===null)||Math.abs(v[shared[0]]-v[shared[1]])>1e-8)return null;
   for(const a of seen.values())if(a.every((n,k)=>Math.abs(n-v[k])<=1e-8))return null;
   seen.set(columns[0],v);
  }
  if(ids.some(x=>!seen.has(x)))return null;
  return ids.map(id=>[id,...seen.get(id)].join(',')).join('\n');
 }
 function deliverToExistingTask(taskName,fields,feedback){
  const task=$('v7-task');
  if(!task){statusText('原有求解工作台尚未加载。');return;}
  if(task.value!==taskName){
   task.scrollIntoView?.({block:'center'});
   statusText('当前工作台不是此题型。为保护已有项目，请先手动切换题型并保存原项目，然后重试。');
   return;
  }
  if(!window.confirm('请确认已对照原题逐项核对条件。填写会撤销当前题型旧结果；不会替你确认几何条件或自动运行求解。是否继续？'))return;
  for(const [id,value] of fields){
   const field=$(id);
   if(!field){statusText('缺少原工作台输入：'+id);return;}
   if(field.disabled){
    statusText('目标工作台已有已确认对象、条件或只读字段。请先在工作台新建空项目，避免覆盖原几何。');
    return;
   }
   if(field.tagName==='SELECT'&&![...field.options].some(o=>o.value===String(value))){
    statusText('原求解器选项不支持：'+id);return;
   }
  }
  for(const [id,value] of fields){
   const field=$(id);
   field.value=String(value);
   field.dispatchEvent(new Event(field.tagName==='SELECT'?'change':'input',{bubbles:true}));
  }
  if(taskName==='c1-third-view')$('v8-c1-topology').checked=false;
  $('v7-input-section')?.scrollIntoView?.({block:'start'});
  statusText(feedback);
 }
 async function readImage(file){
  if(!file)return null;
  if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>3*1024*1024)
   throw new Error('题图类型或大小不符合要求（最大 3MB）');
  let img,release=()=>{};
  if(typeof createImageBitmap==='function'){
   img=await createImageBitmap(file);release=()=>img.close?.();
  }else{
   const url=URL.createObjectURL(file);release=()=>URL.revokeObjectURL(url);
   img=await new Promise((resolve,reject)=>{
    const el=new Image();el.onload=()=>resolve(el);el.onerror=()=>reject(new Error('图片解码失败'));el.src=url;
   }).catch(e=>{release();throw e;});
  }
  try{
   const w=img.width||img.naturalWidth,h=img.height||img.naturalHeight;
   if(!w||!h||w*h>50000000)throw new Error('题图分辨率不支持');
   const scale=Math.min(1,1440/Math.max(w,h));
   const canvas=document.createElement('canvas');
   canvas.width=Math.max(1,Math.floor(w*scale));canvas.height=Math.max(1,Math.floor(h*scale));
   const ctx=canvas.getContext('2d');if(!ctx)throw new Error('浏览器无法处理图片');
   ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);
   ctx.drawImage(img,0,0,canvas.width,canvas.height);
   const data=canvas.toDataURL('image/jpeg',.84);
   if(data.length>2800000)throw new Error('压缩后题图仍过大，请裁剪后重试');
   return data;
  }finally{release();}
 }
 async function checkService(){
  try{
   const controller=new AbortController();
   const timeout=setTimeout(()=>controller.abort(),8000);
   let response;
   try{response=await fetch('/api/ai/status',{cache:'no-store',credentials:'same-origin',signal:controller.signal});}
   finally{clearTimeout(timeout);}
   const data=response.ok?await response.json():null;
   enabled=!!(data&&data.enabled===true);
  }catch(_error){enabled=false;}
  run.disabled=!enabled;
  run.textContent=enabled?'开始 AI 解题':'AI 解题（待安全服务启用）';
  statusText(enabled?
   '个人 AI 服务已配置。请输入访问令牌并确认授权；输出仍属于待验证的 AI 候选。':
   'AI 服务暂未启用；题图不会上传。可保存输出选项，或使用下方已有的本地几何求解器。');
 }
 form.addEventListener('submit',async event=>{
  event.preventDefault();
  if(!enabled){statusText('AI 服务未接通，无法提交。');return;}
  if(!consent.checked){statusText('请先阅读并勾选题图发送授权。');return;}
  const file=image.files&&image.files[0];
  if(!file&&!question.value.trim()){statusText('请上传题图或填写题目。');return;}
  if(!ids.some(id=>boxes[id].checked)){statusText('请至少选一项生成内容。');return;}
  const access=token.value.trim();
  if(access.length<24){statusText('请输入有效的个人 AI 服务访问令牌。');return;}
  run.disabled=true;result.hidden=true;statusText('正在准备题图并请求 AI 候选分析…');
  const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),45000);
  try{
   const imageDataUrl=await readImage(file);
   const response=await fetch('/api/ai/solve',{
    method:'POST',credentials:'same-origin',
    headers:{'Content-Type':'application/json','Authorization':'Bearer '+access},
    body:JSON.stringify({question:question.value.trim(),imageDataUrl,outputs:currentOutputs(),detail:detail.value}),
    cache:'no-store',signal:controller.signal
   });
   const payload=await response.json().catch(()=>({error:'服务返回了无法解析的响应'}));
   if(!response.ok)throw new Error(cleanText(payload.error)||'AI 服务请求失败（HTTP '+response.status+'）');
   parts.replaceChildren();
   const out=currentOutputs(),candidate=payload.candidate||{};
   if(out.answer)section('候选答案（未验证）',candidate.answer);
   if(out.approach)section('解题思路',candidate.approach);
   if(out.steps)section('详细解题步骤',candidate.steps);
   if(out.verification)section('待核对条件和不确定性',candidate.uncertainties);
   const wantsDiagram=out.twoD||out.threeD||out.animation;
   $('ai-solve-diagram-note').textContent=wantsDiagram?
    '二维工程图、三维模型和 V5 动画尚未由本次 AI 推理生成或验证。请使用下方对应的专业几何工具；不可把 AI 文字当作标准图纸。':'';
   const pointPanel=$('ai-solve-point');
   pointPanel.hidden=true;
   const p=candidate.pointCandidate;
   if(p&&candidate.tool==='projection'&&p.unit==='mm'&&
     ['x','y','z'].every(k=>typeof p[k]==='number'&&Number.isFinite(p[k])&&Math.abs(p[k])<=100000)){
    pointPanel.hidden=false;
    $('ai-solve-point-info').textContent=
     'AI 提议点坐标（未核对）：x='+p.x+'，y='+p.y+'，z='+p.z+
     ' mm。提取依据：'+(cleanText(p.evidenceText)||'未提供')+'。请与原题逐项对照。';
    const fill=$('ai-solve-fill-point');
    fill.onclick=()=>{
     const task=$('v7-task');
     if(!task){statusText('现有几何工作台尚未初始化，请使用下方工具。');return;}
     if(task.value!=='projection'){
      task.scrollIntoView?.({block:'center'});
      statusText('当前项目并非单点三视图。请先手动切换为“单点三视图”，确保原项目得到安全保存，然后再次点击“填写候选点坐标”。');
      return;
     }
     if(!window.confirm('请已核对原题的 x/y/z 毫米数值。填写会撤销当前点投影旧结果；此操作不会确认条件或自动求解。是否继续？'))return;
     for(const k of ['x','y','z']){
      const field=$('v7-'+k);if(!field)return;
      field.value=String(p[k]);
      field.dispatchEvent(new Event('input',{bubbles:true}));
     }
     $('v7-input-section')?.scrollIntoView?.({block:'start'});
     statusText('已将 AI 候选坐标填入真实的单点投影工作台。现在请亲自核对并点击“确认条件 / 开始求解”，由原有数学引擎生成 2D/3D 与 V5。');
    };
   }

   // Structured proposals are editable locally; they never inherit AI verification.
   const filletPanel=$('ai-solve-fillet');filletPanel.hidden=true;
   const fillet=candidate.filletCandidate;
   if(candidate.tool==='planar'&&fillet&&fillet.unit==='mm'&&
      Array.isArray(fillet.first)&&Array.isArray(fillet.second)&&
      ['s++','s+-','s-+','s--'].includes(fillet.branchId)&&
      ['cw','ccw'].includes(fillet.direction)&&
      ['forward','reverse'].includes(fillet.firstTravel)&&
      ['forward','reverse'].includes(fillet.secondTravel)){
    const all=[...(fillet.first[0]||[]),...(fillet.first[1]||[]),
     ...(fillet.second[0]||[]),...(fillet.second[1]||[]),fillet.radius];
    if(all.length===9&&all.every(x=>typeof x==='number'&&Number.isFinite(x)&&Math.abs(x)<=100000)&&fillet.radius>0){
     const keys=['ax','ay','bx','by','cx','cy','dx','dy','radius'];
     keys.forEach((key,i)=>{$('ai-f-'+key).value=String(all[i]);});
     for(const [key,value] of [
      ['branch',fillet.branchId],['direction',fillet.direction],
      ['first',fillet.firstTravel],['second',fillet.secondTravel]])
       $('ai-f-'+key).value=value;
     $('ai-solve-fillet-info').textContent=
      'AI 提取来源：'+cleanText(fillet.evidenceText)+
      '。请自行核对坐标、半径、相切分支和方向（未认证）。';
     filletPanel.hidden=false;
     $('ai-solve-fill-fillet').onclick=()=>{
      const keys=['ax','ay','bx','by','cx','cy','dx','dy','radius'];
      const vals=keys.map(key=>goodNumber($('ai-f-'+key).value,{positive:key==='radius'}));
      if(vals.some(n=>n===null)){statusText('请填写有效毫米坐标与正半径，数值绝对值不能超过 100000。');return;}
      if(Math.hypot(vals[0]-vals[2],vals[1]-vals[3])<=1e-8||
         Math.hypot(vals[4]-vals[6],vals[5]-vals[7])<=1e-8){
       statusText('线段起点和终点不能重合。');return;
      }
      deliverToExistingTask('planar',[
       ...keys.map((key,i)=>['v7-f-'+key,vals[i]]),
       ...['branch','direction','first','second'].map(key=>['v7-f-'+key,$('ai-f-'+key).value])
      ],'已将经人工核对的平面作图候选填写到现有圆弧过渡子工具。接下来由原数学求解器计算；还需亲自确认分支、条件并运行。');
     };
    }
   }
   const thirdPanel=$('ai-solve-third-view');thirdPanel.hidden=true;
   const third=candidate.thirdViewCandidate;
   if(candidate.tool==='third_view'&&third&&third.unit==='mm'&&
      ['VH','VW','HW'].includes(third.pair)&&Array.isArray(third.rows)&&third.rows.length===8){
    const raw=third.rows.map(row=>{
     if(!row||!Array.isArray(row.coords))return '';
     return [row.id,...row.coords].join(',');
    }).join('\n');
    const checked=checkedC1Rows(raw,third.pair);
    if(checked){
     $('ai-c1-pair').value=third.pair;$('ai-c1-rows').value=checked;
     $('ai-solve-third-view-info').textContent=
      'AI 提取来源：'+cleanText(third.evidenceText)+
      '。原题八角点的对应关系和闭合凸体拓扑尚未核验。';
     thirdPanel.hidden=false;
     $('ai-solve-fill-third-view').onclick=()=>{
      const pair=$('ai-c1-pair').value;
      const validated=checkedC1Rows($('ai-c1-rows').value,pair);
      if(!validated){
       statusText('八角点输入存在重复 ID、无效坐标、公共轴不一致或重合点；请先核对全部 8 行。');
       return;
      }
      deliverToExistingTask('c1-third-view',[
       ['v8-c1-pair',pair],['v8-c1-vertices',validated]
      ],'候选两视图角点已填写到原有 C1 工作台。还必须按原题重新确认全部八个顶点、12 条棱与六个面的凸体拓扑，未确认不得作为正式第三视图。');
     };
    }
   }
   const boxPanel=$('ai-solve-two-box');boxPanel.hidden=true;
   const boxCandidate=candidate.twoBoxCandidate;
   const xyz=['x','y','z'];
   const letters=['a','b'];
   const boxFields=letters.flatMap(letter=>['0','1'].flatMap(bound=>
    xyz.map(axis=>({letter,bound,axis,id:'ai-c2-'+letter+'-'+axis+bound,
     target:'v8-c2-'+letter+'-'+axis+bound}))));
   function parseTwoBoxesFromEditor(){
    const boxes=[];
    for(const letter of letters){
     const min=xyz.map(axis=>goodNumber($('ai-c2-'+letter+'-'+axis+'0').value));
     const max=xyz.map(axis=>goodNumber($('ai-c2-'+letter+'-'+axis+'1').value));
     if(min.some(n=>n===null)||max.some(n=>n===null)||
      min.some((v,i)=>v>=max[i]))return null;
     boxes.push({min,max});
    }
    return boxes;
   }
   if(candidate.tool==='composite'&&boxCandidate?.unit==='mm'&&
     Array.isArray(boxCandidate.boxes)&&boxCandidate.boxes.length===2){
    const boxes=boxCandidate.boxes;
    const valid=boxes.every(box=>box&&
      ['min','max'].every(bound=>Array.isArray(box[bound])&&box[bound].length===3&&
       box[bound].every(n=>typeof n==='number'&&Number.isFinite(n)&&Math.abs(n)<=100000))&&
      box.min.every((n,i)=>n<box.max[i]));
    if(valid){
     boxFields.forEach(({letter,bound,axis,id})=>{
      const source=boxes[letter==='a'?0:1][bound==='0'?'min':'max'];
      $(id).value=String(source[xyz.indexOf(axis)]);
     });
     $('ai-solve-two-box-info').textContent=
      'AI 提取依据：'+cleanText(boxCandidate.evidenceText)+
      '。这是尚未核对的几何候选；如果只有宽高而缺少形体位置，请不要作为已知实体提交。';
     boxPanel.hidden=false;
     $('ai-solve-fill-two-box').onclick=()=>{
      const reviewed=parseTwoBoxesFromEditor();
      if(!reviewed){
       statusText('两个形体均须填写完整的毫米坐标，且每个轴向最大值必须大于最小值。');
       return;
      }
      const fields=boxFields.map(({letter,bound,axis,target})=>[
       target,reviewed[letter==='a'?0:1][bound==='0'?'min':'max'][xyz.indexOf(axis)]
      ]);
      deliverToExistingTask('composition',fields,
       '两个已核对的长方体候选已填入原 C2 工作台。请再次核对接触关系、勾选原有确认并手动点击计算；正式线型与 V5 仍未签收。');
     };
    }
   }
   const target=candidate.tool==='planar'&&!filletPanel.hidden? 'labs/auto-fillet-live.html':links[candidate.tool];
   const tool=$('ai-solve-tool');tool.replaceChildren();
   if(target){
    const a=document.createElement('a');a.href=target;a.textContent='打开对应的已存在专业几何工具 →';
    tool.append(a);
   }
   result.hidden=false;
   statusText('已返回 AI 候选分析；正式工程图和数学签收需另行验证。');
  }catch(error){
   statusText(error.name==='AbortError'?'请求超时，已中止。':cleanText(error.message)||'请求失败');
  }finally{clearTimeout(timeout);run.disabled=!enabled;}
 });
 checkService();
})();
