# V3.1 08-B1 — Offline SVG vector-to-candidate extraction

Scope: a strictly bounded **vector SVG import** over the already merged 08-A `draftai-recognition/v0.1` draft. It parses `line`, `circle`, straight `path` M/L/H/V/Z and basic `text` R, Φ/Ø/⌀ and degrees from newly presented SVG source, without fixture-name dispatch or preloaded result geometry.

**Not OCR**: does not decode photographs/PNG/JPEG, find pixels by vision, OCR images, calculate CAD curves, solve geometry or construct V5 playback. Reject unsupported transforms, nested and external assets, scripts, event handlers, entities, CSS, pathological sizes/shape counts. Raw untrusted SVG must not be inserted into live HTML/DOM.

Output: `extractSvgCandidates(svg)` returns a validated and completely `unconfirmed` ProblemDraft plus readiness metadata. Each shape uses `drawing-px` coordinates, not calibrated `model-mm`. Every R/Φ annotation starts with `refs:[]` and `unit:null`, so a human must confirm intended source and units before a typed math adapter can consume it. Text not recognized as a dimension is an inert note. No proof of existence, unique geometry, source measurement, or mathematical correctness is asserted.

Tests: `node --test tests/recognition/*.test.cjs` (the original 08-A tests plus new B1 tests). The B1 cases check the three original independently authored images as **input files**, additional parametrically generated unfamiliar SVG geometry, R/Φ ambiguity, revision/user confirmation, malicious input, excessive size, unsupported transforms and no fake solver/animation. No input filename or target solution is hardcoded in the implementation.

Release limits: only new `recognition/**` and `tests/recognition/**` files, no CI/workflow, `core/**`, 02 solver, V5, cloud or dist changes. Current static build allowlist does not contain recognition. No backend upload has been deployed. The V3.1 governance in #233/#234 prioritizes M0/01/02 mathematical signoff, then solver→V5, then image linkage; this parallel 08-B1 implementation does not change that dependency.

Future: bitmap pixel detector/OCR and alignment, manual correction UI, typed mm calibration approval, solver/G1 evidence, verified ConstructionStep DAG, and independent 3-new-image end-to-end acceptance. Revert the additive PR if necessary.
