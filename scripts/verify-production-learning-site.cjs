'use strict';
/**
 * DraftAI 09/R5 - independently compare *real remote bytes* with the exact
 * local public build. GitHub Actions success is NOT production attestation.
 *
 * Usage (after npm install && node scripts/build-static.cjs):
 * node scripts/verify-production-learning-site.cjs \
 *   --base-url https://drawing.0701000.xyz --dist dist
 *
 * Exit: 0 exact match + private routes blocked; 1 mismatch/unsafe exposure;
 * 2 unverified (network error, unexpected response, local build unavailable).
 * Never writes to remote or consumes credentials.
 */
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const PUBLIC=Object.freeze([
 'index.html',
 'labs/point-projection-live.html',
 'labs/point-projection-live-bundle.js',
 'labs/circle-fillet-live.html',
 'labs/circle-fillet-live-bundle.js'
]);
const PRIVATE=Object.freeze([
 'scripts/build-static.cjs',
 'labs/circle-fillet-live-entry.cjs',
 'labs/point-projection-live-entry.cjs',
 'workbench/verified-student-fillet-progress.cjs',
 'tests/workbench/verified-student-fillet-progress.test.cjs',
 'knowledge/textbook-page-audit.js'
]);
const sha=buffer=>crypto.createHash('sha256').update(buffer).digest('hex');
function validateOrigin(raw,allowHttpLoopback=false){
 let url;
 try{url=new URL(raw)}catch{throw new TypeError('explicit absolute production URL required')}
 const loopback=url.hostname==='localhost'||url.hostname==='127.0.0.1'||url.hostname==='[::1]';
 if(url.protocol!=='https:'&&!(allowHttpLoopback&&loopback&&url.protocol==='http:'))
  throw new TypeError('HTTPS origin required (only explicitly allowed loopback may use HTTP)');
 if(url.username||url.password||url.search||url.hash||
    !['','/'].includes(url.pathname))
  throw new TypeError('only a host-root origin without credentials or query is accepted');
 return url;
}
async function getBounded(url,{fetchImpl,timeoutMs,maxBytes}){
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeoutMs);
 try{
  const response=await fetchImpl(url,{method:'GET',redirect:'manual',
   signal:controller.signal,headers:{accept:'*/*'}});
  const status=response.status;
  if(status!==200)return {status};
  if(!response.body)throw new Error('remote 200 response has no body');
  const reader=response.body.getReader();
  const parts=[];let total=0;
  try{
   while(true){
    const {done,value}=await reader.read();
    if(done)break;
    total+=value.byteLength;
    if(total>maxBytes)throw new Error('remote response exceeds byte limit');
    parts.push(Buffer.from(value));
   }
  }finally{reader.releaseLock()}
  return {status,bytes:Buffer.concat(parts,total)};
 }finally{clearTimeout(timer)}
}
async function verifyProduction({
 baseUrl,distDir='dist',fetchImpl=fetch,
 timeoutMs=10000,maxBytes=5*1024*1024,allowHttpLoopback=false
}={}){
 const origin=validateOrigin(baseUrl,allowHttpLoopback);
 if(!Number.isSafeInteger(timeoutMs)||timeoutMs<100||timeoutMs>60000||
    !Number.isSafeInteger(maxBytes)||maxBytes<512||maxBytes>20*1024*1024)
  throw new TypeError('bounded timeout and maximum response size required');
 const root=path.resolve(distDir);
 const checks=[];
 const push=(route,expected,status,reason,metadata={})=>
  checks.push({route,expected,status,reason,...metadata});
 for(const route of PUBLIC){
  const file=path.join(root,...route.split('/'));
  if(!fs.existsSync(file)||!fs.statSync(file).isFile()){
   push(route,'public','unverified','local public build file missing');
   continue;
  }
  const expected=fs.readFileSync(file);
  if(expected.byteLength>maxBytes){
   push(route,'public','unverified','local built file exceeds byte limit');
   continue;
  }
  const digest=sha(expected);
  try{
   const remote=await getBounded(new URL(route,origin),{fetchImpl,timeoutMs,maxBytes});
   if(remote.status===200){
    const liveDigest=sha(remote.bytes);
    push(route,'public',liveDigest===digest?'pass':'fail',
     liveDigest===digest?'remote bytes match the local built artifact':
      'remote bytes differ from this local build (could be stale deploy or CDN transformation)',
     {localSha256:digest,remoteSha256:liveDigest});
   }else if([301,302,303,307,308,401,403,404].includes(remote.status)){
    push(route,'public','fail','required public resource not served as HTTP 200',
     {httpStatus:remote.status});
   }else{
    push(route,'public','unverified','unexpected status prevents confirming current artifact',
     {httpStatus:remote.status});
   }
  }catch(error){push(route,'public','unverified','remote read failed: '+error.message)}
 }
 for(const route of PRIVATE){
  const local=path.join(root,...route.split('/'));
  if(fs.existsSync(local)){
   push(route,'private','fail','non-public source unexpectedly exists in local dist');
   continue;
  }
  try{
   const remote=await getBounded(new URL(route,origin),{fetchImpl,timeoutMs,maxBytes});
   if([401,403,404,410].includes(remote.status))
    push(route,'private','pass','private path is not publicly served',{httpStatus:remote.status});
   else if(remote.status===200)
    push(route,'private','fail',
     'private pathname returns HTTP 200: investigate source exposure or soft-404 fallback',
     {httpStatus:200});
   else
    push(route,'private','unverified','private pathname not conclusively blocked',
     {httpStatus:remote.status});
  }catch(error){push(route,'private','unverified','private-path request failed: '+error.message)}
 }
 const overall=checks.some(c=>c.status==='fail')?'fail':
  checks.some(c=>c.status==='unverified')?'unverified':'pass';
 return {overall,origin:origin.origin,distDir:root,
  scope:'five real public resources, six prohibited source/test/教材 resources',
  note:'Exact byte identity attests content equality only; not Android stylus, browser interactions, or Cloudflare dashboard active deployment SHA.',
  checks};
}
function parseArgs(argv){
 const opts={};
 for(let i=0;i<argv.length;i++){
  const arg=argv[i];
  if(arg==='--help')return {help:true};
  if(arg==='--allow-http-loopback'){opts.allowHttpLoopback=true;continue}
  if(arg==='--json'){opts.json=true;continue}
  const key={'--base-url':'baseUrl','--dist':'distDir',
   '--timeout-ms':'timeoutMs'}[arg];
  if(!key||i+1>=argv.length)throw new TypeError('unknown or missing argument: '+arg);
  const value=argv[++i];
  opts[key]=key==='timeoutMs'?Number(value):value;
 }
 if(!opts.baseUrl)throw new TypeError('--base-url is required; no implicit production verification');
 return opts;
}
async function main(argv){
 let opts;
 try{opts=parseArgs(argv)}catch(e){console.error(e.message);return 2}
 if(opts.help){
  console.log('node scripts/verify-production-learning-site.cjs --base-url https://drawing.0701000.xyz --dist dist [--json] [--timeout-ms 10000]');
  return 0;
 }
 let report;
 try{report=await verifyProduction(opts)}
 catch(e){console.error('UNVERIFIED: '+e.message);return 2}
 if(opts.json)console.log(JSON.stringify(report,null,2));
 else{
  console.log('R5 production asset verification: '+report.overall.toUpperCase());
  for(const x of report.checks)console.log(
   '['+x.status.toUpperCase()+'] '+x.route+' ('+x.expected+'): '+x.reason);
  console.log(report.note);
 }
 return report.overall==='pass'?0:report.overall==='fail'?1:2;
}
if(require.main===module)main(process.argv.slice(2)).then(code=>{process.exitCode=code},
 error=>{console.error('UNVERIFIED: '+error.message);process.exitCode=2});
module.exports={PUBLIC,PRIVATE,validateOrigin,verifyProduction,parseArgs};
