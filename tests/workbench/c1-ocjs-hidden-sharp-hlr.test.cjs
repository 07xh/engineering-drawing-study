'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {readRealOcjsSharpHLREdge:read}=
 require('../../engines/spatial/hlr/c1-ocjs-raw-hlr-edges.cjs');
const paper3=(u,v,z=0)=>({x:u,y:-v,z});
function fakeNativeHLREdge({
 from=paper3(2,3),to=paper3(10,7),
 curveType='line',curveIs3D=false,interiorBump=0,
 wrongCurveStart=0
}={}){
 const shape={
  sourceVertices:[{...from},{...to}],
  fromCurve:{...from,x:from.x+wrongCurveStart},toCurve:{...to},
  curveType,curveIs3D,interiorBump
 };
 const point=p=>({X:()=>p.x,Y:()=>p.y,Z:()=>p.z,delete(){}});
 const oc={
  TopoDS:{Vertex_1:v=>v,Edge_1:e=>e},
  BRep_Tool:{Pnt:v=>point(v)},
  GeomAbs_CurveType:{GeomAbs_Line:'line'},
 };
 const newObj=(key,edge)=>{
  if(key==='TopExp_Explorer_2'){
   let i=0;return {More:()=>i<edge.sourceVertices.length,
    Current:()=>edge.sourceVertices[i],Next:()=>{i++;},delete(){}};
  }
  if(key==='BRepAdaptor_Curve_2'){
   return {GetType:()=>edge.curveType,Is3DCurve:()=>edge.curveIs3D,
    FirstParameter:()=>-4,LastParameter:()=>12,
    Value(t){
     const f=(t+4)/16,a=edge.fromCurve,b=edge.toCurve;
     const bump=f>0&&f<1?edge.interiorBump:0;
     return point({x:a.x+(b.x-a.x)*f,
      y:a.y+(b.y-a.y)*f+bump,
      z:a.z+(b.z-a.z)*f});
    },delete(){}};
  }
  throw Error('unsupported OCJS stub '+key);
 };
 return {oc,edge:shape,view:'V',vertexType:1,avoid:0,
  newObj,hold:x=>x};
}
test('native HLR hidden sharp pcurve extracts exact V/H/W line geometry with unsigned source attribution',()=>{
 for(const view of ['V','H','W']){
  const result=read({...fakeNativeHLREdge(),view});
  assert.equal(result.view,view);
  assert.deepEqual(result.from,{u:2,v:3});
  assert.deepEqual(result.to,{u:10,v:7});
  assert.equal(result.actualOCCTHLRFlattenedBRepLineVerified,true);
  assert.equal(result.actualOCCTHLRCurveBacking,'surface-pcurve');
  assert.equal(result.originalTopoDSSourceForHLREdgeRecovered,false);
  assert.equal(result.formalStandardLineStyle,'undetermined');
  assert.equal(result.v5Authorized,false);
 }
});
test('original native orientation reversal does not forge new M5 line signature',()=>{
 const q=fakeNativeHLREdge();
 q.edge.sourceVertices.reverse();
 const r=read(q);
 assert.equal(r.actualOCCTHLRCurveOrientation,'reverse-of-vertices');
 assert.equal(r.formalStandardLineStyle,'undetermined');
});
test('native HLR sharp extractor rejects curved pcurve and wrong source endpoints',()=>{
 assert.throws(()=>read(fakeNativeHLREdge({interiorBump:0.01})),/nonaffine/);
 assert.throws(()=>read(fakeNativeHLREdge({wrongCurveStart:0.01})),/endpoints disagree/);
 assert.throws(()=>read(fakeNativeHLREdge({curveType:'circle'})),/not a valid line/);
});
test('real flattened HLR cannot be promoted if extracted topology is nonplanar',()=>{
 assert.throws(()=>read(fakeNativeHLREdge({to:paper3(10,7,0.05)})),/nonplanar/);
});
test('zero-length OCCT HLR output is skipped without a false line or V5 action',()=>{
 const q=fakeNativeHLREdge({from:paper3(4,4),to:paper3(4,4)});
 assert.equal(read(q),null);
});
