# DraftAI V3.7 · 可重建合成像素识图质量回归

## 实际运行的检测器

`node scripts/report-recognition-quality.cjs` 会直接加载已实现的 `detectLineCandidates`、`detectCurveCandidates`，不是人工假造检测结果。四幅**程序在运行时绘制**的二维 RGBA 基准分别是：清晰水平有限线段、完整黑线圆、约 125° 圆弧、空白白纸。真实检测结果送入已合并的 #286 一对一质量评测引擎，打印每个图像的 TP/FP/FN、精准率/召回率/F1、未匹配真值及多余候选。

额外的 R12 / Φ20 文字用**明确模拟的 TextDetector 返回记录**经过真实 OCR 解析器与 bbox 验证，用来检查文本解析链路，**没有调用实机 OCR 引擎**。其中 M10 应过滤。

## 保守验收条件

- 必须在清晰、无透视的指定合成图上找出已标注的有限水平线、闭合圆和开口弧，不能完全漏检。候选过多时会在 `unmatchedPredictions` 明确统计，不能遮掩。
- 空白图不应生造线段候选。
- 中文/英文文字解析候选在独立的 OCR 模拟 token 数据里验证，但不能据此报告 Android 浏览器识别准确率。
- 自有生成原图，且不引用私有教材、上传图或受版权限制的图片；只包含测试时生成的像素，不将基准数据或构造器发布到 `dist`。
- 提交格式 `draftai-synthetic-recognition-quality/1`；明确 `realPhotoCount:0`、`liveOcrEngineRuns:0`，避免用合成样本分数充当真实工程图准确率。

## 如何复现

```sh
node scripts/report-recognition-quality.cjs
node --test tests/workbench/v37-recognition-quality-metrics.test.cjs tests/workbench/v37-detector-quality-regressions.test.cjs
```

GitHub 工程工作台工作流自动执行 `tests/workbench/*.test.cjs`，因此这些评测也是每次对应 PR / push 的回归检查。

## 未完成

这仍不是照片真实集：没有摄像头透视、压缩阴影、螺纹标注、封闭相贯线、密集交线、遮挡和真实 Android OCR 支持的验收。正在并行进行的 #279 检查像素→人工确认→真数学→V5 完整链，属于不同维度，不要把两个测试等同于真实题图性能。后续需要用户自己制作或明确授权的非私密真实图片样例，匿名标注来源、数据使用许可、标注者一致性以及设备侧图像质量评测，才能报告实景统计。

关联 #234、#240、#243。CI 通过只表示源代码回归成功，Cloudflare Active SHA / Android 实机仍须独立核实。
