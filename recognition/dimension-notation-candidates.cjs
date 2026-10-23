'use strict';
/**
 * Engineer drawing notation candidate parser for future OCR text tokens.
 * Pure classification only. No OCR engine, no user acceptance, no photo upload,
 * no mm calibration, no verified radius/diameter/geometry or solver calls.
 */
const markerKind=new Map([['R','radius'],['r','radius'],
 ['Φ','diameter'],['φ','diameter'],['Ø','diameter'],['ø','diameter'],
 ['⌀','diameter'],['∅','diameter']]);
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const isBox=(a,image)=>{
 if(!Array.isArray(a)||a.length!==4||!a.every(finite))return false;
 const [x,y,w,h]=a;
 return x>=0&&y>=0&&w>0&&h>0&&x+w<=image.width&&y+h<=image.height;
};
const isImage=i=>i&&Number.isSafeInteger(i.width)&&
 Number.isSafeInteger(i.height)&&i.width>=24&&i.height>=24&&
 i.width<=10000&&i.height<=10000;
function parseNotation(text){
 if(typeof text!=='string'||text.length>80)return null;
 const m=/^\s*([RrΦφØø⌀∅])\s*(\d{1,6}(?:[.,]\d{1,3})?)\s*(mm|毫米)?\s*$/iu.exec(text);
 if(!m)return null;
 const value=Number(m[2].replace(',','.'));
 if(!finite(value)||value<=0||value>100000)return null;
 const kind=markerKind.get(m[1]);
 if(!kind)return null;
 return {dimensionKind:kind,numericValue:value,
  proposedRadiusValue:kind==='diameter'?value/2:value,
  unitHint:m[3]?'mm-explicit':'drawing-unit-unconfirmed'};
}
function parseTextCandidates(tokens,image){
 if(!isImage(image)||!Array.isArray(tokens)||tokens.length>150)
  throw new TypeError('bounded OCR candidate collection and image required');
 const result=[],seen=new Set();
 for(const token of tokens){
  if(!token||typeof token.id!=='string'||
      !/^ocr_[a-z0-9_-]{1,50}$/i.test(token.id)||seen.has(token.id)||
      !finite(token.confidence)||token.confidence<0||token.confidence>1||
      !isBox(token.bbox,image)||typeof token.text!=='string')
   throw new TypeError('malformed image text candidate');
  seen.add(token.id);
  const parsed=parseNotation(token.text);
  if(!parsed)continue;
  result.push({
   id:token.id,sourceText:token.text.slice(0,80),
   bbox:[...token.bbox],kind:'dimension',...parsed,
   recognitionScore:token.confidence,
   coordinateSpace:'original-image-px',
   confirmed:false,requiresHumanReview:true,
   mathematicalProof:false
  });
 }
 return result;
}
function rankDimensionLinks(dimension,geometry,image,{maxMatches=4}={}){
 if(!isImage(image)||!dimension||dimension.kind!=='dimension'||
  dimension.confirmed!==false||!isBox(dimension.bbox,image)||
  !Array.isArray(geometry)||geometry.length>100||
  !Number.isInteger(maxMatches)||maxMatches<1||maxMatches>12)
  throw new TypeError('invalid dimension or geometry candidates');
 const [dx,dy,dw,dh]=dimension.bbox;
 const suggestions=[];
 for(const g of geometry){
  if(!g||!['circle','arc'].includes(g.kind)||
   typeof g.id!=='string'||!/^curve_[0-9]+$/.test(g.id)||
   g.coordinateSpace!=='original-image-px'||
   !isBox(g.bbox,image))continue;
  const [x,y,w,h]=g.bbox;
  const gx=Math.max(0,Math.max(dx-(x+w),x-(dx+dw))),
   gy=Math.max(0,Math.max(dy-(y+h),y-(dy+dh)));
  const gap=Math.hypot(gx,gy);
  const maxGap=Math.min(160,Math.hypot(image.width,image.height)*.2);
  if(gap>maxGap)continue;
  suggestions.push({
   dimensionId:dimension.id,geometryCandidateId:g.id,
   separationPx:Number(gap.toFixed(2)),
   hypothesis:'image-proximity-only',
   confirmed:false,requiresHumanReview:true
  });
 }
 suggestions.sort((a,b)=>a.separationPx-b.separationPx||
  a.geometryCandidateId.localeCompare(b.geometryCandidateId));
 return suggestions.slice(0,maxMatches);
}
/**
 * Some native detectors split "R8" into independently boxed "R" and "8".
 * Combine only adjacent, same-baseline, similarly sized tokens in original
 * image pixels. Keep ALL combinations as untrusted alternatives; no math.
 *
 * Caller must first validate raw tokens using parseTextCandidates, which
 * rejects malformed IDs, bounding boxes and unbounded candidate arrays.
 */
function joinSplitDimensionTokens(tokens,image,{maxPairs=40}={}){
 if(!isImage(image)||!Array.isArray(tokens)||tokens.length>150||
  !Number.isInteger(maxPairs)||maxPairs<1||maxPairs>80)
  throw new TypeError('invalid original-image OCR token pairing input');
 const proposals=[];
 for(let i=0;i<tokens.length;i++){
  const prefix=tokens[i];
  if(typeof prefix?.text!=='string'||
   !/^\s*[RrΦφØø⌀∅]\s*$/u.test(prefix.text)||
   !isBox(prefix.bbox,image))continue;
  const [px,py,pw,ph]=prefix.bbox;
  for(let j=0;j<tokens.length;j++){
   if(i===j||proposals.length>=maxPairs)continue;
   const suffix=tokens[j];
   if(typeof suffix?.text!=='string'||
    !/^\s*\d{1,6}(?:[.,]\d{1,3})?\s*(?:mm|毫米)?\s*$/iu.test(suffix.text)||
    !isBox(suffix.bbox,image))continue;
   const [sx,sy,sw,sh]=suffix.bbox;
   const height=Math.max(ph,sh),short=Math.min(ph,sh);
   if(short/height<.55)continue;
   const gap=sx-(px+pw);
   if(gap<-.15*height||gap>Math.min(16,height*.7))continue;
   const vertical=Math.abs(py+ph/2-(sy+sh/2));
   if(vertical>height*.4)continue;
   const text=(prefix.text.trim()+suffix.text.trim());
   if(!parseNotation(text))continue;
   const left=Math.min(px,sx),top=Math.min(py,sy);
   const right=Math.max(px+pw,sx+sw),bottom=Math.max(py+ph,sy+sh);
   proposals.push({
    id:'ocr_join_'+(i+1)+'_'+(j+1),
    text,confidence:Math.min(prefix.confidence,suffix.confidence),
    bbox:[left,top,right-left,bottom-top],
    sourceTokenIds:[prefix.id,suffix.id],
    syntheticJoin:true
   });
  }
  if(proposals.length>=maxPairs)break;
 }
 return proposals;
}

module.exports={parseNotation,parseTextCandidates,rankDimensionLinks,
 joinSplitDimensionTokens};
