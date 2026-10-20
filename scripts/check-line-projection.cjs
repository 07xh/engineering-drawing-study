'use strict';const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');const js=fs.readFileSync('labs/line-projection.js','utf8'),html=fs.readFileSync('labs/line-projection.html','utf8');new vm.Script(js,{filename:'labs/line-projection.js'});for(let i=1;i<=8;i++)assert(js.includes("id:'2-5-"+i+"'"),'missing exercise 2-5-'+i);for(const x of ['front','general','vnormal','konv','profile','horizontal'])assert(js.includes("type:'"+x+"'"),'missing line class '+x);for(const x of ['board','tasks','solution','diagnosis','fields'])assert(html.includes('id="'+x+'"'),'missing element '+x);assert(js.includes("svg.addEventListener('pointermove'"),'pointer drag required');assert(js.includes("svg.addEventListener('keydown'"),'keyboard support required');assert(js.includes("if(c.type==='konv'&&index===1)p[1]=0"),'K on V must be constrained');assert(js.includes("if(c.type==='front')p[1]=q[1]"),'front parallelism must hold');assert(js.includes("if(c.type==='horizontal')p[2]=q[2]"),'horizontal parallelism must hold');assert(js.includes("if(c.type==='vnormal'){p[0]=q[0];p[2]=q[2]}"),'normal line must stay perpendicular to V');console.log('PASS line-projection workshop: eight exercises, editable constraints and UI wiring');
for(const id of ['transfer45','drawingSteps','stepNote','dofAnalysis'])assert(html.includes('id="'+id+'"'),'missing '+id);
assert(html.includes('src="constraint-engine.js"'),'shared constraint engine must load before line workshop');
assert(js.includes('const origin=[465,240]'),'standard VHW views must share common origin');
assert(js.includes("plane==='V'?[origin[0]-p[0]*scale"),'V and H must share x projection coordinate');
assert(js.includes("const t=[w[0],h[1]]"),'45 degree transfer must link H depth to W width');
assert(js.includes('if(showTransfer45)'),'45 degree transfer must be switchable');
assert(js.includes('engine.analyze(constraints).result'),'degrees of freedom must use shared engine');
assert(js.includes("if(drawingStep>=3)"),'side projection must be gated by construction step');
console.log('PASS standard first-angle V/H/W, 45-degree switch, drawing steps and shared DOF analysis');

for(const id of ['practiceToggle','checkPractice','practiceHint','revealPractice','practiceInfo'])assert(html.includes('id="'+id+'"'),'missing practice control '+id);
assert(js.includes('practice&&plane===practicePlane&&!revealed'),'target projection must be hidden');
assert(js.includes('if(practicePoints.length!==2)'),'require two endpoint answers');
assert(js.includes('distances.every(d=>d<=tolerance)'),'answer must use numeric coordinate tolerance');
assert(js.includes('inPlane(p,practicePlane)'),'answer input must stay within requested view');
console.log('PASS hidden-projection drawing practice and numeric grading wiring');

for(const id of ['undoPractice','clearPractice'])assert(html.includes('id="'+id+'"'),'missing practice correction control '+id);
assert(js.includes("const swapped=practicePoints.map"),'reversed endpoints must be accepted');
assert(js.includes("practicePlane==='V'?'待求 V 面"),'hints must reflect missing plane');
assert(js.includes("practice?'补图练习进行中"),'answer coordinates must not leak in practice');
assert(js.includes("!showAnswer||(practice&&!revealed)"),'solution must remain hidden until reveal');
console.log('PASS practice answer privacy, reversible endpoints and undo/clear controls');

for(const id of ['exerciseProgress','clearProgress'])assert(html.includes('id="'+id+'"'),'missing progress control '+id);
assert(js.includes("if(distances.every(d=>d<=tolerance)){markCompleted();"),'completion must only follow successful grading');
assert(js.includes("completed=new Set(stored.filter"),'saved progress must be filtered against real exercises');
console.log('PASS local completion progress and safe reset controls');

