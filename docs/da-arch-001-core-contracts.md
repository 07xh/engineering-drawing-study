# DA-ARCH-001 | Geometry core phase 1 (contract freeze candidate)

## Scope and baseline
- Baseline main: `55625e46efe933fb3c5a8a918a9bd32c5451c423`.
- This PR only introduces additive `core/`, `tests/math/` and a standalone math CI workflow.
- No existing engine, content, original textbook solution, UI, current deployment workflow or release path is modified.
- First phase is NOT a general solver for arbitrary geometry, sections, intersections or three-view completion.

## Five contracts (schemaVersion 1.0.0)
- **Problem**: id, title, type, source(book/page/optional answerRef), status, givens, geometry[], constraints[], steps[], renderMode. Unversioned legacy problems remain accepted; the legacy adapter adds 1.0.0 without changing source or review status. Existing review statuses remain authoritative.
- **Geometry**: id, kind(point/line/segment/circle/plane/mesh), space(model-3d/drawing-2d), data, optional unit(mm/unitless). A mesh is only basic point/edge/face topology; it does NOT prove a closed solid or face visibility.
- **Constraint**: id, scope, targetIds[], type, data, source(given/derived/reviewed). Solver routing uses explicit scope. Single-point scopes refuse mixed target IDs. Raw math engines are invoked through adapters rather than rewritten.
- **SolveResult**: status(unique/multiple/continuous/coincident/none/unsupported/undetermined), scope, solutions[], solutionCount, degrees, localDegrees, rank, globallyUnique, maxResidual, proofLevel, diagnostics[], solverId. Null means unknown/not applicable, NEVER 0 by guess.
- **ConstructionStep**: legacy id/explanation/actions plus optional dependsOn[], constraintIds[], targetIds[], reason, checks[], solveResultRef. A valid graphical action is not automatically an independently verified geometry proof.

## Proof semantics and limitations
- `unique` is only used for mathematically determined solutions in the scope handled by the current linear or analytic solver. A 0-dimensional discrete solution set may have multiple points.
- `multiple` requires at least two enumerated discrete candidates. `continuous` and `coincident` have unspecified/infinite count (null).
- Linear degrees are based on exact *linear system structure* as implemented using numerical row reduction. Nonlinear `localDegrees` is a first-order Jacobian rank at **the supplied configuration**, never a global uniqueness or existence proof.
- `atProvidedConfiguration=false` means the configuration does not satisfy the constraints, not that no solution exists elsewhere.
- The legacy multi-point linear engine currently returns rank/degree/count but not the coordinates. Its adapter intentionally leaves `solutions=[]` even if the count is 1, with a diagnostic.
- `maxResidual` is measured in coordinate units for analytic intersections; normalized by max(1, row norm) for linear equations. Null indicates it has not been measured (not a zero residual).
- Tolerances and conditioning of legacy solvers are unchanged. Near-degenerate cases require dedicated solver analysis before strong mathematical guarantees are extended.

## First-angle coordinates
- Model point: `{x,y,z}`, in model units, without any pixel coordinates.
- Orthographic mathematics (view-local): `V:{u:x,v:z}`, `H:{u:x,v:y}`, `W:{u:y,v:z}`.
- Sheet transform is explicitly separate and is parameterized by pixel origin and positive scale:
  - V: (ox - s*u, oy - s*v)
  - H: (ox - s*u, oy + s*v)
  - W: (ox + s*u, oy - s*v)
- Thus V is above H, W is to the right of V; corresponding x/height/depth remain equal in the math layer.
- 45-degree transfer uses M=(ox+s*y, oy+s*y) as a *sheet construction*, never a mutation to the model.
- The sheet transform is invertible per view and is compared against the original `DrawingLabGeometry.projectPoint` by tests.

## Adapter entry points
- `core/adapters/legacy-constraints.js` converts the typed constraint to an unchanged legacy condition.
- `core/adapters/legacy-solvers.js` dispatches to the existing spatial, planar, intersection, multi-point and local Jacobian functions. Unknown scopes receive `unsupported`.
- `core/adapters/legacy-problem.js` converts old source-verified problem records and teaching mesh models without mutating the original object.
- Existing pages continue importing their old scripts unchanged. The new contracts are **opt-in**, not a forced migration.
- Public `dist/` remains controlled by the existing static build allowlist and deliberately does not include `core/` or `tests/` yet. Integration must explicitly decide when safe public assets may include the new layer.

