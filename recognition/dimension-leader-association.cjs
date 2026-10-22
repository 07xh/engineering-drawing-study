'use strict';
/**
 * 08 V3.5: bounded text -> possible finite leader stroke -> circle/arc outline
 * hypothesis. These are UNVERIFIED image pixels, never calibrated millimetres,
 * verified arrowheads, or completed geometry constraints.
 */
const {locateCandidate}=require('./source-candidate-link.cjs');
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const dims=i=>i&&Number.isSafeInteger(i.width)&&Number.isSafeInteger(i.height)&&
 i.width>=24&&i.height>=24&&i.width<=10000&&i.height<=10000;
const box=(b,i)=>Array.isArray(b)&&b.length===4&&b.every(finite)&&
 b[0]>=0&&b[1]>=0&&b[2]>0&&b[3]>0&&
 b[0]+b[2]<=i.width&&b[1]+b[3]<=i.height;
const point=(p,i)=>p&&finite(p.x)&&finite(p.y)&&p.x>=0&&p.y>=0&&
 p.x<=i.width&&p.y<=i.height;
function mapLeaderCandidate(raw,analysis,original){
 const p=locateCandidate(raw,analysis,original);
 if(raw.kind!=='line'||!dims(analysis)||!dims(original)||
  !point(raw.from,analysis)||!point(raw.to,analysis))
  throw new TypeError('leader requires original 2D finite source endpoints');
 const sx=original.width/analysis.width,sy=original.height/analysis.height;
 const from={x:raw.from.x*sx,y:raw.from.y*sy};
 const to={x:raw.to.x*sx,y:raw.to.y*sy};
 if(Math.hypot(from.x-to.x,from.y-to.y)<10)
  throw new RangeError('leader candidate is too short');
 return Object.freeze({...p,
  from:Object.freeze(from),to:Object.freeze(to),
  leaderEvidence:'finite-line-endpoints-unconfirmed'});
}
function distanceToBox(p,b){
 const [x,y,w,h]=b;
 return Math.hypot(Math.max(0,x-p.x,p.x-(x+w)),
  Math.max(0,y-p.y,p.y-(y+h)));
}
function distanceToOutline(p,b){
 const [x,y,w,h]=b;
 const outside=distanceToBox(p,b);
 if(outside>0)return outside;
 return Math.min(p.x-x,x+w-p.x,p.y-y,y+h-p.y);
}
function rankLeaderLineLinks(dimension,lines,curves,image,{
 maxResults=12,maxTextDistance=40,maxOutlineDistance=35
}={}){
 if(!dims(image)||!dimension||dimension.kind!=='dimension'||
  dimension.coordinateSpace!=='original-image-px'||
  dimension.confirmed!==false||!box(dimension.bbox,image)||
  !Array.isArray(lines)||lines.length>40||
  !Array.isArray(curves)||curves.length>50||
  !Number.isInteger(maxResults)||maxResults<1||maxResults>30||
  !finite(maxTextDistance)||maxTextDistance<2||maxTextDistance>150||
  !finite(maxOutlineDistance)||maxOutlineDistance<2||maxOutlineDistance>150)
  throw new TypeError('invalid unconfirmed OCR/leader linking input');
 const result=[],seen=new Set();
 for(const line of lines){
  if(!line||line.kind!=='line'||
   line.coordinateSpace!=='original-image-px'||
   !/^line_[0-9]+$/.test(line.id||'')||
   !box(line.bbox,image)||!point(line.from,image)||!point(line.to,image))
   continue;
  const len=Math.hypot(line.to.x-line.from.x,line.to.y-line.from.y);
  if(len<12||len>Math.hypot(image.width,image.height)*.85)continue;
  // A leader may run from text to curve or from curve back toward text.
  const variants=[
   {text:line.from,tip:line.to,side:'from-text-to-tip'},
   {text:line.to,tip:line.from,side:'to-text-to-tip'}
  ];
  for(const oriented of variants){
   const textDistance=distanceToBox(oriented.text,dimension.bbox);
   if(textDistance>maxTextDistance)continue;
   // Prevent accepting tiny lines entirely inside printed text boxes.
   if(distanceToBox(oriented.tip,dimension.bbox)<=3)continue;
   for(const curve of curves){
    if(!curve||!['circle','arc'].includes(curve.kind)||
     !/^curve_[0-9]+$/.test(curve.id||'')||
     curve.coordinateSpace!=='original-image-px'||!box(curve.bbox,image))
     continue;
    const outlineDistance=distanceToOutline(oriented.tip,curve.bbox);
    if(outlineDistance>maxOutlineDistance)continue;
    const key=dimension.id+'|'+line.id+'|'+curve.id;
    const entry={
     dimensionId:dimension.id,leaderCandidateId:line.id,
     geometryCandidateId:curve.id,
     textEndpointDistancePx:Number(textDistance.toFixed(2)),
     curveOutlineDistancePx:Number(outlineDistance.toFixed(2)),
     totalEndpointErrorPx:Number((textDistance+outlineDistance).toFixed(2)),
     orientation:oriented.side,
     hypothesis:'unverified-leader-endpoint-to-bbox-outline',
     arrowheadVerified:false,geometryConfirmed:false,
     coordinateSpace:'original-image-px',requiresHumanReview:true
    };
    if(seen.has(key)){
     const prev=result.findIndex(x=>x.dimensionId+'|'+x.leaderCandidateId+'|'+
      x.geometryCandidateId===key);
     if(prev>=0&&entry.totalEndpointErrorPx<result[prev].totalEndpointErrorPx)
      result[prev]=entry;
    }else{seen.add(key);result.push(entry);}
   }
  }
 }
 result.sort((a,b)=>a.totalEndpointErrorPx-b.totalEndpointErrorPx||
  a.leaderCandidateId.localeCompare(b.leaderCandidateId)||
  a.geometryCandidateId.localeCompare(b.geometryCandidateId));
 return result.slice(0,maxResults);
}
module.exports={mapLeaderCandidate,rankLeaderLineLinks};
