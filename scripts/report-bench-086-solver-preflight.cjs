'use strict';
/**
 * Local-only command. Structured self-authored problem cases are passed
 * through the existing verified specialist -> V5 bridge, never a book scan.
 * Usage: node scripts/report-bench-086-solver-preflight.cjs [--json]
 */
const {runPreflight,asMarkdown}=
 require('../benchmark/solver-preflight-086.cjs');
if(require.main===module){
 const args=process.argv.slice(2);
 if(args.length>1||(args.length===1&&args[0]!=='--json')){
  process.stderr.write('usage: node scripts/report-bench-086-solver-preflight.cjs [--json]\n');
  process.exitCode=2;
 }else{
  const r=runPreflight();
  process.stdout.write(args[0]==='--json'
   ?JSON.stringify(r,null,2)+'\n':asMarkdown(r)+'\n');
  if(r.failed)process.exitCode=1;
 }
}
module.exports={runPreflight,asMarkdown};
