'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {curvePaths}=require('../../workbench/v51-curve-paths.cjs');
const a=(id,x,v='visible')=>({id:'cone_V_lateral_'+id,kind:'line',sourceBoundary:'analytic-cone-lateral',sourceRevision:3,sourceSpatialIntentId:'cone',visibility:v,geometry:{from:{x,y:0},to:{x:x+1,y:0}}});
test('continuous paths preserve source identities, seek and visibility boundaries',()=>{
 const steps=[{id:'step',actions:[a(1,0),a(2,1),a(3,2,'hidden')]}];
 const frame={actionFractions:{cone_V_lateral_1:1,cone_V_lateral_2:.5,cone_V_lateral_3:0}};
 const p=curvePaths(steps,frame);assert.equal(p.length,1);assert.equal(p[0].d,'M 0 0 L 1 0 L 1.5 0');assert.equal(p[0].visibility,'undetermined');assert.equal(p[0].actionIds.length,2);
 const full={actionFractions:{cone_V_lateral_1:1,cone_V_lateral_2:1,cone_V_lateral_3:1}};
 assert.equal(curvePaths(steps,full).length,2);assert.deepEqual(curvePaths(steps,frame),p);
 assert.equal(curvePaths(steps,{actionFractions:{}}).length,0);
});

test('shared endpoints do not join across branch or explicit discontinuity',()=>{
 const first=a(1,0),second=a(2,1);first.branchId='a';second.branchId='b';
 const frame={actionFractions:{cone_V_lateral_1:1,cone_V_lateral_2:1}};
 assert.equal(curvePaths([{id:'s',actions:[first,second]}],frame).length,2);
 second.branchId='a';second.breakBefore=true;
 assert.equal(curvePaths([{id:'s',actions:[first,second]}],frame).length,2);
});
