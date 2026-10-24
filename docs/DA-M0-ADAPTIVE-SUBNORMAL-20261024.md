# M0 adaptive Float64 orientation: normality precondition hardening (2026-10-24)

This increment hardens the **already merged** `orientation2d-adaptive.cjs` from #582, rather than adding another exact predicate, global tolerance or solver.

The ordinary floating-point CCW error bound assumes the standard unit-roundoff *normal-range* error model. Extremely small, but representable, products/differences can be subnormal: an otherwise finite error bound may itself underflow to zero, so `abs(det)>bound` alone is not a justified fast-path certificate. Reject any nonzero subnormal coordinate differences, determinant products, determinant, magnitude or error-bound intermediate from the **fast** path; also reject rounded-zero products whose two factors were nonzero. All such cases pass through the existing exact dyadic binary64 orientation routine without changing input framing or source snapshots.

This is deliberately conservative (more fallback), not a performance optimization or claim about pre-rounded geometry, nearby collinearity, actual segment intersection, circles, conics, proof of a unique construction, entire scene, or V5. Normal ordinary inputs stay on Float64; tests cover many independent exact-oracle cases near subnormal threshold and regular noncancelling triples.

Current HEAD five CI, M1 topology/independent numeric oracles, safe rollback and #152 merge rules apply. No production deployment implied.
