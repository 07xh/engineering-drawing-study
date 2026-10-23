'use strict';
/**
 * User-operated ground-truth replay file. No photo bytes or filename.
 * SHA-256 of the ORIGINAL chosen file is a unique fingerprint, NOT anonymity
 * or a security signature. Never publish it without considering privacy.
 */
const {evaluateRecognitionProposals}=require('./recognition-quality-metrics.cjs');
const SCHEMA='draftai-photo-annotations/1';
const hex=/^[0-9a-f]{64}$/;
const plain=x=>x&&typeof x==='object'&&!Array.isArray(x);
const own=(obj,keys)=>Object.keys(obj).every(k=>keys.includes(k));
function imageSize(i){
 if(!plain(i)||!Number.isSafeInteger(i.width)||!Number.isSafeInteger(i.height)||
 i.width<32||i.height<32||i.width>10000||i.height>10000||
 i.width*i.height>50000000)throw new TypeError('bounded original image size required');
 return {width:i.width,height:i.height};
}
function sanitizeLabels(labels,size){
 if(!Array.isArray(labels)||labels.length>100)throw new TypeError('at most 100 manual labels');
 const out=[],ids=new Set();
 for(const item of labels){
  if(!plain(item)||!/^truth_[1-9]\d{0,7}$/.test(item.id||'')||
   item.coordinateSpace!=='original-image-px'||
   !['line','circle','arc','dimension','arrow'].includes(item.kind)||
   ids.has(item.id))throw new TypeError('invalid or duplicated manual annotation');
  let cleaned,allowed;
  const base={id:item.id,kind:item.kind,coordinateSpace:'original-image-px'};
  if(item.kind==='line'){
   allowed=['id','kind','coordinateSpace','from','to'];
   cleaned={...base,from:item.from,to:item.to};
  }else if(item.kind==='circle'||item.kind==='arc'){
   allowed=['id','kind','coordinateSpace','center','radius',
    ...(item.kind==='arc'?['coverageDeg']:[])];
   cleaned={...base,center:item.center,radius:item.radius};
   if(item.kind==='arc'&&item.coverageDeg!==undefined)
    cleaned.coverageDeg=item.coverageDeg;
  }else if(item.kind==='dimension'){
   allowed=['id','kind','coordinateSpace','bbox','text'];
   cleaned={...base,bbox:item.bbox,text:item.text};
  }else{
   allowed=['id','kind','coordinateSpace','tip'];
   cleaned={...base,tip:item.tip};
  }
  if(!own(item,allowed))throw new TypeError('unexpected metadata or image content');
  // Use existing strict image-space geometry validator, not a second,
  // diverging tolerance interpretation.
  evaluateRecognitionProposals({image:size,truth:[cleaned],predictions:[]});
  out.push(JSON.parse(JSON.stringify(cleaned)));
  ids.add(item.id);
 }
 return out;
}
function createAnnotationPack(snapshot,sha256){
 if(!plain(snapshot)||snapshot.ready!==true)
  throw new TypeError('an active local photo QA session is required');
 if(typeof sha256!=='string'||!hex.test(sha256))
  throw new TypeError('SHA-256 original-file hex digest required');
 const size=imageSize(snapshot.image);
 const labels=sanitizeLabels(snapshot.annotations,size);
 if(!labels.length)throw new RangeError('annotate at least one ground-truth item');
 return {schema:SCHEMA,image:{...size,sha256},annotations:labels,
  notice:'User-written annotations and file fingerprint may be identifying; not a mathematical proof'};
}
function validateAnnotationPack(pack,expected){
 if(!plain(pack)||pack.schema!==SCHEMA||
  !own(pack,['schema','image','annotations','notice'])||
  !plain(pack.image)||!own(pack.image,['width','height','sha256']))
  throw new TypeError('unknown QA annotation package schema');
 const size=imageSize(pack.image),expectedSize=imageSize(expected?.image);
 const sha=expected?.sha256;
 if(typeof sha!=='string'||!hex.test(sha)||
  typeof pack.image.sha256!=='string'||!hex.test(pack.image.sha256)||
  pack.image.sha256!==sha||
  size.width!==expectedSize.width||size.height!==expectedSize.height)
  throw new RangeError('original image fingerprint or dimensions do not match');
 const labels=sanitizeLabels(pack.annotations,size);
 if(labels.length===0)throw new RangeError('empty annotation package');
 return labels;
}
module.exports={createAnnotationPack,validateAnnotationPack};
