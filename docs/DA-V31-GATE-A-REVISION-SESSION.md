# DraftAI V3.1 | Revision-safe fillet solver playback session

Issue #236, end-to-end Gate A #240, QA #243. Depends on merged #245 and #246.

## Capability added

`createConfirmedFilletSession(initial, {now, speed})` is a small **in-memory**
controller in `workbench/v31-fillet-session.cjs`. It reuses the already merged,
mathematically verified `confirmedFilletTimeline` chain and existing V5
`Timeline.createPlayer`; it does not reimplement solvers or user-interface
animation. It does not store any private photo or build an upload API.

For any geometry/fillet-radius, branch/direction, or sheet transform change,
call `replace(nextFullConfirmedInput,{expectedRevision,now})`, where
`expectedRevision` is exactly the current controller revision and `now`
is an explicit monotonic timestamp (milliseconds provided by the caller).
The controller:

1. Refuses stale updates before changing the current session.
2. Invalidates the old V5 player **before** the new solve is attempted.
3. Advances the revision even if the edited inputs are ambiguous/invalid.
4. Recomputes math and independent G1/V5 validation from the entire updated
   confirmed input, never changing source data in place or reusing a prior arc.
5. Rebuilds a new player at elapsed=0 only if the mathematical plan is verified.
6. Blocks timeline/steps for bad conditions, no solution, G1 conflicts or missing
   choices, while preserving a useful status/reason.
7. Exposes `canRender(currentRevision)`, `snapshot(now)`, `play`, `pause`,
   `seekProgress`, `seekStep`, `setSpeed`; old revisions cannot render through
   this session. Plan/snapshot outputs are defensive copies.

## Minimal illustration

```js
const {createConfirmedFilletSession} = require('./workbench/v31-fillet-session.cjs');
const session = createConfirmedFilletSession(initialConfirmedProblem, {now:0});
const r0 = session.snapshot(0);
const r1 = session.replace(changedRadiusConfirmedProblem, {
 expectedRevision:r0.revision, now:100
});
// r1.revision === r0.revision + 1
// r1.ready only if a recomputed, proven G1 and valid V5 timeline exists.
```

## Scope and limitations

This module is **not** connected to public pages or OCR, so the browser
application still needs a separate wiring PR to call `replace()` on actual
user edits. External code holding a *previous defensive copy* must still use
`canRender(revision)` when displaying anything. There is no asynchronous job
scheduler; all internal solver computations are synchronous.

The numerical details remain in 02 and 01. This controller only handles
revision/transaction/isolation for proven mathematical results. Existing
V5 supported speed range 0.25–4× is reused.

## Verification

`node --test tests/workbench/v31-fillet-session.test.cjs`

The tests use true 02 analytic math and true V5 timeline: change one fillet
radius 3→4, check center and pixel radius updated, enforce new revision,
reject stale writes, abandon old answers on missing branch and invalid segment,
block playback on incomplete choices, reject backwards timestamps, preserve
separate sessions, and defend against caller mutation.

Only two new files are added under 07-specific workbench and test folders.
No shared core, workflows, build manifest, deployment, files, secrets, or
private textbooks are touched. If review fails, this opt-in module can be
reverted independently without changing previously merged math features.
