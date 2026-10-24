'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {compileConfirmedTwoPoint}=require('../../workbench/confirmed-two-point-v5.cjs');
const {solveProjection}=require('../../engines/projection/point-projection.cjs');
const {project}=require('../../core/projection/conventions.js');

const sheetTransform={origin:{x:360,y:210},scale:3};
const original=[{id:'A',x:15,y:27,z:30},{id:'B',x:30,y:0,z:23}];
const input=(points)=>({confirmedBy:'user',revision:8,unit:'mm',sheetTransform,points});
const pair=(views)=>original.map(({id,x,y,z})=>{
 const projected=project({x,y,z});
 return {id,knownViews:Object.fromEntries([...views].map(v=>[v,[projected[v].u,projected[v].v]]))};
});
for(const views of ['VH','VW','HW']){
 test('C1 '+views+' two human-corresponded first-angle points feed SAME canonical V5',()=>{
  const g=input(pair(views));
  const output=compileConfirmedTwoPoint(g);
  assert.equal(output.canonicalVerified,true);
  assert.equal(output.player.canRender(8),true);
  assert.equal(output.points.length,2);
  assert.ok(output.steps.length>=6);
  assert.ok(output.timeline.segments.length>0);
  assert.equal(new Set(output.steps.map(s=>s.id)).size,output.steps.length);
  for(let i=0;i<2;i++){
   const solved=solveProjection({knownViews:g.points[i].knownViews,sheetTransform});
   assert.equal(solved.status,'unique');
   assert.equal(solved.globallyUnique,true);
   assert.deepEqual(solved.point,
    {x:original[i].x,y:original[i].y,z:original[i].z});
   assert.equal(output.points[i].result.canonicalVerified,true);
  }
  output.player.invalidate(9,0);
  assert.equal(output.player.canRender(8),false);
 });
}
test('C1 inconsistent shared coordinate and insufficient views fail closed before V5',()=>{
 const p=pair('VH');p[0].knownViews.H[0]+=1;
 assert.throws(()=>compileConfirmedTwoPoint(input(p)),/canonical|ready|projection|timeline/i);
 const one=pair('VH');delete one[1].knownViews.H;
 assert.throws(()=>compileConfirmedTwoPoint(input(one)),/two finite reviewed/);
 const noUser=input(pair('VW'));noUser.confirmedBy=null;
 assert.throws(()=>compileConfirmedTwoPoint(noUser),/confirmation|user/i);
});
test('C1 no extra geometry, pixels, fake evidence or three-view promotion',()=>{
 const p=pair('HW');p[0].z=30;
 assert.throws(()=>compileConfirmedTwoPoint(input(p)),/mix with guessed/);
 const q=pair('HW');q[1].knownViews.W[0]=NaN;
 assert.throws(()=>compileConfirmedTwoPoint(input(q)),/finite reviewed/);
 const r=pair('VH');r[0].knownViews.V=[15,30,5];
 assert.throws(()=>compileConfirmedTwoPoint(input(r)),/finite reviewed/);
 const old=input(original.map(p=>({...p})));
 assert.equal(compileConfirmedTwoPoint(old).canonicalVerified,true);
});
test('C1 page exposes all three view pairs and source edits revoke old V5',()=>{
 const html=fs.readFileSync('labs/two-point-v5-live.html','utf8');
 const entry=fs.readFileSync('labs/two-point-v5-live-entry.cjs','utf8');
 for(const mode of ['XYZ','VH','VW','HW'])assert.match(html,new RegExp('value="'+mode+'"'));
 for(const id of ['knownMode','knownViewsInputs','a-xyz','b-xyz',
  ...['a','b'].flatMap(p=>['V','H','W'].flatMap(v=>[p+v+'u',p+v+'v']))]){
  assert.ok(html.includes('id="'+id+'"'),id);
 }
 assert.match(entry,/compileConfirmedTwoPoint/);
 assert.match(entry,/function invalidateSource/);
 assert.match(entry,/revision\+\+;clear\(\);\$\('confirmed'\)\.checked=false/);
 assert.match(entry,/knownViews:Object\.fromEntries/);
 assert.match(html,/不是照片像素/);
});
