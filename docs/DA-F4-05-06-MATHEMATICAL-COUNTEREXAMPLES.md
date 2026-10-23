# DA-F4 05/06 mathematical counterexample preflight

Scope: Independent 09/M5 test-only evidence for #347 (05 intersection curves) and #345 (06 multiview ambiguity), governed by #372 and #152. No new solver, 3D ConstructionIntent, V5 renderer, production UI or hidden-line certification.

## 05 infinite orthogonal cylinder surfaces
For equal radius r and intersecting cylinder axes along Z and Y:
(x-cx)^2+(y-cy)^2=r^2 and (x-cx)^2+(z-cz)^2=r^2.
Thus z-cz=+(y-cy) OR z-cz=-(y-cy). The two analytic parametric families are
x=cx+r*cos(t), y=cy+r*sin(t), z=cz+/-r*sin(t).
Both satisfy independent implicit equations. The branches cross when sin(t)=0, yet differ elsewhere. One branch is not the entire intersection. Scaling and translation in model-mm preserve surface equations.

Identical coaxial cylinders yield coincident 2D surface patches rather than one 1D curve; tangent parameter rank must be recognized rather than fabricating a unique finite intersection line.

Excluded: finite-cylinder caps, truncation, visibility, curve-topology reconstruction, arbitrary radii/orientations, and V5 animation. Further 05 work requires explicit finite domains and proof of branches, joins, residuals, projections and visibility.

## 06 unlabeled correspondence ambiguity
Unlabeled 3D pairs (2,3,5), (2,7,9) and (2,7,5), (2,3,9) have identical unordered V(x,z) and H(x,y) projected point collections but distinct W(y,z) point collections. Without vertex correspondence, two views do not justify a globally unique spatial interpretation. Identified points with known pairing (existing 03 point projection) are a different, already-solvable domain. Paper scaling/rotation does not restore a missing correspondence.

Excluded: proof for general solids, known edge topology, hidden-line rules, multiple components, OCR confidence, full third-view reconstruction and global-uniqueness claims.

Delivery gate: Retain as Draft until #394 -> #395 -> #396 -> #397 independent 00/09 review and integration. Real 05/06 specialist implementations require separate design, residual/degenerate/multi-solution tests, 3D output contract and 09 validation. Rollback removes only this new test and documentation.
