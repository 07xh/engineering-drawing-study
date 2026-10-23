# 09 — 02 双圆真实专业求解器独立解析对照

范围：`engines/constraints-2d/finite-fillet-gate.cjs` 与既有 `engines/planar/circle-circle-fillet.cjs`。独立计算两个全圆的等圆心轨迹交点（半径 15 mm，圆心距 20 mm，对称交点 x=10 mm、y=±√125 mm）；验证双解、切点四项距离与共线关系、单点相切、分离与同心不可离散、平移及同比例缩放、有限源圆弧明确拒绝、模型毫米/版本错误。所有结果保持 `globallyUnique:null`；单个候选不代表具有双侧有向 G1、有限连接弧旋向或全局唯一解。

此独立 09 回归只用于核对已合并的 02 专业算法，**不依赖未合并的 #363 或 #366**，不替代对 M2 新包装及真实图像来源的独立审查。要核实 PR 最新 SHA 的 math/planar/projection/workbench/validate 五组 CI、文件差异和可合并性后才合并。仅修改测试与文档；不改旧求解器、V5、Cloudflare 或数学契约。失败时保持 PR 待审，回退时 revert 测试与文档。