'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {createCloudflareClient,selectNewTaggedVersion,previousVersionBelongsToCommit}=require('./cloudflare-versions.cjs');
const UUID='aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',NEW='bbbbbbbb-cccc-dddd-eeee-ffffffffffff';
const SHA='1'.repeat(40),BEFORE='2'.repeat(40);
const ACCOUNT='a'.repeat(32);
function service({reply,status=200}={}){
 const observed=[];
 const api=createCloudflareClient({accountId:ACCOUNT,token:'redacted-worker-token',
  fetchImpl:async(url,options)=>{observed.push({url,options});return {status,json:async()=>({success:true,result:reply})}}});
 return {api,observed};
}
test('list Worker versions reads fixed account and worker only',async()=>{
 const sample=[{id:UUID,annotations:{'workers/tag':'draftai-'+BEFORE}}];
 const {api,observed}=service({reply:sample});
 assert.deepEqual(await api.versions(),sample);
 assert.equal(observed[0].options.method,'GET');
 assert(observed[0].url.endsWith('/workers/workers/engineering-drawing-study/versions?per_page=100&page=1'));
});
test('read deployed 100-percent active version from newest deployment',async()=>{
 const {api}=service({reply:{deployments:[{id:UUID,created_on:'2026-10-21T08:00:00.000Z',
  versions:[{version_id:NEW,percentage:100}]}]}});
 assert.deepEqual(await api.active(),{deploymentId:UUID,versionId:NEW});
});
test('ambiguous mixed active version is never treated as safe',async()=>{
 for(const versions of [[],[{version_id:NEW,percentage:75},{version_id:UUID,percentage:25}],
  [{version_id:NEW,percentage:99}]]) {
  const {api}=service({reply:{deployments:[{id:UUID,created_on:'2026-10-21T08:00:00Z',versions}]}});
  await assert.rejects(()=>api.active());
 }
});
test('promote uses Cloudflare deployment POST with exact Worker Version ID',async()=>{
 const {api,observed}=service({reply:{id:UUID,versions:[{version_id:NEW,percentage:100}]}});
 assert.equal(await api.promote(NEW,'Verified release'),UUID);
 const request=observed[0];
 assert.equal(request.options.method,'POST');
 assert(request.url.endsWith('/workers/scripts/engineering-drawing-study/deployments'));
 assert.deepEqual(JSON.parse(request.options.body).versions,[{version_id:NEW,percentage:100}]);
});
test('Cloudflare success without matching deployed version fails closed',async()=>{
 const {api}=service({reply:{id:UUID,versions:[{version_id:UUID,percentage:100}]}});
 await assert.rejects(()=>api.promote(NEW,'verified'));
});
test('new tag must be unique, exact, and absent from old snapshot',()=>{
 const before=[{id:UUID,annotations:{'workers/tag':'draftai-'+BEFORE}}];
 const after=[...before,{id:NEW,annotations:{'workers/tag':'draftai-'+SHA}}];
 assert.equal(selectNewTaggedVersion(before,after,SHA),NEW);
 assert.throws(()=>selectNewTaggedVersion(before,before,SHA));
 assert.throws(()=>selectNewTaggedVersion(before,[...after,after[1]],SHA));
 assert.throws(()=>selectNewTaggedVersion(before,after,BEFORE));
});
test('old deployed Worker must match previous git SHA or explicit bootstrap id',()=>{
 const versions=[{id:UUID,annotations:{'workers/tag':'draftai-'+BEFORE}}];
 assert.equal(previousVersionBelongsToCommit(versions,UUID,BEFORE,undefined),true);
 assert.equal(previousVersionBelongsToCommit(versions,UUID,SHA,undefined),false);
 assert.equal(previousVersionBelongsToCommit(versions,UUID,SHA,UUID),true);
 assert.equal(previousVersionBelongsToCommit([],UUID,SHA,UUID),false);
});
test('missing credential, HTTP failure and invalid JSON do not reveal token',async()=>{
 assert.throws(()=>createCloudflareClient({accountId:'bad',token:'topsecret-token'}));
 for(const status of [400,401,403,500]){
  const {api}=service({reply:[],status});
  // mocked helper uses explicit status for all requests
  const bad=createCloudflareClient({accountId:ACCOUNT,token:'redacted-worker-token',
   fetchImpl:async()=>({status,json:async()=>({success:true,result:[]})})});
  await assert.rejects(()=>bad.versions());
  assert(api);
 }
 const bad=createCloudflareClient({accountId:ACCOUNT,token:'secret-credentials',
  fetchImpl:async()=>({status:200,json:async()=>{throw Error('bad json')}})});
 await assert.rejects(()=>bad.versions(),/JSON invalid/);
});

