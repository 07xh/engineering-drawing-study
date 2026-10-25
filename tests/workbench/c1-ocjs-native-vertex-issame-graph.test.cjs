'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {computeC1NativeHLRIsSameVertexGraph:graph}=
 require('../../engines/spatial/hlr/c1-ocjs-native-vertex-issame-graph.cjs');
const vertex=key=>({
 IsNull:()=>false,IsSame(other){return other._key===key;},_key:key
});
const p=(u,v)=>({u,v});
const edge=(n,a,b,pa,pb)=>({
 nativeHLREdgeOrdinal:n,
 vertices:[vertex(a),vertex(b)],
 projectedEndpoints:[pa,pb]
});
const baseline=()=>({
 V:{visible:[],hidden:[]},
 H:{visible:[
  edge(0,'native-a','native-front-end',p(0,0),p(10,0)),
  edge(1,'another','native-front-end',p(11,0),p(10,0))
 ],hidden:[
  edge(0,'native-other','native-rear-end',p(0,0),p(10,0)),
  edge(1,'native-front-end','last',p(10,0),p(15,0))
 ]},
 W:{visible:[],hidden:[]}
});
test('only native shared OCCT TopoDS IsSame vertex is a positive HLR BRep join',()=>{
 const out=graph({perView:baseline()});
 assert.equal(out.counts.genuineOCCTNativeHLRSharpEdges,4);
 assert.equal(out.counts.actualNativeBRepVertexEndpoints,8);
 assert.equal(out.counts.positivelySameGeneratedOCCTTopoDSVertexPairs,3);
 assert.equal(out.counts.allPerViewGeneratedOCCTTopoDSVertexPairsChecked,28);
 assert.equal(out.counts.genuinelySharedNativeJunctionComponents,1);
 assert.equal(out.counts.genuinelySharedNativeJunctionEndpoints,3);
 assert.equal(out.views.H.generatedOCCTSharedNativeJunctionComponents.length,1);
 assert.equal(out.views.H.generatedOCCTSharedNativeJunctionComponents[0].
  generatedSharpEdgeEndpoints.length,3);
 assert.equal(out.views.H.generatedOCCTSharedNativeJunctionComponents[0].
  actualGeneratedOCCTTopoDSVertexPairwiseIsSame,true);
 assert.equal(out.views.H.generatedOCCTSharedNativeJunctionComponents[0].
  independentlyCertifiedOriginal3DSourceVertexId,null);
 assert.equal(out.allVHWGeneratedNativeTopologyPairsComparedWithoutPaperBucketing,true);
 assert.equal(out.counts.coincidentPaperButDistinctGeneratedTopoDSVertexPairs,4);
 assert.ok(out.views.H.sameActualGeneratedOCCTTopoDSVertexPairs.every(x=>
  x.nativeGeneratedOCCTTopoDSVertexIsSame===true&&
  x.original3DSourceTopoDSVertexIdentityRecovered===false&&
  x.actualNativeHLRStrokeJoinMeetsGlobalEngineeringRules===false&&
  x.signedV5Action===false));
 assert.equal(out.actualGeneratedToOriginalTopoDSHistoryRecovered,false);
 assert.equal(out.signedV5ActionCount,0);
});
test('literal paper coincidence alone never creates OCCT native vertex identity',()=>{
 const v=baseline();v.H.visible[1].vertices[1]=vertex('a-different-vertex');
 const out=graph({perView:v});
 assert.equal(out.counts.positivelySameGeneratedOCCTTopoDSVertexPairs,1);
 assert.equal(out.counts.coincidentPaperButDistinctGeneratedTopoDSVertexPairs,6);
});
test('a true IsSame vertex with even one-ULP different paper coordinates is rejected rather than dropped from global native graph',()=>{
 const v=baseline();v.H.hidden[1].projectedEndpoints[0]=p(10+Number.EPSILON*10,0);
 assert.throws(()=>graph({perView:v}),/inconsistent first-angle paper coordinates/);
});
test('near-coincident different native TopoDS vertices remain distinct without snapping',()=>{
 const v=baseline();v.H.hidden[1].vertices[0]=vertex('different-native');
 v.H.hidden[1].projectedEndpoints[0]=p(10+Number.EPSILON*10,0);
 const out=graph({perView:v});
 assert.equal(out.counts.positivelySameGeneratedOCCTTopoDSVertexPairs,1);
 assert.equal(out.counts.genuinelySharedNativeJunctionComponents,1);
 assert.equal(out.views.H.generatedOCCTSharedNativeJunctionComponents[0].
  generatedSharpEdgeEndpoints.length,2);
 assert.equal(out.signedV5ActionCount,0);
});
test('asymmetric or non-reflexive native OCCT identity checks fail closed',()=>{
 const v=baseline();v.H.visible[0].vertices[0].IsSame=()=>false;
 assert.throws(()=>graph({perView:v}),/reflexive IsSame/);
 const b=baseline();
 b.H.visible[0].vertices[1].IsSame=()=>true;
 assert.throws(()=>graph({perView:b}),/not symmetric/);
});
test('fabricated shape objects, missing views and unbounded HLR sharp edge counts fail closed',()=>{
 const v=baseline();v.H.visible[0].vertices[0]={};
 assert.throws(()=>graph({perView:v}),/valid native OCCT/);
 const m=baseline();delete m.W;
 assert.throws(()=>graph({perView:m}),/current actual OCCT/);
 const many=baseline();many.H.visible=Array.from({length:257},(_,i)=>
  edge(i,'s'+i,'t'+i,p(i,0),p(i,1)));
 assert.throws(()=>graph({perView:many}),/too many genuine/);
});

test('one finite HLR edge with same native TopoDS endpoint on both sides cannot create a fake closed junction',()=>{
 const v=baseline();v.H.visible[0].vertices[1]=vertex('native-a');
 assert.throws(()=>graph({perView:v}),/identical generated TopoDS start and end/);
});
test('non-transitive mocked OCCT IsSame graph is rejected instead of treating a paper group as an authenticated native junction',()=>{
 const v=baseline();
 const a=v.H.visible[0].vertices[1],
  b=v.H.visible[1].vertices[1],
  c=v.H.hidden[1].vertices[0];
 // Keep reflexivity and symmetry, but A~B and B~C with A!~C.
 const name=new Map([[a,'A'],[b,'B'],[c,'C']]);
 for(const node of [a,b,c]){
  node.IsSame=function(other){
   const lhs=name.get(this),rhs=name.get(other);
   return this===other||lhs!==undefined&&rhs!==undefined&&
    (lhs===rhs||lhs==='A'&&rhs==='B'||
    lhs==='B'&&rhs==='A'||lhs==='B'&&rhs==='C'||lhs==='C'&&rhs==='B');
  };
 }
 assert.throws(()=>graph({perView:v}),/not transitive/);
});
