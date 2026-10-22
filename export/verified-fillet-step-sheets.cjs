'use strict';
/**
 * Export a printable SVG for every completed step of a verified finite fillet.
 * This deliberately reuses the existing geometry-proof gate for every sheet.
 * Never trusts user-supplied V5 actions, OCR candidates or rendered SVG.
 */
const {exportVerifiedFilletSvg}=require('./verified-fillet-svg.cjs');

function exportVerifiedFilletStepSheets(input,options={}){
  if(!options||typeof options!=='object'||Array.isArray(options)||
     Object.keys(options).some(k=>!['expectedRevision','includeGuides'].includes(k)))
    throw new TypeError('unsupported verified step-sheet option');
  const {expectedRevision,includeGuides=true}=options;
  const last=exportVerifiedFilletSvg(input,{expectedRevision,includeGuides});
  const totalSteps=last.originalStepCount;
  if(!Number.isSafeInteger(totalSteps)||totalSteps<1||totalSteps>64)
    throw new RangeError('verified construction step count exceeds bounded export');
  const sheets=[];
  for(let n=0;n<=totalSteps;n++){
    // Every partial page is re-evaluated against the same current revision.
    // n=0 shows the given objects; n=totalSteps shows the final verified arc.
    const frame=n===totalSteps?last:
      exportVerifiedFilletSvg(input,{expectedRevision,includeGuides,completedSteps:n});
    if(frame.revision!==last.revision||
       frame.selectedBranchId!==last.selectedBranchId||
       frame.originalStepCount!==totalSteps||
       frame.completedSteps!==n)
      throw new RangeError('verification evidence changed during SVG sequence export');
    sheets.push({
      svg:frame.svg,
      completedSteps:n,totalSteps,
      revision:frame.revision,selectedBranchId:frame.selectedBranchId,
      finalArcVisible:frame.finalArcVisible,isFinalSheet:frame.isFinalSheet
    });
  }
  return {
    revision:last.revision,selectedBranchId:last.selectedBranchId,
    totalSteps,globallyUnique:last.globallyUnique,
    sheets
  };
}

module.exports={exportVerifiedFilletStepSheets};
