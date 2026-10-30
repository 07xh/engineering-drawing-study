'use strict';
const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');
test('main tool headings describe the task without implementation version names',()=>{
 for(const page of ['circle-fillet-live','cone-cut-live','cylinder-cut-live','prism-cut-live']){
  const html=fs.readFileSync('labs/'+page+'.html','utf8');
  const headings=[...html.matchAll(/<h[123][^>]*>([\s\S]*?)<\/h[123]>/g)].map(m=>m[1].replace(/<[^>]*>/g,''));
  assert.doesNotMatch(headings.join(' '),/V5|真实数学实验|实验室/,page);
 }
});
