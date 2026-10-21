'use strict';
/**
 * Unprivileged CI entrypoint: run every audited security test and validate the
 * packaged dist directory. Does NOT install, merge, approve or deploy.
 * The trusted CI must build dist first and must not expose production secrets.
 */
const fs=require('node:fs');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const TEST_NAMES=Object.freeze([
 'audit-public-dist.test.cjs','production-smoke.test.cjs','release-plan.test.cjs',
 'release-readiness.test.cjs','verify-pr-diff.test.cjs','security-ci-gate.test.cjs'
]);
function securityCiGate({root=path.resolve(__dirname,'../..'),spawn=spawnSync,audit}={}){
 const blocked=[];
 let canonical;
 try{canonical=fs.realpathSync(root);}catch{return {ok:false,status:'blocked',reasons:['repository root inaccessible']};}
 const dist=path.join(canonical,'dist'),folder=path.join(canonical,'tests','security');
 for(const name of TEST_NAMES){
  try{const st=fs.lstatSync(path.join(folder,name));if(!st.isFile()||st.isSymbolicLink())blocked.push('missing or non-regular security test: '+name);}
  catch{blocked.push('missing or non-regular security test: '+name);}
 }
 try{const stat=fs.lstatSync(dist);if(!stat.isDirectory()||stat.isSymbolicLink())blocked.push('dist is missing, symlink or not a directory');}
 catch{blocked.push('dist is missing, symlink or not a directory');}
 if(blocked.length)return {ok:false,status:'blocked',reasons:blocked};
 const paths=TEST_NAMES.map(name=>path.join(folder,name));
 let run;
 try{run=spawn(process.execPath,['--test',...paths],{
  cwd:canonical,encoding:'utf8',timeout:120000,maxBuffer:8*1024*1024,
  env:{PATH:process.env.PATH||'',HOME:process.env.HOME||'',TMPDIR:process.env.TMPDIR||'/tmp',LANG:'C.UTF-8',CI:'true',NODE_ENV:'test'}
 });}
 catch(error){return {ok:false,status:'blocked',reasons:['security tests failed to start: '+String(error.name||'Error')]};}
 if(run?.error||run?.signal||run?.status!==0)
  return {ok:false,status:'blocked',reasons:['security unit tests did not pass'],testStatus:run?.status??null};
 let artifact;
 try{artifact=typeof audit==='function'?audit(dist):require('./audit-public-dist.cjs').auditPublicDist(dist);}
 catch(error){return {ok:false,status:'blocked',reasons:['artifact inventory audit failed to execute: '+String(error.name||'Error')]};}
 if(!artifact||artifact.ok!==true)return {ok:false,status:'blocked',reasons:['public artifact inventory did not pass',...(artifact?.errors||[])]};
 return {ok:true,status:'local-build-security-pass-only',securityTestFiles:TEST_NAMES.length,
  publishedAssetFiles:artifact.files?.length??null};
}
if(require.main===module){
 const result=securityCiGate();
 console.log(JSON.stringify(result,null,2));
 if(!result.ok)process.exitCode=1;
}
module.exports={TEST_NAMES,securityCiGate};
