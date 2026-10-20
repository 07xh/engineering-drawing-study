'use strict';
const assert=require('node:assert/strict'),G=require('../labs/dof-lab-geometry.js'),E=require('../labs/constraint-engine.js');
for(const id of ['cuboid','triangular-prism','pyramid']){
 const model=G.preset(id),out=G.geometry(model);
 assert(G.validate(model));
 assert.equal(out.views.V.edges.length,model.edges.length);
 assert.equal(out.views.H.edges.length,model.edges.length);
 assert.equal(out.views.W.edges.length,model.edges.length);
 for(const [v,p] of Object.entries(model.points)){
  assert.deepEqual(out.vertices[v].V,G.projectPoint(p).V);
  assert.deepEqual(out.vertices[v].H,G.projectPoint(p).H);
  assert.deepEqual(out.vertices[v].W,G.projectPoint(p).W);
 }
}
const p={x:35,y:22,z:51},q=G.projectPoint(p),t=G.transfer(p),o=G.ORIGIN,s=G.SCALE;
assert.deepEqual(q.V,{x:o.x-35*s,y:o.y-51*s});
assert.deepEqual(q.H,{x:o.x-35*s,y:o.y+22*s});
assert.deepEqual(q.W,{x:o.x+22*s,y:o.y-51*s});
assert.deepEqual(q.M,{x:o.x+22*s,y:o.y+22*s});
assert(Object.values(t.checks).every(Boolean));
assert.deepEqual(t.guide.map(x=>x.kind),['VH','height-VW','depth-HM','depth-MW']);
const engine=(cs)=>G.candidate(p,E.analyze(cs));
assert.equal(engine([]).degrees,3);
assert.equal(engine([{type:'projection',plane:'H',value:[35,22]}]).degrees,1);
assert.equal(engine([{type:'projection',plane:'V',value:[35,51]},{type:'projection',plane:'H',value:[35,22]}]).degrees,0);
assert.deepEqual(engine([{type:'projection',plane:'V',value:[35,51]},{type:'projection',plane:'H',value:[35,22]}]).example,p);
assert.equal(engine([{type:'coordinate',axis:'x',value:35},{type:'coordinate',axis:'x',value:40}]).kind,'none');
assert.throws(()=>G.preset('nonexistent'),/未知/);
assert.throws(()=>G.projectPoint({x:0,y:Infinity,z:1}),/有限/);
const obj=G.preset('cuboid');
obj.edges[0]=['A','UNKNOWN'];
assert.throws(()=>G.geometry(obj),/棱线无效/);
console.log('PASS: common geometry, first-angle aligned V/H/W, 45-degree depth transfer, consistent free-point classification');
