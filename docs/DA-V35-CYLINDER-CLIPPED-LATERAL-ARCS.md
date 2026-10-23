# DraftAI 04｜有限圆柱的端盖边界与斜截侧面弧段（V3.5）

本模块是继 #268（完整侧面斜截数学）/#270（特殊点与辅助母线）/#274（闭合斜截 V5 第一角法内部适配）后的**独立数学增量**，解决先前返回 `clipped` 时无法列出真实截弧的问题，不修改旧求解器或 V5 播放器。

## 数学输入/输出

```js
const {finiteCylinderLateralArcs}=require(
  './engines/spatial/sections/finite-cylinder-lateral-arcs.cjs'
);
const solved=finiteCylinderLateralArcs(
  {baseCenter:{x:0,y:0,z:0},radiusMm:5,heightMm:30},
  {point:{x:0,y:0,z:3},normal:{x:1,y:0,z:1}},
  {samplesPerTurn:64}
);
```

对 **Z 轴有限圆柱的侧面** 与非竖直平面，推导：
- 真实解析参数 `x=cx+r cosθ, y=cy+r sinθ, z=z0+A cosθ+B sinθ`；
- 上下端面高度 `z=bottom`、`z=top` 与侧面的全部角度根（用三角方程的解析解，而不是碰运气查样本）；
- 按根切分参数区间，用区间内部的解析高度判定该段是否属于有限侧面；
- 给出每段 `angularInterval`、真实 `samples`、`endpoints.firstCap/lastCap` 与同一 3D 点的 V/H/W 正投影；每个点重新验算曲面、平面和有限高度残差。
- 在画图折线近似的同时提供保守毫米级 `chordErrorUpperBoundMm`。曲线数学来源仍为解析参数化，不宣称折线本身是精确解析交线。

示例：`x+z=3`、半径 5、高度 30 的圆柱，侧面截线原本跨到下端面外。现在能够真正算出**侧面有效弧段及其与下端面圆周的两个边界点**。平面截上端面或同时截上、下端面，也能给出真实侧面保留区间。跨越圆周参数 θ=0 的同一侧面弧有时表示为两个连续角度区间：它们是参数切片，不能误称实际有两条断开的物理分支。

## 故意保留的安全限制

1. **并没有计算平面穿过圆柱端盖圆盘的内部截线或封闭截面面域**。返回 `completeSolidIntersectionVerified:false`、`requiresCapFaceTopology:true`。不可能据此判定完整实体截面轮廓、遮挡、虚实线或最终作图答案。
2. 圆柱轴线仅支持世界 Z 轴；完全竖直截平面对应母线，由 #268 单独处理；近竖直数值不稳定拒绝输出弧。
3. 如果截平面仅与端盖边界相切而没有非零侧面弧长，本接口保守返回 blocked，而不是把单个切点冒充一段圆弧。
4. 没有 AI 识图、V5 动态接线和网页 UI。不得将本纯函数宣传为未知题图的自动求解系统。
5. 输出 `modelUnit:'mm'`、`globallyUnique:null`，并且每个输出都携带残差；这是可复用的数学阶段证据，不是单题全局唯一性证明。

## 版本和测试

- `engines/spatial/sections/finite-cylinder-lateral-arcs.cjs`
- `tests/workbench/v35-finite-cylinder-clipped-arcs.test.cjs`：下端面、上端面、上下两端、完整截线、退化、仅点接触、解析残差、三视投影、误差上界、平移/缩放和不可变性。
- `docs/DA-V35-CYLINDER-CLIPPED-LATERAL-ARCS.md`

本 PR 只新增三个 04 文件；不触碰 01/03 M2 统一契约、08 OCR、07 V5、公开解题页、GitHub workflow 和 Cloudflare。下一步须解决端面线段/切面轮廓拓扑、可见线与第一角同纸页面审核，然后通过独立 PR 让 07 动画接收真实裁切弧段。
