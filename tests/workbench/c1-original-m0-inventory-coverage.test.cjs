'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {auditC1OriginalM0InventoryCoverage:audit}=
 require('../../workbench/c1-original-m0-inventory-coverage.cjs');
const input=intervals=>({
 projectedOriginalSourcesByView:{V:new Set(['scene::A|B']),H:new Set(),W:new Set()},
 canonicalM5RowsByView:{V:intervals.map(range=>({view:'V',sourceEdgeId:'scene::A|B',
  originalParameterRange:range})),H:[],W:[]}
});
const row=intervals=>audit(input(intervals)).rows[0];
test('whole original source is represented by one complete canonical M5 span',()=>{
 const r=audit(input([[0,1]]));
 assert.equal(r.allNoncollapsedOriginalM0SourceParametersRepresentedExactlyOnce,true);
 assert.equal(r.counts.sourceViewsWithCompleteCanonicalM5ParameterInventory,1);
 assert.equal(r.rows[0].wholeOriginalM0SourceParameterInventoryComplete,true);
 assert.equal(r.officialV5Authorized,false);
});
test('M5 source present with a partial [0,1] span does not hide the missing tail',()=>{
 const r=row([[0,0.5]]);
 assert.equal(r.canonicalM5SourceSpanCount,1);
 assert.deepEqual(r.positiveLengthUnrepresentedM5ParameterIntervals,[[0.5,1]]);
 assert.equal(r.wholeOriginalM0SourceParameterInventoryComplete,false);
});
test('one-ULP gap between two otherwise covered M5 rows is positive',()=>{
 const next=0.5000000000000001;
 const r=row([[next,1],[0,0.5]]);
 assert.deepEqual(r.positiveLengthUnrepresentedM5ParameterIntervals,[[0.5,next]]);
 assert.deepEqual(r.positiveLengthOverlappingM5ParameterIntervals,[]);
 assert.equal(r.wholeOriginalM0SourceParameterInventoryComplete,false);
});
test('overlapping M5 spans do not count as exactly-once original M0 coverage',()=>{
 const r=row([[0.5,1],[0,0.75]]);
 assert.deepEqual(r.positiveLengthUnrepresentedM5ParameterIntervals,[]);
 assert.deepEqual(r.positiveLengthOverlappingM5ParameterIntervals,[[0.5,0.75]]);
 assert.equal(r.wholeOriginalM0SourceParameterInventoryComplete,false);
});
test('touching partition endpoints are not positive overlaps',()=>{
 const r=row([[0.5,1],[0,0.5]]);
 assert.deepEqual(r.positiveLengthUnrepresentedM5ParameterIntervals,[]);
 assert.deepEqual(r.positiveLengthOverlappingM5ParameterIntervals,[]);
 assert.equal(r.wholeOriginalM0SourceParameterInventoryComplete,true);
});
test('unbound source row and absent row are separate unsigned obligations',()=>{
 const absent=audit(input([]));
 assert.equal(absent.counts.sourceViewsWithNoM5Rows,1);
 assert.deepEqual(absent.rows[0].positiveLengthUnrepresentedM5ParameterIntervals,[[0,1]]);
 const unbound=row([null]);
 assert.equal(unbound.canonicalM5UnboundSourceSpanCount,1);
 assert.equal(unbound.wholeOriginalM0SourceParameterInventoryComplete,false);
 assert.equal(unbound.signedV5Action,false);
});
test('invalid original source parameter ranges fail closed',()=>{
 for(const intervals of [[[0,1.1]],[[0,0]],[[NaN,1]],[[-0.1,1]]])
  assert.throws(()=>row(intervals),/verified finite native CAD source interval/);
});
test('diagnostic result and intervals cannot be mutated into V5 authority',()=>{
 const r=audit(input([[0,1]]));
 assert.ok(Object.isFrozen(r));
 assert.ok(Object.isFrozen(r.rows[0].canonicalM5OriginalSourceParameterRanges[0]));
 assert.throws(()=>{r.rows[0].signedV5Action=true;},TypeError);
 assert.equal(r.originalTopoDSHistoryCertified,false);
});
