# DraftAI 统一界面

默认 `node scripts/build-static.cjs` 构建正式新版至 `dist/`，不显示预览标记。`--ui-release` 与默认命令一致。`--ui-preview` 输出独立 `dist-ui-next/`，带预览标记且不会修改正式产物。

仅发布 `dist/`；保留旧工具 URL 与数学、识别、V5、导出接口。新增界面状态只管理布局、面板、焦点与画布缩放。

## 发布与回退

用户在明确得知缺失验收项后于 2026-10-22 指示继续正式发布。安卓实物触笔、读屏、完整图片导入与下载保留为发布后待验收，不宣称已通过。

发布前主分支基线 `7f6552f`。回退时撤销本次 UI 集成提交并重新构建部署，以保留其他功能开发；也可由 Cloudflare 发布负责人切回上一版已确认的 active deployment。CI、Cloudflare 构建、线上字节及设备验收分别记录，详见 `docs/superpowers/UI-REFACTOR-ACCEPTANCE.md`。
