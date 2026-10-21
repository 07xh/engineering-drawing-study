'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {adaptPointProjection:point,adaptDirectedFillet:fillet}=
 require('../../workbench/verified-teaching-plan.cjs');
const segmentInput=()=>({
 first:{a:{x:-20,y:0},b:{x:20,y:0}},
 second:{a:{x:0,y:-20},b:{x:0,y:20}},
 filletRadius:10,branchId:'s++',direction:'ccw',
 firstTravel:'forward',secondTravel:'forward'
});
const circleInput=()=>({
 first:{center:{x:0,y:0},radius:5},
 second:{center:{x:20,y:0},radius:5},
 filletRadius:10,firstMode:'external',secondMode:'external',
 branchId:'center-1',direction:'cw',
 knownFirstTravel:'ccw',knownSecondTravel:'ccw'
});
test('true first-angle XYZ solution becomes 4 mathematically sourced drawing steps',()=>{
 const args={knownPoint:{x:15,y:10,z:12}};
 const plan=point(args,{revision:17});
 assert.equal(plan.schema,'draftai-teaching-plan/0.1');
 assert.equal(plan.readiness,'ready');
 assert.equal(plan.result.status,'unique');
 assert.equal(plan.result.globallyUnique,true);
 assert.equal(plan.result.point.z,12);
 assert.equal(plan.revision,17);
 assert.equal(plan.stepCount,4);
 assert.equal(plan.proof.verified,true);
 assert.ok(plan.steps.every(x=>x.actions.every(a=>a.coordinateSpace==='sheet-px')));
 assert.deepEqual(plan.steps.map(s=>s.dependsOn),
  [[],['guide_1'],['guide_2'],['guide_3']]);
 assert.deepEqual(Object.keys(args),['knownPoint']);
});
test('two-view V/H real input and direct XYZ give equal normalized projected point',()=>{
 const x=point({knownPoint:{x:15,y:10,z:12}});
 const y=point({knownViews:{V:[15,12],H:[15,10]}});
 assert.equal(x.readiness,'ready');
 assert.equal(y.readiness,'ready');
 assert.deepEqual(x.result.point,y.result.point);
 assert.deepEqual(x.result.views,y.result.views);
});
test('projection conflicting coordinates do not leak guessed answer or steps',()=>{
 const r=point({knownViews:{V:[15,12],H:[17,10]}});
 assert.equal(r.readiness,'blocked');assert.equal(r.result.status,'none');
 assert.equal(r.stepCount,0);assert.deepEqual(r.steps,[]);
 assert.equal(r.proof.verified,false);
 assert.equal(r.result.globallyUnique,null);
});
test('underdetermined point is blocked even though a line of candidate positions exists',()=>{
 const r=point({knownViews:{V:[15,12]}});
 assert.equal(r.readiness,'blocked');
 assert.equal(r.result.globallyUnique,null);
 assert.equal(r.steps.length,0);
});
test('invalid revision, coordinates and degenerate display scale fail closed',()=>{
 assert.throws(()=>point({knownPoint:{x:1,y:2,z:3}},{revision:-1}),/revision/);
 assert.throws(()=>point({knownPoint:{x:Infinity,y:2,z:3}}));
 assert.throws(()=>point({knownPoint:{x:1,y:2,z:3},sheetTransform:{origin:{x:0,y:0},scale:0}}));
});
test('true finite segment G1 connection becomes 6 steps with solver-backed arc',()=>{
 const p=fillet('segments',segmentInput(),{revision:2});
 assert.equal(p.readiness,'ready');assert.equal(p.stepCount,6);
 assert.equal(p.result.status,'selected');
 assert.equal(p.result.selectedBranch,'s++');
 assert.equal(p.result.g1Verified,true);
 assert.equal(p.result.arc.direction,'ccw');
 assert.equal(p.result.arc.coordinateSpace,'model-mm');
 assert.equal(p.steps.at(-1).actions[0].kind,'arc');
 assert.equal(p.steps.at(-1).actions[0].direction,'ccw');
 assert.ok(p.steps.every((s,i)=>!i||s.dependsOn.includes(p.steps[i-1].id)));
});
test('validated two-circle external fillet reuses 4 true computation stages',()=>{
 const p=fillet('circles',circleInput());
 assert.equal(p.readiness,'ready');assert.equal(p.stepCount,4);
 assert.equal(p.result.g1Verified,true);
 assert.equal(p.result.arc.direction,'cw');
 assert.equal(p.steps[0].actions.length,2);
 assert.ok(p.steps[0].actions.every(a=>a.kind==='circle'));
 assert.deepEqual(p.steps[2].actions.map(x=>x.kind),['point','point']);
 assert.equal(p.steps.at(-1).actions[0].kind,'arc');
});
test('selection is not proof of global unique center in two-circle multiple branches',()=>{
 const p=fillet('circles',circleInput());
 assert.equal(p.result.globallyUnique,false);
 assert.ok(p.result.candidateIds.length>1);
});
test('missing branch must not silently pick among mathematically distinct centers',()=>{
 const args=segmentInput();delete args.branchId;
 const p=fillet('segments',args);
 assert.equal(p.readiness,'requires-choice');
 assert.equal(p.result.status,'branch-choice-required');
 assert.equal(p.stepCount,0);
 assert.equal(p.proof.verified,false);
 assert.equal(p.result.candidateIds.length,4);
});
test('unselected circle branch and missing directed G1 prevent publishing lesson steps',()=>{
 const c=circleInput(),s=segmentInput();
 delete c.branchId;
 assert.equal(fillet('circles',c).readiness,'requires-choice');
 delete s.secondTravel;
 const r=fillet('segments',s);
 assert.equal(r.readiness,'requires-choice');
 assert.equal(r.stepCount,0);
 assert.equal(r.proof.verified,false);
});
test('circle case lacking both original contour directions remains blocked',()=>{
 const c=circleInput();delete c.knownFirstTravel;
 const p=fillet('circles',c);
 assert.equal(p.readiness,'blocked');
 assert.equal(p.result.status,'selected');
 assert.equal(p.proof.verified,false);
 assert.deepEqual(p.steps,[]);
});
test('incorrect G1 traversal must never result in animated correct arc',()=>{
 const args=segmentInput();args.firstTravel='reverse';
 const p=fillet('segments',args);
 assert.equal(p.readiness,'blocked');
 assert.equal(p.result.status,'direction-conflict');
 assert.equal(p.steps.length,0);
});
test('non-intersecting or continuous source loci do not invent selected branch',()=>{
 const args=segmentInput();
 const continuous={...args,firstSide:1,secondSide:-1,
  second:{a:{x:-20,y:20},b:{x:20,y:20}}};
 const r=fillet('segments',continuous);
 assert.notEqual(r.readiness,'ready');
 assert.equal(r.proof.verified,false);
 assert.equal(r.steps.length,0);
});
test('student input changes produce different provenance revisions and plans',()=>{
 const a=fillet('segments',segmentInput(),{revision:2});
 const b=fillet('segments',segmentInput(),{revision:3});
 assert.equal(a.result.arc.startAngle,b.result.arc.startAngle);
 assert.equal(a.revision,2);assert.equal(b.revision,3);
 assert.deepEqual(a.steps,b.steps);
});
test('input geometry is pure, model-mm arc never rendered as legacy clockwise SVG action',()=>{
 const x=circleInput(),before=JSON.stringify(x);
 const p=fillet('circles',x);
 assert.equal(JSON.stringify(x),before);
 assert.equal(p.result.arc.coordinateSpace,'model-mm');
 assert.equal(p.result.arc.direction,'cw');
 assert.equal(p.result.arc.kind,'arc');
 assert.equal(p.steps[3].actions[0].coordinateSpace,'model-mm');
 assert.ok(!Object.hasOwn(p.steps[3].actions[0],'svgPath'));
 assert.ok(!Object.hasOwn(p.steps[3].actions[0],'strokeDasharray'));
});
test('unsupported categories and old/invalid math inputs cannot produce verified plans',()=>{
 assert.throws(()=>fillet('lines',segmentInput()),/kind/);
 assert.throws(()=>fillet('segments',{...segmentInput(),filletRadius:0}));
 assert.throws(()=>fillet('circles',{...circleInput(),branchId:'fiction'}));
 assert.throws(()=>fillet('segments',segmentInput(),{revision:NaN}),/revision/);
});
