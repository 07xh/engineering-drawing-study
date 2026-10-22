# DraftAI V3.8 · M2 finite-section evidence trust boundary

Refs: #340 / #343 / #346 / #359, mandatory architecture rule DA-ARCH-MANDATORY-001.

## Motivation and change (2026-10-22)

Previous `sectionEvidence({result,solverId})` trusted the caller's `verified: true` and a finite `maxResidualMm`. A fabricated object with only `{status:'ready',verified:true,maxResidualMm:0}` could be reported as `geometryVerifiedWithinLegacyScope:true`, without source geometry. That is **not** a trusted mathematical proof.

**New rule: no arbitrary caller-supplied `result` may grant positive section geometry verification.** This PR is intentionally opt-in and changes no production solver or V5 consumer.

## Supported APIs

- `sectionEvidence({result,solverId,scope?})` is now an untrusted legacy inspection boundary. Any raw `verified:true` is rejected. For non-verified legacy statuses, it emits only `status:undetermined`, `maxResidual:null`, `geometryVerifiedWithinLegacyScope:false`, `sourceMethod:'untrusted-caller-result'`.
- `solveVerifiedSectionEvidence({kind,solid,plane,frame:'model-mm-3d',unit:'mm',samples?})` invokes a **fixed internal allowlist** of existing domain specialists, with no caller-supplied `result`, `solverId` or substitute solver callback. Kind is one of:
  - `rectangular-prism` → existing finite axis-aligned rectangular-prism plane solver;
  - `rectangular-pyramid` → existing upright rectangular-pyramid plane solver;
  - `cylinder-lateral` → existing Z-axis cylinder **lateral surface** intersection (not a proof of complete capped solid).
- The trusted path preserves solver-specific topology requirements: closed, connected source-face polygon for prism/pyramid; analytic closed lateral curve or genuine finite vertical generators for cylinder. It requires explicit solver-produced `modelUnit:'mm'`, real positive residual evidence and supported geometry status. Unsupported, empty, clipped and degenerate source results remain `undetermined`, **not proven `none`**.

Example:

```js
const {solveVerifiedSectionEvidence}=require('./core/results/section-evidence.cjs');
const evidence=solveVerifiedSectionEvidence({
 kind:'rectangular-prism', frame:'model-mm-3d', unit:'mm',
 solid:{min:{x:0,y:0,z:0},max:{x:10,y:10,z:10}},
 plane:{point:{x:0,y:0,z:12},normal:{x:1,y:1,z:1}}
});
```

The output always uses the existing `SolveResult` status `undetermined` with `globallyUnique:null` and `proofLevel:'none'`. `geometryVerifiedWithinLegacyScope:true` is **only** an internally recomputed specialized geometry certificate; it does not attest to global uniqueness or existence of a unique 3D reconstruction, non-verified user-input photo, solid interior, visibility, first-angle sheet standards, or correct V5 steps. The result includes `sourceProblemConfirmed:false`; **upstream user-reviewed input freshness still requires its own gate**. The trusted path never publishes guessed coordinates or answer branches.

## Negative and positive tests

`node --test tests/math/m2-section-evidence.test.cjs`

Covers real recomputed prism/pyramid/cylinder positive scope, finite cylinder generators, model-mm/mm constraints, fake verified flag with and without geometry and units, raw real solver result supplied by caller, fake solver override, unsupported or degenerate/clipped cuts, and invalid sampling. Independently run full `node --test tests/math/*.test.cjs` and applicable exact-HEAD GitHub math/planar/projection/workbench/validate workflows.

## Integration and high-risk merge gate

Keep old solvers unchanged as regression reference and source-of-truth; do not merge outdated Draft #337 as written because it upgrades scoped section `ready` to unproved `unique`. No new parallel geometry engine. Add a consumer only after a separate cross-engine parity review (04 + 07 + 09), including data-origin validation and V5 step/coordinate checking.

Changes under `core/**` require independent 00/09 audit, exact final HEAD CI, latest-main compatibility, and explicit review before merge under #152. Until approved, this PR remains Draft. Do not confuse PR preview with production deployment.

Rollback by reverting only the three files modified by #359, preserving 04 specialist solvers, historic tests, shared V5 or Cloudflare routes.
