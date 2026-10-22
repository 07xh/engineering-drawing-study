# DA-V3.8 / 04｜圆柱、长方棱柱、矩形棱锥的三视图公式去重

基准 main：`1edfe9d13454d38aba34568811b3e6867070b943`（已合并审计 #355）。
唯一修改目标是三份 `engines/spatial/sections/**` 源码中重复的模型 V/H/W 坐标公式：由各自的 `projection(s)` 局部函数改成导入 `core/projection/conventions.js` 中既有 `project`。

## 数学等价性与职责

原始三份公式都按：
- `V={u:x,v:z}`
- `H={u:x,v:y}`
- `W={u:y,v:z}`

新的 `project(point)` 使用**同一数学坐标公式**，且验证三维点数值有限。仅模型空间结果；不得把画纸 `sheet-px`、45°辅助线或隐线判定当作投影本身。

原有圆柱解析参数、圆柱截线残差/端盖判断、棱柱 12 棱求交、棱锥 8 棱求交、面拓扑、几何状态、`maxResidualMm`、`perimeter`、`areaMm2`、`globallyUnique:null` 完全不变。

## 可复现的独立回归

- `node --test tests/math/v38-legacy-spatial-projection-parity.test.cjs`：审计 PR #355 提前合并的**迁移前**数学等价基线，覆盖真实圆柱/棱柱/棱锥结果、mm/px 分离与退化阻断。
- `node --test tests/workbench/v35-cylinder-section-math.test.cjs tests/workbench/v40-rectangular-prism-section.test.cjs tests/workbench/v44-rectangular-pyramid-section.test.cjs`：专项原有独立解析数值、source edge/face、残差、分支和异常测试。
- `node --test tests/math/*.test.cjs` 以及现有 `math`、`planar-math`、`point-projection`、`workbench`、`validate` exact PR HEAD Actions。

## 失败语义与发布边界

- `core/projection.project` 输入不是有限三维点应直接拒绝；不允许对缺尺寸、退化或未验证截交强行播放 V5。
- V/H/W 仅是坐标投影；不据此声称完整第一角法同纸坐标、截交内域、线型、观察者遮挡或全局唯一。
- 这次是对已存在、已测试公式的**共享函数调用迁移**，没有新增一个新的投影内核，更没有重写任何截交求解器。
- 由于修改了数学求解器路径，按 #152 仍须 00/09 依据上述独立对照用例及最新 main 进行高风险审计和正式合并批准。未签收前 Draft，不得冒称已上线。
- 回退：独立 revert 本 PR 的三处导入替换，不需要恢复旧模型或删除数学资产。
