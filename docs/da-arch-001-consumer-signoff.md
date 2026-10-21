# DA-ARCH-001 / #147 — 02/03/07 consumer handshake (PENDING 00 freeze)

This is a **real executable** consumer-signoff set against PR #144, not evidence that
v1.0 has been frozen, merged or deployed. Run:
`node --test tests/math/consumer-signoff.test.cjs`.
The examples contain **synthetic** geometry only. No scanned textbook figures,
private exercise materials, source credentials, production endpoints or AI-derived
textbook answers.

## 02 | planar geometry
`Geometry` uses `space:'drawing-2d'`, `unit:'mm'` for all mathematical
coordinates, not SVG pixels:

- Point2D `{id:'P',kind:'point',data:{x:4,y:3}}`
- Line2D `{id:'L',kind:'line',data:{point:{x:0,y:5},direction:{x:1,y:0}}}`
- Circle2D `{id:'C',kind:'circle',data:{center:{x:0,y:0},radius:5}}`
- Arc2D `{id:'A',kind:'arc',data:{center:{x:2,y:3},radius:5,startAngle:0,endAngle:90,direction:'ccw'}}`

Each has `space:'drawing-2d',unit:'mm'`. Angles are **degrees**, measured from
the **positive mathematical x-axis**, with y increasing *up*: `ccw` must have
`endAngle>startAngle`; `cw` must have `endAngle<startAngle`; nonzero
absolute sweep <=360. This is a directed math arc, not an SVG arc action.

`toIntersectionConstraint(geometry,'P')` converts complete Line2D/Circle2D
to the existing analytical `point-2d-intersection` conditions; it does NOT
intersect a finite Arc2D or infer endpoint limits. A line is converted to
unit-normal `a*x+b*y=offset`; circle to `{x,y,r}`. Real tests include:
line y=0 vs circle center (0,0), r=5 -> two solutions (±5,0);
line y=5 -> one tangent (0,5); line y=6 -> no solution.
Two circles (0,0,r=5) and (8,0,r=5) -> (4,±3): **multiple, not unique**.
`solutions[]` is not a per-arc tangent branch registry; when nonlinear arc
connections need tangency parameter, branch labels, G1, valid angle extents,
or cusp proofs, 02 must design those as its own private solver outputs first
and request contract changes from 00/01. No automatic promotion to v1.

`toLegacySvgArc(arc,{origin:{x:100,y:100},scale:2})` provides
`{action,orientationPreserved,warning,sourceArcId}`. The SVG renderer uses
screen y **down**, its positive angle is screen clockwise, and it **only**
accepts `endAngle>startAngle`; model y is **up**.
Mathematical cw [90->0] maps screen [-90->0] with orientation preserved;
mathematical ccw [0->90] must be rendered with reversed *endpoint order*
screen [-90->0], `orientationPreserved:false` and an explicit warning.
Both draw the **same locus**, but the legacy SVG action cannot express the
directed ccw traversal. Do not use the drawing action to prove directed G1
continuity or tangent orientation. Native geometry and independent proof
remain authoritative. Unspecified custom mirroring/rotation transforms are
not supported by this adapter.

## 03 | single-point first-angle projection
Model A=(15,10,12)mm -> mathematical views
V=(u=15,v=12), H=(u=15,v=10), W=(u=10,v=12).
`{origin:{x:100,y:100},scale:2}` (2px/mm) -> sheet
V=(70,76), H=(70,120), W=(120,76), 45-degree depth M=(120,120).
Forward projection: `core/projection/conventions.project`, `sheetPoint`;
inverse per-view screen transformation: `fromSheet`. A single 2D
projection **cannot reconstruct all 3D coordinates**. Combinations V+H,
V+W and H+W recover A when compatible; contradictory x/y/z values yield
`none`; zero constraints yield continuous 3D freedom. Changing screen origin
or zoom scale changes only pixel coordinates, never the mathematical A.

Coordinate signs are based on the current legacy first-angle convention:
V top-left, H bottom-left, W top-right (for positive x/y/z relative to origin).
Negative and zero coordinates remain valid math inputs but can be outside the
visible sheet depending on canvas bounds. View labels and arbitrary camera
rotations are outside this projection contract.

