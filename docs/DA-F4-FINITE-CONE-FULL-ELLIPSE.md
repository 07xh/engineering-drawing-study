# 04 / F4 — Finite circular cone oblique full-ellipse solver (draft)

New independently scoped M3 specialist `engines/spatial/sections/finite-cone-plane.cjs`. Follows #372, #346 and #152. It does not add any shared math core, 3D ConstructionIntent schema, or V5 player.

## Supported domain and mathematical construction

Known upright Z-axis finite right cone, with base center B, radius R and height H in **model-mm**, apex A=(Bx,By,Bz+H). The given plane has point Q and nonzero normalized normal N. For the cone lateral surface, parameterize x=Ax+rho cos(theta), y=Ay+rho sin(theta), z=Az-(H/R)rho.

The plane gives
d = dot(A-Q,N),
s = Nz H/R,
rho(theta) = d / (s - Nx cos(theta) - Ny sin(theta)).
Let m=hypot(Nx,Ny). The strict inequality |s| > m proves the denominator has one sign for every theta; if d has the matching sign, the full ellipse has global analytic bounds
rhoMin = |d|/(|s|+m), rhoMax = |d|/(|s|-m).
Only if 0 < rhoMin <= rhoMax < R with a positive model-resolution margin does this domain return `ready`: the complete nondegenerate closed **lateral** ellipse is inside the finite cone. Horizontal plane gives the circle subcase.

The solver rechecks every sampled 3D point against **both independent equations**, reuses M0 Euclidean kernel and the shared V/H/W projection convention, and exposes the analytic numerator/denominator so a future renderer never treats the samples as exact geometry. Validated input units and normal, branch-sensitive status, 3D/model scale/translation/normal-rescaling, parameter count, source immutability, plane/circular-cone residuals are independently tested.

## Fail-closed unsupported cases

Plane too steep, vertical, generator-parallel, through/near apex, cap clipping or cap rim touch, under-resolved features, and unstable residuals return an explicitly non-ready status. Safe disjoint planes may return `none`. No silently inferred parabola/hyperbola, unverified cap chord, visibility, filled solid cut, first-angle paper composition, V5 workbench steps, global uniqueness or textbook answer.

## Integration gates

New code is a **Draft** specialist. Retain existing 04 prism/pyramid/cylinder/sphere solvers and old tests; do not replace them. Requires independent 04/09 mathematics review and 00 approval of exact HEAD CI, cap and tangent counterexamples, and a reviewed 3D evidence/Intent-to-single-V5 consumer contract. Per requested sequence, complete #394 -> #395 -> #396 -> #397 first. Rollback: remove only two new files.
