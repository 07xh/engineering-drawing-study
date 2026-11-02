'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {
 probeRealOcjsHLREdgeStatusABI:probe,
 auditGeneratedOutputEdgesAgainstOriginalSourceCurves:auditGenerated,
 auditOriginalEdgeStatusVsSourceScoped3DSharp:auditNativeClass
} = require('../../engines/spatial/hlr/c1-ocjs-edgestatus-abi.cjs');

function sources(n=2){
 return Array.from({length:n},(_,i)=>({
  hlrDataStructureOneBasedEdgeIndex:i+1,
  originalPhysicalSourceEdgeId:'g::E'+i
 }));
}
function status(bounds,parts,allVisible=false,allHidden=false){
 return {
  Bounds(){return bounds;},
  NbVisiblePart(){return parts.length;},
  VisiblePart(i){return parts[i-1];},
  AllVisible(){return allVisible;},
  AllHidden(){return allHidden;}
 };
}
function dataStructure(rows){
 return {
  EDataArray(){
   return {
    Value(i){
     return {
      Status(){return rows[i-1];}
     };
    }
   };
  }
 };
}

test('reads original EdgeStatus bounds and visible partitions without signing',()=>{
 const ds=dataStructure([
  status([0,10],[[0,4],[6,10]]),
  status([2,8],[[2,8]],true,false)
 ]);
 const r=probe({oc:{HLRAlgo_EdgeStatus:function(){}},dataStructure:ds,
  edgeMapExtent:2,indexedOriginalSources:sources()});
 assert.equal(r.availability,'all-original-edge-status-intervals-readable');
 assert.equal(r.readableSourceStatusRows,2);
 assert.deepEqual(r.rows[0].visibleParts,[[0,4],[6,10]]);
 assert.equal(r.rows[0].parameterPartitionValidated,true);
 assert.equal(r.rows[1].allVisible,true);
 assert.equal(r.generated2DHLRTopoDSHistoryCertified,false);
 assert.equal(r.engineeringLineStyle,'undetermined');
 assert.equal(r.signedV5ActionCount,0);
});

test('fails closed when C++ output-reference methods do not marshal to JS return values',()=>{
 const unreadable={
  EDataArray(){
   return {
    Value(){
     return {
      Status(){
       return {
        Bounds(){return undefined;},
        NbVisiblePart(){return 1;},
        VisiblePart(){return undefined;},
        AllVisible(){return false;},
        AllHidden(){return false;}
       };
      }
     };
    }
   };
  }
 };
 const r=probe({oc:{},dataStructure:unreadable,edgeMapExtent:1,
  indexedOriginalSources:sources(1)});
 assert.equal(r.availability,'bounds-output-not-readable');
 assert.equal(r.rows[0].boundsReadFailure,'output-reference-not-marshalled');
 assert.deepEqual(r.rows[0].boundsMethodArities,[{name:'Bounds',length:0}]);
 assert.equal(r.diagnostic.statusGetterMethod,'Status');
 assert.equal(r.signedV5ActionCount,0);
});

test('rejects overlapping, out-of-domain and contradictory visibility partitions',()=>{
 const bad=[
  status([0,1],[[0,0.7],[0.6,1]]),
  status([0,1],[[0,1.1]]),
  status([0,1],[[0,1]],true,true),
  status([0,1],[[0,0.5]],true,false),
  status([0,1],[[0,0.5]],false,true)
 ];
 for(const item of bad){
  const ds=dataStructure([item]);
  assert.throws(()=>probe({oc:{},dataStructure:ds,edgeMapExtent:1,
   indexedOriginalSources:sources(1)}),/partition is contradictory/);
 }
});

test('reads tuple-return EdgeStatus output-reference wrappers with zero-argument calls',()=>{
 const row={
  Bounds(){return {first:0,second:12};},
  NbVisiblePart(){return 2;},
  VisiblePart(i){return i===1?[0,5]:i===2?[8,12]:null;},
  AllVisible(){return false;},
  AllHidden(){return false;}
 };
 const r=probe({oc:{},dataStructure:dataStructure([row]),
  edgeMapExtent:1,indexedOriginalSources:sources(1)});
 assert.equal(r.availability,'all-original-edge-status-intervals-readable');
 assert.deepEqual(r.rows[0].bounds,[0,12]);
 assert.deepEqual(r.rows[0].visibleParts,[[0,5],[8,12]]);
 assert.equal(r.rows[0].parameterPartitionValidated,true);
 assert.equal(r.signedV5ActionCount,0);
});

test('falls back to numeric output placeholders only when zero-argument wrappers are unreadable',()=>{
 const calls=[];
 const row={
  Bounds(...args){
   calls.push(['Bounds',args.length]);
   return args.length===0?undefined:[0,9];
  },
  NbVisiblePart(){return 1;},
  VisiblePart(...args){
   calls.push(['VisiblePart',args.length]);
   return args.length===1?undefined:[0,9];
  },
  AllVisible(){return true;},
  AllHidden(){return false;}
 };
 const r=probe({oc:{},dataStructure:dataStructure([row]),
  edgeMapExtent:1,indexedOriginalSources:sources(1)});
 assert.equal(r.availability,'all-original-edge-status-intervals-readable');
 assert.deepEqual(r.rows[0].bounds,[0,9]);
 assert.deepEqual(r.rows[0].visibleParts,[[0,9]]);
 assert.deepEqual(calls,[['Bounds',0],['Bounds',4],['VisiblePart',1],['VisiblePart',5]]);
});

