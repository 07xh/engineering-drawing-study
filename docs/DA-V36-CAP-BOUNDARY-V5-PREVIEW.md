# DraftAI 04｜有限圆柱端盖截线 + 侧面截弧的 V5 内部作图适配（V3.6）

本批基于已合并 PR #283 所验证的圆柱截面**一维闭合周界**，不再仅渲染未截到端面的椭圆，而是将真正端面圆盘内的弦与有限侧面截线同步投影到同纸三视图，并使用现有 V5 逐笔作图时间轴。所有数学结果在适配器内部重新求解，绝不接受外部伪造的几何证明或 SVG。

## 内部接口

```js
const {cylinderCapSectionV5Preview}=
 require('./engines/spatial/sections/cylinder-cap-section-v5-preview.cjs');
const result=cylinderCapSectionV5Preview(
 {baseCenter:{x:0,y:0,z:0},radiusMm:5,heightMm:30},
 {point:{x:0,y:0,z:3},normal:{x:1,y:0,z:1}},
 {samplesPerTurn:64}
);
```

### 真实构造流程

1. 重新经 PR #276 解析侧面截弧与 PR #283 端盖弦、闭合拓扑检查；无数学证明不生成任何动画。
2. 从真正的圆柱半径、高度生成 V 主视、H 俯视、W 左视三面模型外形，分别位于同纸左上、左下、右上。
3. 按对应 `model-mm` 坐标构造 45° H→W 深度转移辅助线。对真实截面边界的每个图节点逐项生成 V/H/W 点，再生成 V/H 同横坐标、V/W 同高度及 H/W 深度转移的联系线。
4. 根据真实闭合图边，依次画出 **侧面解析截弧的分段折线**与**端盖真实直线弦**在 V/H/W 的投影。投影退化为一个点时使用 V5 point 动作，避免绘制零长度假线。
5. 所有输出为 V5 兼容的 `line/point/circle` 图元，并使用原 `workbench/teaching-motion-v5.js` 与 `teaching-timeline-v5.js` 验证、编译。每步最多 64 个动作，原播放器可以变速、暂停、步进、回退，及对旧 revision 失效。

## 不得夸大的范围

本接口是**内部动态作图预览**：`v5PreviewReady:true`、`mathematicalPerimeterVerified:true` 仅说明特定已知有限圆柱斜截平面一维周界得到数学验证并已被转换成动态作图数据。仍然：
- `completeEngineeringDrawingVerified:false`；
- `proof.solidSectionInteriorVerified:false`；
- `proof.hiddenLineVisibilityVerified:false`；
- `proof.sharedM2ContractSigned:false`；
- `globallyUnique:null`。

只处理世界 Z 轴有限圆柱的非竖直截平面；不自动求取陌生照片或教材原题条件，不判断真实可见线/虚线，尚无实体剖面填充、斜截面本体区域、绕任意空间轴旋转基本体、第一角法正式标准认证。截弧在画面上使用有误差上界的折线近似，数学交线本身由真实解析求交给出。

## 独立交付和验收

仅新增以下 04 文件：
- `engines/spatial/sections/cylinder-cap-section-v5-preview.cjs`
- `tests/workbench/v36-cap-boundary-v5-preview.test.cjs`
- `docs/DA-V36-CAP-BOUNDARY-V5-PREVIEW.md`

沿用现有 workbench CI 的测试 glob，不改共享 M2、01/03、07 原生播放器、08 OCR/图片候选、站点或 Cloudflare。后续若接公开二维工作台，必须由 07 独立 PR 做实际手机/平板渲染、线型、布局和步骤回退验收，09 确认生成文件不会误标为完整工程制图标准答案。
