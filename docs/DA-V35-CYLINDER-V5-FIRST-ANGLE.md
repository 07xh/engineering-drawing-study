# DraftAI 04｜斜截圆柱同纸三视图 V5 内部动态作图适配（V3.5）

本次增量从真实数学求交 PR #268 与特殊点辅助母线 PR #270 出发，**独立输出第一角法同纸 V/H/W 可播放作图动作**；不接收任意 OCR 图像结果、预置 SVG、未验证的数学步骤，也不直接修改 01/03 共享契约或生产网页。

## 内部入口

```js
const {cylinderSectionV5Preview}=require(
  './engines/spatial/sections/cylinder-section-v5-preview.cjs'
);
const preview=cylinderSectionV5Preview(
  {baseCenter:{x:0,y:0,z:0},radiusMm:5,heightMm:30},
  {point:{x:0,y:0,z:15},normal:{x:1,y:2,z:1}},
  {ordinaryDivisions:8,samples:64}
);
```

- `preview.status='ready'` 仅当 **圆柱侧面与平面** 的解析封闭交线和特殊点残差经过真实求解验证。
- `preview.givens` 是由圆柱半径、高度算出的 V/W 两个矩形外轮廓以及 H 圆形轮廓；这些只是已知基本体的图示，尚未判定所有隐藏线。
- `preview.sheet` 的三个区域按第一角法排列：**V 主视在左上、H 俯视在左下、W 左视在右上**。三个投影来自同一组毫米模型坐标，比例尺适应有限圆柱实际半径和高度，而不是静态教材截图。
- `preview.steps` 第一步画 `transfer-45deg`：H 深度转移至 W 的 45° 实线。后续每一数学截点分为真实母线/投影点、投影联系线两步。V/H 共用 X，V/W 共用高度 Z，H/W 深度通过 45° 线转移，每个关系单独校验。
- 最后 V、H、W 三张视图的截线分别以解析曲线 `samples` 等分后的折线作**逐笔近似绘制**。解析交线的精确性来自 #268 的参数方程及独立曲面残差，**不是** SVG 折线逼近的正确性。接口提供以模型毫米为单位的保守 `chordErrorUpperBoundMm`（弦线近似误差界）。
- `preview.timing` 使用既有 `workbench/teaching-timeline-v5.js` 真正编译；`workbench/teaching-motion-v5.js` 校验所需线与点几何属性。现有播放器可实际执行变速、暂停、步进、回退与 revision invalidation。

## 明确边界和合并依赖

这是可复用的**内部 V5 动画适配**（`v5PreviewReady:true`），不代表完整工程制图最终答案通过验收。接口明确：
- `completeEngineeringDrawingVerified:false`；
- `proof.hiddenLineVisibilityVerified:false`；
- `proof.solidCapContourVerified:false`；
- `proof.sharedM2ContractSigned:false`；
- `globallyUnique:null`。

Z 轴有限圆柱侧面被斜截线**完整保留于上下端面之间**才提供动画；若遇到端盖裁切、无交、竖直母线或数值不稳定返回 `status:'blocked'`、没有任何步骤和时间轴。解析曲线仅由折线近似显示，不应误读成真实 CAD 精确曲线。没有 AI 图片识图、截面实体面域、遮挡/虚实线、正式首角法标准审核，也没有 Cloudflare 部署。

本次所有改动位于 **04 新文件**：
- `engines/spatial/sections/cylinder-section-v5-preview.cjs`
- `tests/workbench/v35-cylinder-first-angle-v5-preview.test.cjs`
- `docs/DA-V35-CYLINDER-V5-FIRST-ANGLE.md`

测试复用原本 workbench CI，验证当前动态动作与残差、45° 转移坐标关系、无伪造未知交线、原 V5 播放器的速度和进度回退、局部修改不改变数学行为。此增量独立于并行 08 OCR、01 M2/03 投影、07 网站播放器，实现后仍应由 00/03/09 评审第一角法绘制约定，07 再开独立 UI 集成 PR。
