# DraftAI 04 V4.4｜真实四棱锥斜截面三视投影与 V5 自动构造

本批承接已合并 [PR #322](https://github.com/07xh/engineering-drawing-study/pull/322)，不是预制 3/4/5 边形动画，而是从**真实有限四棱锥八条空间棱和给定截平面**重新求交并验证真实闭合截面，再生成 V/H/W 三视图的 ConstructionStep 与原生 V5 时间轴。

## 正确适用范围

支持一个矩形底面、顶点在底面矩形内部且高于底面的轴向四棱锥（可偏心顶点）和用户明确的非退化空间平面。其截面可能是三角、四边、五边形；空间交点必须有真实 \`sourceEdgeId\`、\`sourceFaceId\` 及毫米几何残差，符合 #322 的严格可验证数学约束。

新增 \`engines/spatial/sections/rectangular-pyramid-v5-preview.cjs\`：

- 原始已知图：完整棱锥真实八条空间棱分别投影到 V、H、W 三个同纸模型视图。退化投影是点，不错误画零长线。
- 45° 辅助线：使用实际底面 Y 深度和统一毫米比例，真实计算辅助联系线，而不是贴现成截图。
- 特殊截交点：按照真实截点顺序，逐一绘制其 V/H/W 投影点，保留来源原始有限棱。
- 一般联系线：检查 V/H 相同 X、V/W 相同 Z、H/W 对同一 Y 深度执行 45° 转移的逐点数学恒等关系。
- 结果闭合轮廓：逐条从实际源面已经验证的多边形环生成三视截面边，保留 \`sourceSectionEdgeId\`、\`sourcePyramidFaceId\`。如果投影为一点，动画显示一个点，不能强行画虚假线段。
- 不修改 07 公共 V5 核心；直接复用 \`Motion.actionShapeAttrs\` 和 \`Timeline.compileTimeline\` 编译的有依赖作图步骤，支持已有 V5 速度、暂停、单步回退以及旧版 revision 的播放器失效接口。

例如底面 10×10、高 15 时，平面 \`x+y+z=3\` 产生 3 边形、\`z=8\` 产生 4 边形、\`x+y+z=15\` 产生 5 边形，**全部来源于实际棱锥和平面数学运算**。

## 保守边界

本模块仅包含数学驱动的 V5 ConstructionStep 数据及 960×680 研究性同纸布局，**尚未连接公开网页**。截面材料保留侧、观察者方向和棱锥空间遮挡尚未证明，所有结果 action 均设 \`visibility:'undetermined'\`。本阶段 **\`mathematicalPerimeterVerified:true\` ≠ \`visibilityVerified:true\`**，也不能声称正式第一角法或工程制图线型通过验收。

顶点共面、截切触点、共面整棱等尚未核验的退化情形继续 blocked，不制作假的时间轴。任意旋转棱锥、其它基本体、图像 AI OCR 自动解题暂不在本接口范围。

新增文件：\`engines/spatial/sections/rectangular-pyramid-v5-preview.cjs\`、\`tests/workbench/v44-pyramid-section-v5.test.cjs\`（9 组回归）和本文档。只新增独立 04 文件，不影响 07/08/09 共享核心、网站静态白名单和 Cloudflare Worker。
