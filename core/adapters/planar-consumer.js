'use strict';
// Opt-in conversion only: do not reinterpret finite arcs as full circles.
const {validateGeometry}=require('../contracts/geometry.js');
const {validateConstraint}=require('../contracts/constraint.js');
const {identifier}=require('../contracts/common.js');
function toIntersectionConstraint(geometry,targetId,source='given'){
 const valid=validateGeometry(geometry);
 if(!valid.ok)throw Error('二维输入图元无效：'+valid.errors.join('；'));
 if(geometry.space!=='drawing-2d'||!['line','circle'].includes(geometry.kind))
  throw Error('当前交会计算仅允许完整直线/圆；有限 Arc2D 尚未实现');
 if(!identifier(targetId))throw Error('目标点编号无效');
 const d=geometry.data;
 let data;
 if(geometry.kind==='line'){
  const {x,y}=d.direction, length=Math.hypot(x,y);
  const a=-y/length,b=x/length;
  data={a,b,offset:a*d.point.x+b*d.point.y};
 }else data={x:d.center.x,y:d.center.y,r:d.radius};
 const result={id:'c_'+geometry.id,scope:'point-2d-intersection',type:geometry.kind,
  data,targetIds:[targetId],source};
 const check=validateConstraint(result);
 if(!check.ok)throw Error('二维交会约束无效：'+check.errors.join('；'));
 return result;
}
module.exports={toIntersectionConstraint};
