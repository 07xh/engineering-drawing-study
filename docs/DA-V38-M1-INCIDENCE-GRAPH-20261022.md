# DraftAI V3.8 M1｜统一约束关联图首批（结构而非自由度证明）

关联 Issue #340 / #341 / #343。基准 main `b9a429a2b34dc10da72eb99d6b4d8edc21fb10e6`。本模块是针对分散约束存储的**真实图算法基础层**，不是另一套平面/空间求解器，更不替换原有圆弧、点投影、截交内核。

## 复用而不是重写

- 使用已有 `core/contracts/geometry.js::validateGeometry`、`core/contracts/constraint.js::validateConstraint`，不创建第二套几何/约束 schema。
- `buildConstraintIncidence({geometry,constraints})` 验证密集数组、唯一 ID、合法约束和目标引用，强制约束目标为所在空间内显式单位为 mm 的点，阻断跨 2D/3D、unitless/隐式 mm 混用。
- 算法构造真正的 geometry–constraint 二部图，通过 BFS 计算连通分量；按 ID 排序产生不依赖输入数组顺序的分组。孤立点单独返回；重复代数条件不会被误判为两个独立限制。
- 返回只读 `status:'structural-only'` 及各分量 ID；`numericRank`、`localDegrees`、`globallyUnique` 全为 null；`proofOfExistence/proofOfUniqueness` 为 false。**图连通性永不等同代数秩/实际自由度/真实有解/全局唯一。**
- **当前版本仅接受 `kind:'point'`**：线圆、曲面、网格等其他类型一律拒绝，避免把尚未建模的拓扑误当作已验证的约束图；后续需明确多类型目标契约和 00/09 证明签收，再逐步扩展。
- 输入不存储图片/来源媒体、密钥和标准答案，不改现有求解器/V5/生产路径；限定 2048 几何、4096 约束和 16384 关联边，**在遍历稀疏数组前先执行数量上限检查**，避免无界处理。

## 真实可执行测试

`node --test tests/math/m1-constraint-incidence.test.cjs`：
1. 两点通过条件连通、第三点孤立，分组顺序稳定且不修改输入；
2. 同一坐标约束重复两次，不凭数量宣布 rank=2 或唯一解；
3. 已验证 3D 点约束；
4. 未知目标、跨空间、缺 mm、坏类型、重复 ID 阻断；
5. 稀疏和超界数组阻断。

并运行原有全套 `tests/math/*.test.cjs` 与 5 个 GitHub Actions exact HEAD。该结构接口是 **M1 的必要但不充分条件**；M2 求解/分支/残差证据仍按 #343 未完成。

## 迁移、安全和回退

先让 01/09 比较现有 `knowledge/multi-point-constraints.js`、`labs/constraint-engine.js`、`core/adapters/legacy-solvers.js` 的输入引用和数值状态，逐个消费者签收。由于 `core/**` 受 #152 高风险审查保护，合并前必须以真实反例和 CI 证据明确签收。未接入正式应用、Cloudflare 未验证，任何失败都可单独 revert 本 PR。