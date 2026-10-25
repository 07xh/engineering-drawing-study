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
 assert.equal(out.counts.coincidentPaperButDistinctGeneratedTopoDSVertexPairs,1);
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
 assert.equal(out.counts.coincidentPaperButDistinctGeneratedTopoDSVertexPairs,3);
});
test('paper near-coincidence does not snap two OCCT vertices even if their mock TShape is equal',()=>{
 const v=baseline();v.H.hidden[1].projectedEndpoints[0]=p(10+Number.EPSILON*10,0);
 const out=graph({perView:v});
 assert.ok(out.counts.positivelySameGeneratedOCCTTopoDSVertexPairs<3);
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
