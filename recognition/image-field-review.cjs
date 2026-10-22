'use strict';
/**
 * 08 V3.2: local, explicit per-field source review. No OCR, no file bytes.
 * Marking a rectangle only locates evidence; pressing "confirm" must separately
 * approve the CURRENT number, and final acceptance is a distinct user action.
 */
const {kinds}=require('../labs/auto-fillet-form.cjs');
const {sourceIndex,prepareConfirmedFillet}=
 require('./confirmed-fillet-draft.cjs');
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const fieldList=kind=>{
 if(!Object.hasOwn(kinds,kind))throw new RangeError('unsupported kind');
 return [...kinds[kind].fields.map(x=>x[0]),'filletRadius'];
};
function createFieldReview(){
 let image=null,kind='two-segments',accepted=false;
 const regions=new Map();
 const reset=()=>{regions.clear();accepted=false;};
 const setImage=(width,height)=>{
  reset();
  if(!Number.isSafeInteger(width)||!Number.isSafeInteger(height)||
   width<16||height<16||width>10000||height>10000){
   image=null;return false;
  }
  image={width,height};return true;
 };
 const setKind=next=>{fieldList(next);kind=next;reset();};
 function mark(field,bbox,detectorCandidateId=null){
  if(detectorCandidateId!==null&&
    (typeof detectorCandidateId!=='string'||
     !/^(line|curve)_[0-9]+$/.test(detectorCandidateId)))
   throw new TypeError('unsupported detector candidate id');
  if(!image||!fieldList(kind).includes(field))throw new RangeError('image or field missing');
  const id='src_'+field;
  const candidate={id,kind:field.startsWith('r')||field==='filletRadius'
   ?'dimension':'geometry',bbox,confidence:0};
  sourceIndex({schema:'draftai-recognition-candidates/0.1',image,
   annotations:[candidate]});
  regions.set(field,{candidate,confirmed:false,value:null,detectorCandidateId});
  accepted=false;
 }
 function confirm(field,value){
  if(!finite(value))throw new TypeError('finite model-mm value required');
  const item=regions.get(field);
  if(!item)throw new RangeError('mark source bbox before confirming field');
  item.confirmed=true;item.value=value;accepted=false;
 }
 function edited(field){
  const item=regions.get(field);
  if(item){item.confirmed=false;item.value=null;}
  accepted=false;
 }
 const required=()=>fieldList(kind);
 const progress=()=>({total:required().length,
  marked:required().filter(id=>regions.has(id)).length,
  confirmed:required().filter(id=>regions.get(id)?.confirmed).length,
  accepted,hasImage:!!image});
 function accept(){
  if(!image||required().some(id=>!regions.get(id)?.confirmed))
   return false;
  accepted=true;return true;
 }
 function review(values,selection,revision){
  const missing=required().filter(id=>!regions.get(id)?.confirmed||
   regions.get(id)?.value!==values[id]);
  if(!image||!regions.size||missing.length||!accepted)
   return {status:'needs-confirmation',
    missing:!image?['source image required']:missing.length?missing:
     ['final review acceptance required'],input:null,fieldSources:null};
  const draft={schema:'draftai-recognition-candidates/0.1',
   image:{...image},annotations:[...regions.values()].map(x=>({
    ...x.candidate,bbox:[...x.candidate.bbox]
   }))};
  const fields=Object.fromEntries(required().map(id=>{
   const item=regions.get(id);
   return [id,{value:item.value,sourceId:item.candidate.id,
    confirmed:item.confirmed}];
  }));
  const result=prepareConfirmedFillet(draft,{kind,unit:'mm',fields,selection,revision,
   userAccepted:accepted});
  if(result.status==='ready-for-math'){
   for(const id of required())result.fieldSources[id].detectorCandidateId=
    regions.get(id).detectorCandidateId;
  }
  return result;
 }
 const boxes=()=>[...regions.entries()].map(([field,item])=>({
  field,bbox:[...item.candidate.bbox],confirmed:item.confirmed,
  detectorCandidateId:item.detectorCandidateId
 }));
 return Object.freeze({setImage,setKind,mark,confirm,edited,accept,progress,
  review,boxes,required,get image(){return image?{...image}:null},
  get kind(){return kind}});
}
module.exports={createFieldReview,fieldList};
