'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {certifyExactM4OriginalVertexVsOtherSourceDepth:cert}=
 require('../../workbench/c1-m4-exact-original-vertex-on-source-depth.cjs');
const geo={id:'G',data:{points:{
 A:{x:0,y:0,z:0},B:{x:8,y:0,z:0},
 C:{x:0,y:0,z:9},D:{x:0,y:8,z:9},
 E:{x:0,y:0,z:-7},F:{x:0,y:8,z:-7},
 P:{x:-3,y:-3,z:9},Q:{x:3,y:3,z:9},
 R:{x:0,y:1,z:7},S:{x:8,y:1,z:7},
 X:{x:4,y:-3,z:9},Y:{x:4,y:3,z:9}
}}};
const evaluate=(edge,param=0,source=['A','B'])=>
 cert({geometry:geo,view:'H',vertexSourceEdge:source,
  originalSourceParameter:param,otherSourceEdge:edge});
test('same original 3D vertex ID across two authentic source edges gives exact model-space incidence, not OCCT generated paper authority',()=>{
 const out=evaluate(['A','D']);
 assert.equal(out.exactOriginalVertexOnOtherProjectedClosedSource,true);
 assert.equal(out.exactOtherOriginalSourceParameterEndpoint,0);
 assert.equal(out.exactOriginalVertexDepthRelativeOtherSourceSign,0);
 assert.equal(out.exactOriginal3DPhysicalVertexSharedBySourceEdges,true);
 assert.equal(out.actualNativeHLRGeneratedPaperAlignmentCertified,false);
 assert.equal(out.signedV5Action,false);
});
test('one 3D original source vertex can project onto a DIFFERENT depth source endpoint without a physical 3D join',()=>{
 const x=evaluate(['C','D']);
 assert.equal(x.exactOriginalVertexOnOtherProjectedClosedSource,true);
 assert.equal(x.exactOriginalVertexDepthRelativeOtherSourceSign,-1);
 assert.equal(x.exactOriginal3DPhysicalVertexSharedBySourceEdges,false);
 assert.equal(evaluate(['E','F']).exactOriginalVertexDepthRelativeOtherSourceSign,1);
});
test('strictly interior projected paper point on other original source uses exact rational depth without floating point parameter rounding',()=>{
 const g=structuredClone(geo);g.data.points.T={x:4,y:0,z:0};
 const x=cert({geometry:g,view:'H',vertexSourceEdge:['T','B'],
  originalSourceParameter:0,otherSourceEdge:['P','Q']});
 assert.equal(x.exactOriginalVertexOnOtherProjectedClosedSource,false);
 const y=cert({geometry:g,view:'H',vertexSourceEdge:['T','B'],
  originalSourceParameter:0,otherSourceEdge:['X','Y']});
 assert.equal(y.exactOriginalVertexOnOtherProjectedClosedSource,true);
 assert.equal(y.exactOtherOriginalSourceInteriorAtVertex,true);
 assert.equal(y.exactOriginalVertexDepthRelativeOtherSourceSign,-1);
 assert.equal(y.exactOriginal3DPhysicalVertexSharedBySourceEdges,false);
});
test('1-ULP projected deviation is not an original paper incidence',()=>{
 const g=structuredClone(geo);
 g.data.points.C.y=Number.EPSILON;
 const out=cert({geometry:g,view:'H',vertexSourceEdge:['A','B'],
  originalSourceParameter:0,otherSourceEdge:['C','D']});
 assert.equal(out.exactOriginalVertexOnOtherProjectedLine,false);
 assert.equal(out.exactOriginalVertexDepthRelativeOtherSourceSign,null);
});
test('projected parallel and collapsed other edge cannot forge finite second source parameter',()=>{
 assert.equal(evaluate(['R','S']).exactOriginalVertexOnOtherProjectedLine,false);
 const g=structuredClone(geo);g.data.points.Z={x:0,y:0,z:30};
 const x=cert({geometry:g,view:'H',vertexSourceEdge:['A','B'],
  originalSourceParameter:0,otherSourceEdge:['C','Z']});
 assert.equal(x.exactOriginalVertexOnOtherProjectedClosedSource,false);
 assert.equal(x.exactOriginal3DPhysicalVertexSharedBySourceEdges,false);
});
test('input cannot promote interior t or missing original vertex to a true model source vertex',()=>{
 assert.throws(()=>cert({geometry:geo,view:'H',
  vertexSourceEdge:['A','B'],originalSourceParameter:.5,
  otherSourceEdge:['C','D']}),/vertex t=0\/1/);
 assert.throws(()=>evaluate(['Missing','D']),/finite authentic/);
});
