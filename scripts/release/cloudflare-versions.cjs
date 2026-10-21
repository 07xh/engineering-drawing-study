'use strict';
/**
 * Worker version/deployment API adapter. GitHub PR workflows MUST NEVER use
 * this with secrets. Intended for a separate, trusted, main-only release job.
 */
const WORKER='engineering-drawing-study';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SHA=/^[0-9a-f]{40}$/;
function createCloudflareClient({accountId,token,fetchImpl=globalThis.fetch}={}){
 if(!/^[0-9a-f]{32}$/i.test(accountId||'')||typeof token!=='string'||token.length<8||
    /[\r\n]/.test(token)||typeof fetchImpl!=='function')
  throw Error('Cloudflare production credentials or HTTP client unavailable');
 const prefix='https://api.cloudflare.com/client/v4/accounts/'+accountId+'/workers';
 const vPath='/workers/'+WORKER+'/versions?per_page=100&page=1';
 const dPath='/scripts/'+WORKER+'/deployments';
 async function request(method,path,body){
  if((method!=='GET'&&method!=='POST')||!([vPath,dPath].includes(path)))
   throw Error('disallowed Cloudflare API request');
  if(method==='POST'&&path!==dPath)throw Error('deployment creation endpoint required');
  let response;
  try{
   response=await fetchImpl(prefix+path,{method,redirect:'error',signal:AbortSignal.timeout(15000),
    headers:{authorization:'Bearer '+token,accept:'application/json','content-type':'application/json'},
    ...(body?{body:JSON.stringify(body)}:{})});
  }catch{throw Error('Cloudflare API transport failed')}
  if(response?.status!==200)throw Error('Cloudflare API did not confirm success');
  let json;try{json=await response.json()}catch{throw Error('Cloudflare API JSON invalid')}
  if(json?.success!==true||json.result==null)throw Error('Cloudflare API returned non-success result');
  return json;
 }
 async function versions(){
  const json=await request('GET',vPath);
  if(!Array.isArray(json.result)||json.result.length>100||
     (Number.isInteger(json.result_info?.total_count)&&json.result_info.total_count>json.result.length))
   throw Error('Cloudflare Worker version list incomplete');
  return json.result;
 }
 async function active(){
  const json=await request('GET',dPath);
  const list=Array.isArray(json.result?.deployments)?json.result.deployments:
    (Array.isArray(json.result)?json.result:null);
  if(!list?.length)throw Error('Cloudflare active deployment unavailable');
  const ordered=[...list].sort((a,b)=>Date.parse(b.created_on)-Date.parse(a.created_on));
  const newest=ordered[0];
  if(!UUID.test(newest.id||'')||Number.isNaN(Date.parse(newest.created_on))||
     (ordered.length>1&&newest.created_on===ordered[1].created_on)||
     newest.versions?.length!==1||newest.versions[0].percentage!==100||
     !UUID.test(newest.versions[0].version_id||''))
   throw Error('Cloudflare production deployment ambiguous');
  return {deploymentId:newest.id,versionId:newest.versions[0].version_id};
 }
 async function promote(versionId,reason){
  if(!UUID.test(versionId||'')||typeof reason!=='string'||reason.length>250)
   throw Error('invalid target Worker version or release annotation');
  const body={strategy:'percentage',versions:[{version_id:versionId,percentage:100}],
   annotations:{'workers/message':reason}};
  const json=await request('POST',dPath,body);
  const parts=json.result.versions;
  if(!Array.isArray(parts)||parts.length!==1||parts[0].version_id!==versionId||
     parts[0].percentage!==100)
   throw Error('Cloudflare API did not verify the deployed Worker Version ID');
  return json.result.id;
 }
 return Object.freeze({versions,active,promote});
}
function selectNewTaggedVersion(before,after,sha){
 if(!SHA.test(sha||'')||!Array.isArray(before)||!Array.isArray(after))
  throw Error('version snapshot or source SHA missing');
 const previous=new Set(before.map(x=>x.id));
 const matching=after.filter(x=>UUID.test(x?.id||'')&&!previous.has(x.id)&&
   x.annotations?.['workers/tag']==='draftai-'+sha);
 if(matching.length!==1)throw Error('new Worker Version not uniquely bound to Git commit SHA');
 return matching[0].id;
}
function previousVersionBelongsToCommit(versions,activeVersionId,sha,bootstrapVersionId){
 if(!SHA.test(sha||'')||!UUID.test(activeVersionId||''))return false;
 const list=versions.filter(x=>x?.id===activeVersionId);
 if(list.length!==1)return false;
 return list[0].annotations?.['workers/tag']==='draftai-'+sha ||
   (UUID.test(bootstrapVersionId||'')&&bootstrapVersionId===activeVersionId);
}
module.exports={WORKER,UUID,createCloudflareClient,selectNewTaggedVersion,previousVersionBelongsToCommit};
