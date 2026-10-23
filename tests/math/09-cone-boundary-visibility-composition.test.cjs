'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {coneBoundaryVisibilityComposition:run}=require('../../workbench/cone-boundary-visibility-composition.cjs');
const cone={baseCenter:{x:0,y:0,z:0},radiusMm:5,heightMm:10,modelUnit:'mm'};
const sheetTransform={origin:{x:340,y:240},scale:6};
const plane=z=>({point:{x:0,y:0,z},normal:{x:1,y:0,z:3},modelUnit:'mm'});
for(const [kind,z] of [['full-ellipse',6],['clipped-ellipse',1]]){
 test(kind+' composes verified oriented contour without inventing cap visibility',()=>{
  const r=run(cone,plane(z),{kind,sourceConfirmed:true,revision:31,sheetTransform});
  assert.equal(r.status,'verified-boundary-composition');
  assert.equal(r.lateralIntervalsVerified,true);
  assert.equal(r.orientedBoundaryClosureVerified,true);
  assert.equal(r.completeSolidVisibilityVerified,false);
  for(const view of ['V','H','W']){
   const arc=r.views[view].filter(s=>s.kind==='analytic-lateral-arc');
   assert.ok(arc.length>0);
   if(kind==='clipped-ellipse'){
    const chord=r.views[view].filter(s=>s.kind==='cap-chord');
    assert.equal(chord.length,1);
    assert.equal(chord[0].visibility,'undetermined');
   }else assert.equal(r.views[view].filter(s=>s.kind==='cap-chord').length,0);
  }
 });
}
test('unconfirmed geometry is rejected',()=>{
 const r=run(cone,plane(6),{sourceConfirmed:false,sheetTransform});
 assert.equal(r.status,'not-verified');
 assert.equal(r.views,null);
});
