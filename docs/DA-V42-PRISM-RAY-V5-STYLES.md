# DraftAI 04 V4.2｜将已证明的棱柱截交线观察射线接入 V5 实际 SVG 线型

这一批承接已合并的 #309（对**真实有限长方棱柱**及已知截平面的截面开边进行空间射线可见/隐藏/不确定数学分类）和 #306（真实 V5 整纸逐笔 SVG）。

## 兼容与启用条件

原 `createPrismV5SvgScene(box,plane,{revision})` 的**默认输出完全保守**：没有指定视向时，所有截面线段保持橙色待审核虚点线，绝不会因网页 V/H/W 的排列而推断观察者处在哪侧。

只有显式提供 **保留哪侧截平面实体** 和 V/H/W **各自真实三维观察方向**，才启用模型射线证明：

```js
const {createPrismV5SvgScene}=require(
 './engines/spatial/sections/rectangular-prism-v5-frame-svg.cjs'
);
const scene=createPrismV5SvgScene(
 {min:{x:0,y:0,z:0},max:{x:10,y:10,z:10}},
 {point:{x:0,y:0,z:12},normal:{x:1,y:1,z:1}},
 {revision:7,retainedHalfspace:'positive',
  observerDirections:{
   V:{x:0,y:-1,z:0},
   H:{x:0,y:0,z:1},
   W:{x:-1,y:0,z:0}
  }}
);
```

这里的方向定义为**从空间图元指向观察者**，仅是用户明确给定的数学视向示例，**不是默认的中国第一角法国标标准视向**。

实现每个 V/H/W 独立重算 #309，要求可信周界、开边数与几何来源一致，按 `sourceSectionEdgeId + view` 映射原 V5 动作，不能直接传入伪造 `visibility='visible'`。缺失任何一个观察方向或材料侧直接抛错，避免悄悄使用默认约定。对已证明的开边输出：

- `visible`：深绿色实体实线，`stroke-dasharray="none"`；
- `hidden`：深灰色虚线，`stroke-dasharray="7 4"`；
- `undetermined`：橙色待审核点虚线，`stroke-dasharray="2 5"`。

每一笔仍使用真正 `Timeline.frame(...)` 的进度和 `Motion.actionShapeAttrs` 实时 SVG 图元，而非静态粘贴。输出包含 `visibilityEvidenceMode`、独立 `observerEvidence`、每视图数学 counts 与逐帧可见/遮挡/未知图元计数；修改几何、观察方向或材料侧会使旧版本被拒绝。

## 保守数学范围

`visibilityVerified:true` / `openEdgeRayVisibilityVerified:true` 仅表示**在该次用户指定的视向与材料侧下，截交多边形各条开边**都具有经验证的局部射线结论，**不代表整个工程图的隐藏线正确**。保留 `firstAngleConventionSignedOff:false`、`boundaryEndpointsVerified:false`、`completeEngineeringDrawingVerified:false`，未考虑其它零件遮挡、线宽标准、角点遮挡或截面面域填充。

本批只修改 04 `engines/spatial/sections/rectangular-prism-v5-frame-svg.cjs` + 新 `tests/workbench/v42-prism-v5-ray-styles.test.cjs` + 文档。不修改 03/07/08/09 或网页。下一批需要独立在棱柱网页上提供人工显式的材料侧和各视图观察方向选择；**未经确认仍维持原待审核线型**。
