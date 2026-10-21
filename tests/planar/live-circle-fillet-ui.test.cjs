'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'../..',p),'utf8');
const html=read('labs/circle-fillet-live.html');
const entry=read('labs/circle-fillet-live-entry.cjs');
const build=read('scripts/build-static.cjs');
const home=read('index.html');
const {circleCircleFilletCenters}=require('../../engines/planar/circle-circle-fillet.cjs');
const {chooseDirectedFillet}=require('../../engines/planar/directed-circle-fillet.cjs');
const args=()=>({first:{center:{x:0,y:0},radius:5},second:{center:{x:20,y:0},radius:5},
 filletRadius:10,firstMode:'external',secondMode:'external'});
test('public circle fillet page references only build-local bundle',()=>{
 assert.match(html,/circle-fillet-live-bundle\.js/);
 assert.doesNotMatch(html,/https?:\/\//);
 for(const id of ['diagram','x1','y1','r1','mode1','x2','y2','r2','mode2',
  'filletRadius','branch','direction','travel1','travel2','status','prev','next','reset']){
  assert.equal((html.match(new RegExp('id="'+id+'"','g'))||[]).length,1,id);
 }
});
test('live UI consumes both real candidate and finite directed G1 solvers',()=>{
 assert.match(entry,/require\('\.\.\/engines\/planar\/circle-circle-fillet\.cjs'\)/);
 assert.match(entry,/require\('\.\.\/engines\/planar\/directed-circle-fillet\.cjs'\)/);
 assert.match(entry,/circleCircleFilletCenters\(args\)/);
 assert.match(entry,/chooseDirectedFillet\(args\)/);
 assert.doesNotMatch(entry,/innerHTML\s*=|fetch\(|XMLHttpRequest|localStorage/);
});
test('SVG sweep direction explicitly converts model ccw to screen flag 0',()=>{
 assert.match(entry,/a\.direction==='cw'\?1:0/);
 assert.match(entry,/Math\.abs\(a\.endAngle-a\.startAngle\)>180\?1:0/);
 assert.match(entry,/chosen\?\.status==='selected'/);
});
test('circle fillet public whitelist and home navigation preserve source privacy',()=>{
 assert.match(build,/'labs\/circle-fillet-live\.html'/);
 assert.match(build,/labs\/circle-fillet-live-entry\.cjs/);
 assert.match(build,/labs\/circle-fillet-live-bundle\.js/);
 assert.match(home,/href="labs\/circle-fillet-live\.html"/);
 assert.doesNotMatch(build,/'tests\/planar\/directed-circle-fillet\.test\.cjs'/);
});
test('actual two-circle model gives two candidates and blocks missing direction',()=>{
 const c=circleCircleFilletCenters(args());
 assert.equal(c.candidateCount,2);
 const noChoice=chooseDirectedFillet({...args(),direction:'cw'});
 assert.equal(noChoice.status,'branch-choice-required');
 const explicit=chooseDirectedFillet({...args(),branchId:'center-1',direction:'cw',
  knownFirstTravel:'ccw',knownSecondTravel:'ccw'});
 assert.equal(explicit.status,'selected');
 assert.equal(explicit.g1Verified,true);
 const wrong=chooseDirectedFillet({...args(),branchId:'center-1',direction:'cw',
  knownFirstTravel:'cw',knownSecondTravel:'ccw'});
 assert.equal(wrong.status,'direction-conflict');
});
