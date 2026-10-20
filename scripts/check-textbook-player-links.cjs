'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),examples=require('../knowledge/textbook-examples.js');
const html=fs.readFileSync('knowledge/index.html','utf8'),ui=fs.readFileSync('knowledge/textbook-example-ui.js','utf8');
assert(html.includes('id="bookExampleSharedPlayer"'));
assert(ui.includes('drawing-player.html?example='));
assert(ui.includes('encodeURIComponent(example.id)'));
assert(ui.includes('sharedLink.hidden=!example'));
assert(examples.all.every(e=>/^example-/.test(e.id)));
console.log('PASS: verified textbook example deep links are contextual and hidden without a source example');
