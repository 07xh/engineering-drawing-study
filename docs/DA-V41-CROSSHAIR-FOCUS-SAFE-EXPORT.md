# DraftAI V4.1｜五点触控坐标自检自动定位与安全导出

基于当前 **已合并的 V4.1「浏览图纸 / 标注图元」模式**：本 PR 不重复造第二套模式，不覆盖并行专项的页面事件。在放大后使用「开始五点触控坐标自检」时，自动按下一个橙色十字在**原图像素坐标**中的位置计算 `stage.scrollLeft`、`stage.scrollTop`，确保手机和平板可在图纸可视窗口内尽可能居中点击。逐点完成后自动定位下一个；改变缩放也重新定位。不会修改图元、OCR 或评测基线。

## 安全导出

- 在页面增加 **「导出五点诊断 JSON」**，只有五点全部完成才允许用户主动导出。
- `labs/photo-qa-touch-report.cjs` 输出严格固定结构：五个原图像素点按偏差、平均/最大偏差、版本与局部人手测试说明。
- 不包含用户题图的 RGBA/JPG/PNG、尺寸文字、图元标注、SHA 文件指纹、原图尺寸、原文件名、用户代理、设备标识或地理位置。报告不自动上传，不写入远程服务或浏览器持久化存储。
- 结果包括**人为点按中心的偏差**，不能据此认证触控硬件物理精度，亦不证明真实照片的图元识别准确率。

## 与并行工作及发布状态

原本 #314 想同时解决移动图纸和五点自检定位，但期间另一专项已把 V4.1 双模式方案合并至主分支。这里**仅移植尚未实现的自动定位与安全诊断导出**，保留已实现的 `qaModePan` / `qaModeDraw` 结构。不再改动双模式事件含义。

执行：
```sh
node --test tests/workbench/v41-mobile-crosshair-focus-report.test.cjs tests/workbench/v40-touch-safe-report.test.cjs
```

以及全部五组 GitHub Actions。CI 验证代码与网页产物，**不等同于用户真实 OnePlus/ColorOS 设备试用**。部署是否生效仍需 Workers Production Deployments 的 Active SHA 与网页打开确认。
