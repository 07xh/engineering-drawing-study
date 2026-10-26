# C1 H-view held contour: exact provenance handoff (2026-10-27)

Base: `9aa2bc0e49d620e5e3e0ba773c19821560b487e6` (merged #820).

## Confirmed reusable proof, not a completed contour

- M4 original source interval coverage and exact positive gaps: `workbench/c1-original-source-interval-coverage.cjs`.
- Native source partition and M4 ray proof consumers: `workbench/c1-native-hidden-global-m5-stroke-gate.cjs`.
- #816 and #819, now merged, provide adversarial interval and cross-consumer checks; #820 adds deterministic partition metamorphic checks.
- The prior pinned C1 convex native OCCT contour comparison reported 12/14 independently matched original-source contour spans. Two H-view contour endpoints remain held. Do not extrapolate from a covered paper interval to an exact original TopoDS edge history.
- #818 owns production OCCT/V5 release checks. #797, #800 and other open C1 gate PRs own related proof integrations. Do not modify their consumers in parallel without auditing latest main and their changed paths.

## Mandatory evidence record for EACH held H endpoint

1. Original M0 physical source edge ID and exact 3D start/end vertex coordinates, not projected coincidence.
2. The canonical original-edge parameter range and exact M4 subdivision, with positive gap and overlap checks.
3. OCCT HLR generated TopoDS edge identity and its actual native paper endpoints, preserving native binary64 coordinates.
4. A positive generated-edge-to-original-edge history mapping, including splits, duplicates and generated fragments, not a guessed nearest edge.
5. Independent first-angle H projection of the original physical 3D vertices and endpoint connectivity against the native generated edge.
6. All-face continuous occlusion along every final segment, including junctions and interval switches.
7. The appropriate GB engineering visible/hidden line-style decision, only after 1–6.
8. A single approved ConstructionIntent → ConstructionStep DAG → sole V5 action, never a parallel renderer.

## Fail-closed decision table

| Evidence | Allowed conclusion |
| --- | --- |
| Exact M4 interval union only | Mathematical coverage; no TopoDS or V5 certification |
| Full disjoint native source tiling only | Native interval partition; still no generated-edge history |
| Projected paper endpoints coincide but physical 3D source identity missing | `undetermined` |
| One held H endpoint remains unproven | No whole-contour or whole-solid V5 certification |
| Original TopoDS history + physical topology + continuous all-face occlusion + GB style + unique DAG all proven | Eligible for the existing final V5 gate, not an alternate signer |

## Next execution order

1. Extract the exact two held H endpoints from the pinned OCCT fixture/runner; publish actual original 3D and generated TopoDS IDs and parameter ranges.
2. Compare against #817 literal physical vertex mapping without snapping or tolerances; preserve every mismatch.
3. Feed the positive historical source identity into existing #797/#800/#818 gates once independently verified; test translation/rotation invariants from #815.
4. Run pinned OCCT WASM/oracle checks in addition to workbench and the five standard CI workflows; record which actually executed.
5. Do not claim C1, C2, C3, engineering style, unique V5 or production deployment complete from documentation or interval-only tests.
