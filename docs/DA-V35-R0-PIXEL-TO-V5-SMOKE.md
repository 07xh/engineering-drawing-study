# DA-08 R0 · pixel-to-V5 synthetic smoke gate

This test-only PR adds a non-hardcoded **runtime rasterization → real existing Hough / connected-ink detector → unconfirmed #272 ProblemDraft → explicit #277 user geometry/metric review adapter → 02 finite-fillet candidate search → directed double-side G1 test → original V5 timeline** regression harness.

Three geometrically different scenes are generated **as RGBA images** at test runtime: intersecting finite line strokes, a finite stroke and a disjoint complete circle, and two disjoint circles. The detector output is not pre-written as geometry or SolveResult. A simulated human picks recognized candidate *types*, explicitly reviews their pixel endpoints/centers/radii, supplies model scale/origin and connecting R, then enumerates mathematically checked candidate branches and directions. The test asserts a valid G1 result exists and verifies residuals and steps. It does NOT hardcode a result circle center, tangent point, selected branch ID or animation path.

Fail-closed negatives include blank frame, only an incomplete visible arc, missing human acceptance, impossible metric scale, stale revision, and a corrected circle outside image bounds. All generation is local, not from private user photos. This suite is the next **synthetic smoke gate**, not proof of independent photographed exercise acceptance.

Scope: `tests/workbench/v35-r0-pixel-to-v5-smoke.test.cjs` and this document only; no core, detector, math, V5, browser UI, auth, CI workflows or Cloudflare config edits. It executes via existing workbench GitHub job. Requires current-head math, planar-math, point-projection, workbench, validate and Cloudflare preview green before squash. A failed detector scene is a genuine regression finding, not permission to fake a candidate.

Remaining R0 true acceptance: **three never-seen authorized photos/scans** with OCR R/Φ and values, partial arcs, tilted/occluded negative cases and user corrections, followed by verified math/V5 in an actual desktop/Android browser. Production Active SHA remains independent.
