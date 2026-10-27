'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {originalCoProjectedAffineDepth}=
 require('../../core/numeric/original-coproject-affine-depth.cjs');
const E=(id,y,z0=0,z1=5,x=2)=>({
 id,from:{x,y,z:z0},to:{x,y,z:z1}
});
const audit=(a,b,view='V')=>originalCoProjectedAffineDepth({
 candidate:a,peer:b,view
});
test('same projected line, distinct real TopoDS source edges: whole strict front and back',()=>{
 const front=audit(E('Front',0),E('Back',4));
 assert.equal(front.status,'candidate-strictly-front');
 assert.deepEqual(front.signedObserverDepthDifferenceAtEndsMm,[4,4]);
 assert.equal(front.independentOriginal3DWholeOpenDepthOrderCertified,true);
 assert.equal(front.formalV5ActionSigned,false);
 const behind=audit(E('Back',4),E('Front',0));
 assert.equal(behind.status,'candidate-strictly-behind');
 assert.deepEqual(behind.signedObserverDepthDifferenceAtEndsMm,[-4,-4]);
});
test('source subspan within longer co-projected original edge is fully depth-ordered',()=>{
 const a=audit(E('FrontPart',0,1,3),E('LongerBack',4,0,5));
 assert.equal(a.status,'candidate-strictly-front');
 const b=audit(E('FrontPart',0,1,3),E('ShortBack',4,2,3));
 assert.equal(b.status,'undetermined-only-partly-covered-paper-interval');
});
test('3D depth inversion between projected endpoints is never certified',()=>{
 const a=E('Flat',0);
 const b={id:'Sloping',from:{x:2,y:-1,z:0},
  to:{x:2,y:1,z:5}};
 const proof=audit(a,b);
 assert.equal(proof.status,
  'undetermined-depth-tie-crossing-or-insufficient-margin');
 assert(proof.signedObserverDepthDifferenceAtEndsMm[0]*
  proof.signedObserverDepthDifferenceAtEndsMm[1]<0);
});
test('true 3D coincident overlap is not signed as strictly front',()=>{
 const r=audit(E('SourceA',0),E('SourceB',0));
 assert.equal(r.status,
  'undetermined-depth-tie-crossing-or-insufficient-margin');
});
test('near-collinear but actually different first-angle coordinates stay unsigned',()=>{
 const a=E('SourceA',0);
 const b=E('SourceB',3,0,5,2+2*Number.EPSILON);
 assert.notEqual(a.from.x,b.from.x);
 const r=audit(a,b);
 assert.notEqual(r.status,'candidate-strictly-front');
 assert.equal(r.engineeringLineStyleCertified,false);
});
test('different observer view sign is handled by SAME first-angle depth kernel',()=>{
 const p={id:'High',from:{x:0,y:1,z:4},to:{x:4,y:1,z:4}},
  q={id:'Low',from:{x:0,y:1,z:0},to:{x:4,y:1,z:0}};
 const r=audit(p,q,'H');
 assert.equal(r.status,'candidate-strictly-front');
 assert.deepEqual(r.signedObserverDepthDifferenceAtEndsMm,[4,4]);
});
