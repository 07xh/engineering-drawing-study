# DraftAI M0｜正式验收加速执行计划（2026-10-24）

> **状态：执行计划，不是已完成宣告。** 目的：将已有 M0 20 个公共数值模块逐项变成「真实消费者 + 独立数学反例 + 可审计证据 + 可回退合并」的正式基础能力。不要以增加 PR 或测试文件数量充当完成进度。
>
> **权威不变**：[数学分层 Issue #372](https://github.com/07xh/engineering-drawing-study/issues/372)；[唯一合并/发布规则 Issue #152](https://github.com/07xh/engineering-drawing-study/issues/152)；用户近期产品交付排期由 [#377](https://github.com/07xh/engineering-drawing-study/issues/377) 约束。本计划只优化 M0 研发执行效率，不能覆盖三者，也不授予 M3–M5 完整题型/动画签收资格。

## 1. 已经落地且可以复核的加速措施

- **[PR #654](https://github.com/07xh/engineering-drawing-study/pull/654)** 已合并（SHA：**32b4d8f8a311f74756ead90cdf162d0b7c7510cc**）：工作台整套测试通过四个并行分片运行，保留原名为 **workbench** 的必需汇总门禁；任一分片失败、取消或跳过，汇总必须失败。数学、平面数学、投影、整站 Validate 等其他工作流仍完整运行。
- 真实 CI 实测：串行 workbench 两次运行 **88 秒**；四分片运行 **35 秒**；在该次观测中缩短约 **60%**。仅代表已观察样本，不对未来耗时或缩短比例作保证。保持 [Actions 运行记录 40105772448](https://github.com/07xh/engineering-drawing-study/actions/runs/40105772448) 可复核。
- **[PR #649](https://github.com/07xh/engineering-drawing-study/pull/649)** 已合并：**docs/architecture/m0-acceptance-inventory.json** 枚举全部 20 个现有 M0 数值模块，登记每项证明范围、测试和剩余门禁；**scripts/audit-m0-acceptance.cjs** 输出静态直接/传递调用关系。
- **[PR #651](https://github.com/07xh/engineering-drawing-study/pull/651)** 已合并：真实 M2 数值约束消费者运行结果与独立解析等式类/DSU 求解器对照，三种尺度、冗余、矛盾、自由度与原点精度退化均有测试。静态 import 并不等于数学或实际运行时签收。

## 2. 用「同主题批次」替代「单个负例一个 PR」

从最新 main 为每个**独立、可回滚、单一责任范围的公共数学契约/实际消费链**创建一个 PR。合理合并该主题 **3–5 个直接相关的修复、边界反例、独立 oracle 和消费者签收**，不为每道题、每个测试或每条微小输入异常开重复 PR。

禁止为凑批量大小混合不相关代码：涉及不同权限/安全/来源、M0 与 M4/M5 跨层线型/唯一 V5、必须分别回退的高风险接口破坏，继续拆分独立 PR。多个无重叠文件或合同的工作批次可以并行准备；主线更新后检查冲突及数学等价，不覆盖别人已合并的代码。

### 一次批次的固定流程

1. **读实时 main**：核对唯一契约、20 模块验收矩阵、真实 consumer 文件/代码来源和本批源码 diff；列出风险、回滚方式与不支持边界。
2. **一次性修改同主题能力**：对真实消费者补数学条件、错误退化时 fail-closed、正反例、源版本关联；优先沿已有 Euclidean、adaptive 2D/3D、Jacobian、投影与凸体射线统一内核改进，不造新数学引擎。
3. **提交 PR 前定向预检**：变更代码与测试分别做 JavaScript 语法检查；执行新增及紧邻影响的 Node math/planar/projection/consumer 专项回归；复用已有独立解析、BigInt 或变形 oracle；重新生成 M0 API 静态消费者清单；检查私有教材原图/密钥不会入库。这是减少简单失败的前置环节，**不能取代 CI**。
4. **一次完整 GitHub 门禁**：在最终 PR HEAD 上确认 5 条工作流 **DA-ARCH-001 core mathematics、DraftAI planar mathematics、DraftAI point projection checks、DraftAI workbench checks、Validate study site** 全为 completed/success；工作台必需汇总同时核查四个分片全成功。确认 GitHub **mergeable=true**。
5. **自动合并、不等额外人审**：通过后依 #152 直接 squash merge；真实故障修复后必须以**新的最终 HEAD**重跑。记录实际 merge SHA、失败反例及支持范围；Cloudflare Production Active、Android 实机、完整数学/动画并非自动得到认证。
6. **批次结束更新矩阵**：记录每项 API 从“静态引用”提升为“真实输入执行”的证据，且必须有对应 oracle 与失败案例。每两批统一更新 #372 进度，避免持续产生重复长评论。

> 定向预检参考：node --check 受影响 .cjs、node --test 受影响 *.test.cjs、node scripts/audit-m0-acceptance.cjs。命令中的具体文件来自实际 diff，不用硬编码忽略其他测试。

## 3. M0 验收批次路线（先复用现有模块，不重新建设）

| 批次 | 模块/消费链 | 要补的真实验收证据 | 通过后的状态边界 |
| --- | --- | --- | --- |
| **A：坐标、单位、输入完整性** | affine-transform / euclidean-kernel / object-vector3 / reviewed-pixel-frame | 各种尺度与精度、矩阵和坐标单次快照、像素与 mm 分离、V/H/W 中真实 M3 复用、错单位/失效修订 | 认证**已确认输入**的坐标契约；图像来源真实性仍需 08 |
| **B：二维/三维稳健谓词** | orientation2d-exact / orientation2d-adaptive / determinant3d-adaptive / binary64-dyadic | 正反符号与零判定、2^52 抵消、下溢、近共线/共面、不同尺度变形 oracle、实际 M1/M3 消费 | 仅对**输入 binary64** 精确，不认证原始无限精度实体 |
| **C：M2 数值求解证据** | dimensionless-jacobian / jacobian-rank-evidence / residual-evidence | 真实 M2/M3 调用、解析 DSU/已知几何对照、重复/矛盾/欠约束、导数来源、局部与全局结论分离 | 局部秩/残差不能凭收敛推出全局存在性或唯一性 |
| **D：凸体、射线与可见性数值** | trivial-recession-cone / exact-convex-vertex-set / convex-open-ray / convex-ray-depth / convex-point-ray-clearance / convex-polytope-boundary-ray / convex-segment-clearance / convex-segment-occlusion | 6 面体与棱锥等真实消费、端点/近平行/相切、体存在性与极点完备区别、层级深度、错误来源时 undetermined；跨尺度独立数学反例 | 只签**提供的合法凸体/局部射线**，不签整个空间场景遮挡和最终实虚线 |
| **E：投影边与最终收口** | projected-edge-depth-events，以及 A–D 与真实 03/04/05/06 的必要引用链 | V/H/W 第一角关联、真实 3D 来源坐标和稳定 ID、假共线反例、跨模块一致性、完整覆盖矩阵与可回退验收 | 对 M0 公共数值契约**有限适用范围内冻结**；轮廓/DAG/V5 属于 M4/M5 |

以上五个是**验收主题，不是必须新增五套实现、五个引擎或者严格每主题仅一个 PR**。如果某项已在主线有完整独立证据，直接标记已有证据并复测，**不重复开发**。若发现真实数学错误，优先修复该共性公共 API，再验收所有真实消费者。允许按风险合并相邻批次，不允许合并不相关的产品/生产改动来求快。

## 4. 明确完成定义：不再用主观 85% 当验收结果

正式 M0 冻结需要每个现有数值 API 在 [验收矩阵](./m0-acceptance-inventory.json) 有如下可核验的结论：

- **输入和输出契约**：坐标维数、单位/尺度、有限范围、来源/修订，返回的状态和认证范围明确。
- **独立数学反例**：至少包括正常几何、退化/近平行或近奇异、极端尺度、错误输入、必要时变形/独立解析或 BigInt 谓词对照。不同 API 可采用适用的其他独立验证方式。
- **消费者实际执行**：证明至少一条受支持的真实 M1/M2/M3 路径**跑到**该 API 并保留正确数学结论及 fail-closed 情形；纯内核专用函数可以由已签收的直接消费者间接执行，不强制制造假入口。
- **不支持范围和回退**：无法精确认证的有理极点、未经确认来源、缺少全部遮挡物或全场景信息等保持 undetermined/unsupported；依 #152 可单次回滚变更。
- **最新主线证据**：PR 最终 HEAD 五组完整 CI 成功、mergeable、实际合并 SHA，必要的消费者回归和兼容性清单。

若部分 API 只有有限的、被明确测试的数学适用范围，也可按**限域 M0 契约**签收；对明确不支持的数学模型不能承诺一般性。整张图的端点连接、遮挡、ConstructionIntent→ConstructionStep DAG→唯一 V5、真实原题盲测与 Cloudflare Active 均由下游各自验收，**不是 M0 完成的虚假前置条件**。

## 5. 工作量/效率的追踪方式

每完成一个主题 PR 记录：最新 base/main/PR HEAD 与 merge SHA；受影响 API 数；实际运行过的真实消费者数；新增独立正向/负向 oracle 数；被解除的具体 remainingGate；CI 五项结果；workbench 四分片耗时和总运行时；新增/已知失败及回退范围。每两批做一次聚合而不是多次报同一个“85%”。

**优化目标**：在不减少独立数学反例和五组完整 CI 的前提下，减少同主题 PR 数与重复等待；以合并后的**验收门禁解除量**和真实消费能力，而不是 PR 数/测试数，作为有效进度指标。历史单次 88→35 秒的工作台提速可作为观察基线，不规定不可靠的完工日期。

## 6. 执行边界与旧 PR

- 不为任何单一教材题开发专用数学核、硬编码答案或第二套 V5。
- M0 代码审计发现的跨层轮廓、遮挡、端点与正式工程线型证明由 M4/M5 专项另行承担；[#570](https://github.com/07xh/engineering-drawing-study/pull/570) 仍需去除已被当前 M0 公共内核取代的重复代码，不能用 caller 布尔认证代替来源与全图正向数学证明。
- #377 当前课程功能交付优先级不因本计划改变；可把 M0 验收能力同时用于解锁真实题图数学→唯一 V5 的消费路径。
- 本计划不授权后台持续执行，也不替代任何实际提交、CI 或部署结果；后续仅对本次明确执行到的工作报告成功。

**下一批实际动作**：以 [M0 验收矩阵](./m0-acceptance-inventory.json) 为输入，先完成批次 A/B 中尚无真实独立消费者运行证据的公共 API 合并验收，再推进批次 C（真实 M2）与 D/E（有限射线/投影）；每一个已存在的证据都先复用，不重复造功能。
