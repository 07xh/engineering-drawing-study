'use strict';
/**
 * Real textbook drawing acceptance gate. Private DWG and answer geometry
 * are never committed; only hashes and independent review state.
 */
const crypto=require('node:crypto');
const KNOWN=Object.freeze({
 '3-12':'ad9813644c7c5e4156d6714e0188da2bcaa850120d67528cb5abe587be274b1a',
 '3-13':'d1bea4107a01e167d6c12f4ee18183b8a9c246f5f8743610b4fe70d1461e79cd',
 '3-9':'cc9d6c1555a77b6ac46b78d62f888415579bd9daae54875c19aa4de15a8419f9'
});
function textbookBlindAcceptanceGate(id,bytes,review={}){
 if(!Object.hasOwn(KNOWN,id))return {status:'unsupported-sample',accepted:false};
 if(!Buffer.isBuffer(bytes))return {status:'source-unavailable',accepted:false};
 const hash=crypto.createHash('sha256').update(bytes).digest('hex');
 if(hash!==KNOWN[id])return {status:'source-hash-mismatch',accepted:false};
 const evidence=['cadEntitiesIndependentlyExtracted','problemConditionsReviewed',
  'referenceAnswerIsolated','mathResidualsChecked',
  'constructionDagChecked','singleV5PlaybackChecked'];
 const missing=evidence.filter(k=>review[k]!==true);
 if(missing.length)return {status:'pending-independent-evidence',accepted:false,
  sampleId:id,sourceSha256:hash,missing};
 return {status:'independent-review-ready',accepted:false,sampleId:id,
  sourceSha256:hash,reason:'final human/independent math acceptance still required'};
}
module.exports={KNOWN,textbookBlindAcceptanceGate};
