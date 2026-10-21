'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {makeGithubReader,checkProtectedMain}=require('./protected-main.cjs');
const SHA='a'.repeat(40),BEFORE='b'.repeat(40);
function fixture(overrides={}){
 const data={
  '/branches/main':{protected:true,commit:{sha:SHA}},
  ['/commits/'+SHA]:{sha:SHA,parents:[{sha:BEFORE}],files:[{
   filename:'site-ui.css',status:'modified',additions:1,deletions:1,changes:2,
   patch:'@@ -1 +1 @@\n-.a{color:red}\n+.a{color:blue}'}]},
  ['/commits/'+SHA+'/check-runs?per_page=100']:{total_count:2,check_runs:[
   {name:'validate',head_sha:SHA,status:'completed',conclusion:'success'},
   {name:'release-security',head_sha:SHA,status:'completed',conclusion:'success'}]},
  ...overrides
 };
 let calls=0;return {read:async p=>{calls++;if(!(p in data))throw Error('path unavailable');return data[p]},get calls(){return calls}};
}
test('protected main with green required checks and safe squash CSS passes',async()=>{
 const x=fixture(),r=await checkProtectedMain({sha:SHA,read:x.read});
 assert.deepEqual(r,{ok:true,sha:SHA,previousSha:BEFORE,changedFile:'site-ui.css'});
 assert.equal(x.calls,4);
});
test('unprotected branch or moved main rejected',async()=>{
 for(const branch of [{protected:false,commit:{sha:SHA}},{protected:true,commit:{sha:BEFORE}}]){
  const x=fixture({'/branches/main':branch});
  assert.equal((await checkProtectedMain({sha:SHA,read:x.read})).ok,false);
 }
});
test('nonlinear merge or source changes blocked',async()=>{
 for(const change of [{parents:[{sha:BEFORE},{sha:'c'.repeat(40)}]},{files:[]},
   {files:[{filename:'wrangler.jsonc'}]}]){
  const orig=fixture(),commit=await orig.read('/commits/'+SHA);
  const x=fixture({['/commits/'+SHA]:{...commit,...change}});
  assert.equal((await checkProtectedMain({sha:SHA,read:x.read})).ok,false);
 }
});
test('dangerous CSS changes and missing patch blocked',async()=>{
 const orig=fixture(),commit=await orig.read('/commits/'+SHA);
 for(const patch of ['@@ -1 +1 @@\n-old\n+@import "http://bad.example"',
  '@@ -1 +1 @@\n+ok {color:blue}',null]){
  const x=fixture({['/commits/'+SHA]:{...commit,files:[{...commit.files[0],patch}]}});
  assert.equal((await checkProtectedMain({sha:SHA,read:x.read})).ok,false);
 }
});
test('failed, missing and truncated checks block',async()=>{
 const url='/commits/'+SHA+'/check-runs?per_page=100';
 for(const checked of [{total_count:1,check_runs:[]},{total_count:2,check_runs:[]},
  {total_count:1,check_runs:[{name:'release-security',head_sha:SHA,status:'completed',conclusion:'failure'}]}]){
  const x=fixture({[url]:checked});
  assert.equal((await checkProtectedMain({sha:SHA,read:x.read})).ok,false);
 }
});
test('GitHub read error and invalid SHA fail closed',async()=>{
 const x=fixture();
 assert.equal((await checkProtectedMain({sha:'bad',read:x.read})).ok,false);
 assert.equal((await checkProtectedMain({sha:SHA,read:()=>{throw Error('offline')}})).ok,false);
});
test('reader only uses pinned GitHub HTTPS GET and redacts errors',async()=>{
 let observed;
 const get=makeGithubReader({token:'read-token-123',fetchImpl:async(u,opts)=>{observed={u,opts};return {status:200,json:async()=>({ok:true})}}});
 assert.deepEqual(await get('/branches/main'),{ok:true});
 assert.equal(observed.opts.method,'GET');assert(observed.u.endsWith('/repos/07xh/engineering-drawing-study/branches/main'));
 await assert.rejects(()=>get('/pulls/1/merge'),/forbidden/);
 await assert.rejects(()=>get('https://example.net'),/forbidden/);
 assert.throws(()=>makeGithubReader({token:'a\nb'}));
});
test('wrong HTTP response, JSON and network errors never pass',async()=>{
 for(const code of [403,404,500]) {
  const get=makeGithubReader({token:'read-token-123',fetchImpl:async()=>({status:code})});
  await assert.rejects(()=>get('/branches/main'));
 }
 const get=makeGithubReader({token:'read-token-123',fetchImpl:async()=>{throw Error('offline')}});
 await assert.rejects(()=>get('/branches/main'),/request failed/);
});

test('multiple all-success required check runs are allowed; failed duplicate blocks',async()=>{
 const original=fixture();
 const key='/commits/'+SHA+'/check-runs?per_page=100';
 const checks=await original.read(key);
 const good={name:'validate',head_sha:SHA,status:'completed',conclusion:'success'};
 const ok=fixture({[key]:{total_count:3,check_runs:[...checks.check_runs,good]}});
 assert.equal((await checkProtectedMain({sha:SHA,read:ok.read})).ok,true);
 const notOk=fixture({[key]:{total_count:3,check_runs:[...checks.check_runs,{...good,conclusion:'failure'}]}});
 assert.equal((await checkProtectedMain({sha:SHA,read:notOk.read})).ok,false);
});
