# M0 C 批次：真实非线性距离约束消费者 × 独立解析 Jacobian × 数值收敛边界

执行 [M0 正式加速计划](./M0-ACCEPTANCE-FAST-TRACK-PLAN-20261024.md)，以**两个同一数学契约下的执行测试文件 + 三处过时源码注释修正 + M0 20 模块矩阵链接**作为单个可回滚 PR，避免单独负例拆碎提交。

## 正面数学证据

- 真实 `core/constraints/nonlinear-point-candidates.cjs` 消费既有 M0 Euclidean 与 Jacobian rank，并经实际用户 seed 求解上下两圆距离分支。测试从两固定圆心、距离约束**独立手写解析距离梯度**及规范化 6×6 Jacobian，直接喂给现有 M0 `normalizeLocalSystem` / `diagnoseJacobian`；检查返回数值秩与 M3 候选计算的 rank 一致。
- 三种模型-mm 尺度、根的正负分支、反转种子顺序，由独立的解析交点公式 `x=(d²+r1²-r2²)/(2d)`、`y²=r²-x²` 校验候选坐标，且真实 M3 内的残差必须符合当前声明阈值。

## 反面数学证据（防止误签）

- 完全相切两圆：解析两距离梯度线性相关，Jacobian rank=5，数值局部自由度不是全局曲线维度，已有解析分支分类应为 `undetermined`。
- 近切两圆：真实中点猜测与两个代数根存在可测距离，但因残差在阈值内被识别为**局部候选**；必须继续展示 `globalBranchEnumerationComplete:false` 与 `SolveResult.solutionCount:null`，严禁将“低残差”推为根精度或根完备性。
- 额外约束可能排除已认证的两圆子图代数分支，不能把子图 `branchCount:2` 当成整个图存在/唯一性的证明。
- 数值秩处于阈值附近或极端下溢时必须保持 `undetermined`，不给正式几何或 V5 授权。

记录另一个审计事实：三项 M0 数值工具虽仍在源码头注释声称“无下游求解器导入”，但实际已被 `core/constraints/linear-point-local-evidence.cjs`、M3 仿射未知点/非线性点求解器调用。只修注释以匹配已经合并的真实引用；不改 M0 数值、M3 求解及 V5 逻辑。

这些有限的真实代码回归**不保证**全部来源导数经过形式证明，不提供一般非线性全局分支完备性，也不证明原始照片/修订、三视图轮廓或生产 SHA。现有 20 模块登记中的 `remainingGate` 和保守状态全部保留，最终仅在同一 PR HEAD 五组 CI 全绿并可合并时 squash。