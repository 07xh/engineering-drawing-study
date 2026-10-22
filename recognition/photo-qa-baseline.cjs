'use strict';
/**
 * Compare one image's image-space detection quality across two runs.
 * Fingerprints bind the ORIGINAL PHOTO and exactly the SAME manual truth.
 * Same sample, same scoring classes, same evaluator contract are essential.
 */
const SCHEMA='draftai-photo-qa-baseline/1';
const SPEC='draftai-image-pixel-bipartite-matching/1';
const kinds=['line','circle','arc','dimension','arrow'];
const hex=/^[0-9a-f]{64}$/;
const object=x=>x&&typeof x==='object'&&!Array.isArray(x);
function exactKeys(x,keys){
 return object(x)&&Object.keys(x).every(key=>keys.includes(key))&&
  keys.every(key=>Object.hasOwn(x,key));
}
function counts(source){
 if(!exactKeys(source,['tp','fp','fn'])||
  ![source.tp,source.fp,source.fn].every(x=>
   Number.isSafeInteger(x)&&x>=0&&x<=200))
  throw new TypeError('invalid nonnegative recognition counts');
 return {tp:source.tp,fp:source.fp,fn:source.fn};
}
function inspectBaseline(b){
 if(!exactKeys(b,['schema','metricSpec','image','manualTruthSha256',
  'scoredKinds','notRunKinds','byKind','scope'])||
  b.schema!==SCHEMA||b.metricSpec!==SPEC||
  !exactKeys(b.image,['width','height','sha256'])||
  ![b.image.width,b.image.height].every(x=>Number.isSafeInteger(x)&&x>=32&&x<=10000)||
  !hex.test(b.image.sha256)||!hex.test(b.manualTruthSha256)||
  !Array.isArray(b.scoredKinds)||!Array.isArray(b.notRunKinds)||
  b.scoredKinds.length===0||b.scoredKinds.length>5||
  b.notRunKinds.length>5||
  b.scoredKinds.some(x=>!kinds.includes(x))||
  b.notRunKinds.some(x=>!kinds.includes(x))||
  new Set(b.scoredKinds).size!==b.scoredKinds.length||
  new Set(b.notRunKinds).size!==b.notRunKinds.length||
  b.scoredKinds.some(x=>b.notRunKinds.includes(x))||
  !object(b.byKind)||Object.keys(b.byKind).length!==b.scoredKinds.length||
  b.scope!=='single-image-unreviewed-manual-ground-truth')
  throw new TypeError('invalid QA baseline or incompatible metric specification');
 const totals={tp:0,fp:0,fn:0};
 for(const kind of b.scoredKinds){
  if(!Object.hasOwn(b.byKind,kind))throw new TypeError('missing baseline kind');
  const c=counts(b.byKind[kind]);
  for(const key of ['tp','fp','fn'])totals[key]+=c[key];
 }
 if(totals.tp+totals.fn===0)throw new TypeError('no annotated ground truth to compare');
 return b;
}
function createPhotoQaBaseline({snapshot,report,photoSha256,truthSha256}){
 if(!snapshot?.ready||!report||report.status!=='evaluated'||
  report.schema!=='draftai-local-photo-quality-report/1'||
  report.revision!==snapshot.revision||
  ![photoSha256,truthSha256].every(x=>typeof x==='string'&&hex.test(x))||
  !snapshot.image||!report.image||
  snapshot.image.width!==report.image.width||
  snapshot.image.height!==report.image.height)
  throw new TypeError('current evaluated QA session and valid photo/truth fingerprints required');
 const scored=report.scoredKinds;
 const notRun=report.notRunKinds;
 if(!Array.isArray(scored)||!Array.isArray(notRun)||
  !report.metrics||!report.metrics.byKind)
  throw new TypeError('missing detector execution evidence');
 const byKind={};
 for(const kind of scored)byKind[kind]=counts(report.metrics.byKind[kind]);
 const baseline={schema:SCHEMA,metricSpec:SPEC,
  image:{width:snapshot.image.width,height:snapshot.image.height,sha256:photoSha256},
  manualTruthSha256:truthSha256,
  scoredKinds:[...scored],notRunKinds:[...notRun],byKind,
  scope:'single-image-unreviewed-manual-ground-truth'};
 return JSON.parse(JSON.stringify(inspectBaseline(baseline)));
}
function ratios(c){
 const precision=c.tp+c.fp?c.tp/(c.tp+c.fp):null;
 const recall=c.tp+c.fn?c.tp/(c.tp+c.fn):null;
 const f1=c.tp+c.fp+c.fn===0?null:
  c.tp===0?0:2*c.tp/(2*c.tp+c.fp+c.fn);
 return {precision,recall,f1};
}
const delta=(a,b)=>a===null||b===null?null:Number((b-a).toFixed(6));
function comparePhotoQaBaseline(previous,params){
 const base=inspectBaseline(previous);
 const now=createPhotoQaBaseline(params);
 if(base.image.sha256!==now.image.sha256||
  base.image.width!==now.image.width||base.image.height!==now.image.height)
  throw new RangeError('different original photo cannot be compared');
 if(base.manualTruthSha256!==now.manualTruthSha256)
  throw new RangeError('manual annotation set changed; not a comparable benchmark');
 if(JSON.stringify(base.scoredKinds)!==JSON.stringify(now.scoredKinds)||
  JSON.stringify(base.notRunKinds)!==JSON.stringify(now.notRunKinds))
  throw new RangeError('detector execution/scored-kind coverage changed');
 const byKind={};
 for(const kind of base.scoredKinds){
  const old=base.byKind[kind],latest=now.byKind[kind];
  if(old.tp+old.fn!==latest.tp+latest.fn)
   throw new RangeError('ground truth denominator changed');
  const oldRatios=ratios(old),newRatios=ratios(latest);
  byKind[kind]={
   before:old,after:latest,
   deltaTP:latest.tp-old.tp,deltaFP:latest.fp-old.fp,
   deltaFN:latest.fn-old.fn,
   deltaPrecision:delta(oldRatios.precision,newRatios.precision),
   deltaRecall:delta(oldRatios.recall,newRatios.recall),
   deltaF1:delta(oldRatios.f1,newRatios.f1)
  };
 }
 return {
  schema:'draftai-photo-qa-comparison/1',
  status:'comparable',imageFingerprintsMatch:true,
  manualTruthFingerprintsMatch:true,
  scoredKinds:[...base.scoredKinds],byKind,
  scope:'one-image-unreviewed-manual-truth-no-general-accuracy-claim',
  noPhotoBytes:true
 };
}
module.exports={createPhotoQaBaseline,comparePhotoQaBaseline};
