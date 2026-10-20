'use strict';
const assert=require('node:assert/strict'),render=require('../knowledge/drawing-action-renderer.js');
const p={status:'steps-verified',givens:[],steps:[{id:'1',explanation:'确定点A',actions:[{kind:'point',geometry:{x:20,y:30}}]},{id:'2',explanation:'作辅助线',actions:[{kind:'line',geometry:{x1:20,y1:30,x2:80,y2:30}},{kind:'text',geometry:{x:40,y:50},text:'A < B'}]}]};
const frames=render.frames(p);
assert.equal(frames.length,2);assert.equal(frames[0].shapes.length,1);assert.equal(frames[1].shapes.length,3);
assert(render.svgMarkup(frames[1]).includes('A &lt; B'));
assert.throws(()=>render.frames({...p,status:'source-pending'}));
assert.throws(()=>render.frames({...p,steps:[{id:'bad',actions:[{kind:'line',geometry:{x1:0,y1:0,x2:NaN,y2:0}}]}]}));
console.log('PASS: reusable step frames, validated SVG geometry, escaped labels and source gate');
