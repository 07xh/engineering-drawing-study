# M0 API/consumer/negative-regression acceptance matrix

Authority: DraftAI Issues #372 and #152. First batch enumerates every current core/numeric CJS module, one actual regression evidence file, mathematically LIMITED proof scope, and a nonempty unresolved gate.

The JSON inventory is machine-audited by scripts/audit-m0-acceptance.cjs. Run node scripts/audit-m0-acceptance.cjs to inspect existing source-file static literal imports and their downstream transitive references. The new tests/math/m0-acceptance-matrix.test.cjs is a regression gate: any numeric module added/deleted without updating its acceptance record fails CI.

Trust boundaries: a test file's existence and a require/import edge DO NOT prove that a runtime solver executes the source, that the proof is mathematically complete, that a caller's source revision is genuine, or that any certified line style, construction DAG, V5 or production Active SHA has passed. Dynamic imports are not exhaustively represented. Scoped-math is an implementation-evidence label, NOT full M0 signoff.

Real code consumers EXIST: core/constraints/linear-point-local-evidence.cjs imports dimensionless-jacobian, jacobian-rank-evidence, and residual-evidence; the affine unknown-point and nonlinear point solvers also import rank evidence. They are consumer-review, NOT globally mathematics-signed: derivative source, formula, revision and edge-case parity still need independent validation. Human reviewed pixel frame remains provisional, not independently scaled or photo-verified. All ray, bounded-polytope and projected edge results remain within their supplied-data proof scopes; no scene-wide signoff is implied.

Next batch: run the generated inventory on current HEAD, prioritize entries with no verified real runtime consumer, write independent cross-scale oracles, and upgrade a status only after explicit source, failure, integration and current HEAD CI evidence. No new solver, SolveResult, ConstructionIntent, DAG, V5 or user data is changed.

## 当前正式执行计划

开发节奏、CI 四分片提速、批量 PR、逐 API 真实消费者与反例签收规则，统一参见 [M0 正式验收加速执行计划](./M0-ACCEPTANCE-FAST-TRACK-PLAN-20261024.md)。此计划服从 #372 数学分层与 #152 单人项目验收合并制度，不替代已有 20 模块验收矩阵或独立数学证据。
