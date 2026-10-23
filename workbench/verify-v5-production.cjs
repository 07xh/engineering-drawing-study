'use strict';
/**
 * DA-07 V5 live DOF audit: exact published bytes, no Cloudflare credentials.
 *
 * Build the exact source revision first:
 *   npm ci && node scripts/build-static.cjs
 * Then:
 *   node workbench/verify-v5-production.cjs \
 *     --base-url https://drawing.0701000.xyz --dist dist --json
 *
 * Exit codes: 0 verified byte identity + private paths blocked,
 *             1 demonstrated mismatch/exposure,
 *             2 UNVERIFIED (network failure, missing build, timeout).
 * Neither GitHub CI nor this script independently establishes the Cloudflare
 * dashboard Active Deployment SHA, or real Android device interactions.
 */
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {validateOrigin}=require('../scripts/verify-production-learning-site.cjs');
const PUBLIC=Object.freeze([
 'labs/dof-lab-v2.html',
 'labs/dof-lab-v2-ui.js',
 'labs/dof-lab-three-bundle.js',
 'labs/dof-lab-geometry.js',
 'labs/dof-lab-visibility.js',
 'labs/dof-lab-sheet.js',
 'labs/dof-lab-state.js',
 'labs/dof-lab-spatial-svg.js',
 'labs/constraint-engine.js'
]);
const PRIVATE=Object.freeze([
 'workbench/dof-synchronized-reveal.cjs',
 'workbench/teaching-timeline-v5.js',
 'workbench/teaching-motion-v5.js',
 'labs/dof-lab-three-entry.js',
 'tests/workbench/dof-sync-v5.test.cjs',
 'tests/workbench/dof-sync-browser.test.cjs'
]);
const hash=buffer=>crypto.createHash('sha256').update(buffer).digest('hex');
async function readRemote(url,fetchImpl,timeoutMs,maxBytes){
 const controller=new AbortController();
 const timer=setTimeout(()=>controller.abort(),timeoutMs);
 try{
  const res=await fetchImpl(url,{method:'GET',redirect:'manual',
   signal:controller.signal,headers:{accept:'*/*'}});
  if(res.status!==200)return {status:res.status};
  if(!res.body)throw new Error('200 response has no streaming body');
  const reader=res.body.getReader();
  const chunks=[];let count=0;
  try{
   while(true){
    const item=await reader.read();
    if(item.done)break;
    count+=item.value.byteLength;
    if(count>maxBytes)throw new Error('remote response exceeds byte limit');
    chunks.push(Buffer.from(item.value));
   }
  }finally{reader.releaseLock()}
  return {status:200,bytes:Buffer.concat(chunks,count)};
 }finally{clearTimeout(timer)}
}
async function verifyV5({baseUrl,distDir='dist',fetchImpl=fetch,timeoutMs=9000,
 maxBytes=5*1024*1024,allowHttpLoopback=false}={}){
 const origin=validateOrigin(baseUrl,allowHttpLoopback);
 if(!Number.isSafeInteger(timeoutMs)||timeoutMs<100||timeoutMs>60000||
    !Number.isSafeInteger(maxBytes)||maxBytes<512||maxBytes>20*1024*1024)
  throw new TypeError('invalid bounded timeout or byte limit');
 const root=path.resolve(distDir);
 // The route constants are all fixed relative public paths. No untrusted
 // path or URL is ever interpolated into filesystem access.
 async function check(route,kind){
  const file=path.join(root,...route.split('/'));
  const url=new URL(route,origin);
  if(kind==='public'){
   if(!fs.existsSync(file)||!fs.statSync(file).isFile())
    return {route,kind,status:'unverified',reason:'exact local build file missing'};
   const bytes=fs.readFileSync(file);
   if(bytes.length>maxBytes)
    return {route,kind,status:'unverified',reason:'local file exceeds byte limit'};
   const localSha256=hash(bytes);
   try{
    const remote=await readRemote(url,fetchImpl,timeoutMs,maxBytes);
    if(remote.status===200){
     const remoteSha256=hash(remote.bytes),matches=localSha256===remoteSha256;
     return {route,kind,status:matches?'pass':'fail',reason:matches?
      'remote exact bytes match local V5 build':
      'remote bytes differ from local V5 build (stale deployment or edge rewrite)',
      localSha256,remoteSha256};
    }
    if([301,302,303,307,308,401,403,404,410].includes(remote.status))
     return {route,kind,status:'fail',httpStatus:remote.status,
      reason:'mandatory published V5 asset does not serve HTTP 200'};
    return {route,kind,status:'unverified',httpStatus:remote.status,
     reason:'unexpected HTTP status prevents asset attestation'};
   }catch(error){
    return {route,kind,status:'unverified',reason:'remote read failed: '+error.message};
   }
  }
  if(fs.existsSync(file))return {route,kind,status:'fail',
   reason:'private V5 source unexpectedly exists in dist'};
  try{
   const remote=await readRemote(url,fetchImpl,timeoutMs,maxBytes);
   if([401,403,404,410].includes(remote.status))
    return {route,kind,status:'pass',httpStatus:remote.status,
     reason:'private V5 source is blocked'};
   if(remote.status===200)return {route,kind,status:'fail',httpStatus:200,
    reason:'private route served HTTP 200; possible source exposure or soft-404'};
   return {route,kind,status:'unverified',httpStatus:remote.status,
    reason:'private V5 source not conclusively blocked'};
  }catch(error){
   return {route,kind,status:'unverified',reason:'private path could not be read: '+error.message};
  }
 }
 const checks=await Promise.all([
  ...PUBLIC.map(route=>check(route,'public')),
  ...PRIVATE.map(route=>check(route,'private'))
 ]);
 const overall=checks.some(item=>item.status==='fail')?'fail':
  checks.some(item=>item.status==='unverified')?'unverified':'pass';
 return {overall,origin:origin.origin,distDir:root,checks,
  scope:'V5 DOF page: 9 public exact assets and 6 forbidden private sources',
  note:'Verifies actual public bytes, not Cloudflare Active Deployment ID, Android pen interactions, or the other P0 learning pages. Run the independent R5 verifier for those.'};
}
function parseArgs(argv){
 const o={};
 for(let i=0;i<argv.length;i++){
  const arg=argv[i];
  if(arg==='--help')return {help:true};
  if(arg==='--json'){o.json=true;continue}
  if(arg==='--allow-http-loopback'){o.allowHttpLoopback=true;continue}
  const key={'--base-url':'baseUrl','--dist':'distDir','--timeout-ms':'timeoutMs'}[arg];
  if(!key||i+1>=argv.length)throw new TypeError('unknown or missing option: '+arg);
  const value=argv[++i];
  o[key]=key==='timeoutMs'?Number(value):value;
 }
 if(!o.baseUrl)throw new TypeError('explicit --base-url is required');
 return o;
}
async function main(argv){
 let options;
 try{options=parseArgs(argv)}catch(e){console.error(e.message);return 2}
 if(options.help){
  console.log('node workbench/verify-v5-production.cjs --base-url https://drawing.0701000.xyz --dist dist [--json] [--timeout-ms 9000]');
  return 0;
 }
 try{
  const report=await verifyV5(options);
  if(options.json)console.log(JSON.stringify(report,null,2));
  else{
   console.log('V5 DOF public deployment: '+report.overall.toUpperCase());
   for(const x of report.checks)console.log('['+x.status+'] '+x.route+': '+x.reason);
   console.log(report.note);
  }
  return report.overall==='pass'?0:report.overall==='fail'?1:2;
 }catch(e){console.error('UNVERIFIED: '+e.message);return 2}
}
if(require.main===module)
 main(process.argv.slice(2)).then(code=>{process.exitCode=code},
  e=>{console.error('UNVERIFIED: '+e.message);process.exitCode=2});
module.exports={PUBLIC,PRIVATE,verifyV5,parseArgs};
