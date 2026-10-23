# V3.8 02 · 有限源圆弧输入正式接入原有统一数学门禁

Refs #340 #343 #363。现有 `engines/planar/circle-circle-fillet.cjs` 原本已经提供严格的有向有限源圆弧参数验证与接触角度区间过滤，`segment-circle-fillet.cjs` 也可消费同一约束；上层 `finite-fillet-gate.cjs` 以前将圆限制为中心/半径而拒绝 `arc`。本层仅扩展**专业输入契约**，增加 `arc:{startAngle,endAngle,direction:'cw'|'ccw'}`，复用 `normalizeKnownCircle` 校验方向/扫角，保留原始 solver 候选 ID。对双圆含源圆弧输入，要求真正的专业候选同时携带 `sourceArcRangeVerified:true`、`sourceArcChecks.first===true`、`sourceArcChecks.second===true`；不能把假 solver 或完整支持圆上的切点当作有限来源接触证明。

依原专项规则，`status:'unique'` 仅表示**在确定的两源圆、源弧界限、半径与内外切模式下**一个候选圆心通过裁剪；输出 `globallyUnique:null`、`directedG1Verified:false`、`finishedArcVerified:false`，没有认定连接弧的旋向、双侧 G1、手写步骤、图像真实性或 V5 已验证。原数值算法、统一 SolveResult、共享 M0/M1/M2、播放器与生产页面均未修改；不是另一个圆弧求解器。

真实正反例：完整双圆→两候选；第一圆上半圆→仅中心分支 center-2；互补下半圆→center-1；真实专业求解器逐分支 ID 对照；有限线段+有限源圆弧复用 02 既有路径；零扫角、完整 360° 模糊圆弧、非法方向、NaN/陌生字段拒绝；注入假 `sourceArcRangeVerified` 缺失的 solver 拒绝。全部用真实旧算法，不静态伪造答案。

数学高风险：`engines/constraints-2d/finite-fillet-gate.cjs` 是 02 正式输入门禁，必须 exact HEAD 五项 CI、旧/新几何对照、00/09 独立数学审核后才可合并。后续 #363 的 opt-in M2 圆心校验 consumer 需独立兼容测试才能宣布支持有限源圆弧；目前该 consumer 自身仍明确拒绝，无条件不要扩展其保证。回滚 revert 本 PR 的门禁改动、新测试和文档；不修改原求解器。