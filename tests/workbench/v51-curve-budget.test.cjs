'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {coneSpatialV5Preview:run}=require('../../workbench/cone-spatial-v5-preview.cjs');
const cone={baseCenter:{x:0,y:0,z:0},radiusMm:5,heightMm:10,modelUnit:'mm'};
const plane={point:{x:0,y:0,z:6},normal:{x:1,y:0,z:3},modelUnit:'mm'};
test('curve playback budget is independent of source sampling density',()=>{
 const plans=[32,64,128,256].map(samples=>run(cone,plane,{sourceConfirmed:true,revision:1,samples,presentationMode:'split-sheet',provenGuideDag:true}));
 const totals=plans.map(p=>p.timing.totalMs);
 assert.ok(Math.max(...totals)/Math.min(...totals)<=1.1,JSON.stringify(totals));
 for(const p of plans)for(const view of ['V','H','W']){
 const segments=p.timing.segments.filter(a=>a.id.startsWith('cone_'+view+'_lateral_'));
 assert.ok(Math.abs(segments.reduce((sum,a)=>sum+a.durationMs,0)-6000)<1e-6);
 }
});
