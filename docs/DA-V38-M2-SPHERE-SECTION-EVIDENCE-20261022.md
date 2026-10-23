# DA-V3.8 M2 · Trusted sphere-surface analytic section evidence

Refs #340, #343, #346, #375. **One shared M2 SolveResult envelope; one preserved 04 sphere specialist**, not a second result system.

Following the merged independently-audited 04 specialist #375, `core/results/section-evidence.cjs` now accepts another **internal recomputation only** input:
```js
const {solveVerifiedSectionEvidence}=require('./core/results/section-evidence.cjs');
const e=solveVerifiedSectionEvidence({
  kind:'sphere-surface',frame:'model-mm-3d',unit:'mm',
  solid:{center:{x:0,y:0,z:0},radiusMm:5,modelUnit:'mm'},
  plane:{point:{x:0,y:0,z:3},normal:{x:0,y:0,z:1},modelUnit:'mm'},
  samples:32
});
```

The existing allowlist and `SolveResult` schema remain authoritative. A caller **cannot** supply a `verified:true` result, a solver callback, fake origin or script-supplied positive geometry certificate. The `sphere-surface` kind internally invokes the real `engines/spatial/sections/sphere-plane.cjs` solver, validates the analytic circle or exact-represented tangent invariants, and independently recomputes actual source sphere/plane residuals in model-mm using **shared M0** Euclidean math.

A valid specialist circle `ready` or `tangent-point` yields a **scope-only** geometry flag `geometryVerifiedWithinSpecialistScope:true`, but the common external `SolveResult.status` stays `undetermined`; `proofLevel:'none'`, `globallyUnique:null`, `sourceProblemConfirmed:false`, `visibilityVerified:false`, `solutionCount:null`. A missed, near tangent or floating-point-underresolved cut transfers no positive geometry evidence and cannot be falsely upgraded to mathematical `none`.

The previous prism, pyramid and cylinder evidence contract remains unchanged. The extra `geometryVerifiedWithinSpecialistScope` field aliases existing scope-only `geometryVerifiedWithinLegacyScope`, without turning it into global answer proof. This is **not** a filled-solid sphere cut, occlusion, first-angle drawing, general projection reconstruction, AI image provenance or ConstructionStep/V5 animation. No production entry point wired.

Run `node --test tests/math/m2-section-evidence.test.cjs` and the exact PR HEAD five categories math/planar/point-projection/workbench/validate. Changes to `core/**` remain **high-risk 00/09 gated** per #152; no merge until an independent audit signs off real and forged-source negatives, 04–M2 ownership and latest-main parity. Rollback: revert this 3-file PR, not the already-merged sphere solver.
