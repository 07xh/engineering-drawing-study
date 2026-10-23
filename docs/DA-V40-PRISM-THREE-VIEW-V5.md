# DraftAI 04｜有限长方棱柱斜截面 V5 真实动态构造（V4.0）

这一批只把已合并 [PR #302](https://github.com/07xh/engineering-drawing-study/pull/302) 的 **12 条真实空间棱边求交、非退化闭合截面多边形数学结果** 转成第一角法研究性 V/H/W 同纸动画及可回退的 V5 时间轴。不是预制 SVG 题解和截图展示。

## 接口

```js
const {prismSectionV5Preview}=require(
 './engines/spatial/sections/rectangular-prism-v5-preview.cjs'
);
const result=prismSectionV5Preview(
 {min:{x:0,y:0,z:0},max:{x:10,y:10,z:10}},
 {point:{x:0,y:0,z:12},normal:{x:1,y:1,z:1}}
);
```

内部每次重算 #302 求解器，不允许调用者传入伪造的 `verified:true` 或任意 SVG。

- **已知图**：从真实棱柱 XYZ 最小/最大空间坐标算出 V（左上）、H（左下）、W（右上）三个矩形纸面轮廓（仅几何外形，未审定隐藏线）。
- **45° 辅助线**：从实际棱柱深度范围算出转移线，不使用固定模板。
- **截面特殊点**：每个截点的来源是真实有限棱边求交，携带 `sourceEdgeIds` 及各自 plane/box 残差，逐步出现 V/H/W 点。
- **联系线**：用同一个空间点证明 V/H 同 X，V/W 同 Z，H/W 的 Y 深度沿 45° 等比例转移。联动所有截点。
- **截面轮廓**：依据 #302 验证过的截面拓扑循环，逐条生成一条空间截面边在三个视图上的真实纸面线/退化点。计算真实周长与面积，保留 `visibility:'undetermined'`，避免没有证据就画确定虚实线。
- 每个步骤 `dependsOn` 严格串联、几何图元由原生 `teaching-motion-v5.js` 验证、时间由原生 `teaching-timeline-v5.js` 编译。可复用同一播放器的 0.25–4 倍速、暂停、单步回退与 revision invalidation。

## 清晰限制

这批输出 `v5PreviewReady:true`、`mathematicalPerimeterVerified:true`，只意味着明确的**一个轴对齐有限长方棱柱**与明确空间平面的截面闭合周界可以逐笔投影作图。尚无真实遮挡可见性、剖面填充、任意旋转棱柱/棱锥/圆锥、AI 识图或正式首角法标准签收。因此保留 `visibilityVerified:false`、`firstAngleConventionSignedOff:false`、`completeEngineeringDrawingVerified:false` 和 `globallyUnique:null`，**不得当作正式工程制图标准答案**。

只新增：
- `engines/spatial/sections/rectangular-prism-v5-preview.cjs`
- `tests/workbench/v40-prism-three-view-v5.test.cjs`
- `docs/DA-V40-PRISM-THREE-VIEW-V5.md`

不修改 01/03、07 原生 V5、08/09 AI、静态构建和 Cloudflare。下一阶段可由独立 04 浏览器实验室输出逐帧 SVG，并由 03/09 审核空间可见性后接真实虚实线。
