# M0-C Jacobian rank P2 audit hardening (2026-10-22)

Source: [independent audit PR #228](https://github.com/07xh/engineering-drawing-study/pull/228) and its reproducible `independent-boundaries.cjs`.
Roadmap: #203 / #202. Governance: #152.

## Fixed boundary 1 — holes are not measured zeros

JavaScript `Array.prototype.some` and `flat` silently skip array holes. The
opt-in `diagnoseJacobian` implementation now checks ownership and finite
values at every row/column index before the zero-matrix shortcut. Sparse
zero rows and missing rows must throw, not claim a validated rank.

## Conservatively contained boundary 2 — squared-product underflow

The Jacobi implementation accumulates squared column norms and cross-products.
A finite normalized coefficient (for example `1e-200`) can have an
underflowed square. In an unresolved column pair, the implementation now
detects this loss where a nonzero coefficient is squared to zero, or a
nonzero pair product is rounded to zero, and returns:

- `numericUnderflowDetected: true`
- `status: 'undetermined'`, `converged: false`
- `conditionEstimate: null`

This is a **fail-closed diagnostic**, not a claim of a more accurate SVD.
In such results, `singularRatios`, `rankEstimate`, and
`localDegreesEstimate` are provisional computations only; clients **must not**
interpret them as a reliable mathematical verdict. The existing
`proofOfExistence: false`, `proofOfGlobalUniqueness: false`,
`globallyUnique: null`, and `solutionCount: null` semantics remain unchanged.
No solver or V5 teaching UI consumes this opt-in module today.

## Regression and review

`node --test tests/math/*.test.cjs` includes six focused new assertions:
two sparse-array audit cases, the extreme off-diagonal example, a dense
zero matrix, a true zero column, and ordinary full rank. The independent
original audit boundary script must also pass after the patch.

**Review gate:** Changes under `core/**` are high risk. Keep the PR as
Draft until independent 00/09 audit, exact-HEAD CI and ownership approval.
Do not automatically merge or claim production deployment. No changes to
CI, deployment, textbooks, secrets, solvers or V5 runtime.

## 00/09 追加数值反例：矩阵归一化阶段的下溢

原审计还需覆盖 `rows=[[1e308,0],[0,1e-308]]`。两个非零对角元素在精确数学中均有秩贡献，但按最大元素归一化时 `1e-308/1e308` 在 binary64 中下溢为零。仅在 Jacobi 的 `alpha/beta/gamma` 阶段检查下溢会漏掉此类输入并产生不可靠的秩认证。修复在 `v/scale` 发生时识别“输入非零、归一化为零”，将 `numericUnderflowDetected` 标记并令 `status='undetermined'`、`converged=false`、`conditionEstimate=null`。对应反例测试与 `diag(1e-300,2e-300)` 的良性小尺度对照已加入 `tests/math/m0-jacobian-audit-boundaries.test.cjs`。

这仍是 **opt-in 数值秩证据**，不是严格奇异值界、不保证所有严重舍入损失都可检测，且不能推断全局唯一、实际解存在或曲面拓扑。无需修改旧求解器/V5 代码。
