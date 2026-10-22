'use strict';
/**
 * DraftAI V3.1 (08) — image annotation candidates -> explicit human-reviewed
 * model-mm conditions. This does NOT run OCR, attest that a human really
 * reviewed anything, upload an image, or solve geometry. Callers MUST populate
 * the separate review argument from trusted confirmation UI actions; never
 * forward an AI model's JSON as review.
 */
const {kinds,buildConfirmedInput}=
 require('../labs/auto-fillet-form.cjs');
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const record=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const validId=x=>typeof x==='string'&&/^[a-z][a-z0-9_-]{0,63}$/i.test(x);
function sourceIndex(draft){
 if(!record(draft)||draft.schema!=='draftai-recognition-candidates/0.1')
  throw new TypeError('unsupported candidate schema');
 if(!record(draft.image)||!Number.isSafeInteger(draft.image.width)||
    !Number.isSafeInteger(draft.image.height)||
    draft.image.width<16||draft.image.height<16||
    draft.image.width>10000||draft.image.height>10000)
  throw new RangeError('invalid bounded source image dimensions');
 if(!Array.isArray(draft.annotations)||!draft.annotations.length||
    draft.annotations.length>200)
  throw new RangeError('annotations must contain 1..200 candidates');
 const ids=new Map();
 for(const [i,c] of draft.annotations.entries()){
  if(!record(c)||!validId(c.id)||ids.has(c.id)||
     !['geometry','dimension','text'].includes(c.kind)||
     !finite(c.confidence)||c.confidence<0||c.confidence>1||
     !Array.isArray(c.bbox)||c.bbox.length!==4||
     !c.bbox.every(finite))
   throw new TypeError('invalid or duplicate annotation #'+i);
  const [x,y,w,h]=c.bbox;
  if(x<0||y<0||w<=0||h<=0||
     x+w>draft.image.width||y+h>draft.image.height)
   throw new RangeError('annotation bbox outside original image');
  ids.set(c.id,{id:c.id,kind:c.kind,confidence:c.confidence,
   bbox:[x,y,w,h]});
 }
 return ids;
}
function prepareConfirmedFillet(draft,review){
 const source=sourceIndex(draft);
 // Review MUST be collected independently by the UI, not AI output.
 if(!record(review)||review.userAccepted!==true)
  return {status:'needs-confirmation',
   missing:['explicit separate user acceptance'],input:null,fieldSources:null};
 const spec=kinds[review.kind];
 if(!spec)
  return {status:'unsupported',missing:['supported problem kind'],input:null,fieldSources:null};
 if(review.unit!=='mm')
  return {status:'needs-confirmation',missing:['reviewed model-mm unit'],input:null,fieldSources:null};
 if(!record(review.fields))
  return {status:'needs-confirmation',missing:spec.fields.map(x=>x[0]).concat('filletRadius'),
   input:null,fieldSources:null};
 const required=spec.fields.map(x=>x[0]).concat('filletRadius');
 const missing=[],numbers={},provenance={};
 for(const id of required){
  const entry=review.fields[id];
  if(!record(entry)||entry.confirmed!==true||!finite(entry.value)||
      !validId(entry.sourceId)||!source.has(entry.sourceId)){
   missing.push(id);continue;
  }
  numbers[id]=entry.value;
  const evidence=source.get(entry.sourceId);
  provenance[id]={sourceId:evidence.id,confidence:evidence.confidence,
   bbox:[...evidence.bbox],annotationKind:evidence.kind};
 }
 if(missing.length)
  return {status:'needs-confirmation',missing,input:null,fieldSources:null};
 // No caller-provided proof or answer is passed into the deterministic model.
 const selection=record(review.selection)?review.selection:{};
 const revision=review.revision??0;
 let input;
 try{input=buildConfirmedInput(review.kind,numbers,selection,revision);}
 catch(e){return {status:'invalid-confirmation',
  missing:[e.message],input:null,fieldSources:null};}
 return {status:'ready-for-math',missing:[],input,
  fieldSources:provenance,
  note:'candidate provenance only; no OCR accuracy or geometric solution certified'};
}
module.exports={sourceIndex,prepareConfirmedFillet};
