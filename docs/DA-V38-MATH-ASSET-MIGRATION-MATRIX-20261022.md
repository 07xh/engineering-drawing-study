# DraftAI V3.8｜00 数学资产实查、重复实现与渐进迁移矩阵

> Issue #340 / #341。只读代码基准：`main@7c33684d86688426d51a248a9e241ff8e4a13442`（2026-10-22）。本文件登记**已在 main 的代码**、正在评审的 Draft 和尚未实现的目标，禁止混算“完成率”。这是实施清单与证据索引，不是 M0/M1/M2 已签收的宣告。

## 0. 总体原则与实施门禁

- **只统一公共机制与结果语义，保留有数学价值且测试通过的专业求解器**。没有数学错误证据不得批量重写或删除 `engines/planar/**`、`engines/spatial/sections/**`。
- 由 01 持有共享 `core/**`；02/03/04/05/06 分别保有专业算法；07 只接经过验证的步骤；08 只输出可追溯候选并交给人审核；09 做独立反例和 CI；00 负责文件锁、接口签收与集成顺序。
- **公共算法归属唯一**；专用解析公式、有限实体拓扑、曲面参数化必须留在所属专项。重复的局部向量/投影函数先对照数学行为，再替换调用，不将 `Object.{x,y,z}`、定长数组、sheet-px、模型 mm 悄然混同。
- 所有迁移都保留旧实现作为 *oracle/baseline*；需对称测试两路径的正常、无解、多解、退化、跨尺度、翻转/平移、分支标识、来源、动画结果。验收前不删除旧实现或切换生产调用。
- 基础契约接口升级由 00/01/09 审核；数值诊断即使 CI 绿也不可被宣传为全局证明。发布规则 #152 高风险 `core/**` / 数学算法保持独立评审。

## 1. 经源码核对的资产—复用/迁移/归档矩阵

