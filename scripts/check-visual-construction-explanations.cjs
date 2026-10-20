'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const visual=require('../knowledge/visual-model.js');
const id='ch02-point-projection',chapter='ch02';
for(let stage=0;stage<4;stage++){
 const picture=visual.svgShapes(id,chapter,stage);
 const guides=picture.shapes.filter(s=>['guide','construction','aux-circle','transfer45'].includes(s.kind));
 if(stage<2)assert.equal(guides.length,0);
 if(stage===2)assert(guides.some(s=>s.label.includes('长对正')));
 if(stage===3){assert(guides.some(s=>s.label.includes('高平齐')));assert(guides.some(s=>s.label.includes('宽相等')))}
}
const html=fs.readFileSync('knowledge/index.html','utf8'),ui=fs.readFileSync('knowledge/visual-ui.js','utf8');
assert(html.includes('id="visualGeometryWhy"'));
assert(ui.includes("picture.shapes.filter(s=>['guide','construction','aux-circle','transfer45'].includes(s.kind))"));
console.log('PASS: each original projection stage exposes its actual helper-line explanations');
