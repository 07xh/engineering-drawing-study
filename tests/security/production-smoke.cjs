'use strict';
/**
 * Unprivileged, READ-ONLY post-deployment smoke checks. Never promotes versions.
 * The expectedHost must come from trusted deployment settings, not PR content.
 */
const {isIP}=require('node:net');
const CHECKS=Object.freeze([
 {path:'/',expect:200,html:true},
 {path:'/public-use.html',expect:200,html:true},
 {path:'/labs/point-coach.html',expect:200,html:true},
 {path:'/knowledge/index.html',expect:404},
 {path:'/labs/verified-exercises.js',expect:404},
 {path:'/labs/source-fidelity.html',expect:404},
 {path:'/core/contracts/problem.js',expect:404},
 {path:'/tests/security/release-readiness.cjs',expect:404}
]);
function verifyOrigin(origin,expectedHost){
 if(typeof origin!=='string'||typeof expectedHost!=='string'||!expectedHost.trim())
  throw Error('trusted https origin and expected hostname required');
 let url;
 try{url=new URL(origin);}catch{throw Error('invalid production origin');}
 if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash||
    url.pathname!=='/'||url.port||url.hostname!==expectedHost)
  throw Error('production origin must be root HTTPS URL with exactly expected host');
 const host=url.hostname.toLowerCase();
 if(isIP(host)||host==='localhost'||host.endsWith('.localhost')||
    host.endsWith('.local')||host.endsWith('.internal')||!host.includes('.'))
  throw Error('local/private hostname is forbidden');
 return url.origin;
}
async function runProductionSmoke({origin,expectedHost,fetchImpl=globalThis.fetch,timeoutMs=7000}={}){
 const base=verifyOrigin(origin,expectedHost);
 if(typeof fetchImpl!=='function'||!Number.isInteger(timeoutMs)||timeoutMs<100||timeoutMs>30000)
  throw Error('invalid read-only fetch or timeout');
 const checks=[];
 for(const item of CHECKS){
  const address=base+item.path;
  try{
   const response=await fetchImpl(address,{
    method:'GET',redirect:'manual',cache:'no-store',credentials:'omit',
    signal:AbortSignal.timeout(timeoutMs),headers:{accept:item.html?'text/html':'*/*'}
   });
   const status=response?.status;
   const finalUrl=response?.url;
   const contentType=response?.headers?.get?.('content-type')||'';
   const matchUrl=!finalUrl||finalUrl===address;
   const pass=matchUrl&&status===item.expect&&(!item.html||/\btext\/html\b/i.test(contentType));
   checks.push({path:item.path,expected:item.expect,status:Number.isInteger(status)?status:null,ok:pass,
    error:!matchUrl?'unexpected response URL':(!pass?'unexpected status or content-type':null)});
  }catch(error){checks.push({path:item.path,expected:item.expect,status:null,ok:false,
   error:'request failed: '+String(error?.name||'Error')});}
 }
 return {ok:checks.length===CHECKS.length&&checks.every(x=>x.ok),origin:base,checks};
}
if(require.main===module){
 const origin=process.env.DRAFTAI_PRODUCTION_ORIGIN;
 const expectedHost=process.env.DRAFTAI_PRODUCTION_HOST;
 runProductionSmoke({origin,expectedHost}).then(result=>{
  for(const check of result.checks)console.log((check.ok?'PASS ':'FAIL ')+check.path+' expected='+check.expected+' actual='+check.status);
  if(!result.ok)process.exitCode=1;
 }).catch(error=>{console.error('BLOCK:',error.message);process.exitCode=2;});
}
module.exports={CHECKS,verifyOrigin,runProductionSmoke};
