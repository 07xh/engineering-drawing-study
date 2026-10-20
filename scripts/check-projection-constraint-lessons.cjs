'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),lesson=require('../knowledge/projection-constraint-lessons.js');
for(let i=0;i<4;i++){const x=lesson.describe(i,[3,1,0,0][i]);assert(x.consistent);assert(x.text.length>20)}
assert(!lesson.describe(2,1).consistent);
assert.throws(()=>lesson.describe(4,0));
const html=fs.readFileSync('knowledge/index.html','utf8');
assert(html.includes('id="visualConstraintReason"'));
assert(html.indexOf('src="projection-constraint-lessons.js"')<html.indexOf('src="visual-ui.js"'));
console.log('PASS: four distinct coordinate-constraint explanations and load order');
