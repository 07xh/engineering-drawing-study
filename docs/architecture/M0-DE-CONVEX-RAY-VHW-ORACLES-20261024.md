# M0 批次 D/E｜已校验真实凸体源、射线深度和投影边的独立验收

这是 [M0 正式批量验收计划](./M0-ACCEPTANCE-FAST-TRACK-PLAN-20261024.md) 的第二个同主题验收增量。没有重写数学求解器，也没有新建第二套 Geometry、V5 或线型证明系统。

- **D：来源闭合凸网格的真实消费者链**。以可独立分析的有界六面体建立真实 `Geometry` 网格（8 顶点、12 边、6 面），首先经过公共 `verifiedConvexMeshHalfspaces` 检查真实拓扑，再经现有 M0 精确 dyadic 顶点审计，随后把所证明的外法向半空间传入现有 `convex-ray-depth` 及 `convex-point-ray-clearance`。以解析 slab 射线交点比较入/出深度，覆盖三种尺度、坐标平移、两个遮挡体与顺序置换、破损拓扑、错误单位。严格保持 `sourceRevisionIndependentlyVerified=false` 和 `completeSceneVerified=false`；“列举的两个箱体最近交点”不等于整题遮挡场景已收集齐全。
- **E：V/H/W 投影边真实正反例**。同一公共边对在第一角法 V/H/W 每一视图中以解析观察方向深度符号核对，覆盖三尺度、空间平移、稳定 ID；现有 `projected-edge-depth-events` 的重合但前后无法确定、假平行、端点接触必须维持 `undetermined` 或不发正式线型。不可用两条边的深度序推断整图轮廓。
- 关联测试已写回 [20 模块 API 验收矩阵](./m0-acceptance-inventory.json)，保留既有 `remainingGate` 和证明边界，不以测试文件数量虚报 M0 100%。新源 geometry 的外部来源合法性、完整连线、全图实虚线、ConstructionIntent、单一 V5 与 Cloudflare Active SHA 仍属于下游专项验收。

该批次先保证独立解析几何数值边界，在最新 PR HEAD 以全部五组 Actions 成功 + workbench 四分片汇总成功 + mergeable 后 squash 合并。