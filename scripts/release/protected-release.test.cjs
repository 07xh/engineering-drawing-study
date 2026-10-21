'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {runProtectedRelease,uploadWithPinnedWrangler,waitForMainChecks}=require('./protected-release.cjs');
const SHA='1'.repeat(40),PREVIOUS='2'.repeat(40);
const {RULES_PATH}=require('./main-rules.cjs');
const RULES=[
 {type:'pull_request',parameters:{allowed_merge_methods:['squash'],required_approving_review_count:0}},
 {type:'non_fast_forward'},{type:'deletion'},{type:'required_linear_history'},
 {type:'required_status_checks',parameters:{strict_required_status_checks_policy:true,
 required_status_checks:[{context:'validate'},{context:'release-security'}]}}
];
const OLD='aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',NEW='bbbbbbbb-cccc-dddd-eeee-ffffffffffff';
const OLD_DEP='cccccccc-dddd-eeee-ffff-aaaaaaaaaaaa',NEW_DEP='dddddddd-eeee-ffff-aaaa-bbbbbbbbbbbb';
function fixture({smokeOk=true,failRollback=false,failUpload=false,protectedMain=true,activeOld=true}={}){
 let uploaded=false,active=activeOld?OLD:NEW,dep=OLD_DEP;const events=[];
 const cloudflare={
  active:async()=>{events.push('read-active');return {versionId:active,deploymentId:dep}},
  versions:async()=>{events.push('read-versions');return [{id:OLD,annotations:{'workers/tag':'draftai-'+PREVIOUS}},
   ...(uploaded?[{id:NEW,annotations:{'workers/tag':'draftai-'+SHA}}]:[])]},
  promote:async(id)=>{events.push('promote:'+id);if(failRollback&&id===OLD)throw Error('rollback failed');
   active=id;dep=NEW_DEP;return NEW_DEP}
 };
 const git={
  [RULES_PATH]:RULES,
  '/branches/main':{protected:protectedMain,commit:{sha:SHA}},
  ['/commits/'+SHA]:{sha:SHA,parents:[{sha:PREVIOUS}],files:[{
   filename:'site-ui.css',status:'modified',additions:1,deletions:1,changes:2,
   patch:'@@ -1 +1 @@\n-old {color:red}\n+new {color:blue}'}]},
  ['/commits/'+SHA+'/check-runs?per_page=100']:{total_count:2,check_runs:[
   {name:'release-security',head_sha:SHA,status:'completed',conclusion:'success'},
   {name:'validate',head_sha:SHA,status:'completed',conclusion:'success'}]}
 };
 return {events,cloudflare,read:async key=>git[key],
  upload:async()=>{events.push('upload');if(failUpload)throw Error('upload failed');uploaded=true},
  smoke:async()=>{events.push('smoke');return {ok:smokeOk}},
  manifest:()=>({sourceSha:SHA,assets:Array.from({length:40},()=>({})),digest:'a'.repeat(64)}),
  get active(){return active}};
}
function invoke(f,options={}){return runProtectedRelease({sha:SHA,enabled:true,
 read:f.read,cloudflare:f.cloudflare,upload:f.upload,smoke:f.smoke,manifest:f.manifest,
 origin:'https://draftai.example.org',expectedHost:'draftai.example.org',...options})}