## 07 | pure consumer contract
`tests/math/consumer-signoff.test.cjs` creates a real two-step Problem with
`Geometry P`, `Constraint h/v`, `SolveResult r1/r2`,
`ConstructionStep step1/step2` and authentic legacy-renderer-compatible
`actions[]`. Step1 H alone: `continuous`, no computed point;
Step2 V+H: `unique`, computed candidate P=(15,10,12).
`step2.dependsOn=['step1']`, target and constraint IDs must exist,
and `solveResultRef='r2'` binds the actual solver result.

The opt-in `consumeStep(problem, stepId, {inputRevision,resultRevision})`
returns `computed-candidate`, `unproven`, `stale`, `inconsistent`,
`branch-choice-required`, `unknown-step` or `invalid`.
**Required UI procedure**: increment `inputRevision` on *every* geometry
or constraint edit, immediately clear displayed solver-derived points/steps,
re-run trustworthy mathematics, then commit the new `resultRevision` only
when its inputs still match. Reject stale results even if the previous
coordinates look visually plausible. The revision mechanism is consumer
state management, not a cryptographic provenance verifier. Validation of
`SolveResult` structure does not itself prove that supplied values came
from a trusted solver.

The legacy renderer receives sheet-pixel `actions[].geometry` only,
whereas `Problem.geometry` retains model mathematical units. Computed
candidates are **not** automatically a textbook standard solution. Show
source-review and step-review state separately; manually drawn helper lines
may be displayed as auxiliaries but must not be presented as verified answers.
`status:'source-verified'` with a generated fixture means only test-source
provenance, not a reviewed textbook proof.

## 09 | quantitative/safety signoff and non-guarantees
- Existing solvers use different absolute EPS constants (not a project-wide
  condition-number strategy): `labs/constraint-engine.js` EPS=1e-8,
  `knowledge/planar-intersections.js` EPS=1e-9,
  `knowledge/nonlinear-local-dof.js` EPS=1e-8.
- `core/projection/conventions.aligned` uses relative-scaled EPS=1e-9:
  `|a-b| <= EPS * max(1,|a|,|b|)`. These tolerances are *not* proven
  suitable for every drawing scale or near-singular system.
- Analytic line/circle and circle/circle residuals are geometric-coordinate
  residuals; linear row residuals are normalized by max(1,row norm).
  `maxResidual:null` means no computed residual, not zero error.
  Near-tangent/near-concentric/very-large-or-small-coefficient inputs
  can be classified based on finite EPS and are not certified exact.
  No general interval arithmetic, symbolic degeneracy test or global
  optimizer has been implemented. 02 should add scaled residual metrics
  and branch checks on its private solver before claiming completeness.
- Mesh contract only validates primitive vertex/edge/face coherence and
  rudimentary non-collinearity. It does **not** validate manifold closure,
  non-self-intersection, occlusion or true 3D visibility.
- `localDegrees` describes Jacobian rank at a provided configuration;
  `globallyUnique` is a distinct claim requiring explicit proof.
  `degrees:0` can coexist with `multiple` solutions.
- Schema validators cannot verify the mathematical truth of a natural-language
  explanation, model provenance or textbook accuracy. New fixtures are
  synthetic; the existing `knowledge/problem-schema.js` source gating
  and `scripts/build-static.cjs` allowlist were **not modified**.
  `core/` and `tests/math/` are not included in published `dist/`.
  Private textbook scan/PDF and answer assets are not introduced.

## Still blocking DA-GEOM-CONTRACT-v1 final freeze
1. 02: formal Arc2D/G1/branch output requirements (no finite-arc solution today);
   question for 00: whether to add explicit `sourceGeometryIds` to constraints,
   plus model/renderer directed-orientation metadata to future steps.
2. 03: confirm the sign convention and clarify allowed projection planes/canvas
   bounds for negative/zero coordinates; no arbitrary 3D rotation contract yet.
3. 07: choose whether result revision/token should become versioned mandatory
   fields or stay an explicit UI state envelope. A validated fixture cannot
   substitute for actual trusted result provenance.
4. 09+00: verify independent numeric degeneracy cases and Cloudflare production
   trigger/rollback; new math CI and preview success do not authorize merge.
5. 00 alone: authorize any shared-schema upgrade and announce version freeze.
