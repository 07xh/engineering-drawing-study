'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {coneCertifiedDisplaySegments:run}=require('../../workbench/cone-certified-display-segments.cjs');
const cone={baseCenter:{x:0,y:0,z:0},radiusMm:5,heightMm:10,modelUnit:'mm'};
const sheetTransform={origin:{x:340,y:240},scale:6};
const plane=z=>({point:{x:0,y:0,z},normal:{x:1,y:0,z:3},modelUnit:'mm'});
for(const [kind,z] of [['full-ellipse',6],['clipped-ellipse',1]]){
 test(kind+' conic screen chord deviation has conservative analytic upper bound',()=>{
  const r=run(cone,plane(z),{kind,sourceConfirmed:true,revision:92,sheetTransform,maxErrorPx:0.25});
  assert.equal(r.status,'bounded-display-approximation');
  assert.equal(r.mathematicallyExactPolyline,false);
  assert.equal(r.exactAnalyticCurvePreserved,true);
  for(const view of ['V','H','W']){
   assert.ok(r.views[view].length);
   assert.ok(r.views[view].every(s=>s.maxChordDeviationPx<=0.25+1e-10&&
    s.maxChordDeviationPx>=0&&s.visualPolylineOnly));
  }
 });
}
test('smaller tolerance never increases maximum chord bound',()=>{
 const o={kind:'full-ellipse',sourceConfirmed:true,revision:93,sheetTransform};
 const loose=run(cone,plane(6),{...o,maxErrorPx:1});
 const tight=run(cone,plane(6),{...o,maxErrorPx:0.1});
 for(const v of ['V','H','W']){
  assert.ok(tight.views[v][0].maxChordDeviationPx<=0.1);
  assert.ok(loose.views[v][0].maxChordDeviationPx<=1);
 }
});
test('unconfirmed input remains blocked',()=>{
 assert.equal(run(cone,plane(1),{sourceConfirmed:false,sheetTransform}).status,'not-verified');
});
