'use strict';
const assert=require('node:assert/strict');
const audit=require('../knowledge/textbook-page-audit.js');
const scale=require('../knowledge/six-layer-course.js').forEntry('ch01-drawing-scale');
assert.equal(audit.summary().detailedInspected,8);
for(let p=7;p<=14;p++){
 const x=audit.get(p);
 assert(x.detailedInspected);
 assert(!x.fullyPageReviewed);
 assert.equal(x.detailedInspection.printedPage,p-6);
}
assert(scale.verified);
assert.match(scale.levels[2].text,/10、20、40/);
assert.equal(scale.levels[3].examples.length,0);
console.log('PASS eight source-page inventories and original six-layer scale lesson');
