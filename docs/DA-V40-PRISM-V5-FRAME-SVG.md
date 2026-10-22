# DraftAI 04 V4.0｜棱柱真实截面 V5 完整 SVG 帧合成

该模块接收已合并 [PR #304](https://github.com/07xh/engineering-drawing-study/pull/304) 的可信长方棱柱截面三视/V5 时间轴，重新从实际几何参数求交，生成从第零时刻到最后一笔完整过程的 **960×680 三视图 SVG**。

## API

```js
const {createPrismV5SvgScene}=require(
 './engines/spatial/sections/rectangular-prism-v5-frame-svg.cjs'
);
const scene=createPrismV5SvgScene(
 {min:{x:0,y:0,z:0},max:{x:10,y:10,z:10}},
 {point:{x:0,y:0,z:12},normal:{x:1,y:1,z:1}},
 {revision:7}
);
if(scene.status==='ready'){
 const frame=scene.renderFrame({elapsedMs:5000,expectedRevision:7});
 const player=scene.createPlayer({speed:2});
 // frame.svg 是可直接显示的静态 SVG 图纸当前帧。
}
```

具体实现：
- 图层 `prism-source`（已知投影轮廓）、`prism-guides`（截点/45° 辅助线/投影联系线）、`prism-cut-unknown-visibility`（真实数学截面结果）。
- `Timeline.frame(...).actionFractions` 和 `Motion.actionShapeAttrs` 控制每条线从零逐笔绘制；零时刻绝不提前出现辅助线与答案。
- 每条结果包含经过数学求交的 `sourceSectionEdgeId`、`data-action`；被点击定位等高级工作台操作仍须后续 UI 接线。
- 已知 3/4/6 边形截面来自棱柱 12 条空间棱的真实求交，V/H/W 图面由相同毫米比例变换得到，计算真实截面积和周长。当前**没有计算棱柱遮挡**，因此所有结果均显式 `visibility='undetermined'`，显示为待审提示线型，绝不把它冒充已经验证的标准可见实线或虚线。
- 棱柱/平面几何、版本号在每次渲染再次比对；已改变的参数不能重用旧 SVG。边界无解或退化返回 blocked。
- 可复用既有 V5 播放器的速度、seek、暂停、回退、revision invalidation，不修改 07 公共 V5。

**严格未完成**：国标第一角法、棱柱遮挡/虚实线、切面填充、输入照片 AI 识图、一般旋转棱柱、云端部署与 Android 真机仍需要独立验证。这是内部 SVG 帧组件，尚未接入网页实验台。只有模型一维截面多边形精确求交，接口 `visibilityVerified:false`、`firstAngleConventionSignedOff:false`、`productionUiIntegrated:false`。

文件：`engines/spatial/sections/rectangular-prism-v5-frame-svg.cjs`、`tests/workbench/v40-prism-v5-svg-scene.test.cjs`、本说明。单独 04 数学路径，不改 07/08/09 或公共构建文件。
