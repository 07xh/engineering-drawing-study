'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../knowledge/drawing-player.html'),'utf8');
assert.match(html,/class="lesson-layout"/);assert.match(html,/class="lesson-explanation"/);
assert.match(html,/@media\(max-width:720px\)/);
assert.ok(html.indexOf('id="drawingBoard"')<html.indexOf('class="lesson-explanation"'));
for(const id of ['reason','why','freedom','stageCheck','mathVerification','localDofVerification'])assert.ok(html.includes('id="'+id+'"'));
assert.match(html,/max-height:560px;overflow:auto/);
console.log('PASS: responsive side explanations preserve every existing player output');
