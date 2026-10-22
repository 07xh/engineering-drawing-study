# DraftAI 新界面预览

这是独立预览实现。`node scripts/build-static.cjs` 继续生成旧版 `dist/`，不会因本分支存在而提前切换生产。

## 构建与查看

```sh
npm install --no-package-lock --no-audit --no-fund
node scripts/build-static.cjs --ui-preview
node scripts/check-static-site-dependencies.cjs --ui-preview
```

在浏览器打开 `dist-ui-next/index.html`。所有应用脚本和样式均为相对路径，本地预览不需要后端服务；部分本地图片/Canvas/浏览器原生 OCR 能力受浏览器安全上下文和接口支持限制，以 HTTPS 预览实测为准。

主要工作台：`dist-ui-next/labs/auto-fillet-live.html`、`point-projection-live.html`、`circle-fillet-live.html`。手机在画布下方切换条件、步骤与复核面板；画布可放大、缩小、适合视野和进入专注模式，Escape 退出专注。菜单使用原生 details，面板支持左右方向键、Home/End。

## 实现边界

- enhance-page.cjs 在构建后增强已公开 HTML；workbench-layout.cjs 仅重排原应用节点。
- 原应用脚本、控件 ID、单位、验证逻辑和下载逻辑不变，主分支新增控件也必须保留。
- ui-next.js 只控制面板、焦点和画布 CSS 缩放，不维护求解状态，也不读写用户持久记录。
- home.cjs 提供真实能力入口，不生成虚构历史或已接入的题库服务。
- linkedom 是固定版本的构建/测试依赖，不进入浏览器应用包。

## 验证与发布门槛

```sh
node --test tests/ui/*.test.cjs
```

新增 DOM 集成测试运行真实打包应用，对比新旧几何、分支状态、教学模式、无效输入、播放失效和导出禁用；这不能替代真实浏览器或安卓设备验收。

正式切换前须完成：390/768/1024/1440px 浏览器布局、键盘/读屏、安卓触笔及图片候选叠加坐标、SVG 与步骤包实际下载；同步最新 main 并重跑全部 CI。测试未通过或证据缺失时不得将此预览目录配置为生产资源目录。

通过全部门槛后在同一个发布 PR 中修改正式构建默认映射，继续以 `dist/` 为唯一生产资源目录。不要改为发布仓库根目录，不要复制源码目录到公开产物。保留切换前生产 deployment ID 与提交 SHA；回退时撤销切换 PR，重新构建上一版并核对线上资源指纹。当前分支不包含该最终切换。
