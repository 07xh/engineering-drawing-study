'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {deriveGeometryScene}=require('../../core/projection/geometry-scene-views.cjs');
const {requireCompleteWebGLFeatureBudget:budget}=
 require('../../project/geometry-scene-consumer.cjs');
const G=(id,kind,data,space='model-3d')=>
 ({id,kind,space,unit:'mm',data});
const p=(x,y,z)=>({x,y,z});
const scene=geometry=>deriveGeometryScene({geometry,revision:31});
const affine=(offset,slope)=>({kind:'affine',offset,slope});
const curve=i=>G('Curve'+i,'analytic-curve',{
 parameter:{from:0,to:1},
 coordinates:{x:affine(i%100,1),y:affine(Math.floor(i/100),0),
  z:affine(0,1)}
});
const src=fs.readFileSync(path.join(__dirname,'../../project/linked-three-scene-entry.js'),'utf8');
const controller=fs.readFileSync(path.join(__dirname,'../../project/unified-workbench-entry.cjs'),'utf8');

test('the complete 3D source budget counts mesh edges, ordered spans and original points exactly',()=>{
 const shape=scene([
  G('P','point',p(0,0,0)),
  G('S','segment',{start:p(0,0,0),end:p(1,1,1)}),
  G('L','line',{point:p(0,0,0),direction:p(1,0,0)}),
  G('Polyline','polyline',{points:[p(0,0,0),p(1,0,0),p(1,1,0)],closed:false}),
  G('Closed','polyline',{points:[p(0,0,0),p(1,0,0),p(1,1,0)],closed:true}),
  G('Mesh','mesh',{points:{a:p(0,0,0),b:p(1,0,0),c:p(0,1,0)},
   edges:[['a','b'],['b','c'],['c','a']],faces:[['a','b','c']]}),
  G('Paper','point',{x:0,y:0},'drawing-2d'),
  G('Plane','plane',{normal:p(0,0,1),offset:0})
 ]);
 const proof=budget(shape);
 assert.equal(proof.required,11);
 assert.equal(proof.limit,25000);
 assert.equal(proof.displayOnly,true);
 assert.equal(proof.engineeringLineStyle,'undetermined');
 assert.equal(proof.v5Authorized,false);
 assert.equal(Object.isFrozen(proof),true);
});

test('genuine M3 analytic source curves count 96 GPU pieces without becoming source edges',()=>{
 const s=scene([curve(0),curve(1)]);
 assert.equal(budget(s).required,192);
 assert.equal(s.objects[0].kind,'analytic-curve');
 assert.equal(s.objects[0].representations.V.visibility,'undetermined');
});

test('exact WebGL limit is accepted; one more real analytic curve fails rather than silently omitting 3D geometry',()=>{
 const exact=scene(Array.from({length:260},(_,i)=>curve(i)));
 assert.equal(budget(exact).required,24960);
 const atLimit=scene([
  ...Array.from({length:260},(_,i)=>curve(i)),
  ...Array.from({length:40},(_,i)=>G('Point'+i,'point',p(i,0,0)))
 ]);
 assert.equal(budget(atLimit).required,25000);
 const over=scene(Array.from({length:261},(_,i)=>curve(i)));
 assert.throws(()=>budget(over),/WebGL 完整显示容量/);
});

test('a forged or malformed scene cannot borrow the genuine Geometry Scene preflight',()=>{
 assert.throws(()=>budget(null),/完整 Geometry Scene/);
 assert.throws(()=>budget({schema:'forged',revision:0,objects:[]}),/完整 Geometry Scene/);
 const s=scene([G('S','segment',{start:p(0,0,0),end:p(1,0,0)})]);
 assert.throws(()=>budget({...s,objects:[{...s.objects[0],
  representations:{'3D':{data:{}}},kind:'mesh'}]}),/特征数量无效/);
});

test('WebGL builds only a complete model, and any mount/build failure uses existing SVG',()=>{
 assert.match(src,/requireCompleteWebGLFeatureBudget\(scene\)/);
 assert.match(src,/if\(budget\.limit!==MAX_FEATURES\)/);
 assert.match(src,/refusing partial 3D model/);
 assert.match(src,/function build\(scene\)/);
 assert.ok(src.indexOf('requireCompleteWebGLFeatureBudget(scene)')<
  src.indexOf('clear();\n  const points=allPoints(scene)'),
  'preflight must run before destroying the last complete 3D scene');
 const start=controller.indexOf('function renderSpatial()');
 const end=controller.indexOf('function renderSteps()',start);
 const section=controller.slice(start,end);
 assert.ok(start>0&&end>start);
 assert.match(section,/try\{three=ensureLinkedThree\(\);\}/);
 assert.match(section,/try\{\s*three\.update\(out\.scene,/);
 assert.match(section,/catch\(_\)\{/);
 assert.match(section,/svg\.hidden=false/);
 assert.match(section,/drawPrimitives\(svg,result\.spatial,'3D'/);
 assert.match(section,/\$\('v9-three-space'\)\.hidden=true/);
});
