'use strict';
const {createPhotoQualitySession}=require('../recognition/photo-quality-session.cjs');
const {createManualPhotoAnnotation}=
 require('./photo-qa-annotation-gestures.cjs');
const {imagePointFromClient,createPhotoQaGesture}=
 require('./photo-qa-pointer-geometry.cjs');
const {detectBrowserDimensionCandidates}=
 require('../recognition/browser-native-dimension-ocr.cjs');
const {fingerprintLocalPhoto,fingerprintManualTruth}=
 require('../recognition/local-photo-fingerprint.cjs');
const {createPhotoQaBaseline,comparePhotoQaBaseline}=
 require('../recognition/photo-qa-baseline.cjs');
const {createAnnotationPack}=
 require('../recognition/photo-annotation-replay.cjs');
(function(){
 const $=id=>document.getElementById(id);
 const svgNs='http://www.w3.org/2000/svg';
 const session=createPhotoQualitySession();
 const image=$('qaImage'),overlay=$('qaOverlay'),stage=$('qaStage');
 const viewport=$('qaViewport'),gesture=createPhotoQaGesture();
 const status=$('status'),table=$('metrics');
 let imageUrl=null,generation=0,zoom=1,ocrRequest=0,comparisonRevision=null;
 function message(value){status.textContent=value;}
 const numbers=n=>n===null||n===undefined?'—':
  typeof n==='number'?Number(n.toFixed(3)).toString():String(n);
 function node(name,attrs={}){
  const e=document.createElementNS(svgNs,name);
  for(const [key,value] of Object.entries(attrs))
   e.setAttribute(key,String(value));
  return e;
 }
 function addShape(kind,data,color,dashed){
  const base={stroke:color,'stroke-width':2.4,fill:'none',
   ...(dashed?{'stroke-dasharray':'7 5'}:{})};
  let element;
  if(kind==='line')element=node('line',{...base,
   x1:data.from.x,y1:data.from.y,x2:data.to.x,y2:data.to.y});
  else if(kind==='circle')element=node('circle',{...base,
   cx:data.center.x,cy:data.center.y,r:data.radius});
  else if(kind==='arc'){
   const deg=(data.coverageDeg||120)*Math.PI/180;
   const center=data.center,r=data.radius;
   element=node('path',{...base,
    d:'M '+(center.x+r)+' '+center.y+' A '+r+' '+r+
     ' 0 '+(deg>Math.PI?1:0)+' 1 '+
     (center.x+r*Math.cos(deg))+' '+(center.y+r*Math.sin(deg))});
  }else if(kind==='dimension')element=node('rect',{...base,
   x:data.bbox[0],y:data.bbox[1],width:data.bbox[2],height:data.bbox[3]});
  else if(kind==='arrow')element=node('circle',{...base,
   cx:data.tip.x,cy:data.tip.y,r:5});
  if(element)overlay.append(element);
 }
 function draw(){
  const snapshot=session.snapshot();
  overlay.replaceChildren();
  if(!snapshot.ready)return;
  overlay.setAttribute('viewBox','0 0 '+snapshot.image.width+' '+
   snapshot.image.height);
  overlay.setAttribute('preserveAspectRatio','none');
  for(const a of snapshot.predictions)
   addShape(a.kind,a,'#a161bb',true);
  for(const a of snapshot.annotations)
   addShape(a.kind,a,'#18764c',false);
  const drag=gesture.snapshot();
  if(drag?.last&&drag.kind!=='arrow'){
   try{
    const tentative=createManualPhotoAnnotation(drag.kind,
     drag.start,drag.last,{
      text:$('qaText').value,
      coverageDeg:Number($('qaCoverage').value)
     });
    addShape(tentative.kind,tentative,'#d98c2e',true);
   }catch(_){/* A short drag is not a valid annotation. */}
  }
 }
 function render(){
  draw();
  const r=session.report(),s=session.snapshot();
  if(comparisonRevision!==s.revision){
   $('qaDiff').textContent='';comparisonRevision=null;
  }
  table.replaceChildren();
  if(r.status==='no-image'){
   const p=document.createElement('p');p.textContent='请先选择图片并运行本地识别。';
   table.append(p);return;
  }
  if(r.status==='needs-evaluable-annotations'){
   const p=document.createElement('p');
   p.textContent='已标注尺寸文字，但当前照片尚未运行受支持的 OCR 文字识别，'+
    '因此不能把文字标注算成“漏检”。请标注直线、圆、圆弧或箭头后计算；'+
    '尺寸识别暂显示“未评测”。';
   table.append(p);return;
  }
  if(r.status==='needs-manual-annotations'){
   const p=document.createElement('p');
   p.textContent='已得到 '+r.predictionCount+
    ' 个待确认图元候选；请在右侧原图上标注至少一个真实图元后再计算指标。';
   table.append(p);return;
  }
  const p=document.createElement('p');
  p.textContent='人工真值 '+s.annotations.length+' 个 · 检测候选 '+
   s.predictions.length+' 个 · 格式错误被拒候选 '+s.rejectedPredictions.length+
   ' 个。';
  table.append(p);
  const noOCR=document.createElement('p');
  noOCR.textContent='本次实际运行：直线、圆、圆弧、疑似箭头。'+
   (r.notRunKinds.includes('dimension')?
    '尺寸文字 OCR 未运行，排除在召回率分母之外；待评测文字标注 '+
     r.unevaluatedAnnotations.length+' 个。':
    '浏览器原生 OCR 已运行；尺寸文字已纳入本张图的对照统计。');
  table.append(noOCR);
  const coverage=document.createElement('p');
  coverage.textContent='只有已被人工标注的图元类别参与误检统计；'+
   '其他类别尚未评测。所选类别也应标齐全部真实对象。';
  table.append(coverage);
  const t=document.createElement('table');
  const head=document.createElement('tr');
  for(const key of ['类型','命中','误检','漏检','精确率','召回率','F1']){
   const h=document.createElement('th');h.textContent=key;head.append(h);
  }
  t.append(head);
  for(const [name,item] of [...Object.entries(r.metrics.byKind),['全部',r.metrics.micro]]){
   if(name!=='全部'&&item.tp+item.fp+item.fn===0)continue;
   const line=document.createElement('tr');
   for(const v of [name,item.tp,item.fp,item.fn,
    item.precision===null?null:item.precision*100,
    item.recall===null?null:item.recall*100,
    item.f1===null?null:item.f1*100]){
    const cell=document.createElement('td');
    cell.textContent=v===null?'—':numbers(v);
    line.append(cell);
   }
   t.append(line);
  }
  table.append(t);
  const caption=document.createElement('p');
  caption.textContent='比率列为百分数。未匹配人工标注：'+
   r.metrics.unmatchedTruth.map(x=>x.id).join('、')+
   '；额外检测候选：'+
   r.metrics.unmatchedPredictions.map(x=>x.id).join('、')+
   '。单人标注未经独立审核，不代表真实世界模型准确率。';
  table.append(caption);
 }
 function clearImage(){
  generation++;ocrRequest++;$('qaOcr').disabled=false;
  gesture.reset();setZoom(1);session.reset();
  if(imageUrl){URL.revokeObjectURL(imageUrl);imageUrl=null;}
  image.removeAttribute('src');
  image.onload=null;image.onerror=null;
  stage.hidden=true;
  render();
 }
 $('qaFile').addEventListener('change',()=>{
  clearImage();
  const file=$('qaFile').files?.[0];
  if(!file){message('图片已清空。');return;}
  if(!['image/jpeg','image/png','image/webp'].includes(file.type)||
   file.size>15*1024*1024||file.size===0){
   message('仅允许本地 JPG/PNG/WebP 且大小不超过 15 MB 的图片。');return;
  }
  const epoch=generation;
  image.onload=()=>{
   if(epoch!==generation)return;
   if(!image.naturalWidth||!image.naturalHeight){
    message('本地图片无法解码。');return;
   }
   stage.hidden=false;
   message('图片已在本地打开。点击“运行本地识别”，之后在图上标注真值。');
  };
  image.onerror=()=>{
   if(epoch!==generation)return;
   stage.hidden=true;message('图片解码失败，请换一张图片。');
  };
  imageUrl=URL.createObjectURL(file);
  image.src=imageUrl;
 });
 $('qaReset').addEventListener('click',()=>{
  $('qaFile').value='';clearImage();message('照片与所有旧标注已清除。');
 });
 $('qaAnalyze').addEventListener('click',()=>{
  ocrRequest++;$('qaOcr').disabled=false;
  if(stage.hidden||!image.naturalWidth||!image.naturalHeight){
   message('请先打开本地图片。');return;
  }
  try{
   const w0=image.naturalWidth,h0=image.naturalHeight;
   const scale=Math.min(1,640/Math.max(w0,h0));
   const width=Math.floor(w0*scale),height=Math.floor(h0*scale);
   if(width<32||height<32)throw new RangeError('图片长宽比例过大');
   const canvas=document.createElement('canvas');
   canvas.width=width;canvas.height=height;
   const ctx=canvas.getContext('2d',{willReadFrequently:true});
   if(!ctx)throw new Error('浏览器不支持本地 Canvas 2D');
   ctx.fillStyle='#fff';ctx.fillRect(0,0,width,height);
   ctx.drawImage(image,0,0,width,height);
   const pixels=ctx.getImageData(0,0,width,height);
   session.loadImage({width:w0,height:h0},{
    width,height,data:pixels.data
   });
   gesture.reset();
   render();
   message('本地检测已完成。现在标注真实图元；重新识别会清除旧标注。');
  }catch(error){
   session.reset();render();
   message('识别失败：'+(error instanceof Error?error.message:'未知错误'));
  }
 });
 $('qaOcr').addEventListener('click',async()=>{
  const before=session.snapshot();
  if(!before.ready||stage.hidden){
   message('请先打开图片并运行本地几何识别。');return;
  }
  const epoch=generation,imageVersion=before.imageVersion;
  const request=++ocrRequest;
  const button=$('qaOcr');
  button.disabled=true;
  message('正在尝试调用当前浏览器的原生 TextDetector…');
  let result;
  try{result=await detectBrowserDimensionCandidates(image);}
  catch(error){result={status:'error',candidates:[],
   reason:error instanceof Error?error.message:'native OCR failed'};}
  // Stale OCR must never be scored against a replacement or re-analyzed photo.
  if(epoch!==generation||session.snapshot().imageVersion!==imageVersion||
   request!==ocrRequest)return;
  button.disabled=false;
  if(result.status!=='ok'){
   message(result.status==='unsupported'?
    '当前浏览器没有原生 TextDetector：OCR 未评测，不会算成漏检。':
    '本地 OCR 无法完成：'+String(result.reason||result.status));
   return;
  }
  try{
   if(!session.acceptNativeOcr(imageVersion,result.candidates))return;
   render();
   message('浏览器原生 OCR 已运行，得到 '+result.candidates.length+
    ' 个 R/Φ 候选。请手工标注真实文字框对照；OCR 结果不等于数学答案。');
  }catch(error){
   message('OCR 候选校验失败：'+(error instanceof Error?error.message:'无效文字来源'));
  }
 });
 function setZoom(value){
  zoom=Math.min(3,Math.max(1,Number(value)||1));
  // Changing the image display width scales both image and SVG equally.
  // Pointer conversion uses the actual SVG client rect, not cached CSS dims.
  viewport.style.width=String(Math.round(zoom*100))+'%';
  $('qaZoomLevel').textContent=Math.round(zoom*100)+'%';
  gesture.reset();
  draw();
 }
 $('qaZoomIn').addEventListener('click',()=>setZoom(zoom+.25));
 $('qaZoomOut').addEventListener('click',()=>setZoom(zoom-.25));
 $('qaZoomReset').addEventListener('click',()=>{
  setZoom(1);stage.scrollLeft=0;stage.scrollTop=0;
 });
 function fromPointer(event){
  const size=session.snapshot().image;
  if(!size)return null;
  return imagePointFromClient(event,overlay.getBoundingClientRect(),size);
 }
 overlay.addEventListener('pointerdown',event=>{
  if(!session.snapshot().ready||event.pointerType==='mouse'&&event.button!==0)
   return;
  const result=gesture.down(event.pointerId,fromPointer(event),$('qaTool').value);
  if(result.status==='ignored')return;
  event.preventDefault();
  overlay.setPointerCapture?.(event.pointerId);
  if(result.status==='multitouch-cancelled'){
   draw();message('检测到多指接触，本次标注已取消。请使用单指拖动。');
  }
 });
 overlay.addEventListener('pointermove',event=>{
  if(gesture.move(event.pointerId,fromPointer(event)))draw();
 });
 overlay.addEventListener('pointerup',event=>{
  const result=gesture.up(event.pointerId,fromPointer(event));
  if(result.status==='completed'){
   try{
    const g=result.gesture;
    const annotation=createManualPhotoAnnotation(g.kind,g.start,g.last,{
     text:$('qaText').value,coverageDeg:Number($('qaCoverage').value)
    });
    const id=session.addAnnotation(annotation);
    message('已添加人工标注 '+id+'。可继续标注或导出本地报告。');
   }catch(error){
    message('标注未保存：'+(error instanceof Error?error.message:'坐标无效'));
   }
  }else if(result.status==='outside-cancelled'){
   message('抬起位置已离开图片，本次标注未保存。');
  }
  draw();render();
 });
 overlay.addEventListener('pointercancel',event=>{
  gesture.cancel(event.pointerId);draw();
 });
 overlay.addEventListener('lostpointercapture',event=>{
  gesture.cancel(event.pointerId);draw();
 });
 $('qaUndo').addEventListener('click',()=>{
  const a=session.snapshot().annotations;
  if(a.length){session.removeAnnotation(a[a.length-1].id);render();
   message('上一条人工标注已撤销。');}
 });
 $('qaClearTruth').addEventListener('click',()=>{
  session.clearAnnotations();render();message('人工标注已清除，检测结果仍保留。');
 });
 function downloadJson(value,filename){
  const blob=new Blob([JSON.stringify(value,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;a.download=filename;
  document.body.append(a);a.click();a.remove();
  URL.revokeObjectURL(url);
 }
 function replayToken(){
  const snap=session.snapshot();
  const file=$('qaFile').files?.[0];
  if(!snap.ready||!file||stage.hidden)return null;
  return {file,epoch:generation,imageVersion:snap.imageVersion,
   revision:snap.revision,snapshot:snap};
 }
 function replayStillCurrent(t){
  const now=session.snapshot();
  return generation===t.epoch&&now.ready&&
   now.imageVersion===t.imageVersion&&now.revision===t.revision&&
   $('qaFile').files?.[0]===t.file;
 }
 $('qaSaveTruth').addEventListener('click',async()=>{
  const t=replayToken();
  if(!t){message('请先打开原图并运行本地识别。');return;}
  if(t.snapshot.annotations.length===0){
   message('请先标注至少一个真实图元。');return;
  }
  const button=$('qaSaveTruth');button.disabled=true;
  try{
   // Hash only in response to this explicit export click.
   const sha=await fingerprintLocalPhoto(t.file);
   if(!replayStillCurrent(t))return;
   const pack=createAnnotationPack(t.snapshot,sha);
   downloadJson(pack,'draftai-photo-annotations.json');
   message('已在本地导出标注基准。包含图片 SHA-256 和手工输入文字，'+
    '可能具有识别性，不含原图字节或文件名。');
  }catch(error){
   if(replayStillCurrent(t))message('标注导出失败：'+
    (error instanceof Error?error.message:'未知错误'));
  }finally{button.disabled=false;}
 });
 $('qaLoadTruth').addEventListener('click',async()=>{
  const t=replayToken(),packFile=$('qaTruthFile').files?.[0];
  if(!t){message('请先打开原图并运行本地识别。');return;}
  if(!packFile||packFile.size===0||packFile.size>150*1024){
   message('请选择不超过 150 KB 的人工标注 JSON 文件。');return;
  }
  const button=$('qaLoadTruth');button.disabled=true;
  try{
   // Read only selected user files, never upload or auto-persist anything.
   const [sha,content]=await Promise.all([
    fingerprintLocalPhoto(t.file),packFile.text()
   ]);
   if(!replayStillCurrent(t))return;
   const pack=JSON.parse(content);
   const done=session.restoreAnnotations(t.imageVersion,pack,sha);
   if(!done)return;
   gesture.reset();render();
   message('已核对原图 SHA-256 和尺寸，恢复 '+
    session.snapshot().annotations.length+
    ' 条手工标注。当前检测候选与 OCR 执行状态保持不变。');
  }catch(error){
   if(replayStillCurrent(t))message('导入已拒绝，原标注保持不变：'+
    (error instanceof Error?error.message:'文件无效'));
  }finally{button.disabled=false;}
 });

 $('qaSaveBaseline').addEventListener('click',async()=>{
  const t=replayToken();
  if(!t||session.report().status!=='evaluated'){
   message('请先对原图标注并完成当前识图质量评测。');return;
  }
  const button=$('qaSaveBaseline');button.disabled=true;
  try{
   const [photoSha256,truthSha256]=await Promise.all([
    fingerprintLocalPhoto(t.file),
    fingerprintManualTruth(t.snapshot.annotations)
   ]);
   if(!replayStillCurrent(t))return;
   const baseline=createPhotoQaBaseline({
    snapshot:t.snapshot,report:session.report(),photoSha256,truthSha256
   });
   downloadJson(baseline,'draftai-photo-qa-baseline.json');
   message('已保存单张图的识图质量基线。仅含图片及标注指纹、各类 TP/FP/FN，'+
    '不包含照片或原图文件名；指纹仍可能具有识别性。');
  }catch(error){
   if(replayStillCurrent(t))message('基线保存失败：'+
    (error instanceof Error?error.message:'格式错误'));
  }finally{button.disabled=false;}
 });
 $('qaCompareBaseline').addEventListener('click',async()=>{
  const t=replayToken(),selected=$('qaBaselineFile').files?.[0];
  if(!t||session.report().status!=='evaluated'){
   message('请先检测原图并恢复或标齐人工真值。');return;
  }
  if(!selected||selected.size===0||selected.size>150*1024){
   message('请先选择有效且小于 150 KB 的基线 JSON 文件。');return;
  }
  const button=$('qaCompareBaseline');button.disabled=true;
  try{
   const [photoSha256,truthSha256,content]=await Promise.all([
    fingerprintLocalPhoto(t.file),
    fingerprintManualTruth(t.snapshot.annotations),
    selected.text()
   ]);
   if(!replayStillCurrent(t))return;
   const comparison=comparePhotoQaBaseline(JSON.parse(content),{
    snapshot:t.snapshot,report:session.report(),photoSha256,truthSha256
   });
   comparisonRevision=session.snapshot().revision;
   const rows=Object.entries(comparison.byKind).map(([kind,v])=>
    kind+'：命中变化 '+(v.deltaTP>=0?'+':'')+v.deltaTP+
    '，误检变化 '+(v.deltaFP>=0?'+':'')+v.deltaFP+
    '，漏检变化 '+(v.deltaFN>=0?'+':'')+v.deltaFN+
    '，召回变化 '+(v.deltaRecall===null?'不可比较':
     (v.deltaRecall*100).toFixed(2)+' 个百分点'));
   $('qaDiff').textContent='已确认同一图片、同一标注和相同检测范围。'+
    rows.join('；')+'。仅一张图的诊断变化，不代表普遍准确率提升。';
   message('基线比较完成。未改变当前标注、检测结果或数学解题状态。');
  }catch(error){
   if(replayStillCurrent(t)){
    $('qaDiff').textContent='';
    comparisonRevision=null;
    message('基线比较已拒绝：'+
     (error instanceof Error?error.message:'数据无效'));
   }
  }finally{button.disabled=false;}
 });
 $('qaExport').addEventListener('click',()=>{
  const r=session.report();
  if(r.status!=='evaluated'){message('请先运行检测并至少标注一个真实图元。');return;}
  // Explicit user-initiated download; no network, no persistence.
  const blob=new Blob([JSON.stringify(r,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;a.download='draftai-local-photo-qa.json';
  document.body.append(a);a.click();a.remove();
  URL.revokeObjectURL(url);
  message('已导出不含图片字节和原文件名的本地 JSON 评测报告。');
 });
 window.addEventListener('pagehide',clearImage);
 render();
})();
