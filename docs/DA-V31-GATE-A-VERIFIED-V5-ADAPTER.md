# V3.1 | Confirmed geometric problem → verified G1 → V5

**Scope:** follow-up to #245 math gateway; 07 task #236; master #233; Gate A #240.
This is an opt-in internal path. No public upload/UI, no OCR, no static answer
fixtures, no production build changes. The PR is **stacked on #245**, not
independently mergeable to main until its mathematical dependency is signed off.

## Calling convention

```js
const {confirmedFilletTimeline}=require('./workbench/v31-confirmed-fillet-v5.cjs');
const result=confirmedFilletTimeline({
 problem:{
  kind:'two-segments',unit:'mm',revision:1,filletRadius:3,
  geometry:{
   first:{a:{x:-10,y:0},b:{x:10,y:0}},
   second:{a:{x:0,y:-10},b:{x:0,y:10}}
  }
 },
 selection:{branchId:'s++',direction:'ccw',
  firstTravel:'forward',secondTravel:'forward'},
 sheet:{origin:{x:360,y:220},scale:8}
});
```

First, `normalizeProblem` and `solveFiniteFillet` validate and calculate
the finite candidate centers/contacts in model millimeters. This module
requires an explicit branch when candidates are multiple; if there is only
one candidate under the supplied restrictions, that local branch may be
selected, **without asserting global textbook uniqueness**.

Second, the **existing** 02 directed G1 solver independently recomputes
the selected branch with explicit cw/ccw and source contour orientations.
The **existing** verified V5 bridge then produces step actions and a
timeline. The consumer cross-checks the selected branch, model center,
fillet radius, both source tangent-contact endpoints, tangency residual and G1 proof against the independently
computed candidate before returning `status:'ready'`.

No mathematical answer is produced by OCR, UI interpolation or a stored
SVG fixture.

## Fail-closed behavior

- Multiple candidates but no branch: `requires-branch`.
- Missing sweep: `requires-direction`.
- Missing approach/departure orientation: `requires-travel`.
- No mathematical candidate, discontinuous G1, invalid finite source, or
  unverified step evidence: `blocked`, zero drawing steps and no timeline.
- Unknown input property, invalid mm values or forged choice: hard error.
- The model result retains `revision`, verified center, true contacts,
  selected branch, source scope and residual; `globallyUnique:null`.
- Revisions invalidate old outcomes at the state/controller boundary; this
  pure function **does not** own browser player invalidation. The controller
  must compare revisions before presenting any timeline.

## Real tests

`node --test tests/workbench/v31-confirmed-fillet-v5.test.cjs`

The tests run existing 02 solver implementations and 07 V5 timeline with
three numerical configurations, G1 mismatch, erroneous branch/travel,
zero/nonexistent solution, mm-vs-pixels, modified radius/revision and
sheet scale invariance. They are included automatically in the existing
always-on `workbench` CI. Any app with OCR still needs a separate adapter
from **user-confirmed** recognition conditions.

## Deployment/safety

No changes to production, static allowlist, workflows, authentication, AI
APIs, student data or private textbook resources. No existing V5 or 02
source implementation is modified. Review #245 first, then retarget/rebase
this stacked PR to main, rerun exact-head CI and request 09 independent
math and UI-gate review. If rejected, discard the branch without affecting
existing public behavior.
