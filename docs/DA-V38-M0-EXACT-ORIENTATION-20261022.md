# DraftAI V3.8 M0 — finite binary64 exact orientation2D

Related: #340, #341, #342, #343; main baseline 3cbb329d50b3e210d72cc1f7b6686156f240ac63.

## Inventory and ownership

- Reuse: core/numeric/residual-evidence.cjs for caller-declared feature-scale tolerances; it does **not** establish exact orientation signs.
- Reuse: core/numeric/dimensionless-jacobian.cjs and jacobian-rank-evidence.cjs for *local* numerical rank diagnostics, not intersection topology or global uniqueness.
- Reuse: core/contracts/geometry.js for schema validation; its EPS-based checks have different semantics, so this PR **does not change** them.
- Avoid overlap: draft PR #351 adds Euclidean vectors and affine transforms. This increment adds **only** core/numeric/orientation2d-exact.cjs and its isolated tests; it does not edit #351 files.

## API

orientation2D(a, b, c) accepts three dense arrays [x, y] of finite JavaScript Number values, assumed already expressed in the **same coordinate frame and engineering unit**. Returns an immutable {sign, orientation, exactForBinary64Inputs} where sign = +1 is counterclockwise, -1 clockwise, 0 exactly collinear **for the representable binary64 inputs**. Invalid input throws TypeError; an invalid status is not quietly mapped to collinear.

The predicate uses the exact integer significand and base-2 exponent of each finite binary64 input, then computes the two differences and determinant with BigInt dyadic arithmetic. Its sign does not rely on floating determinant magnitude, so it remains correct when ordinary arithmetic cancels, overflows, or underflows. It does not accept model/pixel unit tags or convert pixels to mm; the caller must validate provenance and coordinates upstream.

## Verification / cases

Run: node --test tests/math/m0-orientation2d-exact.test.cjs and node --check core/numeric/orientation2d-exact.cjs. Tests cover orientation, winding reversal, exact collinearity, duplicate points, signed zero, cancellation to a spurious floating zero for an integer determinant of -1, subnormal products, 1e308 overflow, stable translations/permutations, invalid arrays/holes/nonfinite values, and 512 deterministic independent integer-grid BigInt comparisons.

## Proof limits, integration and rollback

- **Exact only for the input float values.** Decimal values already rounded in OCR or coordinate conversion cannot be recovered. A very small exact nonzero determinant does not imply a geometrically meaningful separation above the chosen feature tolerance; use existing residual-evidence policy separately.
- This is **not** an adaptive exact-geometry library for 3D solids, a numeric distance estimate, segment intersection, curve intersection, local DOF, or proof of existence/global uniqueness. There is no SolveResult/ConstructionStep/V5 integration here.
- Inputs sharing frame/units are an explicit contract precondition; mismatched coordinate frames or mm/pixel mixing must be prevented before this function.
- Unbounded repeated calls can incur BigInt cost; benchmark before consuming large image contours and do not pass unchecked user-sized collections directly.
- Proposed dependency: 02 and 04 should use this predicate only after 00/09 sign-off and explicit transform/scale provenance tests; do not silently replace legacy EPS decisions.
- High-risk core/** modification: **leave PR unmerged for 00/09 independent mathematical review**. No workflow, production asset list, Cloudflare settings, private data or existing solver changed. Revert the isolated PR/commit to roll back.
