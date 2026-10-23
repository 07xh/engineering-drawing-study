'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {verifiedLiveIntentTimeline:live}=
 require('../../workbench/verified-live-intent-v1.cjs');
const {filletTimeline,pointTimeline}=
 require('../../workbench/verified-plan-v5-bridge.cjs');
const {validateConstructionIntentDAG,CONSTRUCTION_INTENT_VERSION:VERSION}=
 require('../../core/contracts/construction-intent.js');
const P=(x,y)=>({x,y});
const seg=(x1,y1,x2,y2)=>({a:P(x1,y1),b:P(x2,y2)});
const sheet={origin:P(360,220),scale:8};
const cases=[
 ['segments',{first:seg(-20,0,20,0),second:seg(0,-20,0,20),
  filletRadius:10,branchId:'s++',direction:'ccw',
  firstTravel:'forward',secondTravel:'forward'}],
 ['circles',{first:{center:P(0,0),radius:5},
  second:{center:P(20,0),radius:5},filletRadius:10,
  firstMode:'external',secondMode:'external',branchId:'center-1',
  direction:'cw',knownFirstTravel:'ccw',knownSecondTravel:'ccw'}],
 ['segment-circle',{segment:seg(-15,0,15,0),
  circle:{center:P(0,5),radius:8},filletRadius:3,side:1,
  branchId:'candidate-1',direction:'ccw',lineTravel:'forward',
  knownCircleTravel:'cw'}]
];
for(const [kind,fixture] of cases){
 test('public 02 '+kind+' consumes canonical Intent with original V5 parity',()=>{
  const data=structuredClone(fixture),before=JSON.stringify(data);
  const old=filletTimeline(kind,data,sheet,24);
  const now=live(kind,data,sheet,24);
  assert.equal(now.status,'ready');
  assert.equal(now.canonicalVerified,true);
  assert.equal(now.constructionIntentSchema,VERSION);
  assert.equal(validateConstructionIntentDAG(now.constructionIntents).ok,true);
  assert.deepEqual(now.steps,old.steps);
  assert.deepEqual(now.timing,old.timing);
  assert.equal(now.selectedBranchId,data.branchId);
  assert.deepEqual(now.originalLesson,old.originalLesson);
  assert.deepEqual(now.sourceBounds,old.sourceBounds);
  assert.equal(JSON.stringify(data),before);
 });
 test('public 02 '+kind+' cannot draw when branch or direction is missing',()=>{
  const noBranch=structuredClone(fixture);delete noBranch.branchId;
  const blocked=live(kind,noBranch,sheet,25);
  assert.notEqual(blocked.status,'ready');
  assert.deepEqual(blocked.steps,[]);
  assert.equal(blocked.constructionIntents,undefined);
  const noDirection=structuredClone(fixture);delete noDirection.direction;
  const other=live(kind,noDirection,sheet,26);
  assert.notEqual(other.status,'ready');
  assert.deepEqual(other.steps,[]);
 });
}
test('public 03 two-view reconstruction preserves 3D proof and canonical V5',()=>{
 const input={knownViews:{V:[15,12],H:[15,10]},
  sheetTransform:{origin:P(100,100),scale:2}};
 const old=pointTimeline(input,35),now=live('point-projection',input,null,35);
 assert.equal(now.status,'ready');
 assert.equal(now.canonicalVerified,true);
 assert.equal(now.constructionIntents.length,5);
 assert.equal(now.constructionIntents.at(-1).operations[0].coordinateSpace,'sheet-px');
 assert.equal(validateConstructionIntentDAG(now.constructionIntents).ok,true);
 assert.deepEqual(now.steps,old.steps);
 assert.deepEqual(now.timing,old.timing);
 assert.deepEqual(now.originalLesson,old.originalLesson);
 assert.equal(now.selectedBranchId,null);
});
test('public 03 contradictory or incomplete views fail closed',()=>{
 for(const knownViews of [{V:[15,12]},{V:[15,12],H:[19,10]}]){
  const input={knownViews,sheetTransform:{origin:P(100,100),scale:2}};
  const out=live('point-projection',input,null,40);
  assert.notEqual(out.status,'ready');
  assert.deepEqual(out.steps,[]);
 }
});
test('both real public workbench pages require the canonical Intent bridge',()=>{
 const root=path.resolve(__dirname,'../..');
 for(const file of ['labs/circle-fillet-live-entry.cjs',
                   'labs/point-projection-live-entry.cjs']){
  const content=fs.readFileSync(path.join(root,file),'utf8');
  assert.match(content,/verifiedLiveIntentTimeline/);
  assert.doesNotMatch(content,/const \\{(?:filletTimeline|pointTimeline)\\}=/);
  assert.match(content,/revision/);
 }
});
