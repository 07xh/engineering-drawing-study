# DraftAI｜二维三维源特征逐线联动（第一批交付）

目标：同一个**已计算 Geometry Scene** 的原始三维线段、mesh 棱、折线分段及曲线，投影到第一角法 V/H/W 并在现有三维视图中显示时，支持点选一条线，在四个视图中对齐高亮同一物理来源。避免把二维重合线误判为同一三维棱。

## 正式接入点

- `project/geometry-scene-consumer.cjs` 为每个图元附加不可变 `sourceFeatureKey`。mesh 取源 `Geometry.id` + **排序后的三维原始顶点 ID 对**；折线取源 ID + 原始分段序号；单线/点/解析曲线取源 ID + 类型。绝不使用像素端点或 2D 重合位置作为来源。
- `project/unified-workbench-entry.cjs` 复用既有三视图和三维 SVG、原有几何选择事件和单一场景，用户点击/键盘选择同源特征后四视图同步高亮；再点同一条回到整对象选择。切项目、修改输入修订、换对象则取消逐线状态。不写入本机已确认题目，也不触发 M3 重算。
- 只高亮**来源身份**；不将 `visibility:'undetermined'` 变为国标实线/虚线，不授予 ConstructionIntent、ConstructionStep、导出或 V5 播放权。3D 模型当前仍是显示线框，不把未证明网格面和遮挡伪装成实体。

## 验收与后续工作

- 新测试证明：长方体 12 条真实源棱各有 V/H/W/3D 四个表示；二维完全重叠的不同三维源棱保持**不同 key**；积聚投影仍可追踪真实来源；修改相机后来源和纸面投影不变；二维对象不虚构 3D 对应。
- 下一批按 #497 的同源模型规则，复用已在项目中的 `three`（仅 3D 拾取/性能显示）与 OpenCascade.js / 原生 OCP-OCCT（真实 CAD 几何、布尔历史及 HLR）；任何新增 CAD 边都必须从真实 TopoDS 历史映射回原始/新生三维 sourceFeatureId，并通过 M4 全区间拓扑与 M5 连续遮挡证明后才能进入唯一 V5。
- 已依赖：three 0.186.1，现有项目已有 OpenCascade.js/OCP 的专门验证消费链，不新装一个平行求解器。后续引入或分发新增二进制时，逐项核验 OCCT LGPL-2.1+exception、第三方许可证、Android 包体和 WASM 内存，不以 UI 选择测试替代真实 B-Rep 认证。
