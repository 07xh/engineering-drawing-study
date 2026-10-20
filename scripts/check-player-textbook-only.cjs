'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const html=fs.readFileSync('knowledge/drawing-player.html','utf8');
const ui=fs.readFileSync('knowledge/drawing-player-ui.js','utf8');
assert(!html.includes('原创播放器演示'));
assert(!html.includes('value="demo"'));
assert(!html.includes('src="drawing-player-demo.js"'));
assert(!ui.includes('window.DrawingPlayerDemo'));
assert(ui.includes("if(!example)throw Error('找不到经过核验的教材例题')"));
for(const id of ['example-1-1','example-2-2'])assert(html.includes('value="'+id+'"'));
assert(fs.existsSync('knowledge/drawing-player-demo.js')); // internal test fixture is retained.
console.log('PASS: learner player shows only verified textbook examples');
