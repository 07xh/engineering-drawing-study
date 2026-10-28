'use strict';
/** Read-only, bounded UI label for a revision-bound Geometry source feature. */
const describeSourceFeature=({objectId,key}={})=>{
 if(typeof objectId!=='string'||!objectId||typeof key!=='string'||key.length>1024)
  return null;
 let parts;
 try{parts=JSON.parse(key);}catch(_){return null;}
 if(!Array.isArray(parts)||parts.length<2||parts.length>4||
    parts[0]!==objectId||typeof parts[1]!=='string')return null;
 const safeId=id=>typeof id==='string'&&id.length>0&&id.length<=48&&
  !/[\r\n\u0000-\u001f]/.test(id);
 if(parts[1]==='mesh-edge'&&parts.length===4&&
    safeId(parts[2])&&safeId(parts[3]))
  return '实体棱线 '+parts[2]+'—'+parts[3];
 if(parts[1]==='polyline-span'&&parts.length===3&&
    Number.isSafeInteger(parts[2])&&parts[2]>=0&&parts[2]<=100000)
  return '折线第 '+(parts[2]+1)+' 段';
 const types={
  point:'空间点',segment:'空间线段',line:'直线',
  circle:'圆',arc:'圆弧',mesh:'实体来源',
  polyline:'空间折线','analytic-curve':'空间相贯曲线来源'
 };
 return parts.length===2?(types[parts[1]]||'空间图元来源'):null;
};
module.exports={describeSourceFeature};
