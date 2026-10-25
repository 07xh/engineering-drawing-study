'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {intervalCoverage,positiveCollinearOverlap}=
 require('../../workbench/c1-ocjs-reviewed-solid-v5.cjs');
const p=(u,v)=>({u,v});
test('C1 generic source-bound segment coverage joins real CAD split fragments without inventing a gap',()=>{
 const a=p(2,3),b=p(12,3);
 assert.equal(intervalCoverage(a,b,[
  {from:p(2,3),to:p(7,3)}, {from:p(7,3),to:p(12,3)}]),true);
 assert.equal(intervalCoverage(a,b,[
  {from:p(2,3),to:p(6,3)}, {from:p(7,3),to:p(12,3)}]),false);
 assert.equal(intervalCoverage(a,b,[
  {from:p(2,3),to:p(7,3.001)}, {from:p(7,3),to:p(12,3)}]),false);
});
test('non-contour CAD feature is never promoted by 2D nearby/point-only coincidence',()=>{
 const a=p(0,0),b=p(10,0);
 assert.equal(positiveCollinearOverlap(a,b,p(4,2),p(6,2)),false);
 assert.equal(positiveCollinearOverlap(a,b,p(10,0),p(12,0)),false);
 assert.equal(positiveCollinearOverlap(a,b,p(9,0),p(12,0)),true);
 assert.equal(positiveCollinearOverlap(a,b,p(6,0),p(1,0)),true);
 assert.equal(positiveCollinearOverlap(a,b,p(6,0.01),p(1,0.01)),false);
});
