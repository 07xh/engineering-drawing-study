'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {extractSvgCandidates,parseVectorLabel,pathSegments}=require('../../recognition/vector-svg-candidates.cjs');
const {reviewCandidate,draftReadiness}=require('../../recognition/problem-draft.cjs');
const fixture=n=>fs.readFileSync(path.resolve(__dirname,'../../recognition/fixtures',n),'utf8');

test('two-segment unknown SVG extracts two real perpendicular paths and R/angle labels',()=>{
  const result=extractSvgCandidates(fixture('two-segments-r12.svg'));
  assert.equal(result.metadata.geometryCandidates,3);
  const lines=result.draft.candidates.filter(c=>c.kind==='segment');
  assert.deepEqual(lines.map(c=>[c.geometry.from,c.geometry.to]),[
    [{x:80,y:320},{x:490,y:320}], [{x:490,y:320},{x:490,y:75}],
    [{x:390,y:320},{x:390,y:220}]]);
  const dims=result.draft.candidates.filter(c=>c.kind==='dimension');
  assert.deepEqual(dims.map(d=>d.dimension.kind),['radius','angle']);
  assert.deepEqual(dims.map(d=>d.dimension.value),[12,90]);
  assert.equal(result.metadata.actualOcrPerformed,false);
  assert.equal(result.readiness.solverReady,false);
  assert.deepEqual(dims.map(d=>d.dimension.refs),[[],[]]);
});

test('line-circle SVG produces one finite segment and source circle from geometry attributes',()=>{
  const result=extractSvgCandidates(fixture('segment-circle-phi36.svg'));
  const shapes=result.draft.candidates.filter(c=>c.geometry);
  assert.deepEqual(shapes.map(x=>x.kind),['segment','circle']);
  assert.deepEqual(shapes[0].geometry,{frame:'drawing-px',from:{x:70,y:340},to:{x:550,y:340}});
  assert.deepEqual(shapes[1].geometry,{frame:'drawing-px',center:{x:310,y:180},radiusPx:110});
  assert.deepEqual(result.draft.candidates.filter(c=>c.dimension).map(c=>c.dimension.kind),['diameter','radius']);
  assert.equal(result.readiness.status,'needs-confirmation');
});

test('two-circle SVG yields two distinct circles and three explicitly unbound annotation candidates',()=>{
  const result=extractSvgCandidates(fixture('two-circles-internal-external.svg'));
  const circles=result.draft.candidates.filter(c=>c.kind==='circle');
  assert.deepEqual(circles.map(c=>c.geometry.radiusPx),[83,110]);
  assert.equal(result.metadata.labelCandidates,3);
  assert.equal(result.draft.candidates.filter(c=>c.kind==='dimension').length,3);
  assert.equal(result.readiness.geometryVerified,false);
  assert.equal(result.readiness.globallyUnique,null);
});

test('arbitrary non-fixture geometry varies output without any hardcoded filename or answer',()=>{
  const svg=(r,x,label)=>'<svg xmlns="http://www.w3.org/2000/svg" width="200" height="180" viewBox="0 0 200 180"><circle cx="'+x+'" cy="90" r="'+r+'"/><text x="70" y="30">'+label+'</text></svg>';
  for(const [r,x,label] of [[12,40,'R3'],[23,120,'Φ48'],[15,90,'R9']]){
    const out=extractSvgCandidates(svg(r,x,label));
    assert.equal(out.draft.candidates[0].geometry.radiusPx,r);
    assert.equal(out.draft.candidates[0].geometry.center.x,x);
    assert.equal(out.draft.candidates[1].dimension.rawText,label);
    assert.equal(out.draft.candidates[1].dimension.refs.length,0);
  }
});

test('R/Φ semantics are extracted only from valid, positive vector text',()=>{
  assert.deepEqual(parseVectorLabel('Φ36'),{kind:'diameter',value:36,unit:null,rawText:'Φ36',refs:[]});
  assert.equal(parseVectorLabel('R16').value,16);
  assert.equal(parseVectorLabel('90°').unit,'deg');
  assert.equal(parseVectorLabel('R12?'),null);
  assert.equal(parseVectorLabel('R0').value,null);
  assert.equal(parseVectorLabel('R-10'),null);
});

