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

GitHub Actions `.github/workflows/check.yml` 校验源码与打包资源，但其成功**不等于正式 Worker 已上线**。新增的 `.github/workflows/deploy-worker-github-actions.yml` 在 GitHub Runner 执行相同公开白名单构建，再用 Wrangler 直接部署现有 Worker，不消耗 Cloudflare Workers Builds 构建分钟。

## Workers Builds 额度耗尽：GitHub Actions → Wrangler 切换（2026-10-27）

**默认不抢占旧发布源**：新 GitHub Workflow 已入库，但 `push main` 自动部署受 GitHub Actions 仓库变量 `ENABLE_DRAFTAI_GHA_DEPLOY == 'true'` 控制，初始关闭。仅 `workflow_dispatch` 可在设置完密钥后先做受控首次发布。

1. **先确认当前 Active Worker**：Cloudflare Workers & Pages 中核对现有 Worker 名称为 `engineering-drawing-study`，并记录原来的 Custom Domain、Route 和任何自建环境绑定。不要新建 Worker 或改动域名/DNS。
2. **Cloudflare → Worker → Settings → Builds → Disconnect**：断开 *Workers Builds Git 仓库构建集成*，不是删除 Worker、域名或者 GitHub 仓库。这样 push 不会再次触发 Cloudflare 云端构建。
3. **GitHub → Settings → Secrets and variables → Actions → Secrets**：在此仓库设置 `CLOUDFLARE_API_TOKEN` 和 `CLOUDFLARE_ACCOUNT_ID`。不提交值到源码。令牌需要当前 Worker 部署权限；若已绑定自定义域名，仅更新代码一般不需要改变路由。
4. **GitHub → Actions → Publish DraftAI Worker (GitHub Actions + Wrangler) → Run workflow**：从 `main` 手动运行；构建过程从 `scripts/build-static.cjs` 生成 **仅公开** 的 `dist`，执行私有文件排除检查，然后 `wrangler deploy --config wrangler.jsonc --keep-vars`。该参数保留 Cloudflare 面板中的普通运行时变量；现有 Worker secrets 也由 Wrangler 保留。
5. **逐项验收**：对照 GitHub 最新 `main` SHA、Actions 部署日志及 Cloudflare Worker 的 **Active Deployment**；打开原有域名与 workers.dev 地址核对 UI / API，不把 GitHub CI 绿色当作 Active 已上线。若域名绑定或依赖资源有异常，停止后续自动发布并回滚到旧 Active 版本。
6. **验收通过才打开自动化**：将 Actions 仓库变量 `ENABLE_DRAFTAI_GHA_DEPLOY` 设为 `true`；后续 `main` push 使用 GitHub Actions 而不占 Workers Builds 分钟。保持自动 Cloudflare Git Builds 断开以免双重发布。

注意：`wrangler.jsonc` 此前没有声明自定义 Route / Custom Domain，新的 GitHub 工作流保持原 Worker 名称，不会主动配置、移除或变更路由。但**首次切换仍需验证真实 Cloudflare Active 域名配置**。如果 Workers 运行时已在 Cloudflare 配置额外 KV、R2 或 D1 等绑定，先同步核对 `wrangler.jsonc` 和面板绑定后再执行部署，避免将隐含绑定错误覆盖。禁止为了使 CI 变绿而跳过 M0–M5 数学门禁。

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

以前使用 Cloudflare Workers Builds 时，需要在 Cloudflare 中连接 GitHub 并由 Cloudflare 构建。在本文件 2026-10-27 的 GitHub Actions + Wrangler 切换步骤完成后，应保持该 **Builds Git 集成断开**；生产构建与静态资源白名单由 GitHub Runner 执行，严禁设置输出目录为仓库根目录。

## AI 功能

目前只公开几何工具，AI 图片上传/自动解题服务尚未上线。

将来如需个人 AI 功能，先建立服务端鉴权、秘密变量、请求配额与私有文件存储；限流不能代替个人身份验证。公开 AI 试用必须作为单独的安全评审和发布任务。

## 账号与成本

不在此文档中记录任何实际密钥、账号令牌或私人域名配置信息。Cloudflare/GitHub 权限和 Secret 必须通过对应平台安全设置管理。
