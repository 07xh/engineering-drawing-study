# M0 shared object-vector3 migration: independent bounded consumers (2026-10-24)

## One kernel, not new mathematics

The existing `core/numeric/euclidean-kernel.cjs` remains the numerical authority. `core/numeric/object-vector3.cjs` is exclusively a shape bridge between already existing model-mm `{x,y,z}` coordinates and the kernel's finite Float64 vector arrays. No unit conversion, coordinate frames, global tolerances, entity identities, mathematical proof, or rendering is added.

## First actual consumer batch

Migrate duplicated subtraction, dot product, 3D cross product, and Euclidean norm in the existing cylinder, rectangular prism and rectangular pyramid M3 plane-section solvers. Keep their own validated geometry, bounded mm domains, special-purpose analytic intersection, local degeneracy thresholds, orientation/projection, status and evidence scopes. Add and scalar interpolation remain local for this increment, to avoid an untested bulk rewrite.

The adapter is opt-in and fail-closed on illegal coordinates, overflow and nonzero multiplication underflow. Those exceptional numerical inputs may now raise an error instead of yielding a misleading nonfinite/zero intermediate. This is a deliberately conservative input-boundary tightening, not a claim of blanket behavior parity for pathological Float64 inputs.

## Verification

- Existing 09 independent plane/area/perimeter regressions and 04 specialist tests continue to act as separate oracles.
- Added M0 array/object arithmetic parity, illegal and numerical-loss cases, first-angle projection, 3 solid types' normal/horizontal cuts, no-intersection, degenerate normal, explicit no-V5 or visibility proof.
- Latest HEAD five workflows required before merge. No old solver deletion, new math solving path, ConstructionIntent, ConstructionStep DAG, V5 or production deployment changes.
- Next step: audit remaining local add/scale and other specialized duplicated vector operations with cross-scale differential tests; then move one safe consumer group per PR, never homogenize specialist geometric tolerances or predicates.
