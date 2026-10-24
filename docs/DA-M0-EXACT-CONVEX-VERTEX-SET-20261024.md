# Exact convex polyhedron vertex-set verification — M0 opt-in offline (2026-10-24)

This supersedes the numerically ambiguous subset of draft #570 without merging its 20-file draft or introducing a second geometry engine. Reuses the **only** dyadic exact binary64 kernel from #593 and source-independent bounded recession certificate #592. The function `certifyConvexVertexSetExact({solid})` accepts 4..16 outward halfspaces and 4..128 proposed vertices. It is a source-neutral, purely algebraic audit, deliberately NOT a main-path numerical optimizer, live-drag primitive or new M3 solver.

1. Snapshot every typed finite normal, offset, and proposed vertex exactly once. Reject sparse or getter-mutable values that differ at verification and consumption.
2. Independently certify zero recession cone. Merely finding finite triple intersections is NOT proof of boundedness.
3. Enumerate EVERY independent triple-plane intersection. Compute exact dyadic Cramer determinant numerators and denominator using the shared 3D determinant. Check each candidate against EVERY inequality by exact rational sign, with no geometric EPS, and deduplicate by exact rational equality.
4. Require strict full-dimensional interior. For each halfspace, at least one exact derived extreme vertex strictly satisfies it. The average of all extreme vertices is then a strictly feasible interior point.
5. Require the supplied finite binary64 vertex list to match the derived exact rational vertices bijectively, using exact dyadic multiplication, with neither missing, forged, nor duplicate vertices.

For a nonempty full-dimensional bounded polyhedron, every true extreme point is an intersection of three linearly independent active supporting planes. These conditions therefore certify the vertex set of **the supplied** represented-binary64 halfspaces when every extreme point is exactly representable as the supplied binary64 coordinates. For nonrepresentable rational corners (e.g. x=1/3), near-degenerate or oversized geometry, return `undetermined` rather than approximate a proof. This is mathematically conservative, NOT universal vertex certification.

Tests cover real cubes, translated rectangular prisms, tetrahedra, square pyramids, a missing extreme vertex, inserted interior point, duplicate vertex, missing bound, geometrically inconsistent constraints, zero-thickness 2D polytope, rational x=1/3 nonrepresentable, strict input snapshots, sparse data and signed exact determinants.

**No proof of input image/source provenance, current revision, all-scene inventory, continuous 3D occlusion, endpoint joins, official drafting style, unique answer, SolveResult/ConstructionIntent/DAG or V5 is produced**; all those output flags remain false. Five latest PR HEAD CI checks must pass before an isolated squash merge. No existing solver or private image file is changed.
