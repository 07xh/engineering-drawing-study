'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {KNOWN,textbookBlindAcceptanceGate:gate}=require('../fixtures/real-textbook-blind-acceptance-gate.cjs');
test('all three real DWG hashes registered without publishing source bytes',()=>{
 assert.deepEqual(Object.keys(KNOWN).sort(),['3-12','3-13','3-9']);
 for(const hash of Object.values(KNOWN))assert.match(hash,/^[a-f0-9]{64}$/);
});
test('unavailable, mismatched and unreviewed DWG cannot pass',()=>{
 assert.equal(gate('3-12',null).accepted,false);
 assert.equal(gate('3-12',Buffer.from('synthetic DWG')).status,'source-hash-mismatch');
 assert.equal(gate('unknown',Buffer.from('anything')).status,'unsupported-sample');
});
test('private source hash alone never counts as a solved textbook problem',()=>{
 const id='3-13';
 assert.equal(gate(id,null,{mathResidualsChecked:true,singleV5PlaybackChecked:true}).accepted,false);
});