| 范畴 | 已在 main 的实现 | 真实作用 / 边界 | 迁移决策 | 专项 |
|---|---|---|---|---|
| 五契约与 UnknownTarget | `core/contracts/{problem,geometry,constraint,solve-result,construction-step,unknown-target}.js` | 带验证的输入输出结构；不是泛化求解 | **保留**，版本协商与签收 | 01/00 |
| 旧引擎桥接 | `core/adapters/legacy-{constraints,solvers,problem}.js` | 对接 legacy scope，旧引擎维持原状 | **保留临时桥**，直至新旧对照完成 | 01 |
| V/H/W/45° | `core/projection/conventions.js` | model 投影与图纸屏幕变换分离 | **指定单一共享来源**，先保证符号方向不变 | 01/03 |
| 残差诊断 | `core/numeric/residual-evidence.cjs` | opt-in 局部特征尺度、浮点分辨率启发 | **复用**，不冒充已经覆盖生产求解器 | 01/09 |
| 无量纲 Jacobian | `core/numeric/dimensionless-jacobian.cjs` | 仅将调用者导数、残差按明确量纲归一化 | **复用**，避免第二套量纲缩放 | 01/09 |
| 数值秩 | `core/numeric/jacobian-rank-evidence.cjs` | opt-in 单边 Jacobi 数值证据 | **先修正 #231**，禁止错误 rank 推断全局唯一 | 01/09 |
| 二维点交会 | `knowledge/planar-intersections.js` | 线线、线圆、圆圆相交 | **保留旧实现**，以后挂到 M2 专项调度 | 02 |
| 线性/局部自由度 | `labs/constraint-engine.js`，`knowledge/{multi-point-constraints,planar-point-constraints,nonlinear-local-dof}.js` | 线性分析、给定构型局部 Jacobian；并非统一非线性求解器 | **统一状态接口**，保留现有算法作数值对照 | 01/02/09 |
| 二维圆弧算法 | `engines/planar/{offset-tangency,two-line-fillet,two-segment-fillet,segment-circle-fillet,circle-circle-fillet}.cjs` | 有限接触、解析候选、分支；不支持任意图 | **保留复用**，逐一接入公共谓词/容差 | 02 |
| 有向 G1 | `engines/planar/directed-*.cjs` | 消费圆弧求解结果，确认进入与离开方向 | **保留**，不得因存在切点就跳过 G1 | 02 |
| 二维求解门禁 | `engines/constraints-2d/finite-fillet-gate.cjs` | 审核毫米输入，调用旧 02 求解器 | **保留**，与 M2 共存对照 | 01/02 |
| 点的空间投影 | `engines/projection/point-projection.cjs` | 有限已知条件下点的投影 | **保留**，迁移时消费共享 V/H/W | 03 |
| 圆柱截交 | `engines/spatial/sections/axis-cylinder-plane.cjs` 等 | Z 轴有限圆柱与平面；特征截线、端盖裁剪另有实现 | **保留解析求解**，迁移向量与投影基础 | 04 |
| 长方棱柱截交 | `engines/spatial/sections/rectangular-prism-plane.cjs` | 轴对齐有限长方体 12 棱与截平面 | **保留**，封装公共向量/投影后做新旧对照 | 04 |
| 矩形棱锥截交 | `engines/spatial/sections/rectangular-pyramid-plane.cjs` | 有限矩形底棱锥 8 棱、源面与多边形证明 | **保留**，不因要支持圆锥而重写 | 04 |
| 截交可见性 | `engines/spatial/sections/{cylinder-cut-ray-visibility,rectangular-prism-cut-visibility}.cjs` | 明确几何与观察者范围的光线证明 | **保留专用机制**，共享基础运算但不混淆可见性范围 | 04/06 |
| 截交 V5 场景 | `engines/spatial/sections/*v5*.cjs` | 已验算截面到原生 V5 的特定适配 | **保留**，未来按 ConstructionStep 公共 API 渐迁 | 04/07 |
| 旧图学实验 | `labs/{composite-geometry-core,free-geometry-core,dof-lab-geometry,paper-geometry-core}.js` | 教学/演示/编辑独立资产，不是生产 M2 通用求解 | **保留隔离**，只抽取经证明通用的计算 | 00/09 |
| 识图源校准 | `labs/manual-raster-*.cjs`，`recognition/*.cjs` | 候选、图片比例、人审证据，不是 mm 的隐式真值 | **保留人审边界**，仅对接已签收 M0 | 08 |
| 动画与证据 | `workbench/teaching-*-v5.js`，`core/contracts/construction-step.js` | 真实步骤/时间轴与几何动作并非同一种证明 | **保留 V5**，统一验证结果到步骤 DAG | 07 |
| 回归 | `tests/{math,planar,projection,workbench}/**` | 现有数学及页面多层用例 | **保留扩充**，新增对照不删除历史反例 | 09 |

## 2. 实际重复：不能当成已经迁移

1. `axis-cylinder-plane.cjs` 含 `minus/dot/length`；`rectangular-prism-plane.cjs` 含 `sub/plus/times/dot/cross/length`；`rectangular-pyramid-plane.cjs` 含 `add/sub/mul/dot/cross/size`。**共享向量算术是重复机制**，三类实体的面/曲线解析则是合理的不同专业算法。先合并 #351，并明确对象到向量转换后再迁移，不能直接替换数值路径。
2. 以上三份空间求解器各自生成 `V/H/W`，而 `core/projection/conventions.js` 已提供 `project`。**投影公式重复**；本 PR 先锁定等价性回归，不直接重写空间求解器。
3. 不同模块存在固定 `EPS=1e-9`、`1e-8` 以及按有限实体尺度的容差；只用一个全局 EPS 替换会错误吞掉微小/大坐标矛盾。共享 `residual-evidence` 目前仍是 opt-in，必须按每个输入的物理特征尺度单独验证。
4. `knowledge/nonlinear-local-dof.js` 与 `core/numeric/jacobian-rank-evidence.cjs` 都涉及 Jacobian，但前者是给定构型的局部约束分析，后者是独立数值秩诊断；**不是可以直接删除其中一个的“完整重复求解器”**。
5. 专项 `status:'ready'` 与 `core/contracts/solve-result.js` 的 `unique/multiple/continuous/coincident/none/unsupported/undetermined` 是不同层语义。**不得把 section ready 自动改成 unique**。即便截交几何已验算，也不自动证明视图线型、裁剪内域、全局唯一或 V5 全流程。
6. `docs/unified-problem-contract.md` 属于旧教材导入协议；`core/contracts/problem.js` 才是当前形式契约候选。旧课程协议可保留历史，但不得作为新个人解题产品的核心真值。

