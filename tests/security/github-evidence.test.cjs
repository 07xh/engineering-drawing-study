'use strict';
const test=require('node:test');const assert=require('node:assert/strict');
const {makeSafeReader,collectPullRequestDiff}=require('./github-evidence.cjs');
const SHA='1'.repeat(40),TREE='2'.repeat(40),BLOB='3'.repeat(40);
const root='https://api.github.com/repos/07xh/engineering-drawing-study';
function fixture(overrides={}){
 const pr={number:42,changed_files:1,base:{ref:'main',repo:{full_name:'07xh/engineering-drawing-study'}},
   head:{sha:SHA,repo:{full_name:'07xh/engineering-drawing-study'}},draft:false,mergeable:true,state:'open'};
 const f={filename:'site-ui.css',sha:BLOB,status:'modified',additions:1,deletions:1,changes:2,
   patch:'@@ -1 +1 @@\n-old {color:red}\n+new {color:blue}'};
 const data={['/pulls/42']:{...pr,...overrides.pr},
   ['/pulls/42/files?per_page=100&page=1']:overrides.files??[f],
   ['/pulls/42/files?per_page=100&page=2']:overrides.page2??[],
   ['/commits/'+SHA]:overrides.commit??{sha:SHA,commit:{tree:{sha:TREE}}},
   ['/git/trees/'+TREE+'?recursive=1']:overrides.tree??{sha:TREE,truncated:false,tree:[{path:'site-ui.css',sha:BLOB,mode:'100644',type:'blob'}]}};
 const paths=[];
 async function read(path){paths.push(path);if(!(path in data))throw Error('not found');return data[path];}
 return {read,paths};
}
test('reads exact commit tree and both file pages then reports only diff eligibility',async()=>{
 const f=fixture(),r=await collectPullRequestDiff({prNumber:42,read:f.read});
 assert.equal(r.verified,true);assert.equal(r.status,'trusted-read-diff-only');
 assert.equal(r.headSha,SHA);assert.deepEqual(r.changedFiles,['site-ui.css']);
 assert.equal(f.paths.length,5);
});
test('reject invalid PR id without any API read',async()=>{
 const f=fixture();for(const id of [0,-1,1.1,'42',null,Number.MAX_SAFE_INTEGER])
  assert.equal((await collectPullRequestDiff({prNumber:id,read:f.read})).verified,false);
 assert.equal(f.paths.length,0);
});
test('reject untrusted or oversized PR and wrong repository',async()=>{
 for(const pr of [{changed_files:2},{base:{ref:'main',repo:{full_name:'attacker/other'}}},
   {head:{sha:SHA,repo:{full_name:'attacker/other'}}},{head:{sha:'bad',repo:{full_name:'07xh/engineering-drawing-study'}}}]){
  const f=fixture({pr});assert.equal((await collectPullRequestDiff({prNumber:42,read:f.read})).verified,false);
 }
});
test('pagination mismatch or deleted file list blocks',async()=>{
 for(const override of [{files:[]},{page2:[{filename:'hidden'}]},{files:[{filename:'a'},{filename:'b'}]}]){
  const f=fixture(override);assert.equal((await collectPullRequestDiff({prNumber:42,read:f.read})).verified,false);
 }
});
test('commit SHA and its actual tree must match',async()=>{
 for(const override of [{commit:{sha:'4'.repeat(40),commit:{tree:{sha:TREE}}}},
   {tree:{sha:'4'.repeat(40),truncated:false,tree:[]}},
   {tree:{sha:TREE,truncated:true,tree:[]}}]){
  const f=fixture(override);assert.equal((await collectPullRequestDiff({prNumber:42,read:f.read})).verified,false);
 }
});
test('branch name, draft and dangerous CSS are blocked by diff verifier',async()=>{
 for(const pr of [{base:{ref:'develop',repo:{full_name:'07xh/engineering-drawing-study'}}},{draft:true}]){
  const f=fixture({pr});assert.equal((await collectPullRequestDiff({prNumber:42,read:f.read})).verified,false);
 }
 const f=fixture({files:[{filename:'site-ui.css',sha:BLOB,status:'modified',additions:1,deletions:1,changes:2,
   patch:'@@ -1 +1 @@\n-old {color:red}\n+@import "https://evil.example/x";'}]});
 assert.equal((await collectPullRequestDiff({prNumber:42,read:f.read})).verified,false);
});
test('read errors and unexpected response data fail closed',async()=>{
 const r=await collectPullRequestDiff({prNumber:42,read:()=>{throw Error('api down')}});
 assert.equal(r.verified,false);assert(r.reasons[0].includes('unavailable'));
 const x=await collectPullRequestDiff({prNumber:42,read:async()=>null});assert.equal(x.verified,false);
});
test('HTTP transport fixes api.github.com URL and GET only',async()=>{
 let observed;
 const read=makeSafeReader({token:'read-only-token',fetchImpl:async(url,opts)=>{
  observed={url,opts};return {status:200,json:async()=>({hello:true})};
 }});
 assert.deepEqual(await read('/pulls/42'),{hello:true});
 assert.equal(observed.url,root+'/pulls/42');assert.equal(observed.opts.method,'GET');
 assert.equal(observed.opts.redirect,'error');assert.equal(observed.opts.headers.authorization,'Bearer read-only-token');
});
test('transport rejects arbitrary paths, mutation endpoints, credential injection',async()=>{
 const read=makeSafeReader({fetchImpl:async()=>{throw Error('should not call')}});
 for(const path of ['https://evil.example','/issues/42','/pulls/42/merge','/pulls/42/files?page=3',
   '/pulls/42/../../secrets','/commits/abc','/git/trees/'+TREE+'?recursive=0']){
  await assert.rejects(()=>read(path),/disallowed/);
 }
 assert.throws(()=>makeSafeReader({token:'abc\nfoo'}));
});
test('API 403, 404, invalid JSON or network errors never make an eligible claim',async()=>{
 for(const status of [401,403,404,500]){
  const read=makeSafeReader({fetchImpl:async()=>({status})});
  await assert.rejects(()=>read('/pulls/42'));
 }
 const bad=makeSafeReader({fetchImpl:async()=>({status:200,json:async()=>{throw Error('invalid')}})});
 await assert.rejects(()=>bad('/pulls/42'),/JSON invalid/);
 const down=makeSafeReader({fetchImpl:async()=>{throw Error('offline')}});
 await assert.rejects(()=>down('/pulls/42'),/request failed/);
});
