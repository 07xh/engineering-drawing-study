'use strict';
/** On-device circle/arc proposals over a local photo; never a mm SolveResult. */
const {detectCurveCandidates}=require('../recognition/local-curve-candidates.cjs');
const {locateCandidate}=require('../recognition/source-candidate-link.cjs');
const SVG='http://www.w3.org/2000/svg';
function attachLocalCurveCandidates({image,photoInput,photoClear,
 run,clear,overlay,status,onCandidates=()=>{}}){
 let proposals=[];
 const reset=()=>{
  proposals=[];overlay.replaceChildren();overlay.hidden=true;onCandidates([]);
  status.textContent='尚未检测圆弧；紫色/蓝色候选只供参考，不是已验证图元。';
 };
 photoInput.addEventListener('change',reset);
 photoClear.addEventListener('click',reset);
 image.addEventListener('load',reset);
 image.addEventListener('error',reset);
 clear.addEventListener('click',reset);
 run.addEventListener('click',()=>{
  reset();
  const originalW=image.naturalWidth,originalH=image.naturalHeight;
  if(image.hidden||!Number.isSafeInteger(originalW)||
    !Number.isSafeInteger(originalH)||originalW<32||originalH<32){
   status.textContent='请先打开清晰的本地原题。';return;
  }
  const scale=Math.min(1,640/Math.max(originalW,originalH));
  const w=Math.floor(originalW*scale),h=Math.floor(originalH*scale);
  if(w<32||h<32){
   status.textContent='图片宽高比例超出当前检测能力。';return;
  }
  try{
   const canvas=document.createElement('canvas');
   canvas.width=w;canvas.height=h;
   const ctx=canvas.getContext('2d',{willReadFrequently:true});
   if(!ctx)throw new Error('Canvas 2D unavailable');
   ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);
   ctx.drawImage(image,0,0,w,h);
   proposals=detectCurveCandidates({width:w,height:h,
    data:ctx.getImageData(0,0,w,h).data});
   overlay.setAttribute('viewBox','0 0 '+originalW+' '+originalH);
   const sx=originalW/w,sy=originalH/h;
   for(const candidate of proposals){
    const cx=candidate.center.x*sx,cy=candidate.center.y*sy,
     rx=candidate.radius*sx,ry=candidate.radius*sy;
    let element;
    if(candidate.kind==='circle'){
     element=document.createElementNS(SVG,'ellipse');
     for(const [k,v] of Object.entries({cx,cy,rx,ry}))
      element.setAttribute(k,String(v));
    }else{
     const start=candidate.startAngle*Math.PI/180,
      end=candidate.endAngle*Math.PI/180;
     const x1=cx+rx*Math.cos(start),y1=cy+ry*Math.sin(start),
      x2=cx+rx*Math.cos(end),y2=cy+ry*Math.sin(end);
     element=document.createElementNS(SVG,'path');
     element.setAttribute('d','M '+x1+' '+y1+' A '+rx+' '+ry+
      ' 0 '+(candidate.sweepDeg>180?1:0)+' 1 '+x2+' '+y2);
    }
    element.setAttribute('fill','none');
    element.setAttribute('stroke',candidate.kind==='circle'?'#306fc1':'#9160bc');
    element.setAttribute('stroke-width','3');
    element.setAttribute('stroke-dasharray','8 5');
    element.setAttribute('data-unconfirmed-curve',candidate.id);
    overlay.append(element);
   }
   overlay.hidden=false;
   onCandidates(proposals.map(x=>locateCandidate(x,
    {width:w,height:h},{width:originalW,height:originalH})),{
     raw:proposals,analysis:{width:w,height:h},
     original:{width:originalW,height:originalH}
    });
   status.textContent='本地发现 '+proposals.filter(x=>x.kind==='circle').length+
    ' 个整圆候选、'+proposals.filter(x=>x.kind==='arc').length+
    ' 个圆弧候选。可能误检、漏检或把相交线当成其他轮廓；'+
    '中心/半径单位仍是图像像素，必须另行确认工程尺寸。';
  }catch(error){
   reset();status.textContent='圆/弧候选检测失败：'+
    (error instanceof Error?error.message:'未知图像错误');
  }
 });
 reset();
 return Object.freeze({reset,get count(){return proposals.length}});
}
module.exports={attachLocalCurveCandidates};
