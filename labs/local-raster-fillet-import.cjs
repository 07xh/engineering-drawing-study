'use strict';
/** User-reviewed raster candidates -> existing *metric* fillet adapter.
 * No detector pixel coordinates are silently a millimetre, and no OCR result
 * is allowed to fill the target radius or choose a mathematical branch.
 */
const {validateDraft,reviewCandidate}=
 require('../recognition/problem-draft.cjs');
const {prepareConfirmedFillet}=
 require('../integration/v31-confirmed-svg-fillet-v5.cjs');
const {formFields}=require('./local-vector-svg-import.cjs');

const shapeKeys=Object.freeze({
 'two-segments':{first:'segment',second:'segment'},
 'segment-circle':{segment:'segment',circle:'circle'},
 'two-circles':{first:'circle',second:'circle'}
});
const isObj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const finite=x=>typeof x==='number'&&Number.isFinite(x);
function checkPixelGeometry(candidate,edited){
 if(!isObj(edited)||!candidate?.geometry)
  throw new TypeError('each selected raster candidate requires edited pixel geometry');
 const keys=candidate.kind==='segment'?['from','to']:
   candidate.kind==='circle'?['center','radiusPx']:null;
 if(!keys||Object.keys(edited).sort().join(',')!==keys.sort().join(','))
  throw new TypeError('unsupported or incomplete reviewed raster geometry');
 const point=p=>isObj(p)&&Object.keys(p).sort().join(',')==='x,y'&&
  finite(p.x)&&finite(p.y)&&Math.abs(p.x)<1e7&&Math.abs(p.y)<1e7;
 if(candidate.kind==='segment'){
  if(!point(edited.from)||!point(edited.to)||
    Math.hypot(edited.from.x-edited.to.x,edited.from.y-edited.to.y)<=1e-6)
   throw new RangeError('invalid corrected finite segment endpoints');
  return {frame:'drawing-px',from:{...edited.from},to:{...edited.to}};
 }
 if(!point(edited.center)||!finite(edited.radiusPx)||edited.radiusPx<=0)
  throw new RangeError('invalid corrected source circle radius');
 return {frame:'drawing-px',center:{...edited.center},radiusPx:edited.radiusPx};
}
function prepareReviewedRasterImport({
 draft,expectedRevision,kind,firstId,secondId,edits,
 originX,originY,mmPerPx,yAxis,filletRadiusMm,lineSide,accepted
}={}){
 if(accepted!==true)
  throw new TypeError('explicit human geometry and scale review acceptance required');
 const d=validateDraft(draft);
 if(!Number.isSafeInteger(expectedRevision)||expectedRevision!==d.revision)
  throw new RangeError('stale raster candidate draft revision');
 if(kind==='segment-circle'&&lineSide!==1&&lineSide!==-1)
  throw new TypeError('explicit reviewed line-circle side +1 or -1 required');
 if(kind!=='segment-circle'&&lineSide!==undefined)
  throw new TypeError('line-circle side cannot be applied to other R0 types');
 const names=shapeKeys[kind];
 if(!names)throw new RangeError('unsupported raster R0 type');
 const fields=Object.keys(names),ids=[firstId,secondId];
 if(ids.some(id=>typeof id!=='string'||!id)||ids[0]===ids[1])
  throw new TypeError('two distinct raster source IDs required');
 if(!isObj(edits)||Object.keys(edits).length!==2||
   ids.some(id=>!Object.hasOwn(edits,id)))
  throw new TypeError('both chosen primitives must have explicit editable values');
 const chosen={},patches={};
 for(const [i,key] of fields.entries()){
  const source=d.candidates.find(c=>c.id===ids[i]);
  if(!source||source.kind!==names[key])
   throw new TypeError('selected raster source shape or ID is unsupported');
  chosen[key]=source.id;
  const geometry=checkPixelGeometry(source,edits[source.id]);
  const image=d.image;
  const inside=p=>p.x>=0&&p.y>=0&&p.x<=image.width&&p.y<=image.height;
  if(source.kind==='segment'){
   if(!inside(geometry.from)||!inside(geometry.to))
    throw new RangeError('corrected line endpoint outside current original photo');
  }else{
   if(!inside(geometry.center)||
      geometry.center.x-geometry.radiusPx<0||
      geometry.center.y-geometry.radiusPx<0||
      geometry.center.x+geometry.radiusPx>image.width||
      geometry.center.y+geometry.radiusPx>image.height)
    throw new RangeError('corrected full circle extends beyond current original photo');
  }
  patches[source.id]={geometry};
 }
 let reviewed=d;
 for(const source of d.candidates){
  reviewed=reviewCandidate(reviewed,{
   id:source.id,expectedRevision:reviewed.revision,
   decision:ids.includes(source.id)?'confirmed':'rejected',
   patch:patches[source.id]||{}
  });
 }
 const calibration={
  frame:'drawing-px',originPx:{x:originX,y:originY},
  mmPerPx,yAxis,reviewedBy:'user',revision:reviewed.revision
 };
 const prepared=prepareConfirmedFillet({
  draft:reviewed,expectedRevision:reviewed.revision,
  calibration,kind,sourceIds:chosen,filletRadiusMm,
  options:kind==='segment-circle'?{side:lineSide}:{}
 });
 return {
  kind,fields:formFields(prepared),lineSide,
  reviewedDraftRevision:reviewed.revision,sourceIds:chosen,
  sourceFrame:'original-image-px',
  geometrySourceReviewed:true,metricCalibrationMathematicallyProven:false,
  sourceCandidateProof:false,globallyUnique:null,
  provenance:prepared.provenance
 };
}
module.exports={shapeKeys,checkPixelGeometry,prepareReviewedRasterImport};
