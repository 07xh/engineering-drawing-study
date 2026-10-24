# M0 凸多面体边界点射线：数据快照与有限符号证明

本 PR 继续 #663/#665 已完成的公共来源快照修复，针对仅剩的点级边界射线消费者 `core/numeric/convex-polytope-boundary-ray.cjs` 实施**同一次校验和计算只消费一份有限 binary64 数据**，而不是校验 getter 一次、投影深度计算再次读取。读取的内容包括 3D 源点/observer、支持面 ID、法向、offset；稀疏面数组显式拒绝。

正向 `visible` / `hidden` 斜率在原有严格 directionTolerance 之外，另外调用共享 `certifyDotSign` 核实真实 binary64 内积符号。避免浮点消去、特殊极小容差将误符号当成数学可见性证据；未满足双方条件时 `undetermined`。继续保持 `pointRayCertified` 只代表**一个已提供可信凸体边界点的局部开射线**，不授予来源端点/完整轮廓/场景线型或 V5。

新增实测 3D 立方体上表面 +Z/-Z/切向、getter 第一次合法第二次翻转、支持面法向/offset/ID、稀疏/重复面和精确内积假零的五组正反例。只修改已有 M0 API、其 regressionTests 指针和说明文档；不新增数值核，不能代替 M3 来源实体/投影关系签收。完整最新 HEAD 五工作流 + 四分片 workbench 汇总成功、mergeable=true 后 squash。