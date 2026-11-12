'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {TEST_NAMES,securityCiGate:runSecurityCiGate}=require('./security-ci-gate.cjs');
const SOURCE_SHA='1'.repeat(40);
function securityCiGate(opts={}) {
 return runSecurityCiGate({sourceSha:SOURCE_SHA,
  buildManifest:()=>({sourceSha:SOURCE_SHA,digest:'a'.repeat(64),assets:[{path:'index.html'}]}),...opts});
}
function fixture(t){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'draftai-security-gate-'));
 t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 const dir=path.join(root,'tests','security');fs.mkdirSync(dir,{recursive:true});
 for(const name of TEST_NAMES)fs.writeFileSync(path.join(dir,name),'// fixture\n');
 fs.mkdirSync(path.join(root,'dist'));
 return root;
}
const okRun=()=>({status:0,signal:null,error:null});
const okAudit=()=>({ok:true,files:['index.html']});
test('complete test inventory and audited dist yields local-only PASS',t=>{
 const root=fixture(t),result=securityCiGate({root,spawn:okRun,audit:okAudit});
 assert.equal(result.ok,true);assert.equal(result.status,'local-build-security-pass-only');
 assert.equal(result.securityTestFiles,9);assert.equal(result.publishedAssetFiles,1);
});
test('missing security test means fail-closed before execution',t=>{
 const root=fixture(t);fs.unlinkSync(path.join(root,'tests','security',TEST_NAMES[0]));
 let executed=false;const r=securityCiGate({root,spawn:()=>{executed=true;return okRun()},audit:okAudit});
 assert.equal(r.ok,false);assert.equal(executed,false);
});
test('dist directory missing fails before running tests',t=>{
 const root=fixture(t);fs.rmSync(path.join(root,'dist'),{recursive:true,force:true});
 assert.equal(securityCiGate({root,spawn:okRun,audit:okAudit}).ok,false);
});
test('symlinked tests or dist cannot bypass required checks',t=>{
 const root=fixture(t),file=path.join(root,'tests','security',TEST_NAMES[1]);
 fs.unlinkSync(file);fs.symlinkSync(path.join(root,'tests','security',TEST_NAMES[0]),file);
 assert.equal(securityCiGate({root,spawn:okRun,audit:okAudit}).ok,false);
 fs.unlinkSync(file);fs.writeFileSync(file,'stub');
 fs.rmSync(path.join(root,'dist'),{recursive:true,force:true});
 fs.symlinkSync(path.join(root,'tests'),path.join(root,'dist'));
 assert.equal(securityCiGate({root,spawn:okRun,audit:okAudit}).ok,false);
});
test('test command errors, failures and timeouts block any audit',t=>{
 const root=fixture(t);
 for(const run of [{status:1},{status:null,signal:'SIGTERM'},{status:null,error:Error('timeout')}])
  assert.equal(securityCiGate({root,spawn:()=>run,audit:okAudit}).ok,false);
 assert.equal(securityCiGate({root,spawn:()=>{throw Error('broken')},audit:okAudit}).ok,false);
});
test('public artifact audit failure or crash blocks release',t=>{
 const root=fixture(t);
 assert.equal(securityCiGate({root,spawn:okRun,audit:()=>({ok:false,errors:['unexpected file']})}).ok,false);
 assert.equal(securityCiGate({root,spawn:okRun,audit:()=>{throw Error('bad') }}).ok,false);
});
test('runner uses fixed paths and a non-secret environment allowlist',t=>{
 const root=fixture(t);
 let observed;
 securityCiGate({root,spawn:(binary,args,options)=>{observed={binary,args,options};return okRun()},audit:okAudit});
 assert.equal(observed.binary,process.execPath);
 assert.equal(observed.args[0],'--test');assert.equal(observed.args.length,10);
 for(const name of TEST_NAMES)assert(observed.args.some(x=>x===path.join(root,'tests','security',name)));
 assert.equal(Object.hasOwn(observed.options.env,'CF_API_TOKEN'),false);
 assert.equal(Object.hasOwn(observed.options.env,'GITHUB_TOKEN'),false);
 assert.equal(Object.hasOwn(observed.options.env,'CLOUDFLARE_API_TOKEN'),false);
});
test('invalid root is always blocked',()=>{
 assert.equal(securityCiGate({root:'/draftai-security-does-not-exist',spawn:okRun,audit:okAudit}).ok,false);
});

test('missing or untrusted source SHA blocks before security subprocess execution',t=>{
 const root=fixture(t);let called=false;
 const r=securityCiGate({root,sourceSha:null,spawn:()=>{called=true;return okRun()},audit:okAudit});
 assert.equal(r.ok,false);assert.equal(called,false);
 assert(r.reasons.some(x=>x.includes('Git commit SHA')));
});
test('source SHA and artifact manifest digest must match audited build',t=>{
 const root=fixture(t);
 for(const wrong of [
  {sourceSha:'2'.repeat(40),digest:'a'.repeat(64),assets:[{path:'index.html'}]},
  {sourceSha:SOURCE_SHA,digest:'bad',assets:[{path:'index.html'}]},
  {sourceSha:SOURCE_SHA,digest:'a'.repeat(64),assets:[]}
 ]) {
  const r=securityCiGate({root,spawn:okRun,audit:okAudit,buildManifest:()=>wrong});
  assert.equal(r.ok,false);
  assert(r.reasons.some(x=>x.includes('manifest')));
 }
});
test('manifest scanner failures block readiness without publishing credential values',t=>{
 const root=fixture(t),secret='supersecret';
 const r=securityCiGate({root,spawn:okRun,audit:okAudit,buildManifest:()=>{throw Error('potential secret material')}});
 assert.equal(r.ok,false);assert(r.reasons.some(x=>x.includes('manifest failed')));
 assert.equal(JSON.stringify(r).includes(secret),false);
});
