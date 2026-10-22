# V3.8 M3 / 09 · Baseline metamorphic evidence for existing real planar tangency

Refs #340, #343. This **test-only** increment does not implement a second tangency solver, a new SolveResult or V5 pathway. It calls the real existing engines/planar/offset-tangency.cjs module, recomputes independent line/circle contact radii from candidate coordinates, and records branch count, translation and common-scale invariance, reversed line/side equivalence, no-candidate and invalid-input cases.

Tests guard continued behavior before any migration of 02 into M0/M1/M2. They do not certify G1 of oriented arcs, finite segment clipping or complete global solution enumeration. Input coordinates are the legacy input-math-unit; this regression must not be interpreted as reviewed model mm or pixel-scale proof. The compared line/circle case intentionally has two center candidates, never a unique global answer.

Run node --test tests/planar/v38-m3-tangency-parity.test.cjs and all applicable exact HEAD math/planar/projection/workbench/validate CI. No core/** modifications, existing solver changes, deployment, public build, private data or UI change. Revert test+doc commit to roll back. Follow-up after shared math audit: compare exact M2 numerical evidence against this baseline before any 02 consumer wiring.
