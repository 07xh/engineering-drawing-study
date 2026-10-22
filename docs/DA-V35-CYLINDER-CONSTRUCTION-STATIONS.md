# DraftAI 04｜斜截圆柱特殊点、辅助母线与三视投影真实数学依据（V3.5）

基于已合并 PR #268 的 `engines/spatial/sections/axis-cylinder-plane.cjs`，本增量按 #237 完成斜截圆柱题从“解析截线”到“特殊点/一般点与辅助母线作图所需信息”的**独立数学准备层**。仅新增文件，不修改核心求解器、08 OCR、07 V5 和网页。

## 输入与返回

```js
const {cylinderSectionStations} =
  require('./engines/spatial/sections/cylinder-construction-stations.cjs');
const proof=cylinderSectionStations(
  {baseCenter:{x:0,y:0,z:0},radiusMm:5,heightMm:30},
  {point:{x:0,y:0,z:15},normal:{x:1,y:2,z:1}},
  {ordinaryDivisions:8}
);
```

`proof.stations` 逐点记录：
- `thetaRadians`：圆柱母线对应的圆周角度。
- `labels`：四象限特殊母线点、均匀的一般点；斜截时额外增加截线 Z 最高点/最低点。多个特征同角时合并，不重复构造错误的点。
- `intersectionMm`：解析圆柱侧面–平面交点，单位毫米。
- `auxiliaryGeneratorMm`：通过该接触点的真实竖直母线，**从有限圆柱底面延伸至顶面**。
- `projectedPoint` 与 `projectedGenerator`：真实空间点/母线的 V、H、W 模型坐标投影，可供后续绘制母线、投影联系线、辅助作图依据。
- `planeResidualMm`、`sideResidualMm`、`capResidualMm`：每个特殊点的独立几何残差，超限直接阻止结果。

只接受普通水平/斜截面完整落在有限圆柱侧面的场景。若 #268 原求交返回 `clipped`、`none`、`undetermined` 或竖直母线情况，本接口输出 `status:'blocked'` 与空站点，不擅自绘制“完整椭圆”。

## 数学证明与展示边界

已使用 #268 的解析截线 `center + cosine·cosθ + sine·sinθ` 求点；Z 极值由正弦余弦系数的真实相位导出，而非通过等角度采样猜最高/最低点。对每个点重新验算平面法向残差、圆柱半径残差、有限高度。辅助母线的端点来自实际有限圆柱高度，不是固定二维示意。

本接口提供 **`modelGeometryVerified:true`**，但同时显式保留 **`constructionStepsReady:false`**：没有经过 01/03 M2 的共享投影契约签收时，不输出伪造的 `ConstructionStep` 或 V5 时间轴。V/H/W 暂为模型坐标投影（不是同纸第一角法的图框位置），**不计算遮挡/虚线、端盖拓扑、45° 投影转移、采样图线的最终可见性**。没有证明用户题图的全局唯一空间解释。

## CI 和独立交付

- 专项实现：`engines/spatial/sections/cylinder-construction-stations.cjs`。
- 自动测试：`tests/workbench/v35-cylinder-section-stations.test.cjs`，含椭圆真实极值、水平截面特例、每站点 3D→V/H/W 投影一致、有限母线范围、尺度平移、未完成截面阻断、退化与重复计算稳定性，自动被现有 workbench CI 扫描。
- 不改既有 solver 或 CI/静态构建与部署，不加入公开工作台。代码可单独回滚。

下一步依赖：01/03 完成三维图元与第一角法投影统一契约签收后，04 把 `stations` 转换成可逐帧绘制且带来源证据的辅助母线、投影联系线、截线连接步骤；07 再消费真正验证过的 `ConstructionStep`。不作为完整斜截面自动解题功能上线证据。
