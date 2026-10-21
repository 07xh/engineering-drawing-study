'use strict';
const {validateGeometry}=require('../contracts/geometry.js');
const {validAction}=require('../contracts/construction-step.js');
const {vec,finite}=require('../contracts/common.js');
/*
 Mathematical Arc2D: x right, y up; ccw increasing, cw decreasing (degrees).
 Legacy SVG arc renderer: x right, y down, startAngle < endAngle,
 screen-positive sweep clockwise. The old renderer cannot preserve a directed
 mathematical ccw traversal; for ccw we reverse endpoints to render the
 same *undirected locus*. Never advertise the returned action as an
 orientation-preserving mathematical construction.
*/
function toLegacySvgArc(arc,{origin,scale,style='result'}={}){
 const check=validateGeometry(arc);
 if(!check.ok||arc.kind!=='arc')throw Error('必须提供有效的二维模型圆弧');
 if(!vec(origin,['x','y'])||!finite(scale)||scale<=0)throw Error('必须提供有效的像素原点与正比例');
 const d=arc.data,ccw=d.direction==='ccw';
 const startAngle=ccw?-d.endAngle:-d.startAngle;
 const endAngle=ccw?-d.startAngle:-d.endAngle;
 const action={kind:'arc',style,geometry:{
  cx:origin.x+scale*d.center.x,cy:origin.y-scale*d.center.y,
  r:scale*d.radius,startAngle,endAngle
 }};
 if(!validAction(action))throw Error('模型圆弧超出旧 SVG 动作接口可表示范围');
 return {action,orientationPreserved:!ccw,sourceArcId:arc.id,
  warning:ccw?'旧 SVG 仅能递增屏幕角，端点顺序已反转；仅保存圆弧轨迹，不能用于证明模型逆时针方向。':null};
}
module.exports={toLegacySvgArc};
