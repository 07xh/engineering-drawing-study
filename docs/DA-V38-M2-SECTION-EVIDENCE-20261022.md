# M2 section result proof boundary (V3.8)

Base main: `e390a214d1fd9826c82aca70a47d89e9f97ced18`. Issue #340/#343. This additive module provides a conservative result-protocol boundary for existing 04 finite section solvers. It does NOT replace a single legacy solver.

- `sectionEvidence({result,solverId,scope:'finite-plane-section'})` validates bounded legacy status and returns an object accepted by `core/contracts/solve-result.js`.
- `ready` means the legacy geometry has passed its limited checks. It NEVER means `unique`; the wrapper returns `undetermined` with the positive scoped geometry flag separate from global solution status.
- `none`, clipped, degenerate, boundary-degenerate, numeric uncertainty do not receive a proof of mathematical nonexistence. They remain undetermined rather than being rewritten into globally proved none.
- Verified section residual must be finite nonnegative model millimetres. Pixels, forged global uniqueness and inconsistent verified flags fail closed.
- No V5 rendering or production path changes; this opt-in adapter cannot prove visibility, missing geometry, exact solids, branch completeness or global uniqueness.

Run `node --test tests/math/m2-section-evidence.test.cjs` and `node --test tests/math/*.test.cjs`. Also require PR exact-HEAD GitHub Actions math, planar, point projection, workbench, validate all success. 00/09 independent review must approve core/** high-risk changes before merge. Rollback: revert isolated module, tests and this document.
