'use strict';
const assert=require('node:assert/strict'),examples=require('../knowledge/textbook-examples.js'),geometry=require('../knowledge/textbook-example-geometry.js'),adapter=require('../knowledge/textbook-action-adapter.js'),schema=require('../knowledge/problem-schema.js'),player=require('../knowledge/drawing-action-renderer.js');
for(const example of examples.all){
 const problem=adapter.adapt(example,geometry),frames=player.frames(problem);
 assert(schema.validate(problem).ok);
 assert.equal(frames.length,example.order.length);
 for(let i=0;i<frames.length;i++){
  const source=geometry.frame(example.id,i);
  assert.equal(frames[i].shapes.length,source.shapes.length,'lost source geometry at '+example.id+' step '+i);
  assert(player.svgMarkup(frames[i]).length>0);
 }
}
assert.throws(()=>adapter.adapt({...examples.all[0],sourceStatus:'source-pending'},geometry));
console.log('PASS: two reviewed textbook examples preserve every source geometry shape in shared action frames');
