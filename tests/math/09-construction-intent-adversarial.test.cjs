'use strict';
/**
 * 09 independent pre-freeze adversarial review of PR #394.
 * Deliberately tests the REAL parent contract, not a copied implementation.
 * Does not change 01 core or 02/03/07 consumers.
 */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {
  CONSTRUCTION_INTENT_VERSION,
  validateConstructionIntent:validate,
  validateConstructionIntentDAG:validateDAG
}=require('../../core/contracts/construction-intent.js');

const xy=(x,y)=>({x,y});
const source=(change={})=>({
  solver:'engines/planar/directed-two-segment-fillet',
  revision:5,unit:'mm',proofScope:'selected-directed-fillet',
  proofLevel:'selected-directed-g1',resultId:null,
  branchId:'s++',status:'selected',
  evidenceSource:'engines/planar/directed-two-segment-fillet',
  ...change
});
const line=(id='edge')=>({id,kind:'line',coordinateSpace:'model-mm',
  geometry:{from:xy(0,0),to:xy(10,0)}});
const intent=(change={})=>({
  schema:CONSTRUCTION_INTENT_VERSION,id:'step_1',
  purpose:'synthetic reviewed G1 geometry',role:'result',dependsOn:[],
  inputEntityIds:[],outputEntityIds:['edge'],operations:[line()],
  source:source(),...change
});

// A validator exposed across source boundaries must fail closed, *not throw*.
// Existing #394 validation records the bad operation but then re-reads .id
// unguarded during outputEntityIds parity checking.
test('09 adversarial: null operation fails closed without throwing',()=>{
  const broken=intent({operations:[null]});
  let verdict;
  assert.doesNotThrow(()=>{verdict=validate(broken);},
    'malformed operation must produce a validation verdict');
  assert.equal(verdict.ok,false);
});
test('09 adversarial: malformed DAG child fails closed without throwing',()=>{
  const broken=intent({operations:[null]});
  let verdict;
  assert.doesNotThrow(()=>{verdict=validateDAG([broken]);},
    'malformed DAG operation must never crash the validation gateway');
  assert.equal(verdict.ok,false);
});
test('09 regression: one valid intent and a genuinely dependent consumer pass',()=>{
  const parent=intent();
  const next=intent({id:'step_2',dependsOn:['step_1'],
    inputEntityIds:['edge'],outputEntityIds:['result'],
    operations:[{id:'result',kind:'point',coordinateSpace:'sheet-px',
      geometry:{at:xy(22,14)}}]});
  assert.equal(validateDAG([parent,next]).ok,true);
});
test('09 negative DAG: preceding sibling is not an ancestor',()=>{
  const parent=intent();
  const sibling=intent({id:'step_2',dependsOn:[],outputEntityIds:['other'],
    operations:[{id:'other',kind:'point',coordinateSpace:'sheet-px',
      geometry:{at:xy(22,14)}}]});
  const illicit=intent({id:'step_3',dependsOn:['step_2'],
    inputEntityIds:['edge'],outputEntityIds:['tail'],
    operations:[{id:'tail',kind:'point',coordinateSpace:'sheet-px',
      geometry:{at:xy(22,14)}}]});
  assert.equal(validateDAG([parent,sibling,illicit]).ok,false);
});
test('09 math boundary: finite point coords but overflowing span is rejected',()=>{
  const huge=line('edge');
  huge.geometry.from=xy(Number.MAX_VALUE,0);
  huge.geometry.to=xy(-Number.MAX_VALUE,0);
  assert.equal(validate(intent({operations:[huge]})).ok,false);
});
test('09 math boundary: directed arc sweep and hidden z dimension fail',()=>{
  const arc={id:'curve',kind:'directed-arc',coordinateSpace:'model-mm',
    geometry:{center:xy(0,0),radius:3,startAngle:20,
      endAngle:90,direction:'ccw'}};
  assert.equal(validate(intent({operations:[arc],outputEntityIds:['curve']})).ok,true);
  assert.equal(validate(intent({operations:[{
    ...arc,geometry:{...arc.geometry,direction:'cw'}
  }],outputEntityIds:['curve']})).ok,false);
  assert.equal(validate(intent({operations:[{
    ...arc,geometry:{...arc.geometry,center:{x:0,y:0,z:7}}
  }],outputEntityIds:['curve']})).ok,false);
});
test('09 source integrity: mixed revision, branch and proof scope reject DAG',()=>{
  const parent=intent();
  const second=intent({id:'step_2',dependsOn:['step_1'],
    outputEntityIds:['other'],operations:[line('other')]});
  for(const change of [{revision:6},{branchId:'s--'},{proofScope:'claim-unique'}]){
    const changed={...second,source:source(change)};
    assert.equal(validateDAG([parent,changed]).ok,false,JSON.stringify(change));
  }
});
test('09 proof boundary: structural validity is not a solver certificate',()=>{
  // The validator may accept a structurally plausible but unverified source.
  // A production consumer MUST re-run M3 and check independent residual/G1.
  const untrusted=intent({source:source({solver:'untrusted-client-text',
    evidenceSource:'untrusted-client-text'})});
  assert.equal(validate(untrusted).ok,true);
  assert.equal(validateDAG([untrusted]).ok,true);
});
