'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const Legacy=require('../../labs/constraint-engine.js');
const Project=require('../../labs/dof-lab-geometry.js');
const {adaptLegacyModel,adaptLegacyProblem}=require('../../core/adapters');
const schema=require('../../knowledge/problem-schema.js');
test('original linear engine remains unchanged and callable',()=>{
 const input=[{type:'projection',plane:'H',value:[35,22]},
   {type:'projection',plane:'V',value:[35,51]}];
 const before=Legacy.analyze(input);
 assert.equal(before.result.degrees,0);
 assert.deepEqual(before.result.particular,[35,22,51]);
 assert.deepEqual(Legacy.analyze(input),before);
});
test('legacy preset is copied rather than mutated',()=>{
 const model=Project.preset('triangular-prism');
 const original=JSON.parse(JSON.stringify(model));
 const translated=adaptLegacyModel(model);
 translated.data.points.A.x=999;
 assert.deepEqual(model,original);
});
test('old textbook renderer input remains valid after contract extension',()=>{
 const old={id:'example-2-3',title:'点坐标投影',type:'point-projection',
  status:'steps-verified',source:{book:'工程制图与 AutoCAD 第3版',page:35},
  givens:['A(15,10,12)'],steps:[{id:'step-1',explanation:'绘制给定点',actions:[]}],renderMode:'manual-steps'};
 assert.equal(schema.validate(old).ok,true);
 const converted=adaptLegacyProblem(old);
 assert.equal(schema.validate(converted).ok,true);
 assert.deepEqual(converted.steps,old.steps);
 assert.equal(converted.renderMode,old.renderMode);
});
