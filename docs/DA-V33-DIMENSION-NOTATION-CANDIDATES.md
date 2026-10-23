# DraftAI 08 V3.3｜工程图尺寸标注候选解释与关联

本增量服务 DraftAI V3「陌生题图识别→用户确认→数学求解→动态作图」主线（#233、#234、#240），属于 **OCR 后处理数学输入安全层**。本身不包含 OCR 识别器，也不作为最终解题器。

## 输入与输出
- `parseNotation(text)`：严格识别 R/r 半径标注与 Φ/φ/Ø/ø/⌀/∅ 直径标注。接受十进制整数、小数点/逗号小数及明确的 mm/毫米后缀。数值必须有限、正数、有界；没有明确单位的文本只标 `drawing-unit-unconfirmed`，不冒充已确认毫米单位。
- `parseTextCandidates(tokens,image)`：输入未来 OCR 的候选文字、原图 `bbox`、置信度（仅模型侧分数），只保留可解析标注并标记 `confirmed:false`、`requiresHumanReview:true`、`mathematicalProof:false`。
- `rankDimensionLinks(dimension,geometry,image)`：把尺寸文本框与先前检测的整圆/圆弧 bbox 做原图像素距离排序，输出若干**并列的待确认关联建议**；不会替用户选择圆、写入圆半径或代替切点、G1 证明。

## 禁止自动解释的情况
- 螺纹尺寸 M20、普通“20”及字母 O20 不能自动转为 Φ20。
- R8±0.2、公差范围、R4–R8、不确定字符、破损 OCR 与单位 cm 均不自动落入单一“可靠数值”。
- 标注 R/Φ 所指向的几何对象需进一步结合尺寸线、引出线、箭头与用户核实，不能仅靠距离推断唯一对应关系。
- `proposedRadiusValue` 是待核对的数值换算建议，不是与像素拟合半径的校准关系，更不是数学 SolverResult。

## 实际闭环尚需
后续应引入有约束的本地 OCR 或明确鉴权的服务端识图，采集来自已授权/自制图片的正反例，显示候选与图元匹配供用户核对，再接已有 `image-field-review` 与 mm-only 数学引擎。不能把本文档或本 PR 宣传成 “AI 已会自动读出任何工程图标注”。

验收 `node --test tests/workbench/v33-dimension-notation-candidates.test.cjs`。没有密钥、私有资料、外部网络、构建/部署改动；先检查 GitHub 全套 CI，再考虑正式进入主分支。
