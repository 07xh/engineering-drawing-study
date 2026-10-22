# DraftAI 04｜截交线可见/隐藏区间的 V5 动态绘制适配与 SVG 真线型（V3.7）

基于 #288 的空间射线/保留实体数学判断，将已证明的截面开区间转换成**真实可逐步画出的 V5 图元**，并补上独立、真正执行实线/虚线/待确认线型的 SVG 渲染函数。只新增 04 文件，不修改核心播放器、OCR 和公开页面。

## 入口及强制条件

```js
const {cylinderVisibilityV5Preview,renderVisibilityActionSvg}=
 require('./engines/spatial/sections/cylinder-visibility-v5-svg.cjs');
const preview=cylinderVisibilityV5Preview(
 {baseCenter:{x:0,y:0,z:0},radiusMm:5,heightMm:30},
 {point:{x:0,y:0,z:3},normal:{x:1,y:0,z:1}},
 {retainedHalfspace:'negative',
  observerDirections:{
   V:{x:0,y:-1,z:0},
   H:{x:0,y:0,z:1},
   W:{x:-1,y:0,z:0}
  },samplesPerTurn:64}
);
```

注意：例子中的观察方向只表示**显式数学参数**，尚未被 03 认可为正式第一角法三视图法向及正负号，不能依据上述 V/H/W 命名自行认定标准工程图隐线无误。

## 真正开发内容

- 先经 #283 计算可信的一维截面周界，再经 #285 的第一角法同纸基础作图生成 45° 转移线和三视截点辅助联系线。
- 对 V/H/W 分别以 #288 的明确空间观察射线、被切除/保留半空间判断各段截交线的可见性。所有侧面视觉分段边界来自数学解析，而不是按固定屏幕颜色或临时 SVG 片段拼凑。
- 为每个真实投影动作附 `visibility='visible'|'hidden'|'undetermined'`、`sourceEdgeId`、`observerView` 和只读含义的线型元数据。
- `renderVisibilityActionSvg(action,progress)` 是**独立的静态 SVG 逐笔帧图元渲染器**。严格利用既有 `teaching-motion-v5.js` 的 `actionShapeAttrs` 算实际画笔位置；真正生成:
  - visible：`stroke-dasharray='none'`
  - hidden：`stroke-dasharray='6 4'`
  - undetermined：`stroke-dasharray='1.5 5'`，必须显示为未定状态而非擅自画确定虚线。
- 编译原 `teaching-timeline-v5.js` 的真实步骤，支持后续既有变速、暂停、回退与版本失效；每步不超过 48 个动作。即使 256 等分的精细斜截弧，也遵守原 V5 的动作上限。切割导致某视图投影退化成点时改用 point，不输出零长度伪线。
- 所有 SVG 标签参数都取自本地数学求解的有限数值，拒绝伪造 ID、伪造线型、脚本或直接传入外部 SVG 字符串。

## 数学与产品边界

- **适用范围**：一个轴线沿世界 Z 轴的真实有限圆柱、一个明确非竖直截平面、用户确认的保留材料一侧、三个**独立且明确**的正交观察方向。无法确定切除侧或相机视向时拒绝输出；实体遮挡在切线、截面边界端点可能不确定。
- 用户必须清楚：`visibilityLineStylesFullyVerified:true` 只表示按给定视线的**开区间**没有未判定状态；`firstAngleObserverConventionsSignedOff:false`、`standardLineStyleSignedOff:false`，还不等于三视工程图国标验收。
- 原 V5 播放器会消费步骤与速度、回退，但 **目前尚不识别自定义的 dash 元数据**。所以接口显式 `existingV5RendererHonorsCustomDashStyle:false`；要看到真实虚线，必须使用本模块新的 `renderVisibilityActionSvg` 渲染器，而不是把动作直接交给旧通用渲染器。
- `productionUiIntegrated:false`、`completeEngineeringDrawingVerified:false`，没有修改已上线工作台或 Cloudflare。后续由 03 正式签收 V/H/W 观察方向，再由 07 使用独立 SVG 渲染适配器集成到新产品工作台；09 需要手机/平板真机验收，不以 Node CI 代替。

## 独立测试与回退

- `engines/spatial/sections/cylinder-visibility-v5-svg.cjs`
- `tests/workbench/v37-cylinder-visibility-v5-svg.test.cjs`
- `docs/DA-V37-CYLINDER-VISIBILITY-V5-SVG.md`

测试使用现有工作台 CI 的 `node --test tests/workbench/*.test.cjs`，包含真实圆柱与端盖弦、两种保留半空间、三视方向参数、解析可视分界、128/256 等分分段、V5 原生时间轴、真正 SVG dash 属性、视向不确定时显著标注、脚本/伪造图元拒绝及数学输入不可变性。文件范围完全在 04 新增路径，主分支可独立回退。
