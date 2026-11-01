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
