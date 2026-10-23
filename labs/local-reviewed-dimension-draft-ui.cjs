'use strict';
/**
 * Optional 08 public-photo UI gate: existing OCR reviewer + existing raster
 * ProblemDraft + TWO user-reviewed rulers -> existing #470 constraint adapter
 * -> existing M3 typed preflight / actual specialist solver.
 * No OCR, geometric detector, alternate M3, ConstructionIntent or V5 player.
 */
const {reviewCandidate}=require('../recognition/problem-draft.cjs');
const {proposeDimensionPaths}=require('../recognition/reviewed-dimension-path.cjs');
const {makeDimensionConstraint,prepareSpecialistInput}=
 require('../recognition/reviewed-path-dimension-draft.cjs');
const {solveFiniteFillet}=
 require('../engines/constraints-2d/finite-fillet-gate.cjs');
const {formFields}=require('./local-vector-svg-import.cjs');
const finite=n=>typeof n==='number'&&Number.isFinite(n);
function attachReviewedDimensionDraftUi({
 controls,getDraft,getGeneration,getReviewForDraft,onPrepared,dom=document
}={}){
 const needed=['refresh','geometry','candidates','rulerA','rulerAMm',
  'rulerB','rulerBMm','originX','originY','yAxis','scaleChecked',
  'geometryChecked','alternativesChecked','commit','attach','status',
  'segment','targetRadius','side','m3Accept','preflight','apply','m3Status'];
 if(!controls||needed.some(id=>!controls[id])||
  typeof getDraft!=='function'||typeof getGeneration!=='function'||
  typeof getReviewForDraft!=='function'||typeof onPrepared!=='function')
  throw new TypeError('complete existing photo association, raster, and M3 UI controls required');
 const C=controls;const node=(tag,text)=>{
  const e=dom.createElement(tag);if(text)e.textContent=text;return e;
 };
 const choice=(id,label)=>{const o=node('option',label);o.value=id;return o;};
 let source=null,accepted=null,prepared=null,solution=null;
 let lastPrepared=null,lastM3=null;
 let selections=new Map(),snapshot='',sourceGeneration=-1,reviewId='';
 function clearResults(reason){
  accepted=null;prepared=null;solution=null;lastPrepared=null;lastM3=null;
  C.preflight.disabled=true;C.apply.disabled=true;C.m3Accept.checked=false;
  C.commit.checked=false;
  C.status.textContent=reason||'来源已改变，请重新审核后生成 ProblemDraft。';
  C.m3Status.textContent='未运行 M3；没有选择圆心分支，也未播放 V5。';
 }
 function reset(){
  source=null;selections.clear();snapshot='';reviewId='';
  sourceGeneration=-1;
  C.candidates.replaceChildren();
  for(const s of [C.rulerA,C.rulerB,C.segment]){
   s.replaceChildren(choice('','读取当前原题后选择'));
   s.disabled=true;
  }
  for(const id of ['scaleChecked','geometryChecked','alternativesChecked'])
   C[id].checked=false;
  C.attach.disabled=true;
  C.geometry.textContent='请选择原题并完成本地 OCR、直线与圆的人工关联审核。';
  clearResults('尚无可转换的已审核来源。');
 }
 function freshness(){
  if(!source)return false;
  const fresh=getDraft();
  const proof=getReviewForDraft(source.revision);
  return fresh===source&&getGeneration()===sourceGeneration&&
   JSON.stringify(fresh)===snapshot&&proof?.selectedPathId===reviewId&&
   JSON.stringify(proof)===JSON.stringify(sourceProof);
 }
 let sourceProof=null;
 function invalidate(){
  clearResults('审核选项已改变，请重新提交尺寸关联并检查两条比例尺。');
 }
 function invalidateM3(){
  prepared=null;solution=null;lastPrepared=null;lastM3=null;
  C.preflight.disabled=!accepted;C.apply.disabled=true;
  C.m3Status.textContent='M3 参数或源线段已改变；此前的数学求解与 V5 导入许可作废。';
 }
 function render(){
  reset();
  const current=getDraft();
  if(!current)throw new RangeError('请先在此照片上检测线段和圆/圆弧');
  const input=getReviewForDraft(current.revision);
  if(!input)throw new RangeError('请先在上方确认本机 OCR 文字—引线—圆/圆弧的关联');
  // Do not promote detector output or prove matches in the UI.
  source=current;sourceProof=input;sourceGeneration=getGeneration();
  snapshot=JSON.stringify(current);
  reviewId=input.selectedPathId;
  const circleId=input.selectedPathId.split(':').at(-1);
  const eligible=current.candidates.filter(c=>c.kind==='segment');
  const target=current.candidates.find(c=>c.id===circleId);
  if(!target||!['circle','arc'].includes(target.kind))
   throw new RangeError('经审核目标不在当前原图图元候选中');
  C.candidates.replaceChildren();selections=new Map();
  for(const candidate of current.candidates){
   const row=node('label');row.className='raster-edit-group';
   const g=candidate.geometry;
   const description=candidate.kind==='segment'?
    '端点 '+JSON.stringify(g.from)+' → '+JSON.stringify(g.to):
    '中心 '+JSON.stringify(g.center)+'，半径 '+g.radiusPx+' 原图像素';
   const name=node('strong',candidate.id+' · '+candidate.kind+
    ' · '+description+'（须人工核对原图；无法确认则保持未审核）');
   const select=node('select');
   select.setAttribute('data-draft-review-id',candidate.id);
   select.append(choice('','未审核（禁止 M3 输入）'));
   select.append(choice('confirmed','我已按原图确认此图元和像素位置'));
   select.append(choice('rejected','我已检查，明确排除此图元'));
   select.addEventListener('change',invalidate);
   row.append(name,select);C.candidates.append(row);
   selections.set(candidate.id,select);
  }
  const opts=eligible.map(x=>choice(x.id,x.id+' · 从原图核对有限端点'));
  for(const select of [C.rulerA,C.rulerB,C.segment]){
   select.replaceChildren(choice('','选择一条真实有限源线段'));
   for(const o of opts)select.append(o.cloneNode(true));
   select.disabled=false;
  }
  C.geometry.textContent='当前草稿 '+current.candidates.length+
   ' 个图元；已审核文字目标 '+circleId+' ('+target.kind+
   ')。请逐个选择确认／排除；尤其要确认目标圆、所选引线、两条不同的比例尺和求解线段。';
  C.attach.disabled=false;
  C.status.textContent='所有图元仍是待审像素候选；请明确审阅，不能依据检测排名自动赋值。';
 }
 function positive(control,label){
  const n=control.value.trim()?control.valueAsNumber:NaN;
  if(!finite(n)||n<=0)throw new RangeError(label+' 必须是独立确认的正毫米数值');
  return n;
 }
 function number(control,label){
  if(!control.value.trim()||!finite(control.valueAsNumber))
   throw new RangeError(label+' 必须是有限数值');
  return control.valueAsNumber;
 }
 function reviewedDraft(){
  let d=source;
  for(const [id,el] of selections){
   const decision=el.value;
   if(decision!=='confirmed'&&decision!=='rejected')continue;
   d=reviewCandidate(d,{
    id,decision,expectedRevision:d.revision
   });
  }
  return d;
 }
 function createAttached(){
  if(!freshness())throw new RangeError('照片、OCR 文字或图元候选已变化，请重新读取');
  if(!C.scaleChecked.checked||!C.geometryChecked.checked||
     !C.commit.checked)
   throw new TypeError('逐项图元复核、两独立比例尺及提交确认缺一不可');
  const a=C.rulerA.value,b=C.rulerB.value;
  if(!a||!b||a===b)throw new TypeError('必须选择两条不同的已确认线段');
  const pathParts=sourceProof.selectedPathId.split(':');
  const target=pathParts.at(-1);
  const path=proposeDimensionPaths(sourceProof).proposals.find(x=>
   x.id===sourceProof.selectedPathId);
  if(!path)throw new RangeError('reviewed source path is no longer present');
  const required=new Set([a,b,target,C.segment.value,
   ...path.leaderCandidateIds]);
  if(!C.segment.value)throw new TypeError('请选定实际用于 M3 的有限线段');
  for(const id of required)
   if(!selections.has(id)||selections.get(id).value!=='confirmed')
    throw new TypeError('当前尺寸目标、引线、比例尺与求解线段均需逐个确认：'+id);
  const d=reviewedDraft();
  const request={...sourceProof,revision:d.revision,
   expectedRevision:d.revision};
  const output=makeDimensionConstraint({
   draft:d,expectedRevision:d.revision,association:request,
   sourceEpoch:request.sourceEpoch,currentSourceEpoch:request.sourceEpoch,
   selectedAlternativesReviewed:C.alternativesChecked.checked,
   editedGeometryReviewed:C.geometryChecked.checked,
   calibrationReviewed:C.scaleChecked.checked,targetKindConfirmed:true,
   calibration:{first:{sourceId:a,knownLengthMm:positive(C.rulerAMm,'第一条尺'),
     confirmed:true},
    second:{sourceId:b,knownLengthMm:positive(C.rulerBMm,'第二条尺'),
     confirmed:true},
    originPx:{x:number(C.originX,'原点X'),y:number(C.originY,'原点Y')},
    yAxis:C.yAxis.value}
  });
  if(output.status!=='dimension-attached-to-existing-draft'){
   clearResults('来源仍有阻断：'+output.status+'。'+
    (output.ratioDifference===undefined?'':' 两尺差 '+(output.ratioDifference*100).toFixed(3)+'%')+
    (output.residualMm===undefined?'':' 尺寸残差 '+output.residualMm+' mm'));
   return;
  }
  accepted=output;C.preflight.disabled=false;C.commit.checked=false;
  C.status.textContent='ProblemDraft 已加入经审核 R/Φ→'+output.sourceTargetId+
   ' 的毫米尺寸约束；修订 '+output.draft.revision+
   '，两尺相对误差 '+(output.scaleRelativeDifference*100).toFixed(3)+
   '%。'+(output.readiness.status==='candidate-reviewed'?
    '全部图元已确认／排除，可继续进行 M3 预检。':
    '仍有其他未审核图元；M3 预检会拒绝。')+
   ' 此结果不是原题盲测通过，亦未执行作图。';
 }
 function runPreflight(){
  if(!freshness()||!accepted)throw new RangeError('来源改变或未生成已审核尺寸草稿');
  if(!C.m3Accept.checked)throw new TypeError('必须另外确认 M3 模型输入及连接侧别');
  if(!['1','-1'].includes(C.side.value))
   throw new TypeError('明确选择连接线段圆的一侧 +1/-1');
  const doc=prepareSpecialistInput(accepted,{
   currentDraft:accepted.draft,expectedRevision:accepted.draft.revision,
   kind:'segment-circle',sourceIds:{segment:C.segment.value,circle:accepted.sourceTargetId},
   filletRadiusMm:positive(C.targetRadius,'连接 R'),
   options:{side:Number(C.side.value)}
  });
  const analytic=solveFiniteFillet(doc.problem);
  if(!['unique','multiple'].includes(analytic.status)||
     !analytic.candidates.length)
   throw new RangeError('现有 M3 没有离散已验证可用解：'+analytic.status);
  prepared=doc;solution=analytic;
  lastPrepared=doc;lastM3=analytic;C.apply.disabled=false;
  C.m3Status.textContent='已用原有 M3 解析求解器得到 '+analytic.candidateCount+
   ' 个经过有限几何检查的候选解，状态 '+analytic.status+
   '。未自动选择任一分支，尚未通过 G1 与 V5 逐笔作图最终验收。';
 }
 function apply(){
  if(!freshness()||!prepared||!solution||
    !['unique','multiple'].includes(solution.status))
   throw new RangeError('当前来源未通过现有 M3 求解或已变化');
  const fields=formFields({problem:prepared.problem});
  onPrepared({fields,problem:prepared.problem,
   candidateCount:solution.candidateCount,status:solution.status,
   requiresFinalFieldReview:true,requiresBranchSelection:true,
   sourceProofScope:'reviewed-draft-only'});
  // A successful transfer only prefills explicit fields and invalidates old
  // UI mathematical playback; the existing form owns all G1/V5 confirmation.
  prepared=null;solution=null;C.apply.disabled=true;C.preflight.disabled=true;
  C.m3Status.textContent='已填入原有毫米条件工作台，所有旧数学步骤失效。'+
   '请逐项复核最终条件、选圆心分支、方向与行进路径，才可能使用原 V5。';
 }
 C.refresh.addEventListener('click',()=>{
  try{render();}catch(error){reset();C.geometry.textContent='来源未就绪：'+error.message;}
 });
 C.attach.addEventListener('click',()=>{try{createAttached();}catch(error){
  clearResults('无法生成经审核尺寸约束：'+error.message);
 }});
 C.preflight.addEventListener('click',()=>{try{runPreflight();}catch(error){
  prepared=null;solution=null;C.apply.disabled=true;
  C.m3Status.textContent='M3 输入检查或实际求解被拒绝：'+error.message;
 }});
 C.apply.addEventListener('click',()=>{try{apply();}catch(error){
  prepared=null;solution=null;C.apply.disabled=true;
  C.m3Status.textContent='禁止填入旧数学条件：'+error.message;
 }});
 for(const id of ['rulerA','rulerAMm','rulerB','rulerBMm','originX',
  'originY','yAxis','scaleChecked','geometryChecked',
  'alternativesChecked']){
  const el=C[id];el.addEventListener('input',invalidate);
  el.addEventListener('change',invalidate);
 }
 for(const id of ['segment','targetRadius','side','m3Accept']){
  const el=C[id];el.addEventListener('input',invalidateM3);
  el.addEventListener('change',invalidateM3);
 }
 reset();
 return Object.freeze({reset,
  getEvidenceSnapshot(){
   // Never expose a stale photo, old OCR verdict, or derived result when the
   // source generation/revision has changed. Read-only, user-local snapshot.
   if(!freshness())return null;
   return {
    sourceRevision:source.revision,sourceGeneration,
    reviewedAssociation:structuredClone(sourceProof),
    acceptedDraft:accepted?structuredClone(accepted.draft):null,
    calibration:accepted?structuredClone(accepted.calibration):null,
    preparedProblem:lastPrepared?structuredClone(lastPrepared.problem):null,
    actualM3:lastM3?structuredClone(lastM3):null
   };
  },
  get status(){return accepted?.status??'unreviewed'},
  get m3Status(){return solution?.status??'not-executed'}
 });
}
module.exports={attachReviewedDimensionDraftUi};
