# DA-V3.8 07 · Shared ConstructionStep → V5 presentation boundary

Refs #340, #348, #152. **This is the first additive presentation-only adapter, not a complete mathematically trusted answer pipeline.** It retains the existing 07 V5 Timeline/Motion players and does not touch core/math, 02–06 professional solvers, image review or production pages.

`workbench/construction-step-v5-adapter.cjs` exports `constructionStepsToV5({steps,frame:'model-mm-2d',unit:'mm',sheet:{origin:{x,y},scale},revision})`.

- Validates the existing core `ConstructionStep` contract, source dependencies, bounded step/action counts and explicit coordinate units. Rejects original image pixels or implied mm conversion.
- Performs ONE transparent math model-mm → presentation sheet-px conversion for **points, finite lines and circles**. Reuses actual `workbench/teaching-motion-v5.js` geometry and `teaching-timeline-v5.js` for duration, seek, back-step, revision invalidation and speed.
- Generates renderer-safe internal identifiers while preserving `sourceStepId`, `solveResultRef`, targets, constraints, explanations and reasons. Presentation conversion never mutates the original model.
- **Fail-closed intentionally:** current `core/contracts/construction-step.js` `arc` is a legacy clockwise SVG-angle interval, not an orientation-preserving mathematical arc with cw/ccw directed sweep. It is **not** silently converted; dimension/text action semantics are likewise rejected until separately versioned and audited. 07's existing specialized directed arc consumer remains authoritative.
- Output unconditionally has `mathematicallyVerified:false`, `readyForStandardAnswer:false`, `requiresTrustedSolveResult:true`, `provenanceVerified:false`. An input that happens to have been computed by a real solver does not obtain proof by passing through a formatting adapter.
- Cross-specialty rollout follows the original plan: signed SolveResult source gate → common versioned ConstructionStep action contract → **this** one V5 normalization boundary; adapt/extend only after 00/09 verifies both source provenance and directed-arc semantics. No duplicates of the V5 player per topic.

Run `node --test tests/workbench/v38-construction-step-v5-adapter.test.cjs` and full GitHub workbench, math, planar, point projection and site checks on the exact PR head. Includes an actual 03 `solveProjection` result into the presentation path, math-to-paper scale parity, edge-case, arc-direction, and step invalidation. Public UI not wired in; no production deployment claim.

Rollback is a three-file revert. Under #152, unit/coordinate and V5 protocol shifts require 00/09 approval even with green CI.
