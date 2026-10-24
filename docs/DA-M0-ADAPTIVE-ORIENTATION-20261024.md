# M0 fast + exact adaptive 2D orientation / M1 real consumer

The existing fully exact `orientation2d-exact.cjs` remains authoritative for uncertain represented-binary64 inputs. New `orientation2d-adaptive.cjs` uses the conservative Float64 orient2d first-order roundoff filter `(3 + 16u)u * (|L|+|R|)`, `u=2^-53`, only accepting a sign when all intermediates/guard are finite and `abs(det)>guard`. Otherwise it calls the existing exact dyadic BigInt orientation. It reads each input coordinate once, so a mutable/getter-backed source cannot be changed between checking and fallback.

The EXISTING M1 finite-segment topology analyser consumes this public M0 adaptive predicate without changing its units/frame, identities or topology output. The filtered sign is exact for the represented inputs; both results **do not** claim pre-rounding real-coordinate exactness, geometric proximity, intersection coordinate, global uniqueness, or proof of V5.

Independent analytic and exact oracle tests cover normal turns, collinearity, cancellation at 2^52, subnormal nonzero determinants, product overflow, 2048 deterministic fractional inputs, getter/malformed input, and consumer crossing/endpoint/overlap. Ordinary cases run without BigInt. Existing M1/M2 and five HEAD GitHub CI suites required. Rollback by reverting only this isolated squash commit.

No new general polynomial/root/3D curve exactness, new solver, second SolveResult, V5 or global scene proof.
