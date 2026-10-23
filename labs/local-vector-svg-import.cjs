'use strict';
/**
 * Local-only SVG vector -> explicit reviewed numeric conditions for the existing
 * public manual workbench. No network, no implicit metric units, no SVG DOM
 * injection, no OCR and no automated dimension-label associations.
 */
const {extractSvgCandidates}=require('../recognition/vector-svg-candidates.cjs');
const {reviewCandidate}=require('../recognition/problem-draft.cjs');
const {prepareConfirmedFillet}=require('../integration/v31-confirmed-svg-fillet-v5.cjs');
const MAX_BYTES=250_000;
const sourceKeys=Object.freeze({
 'two-segments':{first:'segment',second:'segment'},
 'segment-circle':{segment:'segment',circle:'circle'},
 'two-circles':{first:'circle',second:'circle'}
});
function checkFile(file){
 if(!file||typeof file!=='object'||typeof file.text!=='function'||
  !(file.type==='image/svg+xml'||file.name?.toLowerCase().endsWith('.svg'))||
  !Number.isSafeInteger(file.size)||file.size<=0||file.size>MAX_BYTES)
  return {ok:false,reason:'请选择不超过 250 KB 的本地 SVG 矢量文件'};
 return {ok:true};
}
function geometrySummary(source){
 const result=extractSvgCandidates(source);
 return {draft:result.draft,
  shapes:result.draft.candidates.filter(c=>c.geometry).map(c=>({
   id:c.id,kind:c.kind,geometry:c.geometry})),
  hasLabels:result.draft.candidates.some(c=>c.kind==='dimension'||c.kind==='note'),
  labels:result.draft.candidates.filter(c=>c.kind==='dimension'||c.kind==='note').map(c=>({
   id:c.id,kind:c.kind,text:c.kind==='note'?c.text:c.dimension.rawText,
   dimension:c.dimension?{...c.dimension,refs:[...c.dimension.refs]}:null
  })),
  image:{width:result.draft.image.width,height:result.draft.image.height}};
}
function formFields(prepared){
 const {geometry:g,filletRadius,kind}=prepared.problem;
 const p=(prefix,pt)=>({[prefix+'x']:pt.x,[prefix+'y']:pt.y});
 let fields={filletRadius};
 if(kind==='two-segments')fields={...fields,
  ...p('a1',g.first.a),...p('b1',g.first.b),
  ...p('a2',g.second.a),...p('b2',g.second.b)};
 else if(kind==='segment-circle')fields={...fields,
  ...p('a1',g.segment.a),...p('b1',g.segment.b),
  ...p('c1',g.circle.center),r1:g.circle.radius};
 else if(kind==='two-circles')fields={...fields,
  ...p('c1',g.first.center),r1:g.first.radius,
  ...p('c2',g.second.center),r2:g.second.radius};
 else throw new RangeError('unsupported vector fillet shape');
 if(Object.values(fields).some(n=>typeof n!=='number'||!Number.isFinite(n)))
  throw new RangeError('model geometry contains a nonfinite value');
 return fields;
}
function checkedAnnotationReviews(summary,selectedIds,reviews,filletRadiusMm){
 const labels=summary.labels;
 if(!labels.length){
  if(reviews!==undefined&&(!Array.isArray(reviews)||reviews.length))
   throw new TypeError('no annotations exist to review');
  return {byId:new Map(),provenance:[]};
 }
 if(!Array.isArray(reviews)||reviews.length!==labels.length)
  throw new RangeError('SVG contains text or dimensions requiring separate manual confirmation');
 const found=new Map(),provenance=[];
 for(const review of reviews){
  if(!review||typeof review!=='object'||Array.isArray(review)||
     typeof review.id!=='string'||found.has(review.id)||
     review.confirmed!==true)
   throw new TypeError('each annotation requires a distinct explicit human confirmation');
  for(const key of Object.keys(review))
   if(!['id','decision','sourceId','valueMm','confirmed'].includes(key))
    throw new TypeError('unsupported annotation review property');
  const candidate=labels.find(c=>c.id===review.id);
  if(!candidate)throw new TypeError('review references unknown SVG annotation');
  if(!['reject','source-circle','target-radius'].includes(review.decision))
   throw new TypeError('annotation needs a reject, source-circle or target-radius decision');
  if(review.decision!=='reject'){
   const d=candidate.dimension;
   if(!d||!['radius','diameter'].includes(d.kind)||
      typeof review.valueMm!=='number'||!Number.isFinite(review.valueMm)||
      review.valueMm<=0)
    throw new RangeError('R/Φ review needs a valid positive human-confirmed mm value');
   if(review.decision==='source-circle'){
    const selected=summary.shapes.find(c=>c.id===review.sourceId);
    if(!selected||selected.kind!=='circle'||!selectedIds.includes(review.sourceId))
     throw new TypeError('dimension must link to an explicitly selected source circle');
   }else{
    if(d.kind!=='radius'||review.sourceId!==undefined)
     throw new TypeError('target connection radius must be R, not Φ or a source');
    const tolerance=1e-3+1e-3*Math.abs(review.valueMm);
    if(typeof filletRadiusMm!=='number'||!Number.isFinite(filletRadiusMm)||
       Math.abs(review.valueMm-filletRadiusMm)>tolerance)
     throw new RangeError('target R dimension conflicts with confirmed fillet radius');
   }
  }else if(review.sourceId!==undefined||review.valueMm!==undefined){
   throw new TypeError('rejected text may not provide source or math values');
  }
  found.set(review.id,review);
  provenance.push({annotationId:review.id,decision:review.decision,
   ...(review.decision==='source-circle'?{sourceId:review.sourceId,valueMm:review.valueMm}:{}),
   ...(review.decision==='target-radius'?{target:'filletRadius',valueMm:review.valueMm}:{})
  });
 }
 if(labels.some(label=>!found.has(label.id)))
  throw new RangeError('all SVG text or dimension labels must be explicitly reviewed');
 return {byId:found,provenance};
}
function prepareLocalVectorImport({source,kind,firstId,secondId,originX,originY,
 mmPerPx,yAxis,filletRadiusMm,accepted,annotationReviews}={}){
 if(accepted!==true)throw new TypeError('human review checkbox must be explicitly accepted');
 if(!Object.hasOwn(sourceKeys,kind))throw new RangeError('unsupported vector fillet kind');
 const summary=geometrySummary(source);
 const fields=sourceKeys[kind],keys=Object.keys(fields);
 const ids=[firstId,secondId];
 if(ids.some(id=>typeof id!=='string'||!id)||ids[0]===ids[1])
  throw new TypeError('two distinct reviewed source IDs required');
 const chosen={};
 for(const [i,key] of keys.entries()){
  const candidate=summary.draft.candidates.find(c=>c.id===ids[i]);
  if(!candidate||candidate.kind!==fields[key]||!candidate.geometry)
   throw new TypeError('selected source type or ID disagrees with drawing');
  chosen[key]=ids[i];
 }
 const annotations=checkedAnnotationReviews(summary,ids,annotationReviews,filletRadiusMm);
 let draft=summary.draft;
 for(const c of draft.candidates){
  let decision=ids.includes(c.id)?'confirmed':'rejected',patch={};
  const reviewed=annotations.byId.get(c.id);
  if(reviewed?.decision==='source-circle'){
   decision='confirmed';
   patch={dimension:{...c.dimension,
    value:reviewed.valueMm,unit:'mm',refs:[reviewed.sourceId]}};
  }
  draft=reviewCandidate(draft,{id:c.id,expectedRevision:draft.revision,decision,patch});
 }
 const metric={frame:'drawing-px',originPx:{x:originX,y:originY},
  mmPerPx,yAxis,reviewedBy:'user',revision:draft.revision};
 const prepared=prepareConfirmedFillet({draft,expectedRevision:draft.revision,
  calibration:metric,kind,sourceIds:chosen,filletRadiusMm,
  options:kind==='segment-circle'?{side:1}:{}});
 return {kind,fields:formFields(prepared),sourceIds:chosen,
  reviewedDraftRevision:draft.revision,
  imageProvenance:{...prepared.provenance,annotationReviews:annotations.provenance},
  metricStatement:'Scale is user reviewed, not automatically inferred from SVG pixels'};
}
module.exports={MAX_BYTES,checkFile,geometrySummary,formFields,prepareLocalVectorImport};
