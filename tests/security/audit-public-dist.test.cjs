'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {PUBLIC_ASSETS,auditPublicDist}=require('./audit-public-dist.cjs');
function fixture(t){
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'draftai-dist-'));
  t.after(()=>fs.rmSync(dir,{force:true,recursive:true}));
  for(const p of PUBLIC_ASSETS){const target=path.join(dir,p);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,'synthetic\n');}
  return dir;
}
test('valid synthetic dist has exactly allowlisted regular assets',t=>{
  const dir=fixture(t),result=auditPublicDist(dir);
  assert.equal(result.ok,true,JSON.stringify(result.errors));
  assert.equal(result.files.length,PUBLIC_ASSETS.length);
});
test('private textbook path unexpectedly shipped causes a blocker',t=>{
  const dir=fixture(t),leaked=path.join(dir,'knowledge','index.html');
  fs.mkdirSync(path.dirname(leaked),{recursive:true});fs.writeFileSync(leaked,'private');
  assert(auditPublicDist(dir).errors.some(x=>x.includes('knowledge/index.html')));
});
test('unexpected top-level secrets.json blocks distribution',t=>{
  const dir=fixture(t);fs.writeFileSync(path.join(dir,'secrets.json'),'{}');
  assert(auditPublicDist(dir).errors.some(x=>x.includes('secrets.json')));
});
test('missing expected public disclosure blocks distribution',t=>{
  const dir=fixture(t);fs.unlinkSync(path.join(dir,'public-use.html'));
  assert(auditPublicDist(dir).errors.some(x=>x.includes('missing public asset: public-use.html')));
});
test('symlink is rejected even if its name is a whitelisted asset',t=>{
  const dir=fixture(t),file=path.join(dir,'index.html');
  fs.unlinkSync(file);fs.symlinkSync(path.join(dir,'robots.txt'),file);
  const result=auditPublicDist(dir);
  assert.equal(result.ok,false);
  assert(result.errors.some(x=>x.includes('symbolic link forbidden: index.html')));
});
test('nested private file in labs is rejected',t=>{
  const dir=fixture(t);fs.writeFileSync(path.join(dir,'labs','verified-exercises.js'),'not public');
  assert(auditPublicDist(dir).errors.some(x=>x.includes('labs/verified-exercises.js')));
});
test('missing directory and invalid root fail closed',()=>{
  assert.equal(auditPublicDist(null).ok,false);
  assert.equal(auditPublicDist('/draftai-no-such-dist-directory').ok,false);
});
test('a single file cannot masquerade as dist root',t=>{
  const dir=fixture(t);assert.equal(auditPublicDist(path.join(dir,'index.html')).ok,false);
});