## 3. 并发 PR 不重复造轮子

| PR | 范围 | 状态与处置 |
|---|---|---|
| #231 | Jacobian 稀疏输入/下溢加固 | Draft，不得忽略；需 01+09 高风险核验 |
| #351 | `core/numeric/euclidean-kernel.cjs`、`affine-transform.cjs` | Draft，Vec2/Vec3、矩阵应以此为复用候选；不要重新实现相同功能 |
| #353 | `orientation2d-exact.cjs` | Draft，精确计算对象仅限输入 binary64 数，不等于 OCR 原始数据精确性 |
| #354 | `reviewed-pixel-frame.cjs` | Draft，像素转 mm 是人工审核的来源边界，不等于透视校正证明 |
| #337 | `section-result-adapter.cjs` | Draft，最多是兼容层，不得当作 M1/M2 已完成 |

上述均需刷新最新 HEAD / CI / 审核后单独签收；**本 PR 不触碰这些文件**。

## 4. 接口冻结候选（非正式冻结）

- 输入必须显式携带来源、校验修订、坐标帧（`model-3d`/`drawing-2d`/`sheet-px`）、单位（长度 mm，角度 rad 或 deg，不默转）、几何参数和约束引用。
- 公共数值层不猜全局唯一。M2 对外统一以 `SolveResult` 返回**明确的解状态、候选分支、证明范围、残差、容差、未证明项目及来源**。
- `unique` 只在明确的求解范围中得到证明；局部秩满、局部 DOF=0、曲线存在、或 `verified:true` 均不足以替代。返回 `undetermined` 要能够阻断发布“标准答案”。
- 截交的 `ready` 表示专项几何求交结果满足对应证明，**不是统一 SolveResult 的解数标志**；正式映射必须由 M2 数学和 09 反例审计确定。
- 07 只从签收的数学结果与可追溯实体构造 ConstructionStep，不允许将旧动画画面当求解依据。

## 5. 本层验收与后续逐阶段门禁

**A0 本层（文档+安全对照测试）**：新增 `tests/math/v38-legacy-spatial-projection-parity.test.cjs`，用真实圆柱、棱柱、棱锥截交结果对照共享 `project`，核验失败闭锁、视图与画纸隔离；不修改任何生产求解器。运行 `node --test tests/math/*.test.cjs` 及现有五组 Actions，在 exact PR HEAD 通过后可作为低风险回归基线合并；不能仅凭这些测试宣布 M0 冻结。

**A1 基础冻结（01/00/09）**：先审 #231、#351、#353、#354，补充单位、形状和浮点反例；从这里冻结共享 Vec/Transform/Frame/Residual/Predicate 合同，才允许生产调用。

**B M1/M2（01/09）**：构造共享 ConstraintGraph 和多分支/自由度/失败闭锁的 SolveResult；对不一致条件、连续族、退化输入、局部 rank 满但离散多解均保留独立证据。未经证明不得发布 globallyUnique。

**C 专项按小 PR 迁移（02/03/04/05/06）**：先二维 R0；再 04 现有圆柱→长方棱柱→矩形棱锥；再圆锥/球体/相贯。每个旧算法通过老/新逐案等价测试后才切换；与真实 07 V5/08 识图交付分开记录。

**D/E 端到端（07/08/09）**：已确认 ProblemDraft→已签收求解→真实 ConstructionStep DAG→V5，进一步通过陌生题、错误尺寸、移动端和 Active SHA 检查，不能用合并 PR 冒充上线。

## 6. 风险、回退和验收事实

- 本层文件只有审计 Markdown 和跨层**测试**；不更新 `core/**`、求解器、动画、发布、密钥或私人图片。回退直接 revert 文档+测试。
- 主分支现有数学合约和专项测试继续保留。此清单只代表 **已观察到** 的重复点，并非全仓 AST 语义等价的完整自动证明。
- 需要 00/09 对迁移矩阵和冻结候选审核；未有签收之前不得将 #341 标为完整数学冻结，更不能把 M0–M2 或任意二维题自动解题标为完成。
