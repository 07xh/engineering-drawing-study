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
   const target=links[candidate.tool];
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
