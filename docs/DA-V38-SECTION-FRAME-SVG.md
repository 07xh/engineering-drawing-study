# DraftAI 04 V3.8｜真实可见性三视图完整 SVG 帧合成器

这一批直接承接已经合并的 PR #288（模型射线可见性数学证据）与 #290（可逐笔输出实线、虚线、待确认线型的 V5 SVG 图元）。核心作用是把这些**单独的图元**合成为真正随 V5 时间轴变化的**完整、稳定、可检查的工程图 SVG 画面**。

## 内部接口

```js
const {createCylinderVisibilitySvgScene}=require(
 './engines/spatial/sections/cylinder-visibility-frame-svg.cjs'
);
const cylinder={baseCenter:{x:0,y:0,z:0},radiusMm:5,heightMm:30};
const plane={point:{x:0,y:0,z:3},normal:{x:1,y:0,z:1}};
const observerDirections={
 V:{x:1,y:0,z:0},H:{x:0,y:0,z:1},W:{x:-1,y:0,z:0.2}
};
const scene=createCylinderVisibilitySvgScene(cylinder,plane,{
 revision:7,retainedHalfspace:'negative',observerDirections
});
if(scene.status==='ready'){
 const frame=scene.renderFrame({
  elapsedMs:scene.totalMs*0.5,expectedRevision:7
 });
 // frame.svg 是整张 960×680 SVG，可供未来网页渲染/保存。
 // frame.rendered / frame.activeStepId 用于 UI 显示当前进度。
}
```

## 自动作图与数学可靠性

- 每次创建场景都重新经过 04 有限圆柱截面真实数学求交、端盖弦/侧面曲线闭合拓扑、指定保留侧与观察者射线证明，再复用原有 V5 时间轴。不能传入伪造动画或外部 SVG。
- 0 时刻只显示已知投影，不提前出现任何辅助线或答案。随着真实 `Timeline.frame(...)` 的每个 action fraction 变化，逐帧显示辅助投影线、真实端盖截线以及有解析数学来源的侧面截线。
- 内部 SVG 分为 `source-cylinder`、`construction-guides`、`verified-section-strokes` 三个独立图层，整个播放过程沿用同一固定 `viewBox`，不会因新出现的辅助线让镜头跳动。
- **关键**：完成线的真实样式从 PR #290 的 `renderVisibilityActionSvg` 获取，确保数学遮挡的 `hidden` 输出 `stroke-dasharray="6 4"`，可见区间 `none`，未确定 `1.5 5`，而不是将所有结果都交给旧 V5 单线型渲染器。
- 传入 `revision` 并在渲染时要求严格一致的 `expectedRevision`。创建场景后几何、截面或观察方向被就地改动但未正确升版时，同样检测模型快照变化并拒绝渲染旧图。
- 所有动态数值通过 V5 内部图元校验和有界 SVG 数字输出；无脚本、外链、图片、后台上传；不会把候选识图 OCR 的像素数据伪装成毫米证明。

## 严格边界

本接口是**内部只读 SVG 合成器**，不是公网用户页面；`productionUiIntegrated:false`，未修改 07 通用 V5、08 识图、第一角法投影配置、Cloudflare 或静态构建白名单。只有明确输入当前保留实体半空间及三个观察方向时才能成功。

`completeEngineeringDrawingVerified:false`、`firstAngleObserverConventionsSignedOff:false`、`globallyUnique:null`，仍需 03/09 签收三视观察方向和真实工程制图虚实线标准，截切面面域/剖面填充也未完成。图元端点可见性和近切线为“不确定”不是数学唯一性承诺。当前严格支持一个已知 Z 轴有限圆柱与已知单平面。

## 验收与回退

仅新增：
- `engines/spatial/sections/cylinder-visibility-frame-svg.cjs`
- `tests/workbench/v38-cylinder-visibility-frame-svg.test.cjs`（12 组关键真实时序/线型/旧版本/数值边界测试）
- `docs/DA-V38-SECTION-FRAME-SVG.md`

自动被现有 `node --test tests/workbench/*.test.cjs` 收录，不触碰 01/02/03/07/08/09 的共享代码，保持随时可独立回滚。后续 UI 接入与 Android 真机 SVG 播放、视觉清晰度验证需另做 07 专项集成 PR。
