# DraftAI V3.8｜用户自选工程题图的本地质量验收会话（09）

产品仍然是**个人 AI 工程制图自动解题与 V5 动态作图系统**。本功能专门为识图能力建立可复测的真实图片错误证据，避免以合成图通过率替代真实照片结论。

## 已实现（无界面版基础）

`createPhotoQualitySession()` 提供 `loadImage(originalSize,analysisRGBA)`、`addAnnotation`、`removeAnnotation`、`clearAnnotations`、`snapshot` 和 `report`。

- 浏览器在本地读取用户自行选取的图片、缩小到有界 RGBA 数据后，可直接调用原有 08 的**真实有限直线和圆/弧候选检测器**；将检测到的图元转换回原图像素尺度，记录异常无效候选。
- 用户必须再标注真实线段端点、圆心/半径、圆弧、R/Φ 文字区域或箭头尖端，才能产生 TP/FP/FN 和 Precision/Recall/F1；没有标注时返回 `needs-manual-annotations`，而不是错误地报告 100%。
- 更换照片、异常图像、清除照片即丢弃此前的所有标注、候选和报告。对坐标、尺度、最大像素及标注数量作严格校验。
- 会话仅保留图片固有宽高、识别图元的**原图像素坐标**和人手标注。**不保留照片 RGBA 字节、Blob、文件名、原题文字正文、网络地址或用户认证信息。**
- 导出的纯 JSON 报告明确 `imageBytesIncluded:false`、`filenameIncluded:false`、`independentReview:false`、`notRealWorldAccuracy:true`。后两者说明单人手工标注没有经过独立审阅，不能直接作为真实场景商业性能宣称，也不是几何数学证明。

## 边界与下一步

本 PR 是独立的计算与校验模块，未修改界面或正式构建。**下一 PR 应提供用户可操作的本地图像标注页**：标线段/圆/弧/文字框、点击运行本地检测、查看一对一误差，明确自愿导出不含图像的报告；不应将用户照片上传到仓库或存储服务。

支持的二维曲线检测仍只是一种轻量启发式，复杂扫描图、图层交叉、透视及 TextDetector 不支持的 Android 设备可能失败。即使误差较小也不代表通过 01/02/07 的毫米制图/G1/V5 验证。

回归：`node --test tests/workbench/v38-photo-quality-session.test.cjs`，并通过仓库五组 GitHub CI。避免修改并行 #279 R0 端到端测试文件。

关联 #240 总控、#234 AI 识图、#243 验收。
