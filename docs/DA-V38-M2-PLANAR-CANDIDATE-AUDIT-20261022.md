# V3.8 M2 independent planar candidate residual audit

Refs #340, #343 and open #359. Reuses the existing model-mm residual-evidence policy, and tests real 02 legacy line/circle and circle/circle analytic intersections; NOT a second SolveResult or a replacement analytic solver. Does not conflict with #359's specialized section status adaptation.

API: core/verification/planar-candidate-audit.cjs auditPlanarCandidates accepts exactly two explicit model-mm-2d line/circle primitive constraints, 0..16 candidate points with unique branch IDs, a current source revision, local feature scale and explicit absolute/relative mm tolerances. Computes independent primitive distance residuals and checks branch separation under the declared local numerical policy. Outputs immutable numeric-audit evidence only.

This does not prove an intersection exists, that the legacy solver has enumerated all branches, that a zero-candidate system is inconsistent, or that there is globally one answer. near-identical candidates report branch-separation-undetermined; low residual remains numerical consistency, not existence or global uniqueness. Rejects pixel units, invalid primitives, zero normals, scale overflow and nonfinite candidate results. Source revision is advisory and must be checked against fresh user-reviewed ProblemDraft upstream.

Tests run with real legacy knowledge/planar-intersections.js in GitHub: multiple circle intersections, two line-circle roots, forged wrong point, empty candidate set, duplicate branch locations, scaling, nonfinite and mismatched units. Local Node v22 preflight 8/8 with equivalent legacy formulas; only GitHub CI on exact HEAD verifies actual integration. Legacy specialized solver and existing core/contracts/solve-result.js remain authoritative; no consumer wiring or V5/production path modified.

High-risk core changes remain Draft pending independent 00/09 audit; math/planar/projection/workbench/site CI success and latest-main parity required before merge. Roll back with isolated commit revert.
