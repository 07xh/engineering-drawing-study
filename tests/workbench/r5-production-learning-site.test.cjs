'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const http=require('node:http');
const {PUBLIC,PRIVATE,validateOrigin,verifyProduction,parseArgs}=
 require('../../scripts/verify-production-learning-site.cjs');

async function fixture(fn){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'draftai-r5-'));
 const bodies=new Map();
 for(const [i,route] of PUBLIC.entries()){
  const bytes=Buffer.from(i<1?'<!doctype html><title>DraftAI</title>':
   i%2?'<!doctype html><body>Verified math page '+i+'</body>':
    '(()=>{console.log("real V5 math bundle '+i+'")})()');
  const file=path.join(root,route);
  fs.mkdirSync(path.dirname(file),{recursive:true});
  fs.writeFileSync(file,bytes);bodies.set('/'+route,bytes);
 }
 const overrides=new Map();
 const server=http.createServer((req,res)=>{
  const key=req.url;
  const mode=overrides.get(key);
  if(mode?.status&&mode.status!==200){res.writeHead(mode.status);res.end();return}
  const buffer=mode?.bytes??bodies.get(key);
  if(buffer){
   res.writeHead(200,{'Content-Type':key.endsWith('.html')?'text/html':'application/javascript'});
   res.end(buffer);
  }else{res.writeHead(404);res.end('not found')}
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const url='http://127.0.0.1:'+server.address().port+'/';
 try{return await fn({root,url,bodies,overrides})}
 finally{
  await new Promise(resolve=>server.close(resolve));
  fs.rmSync(root,{recursive:true,force:true});
 }
}
const verify=ctx=>verifyProduction({baseUrl:ctx.url,distDir:ctx.root,allowHttpLoopback:true,timeoutMs:600});
test('exact remote build bytes and blocked six internal routes pass a real HTTP exchange',async()=>{
 await fixture(async ctx=>{
  const r=await verify(ctx);
  assert.equal(r.overall,'pass');
  assert.equal(r.checks.length,PUBLIC.length+PRIVATE.length);
  assert.equal(r.checks.every(c=>c.status==='pass'),true);
  assert.equal(r.checks.filter(c=>c.localSha256).length,PUBLIC.length);
  assert.equal(r.checks.filter(c=>c.httpStatus===404).length,PRIVATE.length);
  assert.match(r.note,/not Android stylus/);
 });
});
test('real HTTP 200 with stale teaching bundle is a failure despite valid homepage',async()=>{
 await fixture(async ctx=>{
  ctx.overrides.set('/labs/circle-fillet-live-bundle.js',{bytes:Buffer.from('stale bundle')});
  const r=await verify(ctx);
  assert.equal(r.overall,'fail');
  assert.equal(r.checks.filter(c=>c.status==='fail').length,1);
  assert.match(r.checks.find(c=>c.status==='fail').reason,/remote bytes differ/);
 });
});
test('private source returning HTTP 200 must fail, including a soft-404 HTML fallback',async()=>{
 await fixture(async ctx=>{
  ctx.overrides.set('/workbench/verified-student-fillet-progress.cjs',
   {bytes:Buffer.from('<!doctype html>Not Found fallback')});
  const r=await verify(ctx);
  assert.equal(r.overall,'fail');
  const item=r.checks.find(c=>c.route==='workbench/verified-student-fillet-progress.cjs');
  assert.equal(item.status,'fail');assert.match(item.reason,/soft-404/);
 });
});
test('HTTP 403 on private path is allowed, while protected required public page fails',async()=>{
 await fixture(async ctx=>{
  ctx.overrides.set('/tests/workbench/verified-student-fillet-progress.test.cjs',{status:403});
  assert.equal((await verify(ctx)).overall,'pass');
  ctx.overrides.set('/labs/point-projection-live.html',{status:403});
  const result=await verify(ctx);
  assert.equal(result.overall,'fail');
  assert.equal(result.checks.find(c=>c.route==='labs/point-projection-live.html').httpStatus,403);
 });
});
test('redirects never silently pass as the expected public content or private isolation',async()=>{
 await fixture(async ctx=>{
  ctx.overrides.set('/index.html',{status:302});
  ctx.overrides.set('/scripts/build-static.cjs',{status:302});
  const result=await verify(ctx);
  assert.equal(result.overall,'fail');
  assert.equal(result.checks.find(c=>c.route==='index.html').status,'fail');
  assert.equal(result.checks.find(c=>c.route==='scripts/build-static.cjs').status,'unverified');
 });
});
test('server 503 is UNVERIFIED when no independently proven mismatch exists',async()=>{
 await fixture(async ctx=>{
  ctx.overrides.set('/labs/point-projection-live-bundle.js',{status:503});
  const result=await verify(ctx);
  assert.equal(result.overall,'unverified');
  assert.equal(result.checks.find(c=>c.httpStatus===503).status,'unverified');
 });
});
test('local missing built file prevents claiming deployed proof, even when server responds 200',async()=>{
 await fixture(async ctx=>{
  fs.rmSync(path.join(ctx.root,'labs/circle-fillet-live.html'));
  const result=await verify(ctx);
  assert.equal(result.overall,'unverified');
  assert.match(result.checks.find(c=>c.route==='labs/circle-fillet-live.html').reason,/local/);
 });
});
test('accidentally bundled internal code is a definite local/public boundary failure',async()=>{
 await fixture(async ctx=>{
  const bad=path.join(ctx.root,'scripts/build-static.cjs');
  fs.mkdirSync(path.dirname(bad),{recursive:true});fs.writeFileSync(bad,'secret?');
  const result=await verify(ctx);
  assert.equal(result.overall,'fail');
  assert.match(result.checks.find(c=>c.route==='scripts/build-static.cjs').reason,/local dist/);
 });
});
test('unreachable production is unverified, not claimed as passed or leaked',async()=>{
 await fixture(async ctx=>{
  const report=await verifyProduction({baseUrl:ctx.url,distDir:ctx.root,
   allowHttpLoopback:true,fetchImpl:async()=>{throw new Error('network blocked')}});
  assert.equal(report.overall,'unverified');
  assert.equal(report.checks.length,11);
  assert.ok(report.checks.every(c=>c.status==='unverified'));
 });
});
test('reject credentials and unapproved HTTP, allow only explicit loopback test origin',()=>{
 assert.throws(()=>validateOrigin('http://drawing.0701000.xyz/'),/HTTPS/);
 assert.throws(()=>validateOrigin('https://someone:password@drawing.0701000.xyz/'),/credentials/);
 assert.throws(()=>validateOrigin('https://drawing.0701000.xyz/labs/'),/host-root/);
 assert.throws(()=>validateOrigin('https://drawing.0701000.xyz/?token=xyz'),/query/);
 assert.throws(()=>validateOrigin('http://127.0.0.1:1234/'),/HTTPS/);
 assert.equal(validateOrigin('http://127.0.0.1:1234/',true).port,'1234');
 assert.equal(validateOrigin('https://drawing.0701000.xyz/').hostname,'drawing.0701000.xyz');
});
test('requires explicitly requested production URL and bounds timeout/bytes',async()=>{
 assert.throws(()=>parseArgs([]),/base-url/);
 assert.throws(()=>parseArgs(['--base-url','https://x/','--bogus']),/unknown/);
 assert.equal(parseArgs(['--base-url','https://x/','--json']).json,true);
 assert.equal(parseArgs(['--help']).help,true);
 await assert.rejects(()=>verifyProduction({baseUrl:'https://drawing.0701000.xyz/',
  timeoutMs:1}),/timeout/);
});
