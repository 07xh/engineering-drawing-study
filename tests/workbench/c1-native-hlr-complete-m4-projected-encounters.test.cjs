'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {project}=require('../../core/projection/conventions.js');
const {paperLineEventRelation,auditC1NativeHLRAllM4ProjectedEncounters:audit}=
 require('../../workbench/c1-native-hlr-complete-m4-projected-encounters.cjs');
const rev=21,points={
 A:{x:0,y:0,z:0},B:{x:10,y:0,z:0},
 C:{x:10,y:10,z:0},D:{x:5,y:-5,z:0},E:{x:5,y:5,z:0}
},edges=[['A','B'],['B','C'],['D','E']];
const source=edge=>'G::'+[...edge].sort().join('|');
const e=({other,t,kind='crossing',physical=false,rounded=false})=>({
 otherSourceEdgeId:source(other),sourceParameter:t,kind,
 original3DPhysicalJunctionProven:physical,
 projectedOnlyUnresolved:!physical,
 sourceParameterBoundaryRoundedForDiagnostic:rounded,
 exactSharedOriginalVertexId:physical?'B':null
});
const fixture=()=>{
 const geometry={id:'G',data:{points:structuredClone(points),edges}};
 const from=project(points.A).H,to=project(points.B).H;
 const ab=source(edges[0]),bc=source(edges[1]),de=source(edges[2]);
 const m4={schema:'draftai-c1-original-source-m4-projected-event-graph/1',
  sourceGeometryId:'G',revision:rev,currentM0ClosedConvexVerified:true,
  sourceIntervalEngineeringLineStylesCertified:false,
  signedV5ActionCount:0,rows:[]};
 for(const view of ['V','H','W'])for(const edge of edges){
  const id=source(edge);m4.rows.push({
   sourceGeometryId:'G',view,sourceEdgeId:id,
   sourceOriginalVertexIds:[...edge],
   cutParameters:[0,0.5,1],
   encounters:view==='H'&&id===ab?[
    e({other:edges[1],t:1,physical:true,kind:'endpoint-touch-undetermined'}),
    e({other:edges[2],t:0.5})
   ]:[],signedV5ActionCount:0
  });
 }
 return {geometry,revision:rev,m4,
  cad:{sourceGeometryId:'G',revision:rev,
   hiddenHLROutputFromActualOCCT:true,
   actualOCCTHLREdgeToOriginalTopoDSIdentityMatched:false,
   v5Authorized:false,
   originalBRepSourceEdges:edges.map(edge=>({
    sourceEdgeId:source(edge),
    originalOCCTBRepVertexXYZMatched:true,
    occtCurveTypeIndependentlyVerified:true,
    occtSourceCurveType:'line',
    occtSourceCurve3DEndpointsAndMidpointVerified:true,
    generatedHLREdgeTopoDSIdentityMatched:false
   })),
   hiddenSharpViews:{V:[],H:[{
    view:'H',occtHLRVisibilityClass:'hidden-sharp',
    actualOCCTHLRFlattenedBRepLineVerified:true,
    actualOCCTHLRCurveEntireFiniteIntervalIsLine:true,
    v5Authorized:false,from,to,
    sourceCandidate3DLifts:[{
     sourceEdgeId:ab,originalSourceParameterRange:[0,1],
     actualOriginalOCCTBRepEdge3DEndpointsVerified:true,
     originalOCCTSourceLineCurveVerified:true,
     originalXYZReprojectsToHLR:true,v5Authorized:false
    }]
   }],W:[]}},
  refinements:[{view:'H',projectedFrom:from,projectedTo:to,
   signedV5Action:false,nativeHLRToSourceTopoDSIdentityRecovered:false,
   remainingPhysicalSourcePossibilities:[{sourceEdgeId:ab}]}],
  nativeVertexProof:{sourceGeometryId:'G',revision:rev,
   signedV5ActionCount:0,rows:[{
    view:'H',revision:rev,nativeHiddenSharpEdgeOrdinal:0,
    signedV5Action:false,uniqueSurvivingOriginalPhysical3DEdgeId:ab,
    nativeSource3DVertexEndpointRows:[{originalPhysicalSourceEdgeId:ab,
     endpointWitnesses:[
      {originalModel3DSourceVertexId:'A',
       originalM4SourceParameterGapRemainsUnrepaired:false,
       existingM4OriginalSourceEndpointVerified:true},
      {originalModel3DSourceVertexId:'B',
       originalM4SourceParameterGapRemainsUnrepaired:true,
       exactOriginal3DVertexAndClosedFaceFanNativeOCCTVerified:true}
     ]}]
   }]}
 };
};
test('ALL known M4 encounters of one genuine HLR hidden original source are audited, not just matching endpoints',()=>{
 const p=audit(fixture());
 assert.equal(p.counts.genuineNativeHiddenSharpEdgesInspected,1);
 assert.equal(p.counts.uniqueOriginal3DSourceNativeHLRLinesAudited,1);
 assert.equal(p.counts.originalM4PaperEncounterOccurrencesCovered,2);
 assert.equal(p.counts.exactOriginal3DPhysicalVertexEncountersCorroborated,1);
 assert.equal(p.counts.exactOriginal3DPhysicalSharedVertexAndOCCTSourceAtNativeHLR,1);
 const sourceVertex=p.rows[0].originalM4ProjectedEncountersOnNativeSource[0];
 assert.equal(sourceVertex.original3DVertexIncidenceWithBothRealOCCTOriginalBRepSourcesProven,true);
 assert.equal(sourceVertex.exactOriginalM4VertexOtherSourceDepthEvidence.
  exactOriginalVertexDepthRelativeOtherSourceSign,0);
 assert.equal(sourceVertex.exactOriginalM4VertexOtherSourceDepthEvidence.
  exactOriginal3DPhysicalVertexSharedBySourceEdges,true);
 assert.equal(p.counts.paperOnlyOriginalSourceCrossingsAndOverlapsHeld,1);
 assert.equal(p.counts.nativeHLRInteriorPaperEventsRequiringSceneJunctionReview,1);
 const [a,b]=p.rows[0].originalM4ProjectedEncountersOnNativeSource;
 assert.equal(a.positivelySameOriginal3DPhysicalSourceVertex,'B');
 assert.equal(a.independentlyNativeHLROriginal3DEndpointCorroborated,true);
 assert.equal(b.positivelySameOriginal3DPhysicalSourceVertex,null);
 assert.equal(b.fullGlobalProjectedJunctionAndDepthSwitchCertified,false);
 assert.equal(p.signedV5ActionCount,0);
});
test('one ULP off native line cannot be promoted into exactly matching generated HLR paper intersection',()=>{
 const r=paperLineEventRelation({
  nativeFrom:{u:0,v:0},nativeTo:{u:10,v:0},
  modelPoint:{u:5,v:Number.EPSILON}});
 assert.equal(r.originalEventOnSameNativePaperLineExactly,false);
 assert.equal(r.originalEventWithinNativePaperEndpointsNumerically,true);
 assert.equal(r.sameNativeGeneratedEdgeEndpointLiterally,false);
});
test('original 3D physical junction forged at interior parameter cannot enter global projected topology graph',()=>{
 const x=fixture(),event=x.m4.rows.find(r=>r.view==='H'&&r.sourceEdgeId===source(edges[0])).encounters[1];
 event.original3DPhysicalJunctionProven=true;
 event.projectedOnlyUnresolved=false;
 event.exactSharedOriginalVertexId='B';
 assert.throws(()=>audit(x),/forged 3D source junction/);
});
test('a rounded original M4 event stays unsigned and never passes as a shared 3D vertex',()=>{
 const x=fixture(),event=x.m4.rows.find(r=>r.view==='H'&&r.sourceEdgeId===source(edges[0])).encounters[1];
 event.sourceParameterBoundaryRoundedForDiagnostic=true;
 const p=audit(x);
 assert.equal(p.counts.roundedSourceParameterEncountersHeld,1);
 assert.equal(p.counts.exactOriginal3DPhysicalVertexEncountersCorroborated,1);
 assert.equal(p.rows[0].originalM4ProjectedEncountersOnNativeSource[1].signedV5Action,false);
});
test('stale geometry revision, fabricated native source, and duplicate canonical M4 source/view row fail closed',()=>{
 const x=fixture();x.refinements[0].view='V';
 assert.throws(()=>audit(x),/untrusted or reordered/);
 const y=fixture();y.m4.rows.push(y.m4.rows[0]);
 assert.throws(()=>audit(y),/omits or duplicates/);
 const z=fixture();z.cad.hiddenSharpViews.H[0].sourceCandidate3DLifts[0].originalSourceParameterRange=[.1,.9];
 const proof=audit(z);
 assert.equal(proof.counts.exactOriginal3DPhysicalVertexEncountersCorroborated,0);
 assert.equal(proof.counts.nativeHLRInteriorPaperEventsRequiringSceneJunctionReview,1);
});

