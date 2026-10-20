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
// Dense points should never have their dot centers hidden by label boxes when an alternative exists.
const crowded=[{name:'A',view:'V',xy:[200,200]},{name:'B',view:'V',xy:[217,200]},{name:'C',view:'V',xy:[235,200]}];
const placed=labels.layout(crowded);
for(const p of placed)for(const dot of crowded){
 const width=10+p.label.length*9;
 const inside=dot.xy[0]>=p.labelX-6&&dot.xy[0]<=p.labelX+width+6&&dot.xy[1]>=p.labelY-24&&dot.xy[1]<=p.labelY+8;
 assert(!inside,'label overlaps a projection point');
}
console.log('PASS: deterministic projection label positions, dot clearance and script order');
