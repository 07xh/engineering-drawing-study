# DraftAI V3.1 / R0 confirmed-vector-to-V5 integration (00)

Issues: [#233](https://github.com/07xh/engineering-drawing-study/issues/233), [#240](https://github.com/07xh/engineering-drawing-study/issues/240), [#241](https://github.com/07xh/engineering-drawing-study/issues/241), [#243](https://github.com/07xh/engineering-drawing-study/issues/243). Existing producers: [#247](https://github.com/07xh/engineering-drawing-study/pull/247) SVG candidates, [#245](https://github.com/07xh/engineering-drawing-study/pull/245) typed analytical finite solver, [#246](https://github.com/07xh/engineering-drawing-study/pull/246) directional G1 → V5, [#248](https://github.com/07xh/engineering-drawing-study/pull/248) revision-safe res solve sessions.

## Purpose

This is the first **opt-in** real source-file → candidate → user review → typed model-mm geometry → real 02 solver → G1-verified original V5 playback bridge. It is not a public upload UI or arbitrary picture solver. Its inputs are strict, simple SVG *vector* shapes. It does not OCR raster photos, automatically find annotation-to-geometry associations, or silently treat SVG pixel units as mm.

`integration/v31-confirmed-svg-fillet-v5.cjs` offers:

- `prepareConfirmedFillet({draft,expectedRevision,calibration,kind,sourceIds,filletRadiusMm,options})`: requires the current, reviewed draft and user-confirmed uniform pixel-to-mm scale/origin/y-axis; explicitly identifies the two finite sources; cross-checks any accepted source dimensions in model mm. Unknown/contradictory/unbound dimensions, stale revisions and unsupported geometry fail closed.
- `runConfirmedSvgFillet({...request,selection,sheet})`: calls the **unchanged** existing verified `confirmedFilletTimeline`. A branch, direction and two source travels are required to draw the final G1 arc. No new solver or parallel V5 engine. Both blocked status and verified playback preserve the input revision and source IDs.

Output marks `metricCalibrationMathematicallyProven:false` and `globallyUnique:null`. Source-coordinate calibration is an explicit **human assertion**, not computed from the image. A confirmed dimension is cross-checked to 0.1% relative + 0.001 mm absolute to detect inconsistent scale; this is only a consistency check, not independent validation that the drawing was printed at scale.

## Scope and security

Only new files in `integration/`, `tests/workbench/`, and `docs/`. No public route or build manifest addition, file uploads, private images, AI keys, CI/workflows, old 02 math engines, V5 player, Cloudflare or GitHub policy edits. The new end-to-end scenarios use self-authored small SVG strings and real Gate-A geometry. The next product milestone is browser user review/metric calibration and session handoff, then real raster detector/OCR. Do not claim image-agnostic auto solve.

This adapter does not manage UI-level stale-player destruction. Browser consumers must use #248 session invalidation before rendering after any recognition revision, metric calibration, source choice or fillet-radius edit. Never put old returned `steps` into a changed-revision frame.

## Tests and release

`node --test tests/workbench/v31-confirmed-svg-to-real-v5.test.cjs` is included by the existing `workbench` GitHub Action without changing a workflow. It includes three non-hardcoded SVG source geometries, radius edit, dimension disagreement, unreviewed sources/annotation, stale revisions, wrong source ID, branch/direction/G1-blocking, and different screen scales.

**Review classification: high risk integration**. Even though the old math implementations remain untouched, this is a new path producing verified answers from user-confirmed input. Follow #152: independent 00/09 math+provenance review and explicit approval before merge. A PR CI green flag alone is insufficient. Rollback is a single additive PR revert; the old production V5 remains independent.
