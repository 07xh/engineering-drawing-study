# DraftAI V3.4 / 08-C2: explicit R/Φ annotation review (SVG only)

Related: #233, #234, #240, #243. Builds on merged #247 vector parser, #250 typed source-and-mm adapter, #255 local SVG picker, and current V3.3 on-device photo line/curve suggestions.

## Shipped scope

A local-only, user-reviewed `R`/`Φ` dimension-linking form is added under the **existing** SVG vector import panel of `labs/auto-fillet-live.html`. Each extracted vector annotation receives a distinct row and must be explicitly assigned one of:

- **Source circle**: user chooses one of the two explicitly selected source circles, enters/edits a numeric measurement **in millimetres**, and checks its radius/diameter against the source geometry after user-reviewed `mmPerPx` calibration. Existing #250 source dimension residual checks are reused. A length, angle, line source, unselected circle, or conflicting measurement is rejected.
- **Target connecting fillet radius**: only a literal R-marked candidate, not Φ, may be assigned to the *target* R. Its reviewed value must match the **separately entered** connecting `filletRadiusMm` within a bounded tolerance. This is not a mathematical proof of OCR accuracy or of intended target linkage. The annotation remains excluded from source dimensions; its explicit user selection and numeric check are carried in provenance.
- **Explicitly discard**: any note or unneeded annotation can be deliberately rejected; it is not silently ignored, and there is no automatic inferred answer from it.

An unreviewed label, nonexistent or duplicate annotation ID, duplicate source, wrong kind, unsupported type, nonpositive/nonfinite or conflicting value, invalid calibration or stale ProblemDraft revision **must not** reach the solver. The original `reviewCandidate` and `prepareConfirmedFillet` contracts remain unchanged. New annotation review records carry `confirmed:true` only as a user-interface indication, not secure authentication. Changing source selection or mm fields removes the checkbox confirmation; the existing #248 session invalidates old V5 timeline and branch/travel selections upon import.

The file is still local SVG (not a photo); raw SVG markup is never added to the DOM or uploaded. No private user images, OCR service API, arbitrary image AI claims, production auth, build workflow or core math source modifications.

## Testing

`node --test tests/workbench/v34-vector-annotation-review.test.cjs`: true solver/G1/V5 pass for source Φ and target R, corrected bad OCR candidate, conflicting R/Φ, wrong circle, ambiguous target, note prompt injection, duplicate/missing/stale provenance, UI no-network and retention of existing on-device photo line/circle detection controls. Existing SVG tests stay passing. GitHub current HEAD `math`, `planar-math`, `point-projection`, `workbench`, `validate` and Cloudflare preview must all succeed before merge; if high-risk entry gate review not signed, keep PR open rather than bypass.

## Still out of scope

Reliable raster text OCR and image-to-label geometry associations, partial arcs/dashed/hidden lines, perspective-corrected photos, globally unique solution proofs, auto-generated arbitrary 2D drawing answer, actual Android pen/browser test, and production Active SHA/HTTP/privacy verification. The current vector UI accepts only finite segments and complete circles as R0 source geometry.
