'use strict';
/**
 * 08 experimental local line *candidates* only — not a geometric solution.
 * Deterministic global threshold + bounded Hough + finite contiguous run.
 * No OCR, no remote calls, no pixel->mm conversion, no proof of visibility/G1.
 */
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const DEG=Math.PI/180;
function detectLineCandidates(frame,{minLength=24,maxCandidates=12}={}){
 if(!frame||!Number.isSafeInteger(frame.width)||!Number.isSafeInteger(frame.height)||
    frame.width<24||frame.height<24||frame.width>900||frame.height>900||
    !frame.data||frame.data.length!==frame.width*frame.height*4)
  throw new RangeError('bounded RGBA frame (24..900 each side) required');
 if(!finite(minLength)||minLength<12||minLength>500||
    !Number.isInteger(maxCandidates)||maxCandidates<1||maxCandidates>30)
  throw new RangeError('unsupported line detector options');
 const {width:w,height:h,data}=frame,n=w*h,hist=new Uint32Array(256);
 const grays=new Uint8Array(n);let min=255,max=0;
 for(let i=0;i<n;i++){
  const k=i*4,alpha=data[k+3]/255;
  const bright=(.2126*data[k]+.7152*data[k+1]+.0722*data[k+2])*alpha+
    255*(1-alpha);
  const v=Math.max(0,Math.min(255,Math.round(bright)));
  grays[i]=v;hist[v]++;min=Math.min(min,v);max=Math.max(max,v);
 }
 if(max-min<14)return [];
 // Otsu threshold, then clamp to avoid treating bright paper texture as ink.
 let weighted=0,total=n;for(let i=0;i<256;i++)weighted+=i*hist[i];
 let leftCount=0,leftSum=0,bestScore=-1,threshold=120;
 for(let i=0;i<256;i++){
  leftCount+=hist[i];leftSum+=i*hist[i];
  const right=total-leftCount;
  if(!leftCount||!right)continue;
  const diff=leftSum/leftCount-(weighted-leftSum)/right;
  const score=leftCount*right*diff*diff;
  if(score>bestScore){bestScore=score;threshold=i;}
 }
 const limit=Math.min(threshold+14,215),dark=[];
 for(let y=0;y<h;y++)for(let x=0;x<w;x++)
  if(grays[y*w+x]<=limit)dark.push({x,y});
 // Large black backgrounds or dense text/art are not trustworthy line drawings.
 if(dark.length<minLength||dark.length>n*.35)return [];
 const cap=22000,step=Math.max(1,Math.ceil(dark.length/cap));
 const sampled=dark.filter((_,i)=>i%step===0);
 const angles=60,diag=Math.ceil(Math.hypot(w,h))+2,bins=2*diag+1;
 const votes=new Uint16Array(angles*bins),trig=[];
 for(let t=0;t<angles;t++)trig.push({
  cos:Math.cos(t*3*DEG),sin:Math.sin(t*3*DEG)
 });
 for(const p of sampled)for(let t=0;t<angles;t++){
  const rho=Math.round(p.x*trig[t].cos+p.y*trig[t].sin)+diag;
  const index=t*bins+rho;
  if(votes[index]!==65535)votes[index]++;
 }
 const minimumVotes=Math.max(12,Math.floor(minLength/2/step));
 const peaks=[];
 for(let t=0;t<angles;t++)for(let r=0;r<bins;r++){
  const vote=votes[t*bins+r];
  if(vote>=minimumVotes)peaks.push({t,r:r-diag,vote});
 }
 peaks.sort((a,b)=>b.vote-a.vote);
 const results=[];
 for(const peak of peaks){
  if(results.length>=maxCandidates)break;
  const {cos:nx,sin:ny}=trig[peak.t],tx=-ny,ty=nx;
  const projected=[];
  for(const p of dark){
   const offset=Math.abs(p.x*nx+p.y*ny-peak.r);
   if(offset<=1.65)projected.push(p.x*tx+p.y*ty);
  }
  if(projected.length<minimumVotes)continue;
  projected.sort((a,b)=>a-b);
  let runStart=projected[0],runEnd=runStart,count=1,best={from:0,to:0,count:0};
  const flush=()=>{if(runEnd-runStart>best.to-best.from&&count>=8)
    best={from:runStart,to:runEnd,count};};
  for(let i=1;i<projected.length;i++){
   const value=projected[i];
   if(value-runEnd>3.4){flush();runStart=value;count=1;}
   else count++;
   runEnd=value;
  }
  flush();
  const length=best.to-best.from;
  if(length<minLength||best.count<Math.max(10,length*.18))continue;
  const from={x:nx*peak.r+tx*best.from,y:ny*peak.r+ty*best.from};
  const to={x:nx*peak.r+tx*best.to,y:ny*peak.r+ty*best.to};
  for(const p of [from,to]){
   p.x=Math.max(0,Math.min(w-1,Number(p.x.toFixed(2))));
   p.y=Math.max(0,Math.min(h-1,Number(p.y.toFixed(2))));
  }
  const span=Math.hypot(to.x-from.x,to.y-from.y);
  if(span<minLength-1)continue;
  const duplicate=results.some(old=>{
   const ax=old.to.x-old.from.x,ay=old.to.y-old.from.y;
   const bx=to.x-from.x,by=to.y-from.y;
   const parallel=Math.abs((ax*by-ay*bx)/(Math.hypot(ax,ay)*Math.hypot(bx,by)));
   const offset=Math.abs((from.x-old.from.x)*ay-(from.y-old.from.y)*ax)/Math.hypot(ax,ay);
   return parallel<.10&&offset<5&&
    Math.hypot((old.from.x+old.to.x)/2-(from.x+to.x)/2,
     (old.from.y+old.to.y)/2-(from.y+to.y)/2)<Math.max(span,
      Math.hypot(ax,ay))*.65;
  });
  if(duplicate)continue;
  results.push({kind:'line',coordinateSpace:'image-px',from,to,
   bbox:[Math.min(from.x,to.x),Math.min(from.y,to.y),
    Math.max(1,Math.abs(from.x-to.x)),Math.max(1,Math.abs(from.y-to.y))],
   confidence:Number(Math.min(.89,.25+.6*best.count/Math.max(span,1)).toFixed(3)),
   method:'binary-hough-candidate/0.1'});
 }
 return results.map((r,i)=>({id:'line_'+(i+1),...r}));
}
module.exports={detectLineCandidates};