test('does not call missing EDataArray and reports the exact missing ABI layer',()=>{
 const r=probe({oc:{},dataStructure:{EdgeMap(){}},edgeMapExtent:1,
  indexedOriginalSources:sources(1)});
 assert.equal(r.availability,'edge-data-array-not-exposed');
 assert.equal(r.readableSourceStatusRows,0);
});

test('rejects stale, duplicate, or incomplete same-run source index inventories',()=>{
 assert.throws(()=>probe({oc:{},dataStructure:{},edgeMapExtent:2,
  indexedOriginalSources:sources(1)}),/complete original source index/);
 const stale=sources();
 stale[1].hlrDataStructureOneBasedEdgeIndex=1;
 assert.throws(()=>probe({oc:{},dataStructure:{},edgeMapExtent:2,
  indexedOriginalSources:stale}),/complete original source index/);
});

test('supports Embind overload suffixes without guessing method names',()=>{
 const row={
  Bounds_1(){return [0,3];},
  NbVisiblePart_1(){return 1;},
  VisiblePart_1(i){return i===1?[0,3]:null;},
  AllVisible_1(){return true;},
  AllHidden_1(){return false;}
 };
 const ds={
  EDataArray_1(){
   return {
    Value_1(){
     return {
      Status_1(){return row;}
     };
    }
   };
  }
 };
 const r=probe({oc:{},dataStructure:ds,edgeMapExtent:1,
  indexedOriginalSources:sources(1)});
 assert.equal(r.availability,'all-original-edge-status-intervals-readable');
 assert.deepEqual(r.rows[0].bounds,[0,3]);
 assert.deepEqual(r.rows[0].visibleParts,[[0,3]]);
});


test('duplicate physical source IDs are rejected even with consecutive native indices',()=>{
 const ids=sources();
 ids[1].originalPhysicalSourceEdgeId=ids[0].originalPhysicalSourceEdgeId;
 assert.throws(()=>probe({oc:{},dataStructure:{},edgeMapExtent:2,
  indexedOriginalSources:ids}),/complete original source index/);
});

test('corrupt visible-part count cannot lock the workbench in an unbounded loop',()=>{
 let visiblePartCalls=0;
 const ds=dataStructure([{
  Bounds(){return [0,1];},
  NbVisiblePart(){return Number.MAX_SAFE_INTEGER;},
  VisiblePart(){visiblePartCalls++;return [0,1];},
  AllVisible(){return false;},AllHidden(){return false;}
 }]);
 assert.throws(()=>probe({oc:{},dataStructure:ds,edgeMapExtent:1,
  indexedOriginalSources:sources(1)}),/exceeds diagnostic budget/);
 assert.equal(visiblePartCalls,0);
});

test('incompatible first Embind overload does not mask a readable second overload',()=>{
 const ds=dataStructure([{
  Bounds_1(){throw new TypeError('wrong overload');},
  Bounds_2(){return [0,1];},
  NbVisiblePart_1(){throw new TypeError('wrong overload');},
  NbVisiblePart_2(){return 1;},
  VisiblePart_1(){throw new TypeError('wrong overload');},
  VisiblePart_2(i){return i===1?[0,1]:null;},
  AllVisible_1(){throw new TypeError('wrong overload');},
  AllVisible_2(){return true;},
  AllHidden_1(){throw new TypeError('wrong overload');},
  AllHidden_2(){return false;}
 }]);
 const r=probe({oc:{},dataStructure:ds,edgeMapExtent:1,
  indexedOriginalSources:sources(1)});
 assert.equal(r.availability,'all-original-edge-status-intervals-readable');
 assert.equal(r.rows[0].parameterPartitionValidated,true);
 assert.deepEqual(r.rows[0].visibleParts,[[0,1]]);
 assert.equal(r.signedV5ActionCount,0);
});


