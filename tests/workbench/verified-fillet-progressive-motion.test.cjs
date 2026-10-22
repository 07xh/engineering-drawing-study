'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const Progressive=require('../../workbench/verified-fillet-progressive-motion.cjs');
const Bridge=require('../../workbench/verified-plan-v5-bridge.cjs');
const Timeline=require('../../workbench/teaching-timeline-v5.js');
const Motion=require('../../workbench/teaching-motion-v5.js');
const origin={x:360,y:220},scale=8;
const circleInput=()=>({
 first:{center:{x:0,y:0},radius:5},
 second:{center:{x:20,y:0},radius:5},
 filletRadius:10,firstMode:'external',secondMode:'external',
 branchId:'center-1',direction:'cw',
 knownFirstTravel:'ccw',knownSecondTravel:'ccw'
});
const lineInput=()=>({
 first:{a:{x:-20,y:0},b:{x:20,y:0}},
 second:{a:{x:0,y:-20},b:{x:0,y:20}},
 filletRadius:10,branchId:'s++',direction:'ccw',
 firstTravel:'forward',secondTravel:'forward'
});
const mixedInput=()=>({
 segment:{a:{x:-15,y:0},b:{x:15,y:0}},
 circle:{center:{x:0,y:5},radius:8},
 filletRadius:3,side:1,branchId:'candidate-1',
 direction:'ccw',lineTravel:'forward',knownCircleTravel:'cw'
});
const plan=(kind,args,n=1)=>{
 const proof=Bridge.filletTimeline(kind,args,{origin,scale},n);
 assert.equal(proof.status,'ready');
 return Progressive.build({kind,teaching:proof,verified:true,
  centers:null,chosen:null,origin,scale,max:proof.steps.length,revision:n});
};
test('V5 uses REAL two-circle actions: 2 progressively traced locus circles, 2 points, selected arc',()=>{
 const p=plan('circles',circleInput(),5);
 assert.equal(p.steps.length,4);
 assert.deepEqual(p.steps.map(s=>s.actions.map(a=>a.kind)),[
  ['circle','circle'],['point'],['point','point'],['arc']]);
 assert.equal(p.timeline.steps[0].endMs,1200);
 assert.equal(p.timeline.steps.at(-1).startMs,3600);
 const at300=Timeline.frame(p.timeline,300);
 assert.equal(Progressive.completedSteps(p.timeline,at300),0);
 const first=p.steps[0].actions[0],second=p.steps[0].actions[1];
 const geometry=Motion.actionShapeAttrs(first,at300.actionFractions[first.id]);
 assert.ok(geometry['stroke-dasharray'].split(' ')[0]>0);
 assert.notEqual(geometry['stroke-dasharray'],'none');
 assert.equal(at300.actionFractions[second.id],0,'second circle waits while first traces');
 const later=Timeline.frame(p.timeline,800);
 assert.equal(later.actionFractions[first.id],1);
 assert.ok(later.actionFractions[second.id]>0);
 assert.ok(later.actionFractions[second.id]<1);
 assert.ok(later.actionFractions[p.steps.at(-1).actions[0].id]===0);
 const final=Timeline.frame(p.timeline,4000);
 assert.ok(final.actionFractions[p.steps.at(-1).actions[0].id]>0);
});
test('V5 finite segments use actual end coordinates for partial offset lines, not fixed highlights',()=>{
 const p=plan('segments',lineInput(),12);
 assert.equal(p.steps.length,6);
 assert.deepEqual(p.steps.slice(0,2).map(s=>s.actions[0].kind),['line','line']);
 const a=p.steps[0].actions[0];
 const early=Motion.actionShapeAttrs(a,Timeline.frame(p.timeline,300).actionFractions[a.id]);
 assert.notEqual(early.x2,early.x1);
 assert.notEqual(early.x2,a.geometry.to.x);
 assert.deepEqual({x:early.x1,y:early.y1},a.geometry.from);
 const late=Motion.actionShapeAttrs(a,Timeline.frame(p.timeline,800).actionFractions[a.id]);
 assert.ok(Math.hypot(late.x2-early.x2,late.y2-early.y2)>0);
 assert.equal(Progressive.completedSteps(p.timeline,1200&&Timeline.frame(p.timeline,1200)),1);
 const arc=p.steps.at(-1).actions[0];
 assert.equal(arc.kind,'arc');
 assert.equal(Timeline.frame(p.timeline,6000).actionFractions[arc.id],0);
 assert.equal(Progressive.completedSteps(p.timeline,6000&&Timeline.frame(p.timeline,6000)),5);
});
test('V5 line-circle proof draws true offset, concentric locus, center, contacts then arc',()=>{
 const p=plan('segment-circle',mixedInput(),8);
 assert.equal(p.steps.length,5);
 assert.deepEqual(p.steps.map(s=>s.actions.map(a=>a.kind)),[
  ['line'],['circle'],['point'],['point','point'],['arc']]);
 const v=Motion.actionShapeAttrs(p.steps[1].actions[0],
  Timeline.frame(p.timeline,1600).actionFractions[p.steps[1].actions[0].id]);
 assert.ok(v['stroke-dasharray'].split(' ')[0]>0);
 assert.ok(p.steps.at(-1).actions[0].geometry.radius>0);
});
test('exploratory incomplete two-circle inputs progressively show verified loci, never invented arc',()=>{
 const centers=require('../../engines/planar/circle-circle-fillet.cjs')
  .circleCircleFilletCenters(circleInput());
 const p=Progressive.build({kind:'circles',centers,
  verified:false,chosen:null,teaching:null,origin,scale,max:4,revision:1});
 assert.equal(p.verified,false);
 assert.deepEqual(p.steps[0].actions.map(x=>x.kind),['circle','circle']);
 assert.equal(p.steps.at(-1).actions.length,0);
 assert.ok(p.steps.every(s=>s.actions.every(a=>a.kind!=='arc')));
 const f=Timeline.frame(p.timeline,300);
 assert.ok(f.actionFractions[p.steps[0].actions[0].id]>0);
 assert.equal(Progressive.completedSteps(p.timeline,Timeline.frame(p.timeline,1200)),1);
});
test('exploratory mixed fillet exposes only true solver line and auxiliary circle, no selected answer',()=>{
 const all=require('../../engines/planar/segment-circle-fillet.cjs')
  .finiteSegmentCircleFillets(mixedInput());
 const p=Progressive.build({kind:'segment-circle',centers:all,
  verified:false,chosen:null,teaching:null,origin,scale,max:3,revision:3});
 assert.equal(p.steps[0].actions[0].kind,'line');
 assert.equal(p.steps[1].actions[0].kind,'circle');
 assert.ok(p.steps.every(s=>s.actions.every(a=>a.kind!=='arc')));
 assert.equal(Progressive.completedSteps(p.timeline,Timeline.frame(p.timeline,200)),0);
});
test('V5 refuses false positive verified envelope and invalid transform',()=>{
 const valid=Bridge.filletTimeline('circles',circleInput(),{origin,scale},1);
 assert.throws(()=>Progressive.build({kind:'circles',teaching:valid,
  verified:true,revision:2,origin,scale,max:4}),/verified/);
 assert.throws(()=>Progressive.build({kind:'circles',teaching:valid,
  verified:true,revision:1,origin:{x:Infinity,y:0},scale,max:4}));
 assert.throws(()=>Progressive.build({kind:'circles',teaching:valid,
  verified:true,revision:1,origin,scale:0,max:4}));
});
