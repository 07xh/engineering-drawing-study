'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../knowledge/drawing-player.html'),'utf8');
const ui=fs.readFileSync(path.join(__dirname,'../knowledge/drawing-player-ui.js'),'utf8');
for(const id of ['computedDof','computedDofValue','computedDofLabel','mathVerification','localDofVerification'])assert.ok(html.includes('id="'+id+'"'));
assert.match(html,/id="computedDof" hidden/);assert.match(html,/<details aria-label="数学约束核验结果">/);
assert.match(ui,/dofBadge.hidden=true/);assert.match(ui,/dofBadge.hidden=false/);
assert.match(ui,/String\(summary.currentDegrees\)/);
console.log('PASS: local DOF emphasis is hidden when no verified computation is available');
