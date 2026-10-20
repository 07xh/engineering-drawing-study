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
assert(labels.crossesRect([0,0,100,100],[40,40,60,60]));
assert(!labels.crossesRect([0,0,100,0],[40,40,60,60]));
const nearLine=[{name:'A',view:'V',xy:[200,200]}];
const baseline=labels.layout(nearLine)[0];
const obstructing=[{xy:[baseline.labelX-1,baseline.labelY-8,baseline.labelX+35,baseline.labelY-8]}];
const adjusted=labels.layout(nearLine,obstructing)[0];
assert(!(adjusted.labelX===baseline.labelX&&adjusted.labelY===baseline.labelY),'line avoidance did not move label');
console.log('PASS: stable labels, projection point clearance and line collision avoidance');
