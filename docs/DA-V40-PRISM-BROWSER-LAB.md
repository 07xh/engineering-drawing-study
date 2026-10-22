# DraftAI 04 V4.0｜有限长方棱柱斜截面 V5 浏览器实验工作台

在已合并的 [#304](https://github.com/07xh/engineering-drawing-study/pull/304) **棱柱真实截点与三视 V5 数学动作**，以及 [#306](https://github.com/07xh/engineering-drawing-study/pull/306) **完整 SVG 动态帧**基础上，新增真正可以浏览器交互、只在本地计算的独立研究预览页面。

## 页面

`/labs/prism-cut-live.html`

- 录入 X/Y/Z 实际毫米尺寸（盒体固定为 `(0,0,0)` 到 `(sizeX,sizeY,sizeZ)`）、切平面上的一点 `px,py,pz` 与非零法向 `nx,ny,nz`，参数均明确来自人工输入，不猜测未知题图；
- 每次修改参数立即清空并递增版本号；用户确认后重新运行 12 棱真正的有限棱交点数学计算和凸截面图论检查。无解、退化或整条棱边落在平面上不会输出“画得像”的截图；
- 在单张 960×680 SVG 纸面显示 V/H/W 基本外形、45° 辅助转移线、真实数学截点与投影联系线、闭合多边形结果；按原生 V5 `Timeline.frame` 的画笔进度逐笔出现；
- 暂停/播放、上一步/下一步、点击真实步骤跳转、进度拖动、0.25–4× 倍速、辅助线开关、黑白显示、当前 SVG 本地下载；
- 实时显示截面边数、面积（mm²）和周长（mm），不依赖截图上的像素距离。

## 尚未完成，必须明确

该工具仅适用于单个**轴与模型 XYZ 平行的有限长方棱柱**和用户明确给出的平面。虽然截面顶点/长度/面积及一维闭合轮廓真实可验证，但**棱柱截面可见性没有证明**。因此页面实际把所有结果线以独特的橙色点虚线显示为 **`undetermined`**，不得作为工程制图国标虚线或最终标准答案。第一角法视向、复杂隐藏线、真实截面填充、任意旋转棱柱、棱锥、圆锥和图像 AI 自动识别仍需单独开发/验收。

本次变更：
- `labs/prism-cut-live.html`
- `labs/prism-cut-form.cjs`
- `labs/prism-cut-live-entry.cjs`
- `scripts/build-static.cjs` 中独立追加的页面及 bundle
- `tests/workbench/v40-prism-browser-lab.test.cjs`
- 本说明

不改圆柱页面、OCR QA、07 V5 播放器、01 核心数学或 Cloudflare 部署配置。静态构建和 CI 绿灯只证明可编译/自动测试；**不能据此声称 Cloudflare 当前 Active SHA 已是最新版本，不能替代 Android 平板触控和本地 SVG 下载的实机验收**。后续 03/09 应审核标准观察方向/可见线型，再由 04/07 做正式生产整合。
