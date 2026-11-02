'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {project}=require('../../core/projection/conventions.js');
const {liftOriginalProjectedSourceCandidates:lift}=
 require('../../engines/spatial/hlr/c1-ocjs-visible-strokes.cjs');

const P=(x,y,z)=>({x,y,z});
const small={id:'TinySource',kind:'mesh',space:'model-3d',unit:'mm',
 data:{points:{A:P(0,0,0),B:P(1e-8,1e-8,1e-8)},edges:[['A','B']]}};
const id='TinySource::A|B';

test('positive sub-1e-15 projected source squared length remains an unsigned candidate in V/H/W',()=>{
 for(const view of ['V','H','W']){
  const from=project(small.data.points.A)[view];
  const to=project(small.data.points.B)[view];
  const squared=(to.u-from.u)**2+(to.v-from.v)**2;
  assert.ok(squared>0&&squared<1e-15);
  const result=lift(small,view,from,to);
  assert.deepEqual(result.projectedOriginalEdgeCandidates,[id]);
  assert.equal(result.sourceCandidate3DLifts.length,1);
  assert.equal(result.sourceCandidate3DLifts[0].actualOCCTTopoDSEdgeIdentityRecovered,false);
  assert.equal(result.sourceCandidate3DLifts[0].officialEngineeringLineStyle,'undetermined');
  assert.equal(result.sourceCandidate3DLifts[0].v5Authorized,false);
  assert.equal(result.officialEngineeringLineStyle,'undetermined');
  assert.equal(result.v5Authorized,false);
 }
});

test('zero projected length cannot become a physical source even with real 3D endpoints',()=>{
 const g={id:'CollapsedPaper',kind:'mesh',space:'model-3d',unit:'mm',
  data:{points:{A:P(0,0,0),B:P(1e-8,0,0)},edges:[['A','B']]}};
 const p=project(g.data.points.A).W;
 const q=project(g.data.points.B).W;
 assert.deepEqual(p,q);
 const result=lift(g,'W',p,q);
 assert.deepEqual(result.projectedOriginalEdgeCandidates,[]);
 assert.equal(result.unmappedReason,'degenerate-projected-hlr-not-a-physical-segment');
 assert.equal(result.v5Authorized,false);
});

test('outside original parameter domain is not accepted as tiny projected source identity',()=>{
 const from=project(small.data.points.A).V;
 const to=project(small.data.points.B).V;
 const outside={u:from.u-2*(to.u-from.u),v:from.v-2*(to.v-from.v)};
 const result=lift(small,'V',outside,to);
 assert.deepEqual(result.projectedOriginalEdgeCandidates,[]);
 assert.equal(result.actualOCCTTopoDSIdentityRecovered,false);
 assert.equal(result.v5Authorized,false);
});
