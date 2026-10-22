# DraftAI V4.2｜人工照片标注到 R0 解题草稿的独立转换契约

## 用途与现有架构

DraftAI 产品仍是**个人 AI 工程制图自动解题与动态作图系统**。当前已经存在：
- `/labs/recognition-qa.html` 的个人题图本地识别、人工图元标注、同图 SHA-256 校验与可复用人工标注基准；
- `/labs/auto-fillet-live.html` 中人工核对两项图元、独立毫米比例与目标圆弧 R、数学分支、有向 G1 验证、V5 逐笔绘图。

本 PR 为这两者增加一个**独立、未接入网页入口的安全数据适配器** `photoTruthToReviewedDraft({pack,image,sha256})`，将前者已有的手画标注作为后者的待审核几何来源。仅一次性传递人工原图像素，不能跳过任何工程数学验收。

## 适配规则

1. **同图验证**：必须用 `validateAnnotationPack` 检查原图的 SHA-256、图片固有宽高、标注版本与全部坐标。还必须提供 `checkImage` 校验的本地图片基本元数据（字节数与媒体类型），但不传输原图像素或文件名。
2. **有限线段**：`line` → `segment`，原图像素 `from/to` 原样转到 `geometry:{frame:'drawing-px',...}`。水平/垂直线段生成具有正面积的边界框，避免几何审核组件因零宽/高崩溃。
3. **完整圆**：`circle` → `circle`，`center/radius` → `center/radiusPx`。若所谓整圆超出题图，拒绝将裁切后的弧线冒充完整圆。
4. **不支持的形状**：`arc`、`dimension`、`arrow` 不可作为现有 R0 两源图元的已证数学源，明确列在 `unsupportedIds`；不会把 OCR 文字直接换算成毫米，也不把局部弧充作整圆。
5. **审查状态永远是未确认**：新建 `ProblemDraft` 所有候选 `reviewStatus:'unconfirmed'`、`method:'manual'`、`confidence:0`，要求用户重新选择两项真实图元、修正几何、校准尺寸并作最终审核。这样任何从测试页带来的“人工真值”都不等于解题工作台的毫米制图数学证明。

## 数据和隐私边界

- 原 SHA-256 文件指纹必须匹配才能转换，但输出 Draft 本身不保留原始照片哈希、文件名、字节内容、EXIF、用户令牌或私人 OCR 文本。
- 返回 `modelUnits:null`、`geometryVerified:false`、`sourceScaleMathematicallyProven:false`、`solverReady:false`、`globallyUnique:null`，不可被 UI 当成数学唯一答案。
- 原图像素坐标不是毫米，画布等比例缩放、畸变、原点、Y 轴方向及尺量均需独立审核，不能靠人工标注的 ID 或数值推导。
- 没有网络访问、服务器上传或新增生产 Worker 权限。

## 运行中的实际数学回归

`tests/workbench/v42-qa-truth-to-r0-draft.test.cjs` 通过同一份用户原图像素标注，调用**现有** `prepareReviewedRasterImport`、`buildConfirmedInput`、`confirmedFilletTimeline`：
- 未经人工确认的输入被拒绝；
- 即使几何和毫米条件已审核，未选择数学分支及有向轮廓仍禁止验证动画；
- 只有明示数学分支、连接弧方向和两侧轮廓行进方向后，真实 02 求解器独立证明 G1，并生成 V5 动画。

## 后续网页接入

为避免与正在处理相同 `auto-fillet-live*.cjs/html` 的并行 [PR #320](https://github.com/07xh/engineering-drawing-study/pull/320)（R/Φ 校准）发生冲突，本 PR **不编辑解题网页文件**。待相关 PR 合并或由 00 完成冲突整理后，可把“选择旧人工标注 JSON + 当前原图文件 → SHA 校验 → 渲染人工审核候选”接入现有工作台；必须在用户主动选择文件时执行、保留原有 V5 数学限制。

**本 PR 只交付经过测试的内部桥接适配器，不宣称按钮已经上线、生产 Worker 已部署或安卓实机照片已验收。**
