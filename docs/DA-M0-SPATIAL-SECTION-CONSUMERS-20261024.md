# M0 public math + first-angle projection reused by existing 04 specialists

Phase after merged #573/#575/#580/#581/#582/#584. This increment migrates **five real 04/M3 consumer modules** (finite cone section visibility, cone plane classifier, finite cylinder lateral arc solver, finite cylinder perimeter, prism open-face visibility) to existing `object-vector3.cjs` dot/sub/norm and, where duplicated, `core/projection/conventions.js` V/H/W projection.

**Preserved:** specialist analytic conic and cylindrical section equations, actual finite-solid cap topology, original tolerances, source/planar model units, candidate/degenerate cases, old public input and result shapes, scoped `visibilityVerified` when *only* open cut-edge interiors are covered, while endpoint/whole-scene and official `v5LineStylesReady`/`v5StepsReady` remain false and original V5. No second parser, proof level, special case or independent rendering pipeline.

Independent tests cover cone strict full vs clipped vs none vs unsupported, actual cone open-ray split, cylinder full lateral with each sample projected to canonical first-angle V/H/W, genuine 1D perimeter connectivity, and prism first-angle open face visibility. Existing math, workbench, and current HEAD five CI jobs are required; abnormal underflow/overflow now fail closed in the shared M0 kernel. Revert isolated squash to roll back.

Not claims: universal conic classification, complete continuity proof, combined multiple-solid silhouette, full official line styles, original-worksheet blind trial, or production Active SHA.
