# DraftAI V3.8｜斜截圆柱真实动态作图独立浏览器实验台

这批是对已合并 [#291](https://github.com/07xh/engineering-drawing-study/pull/291) 的**完整 SVG V5 帧合成器**进行真实网页接线，不再停留于内部 Node 数据和数学 DTO。独立于当前 08 AI 图片识图和二维圆弧工作台，不更改其 UI、文件或求解器。

## 访问路径和已完成能力

静态构建页面：`/labs/cylinder-cut-live.html`。网页在本地浏览器重算一个已知 Z 轴有限圆柱和指定截平面，采用 04 的真实解析求交、端盖弦/侧面截交线闭合周界、用户确认的保留实体正/负侧及三个数学观察方向，生成与真实 V5 时间轴逐笔对应的 SVG。

- 手工编辑圆柱半径、高度、平面点、平面法向、保留实体侧及 V/H/W 三个视向正反（mm）。
- V 上、H 下、W 右的同纸研究性投影与 45° 深度转移辅助线；原始基本体、辅助线、解析截弧折线及端盖弦分层。
- 播放/暂停，按**实际 V5 step startMs** 上一步/下一步、进度滑动、0.25~4 倍速；更改参数时立刻使旧画面失效，并从新数学条件重新计算。
- 保留/隐藏辅助线、可视黑白模式、使用 Blob 在浏览器本地保存**当前这一帧**为 SVG，不发送用户数据或请求远端生成答案。
- 可见实线、遮挡虚线及未确定线型由真实三维射线证明驱动，使用已合并 PR #290 独立 SVG 渲染器，屏幕上不再全部画成假实线；每条结果线段有数学截弧来源 ID。

## 源码与构建

独立模块：
- `labs/cylinder-cut-live.html` — 手机/平板自适应的实验控制台。
- `labs/cylinder-cut-form.cjs` — 手动数值确认与 V/H/W 正交观察方向解析，拒绝空值、无穷值、零法向、尺寸/方向无效。
- `labs/cylinder-cut-live-entry.cjs` — 浏览器事件、真 V5 播放器、步骤寻址、当前 revision 失效和本地下载。
- 只对 04 专属 `engines/spatial/sections/cylinder-visibility-frame-svg.cjs` 暴露 V5 的原生 `createPlayer` 与每一步真实 `startMs/endMs` 元数据，未修改 V5 核心。
- `scripts/build-static.cjs` 只新增页面白名单以及单独 esbuild 自包含 `labs/cylinder-cut-live-bundle.js`；不发布 `engines/**` 源文件、不修改原圆弧站点入口。
- `tests/workbench/v38-cylinder-cut-browser-lab.test.cjs` 覆盖数学单位与输入、严格视向、真实 V5 速度和步骤时间/过期失效、网页控制绑定及静态安全白名单；既有 #291 数学帧测试继续运行。

## 验收与安全边界

用户必须先确认圆柱、截平面以及保留哪半空间，浏览器绝不能通过照片推测。没有文件上传、登录、API 密钥、云端 AI 调用。仅一个 Z 轴有限圆柱和非竖直截平面的数学模型；拒绝或阻断病态、端盖共面和无数学证明的输入。

仍然不是正式教材答案或完成的产品：目前 `completeEngineeringDrawingVerified:false`、`firstAngleObserverConventionsSignedOff:false`，平面切出的截面面域及剖面填充未求证，可见性转换只对单实体和边界开区间成立。默认正交视向虽与显示坐标轴匹配，**尚未经 03/09 对正式第一角法国内标准的审核**。渲染里的虚实线是几何实验结果，不应作为未经校对的制图标准答案。

合并和 CI 成功仅证明确认的源码与构建通过测试，**不等于 Cloudflare 正式发布 Active SHA 已确认，也不能代替 Android 平板的实际触控和 SVG 下载验收**。页面虽进入静态构建白名单，正式生产部署与平台权限仍由 09/00 统一发布制度控制。
