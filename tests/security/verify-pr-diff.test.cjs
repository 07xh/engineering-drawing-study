'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {verifyPullRequestDiff}=require('./verify-pr-diff.cjs');
const SHA='a'.repeat(40), BLOB='b'.repeat(40);
const patch='@@ -1,2 +1,2 @@\n-.nav {color:red}\n+.nav {color:blue}';
function sample(extra={}){
 const base={repository:'07xh/engineering-drawing-study',
  pullRequest:{base:{ref:'main'},head:{sha:SHA,repo:{full_name:'07xh/engineering-drawing-study'}},state:'open',draft:false,mergeable:true,changed_files:1},
  files:[{filename:'site-ui.css',sha:BLOB,status:'modified',additions:1,deletions:1,changes:2,patch}],filesComplete:true,
  headTree:{forCommitSha:SHA,truncated:false,tree:[{path:'site-ui.css',sha:BLOB,mode:'100644',type:'blob'}]}};
 return {...base,...extra};
}
function blocked(input,needle){const r=verifyPullRequestDiff(input);assert.equal(r.eligible,false);assert.equal(r.approvedFiles.length,0);assert(r.reasons.some(x=>x.includes(needle)),JSON.stringify(r));}
test('review-safe CSS edit only yields diff eligibility, not deployment authorization',()=>{
 const r=verifyPullRequestDiff(sample());assert.equal(r.eligible,true);assert.equal(r.status,'diff-only-eligible');assert.deepEqual(r.approvedFiles,['site-ui.css']);
});
test('unknown inputs fail closed',()=>{
 for(const value of [null,{},[],undefined])blocked(value,value&&typeof value==='object'&&!Array.isArray(value)?'invalid PR':'missing trusted');
});
test('missing pagination guarantees or omitted PR files fail',()=>{
 blocked(sample({filesComplete:false}),'incomplete');
 blocked(sample({files:[]}), 'incomplete');
 blocked(sample({files:[sample().files[0],sample().files[0]]}), 'incomplete');
});
test('wrong repo, feature branch, fork, draft, closed and merge-conflicted fail',()=>{
 blocked(sample({repository:'attacker/repo'}),'repository');
 for(const change of [{base:{ref:'develop'}},{head:{sha:SHA,repo:{full_name:'attacker/repo'}}},
   {draft:true},{state:'closed'},{mergeable:false}])blocked(sample({pullRequest:{...sample().pullRequest,...change}}),'invalid PR');
});
test('renamed and deleted CSS files fail even with an allowlisted final name',()=>{
 for(const p of [{status:'renamed',previous_filename:'internal/secret'}, {status:'removed'},{status:'added'}])
  blocked(sample({files:[{...sample().files[0],...p}]}),'non-allowlisted');
});
test('any non-CSS change or oversized edit fails',()=>{
 for(const f of [{filename:'wrangler.jsonc'},{filename:'core/contracts/problem.js'},{additions:25},{deletions:25},{changes:999}])
  blocked(sample({files:[{...sample().files[0],...f}]}),'non-allowlisted');
});
test('requires complete tree bound to exact PR head commit',()=>{
 blocked(sample({headTree:{...sample().headTree,truncated:true}}),'complete head');
 blocked(sample({headTree:{...sample().headTree,forCommitSha:'b'.repeat(40)}}),'complete head');
 blocked(sample({headTree:{...sample().headTree,tree:[]}}),'file missing');
});
test('symlink, gitlink and executable file modes are rejected',()=>{
 for(const entry of [{mode:'120000'},{mode:'100755'},{mode:'160000',type:'commit'}])
  blocked(sample({headTree:{...sample().headTree,tree:[{...sample().headTree.tree[0],...entry}]}}),'non-regular');
});
test('unknown or truncated patch cannot be approved',()=>{
 for(const p of [null,'', '+color:red', '@@ -1 +1 @@\n-color:red'])
  blocked(sample({files:[{...sample().files[0],patch:p}]}),'PR file patch');
});
test('remote CSS imports or URLs are flagged',()=>{
 for(const value of ['@import "https://evil.example/x";', '.x {background:url(https://elsewhere)}',
  '@font-face {src: url(http://example.com/x)}'])
  blocked(sample({files:[{...sample().files[0],patch:'@@ -1 +1 @@\n-color:red\n+'+value}]}),'CSS');
});
test('CSS expressions, hiding rules and escaping are flagged',()=>{
 for(const value of ['.x {display:none}', '.x {visibility:hidden}', '.x {opacity:0}',
  '.x {width:expression(alert(1))}', '.x {color:blu\\65}'])
  blocked(sample({files:[{...sample().files[0],patch:'@@ -1 +1 @@\n-color:red\n+'+value}]}),'CSS');
});
test('invalid PR SHA and incomplete patch change data always fail',()=>{
 blocked(sample({pullRequest:{...sample().pullRequest,head:{sha:'a',repo:{full_name:'07xh/engineering-drawing-study'}}}}),'invalid PR');
 blocked(sample({files:[{...sample().files[0],changes:null}]}),'non-allowlisted');
});
test('GitHub changed-line counts must match the full patch; truncated hunks block',()=>{
 blocked(sample({files:[{...sample().files[0],additions:2,deletions:1,changes:3}]}),'patch incomplete');
 blocked(sample({files:[{...sample().files[0],patch:'@@ -1 +1 @@\n+.nav {color:blue}',additions:1,deletions:1,changes:2}]}),'patch incomplete');
});
test('blob SHA in PR metadata must match the exact head tree',()=>{
 blocked(sample({files:[{...sample().files[0],sha:'c'.repeat(40)}]}),'non-regular');
 blocked(sample({headTree:{...sample().headTree,tree:[{...sample().headTree.tree[0],sha:'c'.repeat(40)}]}}),'non-regular');
});
