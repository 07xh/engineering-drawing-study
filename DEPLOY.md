# DraftAI 公开几何工具部署手册

> 2026-10-21 更新。此项目与 Firefly 个人博客独立；以当前 Worker `engineering-drawing-study` 与 `wrangler.jsonc` 为准。

## 部署安全原则

- **只发布 `dist/`，绝对不要将仓库根目录 `.` 当作网站输出。**
- `scripts/build-static.cjs` 使用公开白名单复制 39 个基础工具文件项，并打包 Three.js 可视化代码；教材专属知识页、原题描图、审核数据不进入公开产物。
- 仓库目前仍是公开的。隐藏网页路径或缩减 `dist/` 不会使公开 Git 历史中的内容变为私有。需要对源文件进一步保密时，必须另行管理仓库可见性和历史内容。
- 模型密钥、个人作业照片、老师提供的教材扫描和私人记录不得进入公开仓库、`dist/` 或客户端脚本。
- `robots.txt` 不能提供访问控制。

## 当前 Cloudflare Worker

`wrangler.jsonc`：

- Worker 名称：`engineering-drawing-study`
- 资源目录：`./dist`
- 构建入口：`node scripts/build-static.cjs`
- JS 依赖按项目 `package.json` 安装；构建时本地打包 Three.js，生产页面无需外部 Three.js CDN。

GitHub Actions `.github/workflows/check.yml` 校验源码与打包资源，但其成功**不等于正式 Worker 已上线**。

## 预览与发布流程

1. 基于 `main` 创建功能分支并提交 PR。
2. 运行全套 GitHub Actions。关注几何算法、来源审核、静态依赖与公开清单检查。
3. 在 PR 中查看 Cloudflare Worker 的预览评论。**必须核对评论对应的 commit SHA 是本次最新提交**。
4. 打开预览链接，验证首页、公开说明及各工具页面，并检查手机与安卓平板横屏体验。浏览器未验证时不要声称视觉验收通过。
5. 检查是否有 `knowledge/index.html`、`labs/verified-exercises.js`、`labs/source-fidelity.html` 等源资料经公网直接访问；公开版应返回 404。
6. 所有检查通过后合并到 `main`。
7. 到 Cloudflare Workers & Pages 中核对该 Worker 的 Production Deployments，必须显示已合并提交的部署成功状态，再打开正式地址检查实际内容。
8. 若页面或部署失败，回滚至上一个经过验收的 `main` 提交并重新部署。

### 配置注意

在 Cloudflare Worker → Settings → Builds 中，确认 GitHub 集成连到 `07xh/engineering-drawing-study`，Production Branch 是 `main`，并配置正确构建命令，使 `dist/` 在部署前生成。生产命令与 Preview 命令按当前 Cloudflare Workers Builds 配置执行，不要采用旧 Pages “输出目录为仓库根目录”教程。

## AI 功能

目前只公开几何工具，AI 图片上传/自动解题服务尚未上线。

将来如需个人 AI 功能，先建立服务端鉴权、秘密变量、请求配额与私有文件存储；限流不能代替个人身份验证。公开 AI 试用必须作为单独的安全评审和发布任务。

## 账号与成本

不在此文档中记录任何实际密钥、账号令牌或私人域名配置信息。Cloudflare/GitHub 权限和 Secret 必须通过对应平台安全设置管理。
