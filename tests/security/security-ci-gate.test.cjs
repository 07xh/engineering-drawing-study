'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {TEST_NAMES,securityCiGate}=require('./security-ci-gate.cjs');
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
 assert.equal(result.securityTestFiles,6);assert.equal(result.publishedAssetFiles,1);
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
 assert.equal(observed.args[0],'--test');assert.equal(observed.args.length,7);
 for(const name of TEST_NAMES)assert(observed.args.some(x=>x===path.join(root,'tests','security',name)));
 assert.equal(Object.hasOwn(observed.options.env,'CF_API_TOKEN'),false);
 assert.equal(Object.hasOwn(observed.options.env,'GITHUB_TOKEN'),false);
 assert.equal(Object.hasOwn(observed.options.env,'CLOUDFLARE_API_TOKEN'),false);
});
test('invalid root is always blocked',()=>{
 assert.equal(securityCiGate({root:'/draftai-security-does-not-exist',spawn:okRun,audit:okAudit}).ok,false);
});