test('canonical M4 transverse interior crossing gains exact original 3D forward-depth sign but never global line style',()=>{
 const x=fixture();
 x.geometry.data.points.D.z=10;x.geometry.data.points.E.z=10;
 const ev=x.m4.rows.find(r=>r.view==='H'&&
  r.sourceEdgeId===source(edges[0])).encounters[1];
 ev.kind='crossing';
 const r=audit(x);
 assert.equal(r.counts.nativeOriginalM4TransverseCrossingEventsFound,1);
 assert.equal(r.counts.exactOriginal3DStrictFrontDepthAtM4TransverseCrossingsProven,1);
 const event=r.rows[0].originalM4ProjectedEncountersOnNativeSource[1];
 assert.equal(event.exactOriginalM4CrossingObserverDepthEvidence.
  strictOriginal3DObserverDepthOrderAtPaperCrossingProven,true);
 assert.equal(event.exactOriginal3DFrontSourceAtTransversePaperCrossing,
  source(edges[2]));
 assert.equal(event.positivelySameOriginal3DPhysicalSourceVertex,null);
 assert.equal(event.fullGlobalProjectedJunctionAndDepthSwitchCertified,false);
 assert.equal(event.officialGBLineStyle,'undetermined');
 assert.equal(r.signedV5ActionCount,0);
});
test('source parameter 1 preserves original 3D model vertex projection bit-for-bit, never reconstructs endpoint via affine rounding',()=>{
 const a=12345678.1,b=1.1;
 assert.notEqual(a+(b-a),b);
 const x=fixture();
 x.geometry.data.points.A.x=a;
 x.geometry.data.points.B.x=b;
 x.cad.hiddenSharpViews.H[0].from=project(x.geometry.data.points.A).H;
 x.cad.hiddenSharpViews.H[0].to=project(x.geometry.data.points.B).H;
 x.refinements[0].projectedFrom=project(x.geometry.data.points.A).H;
 x.refinements[0].projectedTo=project(x.geometry.data.points.B).H;
 const result=audit(x);
 const endpoint=result.rows[0].originalM4ProjectedEncountersOnNativeSource[0];
 assert.equal(endpoint.originalEventPaperPoint.u,b);
 assert.equal(endpoint.actualNativeGeneratedBRepPaperRelation.
  originalEventOnSameNativePaperLineExactly,true);
});

