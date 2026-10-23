# DraftAI ConstructionIntent 1.0.0 候选冻结契约｜00/01/02/07/09 联合签收

> 状态：**已提交可执行契约，等待 00/09 独立评审后才能称为正式冻结**。唯一权威架构 [#372](https://github.com/07xh/engineering-drawing-study/issues/372)；不改 M0–M5 划分，也不引入第二个 SolveResult 或 V5 播放器。对应迁移任务 #341、#348、#377。

## 1. 单一语义数据接口

`core/contracts/construction-intent.js` 导出版本 `draftai-construction-intent/1.0.0` 与 `validateConstructionIntent`、`validateConstructionIntentDAG`。

每一条 Intent 都保有以下**显式**信息：

- `id`、`purpose`（作图目的）、`role`（given/auxiliary/result）；
- `dependsOn`（前置**作图步骤 ID**）、`inputEntityIds`（有证据的**几何实体 ID**；未知保留空数组，不得捏造；本版只能引用前序 Intent 已输出的图元，外部 ProblemDraft 图元绑定尚未冻结）、`outputEntityIds`（必须与 operations 的真实 ID 严格一致）；
- `operations` 是具体语义原语：`line`、`point`、`circle`、`directed-arc`，记录明确坐标与必要尺寸；本版二维坐标只允许 `x/y`，不得附带 `z` 冒充空间作图；步骤 ID 与几何输出 ID 不得相互冒用；不从最终 SVG 坐标反推作图语义；
- `source` 包含真实专业求解器名称、来源 revision、模型单位 mm、proofScope/proofLevel、可为空但**不可伪造**的 resultId、明确选择的 branchId、证据来源与 verified 结果的状态类别。多解场景必须有实际分支选择；只有来自真正证明过的唯一解可声明 unique。

`directed-arc` **必须**是 model-mm 的有向圆弧，度数用模型空间 y 向上约定，`cw` 角差负、`ccw` 角差正，开区间限制在 0–360°；旧的 SVG 顺向/角度拼接不许冒充数学圆弧。

第一角投影已求出的纸面辅助联系线允许 `sheet-px` 的 `line`/ `point`，但不能混标成 model-mm 几何；既有 07 `verifiedTeachingActionToV5` 仍是唯一 sheet 转换消费方。未来空间视图/截交曲线必须通过另行评审的扩展契约，不能把 3D 三元坐标硬塞给 2D 点。

## 2. 证明边界

结构校验**不能**自行证明任意客户端提交的 `source` 为真。可信步骤只能由 02–06 专业求解器内部重新计算，经 M2/领域残差、分支、有限性、有向切触等门禁通过后产生。07 只消费意图并编译现有 ConstructionStep / V5，不把 V5 已绘结果反向标记为可信证明。09 负责独立反例。

从 0 开始的 `revision` 必须源于当前已确认问题；条件修改、分支切换、步骤播放恢复需要一致性验证。跨 revision/proofScope/branch 的 Intent 不得混在一个 DAG；缺少前置步骤、重名图元和绕过证明的动作必须拒绝。

## 3. 首批兼容与扩展清单

| 专项 | 算法与已有资产 | 意图坐标 / 证明范围 | 迁移策略 |
| --- | --- | --- | --- |
| 02 | 有限线段–线段、线段–圆、两圆有向 G1 | model-mm 有向 arc；已选 branch 和双端 G1 | 复用 R1 真实求解器、#388 的 arc 校验及 #391 的旧新 V5 等价 oracle |
| 03 | 三维点在 V/H/W 第一角投影 | 已证明三维点，纸面辅助 guide 为 sheet-px | 由 `adaptPointProjection` 真实解生成 Intent；复用唯一 V5 并逐步转移 |
| 04 | 圆柱/棱柱/棱锥斜截 | 不应冒充 model-mm-2d 的 3D 曲线 | 待单独增加空间语义原语与可见性证明 |
| 05 | 相贯线 | 求交分支和可见性证据必需 | 待专业算法签收后集成 |
| 06 | 组合体三视图/补漏线 | 可能多解、线型可见性 | 先多解释验证，不声明全球唯一 |

## 4. 发布前联合签收门槛

- [ ] 01：语义 schema、实体拓扑/输入输出 ID、单一版本和 M2 不反向依赖 M3
- [ ] 02：三个真实 G1 题型、分支/接触点/残差、近退化与比例不变性
- [ ] 03：点投影唯一性、V/H/W 与 45° 辅助线、纸面坐标明确来源
- [ ] 07：真实 Intent→Step DAG→唯一 V5、模型/纸面帧、调速/回退与 revision 拒绝
- [ ] 09：跨尺度、退化、重复实体、虚假 resultId/branch、方向冲突、未确认题图盲测
- [ ] 00：明确合并决策与回退方式，当前 HEAD 全部适用 CI 成功

**未经上述审查：不得把新增的 1.0.0 合并为正式冻结、不得替换生产求解器路径。** 原有 #391 受验证的意图原型保持正常工作，供旧新等价审查。网站 build 成功也不能取代 Cloudflare Production Active SHA 核验。

### DAG 前置实体约束（冻结候选勘误）
`inputEntityIds` 只有在其几何生产步骤位于当前步骤显式 `dependsOn` 的直接或传递祖先中才有效；即使该图元恰好在数组中较早出现，也不能借由拓扑顺序绕过作图依赖。独立分支并行步骤不允许偷偷相互消费实体。上述约束属于结构完整性检查，仍不得替代数学领域求解器的独立证明。

### 09 来源字段顺序与极端数值回归
等值 `source` 元信息采用确定的排序字段比较，不因 JSON 属性插入顺序差异错误判定为不同 revision/proof/branch；元信息实际变化仍拒绝。新回归覆盖靠近正负 360° 的有向弧边界、超大角度减法/舍入、极短线段阈值与大坐标精度塌缩。结构合同不证明极小圆半径、高条件数构造或跨尺度数学唯一性，仍以领域求解器及 09 证明证据为准。
