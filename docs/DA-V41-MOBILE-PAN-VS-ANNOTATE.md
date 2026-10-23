# DraftAI V4.1｜安卓放大图纸的浏览与人工描图模式

问题来自既有 `/labs/recognition-qa.html`：图纸放大到 125–300% 后，图像和 SVG 同步变大、外围容器可滚动；但覆盖全图的 SVG 设置 `touch-action:none`，浏览器不会使用正常单指拖动滚动画面。同时，任何碰到 SVG 的拖动都可能进入人工标注流程，与“用手指移动图片”的用户意图混淆。

## 实际修改

- 在验收页面提供「**浏览图纸 · 拖动查看**」「**手工标注 · 描图**」两种明确的操作模式，按钮维护 `aria-pressed` 状态和当前中文说明。
- **浏览模式**下将 `qaOverlay.style.touchAction` 切换为 `pan-x pan-y`，允许触摸浏览器在具有 `overflow:auto` 的容器内原生滚动；指针事件不进入 `setPointerCapture` / `gesture.down` / `gesture.up` / `session.addAnnotation`，不会在移动大图时生成错误的真值。
- **标注模式**下恢复 `touch-action:none`，原有单指画线/画圆和严格的双指取消检查仍有效。
- 图纸从 100% 放大时，若不在五点触控自检中则自动改为**浏览模式**；需要描线时再次按「手工标注」。触控自检按钮会先进入标注模式，确保点击橙色十字仍可计数；图片清空会恢复安全默认模式。
- 两种模式切换均调用 `gesture.reset()`，已经按下的旧指针抬起时不可被错误完成为人工标注。
- 缩放与浏览仅更改屏幕布局；`original-image-px`、人工真值、识图候选、SHA-256 文件基线与 TP/FP/FN 指标均不改变。
- **不涉及后台上传、网络 OCR、数学求解、G1、V5 或 Cloudflare 生产配置**。

## 验收

`node --test tests/workbench/v41-mobile-photo-pan-mode.test.cjs` 覆盖按钮与原生触摸滚动权限、浏览模式的指针事件隔离、缩放自动浏览、五点自检优先恢复标注、切换时重置旧手势、已知 CSS 滚动/放大后保持相同原图坐标及无网络/求解器侵入。

该回归属于源码/纯函数检查，**不是完整 Android WebView 自动端到端测试**。还需要在实际 Android/ColorOS/Chromium 浏览器打开已部署新 SHA 的页面，确认单指滚动、竖版长图、放大后画图及触控自检。仓库五项 GitHub CI 全部通过才可合并。
