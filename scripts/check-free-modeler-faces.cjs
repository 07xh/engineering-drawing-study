'use strict';
const assert=require('node:assert/strict'),F=require('../labs/free-geometry-core.js'),G=require('../labs/dof-lab-geometry.js');
const Sheet=require('../labs/free-geometry-sheet.js'),Svg=require('../labs/free-geometry-spatial-svg.js');
let s=F.create();
for(const p of [
 {id:'A',x:10,y:10,z:0},{id:'B',x:50,y:10,z:0},
 {id:'C',x:10,y:50,z:0},{id:'D',x:10,y:10,z:60}
])s=F.apply(s,{type:'add-point',...p});
assert.equal(F.summary(s).unconstrainedDegrees,12);
assert.equal(F.summary(s).faces,0);
const before=s;
s=F.apply(s,{type:'add-face',vertices:['A','B','C']});
assert.equal(before.edges.length,0,'topology operation must not mutate source');
assert.equal(s.edges.length,3,'triangle should automatically add its three boundary segments');
assert.equal(s.faces.length,1);
assert.equal(F.summary(s).unconstrainedDegrees,12,'a triangular display face adds no implicit size/rigidity constraints');
assert(G.validate(F.asModel(s)));
const sheet=Sheet.markup(s),spatial=Svg.markup(s);
assert(sheet.includes('class="free-sheet-face"'));
assert(spatial.includes('class="free-space-face"'));
assert(sheet.includes('45°'));
assert.throws(()=>F.apply(s,{type:'add-face',vertices:['C','A','B']}),/重复/);
assert.throws(()=>F.apply(s,{type:'add-face',vertices:['A','A','C']}),/不同/);
assert.throws(()=>F.apply(s,{type:'add-face',vertices:['A','B','Q']}),/已有/);
for(const ids of [['A','B','D'],['A','C','D'],['B','C','D']])s=F.apply(s,{type:'add-face',vertices:ids});
assert.equal(s.faces.length,4);
assert.equal(s.edges.length,6);
assert.equal(F.summary(s).unconstrainedDegrees,12,'tetrahedral topology by itself does not set rigid edge lengths');
assert.equal(F.asModel(s).faces.length,4);
const renamed=F.apply(s,{type:'edit-point',id:'A',newId:'P',x:10,y:10,z:0});
assert(renamed.faces.every(face=>!face.includes('A')),'renaming must update all faces');
assert(renamed.faces.filter(face=>face.includes('P')).length===3);
const moved=F.apply(renamed,{type:'edit-point',id:'D',newId:'D',x:10,y:10,z:85});
assert.equal(moved.faces.length,4);
assert.throws(()=>F.apply(s,{type:'edit-point',id:'C',newId:'C',x:30,y:10,z:0}),/共线/);
const removedEdge=F.apply(s,{type:'remove-edge',a:'A',b:'B'});
assert.equal(removedEdge.faces.length,2,'removing a triangle boundary must remove incident faces');
const removedPoint=F.apply(s,{type:'remove-point',id:'D'});
assert.equal(removedPoint.faces.length,1,'deleting a vertex removes incident faces');
const clearedFace=F.apply(s,{type:'remove-face',vertices:['C','B','A']});
assert.equal(clearedFace.faces.length,3);
assert.equal(clearedFace.edges.length,6,'removing a face should preserve user-drawn boundary segments');
assert.equal(F.apply(s,{type:'clear'}).faces.length,0);
const collinear=F.apply(F.apply(F.apply(F.create(),{type:'add-point',id:'A',x:0,y:0,z:0}),
 {type:'add-point',id:'B',x:5,y:5,z:5}),{type:'add-point',id:'C',x:10,y:10,z:10});
assert.throws(()=>F.apply(collinear,{type:'add-face',vertices:['A','B','C']}),/共线/);
console.log('PASS: add/move/rename/delete nondegenerate triangle faces, automatic edges, tetrahedral topology and unchanged unconstrained DOF');
