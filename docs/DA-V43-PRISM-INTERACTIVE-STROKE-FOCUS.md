# DraftAI 04 V4.3｜棱柱动态图线点选 / 步骤溯源 / 自动聚焦

在已合并 #311 / #312 的**真实长方棱柱截面空间射线线型**和**用户明确确认视向**之后，进一步增强棱柱斜截面浏览器实验页 `/labs/prism-cut-live.html`，使其达到此前圆柱实验台的逐笔交互能力。

## 数学驱动的图元选择

棱柱 V5 完整帧合成器内部新增：
- `inspectAt({x,y,elapsedMs,expectedRevision,tolerancePx=12})`：使用已核实的 V5 `Motion.actionShapeAttrs`，按当前画笔进度精确进行点到**已画出线段**的距离或点到**已画出截点**的距离判别，并归还稳定 `actionId`、数学空间截边来源 `sourceSectionEdgeId`、确切 `stepIndex/stepId`、所属视图 V/H/W、真实时间轴中的 `seekMs`，以及当前参数指定射线的 `visible/hidden/undetermined` 状态。没有画出来的后续图线不参与命中。
- `focusOnAction` / `focusOnStep`：从已确认 SVG 图元真实纸面几何求出包围盒，返回比例固定、上下界不越过 960×680 整张纸的 `viewBox`，不是屏幕截图放大。
- 三种 API 均要求当前 revision、圆柱/棱柱参数和 V/H/W 观察方向未变；任何条件更新立即禁止旧证明的点选/聚焦。

## 实验页操作

- 点击/轻触**已画出的**已知图、辅助线、结果截线，使用 SVG 当前 `getScreenCTM().inverse()` 将 Android / 桌面上的鼠标或触控坐标映射到真正当前缩放的 SVG 坐标，独立数学 inspector 命中后暂停、定位 V5 绘制步骤、显示来源线条和当前视向可见性类别、用亮蓝色高亮选中图线。
- “自动聚焦当前步骤”默认开启；选图元后聚焦其实际几何，进入另一绘制步骤自动聚焦新的步骤。“查看整张图纸”关闭自动聚焦，复原 full-page `viewBox`；SVG 导出**仍是整张原纸数学绘图**而不是只保存缩放片段。
- 手动 Seek / 单步 / 播放 / 几何和观察条件更新均撤销旧选择，避免数学来源错绑。图纸获得键盘焦点后可用左右方向键执行上一步/下一步。
- 不上传模型、浏览器不依赖远程 CDN 或截图定位，保留 0.25–4×、播放/暂停、黑白/辅助线和 Blob 本地 SVG 下载。

## 严格适用范围

只针对已知轴对齐有限长方棱柱与单个截平面。一切数学线型仅代表用户显式提供的**保留材料侧+三个观察方向**下的凸实体开边射线判断；未确认模式全部保持“待审核”。角点、其它零件遮挡、制图国家标准及第一角法视向仍未得到 03/09 正式签收，不能宣称通用 AI 图片识别、全部截交线正确或 Android 真机已验收。

文件：`engines/spatial/sections/rectangular-prism-v5-frame-svg.cjs`、`labs/prism-cut-live-entry.cjs`、`labs/prism-cut-live.html`、`tests/workbench/v43-prism-svg-touch-inspection.test.cjs`、本文档。独立 04 数学、试验页面范围；不改 07 公共播放器、08 OCR、09 CI、公共静态打包和 Cloudflare。
