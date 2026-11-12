'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {PUBLIC_ASSETS}=require('./audit-public-dist.cjs');
const {buildArtifactManifest,verifyArtifactManifest}=require('./artifact-manifest.cjs');
const SHA='1'.repeat(40),OTHER='2'.repeat(40);
function fixture(t) {
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'draftai-manifest-'));
 t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 for(const name of PUBLIC_ASSETS) {
  const dest=path.join(root,name);
  fs.mkdirSync(path.dirname(dest),{recursive:true});
  fs.writeFileSync(dest,'fixture:'+name+'\n');
 }
 return root;
}
test('deterministic full-SHA-bound manifest of every public asset',t=>{
 const root=fixture(t),first=buildArtifactManifest({root,sourceSha:SHA});
 const second=buildArtifactManifest({root,sourceSha:SHA});
 assert.deepEqual(first,second);assert.equal(first.assets.length,PUBLIC_ASSETS.length);
 assert.match(first.digest,/^[a-f0-9]{64}$/);
 assert.equal(verifyArtifactManifest({root,sourceSha:SHA,expected:first}).ok,true);
});
test('source SHA must be canonical full lowercase 40 hex',t=>{
 const root=fixture(t);
 for(const sourceSha of ['short','A'.repeat(40),'g'.repeat(40),null])
  assert.throws(()=>buildArtifactManifest({root,sourceSha}),/source SHA/);
});
test('one-byte public CSS modification causes content digest mismatch',t=>{
 const root=fixture(t),m=buildArtifactManifest({root,sourceSha:SHA});
 fs.appendFileSync(path.join(root,'site-ui.css'),'/* modified */');
 assert.equal(verifyArtifactManifest({root,sourceSha:SHA,expected:m}).ok,false);
});
test('trusted source SHA cannot be swapped after manifest generation',t=>{
 const root=fixture(t),m=buildArtifactManifest({root,sourceSha:SHA});
 assert.equal(verifyArtifactManifest({root,sourceSha:OTHER,expected:m}).ok,false);
});
test('unknown or private asset in dist aborts audit',t=>{
 const root=fixture(t),privateFile=path.join(root,'knowledge','private.json');
 fs.mkdirSync(path.dirname(privateFile),{recursive:true});fs.writeFileSync(privateFile,'confidential');
 assert.throws(()=>buildArtifactManifest({root,sourceSha:SHA}),/inventory failed/);
});
test('missing required public asset aborts audit',t=>{
 const root=fixture(t);fs.unlinkSync(path.join(root,'public-use.html'));
 assert.throws(()=>buildArtifactManifest({root,sourceSha:SHA}),/inventory failed/);
});
test('secret signatures are blocked without leaking their values in errors',t=>{
 const root=fixture(t),secret='ghp_'+'a'.repeat(30);
 fs.appendFileSync(path.join(root,'site-ui.css'),secret);
 assert.throws(()=>buildArtifactManifest({root,sourceSha:SHA}),error=>
   error.message.includes('potential secret')&&!error.message.includes(secret));
});
test('private-key marker is rejected in public JS bundle',t=>{
 const root=fixture(t);
 fs.appendFileSync(path.join(root,'labs','dof-lab-three-bundle.js'),'-----BEGIN PRIVATE KEY-----');
 assert.throws(()=>buildArtifactManifest({root,sourceSha:SHA}),/potential secret/);
});
test('a symlink cannot replace an otherwise allowlisted public file',t=>{
 const root=fixture(t),target=path.join(root,'index.html');
 fs.unlinkSync(target);fs.symlinkSync(path.join(root,'robots.txt'),target);
 assert.throws(()=>buildArtifactManifest({root,sourceSha:SHA}),/inventory failed/);
});
test('manifest corruption is rejected and never accepted as a new baseline',t=>{
 const root=fixture(t),m=buildArtifactManifest({root,sourceSha:SHA});
 assert.equal(verifyArtifactManifest({root,sourceSha:SHA,expected:{...m,digest:'0'.repeat(64)}}).ok,false);
 assert.equal(verifyArtifactManifest({root,sourceSha:SHA,expected:{...m,assets:m.assets.slice(1)}}).ok,false);
 assert.equal(verifyArtifactManifest({root,sourceSha:SHA,expected:null}).ok,false);
});
