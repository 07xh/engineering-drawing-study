# M0 Float64 predicate migration — shared depth and visibility arithmetic

## Mathematical ownership

This increment reuses `core/numeric/object-vector3.cjs` from merged #573/#575, which delegates to the **single** `core/numeric/euclidean-kernel.cjs`. It replaces local 3D dot products in five existing M0 numeric consumers: convex point-ray clearance, convex ray depth, convex continuous segment clearance and occlusion, and projected-edge depth events. Convex ray depth also reuses shared vector norm for ray/halfspace normalization; segment occlusion reuses subtract.

No geometric algorithm, first-angle observer ray, local tolerance, interval elimination, convex proof, source identity, SolveResult, ConstructionIntent, DAG or V5 player is replaced. Each consumer retains its original fail-closed proof scope, including unsolved near-parallel and tangent cases. Overflow and nonzero-product underflow now cause explicit rejection in the reused Float64 kernel; these pathological inputs were never permitted as positive evidence.

## Validation and known remaining limits

Independent analytical box ray/point/open-segment/perpendicular projected-edge examples, positive/negative ray directions, normal re-scaling, origin translation, source interval topology, first-angle projection and intentionally underflowed coordinate products. Existing M0 and M4/M5 consumers test against independently recomputed original source geometry. No whole-scene completeness, exact curve, endpoint join, official drafting style, original-exercise approval, mobile or Production Active proof is emitted.

Require exact PR-head five GitHub Actions checks and mergeability under #152. Rollback is an isolated squash revert; additional robust predicates/interval arithmetic require separate actual proofs and tests, not reinterpretation of this arithmetic migration as certified 100% M0.
