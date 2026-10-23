'use strict';
/* Production homepage V7 controller. All personal records and images remain on-device.
 * Reuses project-coordinator, IndexedDB store, canonical 03 solver, shared
 * geometry scene and ONE official V5 player, never an alternate animation.
 */
const {newProject,createCoordinator}=require('./project-coordinator.cjs');
const {openLocalProjects,ensureImage}=require('./local-project-store.cjs');
const {createUnifiedProjectSession,SHEET}=require('./unified-workbench-session.cjs');
const {toSheet}=require('../core/projection/conventions.js');
const Motion=require('../workbench/teaching-motion-v5.js');
(function(){
 const $=id=>document.getElementById(id),root=$('project-workbench');
 if(!root)return;
 const NS='http://www.w3.org/2000/svg',POINT='Point1';
 const xyzIds=['v7-x','v7-y','v7-z'];
 let store=null,coordinator=null,session=null,unsub=null;
 let saving=Promise.resolve(),imageURL=null,imageEpoch=0,raf=null;
 let sessionStatus='尚未创建项目',projectList=[];
 const gid=prefix=>{
   const b=new Uint8Array(12);crypto.getRandomValues(b);
   return prefix+Array.from(b,n=>n.toString(16).padStart(2,'0')).join('');
 };
 const msg=(v,bad=false)=>{
   sessionStatus=v;$('v7-save').textContent=v;
   $('v7-save').dataset.error=bad?'true':'false';
 };
 const call=async fn=>{try{await fn();}catch(e){msg('操作未完成：'+(e?.message||String(e)),true);}};
 const shape=(tag,attrs={},text)=>{
  const el=document.createElementNS(NS,tag);
  for(const [k,v]of Object.entries(attrs))el.setAttribute(k,String(v));
  if(text!==undefined)el.textContent=String(text);
  return el;
 };
 function line(svg,x1,y1,x2,y2,color='#93a7c5',dash=''){
  const node=shape('line',{x1,y1,x2,y2,stroke:color,'stroke-width':1.5,
    'stroke-dasharray':dash||'none','vector-effect':'non-scaling-stroke'});
  svg.append(node);return node;
 }
 function text(svg,x,y,value,color='#4b6285'){
  svg.append(shape('text',{x,y,fill:color,'font-size':13},value));
 }
 function stopAnimation(){
  if(raf!==null)cancelAnimationFrame(raf);raf=null;
  const clock=session?.readSnapshot()?.clock;
  if(clock?.snapshot().playing)clock.pause(performance.now());
 }
 function closePhoto(){
  imageEpoch++;if(imageURL)URL.revokeObjectURL(imageURL);
  imageURL=null;$('v7-photo').hidden=true;
  $('v7-photo').removeAttribute('src');
 }
 async function showPhoto(){
  closePhoto();
  const project=coordinator?.snapshot();
  if(!project)return;
  const id=project.source.imageId,epoch=imageEpoch;
  if(!id){$('v7-image-status').textContent='无原图，可使用人工输入。';return;}
  if(!store){$('v7-image-status').textContent='当前仅临时使用，无法恢复图片。';return;}
  try{
   const blob=await store.readImage(id);
   if(epoch!==imageEpoch)return;
   if(!blob)throw new Error('原图丢失，请重新选择图片');
   imageURL=URL.createObjectURL(blob);
   $('v7-photo').src=imageURL;
   $('v7-photo').hidden=false;
   $('v7-image-status').textContent='原图保存在本机 · '+Math.ceil(blob.size/1024)+' KiB；所有标注必须人工确认。';
  }catch(e){if(epoch===imageEpoch)msg(e.message,true);}
 }
 function queueSave(){
  if(!store||!coordinator)return;
  const model=coordinator;
  saving=saving.catch(()=>{}).then(async()=>{
   if(model!==coordinator)return;
   const snapshot=model.snapshot();
   await store.saveProject(snapshot);
   if(model===coordinator&&model.snapshot().revision===snapshot.revision)
    msg('已在本机保存 · v'+snapshot.revision);
  }).catch(e=>msg('未保存：'+e.message,true));
 }
 function projectObject(){
  return {id:POINT,kind:'point',spatialId:POINT+'_3D',
    projections:{V:[POINT+'_V'],H:[POINT+'_H'],W:[POINT+'_W']}};
 }
 function mount(project){
  stopAnimation();closePhoto();
  if(unsub)unsub();unsub=null;
  coordinator?.dispose();
  coordinator=createCoordinator(project);
  session=createUnifiedProjectSession();
  coordinator.attachSolver(session);
  unsub=coordinator.subscribe(event=>{
   if(event.kind==='input'){stopAnimation();}
   if(event.kind==='input'||event.kind==='view')queueSave();
   render();
  });
  $('v7-title-input').value=project.title;
  const value=project.conditions.find(c=>c.id==='coords')?.value;
  if(value?.type==='point-xyz'&&Array.isArray(value.xyz))
   xyzIds.forEach((id,i)=>{$(id).value=String(value.xyz[i]);});
  else xyzIds.forEach((id,i)=>{$(id).value=String([15,10,12][i]);});
  $('v7-projects').value=project.id;
  msg('项目已打开；恢复后不继承数学验证。');
  render();void showPhoto();
 }
 function updateRecentCard(items,available){
  const card=document.getElementById('recent');
  if(!card)return;
  const heading=card.querySelector('.next-home-empty-title');
  const note=card.querySelector('.next-home-empty-note');
  const action=card.querySelector('.next-home-continue-button');
  const link=card.querySelector('.next-home-card-heading a');
  if(!heading||!note||!action)return;
  if(!available){
   heading.textContent='本机存储暂不可用';
   note.textContent='无法读取项目记录，当前编辑不会冒充已保存。';
  }else if(items.length){
   heading.textContent='本机已保存 '+items.length+' 个项目';
   note.textContent='选择上方项目列表继续修改；恢复后需要重新进行数学验证。';
  }else{
   heading.textContent='暂无可恢复的本机项目';
   note.textContent='从上方统一项目工作台新建项目后，会保存在当前设备。';
  }
  action.textContent=items.length?'继续本机项目':'打开统一项目工作台';
  action.href='#project-workbench';
  if(link){link.href='#project-workbench';link.textContent='进入项目工作台 →';}
 }
 async function refreshList(){
  if(!store)return;
  projectList=await store.listProjects();
  updateRecentCard(projectList,true);
  const selector=$('v7-projects');
  selector.replaceChildren();
  const empty=document.createElement('option');empty.value='';
  empty.textContent=projectList.length?'选择本机项目':'暂无本机项目';
  selector.append(empty);
  for(const p of projectList){
   const o=document.createElement('option');o.value=p.id;
   o.textContent=p.title+' · '+String(p.savedAt||'').slice(0,10);
   selector.append(o);
  }
  if(coordinator&&projectList.some(p=>p.id===coordinator.snapshot().id))
   selector.value=coordinator.snapshot().id;
 }
 async function makeNew(){
  const project=newProject({id:gid('Project'),task:'projection'});
  mount(project);queueSave();
  await saving;await refreshList();
 }
 function current(){
  const verified=coordinator?.currentResult();
  return verified?.clock?.canRender(coordinator.snapshot().revision)?verified:null;
 }
 function renderPaper(){
  const svg=$('v7-sheet');svg.replaceChildren();
  svg.append(shape('rect',{x:0,y:0,width:720,height:460,fill:'#fff'}));
  for(let x=0;x<=720;x+=40)line(svg,x,0,x,460,'#eef3fa');
  for(let y=0;y<=460;y+=40)line(svg,0,y,720,y,'#eef3fa');
  line(svg,0,SHEET.origin.y,720,SHEET.origin.y,'#6b83aa');
  line(svg,SHEET.origin.x,0,SHEET.origin.x,460,'#6b83aa');
  line(svg,SHEET.origin.x,SHEET.origin.y,SHEET.origin.x+160,SHEET.origin.y+160,'#b5c5d7','5 5');
  text(svg,24,28,'V · 正面');
  text(svg,24,442,'H · 水平');
  text(svg,590,28,'W · 侧面');
  const snap=coordinator?.snapshot();
  if(!snap)return;
  const zoom=snap.view.paper.zoom;
  svg.setAttribute('viewBox',[360-360/zoom+snap.view.paper.panX,
    230-230/zoom+snap.view.paper.panY,720/zoom,460/zoom].join(' '));
  const solved=current();if(!solved)return;
  const colors=$('v7-mono').checked?
   {given:'#222',derived:'#555',guide:'#777',selected:'#000'}:
   {given:'#1873a8',derived:'#16734c',guide:'#d19847',selected:'#ec5b2d'};
  const frame=solved.clock.snapshot();
  const active=snap.view.selectedObjectId===POINT;
  const coords=solved.scene.objects[0].representations;
  for(const view of ['V','H','W']){
   if(view==='W'&&!frame.done)continue;
   const p=toSheet(view,coords[view].at,SHEET);
   const el=shape('circle',{cx:p.x,cy:p.y,r:active?8:6,
      fill:view==='W'?colors.derived:colors.given,
      stroke:active?colors.selected:'#fff','stroke-width':active?3:1.5,
      tabindex:0,role:'button','aria-label':'选择 '+view+' 投影点'});
   const pick=()=>coordinator.selectRepresentation(view,POINT+'_'+view);
   el.addEventListener('click',pick);
   el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();pick();}});
   svg.append(el);text(svg,p.x+11,p.y-9,'P'+view,colors.given);
  }
  if($('v7-guides').checked){
   for(const step of solved.plan.steps)for(const action of step.actions){
    const fraction=frame.actionFractions[action.id]||0;
    if(fraction<=0||!['line','point','arc','circle'].includes(action.kind))continue;
    const tag={line:'line',point:'circle',arc:'path',circle:'circle'}[action.kind];
    const n=shape(tag,{fill:action.kind==='point'?colors.derived:'none',
      stroke:colors.guide,'stroke-width':2,'stroke-dasharray':action.kind==='line'?'5 5':'none'});
    Motion.updateSvg(n,action,fraction);
    svg.append(n);
   }
  }
 }
 function renderSpatial(){
  const svg=$('v7-3d');svg.replaceChildren();
  svg.append(shape('rect',{x:0,y:0,width:500,height:220,fill:'#f8fbff'}));
  const solved=current();if(!solved)return;
  const snap=coordinator.snapshot(),p=solved.scene.objects[0].representations['3D'].data;
  const yaw=snap.view.camera.yaw*Math.PI/180,pitch=snap.view.camera.pitch*Math.PI/180;
  const c=Math.cos(yaw),s=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch);
  const extent=Math.max(10,Math.abs(p.x),Math.abs(p.y),Math.abs(p.z));
  const factor=80/extent;
  function xy(v){
   const xx=v.x*c-v.y*s,depth=v.x*s+v.y*c;
   return {x:250+factor*xx,y:118-factor*(v.z*cp-depth*sp)};
  }
  const o=xy({x:0,y:0,z:0});
  const axes=[['x',{x:extent,y:0,z:0},'#bb6472'],['y',{x:0,y:extent,z:0},'#46846b'],
   ['z',{x:0,y:0,z:extent},'#5d7abc']];
  for(const [name,v,color] of axes){
   const q=xy(v);line(svg,o.x,o.y,q.x,q.y,color);
   text(svg,q.x+6,q.y-4,name,color);
  }
  const point=xy(p),selected=snap.view.selectedObjectId===POINT;
  const dot=shape('circle',{cx:point.x,cy:point.y,r:selected?10:7,
    fill:$('v7-mono').checked?'#333':'#226be9',
    stroke:selected?'#e86c30':'#fff','stroke-width':3,tabindex:0,
    role:'button','aria-label':'选择空间点 P'});
  const pick=()=>coordinator.selectRepresentation('3D',POINT+'_3D');
  dot.addEventListener('click',pick);
  dot.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();pick();}});
  svg.append(dot);
  text(svg,point.x+12,point.y-8,'P('+[p.x,p.y,p.z].join(', ')+') mm');
 }
 function renderSteps(){
  const list=$('v7-step-list'),solved=current();
  if(!solved){list.replaceChildren();list.dataset.key='';return;}
  const key=solved.projectId+':'+solved.inputRevision;
  if(list.dataset.key!==key){
   list.replaceChildren();list.dataset.key=key;
   solved.plan.steps.forEach((step,i)=>{
    const btn=document.createElement('button');btn.type='button';btn.dataset.step=String(i);
    btn.textContent=(i+1)+'. '+(step.title||step.explanation||step.id);
    btn.addEventListener('click',()=>{
     stopAnimation();solved.clock.seekStep(i,performance.now());render();
    });
    list.append(btn);
   });
  }
  const frame=solved.clock.snapshot();
  for(const btn of list.querySelectorAll('button')){
   const i=Number(btn.dataset.step);
   btn.setAttribute('aria-current',i===frame.activeStepIndex?'step':'false');
  }
 }
 function render(){
  const snap=coordinator?.snapshot(),solved=current();
  if(!snap)return;
  $('v7-mode').value=snap.view.mode;
  $('v7-yaw').value=String(snap.view.camera.yaw);
  $('v7-pitch').value=String(snap.view.camera.pitch);
  const condition=snap.conditions.find(c=>c.id==='coords');
  $('v7-review').textContent=!condition?'尚未提交空间坐标；当前没有可求解条件。':
   condition.confirmed?'当前条件已人工确认（修订 v'+snap.revision+'）。':'有待确认的条件；不能自动生成标准答案。';
  $('v7-confirm').disabled=!condition||condition.confirmed;
  $('v7-solve').disabled=!condition||!condition.confirmed;
  $('v7-proof').textContent=solved?
    '已验证的点投影 · 真实 M3→ConstructionIntent→DAG→V5 · 最大残差 '+String(solved.residualMm)+' mm；图像自动识别及任意空间体未签收。':
    '未计算／条件失效；恢复项目不可继承“已验证”资格。';
  $('v7-selection').textContent=snap.view.selectedObjectId===POINT?
    '已选择对象 Point1：二维各投影及三维空间点共用稳定身份。':
    '点选 V/H/W 或三维点，对同一个数学对象同步高亮。';
  const mode=snap.view.mode;
  $('v7-sheet').hidden=mode==='3d';
  root.querySelector('.v7-spatial').hidden=mode==='2d';
  const ready=!!solved;
  for(const id of ['v7-back','v7-play','v7-next','v7-seek','v7-speed'])
   $(id).disabled=!ready;
  const frame=ready?solved.clock.snapshot():null;
  $('v7-seek').value=frame?String(Math.round(frame.ratio*1000)):'0';
  $('v7-play').textContent=frame?.playing?'Ⅱ 暂停':'▶ 播放';
  renderPaper();renderSpatial();renderSteps();
 }
 function start(){
  if(raf!==null)return;
  const solved=current();if(!solved)return;
  solved.clock.play(performance.now());
  const tick=()=>{
   raf=null;
   const active=current();if(active!==solved)return;
   const frame=solved.clock.snapshot(performance.now());
   render();
   if(frame.playing)raf=requestAnimationFrame(tick);
  };
  raf=requestAnimationFrame(tick);
  render();
 }
 async function boot(){
  try{store=await openLocalProjects();}
  catch(e){msg('本机存储不可用：仅临时操作；'+e.message,true);
   updateRecentCard([],false);}
  if(store){
   await refreshList();
   if(projectList.length){
    const row=await store.readProject(projectList[0].id);
    mount(row.project);return;
   }
  }
  await makeNew();
 }
 $('v7-new').addEventListener('click',()=>call(makeNew));
 $('v7-open').addEventListener('click',()=>call(async()=>{
  if(!store)throw Error('本机存储不可用');
  const row=await store.readProject($('v7-projects').value);
  if(!row)throw Error('请选择存在的项目');
  mount(row.project);
 }));
 $('v7-title-input').addEventListener('change',()=>call(async()=>{
  if(!coordinator)return;
  coordinator.renameProject($('v7-title-input').value.trim());
  await saving;await refreshList();
 }));
 $('v7-stage').addEventListener('click',()=>call(async()=>{
  if(!coordinator)throw Error('请先新建项目');
  const xyz=xyzIds.map(id=>{
   const el=$(id),v=Number(el.value);
   if(el.value.trim()===''||!Number.isFinite(v)||Math.abs(v)>100000)
    throw Error('三项坐标均须为 ±100000 mm 内的有限值');
   return v;
  });
  if(!coordinator.snapshot().objects.some(x=>x.id===POINT))
   coordinator.putObject(projectObject());
  const id=coordinator.snapshot().source.imageId;
  coordinator.putCondition({id:'coords',objectId:POINT,sourceCandidateId:null,
   confirmed:false,value:{type:'point-xyz',unit:'mm',xyz,imageId:id}});
  msg('坐标已记录为待确认；请核对原图及单位再确认。');
 }));
 $('v7-confirm').addEventListener('click',()=>call(async()=>{
  if(!coordinator)throw Error('请先新建项目');
  coordinator.confirmCondition('coords');
  msg('条件已确认，点击重新数学求解。');
 }));
 $('v7-solve').addEventListener('click',()=>call(async()=>{
  if(!coordinator)throw Error('没有项目');
  stopAnimation();
  session.solve();
  if(!coordinator.canExport())throw Error('数学一致性未通过，拒绝生成动画');
  msg('M3 数学与单一 V5 步骤已核验 · v'+coordinator.snapshot().revision);
 }));
 $('v7-image-input').addEventListener('change',()=>call(async()=>{
  if(!store)throw Error('本机存储不可用，不能安全保存原图');
  const file=$('v7-image-input').files?.[0];if(!file)return;
  ensureImage(file);
  const id=gid('Image');
  await store.putImage(id,file);
  coordinator.setImage(id);await saving;await showPhoto();
  msg('原图本机保存成功；旧确认条件已失效，请重新核对。');
  $('v7-image-input').value='';
 }));
 $('v7-export').addEventListener('click',()=>call(async()=>{
  if(!store||!coordinator)throw Error('没有可导出的本机项目');
  await saving;
  const p=coordinator.snapshot(),blob=await store.exportBundle(p.id);
  const url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download=p.id+'.daiproject';document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
  msg('已生成包含原图的本机项目备份；不会包含旧“已验证”结果。');
 }));
 $('v7-import').addEventListener('change',()=>call(async()=>{
  if(!store)throw Error('本机存储不可用');
  const file=$('v7-import').files?.[0];if(!file)return;
  const imported=await store.importBundle(file);
  await refreshList();
  const row=await store.readProject(imported.id);mount(row.project);
  $('v7-import').value='';msg('项目及原图已导入；必须重新数学求解。');
 }));
 $('v7-delete').addEventListener('click',()=>call(async()=>{
  if(!store||!coordinator)throw Error('本机存储不可用');
  const id=coordinator.snapshot().id;
  if(!window.confirm('确定删除这个本机项目及不再被其他项目使用的原图吗？'))return;
  await saving;await store.deleteProject(id);
  await refreshList();
  if(projectList.length)mount((await store.readProject(projectList[0].id)).project);
  else await makeNew();
 }));
 $('v7-mode').addEventListener('change',()=>coordinator?.setMode($('v7-mode').value));
 for(const [id,fn] of [['v7-yaw','setCamera'],['v7-pitch','setCamera']]){
  $(id).addEventListener('input',()=>coordinator?.[fn]({
   [id==='v7-yaw'?'yaw':'pitch']:Number($(id).value)
  }));
 }
 $('v7-mono').addEventListener('change',render);
 $('v7-guides').addEventListener('change',render);
 $('v7-speed').addEventListener('change',()=>{
  const data=current();if(!data)return;
  data.clock.setSpeed(Number($('v7-speed').value),performance.now());render();
 });
 $('v7-seek').addEventListener('input',()=>{
  const data=current();if(!data)return;
  stopAnimation();data.clock.seekProgress(Number($('v7-seek').value)/1000,performance.now());render();
 });
 $('v7-play').addEventListener('click',()=>{
  const data=current();if(!data)return;
  if(data.clock.snapshot().playing){stopAnimation();render();}
  else start();
 });
 $('v7-back').addEventListener('click',()=>{
  const data=current();if(!data)return;
  stopAnimation();
  const elapsed=data.clock.snapshot().elapsedMs;
  const starts=[0,...data.plan.timing.steps.map(s=>s.startMs)].filter(ms=>ms<elapsed-0.01);
  data.clock.seekMs(starts.length?starts[starts.length-1]:0,performance.now());render();
 });
 $('v7-next').addEventListener('click',()=>{
  const data=current();if(!data)return;
  stopAnimation();
  const elapsed=data.clock.snapshot().elapsedMs;
  const next=data.plan.timing.steps.map(s=>s.endMs).find(ms=>ms>elapsed+0.01);
  data.clock.seekMs(next??data.plan.timing.totalMs,performance.now());render();
 });
 window.addEventListener('pagehide',()=>{stopAnimation();closePhoto();coordinator?.dispose();store?.close();});
 void call(boot);
})();
