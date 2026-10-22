# DraftAI M0-D｜无量纲 Jacobian 与残差证据（独立增量）

> 2026-10-22 · 数学任务 #203：https://github.com/07xh/engineering-drawing-study/issues/203
> 总路线图 #202：https://github.com/07xh/engineering-drawing-study/issues/202
> 新分支基线 main 91209123ccc089c0972e744e0dcecebdde24f78f。
> 这是 opt-in 数学预处理；没有改变生产求解器、V5、公开页面、原教材、构建工作流或 Cloudflare 设置。

## 设计与前置依赖

PR #226（近奇异 Jacobi 数值秩诊断）仍为独立 Draft，本 PR 不依赖它的未合并文件。本次独立补充可审核的变量与残差单位及尺度归一化，为未来的稳定秩诊断提供输入基础。正式组合前必须有 00/09 的数学验收。

现有知识库的平方距离约束残差单位是 mm²，固定坐标/点在线残差使用 mm，角度余弦为无量纲；混用固定 EPS=1e-8 不能自然称为统一精度策略。

新增 API：core/numeric/dimensionless-jacobian.cjs 的 normalizeLocalSystem({variables,constraints})。

变量需要显式 id、unit、scale；约束需要显式 id、unit、scale、residual、absoluteTolerance、relativeTolerance、derivatives[]，每个导数声明 value 和物理单位，例如 mm2/mm 或 rad/rad。只核对导数单位标签与残差/变量单位是否一致，不验证导数表达式是否真的正确；也不自动执行 deg ↔ rad、mm ↔ sheet-px 的换算。

## 变换与残差策略

令第 j 个变量参考物理尺度为 s_j，第 i 个方程残差参考物理尺度为 q_i，原 Jacobian 为 J_ij，则：

- 无量纲梯度矩阵：J_dimensionless[i][j] = J_physical[i][j] * s_j / q_i
- 无量纲残差：r_dimensionless[i] = r_physical[i] / q_i
- 逐行允许误差：allowed_i = absoluteTolerance_i + relativeTolerance_i * q_i

正的行/列尺度变换不改变精确代数秩，却会改变数值条件数和阈值效应。适当尺度必须由实际模型的工程单位和局部物理特征决定，而不是全局坐标原点。

实例：平方距离方程 f=|A-B|²-d²，长度尺度取 d、残差尺度取 d²，沿 AB 的 Jacobian 项被规范成约 2；在 d=1e-12～1e12 mm 的合成测试中结果稳定。但过小尺寸、大世界原点、舍入信息丢失时不能凭归一化假定数据精确或可分辨。

## 输出证明边界与失败策略

输出 normalizedJacobian、normalizedResiduals、residualChecks（包括原单位、尺度、归一化值、阈值与超差情况）以及 atProvidedConfiguration。

status 只能是 within-declared-tolerances 或 residual-outside-tolerance：它们仅表示调用者给出的这个采样构型是否满足声明的数值残差精度。超差不能证明整个约束系统无解；满足也不能证明存在全局精确解。

rankEstimate、localDegreesEstimate、solutionCount、globallyUnique 一律为 null；proofOfExistence 和 proofOfGlobalUniqueness 一律 false；normalizationCertified=false。无法表示的量、NaN/Infinity、单位标签不符、下溢、上溢和无效尺度均抛错，不伪造数学证据。

## 真实验证、范围和回退

- 本地 Node 22 测试 20 项通过：平方距离 1e-12～1e12 mm、固定坐标、角度与混合单位、尺度敏感、超差、零梯度、非法范围、精度与输入不变性。
- GitHub 最新 HEAD 的 math、planar-math、point-projection、workbench、validate 需全部完成且 success 后，再提请 09 独立负例审查和 00 共享 core 目录签收。
- 仅新增 core/numeric/dimensionless-jacobian.cjs、tests/math/m0-dimensionless-jacobian.test.cjs 及本文件。未修改原有 EPS、求解状态、学生标准答案和 V5 动画。回退可关闭该 PR，不涉及数据迁移。
- 合并后 Cloudflare Production Active SHA 仍须独立核验，不可把 GitHub CI 或 Cloudflare Preview 成功等同于正式上线。

正式接入步骤：01/09 签收各约束真正的解析导数与单位尺度策略 → 使用独立旁路对照真实几何数据 → 验证 PR #226 数值秩诊断 → 00 审批 → 再独立 PR 切换正式求解器。