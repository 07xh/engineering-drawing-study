# V3.1 08｜图像候选与已确认数学条件间的受控接口

关联 [08 #234](https://github.com/07xh/engineering-drawing-study/issues/234)、
[数学 Gate A #240](https://github.com/07xh/engineering-drawing-study/issues/240)。

## 目标

让将来的图纸 OCR / 视觉图元识别结果可以**安全、可追溯地进入已经验证的二维求解器**，而不是由 AI 生成圆心、切点或 SVG 答案。

当前仅实现接口和验证测试，不包含 OCR、上传、识图模型、图像储存、用户身份认证或公开网页的上传控件。

## 接口

`prepareConfirmedFillet(candidateDraft, review)`

- `candidateDraft` 是不可信的识图候选；必须给出 `schema = draftai-recognition-candidates/0.1`、有边界的原图宽高、1–200 个标注候选。每个候选带 `id`、`bbox=[x,y,width,height]`、`kind`、`confidence`。
- `review` 必须来自独立的可信确认交互，而**绝不能直接转发识图模型的 JSON**。它含被接受的题型、`unit='mm'`、revision、每个必需条件的 `{value,sourceId,confirmed:true}` 和可选分支/圆弧方向。
- 每个必需几何坐标/半径都必须明确确认并能追溯到有效的原图标注；否则返回 `needs-confirmation` 和缺失字段列表，不输出数学输入。
- 成功时返回 `ready-for-math`、`input`（兼容现有 `createConfirmedFilletSession`）、`fieldSources`（bbox/置信度溯源）。**不输出数学求解或全局唯一性证明。**

注意：这个适配器不能单独证明 `review.userAccepted` 真的是人点击的；这需要以后可信 UI 的事件来源保障、身份与会话边界。它仅强制两个独立参数的格式及条件完整性，不是加密的认证机制。

## 验收

`node --test tests/workbench/v31-recognition-confirmation.test.cjs`

涵盖三类实际有限几何圆弧题（确认→01 typed 输入→02 真数学→07 V5）、仅候选无确认、缺失字段、伪造来源 ID、单位 px、无效图片/越界 bbox、退化几何、OCR 伪造已验证结果不得混入数学模型。

没有在当前页面加入上传控件或储存私人照片，不改 Cloudflare、公共构建或数学求解器。下一步：08 图元检测与尺寸关系识别的真实离线模型，以及可信逐项确认 UI。
