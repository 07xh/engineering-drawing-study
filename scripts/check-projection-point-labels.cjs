'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const ui=fs.readFileSync('knowledge/visual-ui.js','utf8');
assert(ui.includes("const suffix={V:'′',H:'',W:'″'}[shape.view]||'';"));
assert(ui.includes('shape.name+suffix'));
const data=require('../knowledge/visual-model.js');
for(const mode of ['ch02-point-projection','ch02-line-two-points','ch02-plane-definition']){
 const shapes=data.svgShapes(mode,'ch02',3).shapes.filter(s=>s.kind==='point'&&s.name==='A');
 assert.deepEqual(shapes.map(s=>s.view),['V','H','W']);
}
console.log('PASS: projection labels are view-specific and all representative points are present');