for(const id of ['retryWrong','retryCount','stepBack','stepForward','stepHistoryToggle','stepHistory'])assert(html.includes('id="'+id+'"'),'missing retry/history control '+id);
assert(js.includes("else{markWrong();practiceUI("),'failed attempts must enter retry queue');
assert(js.includes("wrong.delete(cases[current].id);saveWrong()"),'successful practice must remove retry entry');
assert(js.includes("function goStep(n)"),'step navigation must be implemented');
assert(js.includes("visitedSteps=new Set([4])"),'step history must reset between exercises');
console.log('PASS retry queue and guided step navigation');

for(const id of ['saveDraft','restoreDraft','draftStatus'])assert(html.includes('id="'+id+'"'),'missing draft UI '+id);
assert(js.includes("function validDraft(d)"),'draft restore must validate persisted coordinates');
assert(js.includes("practiceDrag={id:e.pointerId"),'student answer endpoints must be draggable');
assert(js.includes("svg.classList.remove('pen-dragging')"),'pen drag must release touch state');
console.log('PASS pen answer dragging and local draft save/restore');

const fsChapter=require('node:fs');const chapterHtml=fsChapter.readFileSync(require('node:path').resolve(__dirname,'../labs/chapter-26-29.html'),'utf8');
for(const n of ['2-6-1','2-6-6','2-7-1','2-7-6','2-8-1','2-8-8','2-9-1','2-9-8'])assert(chapterHtml.includes(n),'missing chapter index item '+n);
assert(chapterHtml.includes('不是教材原文、原图或标准答案'),'source fidelity warning required');
assert(chapterHtml.includes('仅表示已查看，不代表已答对'),'review marker must not imply grading');
console.log('PASS chapter practice index and source disclaimers');

for(const id of ['search','chapterFilter','reviewFilter','visibleCount','empty'])assert(chapterHtml.includes('id="'+id+'"'),'missing chapter filter '+id);
assert(chapterHtml.includes('function filterCards()'),'missing search filtering');
assert(chapterHtml.includes("heading.hidden=shown===0"),'empty chapter headings must be hidden');
console.log('PASS chapter topic search, section and review filters');

const drawingHtml=fsChapter.readFileSync(require('node:path').resolve(__dirname,'../labs/chapter-drawing.html'),'utf8');
const drawingJs=fsChapter.readFileSync(require('node:path').resolve(__dirname,'../labs/chapter-drawing.js'),'utf8');
assert(chapterHtml.includes("drawLink.href='chapter-drawing.html#'+id"),'every exercise needs a drawing entry');
for(const id of ['board','question','pen','eraser','undo','clear','grid'])assert(drawingHtml.includes('id="'+id+'"'),'missing drawing control '+id);
assert(drawingJs.includes("function validStroke(s)"),'saved drawing input validation missing');
assert(drawingJs.includes("records[current]=s;save();ink()"),'per-question drawing persistence missing');
assert(drawingHtml.includes('未核实题目不显示替代图'),'must disclose unverified source geometry');
console.log('PASS 28 exercise drawing entries, clean geometry and pen controls');
const dofJs=fsChapter.readFileSync(require('node:path').resolve(__dirname,'../labs/chapter-dof.js'),'utf8');
for(const id of ['dofPanel','guidePrev','guideNext','guideShow','guideTitle','guideWhy','guideLimit','guides'])assert(drawingHtml.includes('id="'+id+'"'),'missing DOF panel control '+id);
assert(drawingHtml.includes('src="chapter-dof.js"'),'DOF explanation module not loaded');
assert(drawingJs.includes('renderDof();'),'DOF panel not rendered on exercise selection');
assert(dofJs.includes('verified:false'),'unverified textbook geometry must be disclosed');
assert(dofJs.includes('自由度为 0'),'missing DOF convergence explanation');
console.log('PASS per-exercise DOF concepts and why-line guidance');
const verifiedJs=fsChapter.readFileSync(require('node:path').resolve(__dirname,'../labs/verified-exercises.js'),'utf8');
assert(drawingHtml.includes('src="verified-exercises.js"'),'missing source-reviewed geometry module');
assert(drawingJs.includes('本题教材原图尚未核实重绘'),'generic drawing must not stand in for unverified textbook');
assert(verifiedJs.includes("'2-6-1'")&&verifiedJs.includes("'2-6-3'"),'missing first source-reviewed diagrams');
console.log('PASS source-review status and no generic substitution');