test('shared M0 original 3D vertex and real original OCCT BRep remain proven when numeric native HLR segment misses model event by one ULP',()=>{
 const x=fixture(),row=x.m4.rows.find(r=>r.view==='H'&&
  r.sourceEdgeId===source(edges[0]));
 const event=row.encounters[0];
 x.cad.hiddenSharpViews.H[0].to.v=Number.EPSILON;
 x.refinements[0].projectedTo.v=Number.EPSILON;
 const proof=audit(x),w=proof.rows[0].originalM4ProjectedEncountersOnNativeSource[0];
 assert.equal(w.positivelySameOriginal3DPhysicalSourceVertex,'B');
 assert.equal(w.original3DVertexIncidenceWithBothRealOCCTOriginalBRepSourcesProven,true);
 assert.equal(w.originalHLRGeneratedPaperMismatchRemains,true);
 assert.equal(proof.counts.exactOriginal3DPhysicalSharedVertexDespiteNativePaperMismatch,1);
 assert.equal(w.fullGlobalProjectedJunctionAndDepthSwitchCertified,false);
 assert.equal(w.signedV5Action,false);
});
test('independent original BRep source missing or counterfeit cannot authorize source junction through native paper alias',()=>{
 const x=fixture();
 x.cad.originalBRepSourceEdges[1].occtCurveTypeIndependentlyVerified=false;
 const proof=audit(x);
 assert.equal(proof.counts.exactOriginal3DPhysicalSharedVertexAndOCCTSourceAtNativeHLR,0);
 assert.equal(proof.rows[0].originalM4ProjectedEncountersOnNativeSource[0].
  original3DVertexIncidenceWithBothRealOCCTOriginalBRepSourcesProven,false);
});
