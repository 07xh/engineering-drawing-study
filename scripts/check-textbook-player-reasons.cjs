'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),examples=require('../knowledge/textbook-examples.js');
const html=fs.readFileSync('knowledge/drawing-player.html','utf8'),ui=fs.readFileSync('knowledge/drawing-player-ui.js','utf8');
assert(html.includes('viewBox="0 0 820 440"'));
for(const id of ['why','freedom','stageCheck']){assert(html.includes('id="'+id+'"'));assert(ui.includes("'"+id+"'"))}
for(const example of examples.all){assert.equal(example.order.length,example.why.length);assert.equal(example.order.length,example.freedom.length);assert.equal(example.order.length,example.stageChecks.length)}
assert(ui.includes('currentExample.why[index]')&&ui.includes('currentExample.freedom[index]'));
console.log('PASS: textbook player viewport and step reasoning are wired to reviewed examples');
