# DraftAI V3.8 M0 — reviewed image px → model mm boundary

Related: #340, #341, #342, #343. New isolated module `core/numeric/reviewed-pixel-frame.cjs` and regressions `tests/math/m0-reviewed-pixel-frame.test.cjs`.

## Existing implementation inventory

- Reuse without mutation: `labs/manual-raster-scale-calibration.cjs` calculates human-reviewed single-segment `mmPerPx` proposals; `labs/local-raster-circle-scale.cjs` calculates a user-accepted R/Φ suggestion; `labs/manual-raster-ruler-crosscheck.cjs` and `labs/manual-raster-mixed-scale-audit.cjs` diagnose scale disagreement.
- Reuse conceptually: `core/numeric/residual-evidence.cjs` defines feature-scale-relative tolerances, not image coordinate conversion or pixel-source freshness.
- Reuse legacy view conversion only after an explicit model result: `core/projection/conventions.js` converts model projected coordinates to drawing sheet coordinates but does not certify a photo scale.
- Do not modify above modules or overlap PR #351 Euclidean kernel or PR #353 exact orientation. Their core/math mathematical review remains independent.

## Opt-in contract, M0 only

`createReviewedPixelFrame({image,scale,origin,approved:true})` requires:
- `image:{id,revision,width,height}` with safe image version and original raster dimensions (24..10000 px).
- `scale:{frame:'original-image-px',unit:'mm/original-image-px',reviewed:true,sourceId,imageId,revision,mmPerPx}`. Bound image ID/revision must match. `mmPerPx` is positive and within the currently supported existing manual-segment range `1e-9..1e6`. Caller must have separately recorded genuine human approval.
- `origin:{pixel:{x,y},modelMm:{x,y},modelYDirection:'up'|'down',reviewed:true}`. Explicit model origin and y-axis convention are required; pixel origin lies inside source raster.
- The function does not accept raw OCR-predicted length as approval and cannot itself authenticate UI consent. An 08 adapter must bind its current reviewed scale suggestion to the current photo ID/revision, and invalidate it whenever source geometry, human approval, image, or dimensions change. No network, persistence or photo data is added in this PR.

`toModelMillimetres(context,{imageId,revision,frame:'original-image-px',point:{x,y}})` rejects stale image ID/revision, implicit pixel coordinates, nonfinite/out-of-bounds points, overflow, underflow, and unsafe addition at an enormous model origin. It returns a frozen `model-mm-2d` point with model unit `mm`, source image/revision and `calibrationStatus:'user-reviewed-provisional'`. The context uses an internal WeakMap rather than trusting a spread/copied object.

**Critical scientific limits:** This is a uniform isotropic 2D scale and translation with an explicit up/down choice, not an affine homography, dewarping, nonlinear perspective correction, or error-bound guarantee. It does not establish globally uniform scale, actual real-world accuracy, user-input trust, tolerance compliance, solving, global uniqueness or valid ConstructionStep/V5 output. The floating resolution check is a conservative heuristic and not interval arithmetic. Image and scale revisions are advisory stamps that the caller MUST update correctly on every edit, not cryptographic identity proof. Large-scale batch conversion performance and Android original-photo gesture integration are untested.

## Tests / adoption gate

Run `node --check core/numeric/reviewed-pixel-frame.cjs` and `node --test tests/math/m0-reviewed-pixel-frame.test.cjs`; core-math GitHub Actions should include the new test via `tests/math/*.test.cjs`. Ten tests cover reviewed Y-up/down conversions, model-mm origin, stale/wrong photo, missing unit/frame/approval, invalid scale, invalid pixel/model origins, boundaries, malformed inputs, lost precision at large model origins, finite-output protection and distance consistency. Existing maths and workbench checks must continue to pass on the exact PR HEAD.

**Future integration:** 08 must pass a rev-bound user-approved calibration snapshot; 01/09 must inspect its provenance and numerical precision; 02/03/04 consume the explicit model-mm result only after 00/09 signoff and independent residual checks. Avoid parallel duplicate coordinate engines. Preserve existing photo geometry QA and fail closed on unreviewed dimensions or perspective distortion. No changes to production pages, workflows, deploy scripts, secrets or private photos.

## Release / rollback

`core/**` is high risk under #152: open Draft PR, request independent 00/09 audit before any merge. PR CI green ≠ merged ≠ deployed. Revert the isolated changes to roll back. The module is not imported by existing solvers, so this delivery does **not** claim a working new-photo end-to-end solver.

## 00 审计追加：一次性来源快照

在本 PR 的独立数值审查中发现，JavaScript 属性 getter 可能在“验证字段”与“冻结数据”之间返回不一致内容。现在原图 `id/revision/width/height`、审核比例 `mmPerPx/sourceId/imageId/revision`、审核坐标原点 `x/y` 与轴向在入口只读取一次，并在本地不可变快照上验证、储存；回归用 getter 在第二次读取时返回 `Infinity/NaN/其他 ID`，确认不会污染已审核毫米结果。该加固仍不保证源 UI 真正有人审核，也不引入加密图像指纹或透视校正。
