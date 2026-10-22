'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),http=require('node:http');
const {PUBLIC,PRIVATE,verifyV5,parseArgs}=
 require('../../workbench/verify-v5-production.cjs');
async function fixture(fn){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'draftai-v5-live-'));
 const resources=new Map(),overrides=new Map();
 for(const [i,route] of PUBLIC.entries()){
  const data=Buffer.from(route.endsWith('.html')?
   '<!doctype html><html><body>DOF V5 verified '+i+'</body></html>':
   '/* expected built V5 geometry bytes '+i+' */');
  resources.set('/'+route,data);
  const file=path.join(root,route);
  fs.mkdirSync(path.dirname(file),{recursive:true});
  fs.writeFileSync(file,data);
 }
 const server=http.createServer((req,res)=>{
  const override=overrides.get(req.url);
  if(override&&override.status!==undefined&&override.status!==200){
   res.writeHead(override.status,override.headers||{});res.end();return;
  }
  const bytes=override?.bytes??resources.get(req.url);
  if(bytes){
   res.writeHead(200,{'Content-Type':req.url.endsWith('.html')?'text/html':'application/javascript'});
   res.end(bytes);
  }else{res.writeHead(404);res.end('Not Found')}
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const url='http://127.0.0.1:'+server.address().port+'/';
 try{return await fn({root,url,resources,overrides})}
 finally{
  await new Promise(resolve=>server.close(resolve));
  fs.rmSync(root,{recursive:true,force:true});
 }
}
const check=ctx=>verifyV5({baseUrl:ctx.url,distDir:ctx.root,
 allowHttpLoopback:true,timeoutMs:1200});
test('V5 DOF: 9 deployed assets have exact bytes and six private sources stay private',async()=>{
 await fixture(async ctx=>{
  const r=await check(ctx);
  assert.equal(r.overall,'pass');
  assert.equal(r.checks.length,15);
  assert.equal(r.checks.filter(x=>x.kind==='public'&&x.status==='pass').length,9);
  assert.equal(r.checks.filter(x=>x.kind==='private'&&x.status==='pass').length,6);
  assert.equal(r.checks.filter(x=>x.localSha256).length,9);
  assert.match(r.note,/not Cloudflare Active Deployment/);
 });
});
test('V5 DOF: stale Three bundle is a definite FAIL even when homepage exists',async()=>{
 await fixture(async ctx=>{
  ctx.overrides.set('/labs/dof-lab-three-bundle.js',{bytes:Buffer.from('stale THREE.js V2')});
  const r=await check(ctx);
  assert.equal(r.overall,'fail');
  const item=r.checks.find(x=>x.route==='labs/dof-lab-three-bundle.js');
  assert.equal(item.status,'fail');
  assert.notEqual(item.localSha256,item.remoteSha256);
 });
});
test('V5 DOF: stale synchronized math-bearing UI script fails exact SHA proof',async()=>{
 await fixture(async ctx=>{
  ctx.overrides.set('/labs/dof-lab-v2-ui.js',{bytes:Buffer.from('old non-math controls')});
  const r=await check(ctx);
  assert.equal(r.overall,'fail');
  assert.equal(r.checks.find(x=>x.route==='labs/dof-lab-v2-ui.js').status,'fail');
 });
});
test('V5 DOF: private source exposed by soft-404 HTML HTTP 200 is FAIL',async()=>{
 await fixture(async ctx=>{
  ctx.overrides.set('/workbench/dof-synchronized-reveal.cjs',
   {bytes:Buffer.from('<!doctype html>Page Not Found')});
  const r=await check(ctx);
  assert.equal(r.overall,'fail');
  assert.match(r.checks.find(x=>x.route==='workbench/dof-synchronized-reveal.cjs').reason,
   /soft-404/);
 });
});
test('V5 DOF: missing local asset and offline network do not yield false PASS',async()=>{
 await fixture(async ctx=>{
  fs.rmSync(path.join(ctx.root,'labs/dof-lab-state.js'));
  const r=await check(ctx);
  assert.equal(r.overall,'unverified');
  const state=r.checks.find(x=>x.route==='labs/dof-lab-state.js');
  assert.equal(state.status,'unverified');
  assert.match(state.reason,/local/);
 });
 await fixture(async ctx=>{
  const r=await verifyV5({baseUrl:ctx.url,distDir:ctx.root,
   allowHttpLoopback:true,fetchImpl:async()=>{throw new Error('DNS offline')}});
  assert.equal(r.overall,'unverified');
  assert.equal(r.checks.every(x=>x.status==='unverified'),true);
 });
});
test('V5 DOF: unexpected upstream status and redirect never count as proof',async()=>{
 await fixture(async ctx=>{
  ctx.overrides.set('/labs/dof-lab-v2.html',{status:503});
  ctx.overrides.set('/tests/workbench/dof-sync-browser.test.cjs',
   {status:302,headers:{Location:'/notfound'}});
  const r=await check(ctx);
  assert.equal(r.overall,'unverified');
  assert.equal(r.checks.find(x=>x.route==='labs/dof-lab-v2.html').status,'unverified');
  assert.equal(r.checks.find(x=>x.route==='tests/workbench/dof-sync-browser.test.cjs').status,'unverified');
 });
 await fixture(async ctx=>{
  ctx.overrides.set('/labs/dof-lab-v2.html',{status:302,headers:{Location:'/'}});
  const r=await check(ctx);
  assert.equal(r.overall,'fail');
  assert.equal(r.checks.find(x=>x.route==='labs/dof-lab-v2.html').status,'fail');
 });
});
test('V5 DOF: local private source erroneously packaged is unsafe regardless of HTTP status',async()=>{
 await fixture(async ctx=>{
  const privateFile=path.join(ctx.root,PRIVATE[0]);
  fs.mkdirSync(path.dirname(privateFile),{recursive:true});
  fs.writeFileSync(privateFile,'secrets in source');
  const r=await check(ctx);
  assert.equal(r.overall,'fail');
  assert.match(r.checks.find(x=>x.route===PRIVATE[0]).reason,/private.*dist/);
 });
});
test('V5 DOF: hostile origin and malformed CLI arguments never reach network',async()=>{
 assert.throws(()=>parseArgs([]),/explicit --base-url/);
 assert.throws(()=>parseArgs(['--base-url','https://example.com','--missing']),/unknown/);
 assert.equal(parseArgs(['--base-url','https://example.com','--json']).json,true);
 assert.equal(parseArgs(['--help']).help,true);
 await assert.rejects(()=>verifyV5({baseUrl:'http://drawing.0701000.xyz/'}),/HTTPS/);
 await assert.rejects(()=>verifyV5({baseUrl:'https://user:pass@drawing.0701000.xyz/'}),/credentials/);
 await assert.rejects(()=>verifyV5({baseUrl:'https://drawing.0701000.xyz/admin'}),/host-root/);
 await assert.rejects(()=>verifyV5({baseUrl:'https://drawing.0701000.xyz/',timeoutMs:1}),/bounded/);
});
test('V5 DOF: tests check all published required V5 dependencies and no sources',()=>{
 const root=path.resolve(__dirname,'../..');
 const build=fs.readFileSync(path.join(root,'scripts/build-static.cjs'),'utf8');
 const html=fs.readFileSync(path.join(root,'labs/dof-lab-v2.html'),'utf8');
 assert.deepEqual(new Set(PUBLIC).size,PUBLIC.length);
 assert.deepEqual(new Set(PRIVATE).size,PRIVATE.length);
 for(const route of PUBLIC){
  if(route==='labs/dof-lab-three-bundle.js'){
   assert.match(build,/dof-lab-three-bundle\.js/);
   assert.match(html,/src="dof-lab-three-bundle\.js"/);
  }else{
   assert.ok(build.includes("'"+route+"'"),'build allowlist must publish '+route);
   if(route.endsWith('.js'))
    assert.ok(html.includes('src="'+path.basename(route)+'"'),'HTML missing dependency '+route);
  }
 }
 for(const route of PRIVATE)assert.ok(!build.includes("'"+route+"'"),'private path in allowlist');
});
