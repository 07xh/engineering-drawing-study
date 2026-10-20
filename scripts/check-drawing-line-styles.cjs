'use strict';
const assert=require('node:assert/strict'),renderer=require('../knowledge/drawing-action-renderer.js'),adapter=require('../knowledge/textbook-action-adapter.js'),examples=require('../knowledge/textbook-examples.js'),geometry=require('../knowledge/textbook-example-geometry.js');
for(const name of ['given','auxiliary','axis','result','mark'])assert(renderer.styles[name]);
const line={kind:'line',style:'auxiliary',geometry:{x1:1,y1:2,x2:3,y2:4}};
assert(renderer.svgMarkup({shapes:[line]}).includes('stroke-dasharray="7 5"'));
assert(!renderer.validAction({...line,style:'unsafe" onclick="x'}));
for(const example of examples.all){
 const p=adapter.adapt(example,geometry),frames=renderer.frames(p);
 assert(frames.some(f=>f.shapes.some(a=>a.style==='auxiliary')));
 assert(frames[frames.length-1].shapes.some(a=>a.style==='result'));
}
console.log('PASS: verified textbook line styles are preserved and invalid styles are rejected');
