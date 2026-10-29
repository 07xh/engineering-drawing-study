'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {auditC1NativeIndexedOriginalHLRStatus:audit}=
 require('../../engines/spatial/hlr/c1-ocjs-visible-strokes.cjs');
const geometry={id:'g',data:{points:{
 A:{x:0,y:0,z:0},B:{x:1,y:2,z:3}
},edges:[['A','B']]}};
function fixture({visible=true,hidden=false,parts=visible?1:0,
 collapsed=false,wrong3DClass=false,full=true}={}){
 const g=structuredClone(geometry);
 if(collapsed)g.data.points.B={x:0,y:2,z:0};
 const range=[0,1];
 const source={originalPhysicalSourceEdgeId:'g::A|B',
  visible3D:{native3DGeneratedCurveIntervals:
   visible&&!wrong3DClass?[{nativeOriginalCurveParameterRange:range}]:[]},
  hidden3D:{native3DGeneratedCurveIntervals:
   hidden||wrong3DClass?[{nativeOriginalCurveParameterRange:range}]:[]},
  combinedNative3DSourceParameterPartition:{
   sourceScopedNative3DParameterInventoryCompleteExactlyOnce:full,
   originalNativeParameterRange:range
  }};
 const ds={EDataArray:()=>({Value:index=>{
  assert.equal(index,1);
  return {Status:()=>({AllVisible:()=>visible,AllHidden:()=>hidden,
   NbVisiblePart:()=>parts})};
 }})};
 const indexProof={edgeMapSourceBijectionVerified:true,
  indexedOriginalSources:[{originalPhysicalSourceEdgeId:'g::A|B',
   hlrDataStructureOneBasedEdgeIndex:1,
   directlySameOriginalTopoDSInputEdge:true}]};
 return {dataStructure:ds,indexProof,scopedRows:[source],geometry:g,view:'V'};
}
test('actual original HLR source index agrees with native full visible 3D source',()=>{
 const r=audit(fixture());
 assert.equal(r.availability,'real-native-original-edge-indexed-status-inspected');
 assert.equal(r.fullSourceClassConcordant,1);
 assert.equal(r.rows[0].originalHLRStatusFullClass,'visible-sharp');
 assert.equal(r.rows[0].generated2DTopoDSLineageCertified,false);
 assert.equal(r.officialV5Authorized,false);
});
test('actual full hidden source remains hidden without declaring V5',()=>{
 const r=audit(fixture({visible:false,hidden:true,parts:0}));
 assert.equal(r.fullSourceClassConcordant,1);
 assert.equal(r.rows[0].originalHLRStatusFullClass,'hidden-sharp');
 assert.equal(r.rows[0].engineeringLineStyle,'undetermined');
});
test('contradictory HLR status and native 3D class fail closed',()=>{
 assert.throws(()=>audit(fixture({wrong3DClass:true})),/contradicts/);
 assert.throws(()=>audit(fixture({visible:true,hidden:true,parts:1})),/contradictory/);
 assert.throws(()=>audit(fixture({visible:true,hidden:false,parts:0})),/contradictory/);
});
test('unbound original index cannot impersonate source identity',()=>{
 const x=fixture();
 x.indexProof.indexedOriginalSources[0].originalPhysicalSourceEdgeId='g::A|C';
 assert.throws(()=>audit(x),/unbound/);
});
test('tangential/split native HLR class remains undetermined',()=>{
 const r=audit(fixture({visible:false,hidden:false,parts:2,full:false}));
 assert.equal(r.fullSourceClassConcordant,0);
 assert.equal(r.rows[0].originalHLRStatusFullClass,'undetermined');
 assert.equal(r.officialV5Authorized,false);
});
test('projected collapsed physical source is not a fake 2D stroke',()=>{
 const r=audit(fixture({visible:false,hidden:true,parts:0,collapsed:true}));
 assert.equal(r.fullSourceClassConcordant,0);
 assert.equal(r.rows[0].originalM0PaperProjectionCollapsed,true);
 assert.equal(r.officialV5Authorized,false);
});
test('unexposed native status API cannot count as positive proof',()=>{
 const x=fixture();delete x.dataStructure.EDataArray;
 const r=audit(x);
 assert.equal(r.fullSourceClassConcordant,0);
 assert.match(r.availability,/not-exposed/);
});
