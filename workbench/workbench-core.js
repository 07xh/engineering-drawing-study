/* DA-07 isolated synthetic UI preview. No geometric solving or contract-v1 binding. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.DA07WorkbenchCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const MODES = Object.freeze(['full', 'hint', 'draw']);
  const ROLES = Object.freeze(['given', 'auxiliary', 'result', 'axis', 'mark']);
  const KINDS = Object.freeze(['point', 'line', 'circle']);
  const STATUSES = Object.freeze(['unique', 'multiple', 'none', 'continuous', 'coincident', 'unsupported', 'undetermined']);
  const IDENTIFIER = /^[a-zA-Z][a-zA-Z0-9_-]{0,79}$/;
  const finite = n => typeof n === 'number' && Number.isFinite(n);
  const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
  const id = s => typeof s === 'string' && IDENTIFIER.test(s);
  const object = v => !!v && typeof v === 'object' && !Array.isArray(v);
  const point = g => object(g) && finite(g.x) && finite(g.y);
  const shapeValid = shape => {
    if (!object(shape) || !id(shape.id) || !KINDS.includes(shape.kind) || !ROLES.includes(shape.role)) return false;
    const g = shape.geometry;
    if (!object(g)) return false;
    if (shape.kind === 'point') return point(g);
    if (shape.kind === 'line') return [g.x1, g.y1, g.x2, g.y2].every(finite);
    return [g.cx, g.cy, g.r].every(finite) && g.r > 0;
  };
  function validateFixture(doc) {
    const errors = [];
    if (!object(doc) || doc.synthetic !== true || doc.scope !== 'ui-only') return {ok: false, errors: ['只允许 synthetic/ui-only 的隔离演示数据']};
    if (!id(doc.id) || typeof doc.title !== 'string' || !doc.title.trim()) errors.push('题目 ID 或标题无效');
    if (!Array.isArray(doc.shapes) || !Array.isArray(doc.steps)) return {ok: false, errors: [...errors, '图层和步骤必须是数组']};
    if (!doc.shapes.every(shapeValid)) errors.push('存在不支持的图元或非法数值');
    const shapeIds = doc.shapes.map(s => s && s.id);
    if (new Set(shapeIds).size !== shapeIds.length) errors.push('图元 ID 重复');
    const shapeMap = new Map(doc.shapes.map(s => [s && s.id, s]));
    const prior = new Set(), stepIds = new Set();
    for (const step of doc.steps) {
      if (!object(step) || !id(step.id) || stepIds.has(step.id) || typeof step.title !== 'string' || !step.title.trim() ||
          typeof step.explanation !== 'string' || !step.explanation.trim() || !Array.isArray(step.actionIds) ||
          !Array.isArray(step.dependsOn) || !Array.isArray(step.hints)) {
        errors.push('步骤结构或步骤 ID 无效');
        continue;
      }
      if (new Set(step.actionIds).size !== step.actionIds.length || step.actionIds.some(x => !shapeMap.has(x))) errors.push('步骤引用不存在或重复图元');
      if (new Set(step.dependsOn).size !== step.dependsOn.length || step.dependsOn.some(x => !prior.has(x))) errors.push('步骤引用未来/不存在/自身依赖');
      if (step.actionIds.some(x => shapeMap.get(x)?.role === 'given')) errors.push('已知图元不得作为求解步骤新增');
      if (step.hints.some(h => typeof h !== 'string' || h.length > 500)) errors.push('提示内容非法');
      stepIds.add(step.id); prior.add(step.id);
    }
    if (doc.shapes.some(s => s && s.role === 'result') && !doc.allowResultPlaceholder) errors.push('合成演示禁止预置解答图元');
    if (own(doc, 'solveResult') && doc.solveResult !== null) errors.push('合成 UI 不得包含伪造的 SolveResult');
    return {ok: errors.length === 0, errors};
  }
  function solveGate(result, verified = {}) {
    // Intended for future verified adapter; never called to elevate synthetic fixtures.
    if (!object(result) || !STATUSES.includes(result.status)) return {playable: false, reason: '缺少有效求解状态'};
    const status = result.status;
    if (status === 'none') return {playable: false, reason: '约束矛盾：无解，禁止显示目标结果'};
    if (status === 'continuous' || status === 'coincident') return {playable: false, reason: '欠约束或存在连续可行集，不能显示唯一答案'};
    if (status === 'unsupported' || status === 'undetermined') return {playable: false, reason: '求解尚未验证或当前题型不支持标准步骤'};
    if (!verified.referencesValid || !verified.stepsVerified || !verified.inputRevisionMatches || !verified.mathValidated ||
        !verified.actionGeometryBound || !verified.resultRefMatches) {
      return {playable: false, reason: '引用、步骤、输入版本或数学核验尚未通过'};
    }
    if (status === 'unique') {
      if (result.solutionCount !== 1 || result.globallyUnique !== true || result.degrees !== 0 ||
          !['analytic','linear-algebra'].includes(result.proofLevel)) {
        return {playable: false, reason: '结果不足以证明指定求解域唯一'};
      }
      return {playable: true, reason: '仅在声明且验证的求解域内可播放'};
    }
    if (result.globallyUnique === true || !Number.isInteger(result.solutionCount) || result.solutionCount < 2) {
      return {playable: false, reason: '多解的数量或唯一性不一致'};
    }
    if (!Array.isArray(verified.branches) || verified.branches.length < 2 ||
        verified.branches.some(b => !object(b) || !id(b.id) || !Array.isArray(b.stepIds))) {
      return {playable: false, reason: '缺少带稳定 ID 的经验证候选分支与步骤映射'};
    }
    const ids = verified.branches.map(b => b.id);
    if (new Set(ids).size !== ids.length) return {playable: false, reason: '候选分支 ID 重复'};
    if (!verified.selectedBranchId || !ids.includes(verified.selectedBranchId)) {
      return {playable: false, reason: '多个候选：先明确选择经验证的分支'};
    }
    return {playable: true, reason: '已明确选择一个候选分支；不代表全局唯一'};
  }
  function initialState(doc) {
    const valid = validateFixture(doc);
    if (!valid.ok) throw new Error(valid.errors.join('；'));
    return {fixtureId: doc.id, mode: 'full', stage: 0, hint: 0, playing: false, threeVisible: false,
      stale: false, statusProbe: 'preview', inputRevision: 0, drawings: [], redo: [], selectedBranchId: null};
  }
  function transition(doc, current, action) {
    if (!object(action)) throw new Error('无效工作台操作');
    const s = {...current, drawings: [...current.drawings], redo: [...current.redo]};
    const safe = !s.stale && s.statusProbe === 'preview';
    switch (action.type) {
      case 'MODE':
        if (!MODES.includes(action.value)) throw new Error('未知学习模式');
        s.mode = action.value; s.playing = false; s.stage = 0; s.hint = 0; break;
      case 'NEXT': if (safe && s.mode === 'full') s.stage = Math.min(doc.steps.length, s.stage + 1); break;
      case 'PREV': if (safe && s.mode === 'full') s.stage = Math.max(0, s.stage - 1); break;
      case 'HINT': if (safe && s.mode === 'hint') s.hint = Math.min(doc.steps.reduce((n, st) => n + st.hints.length, 0), s.hint + 1); break;
      case 'RESET': s.stage = 0; s.hint = 0; s.playing = false; s.drawings = []; s.redo = []; break;
      case 'PLAY': if (safe && s.mode === 'full' && s.stage < doc.steps.length) s.playing = true; break;
      case 'PAUSE': s.playing = false; break;
      case 'THREE': s.threeVisible = !s.threeVisible; break;
      case 'STATUS_PROBE':
        if (action.value !== 'preview' && !STATUSES.includes(action.value)) throw new Error('无效状态测试');
        s.statusProbe = action.value; s.playing = false; s.stage = 0; s.hint = 0;
        s.selectedBranchId = null; s.drawings = []; s.redo = []; break;
      case 'INPUT_CHANGED':
        s.stale = true; s.inputRevision++; s.stage = 0; s.hint = 0; s.playing = false;
        s.selectedBranchId = null; s.drawings = []; s.redo = []; break;
      case 'DRAW':
        if (!s.stale && s.mode === 'draw' && object(action.line) &&
            [action.line.x1, action.line.y1, action.line.x2, action.line.y2].every(finite)) {
          s.drawings.push({...action.line}); s.redo = [];
        } break;
      case 'UNDO': if (s.mode === 'draw' && s.drawings.length) s.redo.push(s.drawings.pop()); break;
      case 'REDO': if (s.mode === 'draw' && s.redo.length) s.drawings.push(s.redo.pop()); break;
      default: throw new Error('不支持的工作台操作');
    }
    if (s.stage >= doc.steps.length) s.playing = false;
    return s;
  }
  function displayed(doc, state) {
    const valid = validateFixture(doc);
    if (!valid.ok) throw new Error('图元/步骤引用错误：' + valid.errors.join('；'));
    const ids = new Set(doc.shapes.filter(s => s.role === 'given' || s.role === 'axis').map(s => s.id));
    if (!state.stale && state.statusProbe === 'preview' && state.mode === 'full') {
      for (const step of doc.steps.slice(0, Math.min(state.stage, doc.steps.length))) for (const key of step.actionIds) ids.add(key);
    }
    return doc.shapes.filter(s => ids.has(s.id));
  }
  function displayStatus(state) {
    if (state.stale) return '输入已改变：旧步骤、旧结果与旧残差全部失效；重新载入合成样本。';
    if (state.statusProbe === 'preview') return 'SYNTHETIC / UI-ONLY：这里没有求解结果、标准答案或数学残差。';
    const messages = {
      unique: '仅模拟 unique 门禁：无真实已验证结果，禁止播放标准答案。',
      multiple: '多个候选：没有经验证的候选 ID 与步骤映射，禁止默认选择答案。',
      none: '无解：展示诊断，禁止绘制假结果。',
      continuous: '连续多解：欠约束，不得称为唯一解。',
      coincident: '几何约束重合：不能产生唯一答案。',
      unsupported: '不支持该求解：只保留已知图。',
      undetermined: '尚未验算：只保留已知图。'
    };
    return messages[state.statusProbe];
  }
  return {MODES, STATUSES, validateFixture, solveGate, initialState, transition, displayed, displayStatus};
});
