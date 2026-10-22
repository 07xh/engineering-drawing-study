# DraftAI V3.8 / 04 · Sphere-surface vs plane analytic section

Ref #340, #346 and DA-ARCH-MANDATORY-001. This is a **real opt-in specialist mathematics increment**, not a lesson screenshot, V5 animation, generic solid-volume proof or parallel math kernel.

## Algorithm

`planeSphereSurfaceSection(sphere,plane,{samples:48})` uses the existing shared M0 `core/numeric/euclidean-kernel.cjs` vector/subtract/dot/norm/cross3/normalize and shared `core/projection/conventions.js` V/H/W projector. Requires explicit `modelUnit:'mm'` on *both* sphere and plane.

For sphere center C, radius R and normalized plane normal n through P:

- d = n · (C − P); q = C − d n is the circle center on the plane.
- If |d| is greater than R beyond the declared model tolerance, there is no surface intersection within this limited geometry contract; returns non-verified `none`.
- If |d| = R **exactly for represented inputs**, the intersection is a tangency point q. Numerical *near* tangency returns `undetermined` (no small/zero circle is fabricated).
- If |d| is reliably less than R, the **analytic** section radius is sqrt((R−|d|)(R+|d|)). An orthonormal in-plane U/V basis is constructed from the shared M0 cross-product, not copied from SVG or OCR. It represents q + radius (U cos t + V sin t).
- Each sampled curve point is separately tested against sphere radius and plane distance, under a declared model-mm tolerance, then projected with the existing V/H/W contract. Samples are **visualization only**, never considered the analytic mathematical curve proof themselves.

Scope is strictly **one known sphere surface and one known plane**. Nothing verifies three-view visibility, filled cut face, finite camera occlusion, global 3D reconstruction uniqueness, other solids, image recognition, 45° sheet layout or ConstructionStep / V5 animation. Proof flags and `globallyUnique:null` remain conservative. It is not yet connected as positive `SolveResult` evidence: M2 #359 allowlist remains intentionally limited until 00/09 audits sphere-specific analytic invariants and source provenance. No existing 02/03/04/05/06 solver is replaced.

## Files and gate

- `engines/spatial/sections/sphere-plane.cjs` — actual analytic geometry solver.
- `tests/math/v38-sphere-plane-math.test.cjs` — equatorial and oblique 3D residuals, offset radius, exactly represented tangent, near-tangent fail-closed, no-intersection, model scale, unit/coordinate/bounds rejection and immutable input.
- Reuse shared M0 rather than implementing a second numeric dot/cross system.

Requires latest PR HEAD Node math/planar/projection/workbench/site CI and independent 00/09 evidence review before merge. Rollback: revert this three-file feature. Do not claim new public workflow, V5 animations or production deployment from a preview build.
