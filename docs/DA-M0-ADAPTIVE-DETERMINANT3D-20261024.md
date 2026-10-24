# Shared exact binary64 arithmetic + adaptive 3D determinant (2026-10-24)

This is **one shared M0 predicate kernel**, not a new solver. Factor the dyadic conversion/addition/subtraction/multiplication already used by the authoritative 2D exact orientation into `core/numeric/binary64-dyadic.cjs`. Existing `orientation2d-exact.cjs` reuses it without changing input, output or proof scope. New `determinant3d-adaptive.cjs` accepts three snapshot dense 3D binary64 coordinate arrays: ordinary signs are certified with a conservative 6-triple-product normal-range Float64 forward-error bound; cancellation, underflow, overflow and true zero automatically fall back to exact dyadic BigInt. BigInt is **conditional**, not used every drag/scene frame.

The already-merged generic recession-cone primitive from #592 now consumes the exact-for-binary64 determinant output, rather than potentially returning undetermined for representable near-degenerate triple determinants. This is model-neutral math and maintains `nonemptyFeasibleSetVerified:false`, `sourceVertexCompletenessVerified:false`, whole-scene/official-line/V5 false.

Independent tests include a 2^52 catastrophic cancellation with a nonzero exact -1 result, true zero and subnormal triple-volume, 2048 seeded integer matrices checked independently via full BigInt determinant formulas, getter/sparse/invalid input, and the real six-normal cube recession proof. Existing exact 2D tests and downstream geometry regressions plus five current HEAD CI workflows are required before merge. Revert the isolated squash for rollback.

Exactness is for **represented finite binary64 inputs only**, not original pre-rounded CAD coordinates; it is not a general root-finding or arbitrary algebraic-curve proof.
