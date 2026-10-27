'use strict';
/**
 * Human-editable C1 two-view source index pairing, NOT a geometry solver.
 *
 * All indices resolve ONLY to the currently selected GIVEN source packet.
 * We never accept CAD handles or the privately isolated answer as textual
 * correspondence input. On every edit the browser must invalidate its old
 * current M3/M5/sole-V5 before attempting a fresh independently checked graph.
 */
const {validateGivenPacket}=
 require('./c1-authenticated-dxf-to-reviewed-v5.cjs');
const indexLine=/^\s*(\d{1,2})(?:\s*[,，]\s*|\s+)(\d{1,2})\s*$/;
function listGivenSourceProjectionIndices(packet){
 validateGivenPacket(packet);
 const views=Object.keys(packet.views).sort();
 const source=packet.givenOriginalHandleEndpoints;
 return views.map(view=>'已知'+view+'视图：\n'+packet.views[view].map((p,i)=>{
  const origin=source[view][i];
  return '  '+i+': ('+p.u+', '+p.v+') mm  [原始 CAD '+
   origin.handle+':'+origin.endpoint+']';
 }).join('\n')).join('\n\n')+
 '\n\n二维投影点可以在多个三维角点中重复使用；'+
 '同一“两个二维索引”组合不得重复。'+
 '\n索引配对顺序：'+views[0]+'编号, '+views[1]+'编号。';
}
function stringifyReviewedSourcePairs(packet){
 validateGivenPacket(packet);
 const pairs=packet.reviewedCorrespondences;
 return pairs?pairs.map(x=>x.firstIndex+','+x.secondIndex).join('\n'):'';
}
function withEditedReviewedSourcePairs(packet,raw){
 validateGivenPacket(packet);
 if(typeof raw!=='string'||raw.length>2048)
  throw new TypeError('bounded local first-angle pair index lines required');
 const base={...packet};
 delete base.reviewedCorrespondences;
 const lines=raw.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
 if(lines.length){
  if(lines.length<4||lines.length>32)
   throw new RangeError('4..32 reviewed original 3D vertex index pairs required');
  base.reviewedCorrespondences=lines.map((line,i)=>{
   const match=indexLine.exec(line);
   if(!match)throw new TypeError('line '+(i+1)+
    ': enter exactly two 0-based projection point indices, separated by a comma');
   return {firstIndex:Number(match[1]),secondIndex:Number(match[2])};
  });
 }
 validateGivenPacket(base);
 return base;
}
module.exports={listGivenSourceProjectionIndices,
 stringifyReviewedSourcePairs,withEditedReviewedSourcePairs};