test('trusted CSS-only commit runs upload, exact version activation and final smoke',async()=>{
 const f=fixture(),r=await invoke(f);
 assert.equal(r.status,'deployed-and-verified');assert.equal(r.versionId,NEW);
 assert.equal(r.previousVersionId,OLD);assert.equal(r.sourceSha,SHA);assert.equal(f.active,NEW);
 assert(f.events.includes('smoke'));
});
test('unsuccessful smoke attempts previous version rollback',async()=>{
 const f=fixture({smokeOk:false}),r=await invoke(f);
 assert.equal(r.status,'rolled-back');assert.equal(f.active,OLD);
 assert(f.events.includes('promote:'+NEW));assert(f.events.includes('promote:'+OLD));
});
test('failed rollback requires manual intervention, never claims success',async()=>{
 const f=fixture({smokeOk:false,failRollback:true}),r=await invoke(f);
 assert.equal(r.status,'manual-intervention');assert.equal(f.active,NEW);
});
test('disabled release switch blocks before any reads or upload',async()=>{
 const f=fixture(),r=await invoke(f,{enabled:false});
 assert.equal(r.status,'blocked');assert.deepEqual(f.events,[]);
});
test('unprotected main, stale production or upload failure block deployment',async()=>{
 for(const opts of [{protectedMain:false},{activeOld:false},{failUpload:true}]){
  const f=fixture(opts),r=await invoke(f);
  assert.equal(r.status,'blocked',JSON.stringify(r));
  assert.equal(f.events.filter(x=>x.startsWith('promote:')).length,0);
 }
});
test('candidate version must be uniquely uploaded and bound to exact source SHA',async()=>{
 const f=fixture();
 const r=await invoke(f,{upload:async()=>{}});
 assert.equal(r.status,'blocked');assert.equal(f.active,OLD);
});
test('missing artifact provenance prevents any upload',async()=>{
 const f=fixture();
 const r=await invoke(f,{manifest:()=>({sourceSha:SHA,assets:[]})});
 assert.equal(r.status,'blocked');assert.equal(f.events.includes('upload'),false);
});
test('Wrangler adapter never invokes shell or deploy command',()=>{
 let command,args,options;
 uploadWithPinnedWrangler({sha:SHA,spawn:(cmd,a,o)=>{command=cmd;args=a;options=o;return {status:0}}});
 assert.equal(command,'npx');assert.equal(options.shell,false);assert.equal(args.includes('deploy'),false);
 assert.deepEqual(args.slice(0,3),['--yes','wrangler@4.149.0','versions']);
 assert(args.includes('upload'));assert(args.includes('draftai-'+SHA));
 assert.throws(()=>uploadWithPinnedWrangler({sha:'bad',spawn:()=>({status:0})}));
});
test('required checks eventually green; nonpending failure blocks',async()=>{
 const f=fixture();const value=await waitForMainChecks({sha:SHA,read:f.read,tries:1});
 assert.equal(value.ok,true);
 const broken=fixture({protectedMain:false});
 await assert.rejects(()=>waitForMainChecks({sha:SHA,read:broken.read,tries:1}));
});

test('other writer deploying same version cannot be overwritten by our rollback',async()=>{
 const f=fixture({smokeOk:false});
 let rollbacks=0,activeCall=0;
 const fake={
  ...f.cloudflare,
  active:async()=>{
   const state=await f.cloudflare.active();
   activeCall++;
   // after our promotion, an external writer created a new deployment
   // pointing at exactly the SAME Worker Version ID.
   if(activeCall>=3&&state.versionId===NEW)
    return {versionId:NEW,deploymentId:'eeeeeeee-ffff-aaaa-bbbb-cccccccccccc'};
   return state;
  },
  promote:async(id,message)=>{
   if(id===OLD)rollbacks++;
   return f.cloudflare.promote(id,message);
  }
 };
 const result=await invoke(f,{cloudflare:fake});
 assert.equal(result.status,'manual-intervention');
 assert.equal(rollbacks,0);
 assert.equal(f.active,NEW);
});
test('lost deployment-POST confirmation never rolls back an unverified deployment ID',async()=>{
 const f=fixture({smokeOk:true});
 let called=0;
 const fake={...f.cloudflare,promote:async(id,msg)=>{
   called++;
   await f.cloudflare.promote(id,msg);
   throw Error('network acknowledgement lost');
 }};
 const result=await invoke(f,{cloudflare:fake});
 assert.equal(result.status,'manual-intervention');
 assert.equal(called,1);
 assert.equal(f.active,NEW);
});
test('wrong deployment ID on final smoke verification fails closed',async()=>{
 const f=fixture();
 let reads=0,rollbacks=0;
 const fake={...f.cloudflare,active:async()=>{
   const current=await f.cloudflare.active();
   reads++;
   if(reads>=3&&current.versionId===NEW)
    return {versionId:NEW,deploymentId:'eeeeeeee-ffff-aaaa-bbbb-cccccccccccc'};
   return current;
 },promote:async(id,msg)=>{
   if(id===OLD)rollbacks++;
   return f.cloudflare.promote(id,msg);
 }};
 const result=await invoke(f,{cloudflare:fake});
 assert.equal(result.status,'manual-intervention');
 assert.equal(rollbacks,0);
});
