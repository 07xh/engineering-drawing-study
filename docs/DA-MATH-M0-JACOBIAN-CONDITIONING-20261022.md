# DraftAI M0-C｜近奇异 Jacobian 数值秩：隔离式诊断原型

> 工作项：[M0 #203](https://github.com/07xh/engineering-drawing-study/issues/203)，总路线图 [#202](https://github.com/07xh/engineering-drawing-study/issues/202)。开发基线：`e986f5051c0ec6246c54e1230893137f06209795`（2026-10-22）。这是**不接入生产求解器的独立审计增量**，尚非 00 正式签收的统一约束引擎。

## 已发现的可复现风险

现有 `knowledge/nonlinear-local-dof.js` 通过固定 `EPS=1e-8` 高斯消元对未经量纲归一化的 Jacobian 判秩。不同参数的残差可能有 `mm`、`mm²`、角度余弦等不同量纲；给每个元素施加相同绝对阈值，可能仅因比例缩放就改变自由度判断。几乎平行、几乎重合、矛盾/未满足约束仍须区别对待；即使局部满秩，两个离散解也可能同时存在。

### 本次 API（仅诊断、非数学最终裁定）

新文件 `core/numeric/jacobian-rank-evidence.cjs` 导出：

`diagnoseJacobian({rows, normalized:true, relativeThreshold:1e-10, maxSweeps:60})`

- 调用者**必须先对各变量、各残差做物理量纲/局部特征尺度归一化**，并显式传 `normalized:true`。该标志是调用方承诺，库无法凭数字证明量纲已正确处理。不支持把 `mm` 与 `sheet-px`、弧度和 `mm²` 未转换即输入；不会自动转换。
- 对最多 64×64 的非空有限值矩阵做整体幅度缩放，然后使用**单边 Jacobi 旋转**使矩阵列趋于正交；以列范数估计奇异值，输出相对最大奇异值的 `singularRatios`。这样不会先形成 `JᵀJ` 把条件数平方。
- `relativeThreshold` 是明确选择的**相对**秩阈值，默认 `1e-10`；必须大于等于 `64*Number.EPSILON` 且小于 1。矩阵乘上任意非零标量不应改变推断（不包含计算机舍入造成的信息损失）。没有把这里的相对秩阈值当作工程长度或残差公差。
- 输出 `rankEstimate`、`localDegreesEstimate`、`singularRatios`、`conditionEstimate`、`converged`、`sweeps`、`thresholdSensitive`、`status`。若轮数不足或奇异值落在阈值的 1/8 到 8 倍之间，`status='undetermined'`，不能将估计秩直接用于自动判题。明确 `globallyUnique:null`、`proofOfExistence:false`、`proofOfGlobalUniqueness:false`。
- `full-column-rank` 也**不是**「空间几何解全局唯一」的证明；rank=0 也不能证明有连续解。`conditionEstimate=null` 表示未得到有限的最小非零奇异值比值，不可解读为条件良好。

## 验收覆盖与局限

运行 `node --test tests/math/m0-jacobian-rank-evidence.test.cjs`（12 条），随后需由 GitHub `math` 以及现有 `planar-math`、`point-projection`、`workbench`、`validate` 在该 PR **同一最新 HEAD** 执行回归。测试包括：正交/零/矩形 Jacobian；近奇异阈值敏感性；几乎相关行；旋转与整体尺度变换；重复约束；极大幅度；NaN/Infinity/非矩形/阈值非法；以及局部 0 自由度不得冒充全局唯一。

本工具既不是经认证的完整 SVD，也未实现带误差界的区间算术或一般系统的全局解枚举。尚未与已有真实约束图适配，**不改 `knowledge/nonlinear-local-dof.js` 的原有行为，不改 V5、02/03 求解器、网站入口或 Cloudflare 设置**。后续必须先签收统一残差与变量列的量纲缩放方案，再用真实近相切、近共线、相矛盾样例进行新旧对照；只有这样才能考虑切换求解器的默认秩分析。失败时应标记 `undetermined`，不得静默改变教材答案。

## 变更与回退

仅新增三文件：
- `core/numeric/jacobian-rank-evidence.cjs`
- `tests/math/m0-jacobian-rank-evidence.test.cjs`
- `docs/DA-MATH-M0-JACOBIAN-CONDITIONING-20261022.md`

撤回 PR 即可回退，不依赖公开构建，也不包含私人教材/图片/密钥。涉及 `core/**`，必须经 09 独立数学审查与 00 正式签收后才可合并。