## Acceptance commands
```sh
node --test tests/math/*.test.cjs
node scripts/check-constraint-engine.cjs
node scripts/check-dof-lab-geometry.cjs
node scripts/check-problem-schema.cjs
node scripts/check-unified-constraint-analysis.cjs
node scripts/check-multi-point-constraints.cjs
node scripts/check-nonlinear-local-dof.cjs
node scripts/build-static.cjs
```

The standalone `DA-ARCH-001 core mathematics` workflow runs only syntax and independent math tests. The existing `Validate study site` workflow remains intact and independently checks legacy UI/learning behavior and public allowlist. No PR is automatically merged or released.

## Pending total control
1. Confirm contract v1.0.0 and projection coordinate/sign conventions as a project-wide interface.
2. Coordinate independent CI file changes from PR #113 and PR #123; do not merge or rewrite them here.
3. Decide future support for solver conditioning, exact tolerance policies, section/intersection visibility, and versioned migrations.
4. Coordinate review of any future public static build allowlist changes with the release/security specialty.


## Independent audit fixes and freeze constraints (2026-10-21)

The independent six-case negative audit from PR #145 has been incorporated into this
branch's `tests/math/contract-audit-regressions.test.cjs` along with positive
and negative integration cases. Contract validation now checks both shape and
cross-record semantics:

- A `Constraint.targetIds[]` target must be present in `Problem.geometry[].id`.
  For multi-point constraints, targetIds must exactly match the point identifiers
  explicitly used in the typed condition's data. Named geometry IDs and mesh-local
  vertex IDs are not interchangeable.
- Step dependencies must reference *earlier* steps (self/future references fail).
  Step constraintIds and targetIds must exist in the Problem arrays. A step
  solveResultRef requires an optional `Problem.solveResults[]` entry with that id.
  Unversioned legacy steps lacking these optional references continue to work.
- `Constraint.data` is validated for each (scope,type), including required
  numeric fields and elementary degeneracy guards. A nested `data.type` is invalid
  and cannot override the typed outer constraint in the legacy adapter.
- Discrete `multiple`, `none`, `continuous`, `coincident` and undetermined
  results cannot assert `globallyUnique:true`. An analytic/linear `unique`
  result must have solutionCount 1 and degrees 0. `localDegrees` remains a
  first-order Jacobian diagnostic only and does not imply global uniqueness.
- Geometric `arc` is a 2D mathematical drawing-plane primitive with
  `data: {center:{x,y}, radius, startAngle, endAngle, direction:'cw'|'ccw'}`.
  Angles are in **degrees**; ccw requires increasing angle, cw decreasing;
  nonzero span at most 360 degrees; this is model geometry, **not pixel space**.
- Legacy ConstructionStep drawing `arc` actions retain the old SVG renderer
  shape `{cx,cy,r,startAngle,endAngle}`, where endAngle>startAngle, span <=360,
  corresponding to the existing increasing screen-angle convention. They must
  be converted explicitly by the renderer adapter; a mathematically ccw
  model arc must never be silently rendered with the wrong sweep.
- `Problem.source` remains compatible with old textbook `{book,page}`.
  Explicit `{kind:'generated',generatorId}` may represent synthetic test or
  parameterized problems; `{kind:'user-input',confirmed:boolean}` represents
  direct input. Automatic solving of unconfirmed user inputs is rejected.
  Neither path invents textbook page citations or bypasses the separate
  textbook source/answer review statuses.

### Known limits at the v1 boundary
These validators do not provide a geometric existence proof or guarantee that
a user-provided natural-language explanation is true. Numerical tolerances of
existing solvers still differ by scope. `mesh` checks basic vertex references,
edge duplication and non-collinear faces, not closed-solid manifold topology,
self-intersection or visibility. The point solver's constrained unique solution
may be returned as coordinates only where its legacy engine actually computes
them. Drawn helper lines still need a proof/explanation record generated from
verified solution data.

**Freeze gate:** New `core` + inherited CI and independent negative regression
must all pass on the final PR head; 02/03/07 integration requests and 09
security review must be addressed before 00 announces final `v1.0.0` freeze.
The GitHub PR and this document alone do not declare the interface frozen.
