'use strict';
/*
 * DraftAI local project coordination only.
 * This module owns confirmed inputs, view selection and revision identity.
 * It intentionally does NOT own SolveResult, ConstructionIntent, DAG or V5 state.
 */
const {validSavedCalibration}=require('./source-calibration.cjs');
const CandidateBridge=require('./source-candidate-bridge.cjs');
const {TYPES:RELATION_TYPES}=require('../core/constraints/multiobject-relation-evidence.cjs');
const {solveAffinePointConstraints}=require('../core/constraints/affine-point-unknown-solver.cjs');
const affineSourceStamp=source=>JSON.stringify([source.imageId,source.rotationDeg,source.calibration]);
const FORMAT = 'draftai-local-project';
const VERSION = 1;
const TASKS = Object.freeze(['planar', 'projection', 'exploration', 'composition']);
const VIEWS = Object.freeze(['V', 'H', 'W', '3D']);
const KINDS = Object.freeze(['point', 'line', 'plane', 'edge', 'solid']);
const ID = /^[A-Za-z][A-Za-z0-9_-]{0,79}$/;
const plain = x => !!x && Object.getPrototypeOf(x) === Object.prototype;
const isId = x => typeof x === 'string' && ID.test(x);
const finite = x => typeof x === 'number' && Number.isFinite(x);

