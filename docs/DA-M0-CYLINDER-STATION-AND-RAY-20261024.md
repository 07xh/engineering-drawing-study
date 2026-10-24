# M0 canonical spatial vector and first-angle consumers: cylinder section stations and visibility

This is a reuse migration in TWO distinct existing 04 specialist consumers: analytic cylinder station derivation and continuous cylinder cap/lateral observer-ray classification. Both already obtained true source models and clipped analytic boundary from existing M3. They now use the one shared M0 Float64 object-vector3 kernel for subtract/dot/norm, and the authoritative `core/projection/conventions.js` for model-mm first-angle V/H/W positions. Previous duplicated projections are removed; no second projection formula.

**Intentionally unchanged:** specialist polar station parameterization, local angular roots, cap/side/plane residual checks, strict boundary degeneracy, individual halfspace decisions, caller-required retained halfspace and source image/revision confidence; original local precision gates remain. The `add(t,label)` local is the angular station label registrar and is NOT vector addition.

**Proof scope:** `stations.modelGeometryVerified` and locally-scoped `visibilityVerified` can be true where genuinely supported, while `constructionStepsReady`, endpoint visibility, standard view layout signature, and `v5StrokeStyleReady` remain false. No entire scene, official line style, global unique source, user-photo blind trial or Production Active certification from this migration.

Tests independently recompute true V/H/W for each 3D special point, projection of auxiliary generators, inclined plane residual, horizontal and clipped source ray visibility, near-vertical/degenerate failure and signed first-angle observers. Require 5 latest PR HEAD CI completed/success, mergeability, then squash; rollback isolated revert.
