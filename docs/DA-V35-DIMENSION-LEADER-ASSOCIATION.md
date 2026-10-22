# DraftAI V3.5 / 08｜工程尺寸引出线端点关联（候选，不是证明）

目标：在已有 R/Φ OCR 文本框与直线、圆/圆弧候选之间添加**真实几何关系线索**，减少简单的“谁离标注最近”误关联，但不得直接导出任何数学真值。

## 本轮真正交付
- `recognition/dimension-leader-association.cjs`：对直线识别器的像素起止端点执行有界映射，保留原图像素 `from/to`，并检查 bbox、候选 ID 与图像尺寸。
- `rankLeaderLineLinks(dimension,lines,curves,image)`：对每条候选有限直线双向尝试，一端接近 R/Φ 字符框，另一端接近圆/弧 **bbox 的轮廓边界**时给出 `OCR → line → curve` 关联假设。返回文字端点距离、曲线轮廓端点距离与匹配方向；全部候选可同时保留，统一 `requiresHumanReview:true`。
- `labs/local-line-candidates-ui.cjs`：原有自动线段候选现在保留原图像素坐标下的端点，不再只有包围盒；既有手动来源确认与 V5 验证不会改变。
- `tests/workbench/v35-dimension-leader-association.test.cjs`：有向/反向引线、两个可能圆、孤立直线误报、无关圆、越界/非有限点、保持多解与数学证明隔离。
- 更新原有 08 候选来源契约测试以匹配端点增强（没有删除既有数学测试）。

## 必须说明的数学边界
- 此算法**没有检测箭头的尖端形状**，没有判断尺寸线和真实轮廓线是否连续；所谓“引出线”仍是有限直线候选。
- 匹配只到拟合曲线的矩形轮廓 bbox，**不是已验证圆周与箭头切点**，在重叠圆、引线折角、文字/尺寸线上容易出现多个错误候选。
- 候选几何单位为图像像素，不能推出毫米比例、R/Φ 的真实属性，也不能决定唯一数学解。
- 本 PR 不直接改 OCR 主界面文件，以避免与并行 PR #269 同时编辑造成冲突；后续可在 #269 完成后将该模块的建议显示到界面。
- 不采集原题、不上传文件、不调用外部 OCR、不处理私有教材。

验收：`node --test tests/workbench/v35-dimension-leader-association.test.cjs` 及主仓库五类 CI。关联 #234/#240/#243。
