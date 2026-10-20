'use strict';
/* Regression guard: partial textbook scans are never promoted to published answers. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const load=(path,name)=>{
 const context={};vm.runInNewContext(fs.readFileSync(path,'utf8'),context,{filename:path});
 assert(context[name],name+' missing');return context[name];
};
const source=load('labs/verified-exercises.js','VerifiedExerciseGeometry');
const audit=load('labs/source-fidelity-audit.js','ChapterFidelityAudit');
const expected=Object.entries({'2-6':6,'2-7':6,'2-8':8,'2-9':8})
 .flatMap(([group,count])=>Array.from({length:count},(_,i)=>group+'-'+(i+1)));
assert.deepEqual(Array.from(source.ids).sort(),expected.sort(),'exercise source identifiers drifted');
assert.deepEqual(Array.from(audit.ids).sort(),expected.sort(),'audit identifiers drifted');
const reports=audit.scan(id=>source.get(id));
assert.equal(reports.length,28);
for(const report of reports){
 const item=source.get(report.id);
 assert(item&&item.status==='partial','unreviewed exercise was promoted: '+report.id);
 assert(report.blockers>0,'unreviewed exercise has no source blocker: '+report.id);
 assert.equal(report.solutionAvailable,false,'unverified answer unlocked: '+report.id);
 assert(report.findings.some(x=>x.code==='partial-source'),'partial source warning missing: '+report.id);
 assert(report.findings.some(x=>x.code==='source-fingerprint'),'missing scan fingerprint must block: '+report.id);
 assert(report.findings.some(x=>x.code==='coordinate-audit'),'unverified coordinates must block: '+report.id);
 assert(report.findings.some(x=>x.code==='visibility-audit'),'unverified visibility must block: '+report.id);
 assert(report.findings.some(x=>x.code==='proof-audit'),'unverified proof must block: '+report.id);
}
const summary=audit.totals(reports);
assert.equal(summary.tasks,28);assert.equal(summary.partial,28);
assert.equal(summary.blocked,28);
assert.equal(summary.missing,0);
console.log('PASS: all 28 textbook exercises remain source-partial and answer-locked; missing scan, coordinates, visibility and proof block publication.');
