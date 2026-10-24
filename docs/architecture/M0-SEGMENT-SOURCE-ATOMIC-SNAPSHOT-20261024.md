# M0 批量修复：连续线段清空与遮挡的来源快照一致性

本轮基于 #372 和正式 [M0 加速执行计划](./M0-ACCEPTANCE-FAST-TRACK-PLAN-20261024.md)，只在已有两个连续射线解析消费者 `convex-segment-clearance.cjs` 和 `convex-segment-occlusion.cjs` 修复真实数学一致性缺陷，不新增几何/可见性求解器。

原先先读取 caller-owned `source.from/to`、`observerDirection`、`sourceParameterRange` 和支持面 `normal/offsetMm/id` 做合法性校验，再次从同一对象读取数值计算 Fourier–Motzkin 一维区间。动态 getter 可以让数学证明消费与验证不同的坐标、偏移、法向或实体 ID，甚至返回非有限数。现在先逐坐标单次读取有限 3D 值，读取线段、支撑面、稳定 ID、面集和源参数区间组成独立快照；所有连续区间数学计算只消费这些数据。面数组逐索引检测 `Object.hasOwn`，拒绝 sparse 造成的无声漏面。

独立测试包含：二读 Infinity/翻转坐标、反向 observer、二读面法向/offset/ID/面列表、动态来源参数、初读不合法、稀疏面集及重复 ID；由解析 0..10×0..10×(-2..4) 箱体证明标准遮挡开区间 (0.25,0.75)，对左侧区间 [0,0.1] 保留局部 clear，重叠区间及切触保持未判定。

严格作用范围：仅针对可信地提供的一个凸体与源线段的局部清空/遮挡区间。仍需 M3/M5 单独证明真实来源、所有场景遮挡体、投影交点、整条轮廓端点连续性、工程实/虚线、ConstructionIntent DAG → 唯一 V5；不因这次数学数据快照声明整个 M0 100%。

本批只改变两个既有函数 + 1 份集中回归 + 当前 20 数值模块验收台账 + 数学范围说明。须等最新 PR HEAD 五组 CI 完成且 GitHub mergeable 才 squash；失败则修复最新 HEAD 并重新验证。