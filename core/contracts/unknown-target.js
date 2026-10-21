'use strict';
/**
 * A pending mathematical target has an identity, dimensionality and units,
 * but deliberately NO coordinates. It must not be displayed as a given point.
 */
const {object,identifier,report}=require('./common.js');
function validateUnknownTarget(value){
 const errors=[];
 if(!object(value))return report(['UnknownTarget 必须是对象']);
 if(!identifier(value.id))errors.push('UnknownTarget.id 无效');
 if(value.kind!=='point')errors.push('UnknownTarget.kind 只支持 point');
 if(!['model-3d','drawing-2d'].includes(value.space))errors.push('UnknownTarget.space 无效');
 if(!['mm','unitless'].includes(value.unit))errors.push('UnknownTarget.unit 无效');
 if(Object.keys(value).some(key=>!['id','kind','space','unit'].includes(key)))
  errors.push('未知点不得预先提供坐标、伪造解或其他数据字段');
 return report(errors);
}
module.exports={validateUnknownTarget};