test('inspects original EdgeData curve parameters and symmetric TopoDS edge identity without upgrading 2D history',()=>{
 const nativeEdge={IsSame(other){return other?.identity==='edge-A';},identity:'edge-A'};
 const adaptor={
  FirstParameter(){return 2.5;},
  LastParameter(){return 8.5;},
  Edge(){return nativeEdge;}
 };
 const curve={
  GetCurve(){return adaptor;},
  Parameter2d(value){return value+0.25;},
  Parameter3d(value){return value-0.25;},
  Value3D(value){return {X(){return value;},Y(){return value*2;},Z(){return value*3;}};},
  Value(value){return {X(){return value;},Y(){return -value*2;}};}
 };
 const edgeData={
  Status(){return status([2.5,8.5],[[2.5,8.5]],true,false);},
  VSta(){return 3;},VEnd(){return 7;},HideCount(){return 0;},
  Tolerance(){return 1e-7;},
  OutLVSta(){return false;},OutLVEnd(){return false;},
  CutAtSta(){return false;},CutAtEnd(){return false;},
  VerAtSta(){return true;},VerAtEnd(){return true;},
  Rg1Line(){return false;},RgNLine(){return false;},
  Used(){return true;},Selected(){return false;},
  Simple(){return true;},AutoIntersectionDone(){return false;},
  Geometry(){return curve;}
 };
 const ds={EDataArray(){return {Value(){return edgeData;}};}};
 const r=probe({oc:{},dataStructure:ds,edgeMapExtent:1,
  indexedOriginalSources:sources(1),
  originalNativeEdgeHandles:[
   {sourceEdgeId:'g::E0',edge:nativeEdge,parameterRange:[2.5,8.5]},
   {sourceEdgeId:'g::E0',edge:nativeEdge,parameterRange:[2.5,8.5]}
  ],view:'H'});
 const row=r.rows[0].originalEdgeData;
 assert.equal(row.scalarValues.VSta,3);
 assert.equal(row.scalarValues.VEnd,7);
 assert.equal(row.scalarValues.HideCount,0);
 assert.equal(row.scalarValues.Tolerance,1e-7);
 assert.deepEqual(row.original3DCurveParameterRange,[2.5,8.5]);
 assert.equal(row.original3DToProjected2DCurveParameterMap.readable,true);
 assert.equal(row.original3DToProjected2DCurveParameterMap.roundTripWithinDiagnosticTolerance,true);
 assert.equal(row.original3DToProjected2DCurveParameterMap.canonicalProjectionCoordinatesMatch,true);
 assert.deepEqual(row.original3DToProjected2DCurveParameterMap.samples.map(x=>x.parameter2d),
  [2.75,5.75,8.75]);
 assert.deepEqual(row.original3DToProjected2DCurveParameterMap.samples[0].projectedPoint2D,
  [2.5,-5]);
 assert.deepEqual(row.original3DToProjected2DCurveParameterMap.samples[0].expectedCanonicalProjectedPoint2D,
  [2.5,5]);
 assert.deepEqual(row.original3DToProjected2DCurveParameterMap.samples[0].expectedProjectorLocalPoint2D,
  [2.5,-5]);
 assert.deepEqual(row.directOriginalTopoDSEdgeIsSameMatches,['g::E0']);
 assert.equal(row.directOriginalTopoDSEdgeIdentityProven,true);
 assert.deepEqual(row.originalBRepSourceParameterRange,[2.5,8.5]);
 assert.equal(row.originalBRepParameterRangeMatches,true);
 assert.equal(row.generated2DHLRTopoDSHistoryProven,false);
 assert.equal(r.originalNativeEdgeHandleLedgerComplete,true);
 assert.equal(r.originalNativeEdgeHandleOccurrenceCount,2);
 assert.equal(r.originalNativeEdgeHandleUniqueSourceCount,1);
 assert.equal(r.signedV5ActionCount,0);
});


test('continues original EdgeData topology inspection after the first unreadable status interval',()=>{
 const makeEdgeData=(id,readable)=>{
  const item={
   Bounds(){return readable?[0,4]:undefined;},
   NbVisiblePart(){return 1;},
   VisiblePart(){return readable?[0,4]:undefined;},
   AllVisible(){return true;},AllHidden(){return false;}
  };
  return {
   Status(){return item;},
   VSta(){return id==='g::E0'?1:2;},
   VEnd(){return id==='g::E0'?2:3;},
   Geometry(){return {GetCurve(){return {
    FirstParameter(){return 0;},LastParameter(){return 4;},
    Edge(){return {IsSame(){return false;}};}
   };}};}
  };
 };
 const rows=[makeEdgeData('g::E0',false),makeEdgeData('g::E1',false)];
 const ds={EDataArray(){return {Value(i){return rows[i-1];}};}};
 const r=probe({oc:{},dataStructure:ds,edgeMapExtent:2,
  indexedOriginalSources:sources(2)});
 assert.equal(r.availability,'bounds-output-not-readable');
 assert.equal(r.rows.length,2);
 assert.deepEqual(r.rows.map(x=>x.sourceEdgeId),['g::E0','g::E1']);
 assert.deepEqual(r.edgeDataSummary.map(x=>x.vertexStartIndex),[1,2]);
 assert.deepEqual(r.edgeDataSummary.map(x=>x.original3DCurveParameterRange),[[0,4],[0,4]]);
 assert.equal(r.original3DEdgeDataInspectionComplete,true);
 assert.equal(r.generated2DHLRHistoryStillUnproven,true);
 assert.equal(r.signedV5ActionCount,0);
});


test('keeps unreadable native curve parameter maps unsigned instead of inferring 2D ancestry',()=>{
 const edge={IsSame(){return true;}};
 const adaptor={FirstParameter(){return 0;},LastParameter(){return 1;},Edge(){return edge;}};
 const curve={GetCurve(){return adaptor;}};
 const ds={EDataArray(){return {Value(){return {
  Status(){return status([0,1],[[0,1]],true,false);},
  Geometry(){return curve;}
 };}};}};
 const r=probe({oc:{},dataStructure:ds,edgeMapExtent:1,
  indexedOriginalSources:sources(1),
  originalNativeEdgeHandles:[{sourceEdgeId:'g::E0',edge,parameterRange:[0,1]}]});
 const map=r.rows[0].originalEdgeData.original3DToProjected2DCurveParameterMap;
 assert.equal(map.readable,false);
 assert.equal(map.roundTripWithinDiagnosticTolerance,false);
 assert.equal(r.rows[0].originalEdgeData.generated2DHLRTopoDSHistoryProven,false);
 assert.equal(r.signedV5ActionCount,0);
});

