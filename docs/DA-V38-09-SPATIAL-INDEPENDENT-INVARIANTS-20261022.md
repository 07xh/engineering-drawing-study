# 09｜V3.8 04 实际基本体截交解的独立残差/边界回归

在未合并 #359 共享证据边界之前，以已经合并的真实专项求解器为独立参照：`prismPlaneSection`、`pyramidPlaneSection`、`intersectCylinderSidePlane`。测试使用原始平面方程重新计算点到平面的残差、重新累积真实边长、核查三视图数值投影和空间实体边界，覆盖六边形棱柱、五边形棱锥、圆柱侧面水平圆、完整棱柱水平切面、平面外侧及退化输入。

这只能证明指定样本的几何残差、有限多边形闭环与参数曲线样本符合受测条件，不推导原图识别的准确性、全部可能立体解释、完整圆柱端盖交线、可见性、统一 V5 DAG 或全局唯一。原专业求解器 `status:'ready'` 仍不得自动映射为 `SolveResult.unique`。

只增添 tests/math 与 docs 两个文件，不依赖 #359 / #337，不改数学源代码、Cloudflare、认证或前台。合并仍需 PR 最新 HEAD 的 GitHub 五项检查全部 success、PR mergeable、比对最新 main 无并行覆盖；回退 revert 本提交。