# M0-C Jacobian rank P2 audit hardening (2026-10-22)

Source: [independent audit PR #228](https://github.com/07xh/engineering-drawing-study/pull/228) and its reproducible `independent-boundaries.cjs`.
Roadmap: #203 / #202. Governance: #152.

## Fixed boundary 1 — holes are not measured zeros

JavaScript `Array.prototype.some` and `flat` silently skip array holes. The
opt-in `diagnoseJacobian` implementation now checks ownership and finite
values at every row/column index before the zero-matrix shortcut. Sparse
zero rows and missing rows must throw, not claim a validated rank.

## Conservatively contained boundary 2 — squared-product underflow

The Jacobi implementation accumulates squared column norms and cross-products.
A finite normalized coefficient (for example `1e-200`) can have an
underflowed square. In an unresolved column pair, the implementation now
detects this loss where a nonzero coefficient is squared to zero, or a
nonzero pair product is rounded to zero, and returns:

- `numericUnderflowDetected: true`
- `status: 'undetermined'`, `converged: false`
- `conditionEstimate: null`

This is a **fail-closed diagnostic**, not a claim of a more accurate SVD.
In such results, `singularRatios`, `rankEstimate`, and
`localDegreesEstimate` are provisional computations only; clients **must not**
interpret them as a reliable mathematical verdict. The existing
`proofOfExistence: false`, `proofOfGlobalUniqueness: false`,
`globallyUnique: null`, and `solutionCount: null` semantics remain unchanged.
No solver or V5 teaching UI consumes this opt-in module today.

## Regression and review

`node --test tests/math/*.test.cjs` includes six focused new assertions:
two sparse-array audit cases, the extreme off-diagonal example, a dense
zero matrix, a true zero column, and ordinary full rank. The independent
original audit boundary script must also pass after the patch.

**Review gate:** Changes under `core/**` are high risk. Keep the PR as
Draft until independent 00/09 audit, exact-HEAD CI and ownership approval.
Do not automatically merge or claim production deployment. No changes to
CI, deployment, textbooks, secrets, solvers or V5 runtime.
