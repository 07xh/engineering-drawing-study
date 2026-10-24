'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {compileFiniteCylinderEndpointV5:compile}=
 require('../../workbench/finite-cylinder-intersection-endpoint-v5.cjs');
const {toSheet}=require('../../core/projection/conventions.js');
const input=()=>({kind:'finite-orthogonal-cylinder-intersection',
 sourceConfirmed:true,unit:'mm',
 zCylinder:{radius:12,xCenter:0,yCenter:0,zMin:-18,zMax:18},
 yCylinder:{radius:9,xCenter:2,zCenter:0,yMin:-17,yMax:17}});
const frames=()=>({
 V:{origin:{x:310,y:265},scale:4},
 H:{origin:{x:310,y:410},scale:4},
 W:{origin:{x:655,y:265},scale:4}
});
test('actual public C3 page exposes reviewed geometry, first-angle math and one V5 control',()=>{
 const html=fs.readFileSync('labs/finite-cylinder-intersection-live.html','utf8');
 for(const id of ['board','zRadius','zX','zY','zMin','zMax',
  'yRadius','yX','yZ','yMin','yMax','stations','confirmed','solve',
  'play','pause','prev','next','speed','status','proof']){
  assert.ok(html.includes('id="'+id+'"'),id);
 }
 assert.match(html,/<button[^>]*id="play"[^>]*disabled/);
 assert.match(html,/没有获得正式工程实虚线资格/);
 assert.match(html,/紫色点划曲线/);
 assert.match(html,/第一角法/);
 assert.match(html,/finite-cylinder-intersection-live-bundle\.js/);
 assert.doesNotMatch(html,/https?:\/\/[^"' ]+\.js/);
 const build=fs.readFileSync('scripts/build-static.cjs','utf8');
 assert.ok(build.includes("'labs/finite-cylinder-intersection-live.html'"));
 assert.ok(build.includes("labs/finite-cylinder-intersection-live-entry.cjs"));
 assert.ok(build.includes("labs/finite-cylinder-intersection-live-bundle.js"));
 const home=require('../../ui-next/home.cjs').homeHTML();
 assert.ok(home.includes('labs/finite-cylinder-intersection-live.html'));
});
test('C3 view transforms produce real separated first-angle V/H/W action coordinates',()=>{
 const f=frames(),r=compile({input:input(),revision:10,
  sheetTransform:f.V,viewTransforms:f,stationCountPerBranch:2});
 assert.equal(r.singleOriginalV5Player,true);
 assert.equal(r.entireCurveV5Ready,false);
 assert.equal(r.standardVisibleHiddenLineStylesVerified,false);
 const grouped=new Map();
 for(const b of r.bindings){
  const key=b.branchId+'/'+b.endpointRole+'/'+b.sourceBranchParameterX;
  if(!grouped.has(key))grouped.set(key,{});
  grouped.get(key)[b.view]=b;
  assert.deepEqual(b.sheetPoint,toSheet(b.view,b.projectedMm,f[b.view]));
 }
 assert.ok(grouped.size>0);
 for(const g of grouped.values()){
  assert.ok(g.V&&g.H&&g.W);
  assert.equal(g.V.projectedMm.u,g.H.projectedMm.u);
  assert.equal(g.V.projectedMm.v,g.W.projectedMm.v);
  assert.equal(g.H.projectedMm.v,g.W.projectedMm.u);
  // V and H retain the SAME x-axis position, and V/W retain one height.
  assert.equal(g.V.sheetPoint.x,g.H.sheetPoint.x);
  assert.equal(g.V.sheetPoint.y,g.W.sheetPoint.y);
 }
 assert.ok(r.bindings.every(b=>b.standardLineStyleVerified===false));
 assert.ok(r.player.canRender(10));
});
test('three-view paper transforms reject missing view, wrong unit or empty geometry',()=>{
 const f=frames();delete f.H;
 assert.throws(()=>compile({input:input(),revision:1,
  sheetTransform:frames().V,viewTransforms:f,
  stationCountPerBranch:1}),/three bounded first-angle/);
 const bad=frames();bad.H.scale=-2;
 assert.throws(()=>compile({input:input(),revision:1,
  sheetTransform:frames().V,viewTransforms:bad,
  stationCountPerBranch:1}),/three bounded first-angle/);
 const empty=input();empty.zCylinder.zMin=40;empty.zCylinder.zMax=55;
 assert.throws(()=>compile({input:empty,revision:1,
  sheetTransform:frames().V,viewTransforms:frames(),
  stationCountPerBranch:1}),/proof unavailable/);
});
test('public C3 frontend retains local-only source-confirmation and stale-V5 invalidation',()=>{
 const source=fs.readFileSync('labs/finite-cylinder-intersection-live-entry.cjs','utf8');
 assert.match(source,/sourceConfirmed:true/);
 assert.match(source,/compileFiniteCylinderEndpointV5/);
 assert.match(source,/Motion\.updateSvg/);
 assert.match(source,/current\.player\.invalidate\(revision\+1/);
 assert.match(source,/\$\('confirmed'\)\.checked/);
 assert.match(source,/data-standard-line-style/);
 assert.match(source,/data-official-v5/);
 assert.doesNotMatch(source,/fetch\(|XMLHttpRequest|localStorage|sendBeacon/);
});
