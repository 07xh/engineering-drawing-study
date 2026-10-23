'use strict';
/** Pixel provenance under <img style="object-fit:contain">, no OCR or solver. */
const finite=x=>typeof x==='number'&&Number.isFinite(x);
function photoFit({width,height,left=0,top=0},naturalWidth,naturalHeight){
 if(![width,height,left,top,naturalWidth,naturalHeight].every(finite)||
    Math.min(width,height,naturalWidth,naturalHeight)<=0)
  throw new Error('原图尺寸或页面显示区域无效');
 const factor=Math.min(width/naturalWidth,height/naturalHeight);
 if(!finite(factor)||factor<=0)throw new Error('无法将原图对应到当前屏幕');
 const shownWidth=naturalWidth*factor,shownHeight=naturalHeight*factor;
 return {factor,left:left+(width-shownWidth)/2,top:top+(height-shownHeight)/2,
  width:shownWidth,height:shownHeight};
}
function clientToPhoto({clientX,clientY,rect,naturalWidth,naturalHeight}){
 if(!finite(clientX)||!finite(clientY))throw new Error('图片指针坐标无效');
 const fit=photoFit(rect,naturalWidth,naturalHeight);
 const x=(clientX-fit.left)/fit.factor,y=(clientY-fit.top)/fit.factor;
 if(x<0||y<0||x>naturalWidth||y>naturalHeight)
  throw new Error('请点选图片内容区域，不能选择两侧留白');
 return {x,y};
}
function measuredPixels(points){
 if(!Array.isArray(points)||points.length!==2||
    points.some(p=>!p||![p.x,p.y].every(finite)||p.x<0||p.y<0||
      p.x>1e7||p.y>1e7))
  throw new Error('量测必须包含原图内两个有效像素端点');
 const distance=Math.hypot(points[1].x-points[0].x,
  points[1].y-points[0].y);
 if(!finite(distance)||distance<=1e-6)
  throw new Error('量测端点必须分离，不能使用零长度');
 return distance;
}
module.exports={photoFit,clientToPhoto,measuredPixels};
