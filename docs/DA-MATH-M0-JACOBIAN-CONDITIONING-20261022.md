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


## M0-C2｜2026-10-22 真实架构审计与几何反例

最新 main 基线：97fab3ad422b578d0a30aa08afd55e1d98a97f7a（审计快照）。

- core/contracts 的五大 schema 提供结构/状态验证，不证明非线性解存在或全局唯一。
- core/adapters/legacy-solvers.js 对 multi-point-2d-local-jacobian 仍调用 knowledge/nonlinear-local-dof.js；后者以固定 EPS=1e-8 消元。本 PR 新核心模块仍只是 opt-in 诊断。
- engines/projection/point-projection.cjs 使用真实第一角 V/H/W；engines/planar/** 实现真实圆弧、切点及方向 G1 检查；workbench/** 经验证适配器生成步骤，不应该让数学精度模块直接生成教学标准答案。
- .github/workflows/core-math.yml 当前已经在每 PR、main push 运行稳定 math 检查；GitHub main protected=true。但 Cloudflare Active production SHA 仍需单独核实。

### 旧算法确实存在可复现尺度依赖

实际调用当前旧正式入口 knowledge/nonlinear-local-dof.js 的 analyze：
点 A=(d,0)、B=(0,0)，给定距离 |AB|=d，所有输入都满足约束。

| 距离 d（mm） | 旧 rank / 局部 DOF | 新诊断 rank / 局部 DOF |
| --- | --- | --- |
| 1e-12 | 0 / 4 | 1 / 3 |
| 1e-9 | 0 / 4 | 1 / 3 |
| 1e-6 | 1 / 3 | 1 / 3 |
| 1 | 1 / 3 | 1 / 3 |
| 1e6 | 1 / 3 | 1 / 3 |

该非零距离条件的一阶梯度非零，按四个坐标变量的局部线性化，其 rank 应为 1。旧固定阈值把小量级梯度误作零。新测试通过指定 1mm 参考单位把变量与平方距离残差显式转换为无量纲；这一单条件对照不能替代多约束系统的统一行/列归一化。

当前 tests/math/m0-jacobian-rank-evidence.test.cjs 已扩展至 18 条，新增真实几何来源的距离约束尺度、两圆有两个离散交点但每个交点局部满秩、近相切阈值敏感、零长度奇异、满秩但采样点不满足约束、Jacobi 轮数不足。所有证明边界维持原样：局部秩估计不能宣称几何全局唯一。

### 后续接入顺序（不得直接替换旧求解）

1. 01/00 签收变量尺度、不同单位残差（mm、mm²、rad、无量纲）逐行归一化；normalized=true 是调用者承诺，不能自动认证量纲。
2. 09 审计真实约束公式和解析/有限差分 Jacobian 的一致性，并加入矛盾、多解、近相切、几乎相关、尺度与旋转等可重复正反例。
3. 首先以旁路比较形式并行运行新旧诊断；不得改变 SolveResult、现有学生判题和 V5 动画。数值未定时必须明确返回 undetermined。
4. 差异由 00/09 签收；真实集成使用独立 PR 和当前 SHA 的完整 CI。
5. docs/da-arch-001-consumer-signoff.md 对 aligned 的旧比例 EPS 描述与当前 core/projection/conventions.js 的绝对模型单位检查不一致，另开文档校准，不改动算法。

本 PR 是 Draft，不是新的生产求解器；云端预览成功亦不等于生产版本已切换。
