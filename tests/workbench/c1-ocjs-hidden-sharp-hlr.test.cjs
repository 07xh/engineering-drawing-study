'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {readRealOcjsSharpHLREdge:read}=
 require('../../engines/spatial/hlr/c1-ocjs-raw-hlr-edges.cjs');
const paper3=(u,v,z=0)=>({x:u,y:v,z});
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


test('real positive HLR source tails below old 1e-7 cutoff survive as unsigned edges',()=>{
 for(const view of ['V','H','W']){
  const q=fakeNativeHLREdge({from:paper3(0,0),to:paper3(1e-10,0)});
  const r=read({...q,view});
  assert.ok(r,'positive source tail must not silently vanish');
  assert.deepEqual(r.to,{u:1e-10,v:0});
  assert.equal(r.actualOCCTHLRFlattenedBRepLineVerified,true);
  assert.equal(r.originalTopoDSSourceForHLREdgeRecovered,false);
  assert.equal(r.v5Authorized,false);
 }
 const subnormal=read(fakeNativeHLREdge({
  from:paper3(0,0),to:paper3(Number.MIN_VALUE,0)
 }));
 assert.ok(subnormal);
 assert.equal(subnormal.to.u,Number.MIN_VALUE);
 assert.equal(subnormal.formalStandardLineStyle,'undetermined');
});
test('tiny HLR output cannot hide wrong endpoints or nonaffine interiors under absolute mm tolerance',()=>{
 assert.throws(()=>read(fakeNativeHLREdge({
  from:paper3(0,0),to:paper3(1e-10,0),wrongCurveStart:2e-10
 })),/endpoints disagree/);
 assert.throws(()=>read(fakeNativeHLREdge({
  from:paper3(0,0),to:paper3(1e-10,0),interiorBump:2e-10
 })),/nonaffine/);
});

const {auditC1OriginalHLRStatusScopedClassConcordance:auditNativeClass}=
 require('../../engines/spatial/hlr/c1-ocjs-visible-strokes.cjs');
function originalStatusClassFixture(view='W'){
 const source=id=>({
  originalPhysicalSourceEdgeId:id,hlrDataStructureOneBasedEdgeIndex:
   id==='g::A|B'?1:2,
  visible:[],hidden:[],
  visible3D:{native3DGeneratedCurveIntervals:[]},
  hidden3D:{native3DGeneratedCurveIntervals:[]}
 });
 const visible=source('g::A|B'),hidden=source('g::C|D');
 visible.visible.push({});visible.visible3D.native3DGeneratedCurveIntervals.push([0,1]);
 hidden.hidden.push({});hidden.hidden3D.native3DGeneratedCurveIntervals.push([0,1]);
 return {view,statusRows:[
  {view,originalPhysicalSourceEdgeId:'g::A|B',
   nativeHLROriginalEdgeMapIndex:1,
   originalEdgeStatusAllVisible:true,originalEdgeStatusAllHidden:false},
  {view,originalPhysicalSourceEdgeId:'g::C|D',
   nativeHLROriginalEdgeMapIndex:2,
   originalEdgeStatusAllVisible:false,originalEdgeStatusAllHidden:true}
 ],scopedRows:[visible,hidden]};
}
test('same-run native original EdgeStatus classes reconcile with source-scoped 3D and 2D without signing',()=>{
 for(const view of ['V','H','W']){
  const x=originalStatusClassFixture(view),r=auditNativeClass(x);
  assert.equal(r.sameRunOriginalStatusAndScopedSharpClassConcordanceVerified,true);
  assert.equal(r.sourceCount,2);
  assert.equal(r.allVisibleSourceCount,1);
  assert.equal(r.allHiddenSourceCount,1);
  assert.equal(r.originalParameterIntervalsExtractedFromEdgeStatus,false);
  assert.equal(r.generated2DToOriginal3DTopoDSHistoryCertified,false);
  assert.equal(r.engineeringLineStyle,'undetermined');
  assert.equal(r.signedV5ActionCount,0);
  // A projected point can lack a paper edge; class evidence must not
  // manufacture positive-length drawing actions.
  x.scopedRows[0].visible=[];
  assert.equal(auditNativeClass(x).signedV5ActionCount,0);
 }
});
test('same-run native EdgeStatus vetoes contradictory hidden/visible generated source output',()=>{
 for(const view of ['V','H','W']){
  for(const kind of ['hidden-paper','hidden-3d','visible-paper','visible-3d']){
   const x=originalStatusClassFixture(view);
   if(kind==='hidden-paper')x.scopedRows[0].hidden.push({});
   if(kind==='hidden-3d')x.scopedRows[0].hidden3D.native3DGeneratedCurveIntervals.push([0,1]);
   if(kind==='visible-paper')x.scopedRows[1].visible.push({});
   if(kind==='visible-3d')x.scopedRows[1].visible3D.native3DGeneratedCurveIntervals.push([0,1]);
   assert.throws(()=>auditNativeClass(x),/original HLR source generated/);
  }
 }
});
test('same-run native EdgeStatus rejects swapped, duplicate, stale, and missing source identities',()=>{
 const mutations=[
  x=>{x.scopedRows[0].hlrDataStructureOneBasedEdgeIndex=2;},
  x=>{x.statusRows[1].nativeHLROriginalEdgeMapIndex=1;},
  x=>{x.statusRows[1].originalPhysicalSourceEdgeId='g::A|B';},
  x=>{x.scopedRows[1].originalPhysicalSourceEdgeId='g::A|B';},
  x=>{x.statusRows[0].view='H';},
  x=>{x.statusRows.pop();},
  x=>{x.statusRows[0].originalEdgeStatusAllHidden=true;},
  x=>{x.scopedRows[0].hidden3D=null;}
 ];
 for(const mutate of mutations){
  const x=originalStatusClassFixture();mutate(x);
  assert.throws(()=>auditNativeClass(x),/original HLR|scoped HLR|source-filtered HLR|same-view/);
 }
});
