# DraftAI 08 V3.4｜浏览器原生 OCR（可用性检测、纯本地实验）

本增量提供一个**真正调用浏览器文字检测 API** 的入口，而不仅是手写 R/Φ 字符串解析器。

## 行为
- 若当前浏览器暴露 `TextDetector`（Shape Detection 文本检测接口），对当前用户**本地选择**的图片进行最大边 1280 像素的 Canvas 缩放，执行 `new TextDetector().detect(canvas)`。
- 得到的原始文字候选经过 `recognition/dimension-notation-candidates.cjs` 的 R / Φ / Ø / ⌀ 严格语法与图像 bbox 校验，记录**原图像素位置**和待复核的半径/直径数值。
- 浏览器没有提供 `TextDetector` 时返回 `status:'unsupported'`，不加载远程引擎、不上传图片，也不返回假识别结果。
- 对接口异常、资源超限、非法 bbox、安全约束不符的文字**失败即拒绝**。
- 浏览器原生 API 通常没有校准的置信度，因此 `recognitionScore:0` 只是“未知”，**不是 0% 或 100% 准确率**。

## 尚未解决
- TextDetector 不是所有浏览器的标准可用接口，具体 Android/Chrome 支持情况需实机核验。
- 识别出的文字只能作为 OCR 候选，`confirmed:false`、`requiresHumanReview:true`，不能拿到 `SolveResult`、毫米比例或最终几何唯一性证明。
- 部分检测器将 `R` 与 `8` 拆为两段、拍照低对比、旋转字体、尺寸引线跨多个文字区域时可能漏检。OCR 字段与哪个圆对应，仍需人工确认。
- 未来可另接隐私审核通过的离线模型，但不能因浏览器不支持 TextDetector 而自动使用外部 OCR 服务。

## 开发验收
`node --test tests/workbench/v34-browser-native-dimension-ocr.test.cjs`

使用可注入 TextDetector 测试替身确保**确实读取 Canvas 图像帧调用 native detect()**；验证 R/Φ 提取、像素回映射、异常与能力缺失回退、没有文件上传或代替数学求解。

对应任务 #234，端到端 Gate B #240，09 独立审核 #243。