test('classifies a view-collapsed original edge as non-invertible without treating it as an ABI failure',()=>{
 const edge={IsSame(){return true;}};
 const adaptor={FirstParameter(){return 0;},LastParameter(){return 9;},Edge(){return edge;}};
 const curve={
  GetCurve(){return adaptor;},
  Parameter2d(_parameter){return 0;},Parameter3d(_parameter){return 0;},
  Value3D(t){return {X(){return 2;},Y(){return t;},Z(){return 0;}};},
  Value(_parameter){return {X(){return 2;},Y(){return 0;}};}
 };
 const ds={EDataArray(){return {Value(){return {
  Status(){return status([0,9],[[0,9]],true,false);},
  Geometry(){return curve;}
 };}};}};
 const r=probe({oc:{},dataStructure:ds,edgeMapExtent:1,
  indexedOriginalSources:sources(1),
  originalNativeEdgeHandles:[{sourceEdgeId:'g::E0',edge,parameterRange:[0,9]}],view:'V'});
 const map=r.rows[0].originalEdgeData.original3DToProjected2DCurveParameterMap;
 assert.equal(map.readable,true);
 assert.equal(map.projectionCollapsed,true);
 assert.equal(map.roundTripApplicable,false);
 assert.equal(map.roundTripWithinDiagnosticTolerance,null);
 assert.equal(map.canonicalProjectionCoordinatesMatch,true);
 assert.equal(r.rows[0].originalEdgeData.generated2DHLRTopoDSHistoryProven,false);
 assert.equal(r.signedV5ActionCount,0);
});


test('parameterized generated 2D HLR curve is tied to one same-run original TopoDS source curve',()=>{
 const curve={
  Parameter2d(value){return value+2;},
  Parameter3d(value){return value-2;},
  Value(value){return {X(){return value;},Y(){return -2*value;}};}
 };
 const nativeCurveHandlesBySourceId=new Map([['g::E0',{
  curve,parameterRange:[0,10],originalBRepParameterRange:[0,10],
  originalBRepParameterRangeMatches:true,directOriginalTopoDSEdgeIdentityProven:true
 }]]);
 const segment={
  actualOCCTHLRCurveParameterRange:[2,8],
  actualOCCTHLRCurveSamplesProjectedMm:[0,1.5,3,4.5,6].map(t=>({u:t,v:2*t})),
  actualOCCTHLRCurveSampleToleranceMm:1e-6
 };
 const r=auditGenerated({segments:[segment],nativeCurveHandlesBySourceId});
 assert.equal(r.sourceCurveCandidateCount,1);
 assert.equal(r.topoDSIdentityBoundSourceCurveCount,1);
 assert.equal(r.topoDSParameterDomainBoundSourceCurveCount,1);
 assert.equal(r.uniqueParameterizedSourceMatchCount,1);
 assert.equal(r.ambiguousParameterizedSourceMatchCount,0);
 assert.equal(r.unmatchedGeneratedOutputEdgeCount,0);
 const match=r.rows[0].candidateSourceMatches[0];
 assert.equal(match.originalTopoDSEdgeIdentityProven,true);
 assert.deepEqual(match.original3DCurveParameterRange,[0,10]);
 assert.deepEqual(match.sourceProjected2DParameterRange,[2,12]);
 assert.deepEqual(match.sourceProjected2DParameterRangeSorted,[2,12]);
 assert.equal(match.sourceProjected2DParameterRangeMatchesGeneratedOutputRange,false);
 assert.deepEqual(match.sourceProjected2DParameterEndpointResiduals,[0,-4]);
 assert.deepEqual(match.source3DParameterRange,[0,6]);
 assert.equal(match.generated2DTopoDSHistoryProven,false);
 assert.equal(match.engineeringLineStyle,'undetermined');
 assert.equal(match.signedV5Action,false);
});

test('forward-mapped original source endpoints exactly bind a full generated 2D output interval',()=>{
 const curve={
  Parameter2d(value){return value+2;},
  Parameter3d(value){return value-2;},
  Value(value){return {X(){return value;},Y(){return -2*value;}};}
 };
 const nativeCurveHandlesBySourceId=new Map([['g::E0',{
  curve,parameterRange:[0,10],originalBRepParameterRange:[0,10],
  originalBRepParameterRangeMatches:true,directOriginalTopoDSEdgeIdentityProven:true
 }]]);
 const segment={
  actualOCCTHLRCurveParameterRange:[2,12],
  actualOCCTHLRCurveSamplesProjectedMm:[0,2.5,5,7.5,10].map(t=>({u:t,v:2*t})),
  actualOCCTHLRCurveSampleToleranceMm:1e-6
 };
 const r=auditGenerated({segments:[segment],nativeCurveHandlesBySourceId});
 const match=r.rows[0].candidateSourceMatches[0];
 assert.equal(r.uniqueParameterizedSourceMatchCount,1);
 assert.deepEqual(match.source3DParameterRange,[0,10]);
 assert.deepEqual(match.sourceProjected2DParameterRange,[2,12]);
 assert.equal(match.sourceProjected2DParameterRangeMatchesGeneratedOutputRange,true);
 assert.deepEqual(match.sourceProjected2DParameterEndpointResiduals,[0,0]);
});

