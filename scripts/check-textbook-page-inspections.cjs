'use strict';
const assert=require('node:assert/strict');
const audit=require('../knowledge/textbook-page-audit.js');
const scale=require('../knowledge/six-layer-course.js').forEntry('ch01-drawing-scale');
assert.equal(audit.summary().detailedInspected,24);
for(let p=7;p<=30;p++){
 const x=audit.get(p);
 assert(x.detailedInspected);
 assert(!x.fullyPageReviewed);
 assert.equal(x.detailedInspection.printedPage,p-6);
}
assert(scale.verified);
assert.match(scale.levels[2].text,/10、20、40/);
assert.equal(scale.levels[3].examples.length,0);
const fs=require('node:fs');
const html=fs.readFileSync('knowledge/page-audit.html','utf8');
assert(html.indexOf('src="textbook-page-inspections.js"')<html.indexOf('src="textbook-page-audit.js"'));
assert(html.includes('id="auditDetailed"'));
const motion=require('../knowledge/textbook-concept-motion.js');
assert.equal(motion.definition('ch01-drawing-scale').page,12);
assert.equal(motion.frame('ch01-drawing-scale',3).shapes.filter(x=>x.type==='text'&&x.label==='20 mm').length,3);
console.log('PASS twenty-four source-page inventories and original six-layer scale lesson');
