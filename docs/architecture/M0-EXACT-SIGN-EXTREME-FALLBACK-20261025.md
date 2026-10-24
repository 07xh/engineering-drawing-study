# M0 exact signed Euclidean predicates: overflow / underflow dyadic fallback

Scope: preserve the existing ONE `core/numeric/euclidean-kernel.cjs` and shared `binary64-dyadic.cjs` for exact-for-represented-binary64 directional signs. Existing numerical magnitude APIs `dot`, `cross3`, `multiplyFinite` and specialist normalizations **continue to throw** when a real nonzero product rounds to zero or its magnitude overflows. These APIs do NOT return exact world coordinates.

Previously opt-in `certifyDotSign` and `certifyCross3Signs` also called strict `multiplyFinite` before their own dyadic fallback, so valid finite binary64 operands producing subnormal/zero or overflowed products aborted before precision-safe BigInt could determine their sign. This patch leaves the normal-range filtered fast path, tolerance and both high-level public result APIs in place. On exceptional floating products or sums it computes sign using already-merged exact dyadic products of the SAME snapshotted binary64 vectors; `rounded:null` specifically means no trustworthy finite Float64 magnitude is available (it is NOT zero), and `signMatchesRounded:false`. Finite underflow may retain `rounded:0` as historical diagnostic while exact sign reports nonzero.

Independent analytic test witnesses:
- `1e-200 × 1e-200` rounds zero, exact sign positive/negative.
- Opposite `1e308 × 1e308` products individually overflow yet cancel mathematically to zero.
- Those huge terms cancel with a `1e-308 × 1e-308` positive or negative exact residual; zero cannot be inferred from loss of numeric magnitude.
- 3D cross signed direction remains defined with overflowing or underflowing components, and reversal flips its orientation.
- Old fast-normal and 2^-53 cancellation cases unchanged; sparse/nonfinite and malicious getters still fail closed. Whole-scene, full line visibility, V5, and source-photo revision do not follow from a local sign predicate.

Two existing M0 API matrix rows gain this independent regression reference; all unresolved source and precision-magnitude `remainingGate` statuses remain unchanged. Five exact final PR HEAD CI, four parallel workbench shards + stable summary and mergeable=true are required before squash; isolated rollback by reverting this PR.
