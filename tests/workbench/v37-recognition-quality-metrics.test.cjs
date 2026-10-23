'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {evaluateRecognitionProposals:evaluate}=
 require('../../recognition/recognition-quality-metrics.cjs');
const img={width:400,height:300};
const line=(id,from,to)=>({id,kind:'line',coordinateSpace:'original-image-px',from,to});
const circle=(id,x,y,r)=>({id,kind:'circle',coordinateSpace:'original-image-px',
 center:{x,y},radius:r});
const dim=(id,x,y,label)=>({id,kind:'dimension',
 coordinateSpace:'original-image-px',bbox:[x,y,60,22],text:label});
const arrow=(id,x,y)=>({id,kind:'arrow',coordinateSpace:'original-image-px',tip:{x,y}});
const sample=(truth,predictions)=>({image:img,truth,predictions});
test('exact detections, line direction invariance and error accounting',()=>{
 const a=line('reference',{x:20,y:30},{x:170,y:30});
 const b=line('prediction',{x:170,y:30},{x:20,y:30});
 const out=evaluate(sample([a],[b]));
 assert.equal(out.byKind.line.tp,1);
 assert.equal(out.byKind.line.fp,0);assert.equal(out.byKind.line.fn,0);
 assert.equal(out.micro.precision,1);assert.equal(out.micro.recall,1);
 assert.equal(out.micro.f1,1);assert.equal(out.macroF1,1);
 assert.equal(out.matches[0].residualPx,0);
 assert.equal(out.qualityIsNotMathProof,true);
});
test('each prediction matches at most one annotation, duplicate detections count as FP',()=>{
 const truth=[circle('c1',100,100,35)];
 const predictions=[circle('p1',100,100,35),circle('p2',102,100,35)];
 const result=evaluate(sample(truth,predictions));
 assert.deepEqual(result.byKind.circle,{tp:1,fp:1,fn:0,
  precision:.5,recall:1,f1:2/3});
 assert.equal(result.unmatchedPredictions.length,1);
});
test('no matches gives F1 zero, not a falsely missing/undefined score',()=>{
 const result=evaluate(sample([circle('c1',100,100,30)],[]));
 assert.equal(result.byKind.circle.tp,0);
 assert.equal(result.byKind.circle.fn,1);
 assert.equal(result.byKind.circle.precision,null);
 assert.equal(result.byKind.circle.recall,0);
 assert.equal(result.byKind.circle.f1,0);
 assert.equal(result.macroF1,0);
 assert.equal(result.micro.f1,0);
});
test('a maximum-cardinality augmenting path avoids greedy double matching',()=>{
 const truth=[circle('a',101,80,20),circle('b',111,80,20)];
 const predicted=[circle('p',105,80,20),circle('q',95,80,20)];
 const result=evaluate(sample(truth,predicted),{circleTolerancePx:9});
 // a can match p or q; b only p. Greedy nearest-first can lose b.
 assert.equal(result.byKind.circle.tp,2);
 assert.deepEqual(new Set(result.matches.map(x=>x.truthId)),new Set(['a','b']));
});
test('dimension correctness requires original image text and localized bbox',()=>{
 const expected=[dim('r8',60,70,'R8'),dim('phi',200,70,'Φ20')];
 const guesses=[dim('pred1',60,70,'R8'),dim('pred2',200,70,'Φ26')];
 const report=evaluate(sample(expected,guesses));
 assert.equal(report.byKind.dimension.tp,1);
 assert.equal(report.byKind.dimension.fp,1);
 assert.equal(report.byKind.dimension.fn,1);
 assert.deepEqual(report.unmatchedTruth,[{kind:'dimension',id:'phi'}]);
});
test('circle, arc and arrow are evaluated separately and with bounded px distances',()=>{
 const truth=[
  circle('circle1',120,140,25),
  {...circle('arc1',220,120,35),kind:'arc',coverageDeg:120},
  arrow('arrow1',50,200)
 ];
 const guesses=[
  circle('circlep',122,140,26),
  {...circle('arcp',218,123,35),kind:'arc',coverageDeg:220},
  arrow('arrowp',53,204)
 ];
 const report=evaluate(sample(truth,guesses));
 assert.equal(report.byKind.circle.tp,1);
 assert.equal(report.byKind.arc.tp,0);
 assert.equal(report.byKind.arc.fn,1);
 assert.equal(report.byKind.arrow.tp,1);
});
test('empty case does not claim 100% accuracy; no geometry evidence implies math proof',()=>{
 const report=evaluate(sample([],[]));
 assert.equal(report.micro.precision,null);
 assert.equal(report.micro.recall,null);
 assert.equal(report.micro.f1,null);
 assert.equal(report.macroF1,null);
 assert.equal(report.matches.length,0);
});
test('invalid units, duplicate IDs, bounds and excessive records fail closed',()=>{
 const ref=line('line_a',{x:10,y:10},{x:60,y:10});
 assert.throws(()=>evaluate(sample([ref,ref],[])),/duplicate/);
 assert.throws(()=>evaluate(sample([{...ref,coordinateSpace:'mm'}],[])),/original-image/);
 assert.throws(()=>evaluate(sample([line('bad',{x:10,y:10},{x:410,y:10})],[])));
 assert.throws(()=>evaluate(sample([],Array(201).fill(ref))));
 assert.throws(()=>evaluate(sample([dim('txt',399,10,'R8')],[])));
 assert.throws(()=>evaluate(sample([],[]),{lineTolerancePx:Infinity}));
 assert.throws(()=>evaluate(sample([],[]),{minTextIoU:-1}));
});
test('metrics do not silently call OCR, modify geometry or write a SolverResult',()=>{
 const fs=require('node:fs');
 const source=fs.readFileSync('recognition/recognition-quality-metrics.cjs','utf8');
 assert.doesNotMatch(source,/\bfetch\s*\(|\bXMLHttpRequest\b|\blocalStorage\b/);
 assert.doesNotMatch(source,/solveFiniteFillet|session\.replace|globallyUnique/);
 assert.match(source,/one-to-one evaluation/);
});