test('parameterized generated curve rejects an output interval outside the original projected source domain',()=>{
 const curve={
  Parameter2d(value){return value+2;},
  Parameter3d(value){return value-2;},
  Value(value){return {X(){return value;},Y(){return -2*value;}};}
 };
 const nativeCurveHandlesBySourceId=new Map([['g::E0',{
  curve,parameterRange:[0,10],originalBRepParameterRange:[0,10],
  originalBRepParameterRangeMatches:true,directOriginalTopoDSEdgeIdentityProven:true
 }]]);
 const segment={
  actualOCCTHLRCurveParameterRange:[1,8],
  actualOCCTHLRCurveSamplesProjectedMm:[0,1,2,3,4].map(t=>({u:t,v:2*t})),
  actualOCCTHLRCurveSampleToleranceMm:1e-6
 };
 const r=auditGenerated({segments:[segment],nativeCurveHandlesBySourceId});
 assert.equal(r.uniqueParameterizedSourceMatchCount,0);
 assert.equal(r.unmatchedGeneratedOutputEdgeCount,1);
 assert.equal(r.rows[0].status,'no-parameterized-source-curve-match');
 assert.equal(r.generated2DTopoDSHistoryProven,false);
});

test('generated Sharp source match holds one-ULP positive 2D overhang on either original BRep endpoint',()=>{
 const curve={
  Parameter2d(t){return t+2;},Parameter3d(t){return t-2;},
  Value(t){return {X(){return t;},Y(){return -2*t;}};}
 };
 const source=new Map([['g::E0',{curve,parameterRange:[0,10],
  originalBRepParameterRange:[0,10],originalBRepParameterRangeMatches:true,
  directOriginalTopoDSEdgeIdentityProven:true}]]);
 const upper=12+8*Number.EPSILON;
 assert.ok(upper>12);
 for(const interval of [[2-Number.EPSILON,8],[8,upper]]){
  const samples=Array.from({length:5},(_,i)=>{
   const p2=interval[0]+(interval[1]-interval[0])*i/4;
   return {u:p2-2,v:2*(p2-2)};
  });
  const r=auditGenerated({segments:[{
   actualOCCTHLRCurveParameterRange:interval,
   actualOCCTHLRCurveSamplesProjectedMm:samples,
   actualOCCTHLRCurveSampleToleranceMm:1e-6
  }],nativeCurveHandlesBySourceId:source});
  assert.equal(r.uniqueParameterizedSourceMatchCount,0);
  assert.equal(r.unmatchedGeneratedOutputEdgeCount,1);
  assert.equal(r.rows[0].rejectedSourceCandidateCount,1);
  assert.equal(r.rows[0].status,'no-parameterized-source-curve-match');
  assert.equal(r.generated2DTopoDSHistoryProven,false);
  assert.equal(r.signedV5ActionCount,0);
 }
});

test('two original native source curves with identical projected parameterization remain ambiguous',()=>{
 const makeCurve=()=>({
  Parameter2d(value){return value+2;},
  Parameter3d(value){return value-2;},
  Value(value){return {X(){return value;},Y(){return -2*value;}};}
 });
 const nativeCurveHandlesBySourceId=new Map([
  ['g::E0',{curve:makeCurve(),parameterRange:[0,10],originalBRepParameterRange:[0,10],
   originalBRepParameterRangeMatches:true,directOriginalTopoDSEdgeIdentityProven:true}],
  ['g::E1',{curve:makeCurve(),parameterRange:[0,10],originalBRepParameterRange:[0,10],
   originalBRepParameterRangeMatches:true,directOriginalTopoDSEdgeIdentityProven:true}]
 ]);
 const segment={
  actualOCCTHLRCurveParameterRange:[2,8],
  actualOCCTHLRCurveSamplesProjectedMm:[0,1.5,3,4.5,6].map(t=>({u:t,v:2*t})),
  actualOCCTHLRCurveSampleToleranceMm:1e-6
 };
 const r=auditGenerated({segments:[segment],nativeCurveHandlesBySourceId});
 assert.equal(r.uniqueParameterizedSourceMatchCount,0);
 assert.equal(r.ambiguousParameterizedSourceMatchCount,1);
 assert.equal(r.unmatchedGeneratedOutputEdgeCount,0);
 assert.equal(r.rows[0].candidateSourceMatchCount,2);
 assert.equal(r.rows[0].uniqueOriginalSourceEdgeId,null);
 assert.equal(r.rows[0].generated2DTopoDSHistoryProven,false);
});

test('mismatched original BRep and HLR curve parameter domains cannot establish source lineage',()=>{
 const curve={
  Parameter2d(value){return value+2;},
  Parameter3d(value){return value-2;},
  Value(value){return {X(){return value;},Y(){return -2*value;}};}
 };
 const nativeCurveHandlesBySourceId=new Map([['g::E0',{
  curve,parameterRange:[0,10],originalBRepParameterRange:[0,9],
  originalBRepParameterRangeMatches:false,
  directOriginalTopoDSEdgeIdentityProven:true
 }]]);
 const segment={
  actualOCCTHLRCurveParameterRange:[2,8],
  actualOCCTHLRCurveSamplesProjectedMm:[0,1.5,3,4.5,6].map(t=>({u:t,v:2*t})),
  actualOCCTHLRCurveSampleToleranceMm:1e-6
 };
 const r=auditGenerated({segments:[segment],nativeCurveHandlesBySourceId});
 assert.equal(r.topoDSIdentityBoundSourceCurveCount,1);
 assert.equal(r.topoDSParameterDomainBoundSourceCurveCount,0);
 assert.equal(r.uniqueParameterizedSourceMatchCount,0);
 assert.equal(r.unmatchedGeneratedOutputEdgeCount,1);
});

