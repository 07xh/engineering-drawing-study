'use strict';
/** Local image RGBA inspection and untrusted line preview, no OCR or math. */
const {detectLineCandidates}=require('../recognition/local-line-candidates.cjs');
const {mapLeaderCandidate}=require('../recognition/dimension-leader-association.cjs');
const SVG='http://www.w3.org/2000/svg';
function attachLocalLineCandidates({
 image,photoInput,photoClear,run,clear,overlay,status,onCandidates=()=>{}
}){
 let lines=[];
 function reset(){
  lines=[];overlay.replaceChildren();overlay.hidden=true;onCandidates([]);
  status.textContent='尚未分析图片。检测只在本机运行；候选线段不代表已验证的数学条件。';
 }
 photoInput.addEventListener('change',reset);
 photoClear.addEventListener('click',reset);
 image.addEventListener('load',reset);
 image.addEventListener('error',reset);
 clear.addEventListener('click',reset);
 run.addEventListener('click',()=>{
  reset();
  const originalW=image.naturalWidth,originalH=image.naturalHeight;
  if(image.hidden||!Number.isSafeInteger(originalW)||
     !Number.isSafeInteger(originalH)||originalW<24||originalH<24){
   status.textContent='请先加载清晰的本地题图。';return;
  }
  const scale=Math.min(1,640/Math.max(originalW,originalH));
  const width=Math.floor(originalW*scale),height=Math.floor(originalH*scale);
  if(width<24||height<24){
   status.textContent='图片长宽比例过大，暂不支持检测。';return;
  }
  try{
   const canvas=document.createElement('canvas');
   canvas.width=width;canvas.height=height;
   const ctx=canvas.getContext('2d',{willReadFrequently:true});
   if(!ctx)throw new Error('canvas 2D unavailable');
   ctx.fillStyle='#fff';ctx.fillRect(0,0,width,height);
   ctx.drawImage(image,0,0,width,height);
   const rgba=ctx.getImageData(0,0,width,height);
   lines=detectLineCandidates({width,height,data:rgba.data},{
    minLength:Math.max(24,Math.floor(Math.min(width,height)*.17)),
    maxCandidates:16
   });
   overlay.setAttribute('viewBox','0 0 '+originalW+' '+originalH);
   for(const l of lines){
    const node=document.createElementNS(SVG,'line');
    for(const [key,value] of Object.entries({
     x1:l.from.x*originalW/width,y1:l.from.y*originalH/height,
     x2:l.to.x*originalW/width,y2:l.to.y*originalH/height,
     stroke:'#8b4eb2','stroke-width':3,'stroke-dasharray':'9 5',
     'data-unconfirmed-line':l.id
    }))node.setAttribute(key,String(value));
    overlay.append(node);
   }
   overlay.hidden=false;
   onCandidates(lines.map(x=>mapLeaderCandidate(x,
    {width,height},{width:originalW,height:originalH})),{
     raw:lines,analysis:{width,height},original:{width:originalW,height:originalH}
    });
   status.textContent='本地检测得到 '+lines.length+
    ' 条直线候选（紫色虚线）；仅供对照，可能漏检或误检。' +
    '不能直接作为毫米几何或标准答案，仍需人工核对。';
  }catch(e){
   reset();status.textContent='本地候选检测失败：'+
    (e instanceof Error?e.message:'无法解析图像');
  }
 });
 reset();
 return Object.freeze({reset,get count(){return lines.length}});
}
module.exports={attachLocalLineCandidates};
