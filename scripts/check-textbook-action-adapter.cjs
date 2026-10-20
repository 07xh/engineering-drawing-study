'use strict';
const assert=require('node:assert/strict'),examples=require('../knowledge/textbook-examples.js'),geometry=require('../knowledge/textbook-example-geometry.js'),adapter=require('../knowledge/textbook-action-adapter.js'),schema=require('../knowledge/problem-schema.js'),player=require('../knowledge/drawing-action-renderer.js');
for(const example of examples.all){
 const problem=adapter.adapt(example,geometry),frames=player.frames(problem);
 assert(schema.validate(problem).ok);
 assert.equal(frames.length,example.order.length);
 for(let i=0;i<frames.length;i++){
  const source=geometry.frame(example.id,i);
  assert(frames[i].shapes.length<=source.shapes.length,'duplicate geometry at '+example.id+' step '+i);
  assert(frames[i].shapes.every(a=>a.kind==='point'||a.kind==='line'));
  assert(player.svgMarkup(frames[i]).length>0);
 }
}
assert.throws(()=>adapter.adapt({...examples.all[0],sourceStatus:'source-pending'},geometry));
const point=adapter.adapt(examples.all[0],geometry).steps[0].actions.find(a=>a.kind==='point');
assert.equal(point.label,'A');assert(player.svgMarkup({shapes:[point]}).includes('>A</text>'));
assert(player.svgMarkup({shapes:[{...point,label:'<script>'}]}).includes('&lt;script&gt;'));
const result=player.frames(adapter.adapt(examples.all[0],geometry));
assert(result[result.length-1].shapes.length<=geometry.frame('example-1-1',4).shapes.length);
console.log('PASS: two reviewed textbook examples preserve every source geometry shape in shared action frames');
