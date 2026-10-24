# Shared M0 Float64 convex mesh and polytope boundary consumers (2026-10-24)

Extends merged M0 vector migration (#573/#575/#580) to two generic consumers of reviewed model-mm solids, not a box-specific solver: strict closed convex mesh → supporting halfspaces, and arbitrary convex polytope point-ray boundary visibility. Both now call the existing `core/numeric/object-vector3.cjs` bridge for dot/cross/sub/norm, keeping their **separate** topology/Euler/face checks, units, scale limits, strict interior proof, angular tolerance and point-ray evidence.

This is not a new geometry representation, whole-scene visibility, contour/endpoint solution or V5 player. Proof remains scoped to supplied reviewed closed convex mesh and first-order boundary ray; no all-objects completeness, original-exercise solution or official line-style signoff.

Independent regressions establish source face support membership, Euler edges, interior/open/outside boundary, H observer direction, translation and normal scaling, distinct V/H/W hulls, malformed/open/nonconvex/identity negative cases and underflow refusal. These augment the existing workbench scene depth, spatial and M5 outline suites. Abnormal nonzero products rounding to zero now fail closed at shared M0. Require exact PR HEAD five CI successes, mergeability, revertable squash. M3 specialist formulae and M2 solving stay separate.
