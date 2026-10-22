# DraftAI V3.5 / 08-B4: native raster primitive proposals → reviewable ProblemDraft

An isolated, offline adapter for **untrusted image-pixel detector outputs**, building on merged #256 local finite-line proposals, #257 circle/arc proposals, #244 `draftai-recognition/v0.1`, and #259 pixel bbox mapping. No OCR runtime or upload/solver change.

`candidateDraftFromRaster({image,analysis,lines,curves})` accepts original decoded **metadata** (including byte length/media type) plus bounded analysis dimensions and the actual detector proposals. It validates original/analysis source frames, bounding boxes, source candidate IDs, confidence, line endpoints, circle/arc centers and radii, and nearly isotropic circle scaling. It produces a validated **unconfirmed** ProblemDraft with `drawing-px` equal to original-image pixels (identity source-to-drawing transform), numeric primitives and untrusted detector provenance. It **never** treats those pixels as calibrated model-mm coordinates.

For limited arcs, it retains an explicitly unconfirmed partial arc geometry in screen-angle representation and returns its candidate ID in `unsupportedToExistingFiniteSolver`. A partial arc cannot be silently substituted for a full circle in the current R0 three-type analytical fillet solver. Cropped detector circles or nonuniform image scaling are rejected rather than falsely represented as mathematically true circles. Source confidence and `mathematicallyVerified:false` remain visible; `solverReady:false`, `geometryVerified:false`, `globallyUnique:null`.

**Scope:** exactly one new `recognition/**` CommonJS module, its `tests/workbench/**` suite (included in the current workbench GitHub Actions), and this docs file. No live UI binding, image file storage or network requests, geometry auto-confirmation, camera perspective rectification, math solver/V5 algorithm or Cloudflare/auth/workflow edits. Existing #269 audited native OCR remains unchanged.

**Tests** programmatically rasterize clean original geometric primitives and use the *real existing* Hough and connected-ink detectors; they verify that generated candidates become unconfirmed source-pixel primitives and reject forged/outside/duplicate/degenerate/anisotropic/ambiguous candidates. Tests do NOT hardcode a final answer, and this PR alone does not meet full R0 three-unseen-photo acceptance.

Future: controlled browser UI to pick each raster candidate and correct numeric geometry + scale before #250 typed geometry adapter; later independent perspective/occlusion testing and genuine photographed-image completion.
