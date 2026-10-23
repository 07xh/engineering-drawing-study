'use strict';
/**
 * Local image measurement scale gate, not optical recognition or a math proof.
 * Two independently supplied pixel-distance ↔ millimetre-distance pairs must
 * agree before the project can store a confirmed scale. The original image
 * never leaves the device, and this cannot validate what the photograph depicts.
 */
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const TOLERANCE=0.02;
function reviewDoubleScale(rows){
 if(!Array.isArray(rows)||rows.length!==2)throw new Error('必须提供两组独立的图像尺度量测');
 const values=rows.map((m,index)=>{
  if(!m||!finite(m.pixelDistance)||!finite(m.mmDistance)||
    m.pixelDistance<=0||m.mmDistance<=0||
    m.pixelDistance>1e7||m.mmDistance>1e7)
   throw new Error('第 '+(index+1)+' 组像素与毫米长度必须是有效正数');
  const mmPerPixel=m.mmDistance/m.pixelDistance;
  if(!finite(mmPerPixel)||mmPerPixel<1e-8||mmPerPixel>1e8)
   throw new Error('第 '+(index+1)+' 组模型与图片比例超出可验证范围');
  return {pixelDistance:m.pixelDistance,mmDistance:m.mmDistance,mmPerPixel};
 });
 const mmPerPixel=(values[0].mmPerPixel+values[1].mmPerPixel)/2;
 const relativeDisagreement=
   Math.abs(values[0].mmPerPixel-values[1].mmPerPixel)/mmPerPixel;
 if(!finite(mmPerPixel)||!finite(relativeDisagreement)||
    relativeDisagreement>TOLERANCE)
  throw new Error('两组独立比例不一致（超过 2%），请重新量测原图');
 return Object.freeze({mmPerPixel,confirmedBy:'ManualTwoScale',
  method:'manual-two-scale',
  measurements:values.map(({pixelDistance,mmDistance})=>
   Object.freeze({pixelDistance,mmDistance})),
  relativeDisagreement});
}
function validSavedCalibration(c){
 if(!c||!finite(c.mmPerPixel)||c.mmPerPixel<=0||
    typeof c.confirmedBy!=='string')return false;
 // Historical projects may have only a single ratio. Preserve readable files,
 // but do not upgrade those records to two-scale-reviewed status.
 if(c.method===undefined&&c.measurements===undefined&&
    c.relativeDisagreement===undefined)return true;
 if(c.method!=='manual-two-scale'||c.confirmedBy!=='ManualTwoScale'||
    !Array.isArray(c.measurements)||c.measurements.length!==2||
    !finite(c.relativeDisagreement)||c.relativeDisagreement<0)
  return false;
 try{
  const recalculated=reviewDoubleScale(c.measurements);
  return Math.abs(c.mmPerPixel-recalculated.mmPerPixel)/
    recalculated.mmPerPixel<=1e-12&&
   Math.abs(c.relativeDisagreement-recalculated.relativeDisagreement)<=1e-12&&
   Object.keys(c).every(k=>['mmPerPixel','confirmedBy','method','measurements',
     'relativeDisagreement'].includes(k));
 }catch{return false;}
}
module.exports={reviewDoubleScale,validSavedCalibration,TOLERANCE};
