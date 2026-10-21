'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {targetOfWorkflowRun,checkSafeAutoMerge,mergeRestClient,tryAutoMerge}=require('./auto-merge.cjs');
const SHA='1'.repeat(40),MAIN='2'.repeat(40),MERGED='3'.repeat(40);
const REPO='07xh/engineering-drawing-study';
function fixture(overrides={}){
 const payload={workflow_run:{event:'pull_request',conclusion:'success',head_sha:SHA,
  head_repository:{full_name:REPO},pull_requests:[{number:19}]}};
 const main={protected:true,commit:{sha:MAIN}};
 const pr={head:{sha:SHA,repo:{full_name:REPO}},base:{ref:'main',sha:MAIN,repo:{full_name:REPO}},
  draft:false,mergeable:true,mergeable_state:'clean',state:'open'};
 const checks={total_count:2,check_runs:[
  {name:'validate',head_sha:SHA,status:'completed',conclusion:'success'},
  {name:'release-security',head_sha:SHA,status:'completed',conclusion:'success'}]};
 const map={'/branches/main':main,'/pulls/19':pr,
  ['/commits/'+SHA+'/check-runs?per_page=100']:checks,...overrides};
 const called=[];return {payload,called,read:async p=>{called.push(p);return map[p]},
  inspect:async()=>({verified:true,headSha:SHA,changedFiles:['site-ui.css']}),
  merge:async()=>({mergeSha:MERGED})};
}
test('valid workflow event targets only one same-repository finished PR run',()=>{
 const x=fixture();assert.deepEqual(targetOfWorkflowRun(x.payload),{number:19,headSha:SHA});
 for(const change of [{event:'push'},{conclusion:'failure'},{head_sha:'bad'},
   {head_repository:{full_name:'attacker/repo'}},{pull_requests:[]},{pull_requests:[{number:1},{number:2}]}]){
  const payload={workflow_run:{...x.payload.workflow_run,...change}};
  assert.equal(targetOfWorkflowRun(payload),null);
 }
});
test('clean CSS PR with protected base and two green checks can be considered',async()=>{
 const x=fixture();const r=await checkSafeAutoMerge(x);
 assert.equal(r.ok,true);assert.equal(r.headSha,SHA);assert.equal(r.baseSha,MAIN);
 assert.equal(x.called.filter(p=>p==='/branches/main').length,2);
});
test('unprotected main and moved base block without merge',async()=>{
 for(const state of [{protected:false,commit:{sha:MAIN}},{protected:true,commit:{sha:SHA}}]){
  const x=fixture({'/branches/main':state});
  assert.equal((await checkSafeAutoMerge(x)).ok,false);
 }
});
test('stale draft conflict, fork and different base branch fail closed',async()=>{
 const changes=[{draft:true},{mergeable:false},{mergeable_state:'dirty'},{state:'closed'},
  {head:{sha:SHA,repo:{full_name:'fork/repo'}}},
  {base:{ref:'develop',sha:MAIN,repo:{full_name:REPO}}},
  {base:{ref:'main',sha:SHA,repo:{full_name:REPO}}}];
 for(const c of changes){
  const x=fixture(),base=await x.read('/pulls/19');
  x.read=async p=>p==='/pulls/19'?{...base,...c}:p==='/branches/main'?{protected:true,commit:{sha:MAIN}}:
   {total_count:2,check_runs:[{name:'validate',head_sha:SHA,status:'completed',conclusion:'success'},
      {name:'release-security',head_sha:SHA,status:'completed',conclusion:'success'}]};
  assert.equal((await checkSafeAutoMerge(x)).ok,false);
 }
});
test('diff not independently verified or not CSS is never mergeable',async()=>{
 for(const result of [{verified:false},{verified:true,headSha:'4'.repeat(40),changedFiles:['site-ui.css']},
   {verified:true,headSha:SHA,changedFiles:['wrangler.jsonc']}]){
  const x=fixture();x.inspect=async()=>result;
  assert.equal((await checkSafeAutoMerge(x)).ok,false);
 }
});
test('missing, stale or failing required checks block',async()=>{
 for(const checks of [{total_count:0,check_runs:[]},
  {total_count:3,check_runs:[{name:'validate',head_sha:SHA,status:'completed',conclusion:'success'}]},
  {total_count:1,check_runs:[{name:'release-security',head_sha:SHA,status:'completed',conclusion:'failure'}]}]){
  const x=fixture({['/commits/'+SHA+'/check-runs?per_page=100']:checks});
  assert.equal((await checkSafeAutoMerge(x)).ok,false);
 }
});
test('enabled only with reviewed evidence; otherwise no merge callback',async()=>{
 const x=fixture();let count=0;
 const merge=async()=>{count++;return {mergeSha:MERGED}};
 assert.equal((await tryAutoMerge({...x,enabled:false,merge})).status,'disabled');
 assert.equal(count,0);
 const r=await tryAutoMerge({...x,enabled:true,merge});
 assert.equal(r.status,'merged');assert.equal(count,1);assert.equal(r.mergeSha,MERGED);
});
test('merge error and invalid merge response fail closed',async()=>{
 const x=fixture();
 assert.equal((await tryAutoMerge({...x,enabled:true,merge:async()=>{throw Error('conflict')}})).status,'blocked');
 assert.equal((await tryAutoMerge({...x,enabled:true,merge:async()=>({mergeSha:'bad'})})).status,'blocked');
});
test('GitHub REST merger uses exact head SHA and squash, never bypass or force',async()=>{
 let observed;const merge=mergeRestClient({token:'read-token-123',fetchImpl:async(url,options)=>{
  observed={url,options};return {status:200,json:async()=>({merged:true,sha:MERGED})};
 }});
 assert.deepEqual(await merge({prNumber:19,headSha:SHA}),{mergeSha:MERGED});
 assert.equal(observed.options.method,'PUT');
 assert(observed.url.endsWith('/pulls/19/merge'));
 assert.deepEqual(JSON.parse(observed.options.body),{sha:SHA,merge_method:'squash',
   commit_title:'style: verified low-risk DraftAI update (#19)'});
});
test('bad head SHA, invalid number and API errors cannot merge',async()=>{
 const fn=mergeRestClient({token:'read-token-123',fetchImpl:async()=>({status:403})});
 await assert.rejects(()=>fn({prNumber:19,headSha:SHA}));
 await assert.rejects(()=>fn({prNumber:0,headSha:SHA}));
 await assert.rejects(()=>fn({prNumber:19,headSha:'bad'}));
 assert.throws(()=>mergeRestClient({token:'bad\nvalue'}));
});
test('untrusted webhook events do not cause even a read',async()=>{
 const x=fixture();x.payload.workflow_run.head_repository.full_name='outside/repo';
 const r=await tryAutoMerge({...x,enabled:true});
 assert.equal(r.status,'blocked');assert.deepEqual(x.called,[]);
});

test('duplicate successful validate runs may pass, any failed duplicate blocks',async()=>{
 const x=fixture();
 const path='/commits/'+SHA+'/check-runs?per_page=100';
 const oldChecks=await x.read(path);
 const good={name:'validate',head_sha:SHA,status:'completed',conclusion:'success'};
 const list=[...oldChecks.check_runs,good];
 const shared=(items)=>async p=>p===path?{total_count:items.length,check_runs:items}:
  p==='/branches/main'?{protected:true,commit:{sha:MAIN}}:
  p==='/pulls/19'?{head:{sha:SHA,repo:{full_name:REPO}},
   base:{ref:'main',sha:MAIN,repo:{full_name:REPO}},
   draft:false,mergeable:true,mergeable_state:'clean',state:'open'}:null;
 assert.equal((await checkSafeAutoMerge({...x,read:shared(list)})).ok,true);
 const bad=[...oldChecks.check_runs,{...good,conclusion:'failure'}];
 assert.equal((await checkSafeAutoMerge({...x,read:shared(bad)})).ok,false);
});
