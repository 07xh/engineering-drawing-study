'use strict';
/**
 * Backwards-compatible 02/03 API to the unified M3 -> Intent -> DAG -> V5
 * computation entry. Public workbenches retain their existing interface.
 */
const {evaluateUnifiedMath}=require('./unified-math-pipeline.cjs');
function verifiedLiveIntentTimeline(kind,input,sheet,revision=0){
 return evaluateUnifiedMath({kind,input,sheet,revision});
}
module.exports={verifiedLiveIntentTimeline};
