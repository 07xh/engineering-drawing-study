# M0 bounded recession cone certificate (2026-10-24)

## Why this exists

PR #570's proposed convex-vertex-completeness function requires a STRICT positive four-normal tetrahedron around the origin. This is a **sufficient but not necessary** positive-span criterion: the six outward face normals of an ordinary cube cannot satisfy it, despite forming a bounded cone. Avoid falsely labeling valid cube geometry unbounded or unverified based solely on four faces.

## Mathematically scoped reusable certificate

New `certifyTrivialRecessionCone({halfspaces})` is an **opt-in, M0-only, solid-kind-agnostic** predicate. The recession cone of the halfspace intersection is `{d | n_i dot d <= 0 for all i}`; if it is trivial, the intersection (IF NONEMPTY) is bounded. For a pointed nonzero polyhedral cone in 3D an extreme ray is shared by two independent active bounding planes, in a direction proportional to either sign of `n_i cross n_j`. For EVERY nonparallel pair this algorithm finds independent strict signed 3x3 determinant witnesses that rule out both possible directions. Therefore no nonzero recession direction can remain. Missing witnesses, near degeneracy, Float64 underflow, errors or poorly conditioned signs return `undetermined`, never an unearned boundedness claim.

Parallelism uses the **existing M0 exact-for-binary64 adaptive 2D orientation**, not an invented angular EPS. Triple determinant exclusions are certified only when a conservative `64 * Number.EPSILON * sum(abs(six triple products))` guard is smaller than their magnitude and every intermediate product, sum and guard satisfies the normal-range error model. Very small or nearly coplanar inputs deliberately remain undetermined. This conservatively establishes sign for the represented binary64 normals, **not** the original unrounded input geometry.

## Scope limits and regression evidence

The certificate **does not assert the halfspaces are consistent/nonempty, derived from reviewed source Geometry, or have complete vertices/face incidence**, and always sets these fields false, along with whole-scene, official line style and V5. It can be consumed by #570's separate vertex/feasibility audit only after validating that audit's source and vertex completeness; there is no new solver, field-of-view, M3 specialist, ConstructionIntent, DAG or player.

Independent tests: axis-aligned cube (6 normals), rotated/scaled cube, redundant planes, finite tetrahedron, remove-any-face unbounded sets, rank-two normals, nearly parallel cases, contradictory offsets, getter mutation, sparse and invalid inputs. Maintain existing M0 property/geometry tests and five exact PR-head CI checks before merge. An isolated squash reversion restores prior behavior.
