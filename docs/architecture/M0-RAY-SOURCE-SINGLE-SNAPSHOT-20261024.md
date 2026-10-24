# M0 真实凸体射线消费者：可信有限数据单次快照修复

在当前 20 模块 M0 数值库中，射线深度和点射线清空原来用 `point()`/ `xyz()` 检查一次调用者-owned `x,y,z`，然后再次读取相同输入计算 `norm`、`n·p` 与射线深度。浮动 getter 可以让**验证时有限、使用时 Infinity/改符号**，进而误签局部 `hit`/`certified-clear`，不满足当前 #372 数学证据数据一致性门禁。

本批仅在现有 `convex-ray-depth.cjs` 与 `convex-point-ray-clearance.cjs` 做一次有限 x/y/z 读取、支持面 ID/法向/偏移快照，确保验证、normalization、ray/plane slope 和深度签收始终使用同一份数据。相同的调用者对象 getter 不得在校验后改变证据；稀疏面数组和初始非有限输入 fail-closed。其余通用数学算法、既有容差策略和接口、近切/近平行 `undetermined`、完整场景/官方线型/V5 负旗标完全保持。

新回归包括来源端点/方向、法向/offset、面集 getter、实体 ID、坏的初读、稀疏面阵列、重复 ID 以及真实长方体解析入/出深度 5/15 mm 与 +Z 外向支撑。两个模块的新测试登记至 `m0-acceptance-inventory.json`，仍不取消原来的来源/场景 remainingGate。

只签署**当前输入的局部凸体数学结果**，不替代已认证几何/照片/修订证明，不表示整个 M5 场景已经枚举，也不授权标准线型与 ConstructionIntent→DAG→唯一 V5。按 #152 最终 PR HEAD 五组 CI 全绿且 mergeable 后合并；本修复可以通过单个 squash revert 回退。