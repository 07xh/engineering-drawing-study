'use strict';
/**
 * Cloudflare Worker versions and deployments: exact documented APIs only.
 * Requires trusted service name and token. No PR job may access this module
 * with live Cloudflare credentials.
 *
 * Worker Versions: GET /accounts/:id/workers/workers/:worker/versions
 * Worker Deployments: GET|POST /accounts/:id/workers/scripts/:script/deployments
 * Version list uses the Workers Beta API because, unlike the legacy
 * Scripts Versions list, it exposes the "workers/tag" annotation used
 * for exact commit provenance. All unexpected shapes fail closed.
 */
const WORKER='engineering-drawing-study';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SHA=/^[0-9a-f]{40}$/;
const MAX_PAGES=10;
function createCloudflareClient({accountId,token,fetchImpl=globalThis.fetch}={}){
 if(!/^[0-9a-f]{32}$/i.test(accountId||'')||typeof token!=='string'||token.length<8||
    /[\r\n]/.test(token)||typeof fetchImpl!=='function')
  throw Error('Cloudflare production credentials or HTTP client unavailable');
 const prefix='https://api.cloudflare.com/client/v4/accounts/'+accountId+'/workers';
 const versionBase='/workers/'+WORKER+'/versions';
 const dPath='/scripts/'+WORKER+'/deployments';
 async function request(method,path,body){
  const versionPage=method==='GET'&&new RegExp('^'+versionBase.replaceAll('/','\\/')+'\\?per_page=100&page=(?:[1-9]|10)$').test(path);
  if(!versionPage&&!(path===dPath&&(method==='GET'||method==='POST')))
   throw Error('disallowed Cloudflare API request');
  let response;
  try{
   response=await fetchImpl(prefix+path,{method,redirect:'error',signal:AbortSignal.timeout(15000),
    headers:{authorization:'Bearer '+token,accept:'application/json',
     ...(method==='POST'?{'content-type':'application/json'}:{})},
    ...(body?{body:JSON.stringify(body)}:{})});
  }catch{throw Error('Cloudflare API transport failed')}
  if(response?.status!==200&&response?.status!==201)
   throw Error('Cloudflare API did not confirm success');
  let json;try{json=await response.json()}catch{throw Error('Cloudflare API JSON invalid')}
  if(json?.success!==true||json.result==null)throw Error('Cloudflare API returned non-success result');
  return json;
 }
 async function versions(){
  const all=[],seen=new Set();
  for(let page=1;page<=MAX_PAGES;page++){
   const json=await request('GET',versionBase+'?per_page=100&page='+page);
   const items=json.result;
   if(!Array.isArray(items)||items.length>100)throw Error('Cloudflare versions API response malformed');
   for(const v of items){
    if(!UUID.test(v?.id||'')||seen.has(v.id))
     throw Error('Cloudflare versions API returned invalid or repeated ID');
    seen.add(v.id);
    all.push(v);
   }
   const total=json.result_info?.total_count;
   if(total!==undefined&&(!Number.isSafeInteger(total)||total<all.length))
    throw Error('Cloudflare Worker version pagination invalid');
   if((total!==undefined&&all.length===total)||(items.length<100&&total===undefined))
    return all;
   if(items.length<100&&total!==undefined&&all.length<total)
    throw Error('Cloudflare Worker version page truncated');
  }
  throw Error('Cloudflare Worker version pagination exceeds safe limit');
 }
 async function active(){
  const json=await request('GET',dPath);
  // The documented Scripts Deployment API states that the first deployment
  // in result.deployments is the latest deployment serving traffic.
  const list=json.result?.deployments;
  if(!Array.isArray(list)||list.length<1)throw Error('Cloudflare active deployment unavailable');
  const newest=list[0];
  if(!UUID.test(newest?.id||'')||Number.isNaN(Date.parse(newest?.created_on))||
     !Array.isArray(newest.versions)||newest.versions.length!==1||
     newest.versions[0].percentage!==100||!UUID.test(newest.versions[0].version_id||''))
   throw Error('Cloudflare production deployment ambiguous');
  return {deploymentId:newest.id,versionId:newest.versions[0].version_id};
 }
 async function promote(versionId,reason){
  if(!UUID.test(versionId||'')||typeof reason!=='string'||reason.length>250)
   throw Error('invalid target Worker version or release annotation');
  const body={strategy:'percentage',versions:[{version_id:versionId,percentage:100}],
   annotations:{'workers/message':reason}};
  const json=await request('POST',dPath,body);
  const parts=json.result?.versions;
  if(!UUID.test(json.result?.id||'')||!Array.isArray(parts)||parts.length!==1||
     parts[0].version_id!==versionId||parts[0].percentage!==100)
   throw Error('Cloudflare API did not verify the deployed Worker Version ID');
  return json.result.id;
 }
 return Object.freeze({versions,active,promote});
}
function selectNewTaggedVersion(before,after,sha){
 if(!SHA.test(sha||'')||!Array.isArray(before)||!Array.isArray(after))
  throw Error('version snapshot or source SHA missing');
 const previous=new Set(before.map(x=>x.id));
 if(previous.has(undefined)||new Set(after.map(x=>x.id)).size!==after.length)
  throw Error('version snapshots are incomplete or duplicated');
 const matching=after.filter(x=>UUID.test(x?.id||'')&&!previous.has(x.id)&&
   x.annotations?.['workers/tag']==='draftai-'+sha);
 if(matching.length!==1)throw Error('new Worker Version not uniquely bound to Git commit SHA');
 return matching[0].id;
}
function previousVersionBelongsToCommit(versions,activeVersionId,sha,bootstrapVersionId){
 if(!SHA.test(sha||'')||!UUID.test(activeVersionId||'')||!Array.isArray(versions))return false;
 const list=versions.filter(x=>x?.id===activeVersionId);
 if(list.length!==1)return false;
 return list[0].annotations?.['workers/tag']==='draftai-'+sha ||
   (UUID.test(bootstrapVersionId||'')&&bootstrapVersionId===activeVersionId);
}
module.exports={WORKER,UUID,createCloudflareClient,selectNewTaggedVersion,previousVersionBelongsToCommit};
