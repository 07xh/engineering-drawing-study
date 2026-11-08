# P2.2c — Cone Lab 双圆柱 → 原 C3 人工审核输入（2026-11-08）

基线：`main@78ddff0ca130e58c9076f087e49bc2189d6bc60a`（#1078 已 squash 合并）。本分支**不修改生产发布工作流**，独立开发，仍须合并与 Cloudflare Active SHA 两道发布验收。

## 本次最小闭环

- 从 Cone Lab `draftflow.conelab.model.v1` JSON 中只接受 `lab` 模式、无截切、无相贯体、无选择分块、恰好两根已启用有限圆柱。
- 当前匹配唯一正确的正交部件轴向组合：`horiz`（Cone Lab +Y → 绘序 +Z）与 `frontal`（Cone Lab +Z → 绘序 −Y）；两者 `ang=0`。其他方向，包括接近 90° 的斜向，不默认为正交。顺序可颠倒，按部件轴向匹配。
- 仅复用现有 `sourceRevolvedSolid` 和 `makeReviewedC3Input` 校验数值。以 `(x,y,z)=(X,-Z,Y)` 计算 `zRadius/zX/zY/zMin/zMax/yRadius/yX/yZ/yMin/yMax` 共十项。
- `project/cone-lab-c3-review-candidate.cjs` 不返回 `sourceConfirmed`、求解结果或 ConstructionIntent，而返回 `requires-human-review` 候选字段、明确未确认轴向/端盖与无 V5 权限。
- 现有工作台 C3 字段直接从文件填充，**先整体校验后才替换表单**；主动清除旧 `coords` 条件、播放与人工确认状态。用户仍需按原流程「保存条件 → 核对并确认 → 开始求解」，由**原有** `project/unified-workbench-session.cjs` 调用同一个 C3 解析 M3/V5。
- 不能把 Cone Lab 原本显示的 marching-squares/管线采样相贯线当成解析来源。独立实验室的切割/相贯体、曲面球与第三部件均明确拒绝，不做部分导入。
- 用户最终确认也仅授予原有 C3 **受限解析几何来源**，不是完整端点拓扑、整段连续遮挡、国标线型、任意教材答案或正式 V5 资格。

## 验收

- 双圆柱顺序无关；不同位置、半径和有限端盖到绘序的精确映射。
- 含第三体、任意斜向、缺少端盖、隐藏部件、截切/相贯体、分块状态立即拒绝，不改已存在项目/表单。
- UI 导入后旧条件、旧播放、轴向/端盖复选框和实体组合方式全部失效；无自动求解。
- 五类 CI 全绿之后仅标记可合并；**已合并主线 ≠ Cloudflare 生产已发布**。浏览器及 Android 实机验收另做。

后续：将来源模型双圆柱的真实解析相贯区间与已存在的 `engines/spatial/intersections/finite-orthogonal-cylinders.cjs`、C3 M0/M3/M5 严格审计对接；不会复制第二个求解器或自行签发虚实线。
