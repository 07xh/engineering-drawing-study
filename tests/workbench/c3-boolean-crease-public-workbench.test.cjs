'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {auditC3LocalBooleanCreases}=
 require('../../workbench/c3-local-boolean-crease.cjs');
const model=()=>({kind:'finite-orthogonal-cylinder-intersection',
 sourceConfirmed:true,unit:'mm',
 zCylinder:{radius:12,xCenter:0,yCenter:0,zMin:-18,zMax:18},
 yCylinder:{radius:9,xCenter:2,zCenter:0,yMin:-17,yMax:17}});
test('real reviewed finite-C3 page explicitly selects Boolean solid operation and invalidates old V5',()=>{
 const page=fs.readFileSync('labs/finite-cylinder-intersection-live.html','utf8');
 const js=fs.readFileSync('labs/finite-cylinder-intersection-live-entry.cjs','utf8');
 assert.match(page,/id="solidOperation"/);
 assert.match(page,/<option value="" selected>/);
 assert.match(page,/<option value="intersection">/);
 assert.match(page,/<option value="union">/);
 assert.match(page,/完整工程图/);
 assert.match(js,/auditC3LocalBooleanCreases\(\{input,revision,solidOperation\}\)/);
 assert.match(js,/\$\('solidOperation'\)\.value\|\|null/);
 assert.match(js,/\$\('solidOperation'\)\.addEventListener\('change'/);
 assert.match(js,/目标实体运算变化：旧数学保留关系和 V5 已作废/);
 assert.match(js,/regularLocalCreaseCount/);
 assert.match(js,/sourceEdgeCount/);
 assert.doesNotMatch(js,/standardVisibleHiddenLineStylesVerified\s*:\s*true/);
});
test('changing operation cannot transform source auxiliary 3-view V5 into certified engineering strokes',()=>{
 const input=model();
 for(const solidOperation of [null,'union','intersection']){
  const proof=auditC3LocalBooleanCreases({input,revision:3,solidOperation});
  assert.equal(proof.officialLineStylesVerified,false);
  assert.equal(proof.finalV5CurveAuthorized,false);
  assert.equal(proof.globalRetainedBoundaryComplete,false);
  if(solidOperation===null){
   assert.equal(proof.regularLocalCreaseCount,0);
   assert.equal(proof.status,'requires-explicit-solid-operation');
  }else{
   assert.ok(proof.regularLocalCreaseCount>0);
   assert.equal(proof.status,'scoped-all-source-open-edges-locally-retained');
  }
 }
});