test('a forged true domain-match flag cannot override different original BRep parameter bounds',()=>{
 const curve={
  Parameter2d(value){return value+2;},
  Parameter3d(value){return value-2;},
  Value(value){return {X(){return value;},Y(){return -2*value;}};}
 };
 const nativeCurveHandlesBySourceId=new Map([['g::E0',{
  curve,parameterRange:[0,10],originalBRepParameterRange:[0,9],
  originalBRepParameterRangeMatches:true,
  directOriginalTopoDSEdgeIdentityProven:true
 }]]);
 const segment={
  actualOCCTHLRCurveParameterRange:[2,8],
  actualOCCTHLRCurveSamplesProjectedMm:[0,1.5,3,4.5,6].map(t=>({u:t,v:2*t})),
  actualOCCTHLRCurveSampleToleranceMm:1e-6
 };
 const r=auditGenerated({segments:[segment],nativeCurveHandlesBySourceId});
 assert.equal(r.topoDSIdentityBoundSourceCurveCount,1);
 assert.equal(r.topoDSParameterDomainBoundSourceCurveCount,0);
 assert.equal(r.uniqueParameterizedSourceMatchCount,0);
 assert.equal(r.unmatchedGeneratedOutputEdgeCount,1);
 assert.equal(r.rows[0].rejectedSourceCandidateCount,1);
});

test('unproven original TopoDS identity cannot enter parameterized source matches',()=>{
 const curve={
  Parameter2d(value){return value+2;},
  Parameter3d(value){return value-2;},
  Value(value){return {X(){return value;},Y(){return -2*value;}};}
 };
 const nativeCurveHandlesBySourceId=new Map([['g::E0',{
  curve,parameterRange:[0,10],originalBRepParameterRange:[0,10],
  originalBRepParameterRangeMatches:false,directOriginalTopoDSEdgeIdentityProven:false
 }]]);
 const segment={
  actualOCCTHLRCurveParameterRange:[2,8],
  actualOCCTHLRCurveSamplesProjectedMm:[0,1.5,3,4.5,6].map(t=>({u:t,v:2*t})),
  actualOCCTHLRCurveSampleToleranceMm:1e-6
 };
 const r=auditGenerated({segments:[segment],nativeCurveHandlesBySourceId});
 assert.equal(r.sourceCurveCandidateCount,1);
 assert.equal(r.topoDSIdentityBoundSourceCurveCount,0);
 assert.equal(r.topoDSParameterDomainBoundSourceCurveCount,0);
 assert.equal(r.unmatchedGeneratedOutputEdgeCount,1);
 assert.equal(r.uniqueParameterizedSourceMatchCount,0);
});

function referenceStatus(bounds,boundsTolerances,parts,partTolerances,
 allVisible=false,allHidden=false){
 return {
  Bounds(start,tolStart,end,tolEnd){
   start.current=bounds[0];tolStart.current=boundsTolerances[0];
   end.current=bounds[1];tolEnd.current=boundsTolerances[1];
  },
  NbVisiblePart(){return parts.length;},
  VisiblePart(index,start,tolStart,end,tolEnd){
   const i=index-1,interval=parts[i],tolerances=partTolerances[i];
   start.current=interval[0];tolStart.current=tolerances[0];
   end.current=interval[1];tolEnd.current=tolerances[1];
  },
  AllVisible(){return allVisible;},
  AllHidden(){return allHidden;}
 };
}
test('reads pinned OpenCascade.js mutable current-reference outputs and preserves OCCT endpoint tolerances',()=>{
 const row=referenceStatus([0,10],[0.125,0.25],
  [[0,4],[6,10]],[[2,2],[2,2]]);
 const r=probe({oc:{},dataStructure:dataStructure([row]),
  edgeMapExtent:1,indexedOriginalSources:sources(1)});
 assert.equal(r.availability,'all-original-edge-status-intervals-readable');
 assert.equal(r.readableSourceStatusRows,1);
 assert.deepEqual(r.rows[0].bounds,[0,10]);
 assert.deepEqual(r.rows[0].boundsEndpointTolerances,[0.125,0.25]);
 assert.equal(r.rows[0].boundsReadABI,'mutable-current-reference');
 assert.deepEqual(r.rows[0].visibleParts,[[0,4],[6,10]],
  'positive visible interval gap remains explicit despite endpoint tolerances');
 assert.deepEqual(r.rows[0].visiblePartEndpointTolerances,[[2,2],[2,2]]);
 assert.deepEqual(r.rows[0].visiblePartReadABIs,
  ['mutable-current-reference','mutable-current-reference']);
 assert.equal(r.rows[0].parameterPartitionValidated,true);
 assert.equal(r.generated2DHLRTopoDSHistoryCertified,false);
 assert.equal(r.engineeringLineStyle,'undetermined');
 assert.equal(r.signedV5ActionCount,0);
});
test('negative or non-finite OCCT output-reference tolerances remain unreadable and unsigned',()=>{
 const row=referenceStatus([0,10],[-0.01,0],
  [[0,10]],[[0,0]],true,false);
 const r=probe({oc:{},dataStructure:dataStructure([row]),
  edgeMapExtent:1,indexedOriginalSources:sources(1)});
 assert.equal(r.availability,'bounds-output-not-readable');
 assert.equal(r.rows[0].boundsReadFailure,'invalid-output-reference-values');
 assert.equal(r.rows[0].bounds,null);
 assert.equal(r.rows[0].parameterPartitionValidated,false);
 assert.equal(r.signedV5ActionCount,0);
});

