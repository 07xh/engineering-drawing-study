'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const M=require('../../workbench/teaching-motion-v4.js');
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,a+' differs from '+b);

test('line interpolation is deterministic and preserves input',()=>{
 const a={x:10,y:20},b={x:110,y:60},original=JSON.stringify([a,b]);
 assert.deepEqual(M.drawLine(a,b,0).pen,a);
 assert.deepEqual(M.drawLine(a,b,0.5).pen,{x:60,y:40});
 assert.deepEqual(M.drawLine(a,b,1).pen,b);
 assert.equal(JSON.stringify([a,b]),original);
 assert.equal(M.drawLine(a,b,2).finished,true);
});
test('circle from the top displays a radius sweep marker',()=>{
 const shape=M.drawCircle({x:50,y:60},10,0.25);
 close(shape.pen.x,60);close(shape.pen.y,60);
 close(shape.strokeDasharray[0],Math.PI*5);
 assert.equal(shape.finished,false);
 assert.equal(M.drawCircle({x:50,y:60},10,1).finished,true);
});
test('arc respects screen-space signed sweep and exact endpoints',()=>{
 const a=M.drawArc({x:0,y:0},10,0,Math.PI/2,1);
 close(a.pen.x,0);close(a.pen.y,10);
 assert.match(a.d,/ A 10 10 0 0 1 /);
 const backwards=M.drawArc({x:0,y:0},10,Math.PI/2,-Math.PI/2,1);
 close(backwards.pen.x,10);close(backwards.pen.y,0);
 assert.match(backwards.d,/ A 10 10 0 0 0 /);
 assert.equal(M.drawArc({x:0,y:0},10,0,Math.PI/2,0).finished,false);
});
test('arc longer than semicircle sets correct large-arc flag',()=>{
 assert.match(M.drawArc({x:0,y:0},10,0,Math.PI*1.5,1).d,/ A 10 10 0 1 1 /);
});
test('viewport focuses bounded area while keeping source untouched',()=>{
 const b={minX:210,maxX:270,minY:140,maxY:200};
 const out=M.focusViewport(b,{width:720,height:460},1.2);
 close(out.width,600);close(out.height,460/1.2);
 assert.ok(out.x>=0&&out.x<=120&&out.y>=0);
 assert.deepEqual(b,{minX:210,maxX:270,minY:140,maxY:200});
 assert.deepEqual(M.focusViewport(null),{x:0,y:0,width:720,height:460});
});
test('extreme in-canvas focus clamps viewBox safely',()=>{
 const a=M.focusViewport({minX:0,maxX:0,minY:0,maxY:0});
 close(a.x,0);close(a.y,0);
 const b=M.focusViewport({minX:1000,maxX:1010,minY:900,maxY:910});
 close(b.x,720-b.width);close(b.y,460-b.height);
});
test('camera eases at known rate and reduced motion instantly snaps',()=>{
 const a={x:0,y:0,width:720,height:460},b={x:40,y:30,width:600,height:383};
 assert.deepEqual(M.easeViewport(a,b,.25),{x:10,y:7.5,width:690,height:440.75});
 assert.deepEqual(M.easeViewport(a,b,.25,true),b);
 assert.deepEqual(a,{x:0,y:0,width:720,height:460});
});
test('diagram action ids map to ordered steps, with duplicate rejection',()=>{
 const steps=[{id:'a',actionIds:['known']},{id:'b',actionIds:['guide1','guide2']}];
 const map=M.drawingStepMap(steps);
 assert.deepEqual(map.get('guide1'),{stepId:'b',stepIndex:1});
 assert.equal(map.has('missing'),false);
 assert.throws(()=>M.drawingStepMap([{id:'x',actionIds:['dup']},{id:'y',actionIds:['dup']}]),/duplicate/);
});
test('all interpolation helpers reject non-finite or degenerate input',()=>{
 assert.throws(()=>M.progress(NaN));
 assert.throws(()=>M.drawLine({x:Infinity,y:0},{x:1,y:2},.5));
 assert.throws(()=>M.drawLine({x:1e308,y:0},{x:-1e308,y:0},.5));
 assert.throws(()=>M.drawCircle({x:0,y:0},0,.5));
 assert.throws(()=>M.drawCircle({x:0,y:0},Infinity,.5));
 assert.throws(()=>M.drawArc({x:0,y:0},1,0,Math.PI*2,1));
 assert.throws(()=>M.focusViewport({minX:4,maxX:1,minY:1,maxY:2}));
 assert.throws(()=>M.focusViewport(null,{width:0,height:460}));
 assert.throws(()=>M.drawingStepMap([{id:'bad',actionIds:[null]}]));
});
