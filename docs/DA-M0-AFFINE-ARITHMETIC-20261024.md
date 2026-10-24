# M0 shared Float64 addition and scaling, phase 2 (2026-10-24)

Follow merged PR #573: extend the EXISTING `euclidean-kernel.cjs` with checked `add` and `scale`, expose `addObject3` and `scaleObject3` only as type-shape bridges, and migrate remaining repeated object addition and scalar operations in the prism and pyramid specialist plane cutters.

No parallel mathematics, coordinate transformations, new global EPS, rewritten analytic sections, SolveResult, ConstructionIntent, DAG, V5 player, production settings or private sample files. Cylinder side and segment interpolation remain specialized pending differential testing.

Consumer degeneracy gates, finite model-mm bounds, orientation/first-angle projections, scoped section topology and negative visibility/V5 results remain in their original solvers. Very small nonzero-products that round to zero or overflow now throw at the M0 boundary rather than silently becoming geometry facts; this is a conscious fail-closed edge-input change, not a blanket parity claim.

Independent tests cover 2D/3D finite arithmetic, sparse dimensions, exceptional overflow/underflow, object/array parity and non-horizontal five/six-vertex spatial sections. Existing real specialist oracles plus exact HEAD five CI checks remain required before merge. Rollback by squash revert; no bulk deletion of legacy algorithms.
