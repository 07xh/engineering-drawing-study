'use strict';
/**
 * Local raster V-wing evidence at already proposed finite line endpoints.
 * A dark V-shape is NOT a proven dimension arrow, calibrated measurement,
 * or reliable connector-to-geometry association.
 */
const finite=x=>typeof x==='number'&&Number.isFinite(x);
function detectArrowWingCandidates(frame,lines,{
 maxCandidates=16,minLineLength=28,inkThreshold=160
}={}){
 const w=frame?.width,h=frame?.height,data=frame?.data;
 if(!Number.isSafeInteger(w)||!Number.isSafeInteger(h)||w<32||h<32||
   w>900||h>900||!data||data.length!==4*w*h||
   !Array.isArray(lines)||lines.length>30||
   !Number.isInteger(maxCandidates)||maxCandidates<1||maxCandidates>30||
   !finite(minLineLength)||minLineLength<20||minLineLength>500||
   !Number.isInteger(inkThreshold)||inkThreshold<35||inkThreshold>220)
  throw new TypeError('bounded local RGBA and line candidates required');
 const ink=new Uint8Array(w*h);let occupied=0;
 for(let i=0;i<w*h;i++){
  const a=data[i*4+3]/255;
  const y=(.2126*data[i*4]+.7152*data[i*4+1]+.0722*data[i*4+2])*a+
   255*(1-a);
  if(y<=inkThreshold){ink[i]=1;occupied++;}
 }
 if(occupied<25||occupied>w*h*.32)return [];
 function darkAt(x,y){
  if(x<1||y<1||x>=w-1||y>=h-1)return false;
  const px=Math.round(x),py=Math.round(y);
  for(let v=-1;v<=1;v++)for(let u=-1;u<=1;u++){
   const xx=px+u,yy=py+v;
   if(xx>=0&&yy>=0&&xx<w&&yy<h&&ink[yy*w+xx])return true;
  }
  return false;
 }
 function wingSupport(tip,bx,by,angle,length,sign){
  const cosine=Math.cos(angle),sine=Math.sin(angle);
  const dx=bx*cosine-sign*by*sine,dy=by*cosine+sign*bx*sine;
  let hits=0,checked=0;
  for(let t=5;t<=length;t++){
   const x=tip.x+t*dx,y=tip.y+t*dy;
   if(x<1||x>=w-1||y<1||y>=h-1)return 0;
   checked++;if(darkAt(x,y))hits++;
  }
  return checked>=3?hits/checked:0;
 }
 const angles=[25,30,35,40,45].map(a=>a*Math.PI/180);
 const lengths=[8,11,14,17];
 const proposals=[];
 for(const line of lines){
  if(!line||line.kind!=='line'||line.coordinateSpace!=='image-px'||
   !/^line_[0-9]+$/.test(line.id||'')||
   !line.from||!line.to||
   ![line.from.x,line.from.y,line.to.x,line.to.y].every(finite))
   continue;
  const length=Math.hypot(line.to.x-line.from.x,line.to.y-line.from.y);
  if(length<minLineLength||length>Math.hypot(w,h))continue;
  for(const endpoint of ['from','to']){
   const tip=line[endpoint],other=line[endpoint==='from'?'to':'from'];
   if(tip.x<2||tip.y<2||tip.x>=w-2||tip.y>=h-2||
     other.x<0||other.y<0||other.x>=w||other.y>=h)continue;
   const bx=(other.x-tip.x)/length,by=(other.y-tip.y)/length;
   let best=null;
   for(const angle of angles)for(const wingsLength of lengths){
    const plus=wingSupport(tip,bx,by,angle,wingsLength,1);
    const minus=wingSupport(tip,bx,by,angle,wingsLength,-1);
    // Both wings need sustained ink beyond their shared vertex; one dark
    // branch, a bare straight shaft or a coincidental single slash is weak.
    if(Math.min(plus,minus)<.74)continue;
    const score=(plus+minus)/2;
    if(!best||score>best.score||
      (score===best.score&&wingsLength>best.length))
     best={score,length:wingsLength,angleDeg:Number((angle*180/Math.PI).toFixed(1)),
      supportLeft:Number(minus.toFixed(3)),
      supportRight:Number(plus.toFixed(3))};
   }
   if(!best)continue;
   proposals.push({
    id:'arrow_'+line.id+'_'+endpoint,
    shaftCandidateId:line.id,
    endpoint,
    tip:{x:tip.x,y:tip.y},
    coordinateSpace:'image-px',
    proposedWingLengthPx:best.length,
    proposedWingAngleDeg:best.angleDeg,
    inkSupportLeft:best.supportLeft,
    inkSupportRight:best.supportRight,
    heuristicScore:Number(Math.min(.89,best.score*.87).toFixed(3)),
    hypothesis:'two-local-dark-v-wings-unverified',
    arrowheadVerified:false,geometryConfirmed:false,
    requiresHumanReview:true
   });
  }
 }
 proposals.sort((a,b)=>b.heuristicScore-a.heuristicScore||
  a.shaftCandidateId.localeCompare(b.shaftCandidateId)||
  a.endpoint.localeCompare(b.endpoint));
 return proposals.slice(0,maxCandidates);
}
module.exports={detectArrowWingCandidates};
