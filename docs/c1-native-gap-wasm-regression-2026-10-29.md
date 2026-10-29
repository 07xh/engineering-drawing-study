# C1 native source-gap real WASM regression

The reviewed skew tetrahedron (`C1SkewTetra`) is a synthetic mathematical counterexample, not a blind textbook exercise. `tools/cad-oracle/run-c1-ocjs-runtime.mjs` now feeds the **same** pinned OpenCascade.js WASM CAD result and independently recomputed `auditC1OcjsM5ProofGaps` ledger into `auditC1ThreeNativeGapBatchFromM5Ledger`.

The three A-end positive gaps are H/A–C `[0,5.02742501717052e-18]`, W/A–C `[0,1.1102230246251565e-16]`, and W/A–D `[0,9.431983218054427e-18]`. A mismatch is a hard regression failure, not an epsilon correction.

This test validates cross-revision/source/view/gap consistency and genuine runtime execution. It **does not** certify generated HLR edge → original TopoDS edge history, global continuous occlusion, formal line style, ConstructionIntent or V5. A separate blind textbook C1 whole-problem acceptance remains required.
