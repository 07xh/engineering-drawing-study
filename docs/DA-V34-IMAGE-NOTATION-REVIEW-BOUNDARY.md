# DraftAI V3.4 / 08-C3 · Untrusted photo notation → separately reviewed mathematical field

This is a small, opt-in **local-only** adapter between the existing photo OCR-token classifier (#261) and explicit original-image field review (#254/#259). It does not add an OCR runtime, automated text-box detector, server endpoint or direct public UI control.

`recognition/reviewed-image-dimension-field.cjs` validates a bounded `parseTextCandidates()` R/Φ proposal in the **original-image-px** frame and requires a separate action with `accepted:true`, current model-mm field value, corrected/reviewed notation value in mm, target field name, and a revision reference. It stages the verified bounding rectangle via the existing `createFieldReview().mark()` and *separately* invokes `confirm()` with the current numeric value. The final multi-field `accept()` remains mandatory; this adapter cannot produce a completed problem by itself.

Scope and rejection behavior:
- `R` labels can only be explicitly mapped to a circle radius (`r1`, `r2` where required by current problem kind) or the target connecting `filletRadius`. `Φ` is only a **source circle** diameter (radius = confirmed diameter / 2), never target fillet R.
- OCR `numericValue`, confidence, unitHint, proximity hints and source text are **not accepted as proof**; typed/reviewed notation text and actual current field values must be finite positive mm and consistent to 0.1% + 0.001 mm. OCR errors may be corrected explicitly by the user. Unknown field assignments, false confirmations, invalid bbox/frame, off-image results and contradictory values fail before mutating field state.
- Returned evidence carries `sourceId`, original pixel bbox, OCR text, review revision, confirmed values, `mathematicalProof:false`, `globallyUnique:null`, and `finalFieldSetAccepted:false`. This is an indication of a UI review gesture, not secure authentication or certified OCR recognition.
- A recognized R/Φ candidate is not automatically bound to the nearest detected circle or to any model-mm geometry. Separate future frontend integration must collect this confirmation from actual user interactions and manage revision invalidation using existing #248 session controller.

Existing 02 math/G1/V5 receives only the strict reviewed numeric `buildConfirmedInput` via unchanged `createFieldReview().review` and `accept`. Unit and proof types remain explicit; no new solver or V5 code, no raw photo or textbook files, no network/upload, no static build exposure.

`tests/workbench/v34-image-notation-field-review.test.cjs` verifies real reviewed two-circle values produce actual 02 G1/V5 after **all** fields are separately confirmed, and tests wrong Φ-target, OCR correction, absent acceptance, forged confirmed OCR, invalid pixel bounds/coordinate frame, bad number, unsupported field, stale edits, and no hidden solver bypass.

Next: UI for choosing OCR text/token and target field from photo, then three independent never-before-seen authorized raster test sheets with negative cases. Do not mark unknown-image OCR completion until recognition itself exists and end-to-end proves actual results.
