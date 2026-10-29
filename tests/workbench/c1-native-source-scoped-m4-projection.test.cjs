'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {projectC1Native3DSourceIntervalsToM4:projectNative}=
 require('../../workbench/c1-native-source-scoped-m4-projection.cjs');
const {project}=require('../../core/projection/conventions.js');
const P=(x,y,z)=>({x,y,z});
const geometry={id:'NativeM4Test',kind:'mesh',space:'model-3d',unit:'mm',
 data:{points:{A:P(0,0,0),B:P(10,0,0)},edges:[['A','B']]}};
const id='NativeM4Test::A|B';
const part=(from,to)=>({
 nativeSourceFilterOriginalEdgeId:id,nativeOriginalCurveParameterRange:[from,to],
 native3DCurveExactlySameAsOriginalAtThreeParameters:true,
 originalGeneratedTopoDSHistoryCertified:false,signedV5Action:false
});
const row=(visible,hidden)=>({
 originalPhysicalSourceEdgeId:id,
 visible3D:{nativeSourceFilteredOriginalTopoDSEdge:true,
  native3DGeneratedCurveIntervals:visible.map(r=>part(...r))},
 hidden3D:{nativeSourceFilteredOriginalTopoDSEdge:true,
  native3DGeneratedCurveIntervals:hidden.map(r=>part(...r))}
});
function input(visible,hidden,reverse=false){
 return {geometry,revision:11,view:'V',sourceEdgeId:id,
  originalCurve:{sourceEdgeId:id,occtSourceCurveType:'line',
   occtSourceCurve3DEndpointsAndMidpointVerified:true,
   occtSourceCurveParameterRange:[0,10],
   occtSourceCurveFirstPoint3D:reverse?P(10,0,0):P(0,0,0),
   occtSourceCurveLastPoint3D:reverse?P(0,0,0):P(10,0,0)},
  scopedRow:row(visible,hidden)};
}
test('native original 3D source class partition projects to exact first-angle M4, not paper-inverted HLR',()=>{
 const result=projectNative(input([[0,4]],[[4,10]]));
 assert.equal(result.M4OriginalUnitIntervalCandidateCoverageComplete,true);
 assert.equal(result.native3DSourceParameterPartitionCompleteExactlyOnce,true);
 assert.deepEqual(result.M4OriginalUnitIntervalCandidatePositiveGaps,[]);
 assert.deepEqual(result.M4OriginalUnitIntervalNativeClassConflicts,[]);
 assert.equal(result.segments.length,2);
 assert.deepEqual(result.segments[0].originalM0UnitParameterRange,[0,.4]);
 assert.deepEqual(result.segments[1].originalM0UnitParameterRange,[.4,1]);
 assert.deepEqual(result.segments[0].fromPaper,project(P(0,0,0)).V);
 assert.deepEqual(result.segments[0].toPaper,project(P(4,0,0)).V);
 assert.equal(result.segments[0].native3DHLRClass,'visible-sharp');
 assert.equal(result.segments[1].native3DHLRClass,'hidden-sharp');
 assert.equal(result.segments[0].derivedFromOriginalNative3DCurveNotGeneratedHLRPaper,true);
 assert.equal(result.segments[0].generated2DHLREdgeTopologyProven,false);
 assert.equal(result.segments[0].signedV5Action,false);
 assert.equal(result.officialV5Authorized,false);
 assert.ok(Object.isFrozen(result.segments[0].fromModelMm));
 assert.ok(Object.isFrozen(result.segments[0].originalNative3DParameterRange));
});
test('original OCCT curve reversed orientation recovers correct M0 parameter direction',()=>{
 const actual=projectNative(input([[0,4]],[[4,10]],true));
 assert.equal(actual.original3DSourceCurveDirection,'reversed');
 assert.deepEqual(actual.segments[0].originalM0UnitParameterRange,[.6,1]);
 assert.deepEqual(actual.segments[0].fromPaper,project(P(6,0,0)).V);
 assert.deepEqual(actual.segments[0].toPaper,project(P(10,0,0)).V);
 assert.deepEqual(actual.segments[1].originalM0UnitParameterRange,[0,.6]);
 assert.equal(actual.M4OriginalUnitIntervalCandidateCoverageComplete,true);
});
test('native exact one-ULP positive gap is retained in M4 rather than absorbed by tolerance',()=>{
 const next=5.000000000000001;
 const out=projectNative(input([[0,5]],[[next,10]]));
 assert.equal(out.native3DSourceParameterPartitionCompleteExactlyOnce,false);
 assert.deepEqual(out.M4OriginalUnitIntervalCandidatePositiveGaps,[[.5,next/10]]);
 assert.equal(out.M4OriginalUnitIntervalCandidateCoverageComplete,false);
});
test('two overlapping native opposite visibility classes never grant signed strokes',()=>{
 const out=projectNative(input([[0,7]],[[4,10]]));
 assert.equal(out.native3DSourceParameterPartitionCompleteExactlyOnce,false);
 assert.deepEqual(out.M4OriginalUnitIntervalNativeClassConflicts,[[.4,.7]]);
 assert.equal(out.formalEngineeringLineStyleCertified,false);
});
test('native source filter, original curve, M0 identity and bounds must agree',()=>{
 const good=input([[0,10]],[]);
 const errors=[
  {...good,revision:0},
  {...good,sourceEdgeId:'other'},
  {...good,originalCurve:{...good.originalCurve,occtSourceCurveType:'ellipse'}},
  {...good,originalCurve:{...good.originalCurve,
   occtSourceCurveFirstPoint3D:P(3,3,3)}},
  {...good,scopedRow:row([[-Number.EPSILON,10]],[])},
  {...good,scopedRow:row([[0,10+Number.EPSILON*10]],[])},
  {...good,scopedRow:{...good.scopedRow,
   visible3D:{nativeSourceFilteredOriginalTopoDSEdge:false,
    native3DGeneratedCurveIntervals:[part(0,10)]}}},
  {...good,scopedRow:row([[0,10]],[])}
 ];
 errors[errors.length-1].scopedRow.visible3D.native3DGeneratedCurveIntervals[0].
  nativeSourceFilterOriginalEdgeId='another';
 for(const bad of errors)
  assert.throws(()=>projectNative(bad));
});
