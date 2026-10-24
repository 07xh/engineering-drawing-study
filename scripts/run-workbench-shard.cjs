'use strict';
/* Deterministic complete partition of tests/workbench/*.test.cjs.
 * No tests may be filtered by feature or name. 4 independent workers
 * each run real node --test. Fail closed on invalid source inventory.
 */
const fs=require('node:fs');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const ROOT=path.resolve(__dirname,'..');
const DIR=path.join(ROOT,'tests/workbench');
const DEFAULT_SHARDS=4;
function inventory(){
 const files=fs.readdirSync(DIR,{withFileTypes:true})
  .filter(f=>f.name.endsWith('.test.cjs'))
  .sort((a,b)=>a.name.localeCompare(b.name));
 if(files.length===0)throw new Error('workbench test suite missing');
 return files.map(item=>{
  if(!item.isFile())throw new TypeError('not a regular test file: '+item.name);
  const file='tests/workbench/'+item.name;
  const bytes=fs.statSync(path.join(DIR,item.name)).size;
  if(!Number.isSafeInteger(bytes)||bytes<=0)
   throw new TypeError('invalid or empty workbench test: '+file);
  return {file,bytes};
 });
}
function partition(files,count=DEFAULT_SHARDS){
 if(!Number.isSafeInteger(count)||count<1||count>8||
    !Array.isArray(files)||files.length<count)
  throw new RangeError('invalid workbench test count or shards');
 const seen=new Set();
 const items=files.map(entry=>{
  if(!entry||typeof entry.file!=='string'||
     !/^tests\/workbench\/[a-zA-Z0-9._-]+\.test\.cjs$/.test(entry.file)||
     !Number.isSafeInteger(entry.bytes)||entry.bytes<=0||
     seen.has(entry.file))
   throw new TypeError('invalid or duplicate workbench test');
  seen.add(entry.file);
  return {file:entry.file,bytes:entry.bytes};
 }).sort((a,b)=>b.bytes-a.bytes||a.file.localeCompare(b.file));
 const buckets=Array.from({length:count},()=>({bytes:0,files:[]}));
 for(const item of items){
  let target=0;
  for(let i=1;i<count;i++)
   if(buckets[i].bytes<buckets[target].bytes||
      (buckets[i].bytes===buckets[target].bytes&&
       buckets[i].files.length<buckets[target].files.length))
    target=i;
  buckets[target].files.push(item.file);
  buckets[target].bytes+=item.bytes;
 }
 return buckets.map(b=>({bytes:b.bytes,files:b.files.slice().sort()}));
}
function parseIndex(value,name){
 if(typeof value!=='string'||!/^(0|[1-9][0-9]*)$/.test(value)||
    !Number.isSafeInteger(Number(value)))
  throw new RangeError('invalid '+name);
 return Number(value);
}
function runCli(argv=process.argv.slice(2)){
 if(argv.length!==2)throw new TypeError('usage: run-workbench-shard.cjs <index> <total>');
 const index=parseIndex(argv[0],'shard'),total=parseIndex(argv[1],'total');
 if(total!==DEFAULT_SHARDS||index>=total)
  throw new RangeError('unsupported or out-of-range shard');
 const all=inventory(),buckets=partition(all,total);
 const actual=buckets.flatMap(b=>b.files),assigned=buckets[index].files;
 if(!assigned.length||actual.length!==all.length||
    new Set(actual).size!==all.length)
  throw new Error('missing or duplicated workbench files');
 process.stdout.write('Shard '+(index+1)+'/'+total+': '+assigned.length+
  ' of '+all.length+' files ('+buckets[index].bytes+' bytes)\n');
 const result=spawnSync(process.execPath,['--test',...assigned],{
  cwd:ROOT,stdio:'inherit',env:process.env
 });
 if(result.error)throw result.error;
 if(result.signal||result.status!==0)
  throw new Error('workbench shard '+index+' failed');
 return {count:assigned.length,total:all.length};
}
if(require.main===module){
 try{runCli();}
 catch(err){
  process.stderr.write('WORKBENCH SHARD ERROR: '+err.message+'\n');
  process.exitCode=1;
 }
}
module.exports={inventory,partition,parseIndex,runCli,DEFAULT_SHARDS};
