# DraftAI 04 V4.5｜四棱锥真实斜截面逐笔 SVG 帧

该模块承接 [#322](https://github.com/07xh/engineering-drawing-study/pull/322) 的有限四棱锥 8 棱/5 原面数学截交验证，以及 [#338](https://github.com/07xh/engineering-drawing-study/pull/338) 的 V/H/W 模型同纸投影、45° 联系线和原生 V5 作图步骤，在**不制造线型数学证据**的情况下按任意时间输出可直接显示的完整 SVG 图纸。

## 使用

```js
const {createPyramidV5SvgScene}=require(
 './engines/spatial/sections/rectangular-pyramid-v5-frame-svg.cjs'
);
const scene=createPyramidV5SvgScene(
 {base:{minX:0,minY:0,maxX:10,maxY:10,z:0},
  apex:{x:5,y:5,z:15}},
 {point:{x:0,y:0,z:15},normal:{x:1,y:1,z:1}},
 {revision:2}
);
if(scene.status==='ready'){
 const snapshot=scene.renderFrame({elapsedMs:1500,expectedRevision:2});
 const player=scene.createPlayer({speed:1.5});
 // snapshot.svg 为完整 960×680 数学模型纸面帧
}
```

## 已实现

- 每次依据用户明确的棱锥/截平面重新算真实交点和 3/4/5 边闭合轮廓。输入不存在可信数学解则 blocked，绝不生成“看着像”的预制动画。
- 三类实质图层：`pyramid-givens`（真实八条原始空间棱的三视投影）、`pyramid-guides`（实际截点/45° 深度辅助线/联系线）、`pyramid-section-unknown`（经原面拓扑验证的数学截面边）。
- 直接使用原生 `Timeline.frame(timing,elapsedMs)` 返回的逐动作 fraction 和 `Motion.actionShapeAttrs`，每条线真实从起点画至此刻笔尖。第 0 帧仅有初始已知棱锥，不提前出现结果。
- 每个结果图元保留可靠的 `data-source="section-edge-N"` 及 `data-source-face="base|side-N"`，严格校验数学来源，而不是用人工加的 `verified` 标记；线段退化成点时显示圆点。
- 独立 `createPlayer` 复用已有 V5 变速、暂停、seek/单步回退、revision 失效。每次显示再次核对原几何快照和预期 revision，任何就地修改不能复用旧动画。
- SVG 由固定模板和经过检验的有限数字坐标组成，不引用外站/加载图片/执行脚本。

## 不能宣称已完成

**棱锥隐藏线与第一角法国标尚未审核**，所以所有截交线统一以橙色点虚线和 `data-visibility="undetermined"` 标记，绝不擅自画成“已证明可见实线”和“已证明隐藏虚线”。本模块不支持其它零件的遮挡、截面填充、任意旋转棱锥、照片 AI 自动识图或完整 CAD 画图。返回 `visibilityVerified:false`、`firstAngleConventionSignedOff:false`、`completeEngineeringDrawingVerified:false`。

这一批是内部可运行的完整 SVG 帧模块，**网页按钮、公开路由和 Android 交互未在本 PR 完成**。合并 `main` 可通过用户已配置的 Cloudflare Worker Git 自动构建/部署触发，但不能把 GitHub Actions 绿灯冒充 Cloudflare Production Active SHA 的独立证据。

交付范围：`engines/spatial/sections/rectangular-pyramid-v5-frame-svg.cjs`，`tests/workbench/v45-pyramid-v5-svg-frame.test.cjs`（10 组真实行为），本文档。不修改 03/07/08/09、全站 UI、构建、生产配置与密钥。