# DraftAI V3.5 / 08-C4 — local photo OCR candidate review in the existing workbench

Implements an **opt-in, browser-only** interface in `labs/auto-fillet-live.html`. Uses the already-merged #265 native browser `TextDetector` if supported, the #261 strict R/Φ parser, #263 dimension-to-field review contract, and #254/#259 strict user source-field confirmation. No new OCR engine, network upload, authentication, persistence, mathematical solver or second V5 player.

## Actual interaction

1. Open an authorized local PNG/JPEG/WebP as a reference. Enable **strict image source review**. On capable browsers, click "识别本地尺寸文字".
2. TextDetector runs on an in-browser bounded canvas. Its strict parser returns zero or more **unconfirmed** R/Φ proposals with original-image-pixel bboxes. If TextDetector is unavailable or fails, the interface explicitly states unsupported and manual review remains available. No fabricated results.
3. Choose a recognized text proposal and select **the target mathematical field** in the pre-existing source-field dropdown. The proposed number (R value or Φ diameter) is shown in an editable input; the user must check against the image, correct the number if needed, and independently check a confirmation box.
4. Clicking "确认这条文字与当前字段对应" checks the current numeric field value (existing form, **not filled from OCR**) against the explicitly reviewed label value. Φ diameter / 2 must match circle radius; Φ may not become target fillet R; unrecognized fields, nonfinite input, invalid pixels and wrong units fail. The original-image bbox is staged using the existing per-field review controller, not a new solver path.
5. This confirms only *one* field. The user must independently verify all other required geometry and dimensions and click existing **"确认全部条件并解题"**. Any edit clears field acceptance; existing #248 revision-safe controller invalidates stale playback and export.

## Privacy and evidentiary boundaries

All OCR runs locally. No raw image or text is stored, uploaded, sent to a service, or inserted as HTML. Browser OCR availability varies. Native TextDetector does not certify text recognition, confidence or units. The app does not infer mathematical geometry from image proximity; this UI does not automatically choose a line, a circle, a branch, tangent direction or a connecting radius. Candidate-to-field bounding rectangles and user-entered model-mm values are review evidence only, never independent geometric proof. A "confirmed" flag is a local UI assertion, not secure identity verification.

Changed files: two new `labs/**` and `tests/workbench/**` files, one document, minimal edits to existing `labs/image-field-review-ui.cjs`, `labs/auto-fillet-live-entry.cjs`, and `labs/auto-fillet-live.html`. No existing `core/**`, math, V5, auth, static-build or CI workflow changed. Revert the feature PR to roll back.

Tests run under existing GitHub `workbench` job with other exact-HEAD math, planar-math, point-projection, validate and Workers preview required. Added UI tests cover supported/unsupported OCR, corrected Φ→model radius→full human confirmation→real 02/G1/V5, rejected Φ target, stale-image asynchronous cancellation, invalid bbox, altered input and no-network source. Production Active SHA and Android touch/browser tests remain to be verified.

**Still incomplete R0:** three fresh unknown raster photo drawings recognized into validated source geometry and dimensions end-to-end, camera distortion/obscuration handling, freeform 2D routing beyond three fillet configurations. Do not claim universal AI image solving.
