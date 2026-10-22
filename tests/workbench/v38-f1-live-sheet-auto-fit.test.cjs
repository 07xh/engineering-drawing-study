'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {fitVerifiedDrawingView:fit}=
 require('../../workbench/verified-fillet-view-fit.cjs');
const {confirmedFilletTimeline:solve}=
 require('../../workbench/v31-confirmed-fillet-v5.cjs');
const P=(x,y)=>({x,y});
const segment=(a,b,c,d)=>({a:P(a,b),b:P(c,d)});
const base=()=>({problem:{kind:'two-segments',unit:'mm',revision:2,filletRadius:3,
 geometry:{first:segment(-10,0,10,0),second:segment(0,-10,0,10)}},
 selection:{branchId:'s++',direction:'ccw',firstTravel:'forward',secondTravel:'forward'},
 sheet:{origin:P(360,220),scale:5}});
function encloses(f){
 const {x,y,width,height}=f.camera,b=f.bounds;
 return b.minX>=x-1e-9&&b.maxX<=x+width+1e-9&&
  b.minY>=y-1e-9&&b.maxY<=y+height+1e-9;
}
test('F1 live camera encloses every current given and verified V5 action without modifying solver output',()=>{
 const input=base(),proof=solve(input);
 assert.equal(proof.status,'ready');
 const old=JSON.stringify(proof);
 const fitted=fit({problem:input.problem,sheet:input.sheet,steps:proof.steps});
 assert.ok(encloses(fitted));
 assert.equal(fitted.camera.width/fitted.camera.height,720/440);
 assert.equal(JSON.stringify(proof),old);
 assert.deepEqual(fitted.viewBox.split(' ').map(Number),
  [fitted.camera.x,fitted.camera.y,fitted.camera.width,fitted.camera.height]);
});
test('large circle outside fixed canvas is still inside auto-fit view',()=>{
 const input={problem:{kind:'two-circles',unit:'mm',geometry:{
  first:{center:P(-200,20),radius:30},
  second:{center:P(200,-15),radius:70}}},
  sheet:{origin:P(360,220),scale:5}};
 const view=fit({...input,steps:[]});
 assert.ok(encloses(view));
 assert.ok(view.camera.width>720);
 assert.ok(view.bounds.minX<0);
 assert.ok(view.bounds.maxX>720);
});
test('changing radius, sheet scale or origin produces a new camera but cannot alter math',()=>{
 const one=base();
 const r=solve(one);
 const a=fit({problem:one.problem,sheet:one.sheet,steps:r.steps});
 const second=base();
 second.problem.filletRadius=4;
 second.problem.revision=3;
 const newResult=solve(second);
 assert.equal(newResult.status,'ready');
 const b=fit({problem:second.problem,sheet:second.sheet,steps:newResult.steps});
 assert.notDeepEqual(newResult.typedMathEvidence.center,r.typedMathEvidence.center);
 assert.ok(encloses(b));
 second.sheet={origin:P(120,100),scale:12};
 const rescaled=solve(second);
 assert.equal(rescaled.status,'ready');
 const c=fit({problem:second.problem,sheet:second.sheet,steps:rescaled.steps});
 assert.ok(encloses(c));
 assert.notDeepEqual(c.viewBox,a.viewBox);
});
test('camera refuses image-px input, malformed primitives and invalid transforms',()=>{
 const input=base();
 for(const problem of [
  {...input.problem,unit:'px'},
  {...input.problem,kind:'unknown'},
  {...input.problem,geometry:{first:null}},
 ]){
  assert.throws(()=>fit({problem,sheet:input.sheet,steps:[]}));
 }
 assert.throws(()=>fit({problem:input.problem,sheet:{origin:P(0,0),scale:0}}));
 assert.throws(()=>fit({problem:input.problem,sheet:input.sheet,steps:[
  {actions:[{kind:'arc',geometry:{center:P(1,2),radius:Infinity}}]}]}));
 assert.throws(()=>fit({problem:input.problem,sheet:input.sheet,steps:[
  {actions:[{kind:'unverified-svg',geometry:{}}]}]}));
});
test('real browser entry toggles only the SVG camera and retains revision / proof gates',()=>{
 const html=fs.readFileSync('labs/auto-fillet-live.html','utf8');
 const entry=fs.readFileSync('labs/auto-fillet-live-entry.cjs','utf8');
 assert.match(html,/id="autoFit" type="checkbox" checked/);
 assert.match(entry,/fitVerifiedDrawingView/);
 assert.match(entry,/steps:verified\?result\.steps:\[\]/);
 assert.match(entry,/confirmed\.problem\?\.revision===snap\.revision/);
 assert.match(entry,/session\.canRender\(snap\.revision\)/);
 assert.match(entry,/\$\('paper'\)\.setAttribute\('viewBox',nextView\)/);
});
