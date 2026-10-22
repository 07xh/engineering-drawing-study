# DraftAI V4.1｜静态发布源代码版本标记（公开审计用）

## 问题

GitHub PR、受保护 `main` 及其五项 Actions CI 全部成功，并不能证明 Cloudflare Worker `engineering-drawing-study` 已将同一份代码发布到生产环境。之前用户多次要求“合并后实际发布”，但 GitHub deployments API 在当前连接下不可用，且没有可核实的 Cloudflare 生产 Deployment SHA。

## 本增量解决什么

`scripts/build-static.cjs` 在当前公共 `dist` 和隔离 `dist-ui-next` 文件打包完成后，各自生成可公开读取的 **`draftai-build-info.json`**：

```json
{
  "schema": "draftai-public-build-info/1",
  "sourceCommit": "构建环境中实际检出的40位Git提交哈希，无法核实时为null",
  "sourceKind": "git-checkout / environment-commit / unavailable",
  "artifactType": "static-worker-assets / ui-preview",
  "commitIdentified": true,
  "deploymentVerified": false,
  "note": "This is the source checkout used for this static bundle, not confirmation of active Cloudflare production deployment."
}
```

仅当 `git rev-parse HEAD` 返回完整有效 SHA 时采用；否则仅在可信构建环境提供完整 `CF_PAGES_COMMIT_SHA` 或 `GITHUB_SHA` 时填写，均不可用便输出 `sourceCommit:null`，**不会把当前 main/latest PR 的 SHA 生硬写死进网页**。不包含账号、Cloudflare 密钥、环境变量全文、构建机绝对路径、私人照片、仓库访问 token 或个人配置。

## 怎样验证生产

1. Cloudflare 完成某次 Worker 生产部署后，打开你正在访问的**真实正式域名**下 `/draftai-build-info.json`。这不是某个猜测的 Workers URL，务必以 Cloudflare Worker Production 控制台中的实际域名为准。
2. 比较 JSON 的 `sourceCommit` 是否与希望正式发布的已合并且五项 CI 通过的 GitHub SHA **完全一致**；若为 `null`，明确表示无法追溯构建来源，不可宣称已上线。
3. 还必须在 Cloudflare **Deployments → Production Active** 验证同一版本确已成功激活，并在正式网页加载、安卓点按上做实际验收。此静态 JSON 仅是公开版源 SHA 旁证，不能取代 Cloudflare Active 记录、域名访问或对原版内容的一致性验证。

## 验收与安全

- `tests/workbench/v41-public-build-provenance.test.cjs`：纯函数测试 Git 实际 HEAD 优先、CI fallback、未知明确 null、隐私字段不泄漏、manifest 后置创建、保留不同 `dist` 目录隔离。
- 网站实际 `node scripts/build-static.cjs` 和 `node scripts/build-static.cjs --ui-preview` 通过 GitHub Site CI 执行；此模块不触碰数学、AI OCR、私人资料或 Cloudflare 凭据。
- 本轮不自动部署、不修改生产 Worker 设置。GitHub 静态构建成功仍不能宣称正式版本已经启用。

关联 #240 / #243，并配合 #308/#310 的安卓触控验收入口。
