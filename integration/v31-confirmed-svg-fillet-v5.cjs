'use strict';

/**
 * Opt-in R0 vertical slice:
 * SVG vector candidates -> explicit human review + METRIC calibration ->
 * existing finite geometry solver -> existing verified V5 timeline.
 *
 * This does not decode raster images, guess dimension associations,
 * prove scale calibration, choose branches, or change 02/G1 mathematics.
 */
const {validateDraft,draftReadiness}=require('../recognition/problem-draft.cjs');
const {normalizeProblem}=require('../engines/constraints-2d/finite-fillet-gate.cjs');
const {confirmedFilletTimeline}=require('../workbench/v31-confirmed-fillet-v5.cjs');

const finite=x=>typeof x==='number'&&Number.isFinite(x);
const obj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const only=(record,allowed,name)=>{
  if(!obj(record))throw new TypeError(name+' must be an object');
  for(const key of Object.keys(record))if(!allowed.includes(key))
    throw new TypeError(name+' contains unsupported field '+key);
};
const kinds={
  'two-segments':{first:'segment',second:'segment'},
  'segment-circle':{segment:'segment',circle:'circle'},
  'two-circles':{first:'circle',second:'circle'}
};
function checkCalibration(c,revision){
  only(c,['frame','originPx','mmPerPx','yAxis','reviewedBy','revision'],'calibration');
  if(c.frame!=='drawing-px'||c.reviewedBy!=='user'||c.revision!==revision)
    throw new TypeError('current revision human-confirmed drawing-px calibration required');
  only(c.originPx,['x','y'],'calibration origin');
  if(!finite(c.originPx.x)||!finite(c.originPx.y)||!finite(c.mmPerPx)||
     c.mmPerPx<=1e-12||c.mmPerPx>=1e6||!['up','down'].includes(c.yAxis))
    throw new RangeError('invalid uniform metric scale, origin or y axis');
  return {frame:c.frame,originPx:{...c.originPx},mmPerPx:c.mmPerPx,
    yAxis:c.yAxis,reviewedBy:'user',revision};
}
function modelPoint(p,c){
  const x=(p.x-c.originPx.x)*c.mmPerPx;
  const y=(p.y-c.originPx.y)*c.mmPerPx*(c.yAxis==='up'?-1:1);
  if(!finite(x)||!finite(y))throw new RangeError('model point outside finite range');
  return {x,y};
}
function modelGeometry(candidate,c){
  const g=candidate.geometry;
  if(g.frame!=='drawing-px')throw new TypeError('pixel geometry frame required');
  if(candidate.kind==='segment')return {a:modelPoint(g.from,c),b:modelPoint(g.to,c)};
  if(candidate.kind==='circle'){
    const radius=g.radiusPx*c.mmPerPx;
    if(!finite(radius)||radius<=0)throw new RangeError('invalid calibrated radius');
    return {center:modelPoint(g.center,c),radius};
  }
  throw new TypeError('source must be a finite segment or a circle');
}
function measureDimension(dim,source){
  if(source.kind==='circle'){
    if(dim.kind==='radius')return source.geometry.radius;
    if(dim.kind==='diameter')return 2*source.geometry.radius;
    throw new TypeError('source circle only accepts radius/diameter measurement');
  }
  if(source.kind==='segment'&&dim.kind==='length')
    return Math.hypot(source.geometry.b.x-source.geometry.a.x,
      source.geometry.b.y-source.geometry.a.y);
  throw new TypeError('source segment only accepts length measurement');
}
function prepareConfirmedFillet({draft,expectedRevision,calibration,kind,sourceIds,
  filletRadiusMm,options={}}={}){
  const d=validateDraft(draft);
  if(!Number.isSafeInteger(expectedRevision)||expectedRevision!==d.revision)
    throw new RangeError('stale or missing draft revision');
  const readiness=draftReadiness(d);
  if(readiness.status!=='candidate-reviewed')
    throw new RangeError('unconfirmed, ambiguous or conflicting image candidates');
  const metric=checkCalibration(calibration,d.revision);
  if(!Object.hasOwn(kinds,kind))throw new RangeError('unsupported R0 fillet kind');
  only(sourceIds,Object.keys(kinds[kind]),'sourceIds');
  const keys=Object.keys(kinds[kind]);
  const ids=keys.map(key=>sourceIds[key]);
  if(ids.some(id=>typeof id!=='string'||!id)||new Set(ids).size!==ids.length)
    throw new TypeError('two distinct explicit source IDs required');
  const candidates=new Map(d.candidates.map(c=>[c.id,c]));
  const model={},sourceKinds={};
  for(const key of keys){
    const source=candidates.get(sourceIds[key]);
    if(!source||source.reviewStatus!=='confirmed'||source.kind!==kinds[kind][key])
      throw new TypeError('selected sources must be user-confirmed and match geometric kind');
    model[key]=modelGeometry(source,metric);
    sourceKinds[source.id]={kind:source.kind,geometry:model[key]};
  }
  const residuals=[];
  for(const c of d.candidates){
    if(c.reviewStatus!=='confirmed'||c.kind!=='dimension')continue;
    const dim=c.dimension;
    if(dim.unit!=='mm'||dim.refs.length!==1||!sourceKinds[dim.refs[0]])
      throw new TypeError('every accepted dimension must be mm and explicitly bind to a selected source');
    const expected=measureDimension(dim,sourceKinds[dim.refs[0]]);
    const residual=expected-dim.value;
    // This checks scale-label consistency only; it never proves metric calibration.
    const bound=1e-3+Math.abs(dim.value)*1e-3;
    if(!finite(residual)||Math.abs(residual)>bound)
      throw new RangeError('confirmed drawing dimension conflicts with metric calibration');
    residuals.push({dimensionId:c.id,sourceId:dim.refs[0],residualMm:residual});
  }
  // Explicit fillet radius is a separately user-confirmed MODEL measurement,
  // not a pixel radius and never inferred from an unassociated R label.
  if(!finite(filletRadiusMm)||filletRadiusMm<=0)throw new RangeError('positive confirmed fillet radius mm required');
  const problem=normalizeProblem({kind,unit:'mm',revision:d.revision,
    geometry:model,filletRadius:filletRadiusMm,options});
  return {problem,provenance:{
    draftRevision:d.revision,sourceIds:{...sourceIds},
    calibration:'explicit-user-reviewed-uniform-mm-per-pixel',
    recognizedCandidateProof:false,
    metricCalibrationMathematicallyProven:false,
    dimensionResiduals:residuals,
    globallyUnique:null}};
}
function runConfirmedSvgFillet(input){
  only(input,['draft','expectedRevision','calibration','kind','sourceIds',
    'filletRadiusMm','options','selection','sheet'],'confirmed SVG fillet request');
  const prepared=prepareConfirmedFillet(input);
  const timeline=confirmedFilletTimeline({
    problem:prepared.problem,selection:input.selection,sheet:input.sheet
  });
  if(timeline.revision!==prepared.problem.revision)
    throw new RangeError('V5 revision does not match current confirmed draft');
  return {...timeline,imageProvenance:prepared.provenance};
}
module.exports={checkCalibration,prepareConfirmedFillet,runConfirmedSvgFillet};
