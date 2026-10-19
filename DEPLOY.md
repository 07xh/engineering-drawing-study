# 一次部署，后续自动更新（GitHub + Cloudflare Pages）

此网站完全独立于 Firefly 博客，不要上传到 Firefly 仓库。

## 第一次发布

1. 仓库 `07xh/engineering-drawing-study` 已创建，使用 `main` 分支，项目与 Firefly 完全独立。
2. 网站文件提交至该独立仓库根目录，并等待 GitHub Actions 检查通过；不要将密钥和课程扫描页上传到仓库。
3. 打开 Cloudflare 仪表盘 > Workers & Pages > 新建应用 > Pages > Git 连接，选择新仓库。框架设为 None，生产分支设为 `main`，构建命令留空，输出目录为仓库根目录 `.`。
4. 先使用 Cloudflare 分配的 `*.pages.dev` 临时地址检查课程、动画和题库。检查通过后，在 Pages 的 Custom domains 中增加可选子域名 `drawing.0701000.xyz`，并按 Cloudflare 提示配置 DNS。该子域名只是建议，尚未建立。

## 后续更新

新建功能分支 → 更新 `content.js` 或其他文件 → Cloudflare 预览构建 → 浏览器测试 → 合并到 `main` → 正式网站自动更新。学生打开原网址就会看到新内容，不再下载新版本的 HTML 文件。

## 不要选择错误的首发方式

如果目标是 GitHub 提交自动更新，一开始就使用 Cloudflare Pages **Git integration**，不要先创建同名 Direct Upload 项目。Cloudflare 官方文档明确指出 Direct Upload 项目无法切换到 Git integration。

## 在线内容管理后台

当前没有浏览器内的真实发布后台，也没有用户账户或云同步；日后要做免代码编辑，需要单独开发受身份验证保护的后台。GitHub 读写 Token、Cloudflare 凭据不得出现在公开网页文件中。

## 进度保存

本机 localStorage。浏览器换设备不会同步，清除网站数据会清除记录；将来添加正式账户前，不应承诺跨设备自动同步。
