# M0 bounded recession certificate: stable complete face source

The existing `trivial-recession-cone.cjs` is used by the only exact convex-vertex audit, which was independently hardened in [#672](https://github.com/07xh/engineering-drawing-study/pull/672). Its mathematical proof is the exclusion of both oriented rays for **every** independent outward-normal pair. It does not establish feasibility or source authenticity.

Previously `parse` enumerated the caller-owned face array and immediately ran normal/offset getters. A getter for face 0 could replace/remove face 1 or a later face **before** its source was read, silently changing the set of inequalities from the one supplied at the start. This batch captures all indexed face objects first, rejecting holes, before consuming each normal/offset once. No exact determinant, recession proof or numeric solver is reimplemented.

The independent test uses the bounded six-face rectangular box. It mutates a later face and removes another bounding face from inside the first face normal getter, yet expects the original six-face recession proof to be used; it verifies reversed ordering and normals uniformly scaled, truly missing faces, sparse lists, first-read nonfinite values and a separately audited source with missing extreme vertices or even contradictory offsets. The recession certificate remains `nonemptyFeasibleSetVerified:false` and `sourceGeometryVerified:false`; a malformed full 3D source cannot gain an exact vertex proof by merely having an algebraically bounded recession cone.

This adds limited real regression evidence to the existing 20-module acceptance manifest, not a claim that M0 or V5 is 100% complete. Valid output applies to the snapshotted finite halfspaces only; original-image source, continuous silhouette, all occluders, source revision, engineering line styles and deployed SHA remain separate.

Requires exactly the final PR HEAD all five GitHub workflow families successful, workbench four shards and aggregate success and mergeable=true. No bypass of #152.
