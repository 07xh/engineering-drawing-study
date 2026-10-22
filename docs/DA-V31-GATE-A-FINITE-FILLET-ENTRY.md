# DraftAI V3.1 | Gate A typed planar candidate entry

Issue: #241 / #203 / #204 / #235. Product #233; gate plan #240.

## Purpose

This change supplies the **first runnable, shared math entry** for a confirmed,
structured 2D fillet problem. It reuses **existing real 02 analytic solvers**
and does not create another geometric algorithm. This is a mathematical
foundation consumer, **not OCR, a universal nonlinear solver, a finished
connecting-arc proof, or a production website**.

\`solveFiniteFillet(problem)\` accepts only \`unit:"mm"\` model coordinates
(no \`sheet-px\` or implied image calibration). The accepted kinds are:

- \`two-segments\`: \`geometry.first/second = {a:{x,y},b:{x,y}}\`, optional
  \`options.firstSide/secondSide = ±1\`.
- \`segment-circle\`: \`geometry.segment\` as above,
  \`geometry.circle = {center:{x,y},radius}\`, optional \`options.side = ±1\`.
- \`two-circles\`: \`geometry.first/second\` as full circles,
  optional \`options.firstMode/secondMode = external|internal\`.

Every input has a positive \`filletRadius\`; optional \`revision\` is a
nonnegative safe integer. The entry rejects unknown fields, degenerate source
segments, non-finite geometry, nonpositive radii, invalid modes/units and
unsupported shapes. Source **finite circular arcs are not yet accepted at this
entry**; supporting them requires a separately reviewed angular/interval
contract.

## Evidence/output contract

Returns a **candidate-set DTO**, not a \`core/contracts/SolveResult\` object.
It preserves \`kind,unit,revision,status,solutionCount,candidates[]\`.
Each candidate has \`branchId,center,contacts,maxResidual\`; finite source
contacts are vetted by the called 02 solver.

This early boundary enforces mathematical honesty:

- \`unique\` is **only** relative to specified source geometry and selected
  offset side/tangency modes, never global textbook uniqueness.
  Thus \`globallyUnique:null\` even on a one-center local subproblem.
- \`multiple\` enumerates all returned discrete centers; no branch selected.
- \`none\` returns no candidates. Coincident/continuous have unknown total count.
- \`unstable\` from existing solver becomes \`undetermined\`, not a guessed
  answer.
- \`directedG1Verified:false\` and \`finishedArcVerified:false\`: a valid
  tangent circle center/contacts does **not** prove traversal direction, finite
  arc sweep or G1 of a complete contour.
- \`revision\` travels with the result so future image/UI changes can invalidate
  older computations; this module does not own player state.

## Local and CI verification

\`node --test tests/math/v31-finite-fillet-gate.test.cjs\`

Tests exercise actual existing solver implementations for all three categories,
double-center branches, no-solution, bad radii, degenerate sources, unsupported
pixels/unknown metadata and forged/inconsistent solver output. The file lives
under \`tests/math\` so the **already-required always-on math CI** runs it
without touching any shared GitHub workflow.

No modifications to \`core/**\`, existing \`engines/planar/**\`, \`workbench/**\`,
static builds, deployment settings or private materials. Next PRs: independent
02 finite-arc/complex contour contract and 07 verified ConstructionStep
generation, then 08 image-recognition-to-confirmed-geometry adapter.

## Rollback and limits

Revert this new isolated module and its tests/docs. Existing public behavior is
unchanged; there is no prod entry wiring. Final arc direction, end-to-end
image recognition and Cloudflare deployment are **not** delivered here.
