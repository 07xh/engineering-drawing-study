'use strict';
/**
 * DraftAI 09: transparent, one-to-one evaluation of *image-space proposals*.
 * Quality statistics do NOT attest a mathematical solution or OCR consent.
 */
const KINDS=Object.freeze(['line','circle','arc','dimension','arrow']);
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const imageOK=i=>i&&Number.isSafeInteger(i.width)&&Number.isSafeInteger(i.height)&&
 i.width>=24&&i.height>=24&&i.width<=10000&&i.height<=10000;
const point=(p,i)=>p&&finite(p.x)&&finite(p.y)&&
 p.x>=0&&p.y>=0&&p.x<=i.width&&p.y<=i.height;
const rect=(b,i)=>Array.isArray(b)&&b.length===4&&b.every(finite)&&
 b[0]>=0&&b[1]>=0&&b[2]>0&&b[3]>0&&
 b[0]+b[2]<=i.width&&b[1]+b[3]<=i.height;
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function iou(a,b){
 const x=Math.max(0,Math.min(a[0]+a[2],b[0]+b[2])-Math.max(a[0],b[0]));
 const y=Math.max(0,Math.min(a[1]+a[3],b[1]+b[3])-Math.max(a[1],b[1]));
 const intersection=x*y,union=a[2]*a[3]+b[2]*b[3]-intersection;
 return union>0?intersection/union:0;
}
function validate(item,i){
 if(!item||typeof item.id!=='string'||
  !/^[a-z0-9][a-z0-9_-]{0,63}$/i.test(item.id)||
  !KINDS.includes(item.kind)||
  item.coordinateSpace!=='original-image-px')
  throw new TypeError('invalid original-image candidate ID/kind/coordinate space');
 switch(item.kind){
 case 'line':
  if(!point(item.from,i)||!point(item.to,i)||dist(item.from,item.to)<5)
   throw new TypeError('line needs nondegenerate finite segment in original pixels');
  break;
 case 'circle':
 case 'arc':
  if(!point(item.center,i)||!finite(item.radius)||item.radius<=0||
   item.radius>Math.hypot(i.width,i.height))
   throw new TypeError('invalid finite circle/arc');
  if(item.kind==='arc'&&item.coverageDeg!==undefined&&
   (!finite(item.coverageDeg)||item.coverageDeg<0||item.coverageDeg>360))
   throw new TypeError('invalid arc coverage');
  break;
 case 'dimension':
  if(!rect(item.bbox,i)||typeof item.text!=='string'||item.text.length>80)
   throw new TypeError('invalid image-space OCR label');
  break;
 case 'arrow':
  if(!point(item.tip,i))throw new TypeError('arrow requires bounded tip');
  break;
 }
}
function qualify(truth,pred,{lineTolerancePx,circleTolerancePx,
 radiusTolerancePx,arrowTolerancePx,minTextIoU}){
 if(truth.kind!==pred.kind)return null;
 if(truth.kind==='line'){
  const direct=Math.max(dist(truth.from,pred.from),dist(truth.to,pred.to));
  const reverse=Math.max(dist(truth.from,pred.to),dist(truth.to,pred.from));
  const residual=Math.min(direct,reverse);
  return residual<=lineTolerancePx?{residual,score:1-residual/(lineTolerancePx+1)}:null;
 }
 if(truth.kind==='circle'||truth.kind==='arc'){
  const centerError=dist(truth.center,pred.center);
  const radiusError=Math.abs(truth.radius-pred.radius);
  if(centerError>circleTolerancePx||radiusError>radiusTolerancePx)return null;
  if(truth.kind==='arc'&&finite(truth.coverageDeg)&&finite(pred.coverageDeg)&&
   Math.abs(truth.coverageDeg-pred.coverageDeg)>25)return null;
  const residual=centerError+radiusError;
  return {residual,score:1-(centerError/(circleTolerancePx+1)+
   radiusError/(radiusTolerancePx+1))/2};
 }
 if(truth.kind==='dimension'){
  // Recognition transcription must be evaluated, not only annotation bbox.
  if(truth.text.trim().toUpperCase()!==pred.text.trim().toUpperCase())return null;
  const overlap=iou(truth.bbox,pred.bbox);
  return overlap>=minTextIoU?{residual:1-overlap,score:overlap}:null;
 }
 const error=dist(truth.tip,pred.tip);
 return error<=arrowTolerancePx?{residual:error,score:1-error/(arrowTolerancePx+1)}:null;
}
function quality(tp,fp,fn){
 const precision=tp+fp?tp/(tp+fp):null;
 const recall=tp+fn?tp/(tp+fn):null;
 const f1=tp+fp+fn===0?null:tp===0?0:
  precision!==null&&recall!==null&&precision+recall?
   2*precision*recall/(precision+recall):0;
 return {tp,fp,fn,precision,recall,f1};
}
function evaluateRecognitionProposals(dataset,{
 lineTolerancePx=7,circleTolerancePx=6,radiusTolerancePx=5,
 arrowTolerancePx=7,minTextIoU=.45
}={}){
 const i=dataset?.image,truth=dataset?.truth,pred=dataset?.predictions;
 if(!imageOK(i)||!Array.isArray(truth)||!Array.isArray(pred)||
  truth.length>200||pred.length>200||
  ![lineTolerancePx,circleTolerancePx,radiusTolerancePx,
    arrowTolerancePx,minTextIoU].every(finite)||
  Math.min(lineTolerancePx,circleTolerancePx,radiusTolerancePx,
    arrowTolerancePx)<=0||Math.max(lineTolerancePx,circleTolerancePx,
     radiusTolerancePx,arrowTolerancePx)>50||
  minTextIoU<=0||minTextIoU>1)
  throw new TypeError('bounded annotated recognition evaluation required');
 for(const collection of [truth,pred]){
  const ids=new Set();
  for(const v of collection){
   validate(v,i);
   if(ids.has(v.id))throw new TypeError('duplicate candidate ID');
   ids.add(v.id);
  }
 }
 const result={byKind:{},matches:[],unmatchedTruth:[],unmatchedPredictions:[],
  image:{width:i.width,height:i.height},
  qualityIsNotMathProof:true};
 for(const kind of KINDS){
  const t=truth.filter(x=>x.kind===kind),p=pred.filter(x=>x.kind===kind);
  const edges=t.map(a=>p.map((b,pi)=>{
   const match=qualify(a,b,{lineTolerancePx,circleTolerancePx,
    radiusTolerancePx,arrowTolerancePx,minTextIoU});
   return match?{...match,pi}:null;
  }).filter(Boolean).sort((a,b)=>b.score-a.score||a.pi-b.pi));
  // Deterministic augmenting paths give maximum cardinality; merely
  // greedily taking the closest pair can undercount actual detections.
  const owner=new Array(p.length).fill(-1);
  function assign(ti,seen){
   for(const edge of edges[ti]){
    if(seen.has(edge.pi))continue;
    seen.add(edge.pi);
    if(owner[edge.pi]===-1||assign(owner[edge.pi],seen)){
     owner[edge.pi]=ti;return true;
    }
   }
   return false;
  }
  for(let ti=0;ti<t.length;ti++)assign(ti,new Set());
  const matchedTruth=new Set();
  for(let pi=0;pi<p.length;pi++)if(owner[pi]!==-1){
   const ti=owner[pi];
   const match=edges[ti].find(e=>e.pi===pi);
   matchedTruth.add(ti);
   result.matches.push({kind,truthId:t[ti].id,predictionId:p[pi].id,
    residualPx:match.residual,score:match.score});
  }
  t.forEach((item,ti)=>{if(!matchedTruth.has(ti))
   result.unmatchedTruth.push({kind,id:item.id});});
  p.forEach((item,pi)=>{if(owner[pi]===-1)
   result.unmatchedPredictions.push({kind,id:item.id});});
  const tp=matchedTruth.size;
  result.byKind[kind]=quality(tp,p.length-tp,t.length-tp);
 }
 const all=Object.values(result.byKind);
 result.micro=quality(all.reduce((s,x)=>s+x.tp,0),
  all.reduce((s,x)=>s+x.fp,0),all.reduce((s,x)=>s+x.fn,0));
 result.macroF1=null;
 const measured=all.filter(x=>x.tp+x.fp+x.fn>0&&x.f1!==null);
 if(measured.length)result.macroF1=measured.reduce((s,x)=>s+x.f1,0)/measured.length;
 return result;
}
module.exports={evaluateRecognitionProposals};
