'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {VIEWS,project,FIRST_ANGLE_OBSERVER_RAYS:DIRS,
 validateFirstAngleObserverRays:validate}=
 require('../../core/projection/conventions.js');
const {DIRS:coneDirs,validatedDirections:coneValidate}=
 require('../../workbench/cone-open-ray-v5-mapping.cjs');
const P=(x,y,z)=>({x,y,z});
test('M0 the sole V/H/W observers agree with orthographic nullspaces and cone legacy rays',()=>{
 assert.equal(DIRS,coneDirs,'old cone consumer must reuse exact same ray constants');
 assert.deepEqual([...VIEWS],['V','H','W']);
 assert.deepEqual(DIRS,{
  V:P(0,-1,0),H:P(0,0,1),W:P(1,0,0)
 });
 for(const view of VIEWS){
  assert.deepEqual(project(DIRS[view])[view],{u:0,v:0},
   'observer ray may not cause motion inside its named projection plane');
  assert.equal(Object.isFrozen(DIRS[view]),true);
 }
 assert.equal(Object.isFrozen(DIRS),true);
});
test('M0 correct positive scale per view is permitted, directions normalized and immutable',()=>{
 const scaled={V:P(0,-5,0),H:P(0,0,40),W:P(2,0,0)};
 const result=validate(scaled);
 assert.deepEqual(result,DIRS);
 assert.deepEqual(coneValidate(scaled),DIRS);
 assert.equal(Object.isFrozen(result),true);
 assert.ok(VIEWS.every(v=>Object.isFrozen(result[v])));
 assert.deepEqual(scaled,{V:P(0,-5,0),H:P(0,0,40),W:P(2,0,0)});
});
test('M0 reversed, rotated, incomplete and malformed named rays fail closed',()=>{
 const correct={V:P(0,-1,0),H:P(0,0,1),W:P(1,0,0)};
 const invalid=[
  {...correct,V:P(0,1,0)},
  {...correct,H:P(0,0,-1)},
  {...correct,W:P(-1,0,0)},
  {...correct,V:P(.001,-1,0)},
  {...correct,H:P(0,1,1)},
  {...correct,W:P(0,0,0)},
  {...correct,H:P(Infinity,0,0)},
  {...correct,V:P(NaN,-1,0)},
  {V:correct.V,H:correct.H},
  {...correct,extra:P(1,0,0)}
 ];
 for(const directions of invalid){
  assert.throws(()=>validate(directions),/observer ray|first-angle/);
  assert.throws(()=>coneValidate(directions),/observer ray|first-angle/);
 }
});
