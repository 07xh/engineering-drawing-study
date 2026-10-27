'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {inventory,partition,parseIndex,DEFAULT_SHARDS}=
 require('../../scripts/run-workbench-shard.cjs');
const yml=fs.readFileSync(path.resolve(__dirname,'../../.github/workflows/workbench.yml'),'utf8');
test('all actual full workbench tests appear in exactly one of four shards',()=>{
 const files=inventory(),buckets=partition(files,DEFAULT_SHARDS);
 const total=buckets.flatMap(b=>b.files);
 assert.ok(files.length>100);
 assert.equal(total.length,files.length);
 assert.deepEqual(total.sort(),files.map(f=>f.file).sort());
 assert.equal(new Set(total).size,files.length);
 assert.ok(buckets.every(b=>b.files.length>0&&b.bytes>0));
 assert.equal(buckets.reduce((s,b)=>s+b.bytes,0),
  files.reduce((s,f)=>s+f.bytes,0));
});
test('4-way byte-size partition is deterministic despite input ordering',()=>{
 const files=inventory(),a=partition(files,4);
 assert.deepEqual(partition(files.slice().reverse(),4),a);
 const maximum=Math.max(...files.map(f=>f.bytes));
 const sums=a.map(b=>b.bytes);
 assert.ok(Math.max(...sums)-Math.min(...sums)<=maximum);
});
test('invalid source, holes, duplicates and unexpected shard configurations fail closed',()=>{
 assert.throws(()=>partition([{file:'tests/workbench/a.test.cjs',bytes:1}],2));
 assert.throws(()=>partition([
  {file:'tests/workbench/a.test.cjs',bytes:1},
  {file:'tests/workbench/a.test.cjs',bytes:2}
 ],2));
 assert.throws(()=>partition([
  {file:'../steal.test.cjs',bytes:1},
  {file:'tests/workbench/b.test.cjs',bytes:1}
 ],2));
 for(const bad of ['','-1','1.4','a','Infinity','9007199254740992'])
  assert.throws(()=>parseIndex(bad,'index'));
 assert.throws(()=>partition(inventory(),0));
 assert.throws(()=>partition(inventory(),9));
});
test('stable required workbench aggregate fails on ANY shard failure',()=>{
 assert.match(yml,/name: DraftAI workbench checks/);
 assert.match(yml,/fail-fast: false/);
 assert.match(yml,/shard: \[0, 1, 2, 3\]/);
 assert.match(yml,/node scripts\/run-workbench-shard\.cjs/);
 assert.match(yml,/^  workbench:/m);
 assert.match(yml,/needs: \\[workbench-shard, native-occt-c2\\]/);
 assert.match(yml,/needs\\.native-occt-c2\\.result.*!=.*success/);
 assert.match(yml,/DRAFTAI_REQUIRE_NATIVE_OCCT: '1'/);
 assert.match(yml,/cadquery-ocp==7\\.9\\.3\\.1\\.1/);
 assert.match(yml,/if: \$\{\{ always\(\) \}\}/);
 assert.match(yml,/needs\.workbench-shard\.result.*!=.*success/);
 assert.match(yml,/exit 1/);
 assert.doesNotMatch(yml,/continue-on-error: true/);
 assert.doesNotMatch(yml,/paths-ignore:/);
});
