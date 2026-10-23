# DraftAI V4.1｜安卓浏览器的本地识图环境能力自检

现有 `/labs/recognition-qa.html` 通过纯本地浏览器 Canvas、SVG、触控事件、Web Crypto 和可选 TextDetector 实现人工真值验收。没有实机数据时，不能凭 Android 手机型号或 Root 状态猜测这些 Web API 是否真实可用。

## 新功能

页面增加「**检查安卓浏览器识图支持情况**」按钮。**只有用户主动点击**才进行本地能力检查；无需选择照片，也不上传照片、原题内容或设备信息。

自检结果给出：
- Canvas 2D 是否可以在当前网页创建最小画布上下文（本地识图基本条件）。
- 本地文件对象 URL 创建/撤销 API 是否存在（不实际读取文件）。
- `PointerEvent` API 是否存在（手机/平板手指与手写笔操作的网页事件基础）。
- 当前是否为安全上下文，并且 `crypto.subtle.digest` 是否存在（用来原图 SHA-256 严格校验人工标注基准）。
- 浏览器是否提供原生 `TextDetector` 构造器。如果没有，OCR 状态为 **API-absent / 未评测**；即使有，也仅是 API 存在，**不代表拍照工程图 OCR 能够运行或识别准确**。必须真正点击 OCR 并对照人工标注才能计 FP/FN。

源码 `labs/photo-qa-capability-check.cjs` 导出纯函数 `inspectLocalQaCapabilities`，便于回归测试浏览器环境差异；`labs/recognition-qa-entry.cjs` 只把可公开的 API 状态以文字显示。绝不收集/输出 `navigator.userAgent`、精确机型、设备硬件 ID、照片哈希、图片字节、用户登录信息或可追踪统计值；不做网络调用，不自动保存、不宣称“匿名设备认证”。

## 验收范围

`tests/workbench/v41-local-browser-capabilities.test.cjs` 覆盖完全可用、TextDetector 缺失、不安全上下文、无 Canvas、无 PointerEvent、无 Object URL、Canvas 创建失败、禁止设备标识串及可选按键绑定。新代码经全部数学/投影/工作台/静态构建五组 GitHub CI；独立 Cloudflare Production Active SHA 以及安卓机浏览器真实执行效果仍需实机核验。

这仅是“能力存在性”诊断，不是自动识图成功、硬件认证或数学解题证明。与 PR #313 的移动端浏览/描图修复和 #316 公开版源 SHA 追溯互补。
