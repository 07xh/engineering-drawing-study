# 09｜V3.8 M1 精确线段拓扑：独立整数 Oracle 回归

本 PR 只新增 `tests/math/m1-independent-segment-topology-oracle.test.cjs` 与文档，不修改生产数学内核、专业求解器、工作台、Cloudflare 或私人内容。目标是避免仅用同一算法的另一个实现来“自证正确”。

Oracle 使用测试文件内单独编写的 BigInt 整数叉积与坐标区间判定，与 `core/geometry/segment-topology2d.cjs` 的共享 M0 定向谓词相互独立；对 1536 个确定性整数网格线段组合比较关系和接触标记。另覆盖水平/竖直/反向共线重叠、端点、严格错开、2 的幂的尺度与平移、binary64 最小次正规间隔、像素/毫米混用、原对象不被修改。

这些测试能发现整数输入及代表性边界上的分类回归，不能证明所有 IEEE-754 浮点输入、物理容差、交点坐标、整体约束存在性或全局唯一性。实际 `proper-crossing` 关系没有交点坐标；不得把 M1 拓扑测试当作完整 M2 求解。

依 #152，必须在最新 HEAD 验证五个适用 GitHub 检查均完成且 success、无文件覆盖、PR mergeable 后才可 squash merge。回退只需 revert 测试和文档提交。