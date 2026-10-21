# DraftAI 自动合并与正式自动发布｜启用指南

状态：代码已在独立 PR 开发和 CI 测试；截至 2026-10-21，主分支未保护、Cloudflare 配置保存状态及 Active Version 未核实，因此真正的无人值守生产发布尚未启用。不要把代码完成视为上线成功。

## 系统模块和依赖顺序

1. PR #155：离线发布资格、Git SHA/文件校验、私密路径审计和回滚模拟。
2. PR #156：真正运行的 GitHub Actions release-security 检查，无路径过滤、无部署凭据，执行 97 项安全测试及真实 dist 40 文件指纹审计。
3. PR #157：受保护 main 的自动发布和故障回滚代码。只允许范围极窄的 site-ui.css 修改，拒绝数学内核、CI、权限、密钥、教材、构建等高风险变更。
4. PR #158：带 SHA 锁定的自动 squash 合并。必须在 main 受保护、PR 来自原仓库、源代码 diff 可验证、两个检查 validate 和 release-security 全部成功后才能执行。

这些都是叠加式独立 PR，#156 目标为 #155 开发分支，#157 目标为 #156，#158 目标为 #157。00 必须先验收 Cloudflare 上传模式，再安排安全 rebase/cherry-pick，确认各自变更文件与 commit，按序进行。不能未经差异审查直接把全部叠加 PR 并入 main。

## GitHub 主分支保护（由具有管理员权限的账户配置）

Settings → Rules → Rulesets（或 Branches）→ 新建针对 main 的规则：强制 Pull Request，禁止 force push/删除/无审批绕过，要求 linear history/squash merge，配置 stable required checks 为 validate 和 release-security。注意必须先让这两个检查真正存在于 main，确认普通 CSS-only PR 上均会运行，再启用为 required；不要把有 paths filter 的数学工作流直接设置为所有 PR 的 required check。

这里的“自动批准”实际是符合规则后执行自动 squash 合并，不是虚构一份人工代码审核。数学、认证、密钥、存储迁移、部署配置和其余非白名单修改始终需 00/09 审查。

## Cloudflare Workers 构建设置（先保存后复查）

Workers & Pages → engineering-drawing-study → Settings → Build：
Production branch = main
Build command = node scripts/build-static.cjs
Deploy command = npx wrangler versions upload
Root directory = /

保存设置、刷新确认仍为 upload-only。不要保留 npx wrangler deploy 作为 Git 主分支直接触发命令；否则合并 main 可能绕开项目内的所有发布门禁直接生产上线。

从 Deployments 查看旧 100% Active Worker Version ID、生产 URL、上线时间，并核实私有资料页面返回 404。注意 Worker 版本回滚不回退 KV、R2、D1 数据。

## GitHub Secrets and variables → Actions（仅管理员一次性配置）

Secrets（绝不要粘贴到聊天、Issue、PR 或 git）：
- CLOUDFLARE_ACCOUNT_ID：Worker 所属账户 ID。
- CLOUDFLARE_API_TOKEN：尽可能窄权限的 Worker 脚本读写与部署令牌，限制到相关 Worker。
- DRAFTAI_MERGE_TOKEN：当前工作流实现要求将**专用、非管理员、仅限本仓库的 fine-grained PAT**配置为 Secret，授予合并所需的 Pull Requests/Contents 写权限，设置有限有效期并安排轮换。不得复用默认 GITHUB_TOKEN。GitHub App 安装令牌通常短期有效，**不能把一次生成的安装令牌永久当作 Secret**；若改用 GitHub App，须另行接入每次工作流动态签发令牌的步骤。GitHub 官方明确，GITHUB_TOKEN 造成的 push 通常不会触发后续 Actions，会让自动合并后的生产 CI 断链。

Variables（初始开关都为 false）：
- DRAFTAI_PRODUCTION_ORIGIN：经核实的 HTTPS 生产根地址。
- DRAFTAI_PRODUCTION_HOST：生产 URL 的准确 hostname。
- DRAFTAI_BOOTSTRAP_ACTIVE_VERSION：首次老版本缺少 Git SHA 标签时，由管理员从 Cloudflare 确认的旧 Active Worker Version UUID。
- DRAFTAI_AUTO_MERGE_ENABLED：false。
- DRAFTAI_AUTO_RELEASE_ENABLED：false。

