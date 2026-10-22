'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const Store=require('../../labs/dof-lab-state.js');
const Sync=require('../../workbench/dof-synchronized-reveal.cjs');
const Lesson=require('../../workbench/dof-step-explanations.cjs');
const initial=()=>Store.compute(Store.create());
test('five construction explanations come from first-angle projection invariants, NOT new equations',()=>{
 const report=initial(),plan=Sync.build(report,{revision:5}),lesson=Lesson.build(report,plan);
 assert.equal(lesson.status,'ready');
 assert.equal(lesson.rank,0);
 assert.equal(lesson.degrees,3);
 assert.equal(lesson.activeCount,0);
 assert.deepEqual(lesson.fixedAxes,[]);
 assert.equal(lesson.steps.length,5);
 for(const [i,s] of lesson.steps.entries()){
  assert.equal(s.id,'step-'+(i+1));
  assert.match(s.freedom,/不新增独立约束/);
  assert.match(s.freedom,/剩余 3 个自由度/);
  assert.match(s.evidence,/无用户约束|尚无用户约束/);
 }
 assert.match(lesson.steps[0].basis,/x/);
 assert.match(lesson.steps[1].basis,/z/);
 assert.match(lesson.steps[2].basis,/45°/);
 assert.match(lesson.steps[3].basis,/y/);
 assert.match(lesson.steps[4].title,/P\*/);
 assert.match(lesson.steps[4].why,/可行集合/);
});
test('actual H projection fixes x,y (2 constraints); z condition fixes the third DOF',()=>{
 const h=Store.apply(Store.create(),{type:'add',condition:{
  type:'projection',plane:'H',value:[15,10]}});
 const report=Store.compute(h),plan=Sync.build(report,{revision:2}),lesson=Lesson.build(report,plan);
 assert.equal(lesson.status,'ready');assert.equal(lesson.degrees,1);assert.equal(lesson.rank,2);
 assert.deepEqual(lesson.fixedAxes,['x','y']);
 assert.match(lesson.steps[1].freedom,/剩余 1 个自由度/);
 assert.match(lesson.steps[2].evidence,/新增 2 个独立约束，自由度 3 → 1/);
 const full=Store.apply(h,{type:'add',condition:{
  type:'coordinate',axis:'z',value:12}});
 const complete=Store.compute(full),final=Lesson.build(complete,Sync.build(complete,{revision:3}));
 assert.equal(final.rank,3);assert.equal(final.degrees,0);
 assert.deepEqual(final.fixedAxes,['x','y','z']);
 assert.match(final.steps[4].title,/空间点 P/);
 assert.match(final.steps[4].why,/线性约束秩为 3/);
 assert.match(final.steps[4].basis,/而不是因为画完五步/);
});
test('redundant conditions are explained as redundancy without artificial DOF decrease',()=>{
 let s=Store.apply(Store.create(),{type:'add',condition:{
  type:'projection',plane:'V',value:[15,12]}});
 s=Store.apply(s,{type:'add',condition:{
  type:'coordinate',axis:'x',value:15}});
 const report=Store.compute(s),lesson=Lesson.build(report,Sync.build(report));
 assert.equal(lesson.status,'ready');
 assert.equal(lesson.rank,2);assert.equal(lesson.degrees,1);
 assert.match(lesson.steps[0].evidence,/条件 2（x = 15）：冗余，未增加独立约束/);
 assert.match(lesson.steps[3].freedom,/辅助作图线只是表达投影关系|画联系线只是表达投影关系/);
});
test('oblique plane may constrain the point without fixing any single coordinate',()=>{
 const s=Store.apply(Store.create(),{type:'add',condition:{
  type:'plane',normal:{x:1,y:1,z:1},offset:12}});
 const report=Store.compute(s),lesson=Lesson.build(report,Sync.build(report));
 assert.equal(lesson.status,'ready');
 assert.equal(lesson.degrees,2);assert.equal(lesson.rank,1);
 assert.deepEqual(lesson.fixedAxes,[]);
 assert.match(lesson.steps[0].freedom,/尚无由条件单独确定的坐标轴/);
});
test('contradiction, fake rank, invalid guide and null frame never yield asserted teaching steps',()=>{
 let state=Store.apply(Store.create(),{type:'add',condition:{
  type:'coordinate',axis:'z',value:5}});
 state=Store.apply(state,{type:'add',condition:{
  type:'coordinate',axis:'z',value:6}});
 const conflict=Store.compute(state);
 assert.equal(Lesson.build(conflict,Sync.build(conflict)).status,'blocked');
 const report=initial(),good=Sync.build(report,{revision:12});
 assert.equal(Lesson.build({...report,active:[{type:'coordinate',axis:'x',value:14}]},good).status,'blocked');
 const modified={...good,guides:good.guides.map((g,i)=>i===0?{
  ...g,from:{...g.from,x:g.from.x+2}}:g)};
 assert.equal(Lesson.build(report,modified).status,'blocked');
 const lesson=Lesson.build(report,good);
 assert.equal(Lesson.at(lesson,null).ready,false);
 const player=Sync.createPlayer(good);
 const frame=player.seekStep(2,100);
 assert.equal(Lesson.at(lesson,frame).index,2);
 assert.equal(Lesson.at(lesson,{...frame,revision:13}).ready,false);
 player.invalidate(13,101);
 assert.equal(Lesson.at(lesson,player.snapshot()).ready,false);
});
test('step-five text does not claim completed point display until final segment is finished',()=>{
 const report=initial(),plan=Sync.build(report,{revision:9});
 const lesson=Lesson.build(report,plan),player=Sync.createPlayer(plan);
 const fifth=player.seekStep(4,3000);
 const atFifth=Lesson.at(lesson,fifth);
 assert.equal(atFifth.ready,true);
 assert.match(atFifth.check,/尚未完成目标点显现/);
 assert.equal(atFifth.completed,false);
 const done=Lesson.at(lesson,player.seekStep(5,3001));
 assert.equal(done.ready,true);assert.equal(done.completed,true);
 assert.doesNotMatch(done.check,/当前仍处于结果步骤/);
 assert.match(done.title,/示例位置 P\*/);
 const rewind=Lesson.at(lesson,player.seekStep(4,3002));
 assert.equal(rewind.completed,false);
 assert.match(rewind.check,/尚未完成目标点显现/);
});
