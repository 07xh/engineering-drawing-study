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
function prepareLocalVectorImport({source,kind,firstId,secondId,originX,originY,
 mmPerPx,yAxis,filletRadiusMm,accepted}={}){
 if(accepted!==true)throw new TypeError('human review checkbox must be explicitly accepted');
 if(!Object.hasOwn(sourceKeys,kind))throw new RangeError('unsupported vector fillet kind');
 const summary=geometrySummary(source);
 // Unreviewed drawing labels often determine the actual answer. Never discard
 // or auto-reject them to manufacture apparent mathematical completeness.
 if(summary.hasLabels)throw new RangeError('SVG contains text or dimensions requiring separate manual confirmation');
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
 let draft=summary.draft;
 for(const c of draft.candidates){
  draft=reviewCandidate(draft,{id:c.id,expectedRevision:draft.revision,
   decision:ids.includes(c.id)?'confirmed':'rejected'});
 }
 const metric={frame:'drawing-px',originPx:{x:originX,y:originY},
  mmPerPx,yAxis,reviewedBy:'user',revision:draft.revision};
 const prepared=prepareConfirmedFillet({draft,expectedRevision:draft.revision,
  calibration:metric,kind,sourceIds:chosen,filletRadiusMm,
  options:kind==='segment-circle'?{side:1}:{}});
 return {kind,fields:formFields(prepared),sourceIds:chosen,
  reviewedDraftRevision:draft.revision,
  imageProvenance:prepared.provenance,
  metricStatement:'Scale is user reviewed, not automatically inferred from SVG pixels'};
}
module.exports={MAX_BYTES,checkFile,geometrySummary,formFields,prepareLocalVectorImport};