建议创建 GitHub production environment，限制部署分支和凭据可见性；若环境要求每次人工批准，将不符合无人值守目标，需在首次 00/09 安全验收后改为自动规则控制。

## 初次启用验收

第一阶段（仍 false）：验证保护 main、两个真实 CI、upload-only 已保存、生产 Active Version 与回滚地址及凭据均已正确配置。
第二阶段：在明确不会污染生产的隔离预览中演练低风险 CSS PR，确认专用合并令牌确实触发新 main push 的 validate 与 release-security；Worker upload 必须带 draftai-完整40字符GitSHA 标签。
第三阶段：00/09 受控演练一次生产上线/故障回滚，核对 Worker Version、部署来源、GitSHA、公开页面 200 HTML、内部源路径 404 及旧版本恢复。
最后由管理员将 DRAFTAI_AUTO_MERGE_ENABLED 和 DRAFTAI_AUTO_RELEASE_ENABLED 切换为 true。自此只有最严格、低风险、经全部测试通过的 CSS 改动自动合并和自动发布，高风险更新默认停止。

重要限制：这是代码和 CI 可执行方案，不代表本聊天已获得 Cloudflare 控制台权限、GitHub ruleset 管理权限或生产部署令牌。本轮未启用开关、未合并 main、未做真实生产部署。

参考：
https://developers.cloudflare.com/workers/versions-and-deployments/
https://developers.cloudflare.com/workers/wrangler/commands/workers/
https://developers.cloudflare.com/api/resources/workers/subresources/scripts/subresources/deployments/
https://docs.github.com/en/actions/concepts/security/github_token


## 新增 P0：核验实际生效的 Main Ruleset，不只看 protected=true

自动合并与自动发布现在会通过 GitHub 的只读 API
\`GET /repos/07xh/engineering-drawing-study/rules/branches/main?per_page=100&page=1\`
核验**真正处于 active 状态并应用于 main 的规则**，而不再仅凭 \`main.protected=true\` 即可继续发布。

在 GitHub Settings → Rules → Rulesets，为 \`main\` 正式启用并验收以下五类规则：

1. \`pull_request\`：修改 main 必须先通过 PR；试点 CSS 无人值守合并必须允许 \`squash\` 且有效规则的 \`required_approving_review_count=0\`。若设置必须人工审核，则脚本会阻断自动合并，仍可由人审核后再继续发布。
2. \`required_status_checks\`：必须明确要求 \`validate\` 和 \`release-security\` 两项稳定检查，且 \`strict_required_status_checks_policy=true\`，避免相对过期 main 的 PR 无条件合并。
3. \`non_fast_forward\`：禁止强推。
4. \`deletion\`：禁止删除 main。
5. \`required_linear_history\`：维持线性历史，以便将受控 squash main 提交与已验收 Worker Version 绑定。

**注意**：本项目当前通过的 CI 是开发分支中执行的 \`release-security\`；直到相关 PR 经 00 串行验收并整合进入 \`main\`，这个检查都不能视为生产主分支已受保护。也不要提前把尚不存在的检查设置为 Required。

### 规则核验边界

GitHub 只读 API 可提供“哪些规则实际生效”的证据，但对于缺少管理权限的 token，**规则集的 \`bypass_actors\` 可能被省略**。因此不能将“规则检查通过”宣称为“已经证明管理员或应用没有绕过权限”。00/09 需要从 GitHub 管理控制台逐项确认无不受控绕过，留下只读验收记录。若控制台有分支保护但没有可读的活动 Ruleset，本自动化**保守拒绝自动发布**，直到迁移到有可验证证据的活动 Ruleset。

### 最近一次真实 Actions

在 \`feat/09-guarded-auto-merge-20261021\` 分支的新规则核验开发中，\`release-security\` 真实 Actions 成功完成 **97/97 基础安全测试 + 53/53 生产发布/自动合并/有效规则测试**，实际网站构建和 **40** 项 \`dist\` 文件审计成功。此记录仅证明**当前分支候选代码与离线/模拟场景**通过检查；没有配置 GitHub 主分支保护、没有执行真实 Cloudflare 发布，也没有验收真实回滚。

参考 GitHub 文档：
https://docs.github.com/en/rest/repos/rules#get-rules-for-a-branch
https://docs.github.com/en/rest/repos/rules#get-a-repository-ruleset
