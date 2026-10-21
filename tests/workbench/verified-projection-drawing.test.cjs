'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {gradeProjectionDrawing:grade,matchLine}=require('../../workbench/verified-projection-drawing.cjs');
const {solveProjection}=require('../../engines/projection/point-projection.cjs');
const math=(p={x:15,y:10,z:12},scale=4)=>
 solveProjection({knownPoint:p,sheetTransform:{origin:{x:360,y:210},scale}});
const strokes=(s,revision=1)=>s.map(step=>({from:{...step.from},to:{...step.to},revision}));
test('real analytical guides with 4 correct drawn lines reach verified 4/4',()=>{
 const s=math().steps,g=grade(s,strokes(s),{scale:4,revision:1});
 assert.equal(g.status,'correct');
 assert.equal(g.matchedCount,4);
 assert.equal(g.targetCount,4);
 assert.deepEqual(g.acceptedIds,s.map(x=>x.id));
 assert.deepEqual(g.remainingIds,[]);
 assert.equal(g.extraCount,0);
 assert.equal(g.maxNormalResidualMm,0);
});
test('reverse drawing and permute strokes cannot change the geometric grade',()=>{
 const s=math().steps;
 const reversed=strokes(s).reverse().map(p=>({...p,from:p.to,to:p.from}));
 const g=grade(s,reversed,{scale:4,revision:1});
 assert.equal(g.status,'correct');
 assert.equal(g.matchedCount,4);
});
test('model mm tolerance accepts modest drawing errors and rejects clearly displaced parallel',()=>{
 const s=math().steps;
 const close=strokes(s).map(x=>({...x,from:{...x.from},to:{...x.to}}));
 close[0].from.x+=1.8;close[0].to.x+=1.8; // 0.45 mm normal offset
 assert.equal(grade(s,close,{scale:4,revision:1}).status,'correct');
 close[0].from.x+=5;close[0].to.x+=5; // 1.7 mm from expected line
 const g=grade(s,close,{scale:4,revision:1});
 assert.equal(g.status,'partial');
 assert.equal(g.matchedCount,3);
 assert.ok(g.remainingIds.includes(s[0].id));
});
test('longer collinear construction lines are acceptable without endpoint pixel equality',()=>{
 const s=math().steps;
 const extended=strokes(s).map(item=>{
  const dx=item.to.x-item.from.x,dy=item.to.y-item.from.y;
  return {...item,
   from:{x:item.from.x-dx*0.4,y:item.from.y-dy*0.4},
   to:{x:item.to.x+dx*0.9,y:item.to.y+dy*0.9}};
 });
 assert.equal(grade(s,extended,{scale:4,revision:1}).status,'correct');
});
test('shorter collinear strokes missing a target endpoint must fail coverage',()=>{
 const s=math().steps,attempt=strokes(s);
 attempt[1]={...attempt[1],
  from:{x:s[1].from.x+(s[1].to.x-s[1].from.x)*0.2,
    y:s[1].from.y+(s[1].to.y-s[1].from.y)*0.2}};
 const g=grade(s,attempt,{scale:4,revision:1});
 assert.equal(g.status,'partial');
 assert.equal(g.matchedCount,3);
});
test('45-degree stroke cannot be mistaken for horizontal or vertical guide',()=>{
 const s=math().steps;
 const diagonal={revision:1,from:{x:280,y:200},to:{x:380,y:300}};
 const g=grade(s,[diagonal],{scale:4,revision:1});
 assert.equal(g.status,'incorrect');
 assert.equal(g.matchedCount,0);
});
test('a single very long line cannot certify two distinct line guides',()=>{
 const s=math({x:15,y:10,z:12}).steps;
 const g=grade(s,[{revision:1,from:{x:300,y:-500},to:{x:300,y:900}}],{scale:4,revision:1});
 assert.ok(g.matchedCount<=1);
});
test('duplicated strokes do not count as new steps and flag an extra',()=>{
 const s=math().steps;
 const same=strokes(s);
 same.push({...same[0]});
 const result=grade(s,same,{scale:4,revision:1});
 assert.equal(result.matchedCount,4);
 assert.equal(result.extraCount,1);
 assert.equal(result.status,'partial');
});
test('input revision changes invalidate even geometrically identical prior strokes',()=>{
 const s=math().steps;
 assert.throws(()=>grade(s,strokes(s,2),{scale:4,revision:3}),/stale/);
});
test('model-unit scoring is scale invariant (zoom changes pixels, not acceptance)',()=>{
 const at4=math(undefined,4).steps;
 const at8=math(undefined,8).steps;
 const mk=s=>strokes(s).map(t=>({...t,from:{x:t.from.x+2,y:t.from.y},
  to:{x:t.to.x+2,y:t.to.y}}));
 const r4=grade(at4,mk(at4),{scale:4,revision:1});
 const r8=grade(at8,mk(at8),{scale:8,revision:1});
 assert.equal(r4.status,'correct');
 assert.equal(r8.status,'correct');
 assert.ok(r4.maxNormalResidualMm>=r8.maxNormalResidualMm);
});
test('wrong slope is rejected even when the two segments cross once',()=>{
 const s=math().steps;
 const actual={revision:1,from:{x:s[0].from.x-25,y:s[0].from.y},
  to:{x:s[0].to.x+25,y:s[0].to.y}};
 assert.equal(grade(s,[actual],{scale:4,revision:1}).matchedCount,0);
});
test('unknown fixtures, synthetic lines and malformed step IDs are not verified',()=>{
 const steps=math().steps;
 assert.throws(()=>grade([{...steps[0],source:'synthetic'}],[],{scale:4,revision:1}),/non-mathematical/);
 assert.throws(()=>grade([steps[0],{...steps[0]}],[],{scale:4,revision:1}),/duplicate/);
 assert.throws(()=>grade([{...steps[0],to:{...steps[0].from}}],[],{scale:4,revision:1}),/degenerate/);
 assert.throws(()=>grade(steps,[{revision:1,from:{x:0,y:0},to:{x:NaN,y:2}}],{scale:4,revision:1}),/invalid/);
 assert.throws(()=>grade(steps,[],{scale:0,revision:1}),/scale/);
 assert.throws(()=>grade(steps,[],{scale:4,revision:NaN}),/revision/);
});
test('multiple valid strokes with overlap still get a deterministic max matching',()=>{
 const s=math().steps;
 const one=strokes(s);
 const reordered=[one[3],one[0],one[2],one[1]];
 assert.equal(grade(s,reordered,{scale:4,revision:1}).matchedCount,4);
});
test('grade results are pure and do not modify solved geometry or student strokes',()=>{
 const steps=math().steps,drawn=strokes(steps);
 const snap=JSON.stringify({steps,drawn});
 grade(steps,drawn,{scale:4,revision:1});
 assert.equal(JSON.stringify({steps,drawn}),snap);
 const match=matchLine(steps[0],drawn[0],{scale:4,toleranceMm:.75});
 assert.equal(match.ok,true);
});