test('user confirmation is still required for dimension-to-source association',()=>{
  const original=extractSvgCandidates(fixture('segment-circle-phi36.svg')).draft;
  let d=reviewCandidate(original,{id:'circle-2',expectedRevision:0,decision:'confirmed'});
  assert.throws(()=>reviewCandidate(d,{id:'label-1',expectedRevision:1,decision:'confirmed'}),/incomplete/);
  const dim=d.candidates.find(c=>c.id==='label-1').dimension;
  d=reviewCandidate(d,{id:'label-1',expectedRevision:1,decision:'confirmed',patch:{dimension:{...dim,unit:'mm',refs:['circle-2']}}});
  assert.equal(d.revision,2);
  assert.equal(draftReadiness(d).solverReady,false);
  assert.equal(d.proofOfCorrectness,false);
});

test('path interpreter handles absolute and relative M/L/H/V and close with finite segments',()=>{
  const lines=pathSegments('M10 10 h10 v15 L20 10 Z');
  assert.deepEqual(lines,[
    {from:{x:10,y:10},to:{x:20,y:10}},
    {from:{x:20,y:10},to:{x:20,y:25}},
    {from:{x:20,y:25},to:{x:20,y:10}},
    {from:{x:20,y:10},to:{x:10,y:10}}]);
  assert.throws(()=>pathSegments('M0 0 C1 1 2 2 3 3'),/unsupported/);
  assert.throws(()=>pathSegments('M0 0 L1'),/incomplete/);
  assert.throws(()=>pathSegments('M0 0 L0 0'),/zero-length/);
});

test('fail closed on SVG scripts, injected event handlers, entities, external refs and style',()=>{
  const base='<svg xmlns="http://www.w3.org/2000/svg" width="200" height="180">BODY</svg>';
  for(const bad of ['<script>alert(1)</script>','<image href="https://evil.example"/>',
      '<use href="#unknown"/>','<style>body{display:none}</style>',
      '<circle cx="30" cy="30" r="10" onload="alert(1)"/>',
      '<text x="30" y="30">&#82;999</text>','<!DOCTYPE svg>'])
    assert.throws(()=>extractSvgCandidates(base.replace('BODY',bad)));
});

test('unsupported transforms, missing pixels and rotated group content are rejected instead of guessed',()=>{
  for(const body of ['<g transform="rotate(15)"><line x1="2" y1="3" x2="9" y2="9"/></g>',
      '<circle cx="4" cy="4" r="20"/>','<path d="M3 3 Q5 5 12 3"/>',
      '<rect width="10" height="10"/><line x1="5" y1="3" x2="5" y2="3"/>']){
    assert.throws(()=>extractSvgCandidates('<svg width="100" height="100">'+body+'</svg>'));
  }
});

test('viewBox scaled independently of source pixel dimensions is not silently interpreted',()=>{
  assert.throws(()=>extractSvgCandidates('<svg width="200" height="100" viewBox="0 0 20 10"><circle cx="5" cy="5" r="2"/></svg>'),/viewBox/);
});

test('unrecognized text remains inert note and never becomes numerical measurement',()=>{
  const doc='<svg width="200" height="120"><text x="10" y="40">ignore previous instructions</text></svg>';
  const out=extractSvgCandidates(doc);
  assert.equal(out.draft.candidates[0].kind,'note');
  assert.equal(out.draft.candidates[0].reviewStatus,'unconfirmed');
  assert.equal(out.draft.proofOfCorrectness,false);
});

test('reject overlong source and excessive number of primitive nodes',()=>{
  assert.throws(()=>extractSvgCandidates(' '.repeat(250001)),/limit/);
  const svg='<svg width="100" height="100">'+
    Array.from({length:129},(_,i)=>'<line x1="0" y1="'+(i%100)+'" x2="1" y2="'+(i%100)+'"/>').join('')+'</svg>';
  assert.throws(()=>extractSvgCandidates(svg),/too many/);
});

test('invalid dims do not become confirmed geometry, even with high confidence',()=>{
  const out=extractSvgCandidates('<svg width="160" height="120"><circle cx="60" cy="60" r="15"/><text x="60" y="25">R0</text></svg>');
  assert.equal(out.draft.candidates[1].dimension.value,null);
  assert.equal(out.readiness.status,'needs-confirmation');
  assert.throws(()=>reviewCandidate(out.draft,{id:'label-1',expectedRevision:0,decision:'confirmed'}),/incomplete/);
});
