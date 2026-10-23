'use strict';
/**
 * #410 P3: manually inspected REAL exercise candidate (NOT acceptance).
 * User-provided workbook: printed page 13, item 2-4-3, PDF page 14.
 * Source file is private and contains answer overlays; do not publish scans,
 * solutions, private file IDs or OCR answers in the repository.
 *
 * The black question text gives A=(15,27,30), B=(30,0,23) in model-mm.
 * Values are preflight transcription. Source text did not independently label\n * units: solver uses assumed model-mm pending user/independent confirmation.
 */
const REAL_POINT_CANDIDATE=Object.freeze({
 format:'draftai-p3-original-point-preflight/1',
 printedPage:13,pdfPage:14,questionLabel:'2-4-3',
 topic:'given two spatial XYZ points, construct V/H/W first-angle projections',
 givens:Object.freeze([
  Object.freeze({label:'A',x:15,y:27,z:30}),
  Object.freeze({label:'B',x:30,y:0,z:23})
 ]),
 sourceKind:'private-answer-overlaid-workbook',
 sourceOriginalQuestionConfirmed:false,sourceUnitConfirmed:false,\n solverUnitAssumption:'mm',
 blindTest:false,answerHidden:false,bookSolved:false,
 reviewStatus:'pending-independent-source-confirmation',
 sourceScanCommittedToRepo:false
});
module.exports={REAL_POINT_CANDIDATE};
