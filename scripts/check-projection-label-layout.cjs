'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const model=require('../knowledge/visual-model.js'),labels=require('../knowledge/projection-labels.js');
for(const id of ['ch02-point-projection','ch02-line-two-points','ch02-plane-definition','ch02-three-view-system','ch02-polyhedra']){
 const pts=model.svgShapes(id,'ch02',3).shapes.filter(s=>s.kind==='point');
 const out=labels.layout(pts);
 assert.equal(out.length,pts.length);
 assert.deepEqual(out,labels.layout(pts));
 for(const p of out){assert(p.labelX>=5&&p.labelY>=20&&p.labelY<=640)}
}
const html=fs.readFileSync('knowledge/index.html','utf8');
assert(html.indexOf('src="projection-labels.js"')<html.indexOf('src="visual-ui.js"'));
console.log('PASS: deterministic projection label positions and script order');
