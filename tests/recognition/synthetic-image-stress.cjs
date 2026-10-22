'use strict';
/**
 * Self-generated scan-like image perturbations for repeatable QA only.
 * These do NOT model the distribution of real student phone photographs.
 */
function perturb(frame,variant){
 if(!frame||!Number.isSafeInteger(frame.width)||
  !Number.isSafeInteger(frame.height)||!frame.data||
  frame.data.length!==frame.width*frame.height*4)
  throw new TypeError('well-formed RGBA frame required');
 if(!['low-contrast','paper-gradient','speckle','ink-gaps'].includes(variant))
  throw new RangeError('unknown bounded synthetic image perturbation');
 const {width:w,height:h}=frame,bytes=new Uint8ClampedArray(frame.data);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const idx=4*(y*w+x);
  const original=frame.data[idx];
  const originalIsInk=original<125;
  let value=original;
  if(variant==='low-contrast')value=originalIsInk?110:224;
  if(variant==='paper-gradient')
   value=originalIsInk?15:Math.round(210+42*x/Math.max(1,w-1));
  if(variant==='speckle'){
   // Deterministic salt noise, no randomness and no use of original photos.
   const code=(x*131+y*367+x*y*17)%1009;
   if(code<6)value=28;
   else if(originalIsInk)value=12;
  }
  if(variant==='ink-gaps'&&originalIsInk&&
   (x*29+y*13)%17===0)value=255;
  bytes[idx]=bytes[idx+1]=bytes[idx+2]=value;
  bytes[idx+3]=255;
 }
 return {width:w,height:h,data:bytes};
}
module.exports={perturb};