test('original EdgeStatus and independently extracted native 3D Sharp agree on exact visible/hidden partition',()=>{
 const r=auditNativeClass({
  sourceEdgeId:'g::E0',originalNativeParameterRange:[0,10],
  statusRow:{sourceEdgeId:'g::E0',parameterPartitionValidated:true,
   bounds:[0,10],visibleParts:[[0,4],[6,10]]},
  visibleNativeIntervals:[[6,10],[0,4]],
  hiddenNativeIntervals:[[4,6]]
 });
 assert.equal(r.comparable,true);
 assert.equal(r.nativeOriginalStatusClassAgreesWith3DSharp,true);
 assert.equal(r.exactAlignedSubintervals,3);
 assert.deepEqual(r.mismatchedNativeVisibilitySubintervals,[]);
 assert.deepEqual(r.uncoveredSourceScoped3DSubintervals,[]);
 assert.equal(r.generated2DTopoDSHistoryCertified,false);
 assert.equal(r.signedV5Action,false);
});
test('one-ULP native 3D Sharp gap is observed without tolerances or rounded midpoints',()=>{
 const next=1+Number.EPSILON;
 const r=auditNativeClass({
  sourceEdgeId:'g::E0',originalNativeParameterRange:[0,2],
  statusRow:{sourceEdgeId:'g::E0',parameterPartitionValidated:true,
   bounds:[0,2],visibleParts:[[0,2]]},
  visibleNativeIntervals:[[0,1],[next,2]],hiddenNativeIntervals:[]
 });
 assert.equal(r.comparable,true);
 assert.equal(r.nativeOriginalStatusClassAgreesWith3DSharp,false);
 assert.deepEqual(r.uncoveredSourceScoped3DSubintervals.map(x=>x.originalNativeParameterRange),
  [[1,next]]);
 assert.equal(r.exactBinary64OpenSubintervalsChecked,3);
 assert.equal(r.signedV5Action,false);
});
test('genuine native sharp class disagreement and overlap are separated from 2D HLR history',()=>{
 const base={sourceEdgeId:'g::E0',originalNativeParameterRange:[0,10],
  statusRow:{sourceEdgeId:'g::E0',parameterPartitionValidated:true,
   bounds:[0,10],visibleParts:[[0,5]]}};
 const opposite=auditNativeClass({...base,
  visibleNativeIntervals:[[0,7]],hiddenNativeIntervals:[[7,10]]});
 assert.deepEqual(opposite.mismatchedNativeVisibilitySubintervals.map(x=>x.originalNativeParameterRange),
  [[5,7]]);
 assert.equal(opposite.nativeOriginalStatusClassAgreesWith3DSharp,false);
 const overlapping=auditNativeClass({...base,
  visibleNativeIntervals:[[0,7]],hiddenNativeIntervals:[[5,10]]});
 assert.deepEqual(overlapping.overlappingNative3DClassSubintervals.map(x=>x.originalNativeParameterRange),
  [[5,7]]);
 assert.equal(overlapping.generated2DTopoDSHistoryCertified,false);
});
test('unreadable or nonidentical native original source parameter domain is held',()=>{
 const base={sourceEdgeId:'g::E0',originalNativeParameterRange:[0,10],
  visibleNativeIntervals:[[0,10]],hiddenNativeIntervals:[]};
 for(const statusRow of [
  undefined,
  {sourceEdgeId:'g::E0',parameterPartitionValidated:false,
   bounds:[0,10],visibleParts:[[0,10]]},
  {sourceEdgeId:'g::E0',parameterPartitionValidated:true,
   bounds:[0,10-Number.EPSILON*8],visibleParts:[[0,10-Number.EPSILON*8]]}
 ]){
  const r=auditNativeClass({...base,statusRow});
  assert.equal(r.comparable,false);
  assert.equal(r.nativeOriginalStatusClassAgreesWith3DSharp,false);
  assert.equal(r.signedV5Action,false);
 }
});

test('replayed original EdgeStatus cannot certify duplicated same-class native intervals',()=>{
 const base={sourceEdgeId:'g::E0',originalNativeParameterRange:[0,10],
  statusRow:{sourceEdgeId:'g::E0',parameterPartitionValidated:true,
   bounds:[0,10],visibleParts:[[0,5]]},
  visibleNativeIntervals:[[0,5]],hiddenNativeIntervals:[[5,10]]};
 const forged=[
  {...base,statusRow:{...base.statusRow,visibleParts:[[0,5],[2,4]]}},
  {...base,visibleNativeIntervals:[[0,5],[2,4]]},
  {...base,hiddenNativeIntervals:[[5,10],[6,9]]}
 ];
 for(const input of forged){
  const r=auditNativeClass(input);
  assert.equal(r.comparable,false);
  assert.equal(r.reason,'positive-same-class-original-native-parameter-overlap');
  assert.equal(r.nativeOriginalStatusClassAgreesWith3DSharp,false);
  assert.equal(r.engineeringLineStyle,'undetermined');
  assert.equal(r.signedV5Action,false);
 }
 const adjacent=auditNativeClass({...base,
  statusRow:{...base.statusRow,visibleParts:[[0,2],[2,5]]},
  visibleNativeIntervals:[[0,2],[2,5]]});
 assert.equal(adjacent.comparable,true);
 assert.equal(adjacent.nativeOriginalStatusClassAgreesWith3DSharp,true);
 assert.equal(adjacent.generated2DTopoDSHistoryCertified,false);
 assert.equal(adjacent.signedV5Action,false);
});


