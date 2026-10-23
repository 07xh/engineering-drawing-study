'use strict';
/**
 * Experimental OCR-label -> two finite strokes -> circle/arc hypothesis.
 * Image-pixel proximity only. Neither joints nor arrowheads nor mm geometry
 * are verified. A final dimension still requires explicit human review.
 */
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const imageOk=i=>i&&Number.isSafeInteger(i.width)&&Number.isSafeInteger(i.height)&&
 i.width>=24&&i.height>=24&&i.width<=10000&&i.height<=10000;
const boxOk=(b,i)=>Array.isArray(b)&&b.length===4&&b.every(finite)&&
 b[0]>=0&&b[1]>=0&&b[2]>0&&b[3]>0&&
 b[0]+b[2]<=i.width&&b[1]+b[3]<=i.height;
const pointOk=(p,i)=>p&&finite(p.x)&&finite(p.y)&&p.x>=0&&p.y>=0&&
 p.x<=i.width&&p.y<=i.height;
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function boxDistance(p,b){
 const [x,y,w,h]=b;
 return Math.hypot(Math.max(0,x-p.x,p.x-(x+w)),
  Math.max(0,y-p.y,p.y-(y+h)));
}
function outlineDistance(p,b){
 const outside=boxDistance(p,b);
 if(outside>0)return outside;
 const [x,y,w,h]=b;
 return Math.min(p.x-x,x+w-p.x,p.y-y,y+h-p.y);
}
function eligibleLine(l,image){
 return l&&l.kind==='line'&&l.coordinateSpace==='original-image-px'&&
  /^line_[0-9]+$/.test(l.id||'')&&boxOk(l.bbox,image)&&
  pointOk(l.from,image)&&pointOk(l.to,image)&&
  distance(l.from,l.to)>=12;
}
function bentLeaderCandidates(dimension,lines,curves,image,{
 maxResults=12,maxJointGap=9,maxTextGap=38,maxOutlineGap=32,
 minTurnDeg=15,maxTurnDeg=145
}={}){
 if(!imageOk(image)||!dimension||dimension.kind!=='dimension'||
   dimension.coordinateSpace!=='original-image-px'||dimension.confirmed!==false||
   !boxOk(dimension.bbox,image)||!Array.isArray(lines)||lines.length>40||
   !Array.isArray(curves)||curves.length>50||
   !Number.isInteger(maxResults)||maxResults<1||maxResults>30||
   ![maxJointGap,maxTextGap,maxOutlineGap,minTurnDeg,maxTurnDeg].every(finite)||
   maxJointGap<0||maxJointGap>30||maxTextGap<0||maxTextGap>150||
   maxOutlineGap<0||maxOutlineGap>150||minTurnDeg<5||
   maxTurnDeg>170||minTurnDeg>=maxTurnDeg)
  throw new TypeError('invalid dimension, image or leader hypothesis bounds');
 const valid=lines.filter(l=>eligibleLine(l,image));
 const possible=curves.filter(c=>c&&['circle','arc'].includes(c.kind)&&
   /^curve_[0-9]+$/.test(c.id||'')&&
   c.coordinateSpace==='original-image-px'&&boxOk(c.bbox,image));
 const entries=[];
 for(const first of valid)for(const second of valid){
  if(first.id===second.id)continue;
  for(const firstReversed of [false,true]){
   const labelEnd=firstReversed?first.to:first.from;
   const jointA=firstReversed?first.from:first.to;
   const textGap=boxDistance(labelEnd,dimension.bbox);
   if(textGap>maxTextGap)continue;
   for(const secondReversed of [false,true]){
    const jointB=secondReversed?second.to:second.from;
    const tip=secondReversed?second.from:second.to;
    const jointGap=distance(jointA,jointB);
    if(jointGap>maxJointGap||
     boxDistance(tip,dimension.bbox)<=3)continue;
    const ux=jointA.x-labelEnd.x,uy=jointA.y-labelEnd.y;
    const vx=tip.x-jointB.x,vy=tip.y-jointB.y;
    const dot=(ux*vx+uy*vy)/(Math.hypot(ux,uy)*Math.hypot(vx,vy));
    const angle=Math.acos(Math.max(-1,Math.min(1,dot)))*180/Math.PI;
    if(!finite(angle)||angle<minTurnDeg||angle>maxTurnDeg)continue;
    const totalLength=Math.hypot(ux,uy)+Math.hypot(vx,vy);
    if(totalLength>Math.hypot(image.width,image.height)*.9)continue;
    for(const curve of possible){
     const curveGap=outlineDistance(tip,curve.bbox);
     if(curveGap>maxOutlineGap)continue;
     entries.push({
      dimensionId:dimension.id,
      firstLeaderCandidateId:first.id,
      secondLeaderCandidateId:second.id,
      finalTipEndpoint:secondReversed?'from':'to',
      geometryCandidateId:curve.id,
      textEndpointDistancePx:Number(textGap.toFixed(2)),
      jointEndpointDistancePx:Number(jointGap.toFixed(2)),
      curveOutlineDistancePx:Number(curveGap.toFixed(2)),
      turnDegrees:Number(angle.toFixed(1)),
      totalEndpointErrorPx:Number((textGap+jointGap+curveGap).toFixed(2)),
      hypothesis:'two-finite-stroke-bent-leader-unverified',
      jointsVerified:false,arrowheadVerified:false,
      geometryConfirmed:false,requiresHumanReview:true,
      coordinateSpace:'original-image-px'
     });
    }
   }
  }
 }
 entries.sort((a,b)=>a.totalEndpointErrorPx-b.totalEndpointErrorPx||
  a.firstLeaderCandidateId.localeCompare(b.firstLeaderCandidateId)||
  a.secondLeaderCandidateId.localeCompare(b.secondLeaderCandidateId)||
  a.geometryCandidateId.localeCompare(b.geometryCandidateId));
 const unique=new Set(),results=[];
 for(const x of entries){
  // A single labelled path can contain the same candidate in reverse order.
  const key=x.dimensionId+'|'+x.firstLeaderCandidateId+'|'+
   x.secondLeaderCandidateId+'|'+x.geometryCandidateId;
  if(unique.has(key))continue;
  unique.add(key);results.push(x);
  if(results.length>=maxResults)break;
 }
 return results;
}
module.exports={bentLeaderCandidates};
