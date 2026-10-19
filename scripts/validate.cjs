const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
function check(condition, message) { if (!condition) throw new Error(message); }
const context = { window: {} };
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root, 'content.js'), 'utf8'), context);
const { lessons, questions, version } = context.window.DRAWING_CONTENT;
const expectedTypes = new Set(['single', 'multi', 'numeric', 'order', 'truefalse', 'match', 'plot', 'plotline']);
const ids = new Set();
const units = new Set();
check(lessons.length >= 10, '课程目录不足');
check(questions.length >= 66, '题库题量减少，请确认是否有意删除');
for (const lesson of lessons) {
  check(lesson.id && !units.has(lesson.id), '课程 ID 重复或为空');
  units.add(lesson.id);
  for (const field of ['title', 'intro', 'concepts', 'example', 'steps', 'mistakes', 'paper']) {
    check(lesson[field] && lesson[field].length, `课程 ${lesson.id} 缺少 ${field}`);
  }
}
for (const q of questions) {
  check(q.id && !ids.has(q.id), `题目 ID 重复 ${q.id}`);
  ids.add(q.id);
  check(units.has(q.lesson), `题目 ${q.id} 所属课程不存在`);
  check(expectedTypes.has(q.type), `题目 ${q.id} 类型未知`);
  check(q.stem && q.explain, `题目 ${q.id} 缺少题干或解析`);
  if (['single', 'truefalse'].includes(q.type)) {
    check(Number.isInteger(q.answer) && q.answer >= 0 && q.answer < q.options.length, `题目 ${q.id} 正确选项越界`);
  } else if (q.type === 'multi') {
    check(Array.isArray(q.answer) && q.answer.length && new Set(q.answer).size === q.answer.length, `题目 ${q.id} 多选答案无效`);
    check(q.answer.every(x => Number.isInteger(x) && x >= 0 && x < q.options.length), `题目 ${q.id} 多选越界`);
  } else if (q.type === 'order') {
    check(JSON.stringify([...q.answer].sort((a,b)=>a-b)) === JSON.stringify(q.options.map((_,i)=>i)), `题目 ${q.id} 排序无效`);
  } else if (q.type === 'numeric') {
    check(Number.isFinite(q.answer), `题目 ${q.id} 数值答案不是数字`);
  } else if (q.type === 'match') {
    check(q.options.length === q.answer.length && q.answer.every(x=>Number.isInteger(x) && x >= 0 && x < q.choices.length), `题目 ${q.id} 匹配答案无效`);
  } else if (q.type === 'plot') {
    check(['V','H','W'].includes(q.plane) && Array.isArray(q.answer) && q.answer.length === 2 && q.answer.every(x=>Number.isFinite(x) && x >= 0 && x <= 80), `题目 ${q.id} 坐标数据无效`);
  } else if (q.type === 'plotline') {
    check(['V','H','W'].includes(q.plane) && Array.isArray(q.answer) && q.answer.length === 2 && q.answer.every(point=>Array.isArray(point) && point.length === 2 && point.every(x=>Number.isFinite(x) && x >= 0 && x <= 80)), `题目 ${q.id} 线段投影数据无效`);
  }
}
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
for (const type of expectedTypes) check(html.includes(`value="${type}"`), `界面未开放 ${type} 筛选入口`);
check(html.includes('id="statQuestions"') && html.includes('id="questionScope"'), '关键控件缺失');
for (const file of ['index.html','app.js','styles.css','content.js','labs/v7.html','favicon.svg']) check(fs.existsSync(path.join(root,file)), `缺少 ${file}`);
console.log(`PASS v${version} · ${lessons.length} 节课程 · ${questions.length} 道题 · ${expectedTypes.size} 种题型`);
