'use strict';
/* Production homepage V7 controller. All personal records and images remain on-device.
 * Reuses project-coordinator, IndexedDB store, canonical 03 solver, shared
 * geometry scene and ONE official V5 player, never an alternate animation.
 */
const {newProject,createCoordinator}=require('./project-coordinator.cjs');
const {openLocalProjects,ensureImage}=require('./local-project-store.cjs');
const {createUnifiedProjectSession,prismMesh,SHEET}=require('./unified-workbench-session.cjs');
const {validateGeometry}=require('../core/contracts/geometry.js');
const {reviewDoubleScale}=require('./source-calibration.cjs');
const {clientToPhoto,measuredPixels}=require('./photo-measurements.cjs');
const {manualSegment}=require('./source-candidate-bridge.cjs');
const {compileGeometryScene}=require('./geometry-scene-consumer.cjs');
const Motion=require('../workbench/teaching-motion-v5.js');
(function(){
 const $=id=>document.getElementById(id),root=$('project-workbench');
 if(!root)return;
 const NS='http://www.w3.org/2000/svg',POINT='Point1';
 const xyzIds=['v7-x','v7-y','v7-z'];
 const filletInputs=['v7-f-ax','v7-f-ay','v7-f-bx','v7-f-by','v7-f-cx','v7-f-cy','v7-f-dx','v7-f-dy','v7-f-radius'];
 const filletOptions=['v7-f-branch','v7-f-direction','v7-f-first','v7-f-second'];
 const prismInputs=['v7-p-width','v7-p-depth','v7-p-height','v7-p-px',
  'v7-p-py','v7-p-pz','v7-p-nx','v7-p-ny','v7-p-nz'];
 const prismOptions=['v7-p-kept'];
 const allConditionFields=[...xyzIds,...filletInputs,...filletOptions,...prismInputs,...prismOptions];
 const compositionFields=['v7-c-id','v7-c-kind','v7-c-ax','v7-c-ay','v7-c-az',
  'v7-c-bx','v7-c-by','v7-c-bz','v7-c-radius','v7-c-start','v7-c-end',
  'v7-c-direction','v7-c-points','v7-c-closed'];
 const geometryId=id=>/^([A-Za-z][A-Za-z0-9_-]{0,79})$/.test(id);
 function compositionCandidate(){
  const id=$('v7-c-id').value.trim(),kind=$('v7-c-kind').value;
  if(!geometryId(id))throw Error('对象 ID 必须由字母开头，只含数字、字母、下划线或横线');
  const a=['v7-c-ax','v7-c-ay','v7-c-az'].map(numberFrom);
  const b=['v7-c-bx','v7-c-by','v7-c-bz'].map(numberFrom);
  const p=(x,y)=>({x,y}),v=(x,y,z)=>({x,y,z});
  let data,space,type,projectKind;
  const center=p(a[0],a[1]);
  if(kind==='point2d'){type='point';space='drawing-2d';data=center;projectKind='point';}
  else if(kind==='point3d'){type='point';space='model-3d';data=v(...a);projectKind='point';}
  else if(kind==='segment2d'){type='segment';space='drawing-2d';data={
   start:center,end:p(b[0],b[1])};projectKind='edge';}
  else if(kind==='segment3d'){type='segment';space='model-3d';data={
   start:v(...a),end:v(...b)};projectKind='edge';}
  else if(kind==='circle'){type='circle';space='drawing-2d';
   data={center,radius:numberFrom('v7-c-radius')};projectKind='edge';}
  else if(kind==='arc'){type='arc';space='drawing-2d';
   data={center,radius:numberFrom('v7-c-radius'),
    startAngle:numberFrom('v7-c-start'),endAngle:numberFrom('v7-c-end'),
    direction:$('v7-c-direction').value};projectKind='edge';}
  else if(kind==='polyline2d'||kind==='polyline3d'){
   type='polyline';space=kind==='polyline2d'?'drawing-2d':'model-3d';
   projectKind='edge';
   const raw=$('v7-c-points').value;
   if(raw.length>120000)throw Error('折线输入过长，拒绝处理');
   const lines=raw.split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
   if(lines.length<2||lines.length>2048)throw Error('折线需有 2 至 2048 个有序顶点');
   const dim=space==='drawing-2d'?2:3;
   const points=lines.map((line,i)=>{
    const parts=line.split(/[\s,\uFF0C]+/);
    if(parts.length!==dim||parts.some(x=>
        !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(x)))
      throw Error('第 '+(i+1)+' 行必须是 '+dim+' 个有效十进制坐标');
    const values=parts.map(Number);
    if(values.some(v=>!Number.isFinite(v)||Math.abs(v)>100000))
      throw Error('第 '+(i+1)+' 行坐标超出有效 mm 范围');
    return dim===2?p(...values):v(...values);
   });
   data={points,closed:$('v7-c-closed').checked===true};
  }
  else if(kind==='prism'){
   if(b.some((n,i)=>n<=a[i]))throw Error('长方体最大角坐标必须严格大于最小角');
   type='mesh';space='model-3d';projectKind='solid';
   data=prismMesh({solid:{min:v(...a),max:v(...b)}}).data;
  }else throw Error('不支持的手工几何对象');
  const geometry={id,kind:type,space,unit:'mm',data};
  const check=validateGeometry(geometry);
  if(!check.ok)throw Error('输入几何无效：'+check.errors.join('；'));
  const spatial=space==='model-3d';
  const model={id,kind:projectKind,spatialId:spatial?id+'_3D':null,
    projections:{V:spatial?[id+'_V']:[],H:spatial?[id+'_H']:[],
      W:spatial?[id+'_W']:[]}};
  return {geometry,model};
 }
 function compositionFormFrom(g){
  const d=g?.data;if(!d)return;
  const type=g.kind==='mesh'?'prism':g.kind==='point'?
   (g.space==='drawing-2d'?'point2d':'point3d'):
   g.kind==='segment'?(g.space==='drawing-2d'?'segment2d':'segment3d'):
   g.kind;
  if(g.kind==='polyline'){
   $('v7-c-kind').value=g.space==='drawing-2d'?'polyline2d':'polyline3d';
   $('v7-c-points').value=d.points.map(p=>
    [p.x,p.y,...(g.space==='model-3d'?[p.z]:[])].join(',')).join('\n');
   $('v7-c-closed').checked=d.closed;
   $('v7-c-id').value=g.id;
   return;
  }
  $('v7-c-kind').value=type;
  $('v7-c-id').value=g.id;
  let a,b;
  if(type==='prism'){
   const pts=Object.values(d.points);
   a=[Math.min(...pts.map(p=>p.x)),Math.min(...pts.map(p=>p.y)),Math.min(...pts.map(p=>p.z))];
   b=[Math.max(...pts.map(p=>p.x)),Math.max(...pts.map(p=>p.y)),Math.max(...pts.map(p=>p.z))];
  }else if(g.kind==='segment'){
   a=[d.start.x,d.start.y,d.start.z??0];b=[d.end.x,d.end.y,d.end.z??0];
  }else{
   const pt=g.kind==='point'?d:d.center;
   a=[pt.x,pt.y,pt.z??0];b=[10,10,10];
  }
  ['v7-c-ax','v7-c-ay','v7-c-az'].forEach((id,i)=>$(id).value=String(a[i]));
  ['v7-c-bx','v7-c-by','v7-c-bz'].forEach((id,i)=>$(id).value=String(b[i]));
  if(g.kind==='circle'||g.kind==='arc')$('v7-c-radius').value=String(d.radius);
  if(g.kind==='arc'){
   $('v7-c-start').value=String(d.startAngle);
   $('v7-c-end').value=String(d.endAngle);
   $('v7-c-direction').value=d.direction;
  }
 }

 function refreshRelations(snapshot){
  if(snapshot.task!=='composition')return;
  const current=$('v7-r-list'),chosen=current.value;
  const a=$('v7-r-a'),b=$('v7-r-b'),oldA=a.value,oldB=b.value;
  for(const selector of [a,b]){
   selector.replaceChildren();
   const placeholder=document.createElement('option');placeholder.value='';
   placeholder.textContent='选择已录入对象';selector.append(placeholder);
   for(const obj of snapshot.objects){
    const option=document.createElement('option');option.value=obj.id;
    option.textContent=obj.id+' · '+obj.kind;selector.append(option);
   }
  }
  a.value=snapshot.objects.some(x=>x.id===oldA)?oldA:'';
  b.value=snapshot.objects.some(x=>x.id===oldB)?oldB:'';
  current.replaceChildren();
  const blank=document.createElement('option');blank.value='';
  blank.textContent='新关系';current.append(blank);
  for(const rel of snapshot.relations||[]){
   const option=document.createElement('option');option.value=rel.id;
   option.textContent=(rel.confirmed?'✓ ':'○ ')+rel.id+' · '+rel.kind;
   current.append(option);
  }
  current.value=(snapshot.relations||[]).some(x=>x.id===chosen)?chosen:'';
  const approved=(snapshot.relations||[]).filter(r=>r.confirmed).length;
  const evidence=preview()?.relationEvidence;
  $('v7-r-status').textContent='关系 '+(snapshot.relations||[]).length+
   ' 个，已确认 '+approved+' 个。'+(evidence?
    ' 输入几何残差：'+evidence.status+'，已核查 '+evidence.checkedCount+
    ' 条。此处不构成未知量解答。':'需要确认后重新显示场景，才会计算残差。');
 }


 function refreshUnknown(snap){
  if(snap.task!=='composition')return;
  const data=snap.affineProblem,select=$('v7-u-list'),chosen=select.value;
  select.replaceChildren();
  const blank=document.createElement('option');
  blank.value='';blank.textContent='添加新约束';select.append(blank);
  for(const constraint of data?.constraints||[]){
   const item=document.createElement('option');item.value=constraint.id;
   item.textContent=constraint.id+' · '+constraint.kind;select.append(item);
  }
  select.value=data?.constraints.some(c=>c.id===chosen)?chosen:'';
  const result=preview();
  const evidence=result?.kind==='affine-evidence'?result.evidence:null;
  const count=data?.constraints.length||0;
  $('v7-u-status').textContent=!data?
   '无未知点系统：请添加点 IDs 与条件，再明确确认。':
   '未知点 '+data.points.length+' 个，标量约束记录 '+count+' 条。'+
   (data.confirmed?'条件已人工确认。':'条件未确认或已修改，旧求解失效。')+
   (evidence?' M3 '+evidence.status+'，rank '+
     String(evidence.rank)+' / '+evidence.variableCount+
     '，残差 '+String(evidence.residualMm)+' mm。':'');
 }

 function refreshComposition(){
  const snapshot=coordinator?.snapshot();if(!snapshot||snapshot.task!=='composition')return;
  const select=$('v7-c-objects'),chosen=select.value;
  select.replaceChildren();
  const blank=document.createElement('option');blank.value='';blank.textContent='新增对象';
  select.append(blank);
  for(const obj of snapshot.objects){
   const option=document.createElement('option');option.value=obj.id;
   const approved=snapshot.conditions.find(c=>c.objectId===obj.id)?.confirmed===true;
   option.textContent=(approved?'✓ ':'○ ')+obj.id+' · '+obj.kind;
   select.append(option);
  }
  select.value=snapshot.objects.some(o=>o.id===chosen)?chosen:'';
  const approved=snapshot.conditions.filter(c=>c.confirmed).length;
  refreshRelations(snapshot);
  refreshUnknown(snapshot);
  $('v7-c-status').textContent='对象 '+snapshot.objects.length+
    ' 个，已确认 '+approved+' 个。未确认的对象不会出现在场景预览。';
 }

 const taskObjects={
  projection:{id:'Point1',kind:'point',spatialId:'Point1_3D',
   projections:{V:['Point1_V'],H:['Point1_H'],W:['Point1_W']}},
  planar:{id:'Fillet1',kind:'edge',spatialId:null,
   projections:{V:[],H:[],W:[]}},
  exploration:{id:'Solid1',kind:'solid',spatialId:'Solid1_3D',
   projections:{V:['Solid1_V'],H:['Solid1_H'],W:['Solid1_W']}}
 };
 const fieldsForTask=task=>task==='projection'?xyzIds:
  task==='planar'?[...filletInputs,...filletOptions]:[...prismInputs,...prismOptions];
 const numberFrom=id=>{
  const raw=$(id).value;
  if(raw.trim()===''||!Number.isFinite(Number(raw))||Math.abs(Number(raw))>100000)
   throw new Error('坐标、尺寸必须填写有效且有限的模型 mm 数值');
  return Number(raw);
 };
 function fieldsToValue(task,imageId){
  if(task==='projection')
   return {type:'point-xyz',unit:'mm',xyz:xyzIds.map(numberFrom),imageId};
  if(task==='planar'){
   const v=filletInputs.map(numberFrom);
   return {type:'segment-fillet',unit:'mm',
    first:[[v[0],v[1]],[v[2],v[3]]],
    second:[[v[4],v[5]],[v[6],v[7]]],filletRadius:v[8],
    branchId:$('v7-f-branch').value,direction:$('v7-f-direction').value,
    firstTravel:$('v7-f-first').value,secondTravel:$('v7-f-second').value,imageId};
  }
  const v=prismInputs.map(numberFrom);
  const retainedHalfspace=$('v7-p-kept').value;
  if(!['unreviewed','positive','negative'].includes(retainedHalfspace))
   throw Error('必须明确选择或保留未确认的截切材料侧');
  return {type:'prism-section',unit:'mm',size:v.slice(0,3),
   planePoint:v.slice(3,6),planeNormal:v.slice(6,9),retainedHalfspace,imageId};
 }
 function populateTaskFields(project){
  $('v7-task').value=project.task;
  const v=project.conditions.find(x=>x.id==='coords')?.value;
  if(!v)return;
  if(project.task==='projection'&&v.type==='point-xyz'&&Array.isArray(v.xyz))
   xyzIds.forEach((id,i)=>$(id).value=String(v.xyz[i]));
  if(project.task==='planar'&&v.type==='segment-fillet'){
   const a=[...v.first[0],...v.first[1],...v.second[0],...v.second[1],v.filletRadius];
   filletInputs.forEach((id,i)=>$(id).value=String(a[i]));
   for(const [id,key] of [['v7-f-branch','branchId'],['v7-f-direction','direction'],
    ['v7-f-first','firstTravel'],['v7-f-second','secondTravel']])
     $(id).value=v[key];
  }
  if(project.task==='exploration'&&v.type==='prism-section'){
   const a=[...v.size,...v.planePoint,...v.planeNormal];
   prismInputs.forEach((id,i)=>$(id).value=String(a[i]));
   $('v7-p-kept').value=v.retainedHalfspace??'unreviewed';
  }
 }
 function preview(){
  const snap=coordinator?.snapshot(),out=session?.readSnapshot();
  return out&&out.projectId===snap?.id&&out.inputRevision===snap.revision&&
    ['prism-evidence','composition-evidence','affine-evidence'].includes(out.kind)&&out.verified===false?out:null;
 }
 function selectable(node,view,rep,id){
  const pick=()=>coordinator.selectRepresentation(view,rep);
  node.setAttribute('tabindex','0');node.setAttribute('role','button');
  node.setAttribute('aria-label','选择 '+id+' 的 '+view+' 表达');
  node.addEventListener('click',pick);
  node.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){
   e.preventDefault();pick();
  }});
  return node;
 }

 let store=null,coordinator=null,session=null,unsub=null;
 let saving=Promise.resolve(),imageURL=null,imageEpoch=0,raf=null;
 let photoMarkers=[[],[]];
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


 function refreshCandidateLinks(){
  const links=coordinator?.sourceCandidates()||[],list=$('v7-source-link'),
   keep=list.value,selected=coordinator?.selectedGeometryId();
  list.replaceChildren();
  const none=document.createElement('option');none.value='';
  none.textContent='不关联候选';list.append(none);
  for(const candidate of links){
   const option=document.createElement('option');option.value=candidate.candidateId;
   option.textContent=candidate.candidateId+' · '+candidate.status+
    ' · '+candidate.conditions.map(c=>c.conditionId).join(', ');
   list.append(option);
  }
  const reverse=links.find(c=>c.conditions.some(link=>link.objectId===selected));
  list.value=reverse?.candidateId||
   (links.some(x=>x.candidateId===keep)?keep:'');
  const current=links.find(x=>x.candidateId===list.value);
  $('v7-candidate-status').textContent=current?
   '来源 '+current.candidateId+' → 条件 '+
    (current.conditions.length?current.conditions.map(c=>c.conditionId).join('、'):'尚未关联')+
    '；审核 '+current.status+'。条件数值仍由人工另行核对。':
   '当前 '+links.length+' 个原图候选；手工标注不等于数学证明。';
 }

 function paintPhotoMarkers(){
  const img=$('v7-photo'),svg=$('v7-photo-marks');
  svg.replaceChildren();
  if(!img.naturalWidth||!img.naturalHeight)return;
  svg.setAttribute('viewBox','0 0 '+img.naturalWidth+' '+img.naturalHeight);
  const links=coordinator?.sourceCandidates()||[];
  const chosen=$('v7-source-link').value;
  for(const candidate of links){
   const b=candidate.bbox,active=candidate.candidateId===chosen;
   svg.append(shape('rect',{x:b.x,y:b.y,width:b.width,height:b.height,
    fill:'none',stroke:active?'#d14f32':'#8e78b0',
    'stroke-width':Math.max(2,img.naturalWidth/450),
    'stroke-dasharray':active?'none':'5 4'}));
  }
  const colors=['#e25740','#1d85a5'];
  for(let i=0;i<2;i++){
   const pts=photoMarkers[i],color=colors[i];
   for(const [n,p] of pts.entries()){
    svg.append(shape('circle',{cx:p.x,cy:p.y,r:Math.max(3,img.naturalWidth/300),
     fill:color,stroke:'#fff','stroke-width':Math.max(1,img.naturalWidth/900)}));
    svg.append(shape('text',{x:p.x+6,y:p.y-6,'font-size':Math.max(9,img.naturalWidth/80),
     fill:color},String(i+1)+'.'+String(n+1)));
   }
   if(pts.length===2)
    svg.append(shape('line',{x1:pts[0].x,y1:pts[0].y,
     x2:pts[1].x,y2:pts[1].y,stroke:color,
     'stroke-width':Math.max(1.5,img.naturalWidth/400)}));
  }
 }
 function photoMarkMessage(){
  const group=Number($('v7-photo-segment').value);
  const points=photoMarkers[group];
  return '第 '+(group+1)+' 组：'+points.length+'/2 个端点。'+
    (points.length===2?'像素跨度 '+measuredPixels(points).toFixed(3)+
     ' px；还需核对对应的实际毫米长度。':'点击原图的两个已知尺寸端点。');
 }

 function closePhoto(){
  imageEpoch++;if(imageURL)URL.revokeObjectURL(imageURL);
  imageURL=null;$('v7-photo').hidden=true;
  $('v7-photo-box').hidden=true;
  $('v7-photo').removeAttribute('src');
  $('v7-photo-marks').replaceChildren();
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
   $('v7-photo-box').hidden=false;
   paintPhotoMarkers();
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

 function hydrateCalibration(project){
  const c=project.source.calibration;
  photoMarkers=[[],[]];
  $('v7-cal-rotation').value=String(project.source.rotationDeg);
  if(c?.method==='manual-two-scale'&&c.measurements?.length===2){
   for(let i=0;i<2;i++){
    $('v7-cal-px'+(i+1)).value=String(c.measurements[i].pixelDistance);
    $('v7-cal-mm'+(i+1)).value=String(c.measurements[i].mmDistance);
    if(c.measurements[i].pixelPoints)
     photoMarkers[i]=c.measurements[i].pixelPoints.map(p=>({x:p.x,y:p.y}));
   }
  }
 }
 function calibrationStatus(source){
  const c=source.calibration;
  if(!source.imageId)return '尚未选择原图：比例输入不会获得确认资格。';
  if(!c)return '原图尚未完成独立双比例核对，不可直接把像素当毫米。';
  if(c.method!=='manual-two-scale')
   return '历史项目只有单比例尺：需要两组独立的人工量测重新复核。';
  return '两组人工量测一致：'+c.mmPerPixel.toPrecision(7)+
   ' mm/px，差异 '+(100*c.relativeDisagreement).toFixed(3)+
   '%；数值一致不等于照片内容已自动识别。';
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
  populateTaskFields(project);
  hydrateCalibration(project);
  $('v7-source-link').value='';
  $('v7-photo-segment').value='0';
  $('v7-photo-point-status').textContent=photoMarkMessage();
  $('v7-c-objects').value='';
  $('v7-u-frame').value=project.affineProblem?.frame||'model-mm-2d';
  $('v7-u-points').value=project.affineProblem?.points?.map(x=>x.id).join(',')||'A,B';
  $('v7-u-list').value='';
  if(project.task==='composition')refreshComposition();
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
 // The incomplete M3 spatial preview uses the existing V5 player but
 // NEVER passes the coordinator's verified/export eligibility.
 function playback(){
  const verified=current();if(verified)return verified;
  const partial=preview(),snap=coordinator?.snapshot();
  return partial?.kind==='prism-evidence'&&
    partial.plan?.status==='preview-only'&&
    partial.plan.canPromoteToVerifiedResult===false&&
    partial.clock?.canRender(snap.revision)?partial:null;
 }

 function drawV5(svg,solved,colors){
  const frame=solved.clock.snapshot(),scoped=solved.verified===false;
  if(!scoped&&!$('v7-guides').checked)return;
  for(const step of solved.plan.steps)for(const action of step.actions){
   if(step.role==='guide'&&!$('v7-guides').checked)continue;
   const fraction=frame.actionFractions[action.id]||0;
   if(fraction<=0||!['line','point','arc','circle'].includes(action.kind))continue;
   const tag={line:'line',point:'circle',arc:'path',circle:'circle'}[action.kind];
   const result=scoped&&step.role==='result';
   const picked=result&&coordinator.selectedGeometryId()===solved.plan.geometryId;
   const ink=picked?($('v7-mono').checked?'#111':'#ef6730'):
    result?($('v7-mono').checked?'#444':'#b26b19'):colors.guide;
   const node=shape(tag,{fill:action.kind==='point'?ink:'none',
    stroke:ink,'stroke-width':result?2.4:2,
    'stroke-dasharray':result?'2 5':action.kind==='line'?'5 5':'none'});
   Motion.updateSvg(node,action,fraction);
   if(result){
    const view=action.id.match(/-(V|H|W)$/)?.[1];
    node.setAttribute('data-visibility','undetermined');
    node.setAttribute('data-geometry-id',solved.plan.geometryId);
    if(view)node.setAttribute('data-geometry-view',view);
    node.setAttribute('data-source-section-edge',action.sourceSectionEdgeId);
    const evidence=solved.evidence?.sectionEvidenceV5Bindings?.bindings
     .find(link=>link.v5ActionId===action.id);
    if(evidence){
     // These are annotations for a mathematically scoped OPEN interval.
     // The complete drawn stroke ALWAYS remains undetermined.
     node.setAttribute('data-open-interior-visibility',
      evidence.openInteriorVisibility);
     node.setAttribute('data-ray-proof-scope',evidence.sourceProofScope);
     node.append(shape('title',{},
      '截交边开区间射线判断：'+evidence.openInteriorVisibility+
      '；端点、其他实体遮挡及完整虚实线尚未证明'));
    }
    node.setAttribute('role','button');node.setAttribute('tabindex','0');
    node.setAttribute('aria-label','选择 '+solved.plan.geometryId+' 的 '+view+' 表达');
    const pick=()=>coordinator.selectSceneGeometry(solved.plan.geometryId);
    node.addEventListener('click',pick);
    node.addEventListener('keydown',e=>{
     if(e.key==='Enter'||e.key===' '){e.preventDefault();pick();}
    });
   }
   svg.append(node);
  }
 }
 function compiled(){
  const snap=coordinator?.snapshot(),out=current()||preview();
  if(!snap||!out?.scene)return null;
  // V5 is the only authority that can reveal constructed Geometry.
  const frame=out.clock?.snapshot();
  const hidden=out.kind==='planar-fillet'&&!frame.done?['Fillet1']:[];
  return compileGeometryScene(out.scene,{
   sheet:SHEET,camera:snap.view.camera,selectedObjectId:coordinator.selectedGeometryId(),
   hiddenObjectIds:hidden
  });
 }
 function drawPrimitives(svg,primitives,viewKind,snap,frame,monochrome){
  // Math-output object IDs may be derived rather than saved input objects.
  for(const item of primitives){
   // A named 3D point's third projection is released by the verified V5
   // timeline, not by the generic Geometry Scene visualizer.
   if(item.objectId==='Point1'&&item.view==='W'&&frame&&!frame.done)continue;
   const selected=coordinator.selectedGeometryId()===item.objectId;
   const dashed=item.visibility==='undetermined'||item.viewportOnly;
   const stroke=selected?(monochrome?'#111':'#ef6730'):
    item.visibility==='undetermined'?(monochrome?'#666':'#6280a1'):
    monochrome?'#323232':item.objectId==='Fillet1'?'#147f65':'#2773a7';
   const attrs={...item.attrs,fill:item.kind==='circle'&&!item.fill?stroke:'none',
    stroke, 'stroke-width':selected?3.2:item.kind==='path'?3.1:1.8};
   if(item.fill==='none')attrs.fill='none';
   if(dashed)attrs['stroke-dasharray']='5 4';
   // All primitives carry the exact mathematics-derived stable Geometry ID.
   const node=shape(item.kind==='line'?'line':item.kind==='path'?'path':'circle',attrs);
   if(item.objectId){
    node.setAttribute('data-geometry-id',item.objectId);
    node.setAttribute('data-geometry-view',item.view);
    if(item.visibility==='undetermined')
     node.setAttribute('data-visibility','undetermined');
   }
   if(item.objectId){
    const label=item.objectId==='Point1'&&viewKind==='paper'?
      '选择 '+item.view+' 投影点':
      item.objectId==='Fillet1'&&item.kind==='path'?
      '选择已验证圆弧 Fillet1':
      '选择 '+item.objectId+' 的 '+item.view+' 表达';
    node.setAttribute('tabindex','0');node.setAttribute('role','button');
    node.setAttribute('aria-label',label);
    const pick=()=>coordinator.selectSceneGeometry(item.objectId);
    node.addEventListener('click',pick);
    node.addEventListener('keydown',e=>{
     if(e.key==='Enter'||e.key===' '){e.preventDefault();pick();}
    });
   }
   svg.append(node);
  }
 }
 function renderPaper(){
  const svg=$('v7-sheet');svg.replaceChildren();
  const snap=coordinator?.snapshot();if(!snap)return;
  const scoped=playback();
  if(scoped?.kind==='prism-evidence'){
   const width=scoped.plan.sheet.width,height=scoped.plan.sheet.height;
   svg.setAttribute('viewBox','0 0 '+width+' '+height);
   svg.append(shape('rect',{x:0,y:0,width,height,fill:'#fff'}));
   // Original 12-edge solid is still consumed from the ONE shared Scene;
   // parity-checked view origins make its V/H/W coordinates match V5.
   // The computed result outline is revealed only by existing V5 steps.
   const source=compileGeometryScene(scoped.scene,{
    sheet:SHEET,viewTransforms:scoped.plan.viewTransforms,
    camera:snap.view.camera,
    selectedObjectId:coordinator.selectedGeometryId(),
    hiddenObjectIds:[scoped.plan.geometryId]
   });
   drawPrimitives(svg,source.paper,'paper',snap,scoped.clock.snapshot(),
    $('v7-mono').checked);
   const colors=$('v7-mono').checked?{derived:'#333',guide:'#777'}:
    {derived:'#1970a9',guide:'#c18d39'};
   drawV5(svg,scoped,colors);
   text(svg,24,height-20,'空间截交逐笔预览：端点、遮挡及完整工程图线型未证明',
    '#986945');
   return;
  }
  svg.append(shape('rect',{x:0,y:0,width:720,height:460,fill:'#fff'}));
  const planar=snap.task==='planar';
  if(!planar){
   for(let x=0;x<=720;x+=40)line(svg,x,0,x,460,'#eef3fa');
   for(let y=0;y<=460;y+=40)line(svg,0,y,720,y,'#eef3fa');
   line(svg,0,SHEET.origin.y,720,SHEET.origin.y,'#6b83aa');
   line(svg,SHEET.origin.x,0,SHEET.origin.x,460,'#6b83aa');
   text(svg,24,28,'V · 正面');
   text(svg,24,442,'H · 水平');
   text(svg,590,28,'W · 侧面');
  }
  const result=compiled(),active=current(),frame=active?.clock.snapshot();
  if(result){
   drawPrimitives(svg,result.paper,'paper',snap,frame,$('v7-mono').checked);
   if(result.warnings.length)
    text(svg,22,450,result.warnings[0], '#986945');
   if(!planar&&preview())
    text(svg,22,432,'实体与已算截交边的投影：虚实线及 V5 尚未证明','#986945');
   if(planar){
    const b=result.paperBounds;
    if(b)svg.setAttribute('viewBox',[b.x,b.y,b.width,b.height].join(' '));
   }
  }
  if(!planar){
   const zoom=snap.view.paper.zoom;
   svg.setAttribute('viewBox',[360-360/zoom+snap.view.paper.panX,
    230-230/zoom+snap.view.paper.panY,720/zoom,460/zoom].join(' '));
  }
  if(active){
   const colors=$('v7-mono').checked?{derived:'#333',guide:'#777'}:
    {derived:'#1970a9',guide:'#c18d39'};
   drawV5(svg,active,colors);
  }
 }
 function renderSpatial(){
  const svg=$('v7-3d');svg.replaceChildren();
  svg.append(shape('rect',{x:0,y:0,width:500,height:220,fill:'#f8fbff'}));
  const snap=coordinator?.snapshot();if(!snap)return;
  const result=compiled();if(!result)return;
  drawPrimitives(svg,result.spatial,'3D',snap,null,$('v7-mono').checked);
  if(result.spatial.some(p=>p.visibility==='undetermined'))
   text(svg,14,22,'空间网格线框 · 不推测隐藏边','#986945');
 }
 function renderSteps(){
  const list=$('v7-step-list'),solved=playback();
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
  refreshCandidateLinks();
  paintPhotoMarkers();
  $('v7-cal-status').textContent=calibrationStatus(snap.source);
  $('v7-cal-apply').disabled=!snap.source.imageId;
  $('v7-cal-clear').disabled=!snap.source.imageId||snap.source.calibration===null;
  $('v7-task').value=snap.task;
  for(const fieldset of root.querySelectorAll('fieldset[data-v7-task]'))
    fieldset.hidden=fieldset.dataset.v7Task!==snap.task;
  root.querySelector('.v7-nonpoint-actions').hidden=snap.task==='projection'||snap.task==='composition';
  refreshComposition();
  $('v7-spatial-boundary').textContent=
    snap.task==='composition'&&snap.affineProblem?
     '仿射未知点：仅数学唯一解绘图，无空间可见性/V5 审核':
    snap.task==='planar'?
   '纯二维数学不制造三维立体':snap.task==='exploration'?
   '长方体及截交边共享同源数学；V5 仅预览，虚实线未签收':snap.task==='composition'?
   '多对象人工几何预览，不等于空间求解':'点投影（非实体 CAD）';
  $('v7-mode').value=snap.view.mode;
  $('v7-yaw').value=String(snap.view.camera.yaw);
  $('v7-pitch').value=String(snap.view.camera.pitch);
  const partial=preview();
  const condition=snap.conditions.find(c=>c.id==='coords');
  $('v7-review').textContent=!condition?'尚未提交空间坐标；当前没有可求解条件。':
   condition.confirmed?'当前条件已人工确认（修订 v'+snap.revision+'）。':'有待确认的条件；不能自动生成标准答案。';
  $('v7-confirm-other').disabled=snap.task==='projection'||!condition||condition.confirmed;
  $('v7-solve-other').disabled=snap.task==='projection'||!condition||!condition.confirmed;
  $('v7-confirm').disabled=!condition||condition.confirmed;
  $('v7-solve').disabled=!condition||!condition.confirmed;
  $('v7-proof').textContent=solved?
    (solved.kind==='planar-fillet'?
     '已验证的二维圆弧连接 · 现有 M3→ConstructionIntent→DAG→唯一 V5。数学分支 '+solved.plan.selectedBranchId+'；原图仍需人工审核。':
     '已验证的点投影 · 真实 M3→ConstructionIntent→DAG→V5 · 最大残差 '+String(solved.residualMm)+' mm。'):
    partial?
     partial.kind==='affine-evidence'?
      'M3 有界仿射未知点 · '+partial.evidence.status+
      '；矩阵秩 '+String(partial.evidence.rank)+'/'+
       partial.evidence.variableCount+'，残差 '+String(partial.evidence.residualMm)+
       ' mm。仅点约束数学证据，原图/完整作图/V5 均未签收。':
     partial.kind==='composition-evidence'?
      '手工输入的几何对象已人工确认；M2 关系一致性：'+partial.relationEvidence.status+
       '（'+partial.relationEvidence.checkedCount+' 条）。只检查输入残差，未求未知量；无 ConstructionIntent/V5 资格。':
     '限定证据：截交多边形已通过 M3、V/H/W 与 V5 步骤一致性审核，可使用唯一 V5 逐笔预览；'+
      (partial.evidence?.sectionVisibilityEvidence?.status==='open-edge-ray-only'?
       '保留材料侧已确认，局部截交边开区间射线判断 '+JSON.stringify(
         partial.evidence.sectionVisibilityEvidence.counts)+'；端点和完整虚实线仍未证明。':
       '保留材料侧未确认，所有截交边线型仍不确定。')+
      '完整切后实体与正式工程图未签收，不能导出已验证答案。':
     '未计算／条件失效；恢复项目不可继承“已验证”资格。';
  const activeGeometry=coordinator.selectedGeometryId();
  $('v7-selection').textContent=activeGeometry?
    '已选 Geometry 对象 '+activeGeometry+'；同一场景的全部可用表达同步高亮，未更改数学输入。':
    '点选正式数学场景的任意已知或派生图元，按稳定对象 ID 高亮。';
  const mode=snap.view.mode;
  $('v7-sheet').hidden=mode==='3d'&&snap.task!=='planar';
  root.querySelector('.v7-spatial').hidden=mode==='2d'||snap.task==='planar';
  const timed=playback(),ready=!!timed;
  for(const id of ['v7-back','v7-play','v7-next','v7-seek','v7-speed'])
   $(id).disabled=!ready;
  const frame=ready?timed.clock.snapshot():null;
  $('v7-seek').value=frame?String(Math.round(frame.ratio*1000)):'0';
  $('v7-play').textContent=frame?.playing?'Ⅱ 暂停':'▶ 播放';
  renderPaper();renderSpatial();renderSteps();
 }
 function start(){
  if(raf!==null)return;
  const solved=playback();if(!solved)return;
  solved.clock.play(performance.now());
  const tick=()=>{
   raf=null;
   const active=playback();if(active!==solved)return;
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

 const scaleEntries=[
  ['v7-cal-px1','v7-cal-mm1'],['v7-cal-px2','v7-cal-mm2']
 ];

 $('v7-photo').addEventListener('load',paintPhotoMarkers);
 $('v7-photo-segment').addEventListener('change',()=>{
  $('v7-photo-point-status').textContent=photoMarkMessage();
 });
 $('v7-photo-clear').addEventListener('click',()=>{
  const i=Number($('v7-photo-segment').value);
  if(i!==0&&i!==1)return;
  photoMarkers[i]=[];paintPhotoMarkers();
  const source=coordinator?.snapshot()?.source;
  if(source?.calibration)
   coordinator.setImageGeometry({rotationDeg:source.rotationDeg,calibration:null});
  $('v7-photo-point-status').textContent=photoMarkMessage();
 });
 $('v7-photo').addEventListener('click',()=>call(async()=>{
  const source=coordinator?.snapshot()?.source;
  const img=$('v7-photo');
  if(!source?.imageId||img.hidden)throw Error('请先保存原图');
 }));
 // Image coordinate capture runs from actual user pointer events.
 $('v7-photo').addEventListener('pointerup',e=>call(async()=>{
  const source=coordinator?.snapshot()?.source;
  const img=$('v7-photo');
  if(!source?.imageId||img.hidden)throw Error('请先保存原图');
  const i=Number($('v7-photo-segment').value);
  if(i!==0&&i!==1)throw Error('未知的量测组');
  const pt=clientToPhoto({clientX:e.clientX,clientY:e.clientY,
   rect:img.getBoundingClientRect(),
   naturalWidth:img.naturalWidth,naturalHeight:img.naturalHeight});
  if(photoMarkers[i].length===2)photoMarkers[i]=[];
  photoMarkers[i].push(pt);
  if(photoMarkers[i].length===2){
   const pixels=measuredPixels(photoMarkers[i]);
   $('v7-cal-px'+(i+1)).value=String(pixels);
   if(source.calibration)
    coordinator.setImageGeometry({rotationDeg:source.rotationDeg,calibration:null});
  }
  paintPhotoMarkers();
  $('v7-photo-point-status').textContent=photoMarkMessage();
 }));


 $('v7-source-link').addEventListener('change',()=>{
  const id=$('v7-source-link').value;
  const match=coordinator?.sourceCandidates().find(c=>c.candidateId===id);
  if(match?.conditions.length){
   const linked=match.conditions.find(c=>c.objectId);
   if(linked?.objectId)coordinator.selectObject(linked.objectId);
  }
  paintPhotoMarkers();refreshCandidateLinks();
 });
 $('v7-candidate-locate').addEventListener('click',()=>{
  const id=$('v7-source-link').value;
  const candidate=coordinator?.sourceCandidates().find(c=>c.candidateId===id);
  if(!candidate)throw Error('请先选择待定位候选');
  if(candidate.conditions.length&&candidate.conditions[0].objectId)
   coordinator.selectObject(candidate.conditions[0].objectId);
  paintPhotoMarkers();$('v7-photo').scrollIntoView?.({block:'nearest'});
 });
 $('v7-candidate-stage').addEventListener('click',()=>call(async()=>{
  const source=coordinator?.snapshot().source,blob=source?.imageId&&
    await store?.readImage(source.imageId);
  if(!blob)throw Error('候选必须来源于已保存的本机原图');
  const img=$('v7-photo');
  if(!img.naturalWidth||!img.naturalHeight)
   throw Error('原图未完成解码，暂不能创建可靠像素候选');
  const pts=photoMarkers[Number($('v7-photo-segment').value)];
  if(pts?.length!==2)throw Error('请先在原图上选择本组两个端点');
  const candidate=manualSegment({id:$('v7-candidate-id').value.trim(),
   from:pts[0],to:pts[1],image:{width:img.naturalWidth,
    height:img.naturalHeight,byteLength:blob.size,mediaType:blob.type}});
  coordinator.putSourceCandidate(candidate,{width:img.naturalWidth,
   height:img.naturalHeight,byteLength:blob.size,mediaType:blob.type});
  $('v7-source-link').value=candidate.id;
  refreshCandidateLinks();paintPhotoMarkers();
  msg('原始像素线段 '+candidate.id+' 已保存为待人工审核 ProblemDraft 候选。');
 }));
 for(const [id,decision] of [['v7-candidate-accept','confirmed'],
   ['v7-candidate-reject','rejected']]){
  $(id).addEventListener('click',()=>call(async()=>{
   const selected=$('v7-source-link').value;
   if(!selected)throw Error('先选择需要审核的原图候选');
   coordinator.reviewSourceCandidate(selected,decision);
   $('v7-source-link').value=selected;
   refreshCandidateLinks();paintPhotoMarkers();
   msg('原图候选 '+selected+' 已'+(decision==='confirmed'?'人工确认':'拒绝')+
    '；相关数学条件需要再次确认，不能继承原有 V5。');
  }));
 }

 $('v7-cal-apply').addEventListener('click',()=>call(async()=>{
  if(!coordinator?.snapshot().source.imageId)throw Error('请先保存原始图片');
  const measurements=scaleEntries.map(([px,mm],i)=>({
   pixelDistance:numberFrom(px),mmDistance:numberFrom(mm),
   ...(photoMarkers[i].length===2?{pixelPoints:photoMarkers[i].map(p=>({x:p.x,y:p.y}))}:{})
  }));
  const calibration=reviewDoubleScale(measurements);
  coordinator.setImageGeometry({
   rotationDeg:Number($('v7-cal-rotation').value),calibration
  });
  msg('已记录两组一致的人工比例；原题旧条件和 V5 已全部失效。');
 }));
 $('v7-cal-clear').addEventListener('click',()=>call(async()=>{
  if(!coordinator?.snapshot().source.imageId)throw Error('没有已保存原图');
  coordinator.setImageGeometry({
   rotationDeg:Number($('v7-cal-rotation').value),calibration:null
  });
  msg('已清除来源比例；所有旧条件须重新确认。');
 }));
 for(const [px,mm]of scaleEntries){
  for(const id of [px,mm])$(''+id).addEventListener('input',()=>{
   if(id===px){
    photoMarkers[scaleEntries.findIndex(v=>v[0]===px)]=[];
    paintPhotoMarkers();
   }
   const snap=coordinator?.snapshot();
   if(snap?.source.calibration){
    coordinator.setImageGeometry({rotationDeg:snap.source.rotationDeg,calibration:null});
    msg('比例数字已修改，旧比例与数学答案立即失效；请完成两组独立复核。');
   }
  });
 }
 $('v7-cal-rotation').addEventListener('change',()=>call(async()=>{
  const snap=coordinator?.snapshot();
  if(!snap?.source.imageId)throw Error('请先选择原图再标记方向');
  coordinator.setImageGeometry({
   rotationDeg:Number($('v7-cal-rotation').value),calibration:null
  });
  photoMarkers=[[],[]];paintPhotoMarkers();
  msg('原图方向变化，旧像素量测、双比例与全部条件已失效。');
 }));

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

 $('v7-task').addEventListener('change',()=>call(async()=>{
  if(!coordinator)return;
  const selected=$('v7-task').value;
  stopAnimation();coordinator.setTask(selected);
  if(selected==='planar')coordinator.setMode('2d');
  else coordinator.setMode('split');
  populateTaskFields(coordinator.snapshot());
  msg('题型已切换；原图保留，旧数学条件、分支和动画全部失效。');
 }));



 function affineForm(){
  const snap=coordinator?.snapshot();
  if(snap?.task!=='composition')throw Error('当前项目未选择多对象工作台');
  const frame=$('v7-u-frame').value;
  const axes=frame==='model-mm-3d'?['x','y','z']:['x','y'];
  const ids=$('v7-u-points').value.trim().split(/[,，\s]+/).filter(Boolean);
  if(!ids.length||ids.length>16||new Set(ids).size!==ids.length||
      ids.some(id=>!geometryId(id)))throw Error('需要 1–16 个不重复的未知点 ID');
  const id=$('v7-u-id').value.trim(),kind=$('v7-u-kind').value;
  if(!geometryId(id))throw Error('关系 ID 不合法');
  const a=$('v7-u-a').value.trim(),b=$('v7-u-b').value.trim(),
   mid=$('v7-u-m').value.trim();
  const numbers={x:numberFrom('v7-u-x'),y:numberFrom('v7-u-y'),
   z:numberFrom('v7-u-z')};
  const vector=Object.fromEntries(axes.map(k=>[k,numbers[k]]));
  let constraint;
  switch(kind){
   case 'fixed':constraint={id,kind,point:a,at:vector};break;
   case 'axis':constraint={id,kind,point:a,
    axis:$('v7-u-axis').value,value:numbers.x};break;
   case 'coincident':constraint={id,kind,a,b};break;
   case 'offset':constraint={id,kind,from:a,to:b,delta:vector};break;
   case 'midpoint':constraint={id,kind,mid,a,b};break;
   case 'distance':constraint={id,kind,a,b,value:numbers.x};break;
   case 'angle':constraint={id,kind,a,vertex:mid,b,degrees:numbers.x};break;
   default:throw Error('未支持的线性几何约束');
  }
  const existing=snap.affineProblem?.constraints||[];
  const chosen=$('v7-u-list').value;
  if(chosen&&chosen!==id)
   throw Error('修改关系 ID 请先删除旧关系，不要复用审核资格');
  const constraints=[...existing.filter(x=>x.id!==id),constraint];
  const nonlinear=constraints.some(c=>c.kind==='distance'||c.kind==='angle');
  if(!nonlinear)
   return {frame,unit:'mm',points:ids.map(id=>({id})),constraints};
  if(ids.length>4)throw Error('非线性数值求解最多允许四个未知点');
  const text=$('v7-u-seeds').value.trim();
  const lines=text.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
  if(!lines.length||lines.length>6)throw Error('非线性求解需 1–6 行人工初值');
  const seeds=lines.map((line,i)=>{
   const pts=line.split(';').map(x=>x.trim());
   if(pts.length!==ids.length)throw Error('每行必须依照未知点 ID 顺序给出所有点的初始坐标');
   const coordinates={};
   for(let k=0;k<ids.length;k++){
    const values=pts[k].split(',').map(x=>x.trim());
    if(values.length!==axes.length||values.some(x=>!x.trim()||!Number.isFinite(Number(x))))
     throw Error('初值必须为逗号分隔的有效二维/三维毫米坐标');
    coordinates[ids[k]]=Object.fromEntries(axes.map((a,j)=>[a,Number(values[j])]));
   }
   return {id:'Seed'+(i+1),coordinates};
  });
  return {frame,unit:'mm',points:ids.map(id=>({id})),constraints,
   solverKind:'nonlinear',seeds};
 }
 $('v7-u-list').addEventListener('change',()=>{
  const c=coordinator?.snapshot().affineProblem?.constraints
    .find(x=>x.id===$('v7-u-list').value);
  if(!c)return;
  $('v7-u-id').value=c.id;$('v7-u-kind').value=c.kind;
  const a=c.point||c.from||c.a||'A',b=c.to||c.b||'B';
  $('v7-u-a').value=a;$('v7-u-b').value=b;
  $('v7-u-m').value=c.mid||c.vertex||'M';
  $('v7-u-axis').value=c.axis||'x';
  const coords=c.at||c.delta||{};
  for(const axis of ['x','y','z'])
   $('v7-u-'+axis).value=String(axis==='x'&&
     ['axis','distance','angle'].includes(c.kind)?
     (c.value??c.degrees):coords[axis]??0);
 });
 $('v7-u-append').addEventListener('click',()=>call(async()=>{
  const candidate=affineForm();
  coordinator.putAffineProblem(candidate);
  $('v7-u-list').value=$('v7-u-id').value.trim();
  msg('未知点数学关系已保存在本机项目；人工确认前不能求解。');
 }));
 $('v7-u-remove').addEventListener('click',()=>call(async()=>{
  const snap=coordinator?.snapshot(),data=snap?.affineProblem;
  const id=$('v7-u-list').value;
  if(!data||!id)throw Error('请先选择待删除的未知点关系');
  coordinator.putAffineProblem({...data,
    constraints:data.constraints.filter(x=>x.id!==id)});
  $('v7-u-list').value='';
  msg('已删除约束并撤销旧数学证据，请重新确认方程组。');
 }));
 $('v7-u-confirm').addEventListener('click',()=>call(async()=>{
  coordinator.confirmAffineProblem();
  msg('整组未知点数学条件已人工确认，可独立执行 M3 线性求解。');
 }));
 $('v7-u-solve').addEventListener('click',()=>call(async()=>{
  if(coordinator?.snapshot().task!=='composition')
   throw Error('请先进入多对象工作台');
  stopAnimation();
  const result=session.solve();
  if(result.kind!=='affine-evidence'||result.verified!==false||
     result.clock!==null||result.plan!==null||coordinator.canExport())
   throw Error('未知量数学子集不允许越权生成已验证工程答案/V5');
  const e=result.evidence;
  msg('M3 '+e.status+'，秩 '+String(e.rank)+'/'+e.variableCount+
   '，残差 '+String(e.residualMm)+
   ' mm。仅在唯一解时显示 Geometry；正式作图仍不可播放。');
 }));
 $('v7-u-reset').addEventListener('click',()=>call(async()=>{
  coordinator.removeAffineProblem();
  $('v7-u-list').value='';
  msg('当前未知点系统已清空，旧求解和视图已失效。');
 }));
 for(const id of ['v7-u-frame','v7-u-points','v7-u-id','v7-u-kind',
  'v7-u-a','v7-u-b','v7-u-m','v7-u-axis',
  'v7-u-x','v7-u-y','v7-u-z','v7-u-seeds']){
  for(const evt of ['input','change'])$(id).addEventListener(evt,()=>{
   const snap=coordinator?.snapshot();
   if(snap?.task!=='composition'||!snap.affineProblem?.confirmed)return;
   coordinator.putAffineProblem(snap.affineProblem);
   msg('未知点输入已修改，旧确认和 M3 结果作废，请保存并重新确认。');
  });
 }

 $('v7-r-list').addEventListener('change',()=>{
  const id=$('v7-r-list').value;
  const row=coordinator?.snapshot().relations?.find(r=>r.id===id);
  if(!row)return;
  $('v7-r-id').value=row.id;$('v7-r-kind').value=row.kind;
  $('v7-r-a').value=row.objectIds[0];$('v7-r-b').value=row.objectIds[1];
  if(row.kind==='distance')$('v7-r-distance').value=String(row.value);
 });
 $('v7-r-kind').addEventListener('change',()=>{
  $('v7-r-distance').disabled=$('v7-r-kind').value!=='distance';
 });
 $('v7-r-stage').addEventListener('click',()=>call(async()=>{
  if(coordinator?.snapshot().task!=='composition')throw Error('当前不是多对象项目');
  const id=$('v7-r-id').value.trim(),kind=$('v7-r-kind').value;
  const a=$('v7-r-a').value,b=$('v7-r-b').value;
  const chosen=$('v7-r-list').value;
  if(chosen&&chosen!==id)throw Error('关系改名需删除旧关系后创建新 ID');
  coordinator.putRelation({id,kind,objectIds:[a,b],
    value:kind==='distance'?numberFrom('v7-r-distance'):null});
  $('v7-r-list').value=id;refreshRelations(coordinator.snapshot());
  msg('跨对象关系 '+id+' 已提交待确认；旧场景数学证据失效。');
 }));
 $('v7-r-confirm').addEventListener('click',()=>call(async()=>{
  const id=$('v7-r-list').value||$('v7-r-id').value.trim();
  coordinator.confirmRelation(id);
  msg('关系 '+id+' 已人工确认，重新显示场景以检查残差；未取得 V5 证明。');
 }));
 $('v7-r-remove').addEventListener('click',()=>call(async()=>{
  const id=$('v7-r-list').value;
  if(!id)throw Error('请先选择要删除的关系');
  coordinator.deleteRelation(id);
  $('v7-r-list').value='';
  msg('关系已删除，原有关系残差结论失效。');
 }));
 for(const id of ['v7-r-id','v7-r-a','v7-r-b','v7-r-distance','v7-r-kind']){
  for(const evt of ['input','change'])$(''+id).addEventListener(evt,()=>{
   const snap=coordinator?.snapshot();
   if(snap?.task!=='composition')return;
   const selected=$('v7-r-list').value;
   if(selected&&(snap.relations||[]).some(r=>r.id===selected&&r.confirmed)){
    coordinator.deleteRelation(selected);
    $('v7-r-list').value='';
    msg('修改了关系输入，原有已确认残差结论失效；请重新提交。');
   }
  });
 }

 $('v7-c-new').addEventListener('click',()=>{
  $('v7-c-objects').value='';
  $('v7-c-id').value='Object'+String((coordinator?.snapshot().objects.length||0)+1);
 });
 $('v7-c-objects').addEventListener('change',()=>{
  const p=coordinator?.snapshot(),id=$('v7-c-objects').value;
  const c=p?.conditions.find(c=>c.objectId===id);
  if(c?.value?.geometry)compositionFormFrom(c.value.geometry);
  else if(id)$('v7-c-id').value=id;
  if(id)coordinator?.selectObject(id);
 });
 $('v7-c-stage').addEventListener('click',()=>call(async()=>{
  if(coordinator?.snapshot().task!=='composition')throw Error('请先选择多对象编辑任务');
  const {geometry,model}=compositionCandidate(),p=coordinator.snapshot();
  const chosen=$('v7-c-objects').value;
  if(chosen&&chosen!==model.id)throw Error('改名请先删除旧对象，再建立新的稳定对象 ID');
  if(p.objects.some(x=>x.id===model.id)&&chosen!==model.id)
   throw Error('项目中已存在此对象 ID，请选择已有对象或输入新的 ID');
  if(!p.objects.some(x=>x.id===model.id))coordinator.putObject(model);
  else coordinator.putObject(model);
  coordinator.putCondition({id:'geo_'+geometry.id,objectId:geometry.id,
   sourceCandidateId:$('v7-source-link').value||null,confirmed:false,
   value:{type:'manual-geometry',unit:'mm',imageId:p.source.imageId,geometry}});
  $('v7-c-objects').value=geometry.id;
  msg('几何 '+geometry.id+' 已暂存，必须点击确认才能显示场景。');
 }));
 $('v7-c-confirm').addEventListener('click',()=>call(async()=>{
  if(coordinator?.snapshot().task!=='composition')throw Error('请先进入多对象编辑');
  const id=$('v7-c-objects').value||$('v7-c-id').value.trim();
  coordinator.confirmCondition('geo_'+id);
  msg('对象 '+id+' 已由人工确认；场景预览仍不代表已求解。');
 }));
 $('v7-c-remove').addEventListener('click',()=>call(async()=>{
  if(coordinator?.snapshot().task!=='composition')throw Error('当前不是多对象项目');
  const id=$('v7-c-objects').value;
  if(!id)throw Error('先从列表选择要删除的对象');
  coordinator.deleteObject(id);$('v7-c-objects').value='';
  msg('已删除 '+id+'，全部旧几何预览失效。');
 }));
 $('v7-c-render').addEventListener('click',()=>call(async()=>{
  if(coordinator?.snapshot().task!=='composition')throw Error('当前不是多对象项目');
  stopAnimation();
  const result=session.solve();
  if(result.kind!=='composition-evidence'||result.verified!==false||
      result.clock!==null||coordinator.canExport())
   throw Error('手工几何被错误授予解题证明资格');
  msg('已显示 '+result.scene.objects.length+' 个几何对象；M2 关系残差：'+
   result.relationEvidence.status+'（'+result.relationEvidence.checkedCount+
   ' 条）。未求未知量，V5 禁用。');
 }));
 for(const id of compositionFields)
  for(const event of ['input','change'])$(id).addEventListener(event,()=>{
   if(!coordinator||coordinator.snapshot().task!=='composition'||id==='v7-c-id')return;
   const selected=$('v7-c-objects').value;
   const row=coordinator.snapshot().conditions.find(c=>c.objectId===selected);
   if(row){
    coordinator.deleteCondition(row.id);
    msg('对象字段已修改：旧确认与预览失效，请重新保存并确认。');
   }
  });

 $('v7-stage-other').addEventListener('click',()=>call(async()=>{
  if(!coordinator)throw Error('请先新建本机项目');
  const task=coordinator.snapshot().task;
  if(task==='projection')throw Error('点投影请使用上方坐标入口');
  const object=taskObjects[task];
  if(!object)throw Error('尚未开放的专业求解任务');
  if(!coordinator.snapshot().objects.some(o=>o.id===object.id))
   coordinator.putObject(object);
  const imageId=coordinator.snapshot().source.imageId;
  coordinator.putCondition({id:'coords',objectId:object.id,
   sourceCandidateId:$('v7-source-link').value||null,
   confirmed:false,value:fieldsToValue(task,imageId)});
  msg('几何输入已存为候选；请亲自核对原题、尺寸及所选分支。');
 }));
 $('v7-confirm-other').addEventListener('click',()=>call(async()=>{
  if(!coordinator||coordinator.snapshot().task==='projection')
   throw Error('当前没有可确认的专业输入');
  coordinator.confirmCondition('coords');
  msg('数学条件已人工确认；现在可调用已有专业 M3。');
 }));
 $('v7-solve-other').addEventListener('click',()=>call(async()=>{
  if(!coordinator||coordinator.snapshot().task==='projection')
   throw Error('专业求解任务未选择');
  stopAnimation();
  const result=session.solve();
  if(result.verified===true&&coordinator.currentResult()===result)
   msg('现有 M3→ConstructionIntent→V5 已验算 · v'+result.inputRevision);
  else if(result.kind==='prism-evidence'&&result.verified===false)
   msg('仅取得 M3 局部截切证据与长方体线框；禁止播放或导出完整答案。');
  else throw Error('专业数学结果未通过门禁');
 }));
 for(const id of allConditionFields){
  for(const type of ['input','change'])$(id).addEventListener(type,()=>{
   if(!coordinator)return;
   // Merely typing a new input must destroy any old verified math.
   if(coordinator.snapshot().conditions.some(c=>c.id==='coords')){
    stopAnimation();coordinator.deleteCondition('coords');
    msg('条件字段已编辑；旧解和动画已失效，请重新提交并人工确认。');
   }
  });
 }

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
  coordinator.putCondition({id:'coords',objectId:POINT,
   sourceCandidateId:$('v7-source-link').value||null,
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
  coordinator.setImage(id);
  photoMarkers=[[],[]];await saving;await showPhoto();
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
  const data=playback();if(!data)return;
  data.clock.setSpeed(Number($('v7-speed').value),performance.now());render();
 });
 $('v7-seek').addEventListener('input',()=>{
  const data=playback();if(!data)return;
  stopAnimation();data.clock.seekProgress(Number($('v7-seek').value)/1000,performance.now());render();
 });
 $('v7-play').addEventListener('click',()=>{
  const data=playback();if(!data)return;
  if(data.clock.snapshot().playing){stopAnimation();render();}
  else start();
 });
 $('v7-back').addEventListener('click',()=>{
  const data=playback();if(!data)return;
  stopAnimation();
  const elapsed=data.clock.snapshot().elapsedMs;
  const starts=[0,...data.plan.timing.steps.map(s=>s.startMs)].filter(ms=>ms<elapsed-0.01);
  data.clock.seekMs(starts.length?starts[starts.length-1]:0,performance.now());render();
 });
 $('v7-next').addEventListener('click',()=>{
  const data=playback();if(!data)return;
  stopAnimation();
  const elapsed=data.clock.snapshot().elapsedMs;
  const next=data.plan.timing.steps.map(s=>s.endMs).find(ms=>ms>elapsed+0.01);
  data.clock.seekMs(next??data.plan.timing.totalMs,performance.now());render();
 });
 window.addEventListener('pagehide',()=>{stopAnimation();closePhoto();coordinator?.dispose();store?.close();});
 void call(boot);
})();