test('genuine reversed original BRep parameter map preserves strict generated Sharp order',()=>{
 const curve={
  Parameter2d(t){return 10-t;},
  Parameter3d(t){return 10-t;},
  Value(t){return {X(){return t;},Y(){return -2*t;}};}
 };
 const source=new Map([['g::E0',{curve,parameterRange:[0,10],
  originalBRepParameterRange:[0,10],originalBRepParameterRangeMatches:true,
  directOriginalTopoDSEdgeIdentityProven:true}]]);
 const range=[2,8];
 const samples=Array.from({length:5},(_,i)=>{
  const p2=range[0]+(range[1]-range[0])*i/4,t=10-p2;
  return {u:t,v:2*t};
 });
 const r=auditGenerated({segments:[{
  actualOCCTHLRCurveParameterRange:range,
  actualOCCTHLRCurveSamplesProjectedMm:samples,
  actualOCCTHLRCurveSampleToleranceMm:1e-6
 }],nativeCurveHandlesBySourceId:source});
 assert.equal(r.uniqueParameterizedSourceMatchCount,1);
 assert.deepEqual(r.rows[0].candidateSourceMatches[0].source3DParameterRange,[8,2]);
 assert.equal(r.generated2DTopoDSHistoryProven,false);
});

test('positive generated HLR interval cannot borrow duplicate rounded native BRep parameters',()=>{
 // Every generated 2D sample is distinct, yet the native inverse rounds
 // several to the SAME original 3D parameter. A tolerance-based five-point
 // residual alone used to misclassify this as unique original-source lineage.
 const curve={
  Parameter2d(t){return t;},
  Parameter3d(t){return Math.round(t/1e-12)*1e-12;},
  Value(t){return {X(){return t;},Y(){return -2*t;}};}
 };
 const source=new Map([['g::E0',{curve,parameterRange:[0,1],
  originalBRepParameterRange:[0,1],originalBRepParameterRangeMatches:true,
  directOriginalTopoDSEdgeIdentityProven:true}]]);
 const range=[0.5,0.5+1e-12];
 const samples=Array.from({length:5},(_,i)=>{
  const p2=range[0]+(range[1]-range[0])*i/4;
  const t=curve.Parameter3d(p2);
  return {u:t,v:2*t};
 });
 const r=auditGenerated({segments:[{
  actualOCCTHLRCurveParameterRange:range,
  actualOCCTHLRCurveSamplesProjectedMm:samples,
  actualOCCTHLRCurveSampleToleranceMm:1e-6
 }],nativeCurveHandlesBySourceId:source});
 assert.equal(r.uniqueParameterizedSourceMatchCount,0);
 assert.equal(r.unmatchedGeneratedOutputEdgeCount,1);
 assert.equal(r.rows[0].rejectedSourceCandidates[0].reason,
  'generated-source-parameter-order-not-injective');
 assert.equal(r.generated2DTopoDSHistoryProven,false);
 assert.equal(r.signedV5ActionCount,0);
});

test('generated 2D Sharp match rejects one-ULP escape from original 3D BRep parameter even inside 2D range',()=>{
 for(const boundary of ['lower','upper']){
  const curve={
   Parameter2d(t){return t+2;},
   Parameter3d(p2){
    if(boundary==='lower'&&p2===2)return -Number.MIN_VALUE;
    if(boundary==='upper'&&p2===12)return 10+8*Number.EPSILON;
    return p2-2;
   },
   Value(t){return {X(){return t;},Y(){return -2*t;}};}
  };
  const source=new Map([['g::E0',{curve,parameterRange:[0,10],
   originalBRepParameterRange:[0,10],originalBRepParameterRangeMatches:true,
   directOriginalTopoDSEdgeIdentityProven:true}]]);
  const samples=[0,2.5,5,7.5,10].map(t=>({u:t,v:2*t}));
  const result=auditGenerated({segments:[{
   actualOCCTHLRCurveParameterRange:[2,12],
   actualOCCTHLRCurveSamplesProjectedMm:samples,
   actualOCCTHLRCurveSampleToleranceMm:1e-6
  }],nativeCurveHandlesBySourceId:source});
  assert.equal(result.uniqueParameterizedSourceMatchCount,0);
  assert.equal(result.unmatchedGeneratedOutputEdgeCount,1);
  const rejected=result.rows[0].rejectedSourceCandidates[0];
  assert.equal(rejected.reason,'generated-source-3d-parameter-outside-original-brep-domain');
  assert.equal(rejected.matched,false);
  assert.equal(rejected.originalTopoDSEdgeIdentityProven,true);
  assert.deepEqual(rejected.originalBRepSourceParameterRange,[0,10]);
  assert.deepEqual(rejected.original3DCurveParameterRange,[0,10]);
  assert.deepEqual(rejected.sourceProjected2DParameterRange,[2,12]);
  assert.deepEqual(rejected.sourceProjected2DParameterRangeSorted,[2,12]);
  assert.deepEqual(rejected.generated2DParameterRange,[2,12]);
  assert.equal(rejected.firstRejectedGenerated2DParameter,boundary==='lower'?2:12);
  assert.equal(rejected.firstRejectedOriginal3DParameter,
   boundary==='lower'?-Number.MIN_VALUE:10+8*Number.EPSILON);
  assert.equal(rejected.originalInverseStillOutsideBRepDomain,true);
  assert.equal(rejected.generated2DTopoDSHistoryProven,false);
  assert.equal(rejected.signedV5Action,false);
  assert.equal(result.generated2DTopoDSHistoryProven,false);
  assert.equal(result.signedV5ActionCount,0);
 }
});
