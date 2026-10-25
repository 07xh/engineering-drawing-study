'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {project}=require('../../core/projection/conventions.js');
const {auditC1NativeHiddenOriginalVertexEndpointProof:audit}=
 require('../../workbench/c1-native-hidden-original-3d-vertex-endpoints.cjs');
const revision=71,G='G',edgeId='G::A|B';
const A={x:0,y:0,z:0},B={x:10,y:3,z:0};
const fixture=()=>{
 const paperA=project(A).H,paperB=project(B).H;
 const end=(id,p,t,paper)=>({
  sourceGeometryId:G,revision,view:'H',sourceEdgeId:edgeId,
  signedV5Action:false,
  nativeHLRGeneratedTopoDSEndpointToOriginalTopoDSIdentityCertified:false,
  originalSourceParameter:t,nativePaperPoint:{...paper},
  originalSource3DVertexId:id,
  exactOriginalM0ParameterIsSourceVertex:true,
  independentlyVerifiedOriginal3DClosedFaceFan:true,
  possibleOriginal3DPoint:{...p},
  originalM4PaperEndpointMatchesAuthentic3DVertex:false,
  original3DSourceVertexPlusM4AndFanVerified:false
 });
 const cad={
  sourceGeometryId:G,revision,hiddenHLROutputFromActualOCCT:true,
  actualOCCTHLREdgeToOriginalTopoDSIdentityMatched:false,v5Authorized:false,
  originalBRepSourceEdges:[{
   sourceEdgeId:edgeId,originalOCCTBRepVertexXYZMatched:true,
   occtCurveTypeIndependentlyVerified:true,occtSourceCurveType:'line',
   occtSourceCurve3DEndpointsAndMidpointVerified:true,
   generatedHLREdgeTopoDSIdentityMatched:false
  }],
  hiddenSharpViews:{V:[],H:[{
   view:'H',from:{...paperA},to:{...paperB},
   occtHLRVisibilityClass:'hidden-sharp',
   actualOCCTHLRFlattenedBRepLineVerified:true,
   actualOCCTHLRCurveEntireFiniteIntervalIsLine:true,v5Authorized:false,
   sourceCandidate3DLifts:[{
    sourceEdgeId:edgeId,
    actualOriginalOCCTBRepEdge3DEndpointsVerified:true,
    originalOCCTSourceLineCurveVerified:true,
    originalXYZReprojectsToHLR:true,v5Authorized:false,
    sourceParameterAtProjectedFrom:0,sourceParameterAtProjectedTo:1,
    fromCandidate3D:{...A},toCandidate3D:{...B}
   }]
  }],W:[]}
 };
 const fans={sourceGeometryId:G,revision,
  nativeGeneratedTopoDSEdgeEndpointIdentityProven:false,
  signedV5ActionCount:0,rows:[{
   view:'H',nativeHiddenSharpEdgeOrdinal:0,
   nativeGeneratedTopoDSIdentityCertified:false,
   nativeHLREdgeJunctionsCertified:false,signedV5Action:false,
   nativeProjectedFrom:{...paperA},nativeProjectedTo:{...paperB},
   physicallyRemainingSourceCount:1,
   survivingOriginal3DEdgesWithEndpointFans:[{
    originalPhysicalSourceEdgeId:edgeId,
    endpointWitnesses:[end('A',A,0,paperA),end('B',B,1,paperB)]
   }]
  }]};
 return {geometry:{id:G,data:{points:{A:{...A},B:{...B}},
  edges:[['A','B']]}},revision,cad,endpointFans:fans,
  refinements:[{view:'H',
   remainingPhysicalSourcePossibilities:[{sourceEdgeId:edgeId}]}]};
};
test('real native 3D BRep source plus exact original vertex face fan proves BOTH genuine original endpoints even when M4 endpoint cuts missing',()=>{
 const out=audit(fixture()),c=out.counts;
 assert.equal(c.originalM4EndCutsStillUnproven,2);
 assert.equal(c.missingM4EndpointsIndependentlyPositiveNativeM0VertexProven,2);
 assert.equal(c.missingM4EndpointsStillLackingIndependentNativeProof,0);
 assert.equal(c.nativeHiddenEdgesWithAllOriginal3DVertexEndpointsVerified,1);
 assert.equal(out.M4SourceCutGapsStillReportedIndependently,true);
 const r=out.rows[0].nativeSource3DVertexEndpointRows[0];
 assert.ok(r.endpointWitnesses.every(x=>
  x.exactOriginal3DVertexAndClosedFaceFanNativeOCCTVerified));
 assert.ok(r.endpointWitnesses.every(x=>
  x.originalM4SourceParameterGapRemainsUnrepaired));
 assert.equal(out.allGlobalOCCTHLREdgeJoinsVerified,false);
 assert.equal(out.signedV5ActionCount,0);
});
test('literal one-ULP native paper endpoint mismatch blocks ORIGINAL vertex proof even with exact 3D model source',()=>{
 const x=fixture(),to=x.cad.hiddenSharpViews.H[0].to;
 to.u-=Number.EPSILON*10;
 x.endpointFans.rows[0].nativeProjectedTo={...to};
 x.endpointFans.rows[0].survivingOriginal3DEdgesWithEndpointFans[0].
  endpointWitnesses[1].nativePaperPoint={...to};
 const out=audit(x);
 assert.equal(out.counts.missingM4EndpointsIndependentlyPositiveNativeM0VertexProven,1);
 assert.equal(out.counts.missingM4EndpointsStillLackingIndependentNativeProof,1);
});
test('reversed or forged 3D original vertex from HLR witness does not authenticate M0 topology',()=>{
 const x=fixture();
 x.endpointFans.rows[0].survivingOriginal3DEdgesWithEndpointFans[0].
  endpointWitnesses[0].originalSource3DVertexId='B';
 assert.equal(audit(x).counts.missingM4EndpointsIndependentlyPositiveNativeM0VertexProven,1);
});
test('a native source interior paper cut stays an interior point and never creates an original 3D vertex',()=>{
 const x=fixture(),cut=x.cad.hiddenSharpViews.H[0].sourceCandidate3DLifts[0];
 const p={x:5,y:1.5,z:0};
 cut.sourceParameterAtProjectedTo=.5;cut.toCandidate3D=p;
 const paper=project(p).H;x.cad.hiddenSharpViews.H[0].to=paper;
 x.endpointFans.rows[0].nativeProjectedTo=paper;
 const w=x.endpointFans.rows[0].survivingOriginal3DEdgesWithEndpointFans[0].endpointWitnesses[1];
 w.originalSourceParameter=.5;w.nativePaperPoint=paper;
 w.originalSource3DVertexId=null;w.exactOriginalM0ParameterIsSourceVertex=false;
 w.possibleOriginal3DPoint=p;
 const out=audit(x);
 assert.equal(out.counts.originalInteriorSourceCutNotPromotedToVertex,1);
 assert.equal(out.rows[0].nativeSource3DVertexEndpointRows[0].endpointWitnesses[1].
  originalModel3DSourceVertexId,null);
 assert.equal(out.signedV5ActionCount,0);
});
test('forged original OCCT source BRep line or native generated TopoDS attribution rejected',()=>{
 const x=fixture();x.cad.originalBRepSourceEdges[0].
  originalOCCTBRepVertexXYZMatched=false;
 assert.throws(()=>audit(x),/native hidden original OCCT BRep source curve/);
 const y=fixture();y.cad.originalBRepSourceEdges[0].
  generatedHLREdgeTopoDSIdentityMatched=true;
 assert.throws(()=>audit(y),/native hidden original OCCT BRep source curve/);
});