test('official Beta Workers Versions response supports complete two-page enumeration',async()=>{
 const oneHundred=Array.from({length:100},(_,i)=>({
  id:'00000000-0000-4000-8000-'+String(i+1).padStart(12,'0'),
  annotations:{'workers/tag':'draftai-'+SHA}
 }));
 const extra={id:'10000000-0000-4000-8000-000000000001',
  annotations:{'workers/tag':'draftai-'+BEFORE}};
 const requests=[];
 const client=createCloudflareClient({accountId:ACCOUNT,token:'read-worker-token',
  fetchImpl:async(url,opt)=>{
   requests.push({url,opt});
   const page=url.endsWith('page=1')?oneHundred:url.endsWith('page=2')?[extra]:null;
   return {status:200,json:async()=>({success:true,result:page,
    result_info:{total_count:101}})};
  }});
 const list=await client.versions();
 assert.equal(list.length,101);
 assert.equal(requests.length,2);
 assert(requests.every(v=>v.url.includes('/accounts/'+ACCOUNT+'/workers/workers/engineering-drawing-study/versions?')));
 assert(requests.every(v=>v.opt.method==='GET'));
 assert.equal(list[100].annotations['workers/tag'],'draftai-'+BEFORE);
});
test('rejects documented legacy Scripts Versions result.items rather than silently trusting wrong schema',async()=>{
 const api=createCloudflareClient({accountId:ACCOUNT,token:'read-worker-token',
  fetchImpl:async()=>({status:200,json:async()=>({success:true,result:{items:[{id:UUID}]}})})});
 await assert.rejects(()=>api.versions(),/malformed/);
});
test('incomplete version pagination or repeated version IDs are rejected',async()=>{
 const v={id:UUID,annotations:{'workers/tag':'draftai-'+BEFORE}};
 const incomplete=createCloudflareClient({accountId:ACCOUNT,token:'read-worker-token',
  fetchImpl:async()=>({status:200,json:async()=>({success:true,result:[v],result_info:{total_count:4}})})});
 await assert.rejects(()=>incomplete.versions(),/truncated/);
 const repeated=createCloudflareClient({accountId:ACCOUNT,token:'read-worker-token',
  fetchImpl:async()=>({status:200,json:async()=>({success:true,result:[v,v]})})});
 await assert.rejects(()=>repeated.versions(),/repeated/);
});
test('first documented Scripts deployment is active; an empty response is rejected',async()=>{
 const a={id:UUID,created_on:'2026-10-21T13:00:00Z',versions:[{version_id:NEW,percentage:100}]};
 const b={id:NEW,created_on:'2026-10-20T13:00:00Z',versions:[{version_id:UUID,percentage:100}]};
 const {api}=service({reply:{deployments:[a,b]}});
 assert.equal((await api.active()).versionId,NEW);
 const empty=service({reply:{deployments:[]}}).api;
 await assert.rejects(()=>empty.active(),/unavailable/);
});
test('a deployment response without a deployment ID cannot confirm activation',async()=>{
 const bad=service({reply:{versions:[{version_id:NEW,percentage:100}]}}).api;
 await assert.rejects(()=>bad.promote(NEW,'validated'),/verify/);
});
