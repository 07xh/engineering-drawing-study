'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {probeRealOcjsHLREdgeStatusABI:probe}=
 require('../../engines/spatial/hlr/c1-ocjs-edgestatus-abi.cjs');

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
  Value(value){return {X(){return value-0.25;},Y(){return (value-0.25)*2;}};}
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
   {sourceEdgeId:'g::E0',edge:nativeEdge},
   {sourceEdgeId:'g::E0',edge:nativeEdge}
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
  [2.5,5]);
 assert.deepEqual(row.directOriginalTopoDSEdgeIsSameMatches,['g::E0']);
 assert.equal(row.directOriginalTopoDSEdgeIdentityProven,true);
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
  originalNativeEdgeHandles:[{sourceEdgeId:'g::E0',edge}]});
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
  originalNativeEdgeHandles:[{sourceEdgeId:'g::E0',edge}],view:'V'});
 const map=r.rows[0].originalEdgeData.original3DToProjected2DCurveParameterMap;
 assert.equal(map.readable,true);
 assert.equal(map.projectionCollapsed,true);
 assert.equal(map.roundTripApplicable,false);
 assert.equal(map.roundTripWithinDiagnosticTolerance,null);
 assert.equal(map.canonicalProjectionCoordinatesMatch,true);
 assert.equal(r.rows[0].originalEdgeData.generated2DHLRTopoDSHistoryProven,false);
 assert.equal(r.signedV5ActionCount,0);
});
