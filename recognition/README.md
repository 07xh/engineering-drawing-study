# DraftAI V3 / 08-A — offline recognition input contract

Related: [V3 #233](https://github.com/07xh/engineering-drawing-study/issues/233), [08 #234](https://github.com/07xh/engineering-drawing-study/issues/234), [R0 #240](https://github.com/07xh/engineering-drawing-study/issues/240), [01 adapter #241](https://github.com/07xh/engineering-drawing-study/issues/241).

**Scope:** an opt-in offline candidate and image-coordinate foundation. It does **not** do actual OCR, photo decoding, drawing recognition, geometry solving, V5 animation, or public upload. The three self-authored SVG drawings in `fixtures/` are independent image inputs for future accuracy evaluation. Candidate records in tests are explicitly created, NOT extracted by a detector. This is not evidence that unknown raster images can already be recognized.

## Interfaces

`page-transforms.cjs`: `checkImage`, `pageTransform`, `mapPoint`, `invert`, `homographyFromCorners`. A four-corner homography maps original-image pixels to rectified **drawing pixels**, tracks inverse transform, and rejects singular/out-of-bounds transforms. It never infers drawing mm from raster distances.

`problem-draft.cjs`: `newDraft`, `validateDraft`, `reviewCandidate`, `draftReadiness`, `sourceBBoxToDrawingCorners`. The `draftai-recognition/v0.1` candidate format contains `id/kind/bbox/method/confidence/reviewStatus`. Supported kinds: `segment/circle/arc/dimension/note`; primitives carry `geometry.frame:'drawing-px'`; dimensions have kind (R/Φ/length/angle/unknown), units, raw text, value and source IDs. Arc direction is explicit. `reviewCandidate` requires an expected revision, increments it, and discards any stale solver/animation proof claims. Unknown dimensions, R/Φ conflicts and unconfirmed elements remain blocking. Source note text is untrusted and inert.

**Safety:** `candidate-reviewed` means only that candidate records received human decisions, not that mathematical values or geometry are solved. `solverReady:false`, `geometryVerified:false` and `globallyUnique:null` persist until a distinct signed 01→02 contract/solver is implemented. Images are not stored by this module. Size and MIME metadata checks do NOT prove byte safety or authorization for a public upload endpoint: file magic, safe decoding, EXIF handling and storage lifecycle are still required before any backend rollout.

## Verified offline checks

```sh
node --check recognition/page-transforms.cjs
node --check recognition/problem-draft.cjs
node --test tests/recognition/*.test.cjs
```

14 focused assertions cover 3 distinct synthetic sheets, rotated/perspective bboxes, invalid quadrilaterals, size caps, R versus Φ, missing/contradictory dimensions, fake mm frames, stale revisions, injection-like OCR notes and fail-closed proof semantics. The current GitHub Actions workflows do not yet invoke `tests/recognition` automatically; 00/09 must approve a separate workflow/CI integration if required. Existing green checks alone do not establish recognition test coverage.

**Next:** 08-B real offline primitive and OCR candidate producer; 08-C browser review UX; 01 typed mm/constraint adapter; 02 solver; 07 existing V5 consumption. Actual R0 acceptance still requires three truly unfamiliar input images progressing through the entire chain. No private scanned textbook, photos, user secrets or AI API credentials are included in this PR.
