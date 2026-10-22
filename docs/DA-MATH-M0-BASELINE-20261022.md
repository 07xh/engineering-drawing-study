# DA-MATH M0｜数学契约与数值边界基线（首批只读交付）

> 2026-10-22 · [M0 #203](https://github.com/07xh/engineering-drawing-study/issues/203) · [总路线图 #202](https://github.com/07xh/engineering-drawing-study/issues/202) · 审计起点 `eff97dfc398edee1210033acce2caedfc51d58f1`。
>
> 本增量只新增回归测试和审计文档，**不修改数学实现、既有数据契约、CI 工作流、Cloudflare、公开构建与私密教材内容**。本文件不代表 DA-GEOM-CONTRACT-v1 已由 00 正式冻结。

## 现有真实实现与不能跨越的边界

| 层 | 已实现 | 当前尚不能声称 |
| --- | --- | --- |
| core/contracts | Problem、Geometry、Constraint、SolveResult、ConstructionStep、UnknownTarget；输入结构与部分语义交叉校验 | 任意新题型自动得到可信结果；字符串版本号等于接口签收 |
| core/adapters | 按 scope 对接旧数学；单点待求结果和旧版 SVG 圆弧显式转换 | 所有新平面候选、数学角度、UI 坐标天然一致 |
| core/projection | 第一角 V/H/W 与 45°联系线；图纸比例与模型分离 | 任意组合体或截交线求解 |
| engines/projection | 单点已知投影、XYZ、冲突和欠约束状态 | 任意点线面投影系统 |
| engines/planar | 有限/无限接触边界、部分线圆与双圆/两线段圆弧、G1/分支 | 通用约束求解、所有有限圆弧组合题型 |
| knowledge/nonlinear-local-dof | 对给定构型计算局部 Jacobian rank | 全局多解/无解证明、任意非线性求解器 |
| workbench | 经求解器门禁的 V5 步骤消费、调速、学生笔迹核验 | 动画的几何视觉一致性等于全域数学正确 |

## 本 PR 的新增独立回归

`tests/math/m0-mathematical-invariants.test.cjs` 将跨层数学不变量纳入一个不修改生产实现的 Node 测试文件：

1. 圆圆两个离散交点可同时满足局部 0 自由度；仍是 `multiple` 而非 `unique`。
2. `SolveResult` 不得用 `globallyUnique:true` 覆盖多解；局部一阶结果不得冒充全局证明。
3. 两个重合点被要求非零距离时，Jacobian 退化且输入构型不满足条件；返回 `undetermined` 和局部诊断，不推断有解/无解。
4. `UnknownTarget` 不允许在已知输入中暗藏坐标。
5. V/H/W 与画纸坐标在多个比例/原点下往返一致；模型数学坐标不依赖像素。
6. 特大坐标下真实 10mm 投影矛盾不能被大比例容差吞掉。
7. 只给单面投影不能虚构另一面或计算辅助线。
8. 有限给定圆弧裁剪后候选 `center-2` ID 保持不变，不能重命名掩盖分支。
9. 仅选中候选圆心/旋向不能自动成为双侧有向 G1 证明。
10. 数学 ccw 弧映射旧 SVG 必须报告方向未保留，而不能默默以同一轨迹证明有向连续。
11. `ConstructionStep` 的依赖不能指向未来步骤。

**运行**：`node --test tests/math/m0-mathematical-invariants.test.cjs`，并运行 `node --test tests/math/*.test.cjs`。

测试只证明上述限定用例的回归，不是精度、性能、解分支完备性或形式化证明。

## M0 第二批待实现（不在本 PR）

1. **数值策略 RFC（01）**：明确模型长度、角度、单位、残差归一化/尺度、绝对+相对容差、退化与难条件数语义。不要直接把所有 `EPS` 替换成一个常数；先给出定量反例和旧解行为差异。
2. **求解器秩稳定性（01+09）**：针对目前 row-reduction 的数值条件检查 QR/SVD 或同等稳健算法的收益；报告 singular/near-singular 与多解/局部 rank 区别。
3. **跨层版本签收（00）**：确认 Arc2D cw/ccw 与旧 SVG 的方向适配、`input-math-unit` 与 `mm` 的差异，以及 `draftai-teaching-plan/0.1` 的消费范围。
4. **必跑核心 CI（09+00）**：当前 `.github/workflows/core-math.yml` 在 `pull_request` 上使用 paths filter，不能不经修复就设为仓库全局 Required Check；设计无需路径过滤的稳定 `core-math` 工作流及失败即阻断的 test gate，经 00 审批后独立 PR 合入。
5. **主分支与生产验收（09+00 #153）**：核实 `main` 分支规则、Cloudflare 实际 Active SHA 和私密资源不可达；本测试 PR 不触发任何部署动作。

## 实施范围与回退

- 新增：`tests/math/m0-mathematical-invariants.test.cjs`、`docs/DA-MATH-M0-BASELINE-20261022.md`。
- 不修改：`core/**`、`engines/**`、`workbench/**`、`.github/workflows/**`、`scripts/build-static.cjs`、`wrangler.jsonc`。
- 回退方法：关闭/撤回本 PR；不会改变已上线数学结果和现有课程。
- 必须等 PR 实际 Checks 与 00/09 审查后，才能判断是否合并；`merged=true` 也不能代替 Cloudflare 生产确认。
