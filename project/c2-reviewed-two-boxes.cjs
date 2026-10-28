'use strict';
// Human-checked C2 axis-box bounds into canonical shared composition Geometry.
const {prismMesh}=require('./unified-workbench-session.cjs');
const {validateGeometry}=require('../core/contracts/geometry.js');
function buildReviewedC2Boxes(boxes){
 if(!Array.isArray(boxes)||boxes.length!==2)
  throw new Error('需要恰好两个已知长方体');
 return boxes.map((box,index)=>{
  const id=index===0?'C2BoxA':'C2BoxB';
  if(!box||!Array.isArray(box.min)||!Array.isArray(box.max)||
    box.min.length!==3||box.max.length!==3||
    [...box.min,...box.max].some(v=>typeof v!=='number'||
      !Number.isFinite(v)||Math.abs(v)>100000)||
    box.min.some((v,i)=>v>=box.max[i]))
   throw new Error('长方体 '+(index+1)+' 必须提供有效的最小角和最大角（mm）');
  const v=a=>({x:a[0],y:a[1],z:a[2]});
  const mesh=prismMesh({solid:{min:v(box.min),max:v(box.max)}});
  const geometry={...mesh,id};
  const checked=validateGeometry(geometry);
  if(!checked.ok)throw new Error('长方体 '+(index+1)+' 几何不合法：'+checked.errors.join('；'));
  const model={id,kind:'solid',spatialId:id+'_3D',
   projections:{V:[id+'_V'],H:[id+'_H'],W:[id+'_W']}};
  return {id,geometry,model};
 });
}
module.exports={buildReviewedC2Boxes};
