# C1 H-view contour evidence: non-conflicting integration checklist (2026-10-27)

Base: 48fc408fc0ece1b90b3797a5bcd34f9c081c0178. This is a review-only audit and does not claim mathematical certification.

## Existing work to reuse
- #814 main: 12/14 convex contour 3D source spans independently corroborated against native OCCT HLR; two H endpoints remain held.
- #811 main: original source positive microinterval preservation and 15/15 native visible source correspondence.
- Open #797: integrated original BRep / M4 / M5 proof gate; avoid parallel reimplementation.
- Open #800: drawable-vs-collapsed physical source partition; do not replace its logic.
- Open #815: translated-source regression; avoid duplicating its fixtures.
- Open #813: batch-development rules; do not edit its rule file.

## Next implementable proof units, in dependency order
1. Trace the exact two held H contour source intervals in the existing #814 consumer, recording original edge IDs, physical XYZ endpoints, native OCCT generated edge endpoints and canonical M4 t ranges. Keep evidence separate from 2D paper rounding.
2. Add independent adversarial tests for endpoints at nextUp/nextDown floating boundaries, true nonzero microintervals, co-projected distinct 3D edges and zero-length paper projections. Never snap an unknown endpoint to a candidate.
3. Reconcile genuine native generated-edge multiset against original M5 certified visible contour partition; reject duplicate/missing generated fragments and unexplained positive interval gaps.
4. Only after 1–3 pass, test the same source/topology evidence across translated and rotated convex solids, reusing #815 fixtures when merged/rebased.
5. Keep generated TopoDS history, all-face global continuous occlusion, GB standard line style, ConstructionIntent/DAG, sole V5, C2/C3 whole-problem claims blocked until their independent positive proofs exist.

## Integration and release gates
- Do not merge overlapping #797/#800/#815 blindly; compare paths and rebase on latest main.
- Run exact HEAD workbench, pinned OCCT WASM HLR, offline OCCT oracle, core/planar/point math and site validation; record actual statuses, not expected results.
- Fail closed: undetermined, signedV5Action:false, wholeSolidV5Ready:false whenever any mandatory proof is absent.
- No automatic merge or production deployment from this audit branch.
