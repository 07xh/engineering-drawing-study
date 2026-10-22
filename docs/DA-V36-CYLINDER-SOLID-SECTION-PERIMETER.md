# DraftAI 04｜有限圆柱斜截面的端盖弦与封闭边界拓扑（V3.6）

该模块继续 [#276](https://github.com/07xh/engineering-drawing-study/pull/276) 的解析侧面裁切工作，补上**截平面与圆柱顶部/底部圆盘的实际线段交集**，将弦线与侧面截弧通过可验证的端点和图结构接成**一维截面闭合边界**。这不是教师课程，也不是预置 SVG 动画。

## API

```js
const {finiteCylinderSectionBoundary} = require(
  './engines/spatial/sections/finite-cylinder-section-boundary.cjs'
);
const result=finiteCylinderSectionBoundary(
 {baseCenter:{x:0,y:0,z:0},radiusMm:5,heightMm:30},
 {point:{x:0,y:0,z:3},normal:{x:1,y:0,z:1}},
 {samplesPerTurn:64}
);
```

该斜平面为 `x+z=3`：圆柱侧面仅有有限保留弧，底面 z=0 的实际相交弦为 x=3、y∈[-4,4]，长度 8 mm；它的两端必须与现有侧面解析截弧的端点匹配，才能输出闭合的一维截面轮廓。

## 与真实数学有关的实现

1. 直接重新计算既有 `finiteCylinderLateralArcs` 解析弧段，拒绝信任调用者提供的“已验证”布尔值/折线。
2. 对每个真实遇到的端盖圆盘，从截平面与该端盖所在水平面的两平面交线求中心投影和两圆周端点：`n_x(x-c_x)+n_y(y-c_y)=-d`，弦半长 `sqrt(r²-(d/|n_xy|)²)`；检查 **两端确实在已求侧面截弧的圆周端点处**，且弦中点位于圆盘内部、整个弦在截平面内。
3. 将解析侧面弧段与端盖弦构建为图结构。通过毫米级端点容差合并 θ=0/2π 参数缝；严格要求每个顶点度数为 2、全部边进入**同一个闭合周期**。可明确区分一条真实物理边界与因为参数缝产生的多个数学切片。
4. 每条端盖弦带真实空间端点、长度、V/H/W 投影与残差；所有侧面弧都保留原来源、解析参数区间、采样点及折线近似误差界。不声称视觉采样形成精确 CAD 曲线。
5. 支持只切底面、只切顶面、同时切上下端、完全位于侧面上的封闭椭圆、圆柱中间的水平圆截面。**平面与整个端面圆盘共面、仅孤立触点、真/近竖直平面、无交、近退化圆周切线**均保守阻断；不将面域或触点误记为闭合一维轮廓。

## 严格证明边界

成功结果为 `solidSectionPerimeterVerified:true`，而非完整体积/面域：
- `completeSolidIntersectionVerified:false`；
- `sectionInteriorVerified:false`；
- `visibilityVerified:false`；
- `firstAngleLayoutVerified:false`；
- `v5StepsReady:false`；
- `globallyUnique:null`。

本模块的独立证明只覆盖一个已知 Z 轴有限圆柱、明确给定的斜平面、**一维截面轮廓**的闭合拓扑与度量一致性。**尚不**计算任何正投影视角的实际隐藏/可见边，也不生成切面填充、剖面线、完整工程图标准答案、V5 逐步动画或陌生题图自动识别。

## 测试、并行与回退

新增 `tests/workbench/v36-cylinder-solid-section-boundary.test.cjs`，验证真实上/下端面圆周交点及弦长、两端同时裁切、0/2π 参数缝连通、正规闭合图度、数学残差、模型坐标投影、平移/尺度、坏输入与无解阻断。现有 workbench CI glob 自动执行；不修改共享 M2、01/02 数学、03 投影、07 动画、08 AI 识图、构建或 Cloudflare。后续需要 03/07/09 审核真实工程制图可见线、第一角法和 V5 适配，不得用本数学阶段的证明代替 UI 和生产验收。
