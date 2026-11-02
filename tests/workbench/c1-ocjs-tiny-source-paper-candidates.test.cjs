'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {project}=require('../../core/projection/conventions.js');
const {liftOriginalProjectedSourceCandidates:lift}=
 require('../../engines/spatial/hlr/c1-ocjs-visible-strokes.cjs');

function fixture(scale){
 const a={x:0,y:0,z:0},b={x:scale,y:2*scale,z:3*scale};
 return {geometry:{id:'TinySource',kind:'mesh',space:'model-3d',unit:'mm',
  data:{points:{A:a,B:b},edges:[['A','B']]}},a,b};
}
for(const scale of [1e-9,1e-160]){
 for(const view of ['V','H','W']){
  test('real positive short source survives unsigned paper lift '+view+' '+scale,()=>{
   const {geometry,a,b}=fixture(scale);
   const from=project(a)[view],to=project(b)[view];
   assert.ok(Math.hypot(to.u-from.u,to.v-from.v)>0);
   const result=lift(geometry,view,from,to);
   assert.deepEqual(result.projectedOriginalEdgeCandidates,['TinySource::A|B']);
   assert.equal(result.sourceCandidate3DLifts.length,1);
   assert.equal(result.sourceCandidate3DLifts[0].actualOCCTTopoDSEdgeIdentityRecovered,false);
   assert.equal(result.sourceCandidate3DLifts[0].originalSourceExactParameterCoverageFromRoundingProven,false);
   assert.equal(result.sourceCandidate3DLifts[0].v5Authorized,false);
   assert.equal(result.v5Authorized,false);
  });
  test('disjoint tiny parallel paper segment is not assigned a 3D source '+view+' '+scale,()=>{
   const {geometry,a,b}=fixture(scale);
   const from=project(a)[view],to=project(b)[view];
   const du=to.u-from.u,dv=to.v-from.v,len=Math.hypot(du,dv);
   const offset=scale/100;
   const moved=p=>({u:p.u-dv/len*offset,v:p.v+du/len*offset});
   const result=lift(geometry,view,moved(from),moved(to));
   assert.deepEqual(result.projectedOriginalEdgeCandidates,[]);
   assert.equal(result.v5Authorized,false);
  });
 }
}
test('a projected point cannot be assigned a physical HLR source',()=>{
 const {geometry,a}=fixture(1e-9);
 const from=project(a).V;
 const result=lift(geometry,'V',from,from);
 assert.deepEqual(result.projectedOriginalEdgeCandidates,[]);
 assert.equal(result.unmappedReason,'degenerate-projected-hlr-not-a-physical-segment');
 assert.equal(result.v5Authorized,false);
});
