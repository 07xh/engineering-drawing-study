'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {prismMesh}=require('../../project/unified-workbench-session.cjs');
const {FIRST_ANGLE_OBSERVER_RAYS,project}=
 require('../../core/projection/conventions.js');
const {auditC1ProjectedSourcePairDepth:audit}=
 require('../../workbench/c1-projected-source-pair-affine-depth.cjs');
const P=(x,y,z)=>({x,y,z});
const box=()=>{
 const g=prismMesh({solid:{min:P(-4,3,-9),max:P(24,18,31)}});
 return {...g,id:'C1PairDepthBox'};
};
const tetra=()=>({id:'C1PairDepthTetra',
 kind:'mesh',space:'model-3d',unit:'mm',
 data:{points:{A:P(0,0,0),B:P(17,1,3),
  C:P(3,16,2),D:P(5,6,23)},
  edges:[['A','B'],['A','C'],['A','D'],
   ['B','C'],['B','D'],['C','D']],
  faces:[['A','B','C'],['A','B','D'],
   ['A','C','D'],['B','C','D']]}});
const coords=(g,id)=>id.split('::')[1].split('|').map(k=>g.data.points[k]);
const at=(a,b,t)=>({x:a.x+(b.x-a.x)*t,
 y:a.y+(b.y-a.y)*t,z:a.z+(b.z-a.z)*t});
const depth=(p,view)=>{
 const v=FIRST_ANGLE_OBSERVER_RAYS[view];
 return p.x*v.x+p.y*v.y+p.z*v.z;
};
test('authentic back/front box original edges are ordered by whole affine overlap, not midpoint',()=>{
 const g=box(),r=audit({geometry:g,revision:27});
 assert.equal(r.schema,'draftai-c1-m5-projected-original-source-affine-depth/1');
 assert.equal(r.officialV5ActionCount,0);
 assert.equal(r.engineeringLineStylesSigned,false);
 assert.equal(r.wholeSceneVisibilityVerified,false);
 assert.equal(r.provenPairwiseStrictFrontCount+
  r.undeterminedPairwiseDepthCount,r.sameProjectedSourceOverlapIntervals);
 assert.ok(r.provenPairwiseStrictFrontCount>0);
 for(const w of r.witnesses){
  assert.equal(w.signedV5Action,false);
  assert.equal(w.standardEngineeringLineStyle,'undetermined');
  assert.equal(w.exactM4PositivePaperCollinearOverlap,true);
  assert.equal(w.originalSourceEndpointParametersInBounds,true);
  assert.ok(w.firstParameterRange[1]>w.firstParameterRange[0]);
  if(!w.continuousAffineOpenDepthOrderProven)continue;
  assert.ok(w.independent3DEndpointProjectionsMatch);
  assert.ok(['first-in-front','second-in-front'].includes(w.relation));
  const [a,b]=coords(g,w.firstSourceEdgeId);
  const [c,d]=coords(g,w.secondSourceEdgeId);
  for(let i=0;i<2;i++){
   const p=at(a,b,w.firstParameterRange[i]),
    q=at(c,d,w.secondParameterRange[i]),
    delta=depth(p,w.view)-depth(q,w.view);
   assert.ok(Math.hypot(project(p)[w.view].u-project(q)[w.view].u,
    project(p)[w.view].v-project(q)[w.view].v)<=1e-7);
   assert.ok(w.relation==='first-in-front'?delta>=0:delta<=0);
  }
  const one=w.endpointObserverDepthDifferencesMm;
  assert.ok(one&&one.length===2);
  assert.ok(w.frontSourceEdgeId===w.firstSourceEdgeId||
   w.frontSourceEdgeId===w.secondSourceEdgeId);
 }
 assert.ok(Object.isFrozen(r.witnesses));
});
test('skew tetrahedron is audited by identical source-overlap math, may have zero overlapping intervals',()=>{
 const g=tetra(),r=audit({geometry:g,revision:31});
 assert.equal(r.sourceGeometryId,g.id);
 assert.equal(r.officialV5ActionCount,0);
 assert.equal(r.sameProjectedSourceOverlapIntervals,
  r.provenPairwiseStrictFrontCount+r.undeterminedPairwiseDepthCount);
 assert.ok(r.witnesses.every(w=>w.standardEngineeringLineStyle==='undetermined'));
});
test('M4 internal projected intersection alone does NOT become a positive-depth whole overlap',()=>{
 // AC and BD cross in (x,z) but at physically separated y positions.
 const g={id:'C1PairPaperCrossTetra',kind:'mesh',
  space:'model-3d',unit:'mm',data:{
   points:{A:P(0,0,0),B:P(20,0,0),
    C:P(20,15,20),D:P(0,12,20)},
   edges:[['A','B'],['A','C'],['A','D'],
    ['B','C'],['B','D'],['C','D']],
   faces:[['A','B','C'],['A','B','D'],
    ['A','C','D'],['B','C','D']]}};
 const r=audit({geometry:g,revision:11});
 const ac=g.id+'::A|C',bd=g.id+'::B|D';
 assert.equal(r.witnesses.filter(w=>w.view==='V'&&
  [w.firstSourceEdgeId,w.secondSourceEdgeId].includes(ac)&&
  [w.firstSourceEdgeId,w.secondSourceEdgeId].includes(bd)).length,0);
 assert.equal(r.officialV5ActionCount,0);
});
test('unreviewed source, stale revision and false mesh incidence cannot fabricate strict order',()=>{
 const g=box();
 assert.throws(()=>audit({geometry:g,revision:0}),/revision/);
 assert.throws(()=>audit({geometry:{...g,data:{...g.data,
  faces:g.data.faces.slice(1)}},revision:9}),/closed|Euler|face/);
 assert.throws(()=>audit({geometry:{...g,data:{...g.data,
  edges:[...g.data.edges,[...g.data.edges[0]]]}},revision:9}),
 /Euler|duplicate|declared|explicit finite/);
});
