# DraftAI V3.1 — Local SVG vector review in the existing solver workbench (08-C1)

This opt-in feature extends `labs/auto-fillet-live.html` without adding a second renderer, solver, upload endpoint or build target.

User action sequence:
1. Open local, small `.svg` file (up to 250 KB). Parse only restricted SVG line/circle/straight path via existing `recognition/vector-svg-candidates.cjs`.
2. Show a **sanitized reconstruction** of candidate segments and circles via `document.createElementNS`; never insert raw SVG text into the DOM.
3. User chooses exactly two source IDs, enters origin pixels, real scale **millimetres per pixel**, y-axis convention and target fillet radius **mm**, and explicitly checks that these values were manually reviewed. Unselected SVG geometry is explicitly marked rejected in the resulting draft.
4. `prepareConfirmedFillet` (from merged #250) checks current revision, selected primitive type, bounded geometry and metric calibration. The model-mm fields are copied into the existing editable `auto-fillet-form.cjs` UI. Branch, output arc direction, and both source-travel selections are cleared; the existing revision-safe V5 session immediately invalidates the previous answer.
5. User chooses a legitimate branch and G1 orientation in the **existing** workbench, which reruns real 02 math and V5. Editing any field invalidates the preceding session as before.

**Fail-closed limits:** Input files with vector text or dimension labels (including R and Φ) are **not silently ignored or converted**. This first UI does not offer annotation linkage editing, so it blocks direct import and directs the user back to manual numeric review. Script/event/external source/unsupported curves or transforms are rejected by the strict SVG parser. Raster photographs remain local reference images only, never parsed as SVG or uploaded.

**Proof scope:** The SVG source is not authenticated; the human checkbox is UI interaction, not a cryptographically attested signature. The user-supplied scale is an assertion, not a computer-vision-calibrated measurement. This path does not prove global uniqueness, infer a missing radius, OCR, support arbitrary 2D line contours or auto-select an answer branch. No raw private images or SVG files enter GitHub or the Cloudflare app.

**Security:** the browser entry only uses local `File.text()`, bounded byte checks, sanitized SVG primitives and `textContent`. No fetch, new upload API, localStorage/sessionStorage, raw HTML insertion, CDN or private source in dist. Browser build uses `TextEncoder` for source UTF-8 length, with Node Buffer fallback when TextEncoder is unavailable.

Tests: `node --test tests/workbench/v31-local-vector-live.test.cjs` checks all three real math/G1/V5 cases and negative controls for source IDs, mm scale, missing approval, rejected R/Φ annotation, malicious input, file bound and revision invalidation. It is included in the existing `workbench` Action at PR exact HEAD; unchanged `math`, `planar-math`, `point-projection`, `validate`, and static bundle/Cloudflare preview also required. Roll back the isolated PR if failed.

Next: full editable dimension linkage for R/Φ and bitmap camera OCR, separate controlled work; no claims of full automatic engineering drawing solving until three unseen raster end-to-end cases pass.
