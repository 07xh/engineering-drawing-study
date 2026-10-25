'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {pruneHiddenSharpPaperAliasesUsingExactM5:prune}=
 require('../../workbench/c1-native-hidden-exact-source-pruning.cjs');
const source=id=>({
 sourceEdgeId:id,actualOriginalOCCTBRepEdge3DEndpointsVerified:true,
 originalOCCTSourceLineCurveVerified:true,
 originalXYZReprojectsToHLR:true,v5Authorized:false
});
const row=(id,{clear=false,hidden=false,view='V'}={})=>({
 originalPhysicalSourceEdgeId:id,view,
 completeSourceOriginal3DRayClosedIntervalClear:clear,
 originalOpenEdgeStrictInteriorOcclusionProven:hidden,
 officialEngineeringLineStyle:'undetermined',signedV5Action:false
});
const map=(...entries)=>new Map(entries.map(([id,params])=>
 [id+'@V',row(id,params)]));
const audit=(ids,ledger)=>prune({
 view:'V',candidates:ids.map(source),
 closedOriginalSourceByKey:ledger
});
test('exact whole-CLOSED original 3D ray clear rejects a front physical alias for native hidden HLR',()=>{
 const r=audit(['G::A|B','G::C|D'],map(
  ['G::A|B',{clear:true}],['G::C|D',{hidden:true}]));
 assert.equal(r.originalPaperCandidateCount,2);
 assert.equal(r.exactClosedRayExclusionCount,1);
 assert.equal(r.remainingPossibleOriginal3DSourceCount,1);
 assert.equal(r.uniqueRemainingOriginalSourceCandidateAfterNegativeProof,true);
 assert.equal(r.remainingPhysicalSourcePossibilities[0].sourceEdgeId,'G::C|D');
 assert.equal(r.remainingPhysicalSourcePossibilities[0].strictInwardOriginalOpenRayProven,true);
 assert.equal(r.nativeHLRToSourceTopoDSIdentityRecovered,false);
 assert.equal(r.formalEngineeringLineStyle,'undetermined');
 assert.equal(r.signedV5Action,false);
});
test('ambiguous sources stay unresolved when no independent exact clear ray proof',()=>{
 const r=audit(['G::A|B','G::C|D'],map(
  ['G::A|B',{}],['G::C|D',{hidden:true}]));
 assert.equal(r.exactClosedRayExclusionCount,0);
 assert.equal(r.remainingPossibleOriginal3DSourceCount,2);
 assert.equal(r.uniqueRemainingOriginalSourceCandidateAfterNegativeProof,false);
});
test('all exact-clear aliases are reported as CAD-vs-M5 conflict rather than creating hidden source',()=>{
 const r=audit(['G::A|B','G::C|D'],map(
  ['G::A|B',{clear:true}],['G::C|D',{clear:true}]));
 assert.equal(r.remainingPossibleOriginal3DSourceCount,0);
 assert.equal(r.uniqueRemainingOriginalSourceCandidateAfterNegativeProof,false);
 assert.equal(r.nativeHLRToSourceTopoDSIdentityRecovered,false);
});
test('single original candidate still cannot sign TopoDS, formal dashed style or unique V5',()=>{
 const r=audit(['G::A|B'],map(['G::A|B',{hidden:true}]));
 assert.equal(r.uniqueRemainingOriginalSourceCandidateAfterNegativeProof,true);
 assert.equal(r.nativeHLRToSourceTopoDSIdentityRecovered,false);
 assert.equal(r.formalEngineeringLineStyle,'undetermined');
 assert.equal(r.constructionIntentAuthorized,false);
});
test('contradictory exact forward and inward full-edge rays fail closed',()=>{
 assert.throws(()=>audit(['G::A|B'],map(
  ['G::A|B',{clear:true,hidden:true}])),/contradictory/);
});
test('stale source, missing M5 ray, fake CAD source proof or duplicate candidate rejected',()=>{
 assert.throws(()=>audit(['G::A|B'],new Map()),/missing current/);
 assert.throws(()=>audit(['G::A|B','G::A|B'],map(
  ['G::A|B',{}])),/untrusted/);
 const forged=source('G::A|B');forged.originalOCCTSourceLineCurveVerified=false;
 assert.throws(()=>prune({view:'V',candidates:[forged],
  closedOriginalSourceByKey:map(['G::A|B',{}])}),/untrusted/);
 assert.throws(()=>prune({view:'X',candidates:[],
  closedOriginalSourceByKey:new Map()}),/first|source candidates|native hidden/);
});
