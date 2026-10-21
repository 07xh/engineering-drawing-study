'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const html=read('labs/point-projection-live.html');
const script=read('labs/point-projection-live-entry.cjs');
const build=read('scripts/build-static.cjs');
const home=read('index.html');
const {solveProjection}=require('../../engines/projection/point-projection.cjs');

test('live P0 projection page uses local bundled solver and not a fake static answer',()=>{
 assert.match(html,/point-projection-live-bundle\.js/);
 assert.doesNotMatch(html,/https?:\/\//i);
 assert.match(script,/require\('\.\.\/engines\/projection\/point-projection\.cjs'\)/);
 assert.match(script,/solveProjection\(given\)/);
 assert.doesNotMatch(script,/innerHTML\s*=/);
 assert.doesNotMatch(script,/fetch\(|XMLHttpRequest|localStorage|sessionStorage/);
});
test('input revision invalidation happens before recompute; no stale computed points',()=>{
 assert.match(script,/revision\+\+/);
 assert.match(script,/solution=null;shownStep=0/);
 assert.match(script,/if\(s\.status==='unique'\)/);
 assert.match(script,/\.guides\.slice\(0,shownStep\)/);
 assert.match(script,/if\(shownStep===s\.steps\.length\)/);
});
test('input and keyboard accessible live controls are wired',()=>{
 for(const id of ['paperSvg','pairSelect','firstU','firstV','secondU','secondV','scaleInput',
   'recompute','resetExample','previous','next','restart','solveStatus','stepExplanation']){
  assert.equal((html.match(new RegExp('id="'+id+'"','g'))||[]).length,1,id);
  assert.match(script,new RegExp(id));
 }
 assert.match(html,/aria-live="polite"/);
 assert.match(html,/@media\(max-width:900px\)/);
 assert.match(html,/min-height:44px/);
 assert.match(script,/createElementNS/);
});
test('production home links exact public page, build packages it without publishing source',()=>{
 assert.match(home,/href="labs\/point-projection-live\.html"/);
 assert.match(build,/'labs\/point-projection-live\.html'/);
 assert.match(build,/labs\/point-projection-live-entry\.cjs/);
 assert.match(build,/labs\/point-projection-live-bundle\.js/);
 assert.doesNotMatch(build,/'tests\/projection\/point-projection\.test\.cjs'/);
 assert.doesNotMatch(build,/'core\/contracts\/geometry\.js'/);
});
test('live solver uses true point projection and fails closed on contradictory data',()=>{
 const success=solveProjection({knownViews:{V:[15,12],H:[15,10]}});
 assert.equal(success.status,'unique');
 assert.deepEqual(success.point,{x:15,y:10,z:12});
 assert.equal(success.steps.length,4);
 const bad=solveProjection({knownViews:{V:[15,12],H:[16,10]}});
 assert.equal(bad.status,'none');
 assert.deepEqual(bad.steps,[]);
});
