'use strict';
/** Convert intentional pixel-pointer gestures to unverified ground truth labels.
 * Never infer engineering mm or accept OCR text as a proved mathematical fact.
 */
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const validPoint=p=>p&&finite(p.x)&&finite(p.y);
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function createManualPhotoAnnotation(kind,a,b,{
 text='',coverageDeg=120
}={}){
 if(!validPoint(a)||!validPoint(b))throw new TypeError('finite image-pixel pointers required');
 const from={x:Math.round(a.x*100)/100,y:Math.round(a.y*100)/100};
 const to={x:Math.round(b.x*100)/100,y:Math.round(b.y*100)/100};
 const separation=distance(from,to);
 switch(kind){
  case 'line':
   if(separation<5)throw new RangeError('line needs two separated points');
   return {kind,from,to};
  case 'circle':
  case 'arc':{
   const radius=separation;
   if(radius<5)throw new RangeError('circle needs positive radius');
   if(kind==='arc'&&(!finite(coverageDeg)||coverageDeg<10||coverageDeg>350))
    throw new RangeError('partial arc requires a checked sweep from 10 to 350 degrees');
   return {kind,center:from,radius,
    ...(kind==='arc'?{coverageDeg}:{})};
  }
  case 'dimension':{
   if(typeof text!=='string'||!text.trim()||text.length>80)
    throw new TypeError('human-confirmed transcribed image label required');
   const width=Math.abs(to.x-from.x),height=Math.abs(to.y-from.y);
   if(width<5||height<5)throw new RangeError('text label requires a real image box');
   return {kind,bbox:[Math.min(from.x,to.x),Math.min(from.y,to.y),
    width,height],text:text.trim()};
  }
  case 'arrow':return {kind,tip:from};
  default:throw new TypeError('unsupported manual image annotation kind');
 }
}
module.exports={createManualPhotoAnnotation};