function jsonValue(value, depth = 0) {
  if (depth > 12) return false;
  if (value === null || typeof value === 'boolean') return true;
  if (typeof value === 'string') return value.length <= 10000 && !/^data:(?:image|application\/octet-stream)/i.test(value);
  if (typeof value === 'number') return finite(value);
  if (Array.isArray(value)) return value.length <= 5000 && value.every(x => jsonValue(x, depth + 1));
  return plain(value) && Object.keys(value).length <= 100 &&
    Object.entries(value).every(([k, v]) => k !== '__proto__' && k !== 'constructor' &&
      k !== 'prototype' && jsonValue(v, depth + 1));
}
const copy = data => JSON.parse(JSON.stringify(data));
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const defaults = () => ({
  mode: 'split', selectedObjectId: null,
  overlays: {projections: true, guides: true},
  paper: {zoom: 1, panX: 0, panY: 0},
  camera: {yaw: 0, pitch: 0}
});
function newProject({id, title = '未命名项目', task = 'planar'} = {}) {
  if (!isId(id) || typeof title !== 'string' || !title.trim() || title.length > 120 ||
      !TASKS.includes(task)) throw new Error('无效的项目 ID、名称或任务类型');
  return {
    format: FORMAT, version: VERSION, id, title, task, revision: 0,
    source: {imageId: null, rotationDeg: 0, calibration: null},
    objects: [], conditions: [], relations: [], affineProblem:null, view: defaults()
  };
}
function validateProject(p) {
  const errors = [];
  if (!plain(p) || p.format !== FORMAT || p.version !== VERSION) {
    return {ok: false, errors: ['不支持的本地项目格式或版本']};
  }
  if (!isId(p.id) || typeof p.title !== 'string' || !p.title.trim() ||
      p.title.length > 120 || !TASKS.includes(p.task)) errors.push('项目基本信息无效');
  if (!Number.isSafeInteger(p.revision) || p.revision < 0) errors.push('输入版本号无效');
  if (!plain(p.source) || (p.source.imageId !== null && !isId(p.source.imageId)) ||
      ![0, 90, 180, 270].includes(p.source.rotationDeg) ||
      (p.source.calibration !== null &&
       (!plain(p.source.calibration) || !validSavedCalibration(p.source.calibration) ||
        !isId(p.source.calibration.confirmedBy)))) {
    errors.push('原图及比例校准信息无效');
  }
  if (!Array.isArray(p.objects) || p.objects.length > 2000 ||
      !Array.isArray(p.conditions) || p.conditions.length > 4000) {
    return {ok: false, errors: [...errors, '对象或条件集合无效']};
  }
  const objectIds = new Set(), references = new Set();
  for (const obj of p.objects) {
    if (!plain(obj) || !isId(obj.id) || !KINDS.includes(obj.kind) ||
        !plain(obj.projections) || (obj.spatialId !== null && !isId(obj.spatialId))) {
      errors.push('对象结构无效'); continue;
    }
    if (objectIds.has(obj.id)) errors.push('对象 ID 重复');
    objectIds.add(obj.id);
    for (const view of VIEWS) {
      const names = view === '3D' ? (obj.spatialId === null ? [] : [obj.spatialId]) : obj.projections[view];
      if (!Array.isArray(names) || names.length > 100 || names.some(x => !isId(x)) ||
          new Set(names).size !== names.length) {
        errors.push(view + ' 对象投影映射无效'); continue;
      }
      for (const name of names) {
        const key = view + ':' + name;
        if (references.has(key)) errors.push('视图图元归属重复：' + key);
        references.add(key);
      }
    }
  }
  try{ CandidateBridge.checkedRecognition(p); }
  catch(e){errors.push('原图候选无效：'+e.message);}
  const conditionIds = new Set();
  for (const c of p.conditions) {
    if (!plain(c) || !isId(c.id) || (c.objectId !== null && !objectIds.has(c.objectId)) ||
        (c.sourceCandidateId !== null && !isId(c.sourceCandidateId)) ||
        typeof c.confirmed !== 'boolean' || !jsonValue(c.value)) {
      errors.push('条件或来源信息无效'); continue;
    }
    try{CandidateBridge.linkedCandidate(p,c);}
    catch(e){errors.push('条件来源关联无效：'+e.message);}
    if (conditionIds.has(c.id)) errors.push('条件 ID 重复');
    conditionIds.add(c.id);
  }
  // Optional for VERSION=1 legacy projects; never uplift a relation from JSON
  // as an independently proved mathematical result.
  const relations=p.relations??[];
  if(!Array.isArray(relations)||relations.length>200)errors.push('数学关系集合无效');
  else{
    const seen=new Set();
    for(const row of relations){
      if(!plain(row)||!isId(row.id)||seen.has(row.id)||
        !RELATION_TYPES.includes(row.kind)||!Array.isArray(row.objectIds)||
        row.objectIds.length!==2||row.objectIds[0]===row.objectIds[1]||
        row.objectIds.some(id=>!objectIds.has(id))||
        typeof row.confirmed!=='boolean'||
        (row.kind==='distance'
          ?!finite(row.value)||row.value<=0||row.value>1e8
          :row.value!==null)){
        errors.push('数学关系来源、对象或数值无效');continue;
      }
      seen.add(row.id);
      if(row.confirmed&&row.objectIds.some(id=>!p.conditions.some(c=>
         c.objectId===id&&c.confirmed)))
        errors.push('未经人工确认的几何不能证明对象间关系');
    }
  }
  // A separately reviewed affine system can be stored in this SAME project,
  // but never revived as a verified M3 result after local restore.
  if(p.affineProblem!==undefined&&p.affineProblem!==null){
    const a=p.affineProblem;
    if(!plain(a)||p.task!=='composition'||
       typeof a.confirmed!=='boolean'||
       typeof a.sourceStamp!=='string'||
       (a.confirmed&&(a.imageId!==p.source.imageId||
         a.sourceStamp!==affineSourceStamp(p.source)))||
       !jsonValue(a)||Object.keys(a).some(k=>
        !['frame','unit','points','constraints','imageId','sourceStamp','confirmed'].includes(k)))
      errors.push('未签收的未知点约束或原图版本不一致');
    else{
      try{solveAffinePointConstraints({frame:a.frame,unit:a.unit,
        points:a.points,constraints:a.constraints,revision:p.revision});}
      catch(e){errors.push('未知点约束无效：'+e.message);}
      if(a.points?.some(p=>objectIds.has(p.id)))
       errors.push('未知点与已有几何对象 ID 冲突');
    }
  }
  const v = p.view;
  if (!plain(v) || !['split', '2d', '3d'].includes(v.mode) ||
      (v.selectedObjectId !== null && !objectIds.has(v.selectedObjectId)) ||
      !plain(v.overlays) || !['projections', 'guides'].every(k => typeof v.overlays[k] === 'boolean') ||
      !plain(v.paper) || !finite(v.paper.zoom) || v.paper.zoom < .05 || v.paper.zoom > 100 ||
      !finite(v.paper.panX) || !finite(v.paper.panY) ||
      !plain(v.camera) || !finite(v.camera.yaw) || !finite(v.camera.pitch)) {
    errors.push('视图状态无效');
  }
  // Never accept serialized solver assertions, playable steps or verified status.
  if (['solveResult', 'verified', 'constructionSteps', 'playerState', 'resultSnapshot']
      .some(k => Object.prototype.hasOwnProperty.call(p, k))) {
    errors.push('项目文件不得携带旧计算结果或已验证资格');
  }
  if (!jsonValue(p)) errors.push('项目包含不可序列化的数值或非数据字段');
  return {ok: errors.length === 0, errors};
}
function requireValid(p) {
  const check = validateProject(p);
  if (!check.ok) throw new Error(check.errors.join('；'));
  return p;
}
function createCoordinator(initial, hooks = {}) {
  let project = copy(requireValid(initial));
  const listeners = new Set(), past = [], future = [];
  let adapter = null, unsubscribe = null;
  // Derived M3 Geometry may not exist as an input object. Keep its selection
  // transient: NEVER persist it as a confirmed project condition or ID.
  let selectedSceneGeometryId = null;
  const emit = kind => {
    const snap = snapshot();
    for (const listener of listeners) listener({kind, revision: project.revision, project: snap});
  };
  function snapshot() { return copy(project); }
  function notifySolver() {
    selectedSceneGeometryId = null;
    if (!adapter) return;
    adapter.stopPlayback();
    adapter.invalidate();
    adapter.loadInputs(copy({
      projectId: project.id, task: project.task, revision: project.revision,
      source: project.source, objects: project.objects,
      conditions: project.conditions.filter(c => c.confirmed),
      relations: (project.relations||[]).filter(r=>r.confirmed),
      totalRelationCount:(project.relations||[]).length,
      affineProblem:project.affineProblem?.confirmed?project.affineProblem:null,
      affinePending:!!project.affineProblem&&!project.affineProblem.confirmed
    }));
  }
  function commit(change) {
    const next = snapshot();
    change(next);
    if (same(next, project)) return snapshot();
    if (!Number.isSafeInteger(project.revision + 1)) throw new Error('项目修订号超出范围');
    next.revision = project.revision + 1;
    requireValid(next);
    past.push(snapshot());
    if (past.length > 100) past.shift();
    future.length = 0;
    project = next;
    notifySolver();
    emit('input');
    return snapshot();
  }
  function replace(next) {
    const candidate = copy(requireValid(next));
    candidate.revision = project.revision + 1; // Undo never resurrects verified outputs.
    requireValid(candidate);
    project = candidate;
    notifySolver();
    emit('input');
    return snapshot();
  }
  function updateView(patch) {
    const next = snapshot();
    next.view = {...next.view, ...patch};
    requireValid(next);
    project = next; // Pan/zoom/camera/selection never increments math revision.
    emit('view');
    return snapshot();
  }
  const api = {
    snapshot, validate: () => validateProject(project),
    subscribe(listener) {
      if (typeof listener !== 'function') throw new TypeError('需要变更监听函数');
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    putObject(object) {
      return commit(p => {
        const i = p.objects.findIndex(o => o.id === object?.id);
        if (!jsonValue(object)) throw new Error('对象包含不可序列化字段');
        const next = copy(object);
        if (i < 0) p.objects.push(next); else p.objects[i] = next;
        if(p.relations)p.relations=p.relations.map(r=>r.objectIds.includes(next.id)?
          {...r,confirmed:false}:r);
      });
    },
    deleteObject(id) {
      return commit(p => {
        p.objects = p.objects.filter(o => o.id !== id);
        p.conditions = p.conditions.filter(c => c.objectId !== id);
        if(p.relations)p.relations=p.relations.filter(r=>!r.objectIds.includes(id));
        if (p.view.selectedObjectId === id) p.view.selectedObjectId = null;
      });
    },
    putSourceCandidate(candidate,imageMeta) {
      return commit(p=>{
        p.recognition=CandidateBridge.addManualCandidate(p,candidate,imageMeta);
        p.conditions=p.conditions.map(c=>c.sourceCandidateId===candidate.id?
         {...c,confirmed:false}:c);
        if(p.relations)p.relations=p.relations.map(r=>({...r,confirmed:false}));
      });
    },
    reviewSourceCandidate(id,decision) {
      return commit(p=>{
        p.recognition=CandidateBridge.reviewLocalCandidate(p,id,decision);
        p.conditions=p.conditions.map(c=>c.sourceCandidateId===id?
         {...c,confirmed:false}:c);
        if(p.relations)p.relations=p.relations.map(r=>({...r,confirmed:false}));
      });
    },
    sourceCandidates(){return CandidateBridge.candidateLinks(project);},
    putCondition(condition) {
      return commit(p => {
        const i = p.conditions.findIndex(c => c.id === condition?.id);
        if (!jsonValue(condition)) throw new Error('条件包含不可序列化字段');
        const next = copy(condition);
        next.confirmed = false; // Only confirmCondition can promote candidates.
        if (i < 0) p.conditions.push(next); else p.conditions[i] = next;
        if(p.relations)p.relations=p.relations.map(r=>r.objectIds.includes(next.objectId)?
          {...r,confirmed:false}:r);
      });
    },
    confirmCondition(id) {
      return commit(p => {
        const condition = p.conditions.find(c => c.id === id);
        if (!condition) throw new Error('条件不存在');
        if (condition.value?.imageId && condition.value.imageId !== p.source.imageId)
          throw new Error('标注来自旧图片，必须在当前原图重新标记');
        const source=CandidateBridge.linkedCandidate(p,condition);
        if(source&&source.reviewStatus!=='confirmed')
          throw new Error('原图候选尚未经人工确认，禁止将条件晋升');

        condition.confirmed = true;
      });
    },
    deleteCondition(id) { return commit(p => {
      const c=p.conditions.find(x=>x.id===id);
      p.conditions=p.conditions.filter(x=>x.id!==id);
      if(c&&p.relations)p.relations=p.relations.map(r=>r.objectIds.includes(c.objectId)?
       {...r,confirmed:false}:r);
    }); },
    putAffineProblem(candidate){
      return commit(p=>{
        if(p.task!=='composition')throw new Error('未知点约束属于当前多对象项目');
        if(p.objects.length||p.conditions.length||(p.relations||[]).length)
          throw new Error('当前已有独立手工几何；请在同一工作台另建项目，避免把两个求解范围误合并');
        if(!jsonValue(candidate))throw new Error('未知点约束必须是纯本机数据');
        p.affineProblem={
          frame:candidate.frame,unit:candidate.unit,
          points:copy(candidate.points),constraints:copy(candidate.constraints),
          imageId:p.source.imageId,sourceStamp:affineSourceStamp(p.source),
          confirmed:false
        };
      });
    },
    confirmAffineProblem(){
      return commit(p=>{
        if(!p.affineProblem||p.affineProblem.confirmed)
          throw new Error('没有待人工确认的未知点系统');
        if(p.affineProblem.sourceStamp!==affineSourceStamp(p.source))
          throw new Error('原图或双比例尺度已修改，必须重新提交数学条件');
        if(!p.affineProblem.constraints.length)
          throw new Error('未知点尚无数学约束，不能直接确认');
        p.affineProblem.confirmed=true;
      });
    },
    removeAffineProblem(){return commit(p=>{p.affineProblem=null;});},
    putRelation(row){
      return commit(p=>{
        if(p.task!=='composition')throw new Error('对象关系仅适用于同一几何项目');
        if(!jsonValue(row))throw new Error('关系输入不可序列化');
        const data={id:row.id,kind:row.kind,
         objectIds:copy(row.objectIds),value:row.value,confirmed:false};
        const items=p.relations||(p.relations=[]);
        const i=items.findIndex(x=>x.id===data.id);
        if(i<0)items.push(data);else items[i]=data;
      });
    },
    confirmRelation(id){
      return commit(p=>{
        if(p.task!=='composition')throw new Error('当前不是通用几何项目');
        const r=(p.relations||[]).find(r=>r.id===id);
        if(!r)throw new Error('关系不存在');
        if(r.objectIds.some(id=>!p.conditions.some(c=>
         c.objectId===id&&c.confirmed)))
         throw new Error('两个对象都必须有已确认的当前几何条件');
        r.confirmed=true;
      });
    },
    deleteRelation(id){return commit(p=>{p.relations=(p.relations||[]).filter(r=>r.id!==id);});},

    setImage(imageId) { return commit(p => {
      if (imageId !== null && !isId(imageId)) throw new Error('无效原图 ID');
      if (p.source.imageId === imageId) return;
      p.source = {imageId, rotationDeg: 0, calibration: null};
      p.recognition=null;
      // Never leave a dangling candidate link when the original photo changes.
      p.conditions = p.conditions.map(c => ({...c, sourceCandidateId:null,confirmed:false}));
      if(p.relations)p.relations=p.relations.map(r=>({...r,confirmed:false}));
      if(p.affineProblem)p.affineProblem.confirmed=false;
    }); },
    setImageGeometry({rotationDeg, calibration}) { return commit(p => {
      if (p.source.rotationDeg === rotationDeg && same(p.source.calibration, calibration)) return;
      p.source.rotationDeg = rotationDeg;
      p.source.calibration = copy(calibration);
      p.recognition=null;
      p.conditions = p.conditions.map(c => ({...c, sourceCandidateId:null,confirmed:false}));
      if(p.relations)p.relations=p.relations.map(r=>({...r,confirmed:false}));
      if(p.affineProblem)p.affineProblem.confirmed=false;
    }); },
    setViewport(paper) {
      return updateView({paper: {...project.view.paper, ...paper}});
    },
    setCamera(camera) {
      return updateView({camera: {...project.view.camera, ...camera}});
    },
    setTask(task) {
      if(!TASKS.includes(task)) throw new Error('不支持的项目数学任务类型');
      return commit(p=>{
        if(p.task===task)return;
        // A different specialist must never inherit the previous confirmed
        // inputs, object identity, selection, or playback authorization.
        p.task=task;p.objects=[];p.conditions=[];p.relations=[];p.affineProblem=null;
        p.view.selectedObjectId=null;
      });
    },
    renameProject(title) {
      const next=snapshot();
      next.title=title;
      requireValid(next);
      project=next; // Metadata-only edit: never changes a mathematical proof.
      emit('view');return snapshot();
    },
    setMode(mode) { return updateView({mode}); },
    setOverlays(overlays) {return updateView({overlays: {...project.view.overlays, ...overlays}});},
    selectedGeometryId() {
      return selectedSceneGeometryId || project.view.selectedObjectId;
    },
    selectSceneGeometry(id) {
      if(!isId(id))throw new Error('无效的 Geometry 对象身份');
      const result=adapter?.readSnapshot();
      if(!result||result.projectId!==project.id||
         result.inputRevision!==project.revision||
         result.scene?.schema!=='draftai-geometry-scene-views/1.0.0'||
         !result.scene.objects.some(o=>o.id===id))
        throw new Error('对象不属于当前数学场景，拒绝旧版本选择');
      if(project.objects.some(o=>o.id===id))return api.selectObject(id);
      // No input revision change, no solver call, no saved project mutation.
      selectedSceneGeometryId=id;
      emit('view');
      return id;
    },
    selectObject(id) {
      selectedSceneGeometryId=null;
      return updateView({selectedObjectId:id});
    },
    selectRepresentation(view, id) {
      selectedSceneGeometryId=null;
      if (!VIEWS.includes(view)) throw new Error('未知投影视图');
      const found = project.objects.find(o =>
        (view === '3D' ? o.spatialId === id : o.projections[view].includes(id)));
      return updateView({selectedObjectId: found?.id ?? null});
    },
    correspondence() {
      const obj = project.objects.find(o => o.id === project.view.selectedObjectId);
      return obj ? copy({objectId: obj.id, kind: obj.kind, projections: obj.projections, spatialId: obj.spatialId}) : null;
    },
    undo() {
      if (!past.length) return snapshot();
      future.push(snapshot());
      return replace(past.pop());
    },
    redo() {
      if (!future.length) return snapshot();
      past.push(snapshot());
      return replace(future.pop());
    },
    attachSolver(nextAdapter) {
      if (!nextAdapter || !['loadInputs', 'readSnapshot', 'subscribe', 'invalidate', 'stopPlayback', 'dispose']
        .every(k => typeof nextAdapter[k] === 'function')) throw new TypeError('求解器适配器不完整');
      api.detachSolver();
      adapter = nextAdapter;
      unsubscribe = nextAdapter.subscribe(() => emit('solver'));
      notifySolver();
      return () => { if (adapter === nextAdapter) api.detachSolver(); };
    },
    currentResult() {
      if (!adapter) return null;
      const result = adapter.readSnapshot();
      // Never retain/restore this result in project JSON. The canonical
      // solver session alone determines whether export/playback is available.
      if (!result || result.projectId !== project.id ||
          result.inputRevision !== project.revision || result.verified !== true) return null;
      return result;
    },
    canExport() { return !!api.currentResult(); },
    detachSolver() {
      selectedSceneGeometryId=null;
      if (unsubscribe) unsubscribe();
      unsubscribe = null;
      if (adapter) adapter.dispose();
      adapter = null;
    },
    dispose() {api.detachSolver(); listeners.clear();}
  };
  return api;
}
function importProject(text) {
  if (typeof text !== 'string' || text.length > 2000000) throw new Error('项目文件过大或格式错误');
  let candidate;
  try { candidate = JSON.parse(text); } catch { throw new Error('项目不是有效的 JSON 文件'); }
  return copy(requireValid(candidate));
}
function exportProject(project) { return JSON.stringify(requireValid(project), null, 2); }
module.exports = {FORMAT, VERSION, TASKS, VIEWS, KINDS, newProject, validateProject,
  importProject, exportProject, createCoordinator};
