'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {coneSpatialV5Preview:run}=require('../../workbench/cone-spatial-v5-preview.cjs');
const {curvePaths}=require('../../workbench/v51-curve-paths.cjs');
const cone={baseCenter:{x:0,y:0,z:0},radiusMm:5,heightMm:10,modelUnit:'mm'};
test('live preview retains analytic chord-error bounds without visibility promotion',()=>{
 for(const samples of [32,64,128,256]){
 const p=run(cone,{point:{x:0,y:0,z:6},normal:{x:1,y:0,z:3},modelUnit:'mm'},{sourceConfirmed:true,revision:4,samples,presentationMode:'split-sheet'});
 const frame=p.player.seekProgress(1,0),paths=curvePaths(p.steps,frame);
 assert.ok(paths.length);
 for(const path of paths){assert.ok(Number.isFinite(path.maxChordDeviationPx));assert.ok(path.maxChordDeviationPx>0);assert.equal(path.visibility,'undetermined');}
 }
});
