'use strict';
/*
 * Same-project source bridge, not a recognition engine or an M3 adapter.
 * Candidate pixel geometry, human review, and model-mm conditions remain
 * separate. An origin ID is a traceability link, never a solver proof.
 */
const Draft=require('../recognition/problem-draft.cjs');
const {checkImage}=require('../recognition/page-transforms.cjs');
const ID=/^[A-Za-z][A-Za-z0-9_-]{0,79}$/;
const finite=Number.isFinite;
const copy=x=>JSON.parse(JSON.stringify(x));
function sourceStamp(source){
 if(!source||typeof source.imageId!=='string'||!ID.test(source.imageId))
  throw new Error('候选必须关联当前本机原图');
 return JSON.stringify([source.imageId,source.rotationDeg,source.calibration]);
}
function checkedRecognition(project){
 const record=project.recognition;
 if(record==null)return null;
 if(!record||typeof record!=='object'||Array.isArray(record)||
    Object.keys(record).some(k=>!['imageId','sourceStamp','draft'].includes(k))||
    record.imageId!==project.source.imageId||
    record.sourceStamp!==sourceStamp(project.source))
  throw new Error('识图候选来自不同原图或过期比例尺');
 const draft=Draft.validateDraft(record.draft);
 if(JSON.stringify(draft)!==JSON.stringify(record.draft))
  throw new Error('识图候选结构不规范，不能携带求解或动画资格');
 return draft;
}
function linkedCandidate(project,condition){
 if(condition.sourceCandidateId===null)return null;
 const draft=checkedRecognition(project);
 // Legacy v1 projects used an opaque candidate string before ProblemDraft
 // existed. Preserve their historic plain conditions only if they do NOT
 // claim any source-image binding. This never creates a reviewed candidate.
 if(!draft&&project.recognition==null&&
    condition.value?.imageId===undefined)return null;
 const candidate=draft?.candidates.find(c=>c.id===condition.sourceCandidateId);
 if(!candidate)throw new Error('条件引用的原图候选不存在');
 if(condition.value?.imageId!==project.source.imageId)
  throw new Error('候选条件所引用图片已变化');
 if(condition.confirmed && candidate.reviewStatus!=='confirmed')
  throw new Error('未经人工审核的候选不能支持已确认条件');
 return candidate;
}
function candidateLinks(project){
 const draft=checkedRecognition(project);
 if(!draft)return [];
 return draft.candidates.map(c=>({
  candidateId:c.id,kind:c.kind,status:c.reviewStatus,bbox:copy(c.bbox),
  conditions:project.conditions.filter(x=>x.sourceCandidateId===c.id)
   .map(x=>({conditionId:x.id,objectId:x.objectId,confirmed:x.confirmed}))
 }));
}
function manualSegment({id,from,to,image}){
 const meta=checkImage(image);
 if(typeof id!=='string'||!/^[A-Za-z][A-Za-z0-9_-]{0,63}$/.test(id))
  throw new Error('原图候选 ID 不合法');
 const inside=p=>p&&finite(p.x)&&finite(p.y)&&p.x>=0&&p.y>=0&&
  p.x<=meta.width&&p.y<=meta.height;
 if(!inside(from)||!inside(to)||Math.hypot(to.x-from.x,to.y-from.y)<1e-6)
  throw new Error('原图标注端点必须位于图片范围内且不能重合');
 const pad=Math.min(1,meta.width/100,meta.height/100);
 const left=Math.max(0,Math.min(from.x,to.x)-pad);
 const top=Math.max(0,Math.min(from.y,to.y)-pad);
 const right=Math.min(meta.width,Math.max(from.x,to.x)+pad);
 const bottom=Math.min(meta.height,Math.max(from.y,to.y)+pad);
 if(right<=left||bottom<=top)throw new Error('原图候选框面积无效');
 return {id,kind:'segment',method:'manual',confidence:1,
  reviewStatus:'unconfirmed',reviewedBy:null,
  bbox:{x:left,y:top,width:right-left,height:bottom-top},
  geometry:{frame:'drawing-px',from:copy(from),to:copy(to)},
  dimension:null};
}
function addManualCandidate(project,candidate,image){
 const source=sourceStamp(project.source);
 if(!candidate||candidate.reviewStatus!=='unconfirmed'||candidate.method!=='manual'||
    candidate.reviewedBy!==null)throw new Error('候选录入不得冒充人工批准');
 const meta=checkImage(image);
 const before=checkedRecognition(project);
 if(before&&JSON.stringify(before.image)!==JSON.stringify(meta))
  throw new Error('原图像素信息已变化，不能沿用旧候选');
 const items=before?[...before.candidates.filter(c=>c.id!==candidate.id),candidate]:[candidate];
 const draft=Draft.validateDraft({version:Draft.VERSION,revision:(before?.revision??-1)+1,
  image:meta,sourceToDrawing:before?.sourceToDrawing,
  candidates:items});
 if(draft.candidates.length>64)throw new Error('当前本机项目候选数量超过安全上限');
 return {imageId:project.source.imageId,sourceStamp:source,draft};
}
function reviewLocalCandidate(project,id,decision){
 const current=checkedRecognition(project);
 if(!current)throw new Error('没有待审核的原图候选');
 const draft=Draft.reviewCandidate(current,{id,decision,expectedRevision:current.revision});
 return {imageId:project.source.imageId,sourceStamp:sourceStamp(project.source),draft};
}
module.exports={sourceStamp,checkedRecognition,linkedCandidate,candidateLinks,
 manualSegment,addManualCandidate,reviewLocalCandidate};