for(const id of ['2-6-2','2-6-4'])assert(verifiedJs.includes("'"+id+"'"),'missing reviewed exercise '+id);
assert((verifiedJs.match(/status:'partial'/g)||[]).length>=4,'source review must remain explicitly partial');
console.log('PASS four partial source-reviewed diagrams; no claims of exact completion');

for(const id of ['2-6-5','2-6-6'])assert(verifiedJs.includes("'"+id+"'"),'missing source-traced geometry '+id);
assert((verifiedJs.match(/status:'partial'/g)||[]).length>=6,'all six source-reviewed 2-6 exercises must retain partial status');
console.log('PASS 2-6-5 and 2-6-6 visible geometry and partial-source disclaimers');

for(const id of ['revealPrev','revealNext','revealAll','revealRange','revealStatus'])assert(drawingHtml.includes('id="'+id+'"'),'missing progressive reveal control '+id);
assert(drawingJs.includes('function updateReveal()'),'missing progressive source diagram reveal');
assert(drawingJs.includes('sourceStage(kind)'),'source line categories must retain visual styling');
assert(drawingHtml.includes('prefers-reduced-motion:reduce'),'reveal animation must respect reduced motion');
console.log('PASS progressive source geometry reveal controls and accessibility');

assert(drawingHtml.includes('id="revealWhy"'),'missing per-line explanatory note');
assert(drawingJs.includes('function sourceSteps(item)'),'missing per-line progression');
assert(drawingJs.includes('source-detail'),'point and text labels must follow reveal');
console.log('PASS individual verified lines, rationale, and synchronized label reveal');

assert(drawingHtml.includes('id="lineFocus"'),'missing per-line endpoint overlay');
assert(drawingJs.includes('solutionSteps'),'solution steps must be separately verified');
assert(drawingHtml.includes('第一帧完整展示已核对的原题已知条件'),'first frame must show givens');
console.log('PASS traced-line direction explanation and endpoint markers');

assert(drawingJs.includes('revealStep=0;base();updateReveal()'),'initial frame must start at zero solution steps');
assert(drawingJs.includes('本题标准作图步骤尚未核实'),'must disclose unverified solution steps');
console.log('PASS all verified given lines visible on first frame, solutions separate');

for(const id of ['drawingToggle','drawingTools'])assert(drawingHtml.includes('id="'+id+'"'),'missing optional drawing control '+id);
assert(drawingHtml.includes('id="ink" hidden'),'saved ink must be hidden in view-only mode');
assert(drawingJs.includes('if(!drawingEnabled)return;const p=pos(e)'),'pointerdown must be gated by drawing toggle');
assert(drawingJs.includes('setDrawingEnabled(false);choose('),'view-only must be default');
console.log('PASS default view-only and optional free drawing without deleting saved strokes');

assert(drawingHtml.includes('id="sourceStatus"'),'exercise source status must be visible');
assert(drawingJs.includes("verified?verified.title:"),'verified task wording must take precedence over generic exercise description');
assert(drawingJs.includes("tool='pen',grid=false"),'source geometry view must start without grid');
assert(drawingJs.includes("原题待核对"),'unverified exercise must not present fabricated task');
console.log('PASS verified exercise wording and uncluttered first-frame source status');

const verifiedContext={};vm.runInNewContext(fs.readFileSync('labs/verified-exercises.js','utf8'),verifiedContext);const verifiedGeometry=verifiedContext.VerifiedExerciseGeometry;
for(const id of ['2-7-1','2-7-2','2-7-3']){const item=verifiedGeometry.get(id);assert(item&&item.status==='partial','2-7 source tracing must be explicitly partial: '+id);assert(item.lines.length>=9,'missing source line details '+id);assert(!item.solutionSteps,'do not invent textbook solutions for '+id);for(const [x1,y1,x2,y2] of item.lines)assert([x1,y1,x2,y2].every(Number.isFinite)&&x1>=0&&x2>=0&&y1>=0&&y2>=0&&x1<=960&&x2<=960&&y1<=520&&y2<=520,'source geometry outside board '+id)}
console.log('PASS 2-7-1 through 2-7-3 partial source tracings and coordinate bounds');
