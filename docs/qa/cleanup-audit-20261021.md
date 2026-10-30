# DraftAI 09 — 第一批安全清理与引用审计（2026-10-21）

> 审查基准：`main` @ `55625e46efe933fb3c5a8a918a9bd32c5451c423`。仅审查与清理退役测试脚本；不动数学内核、题目内容、UI、部署配置，不合并 main。

## 1. 范围、分类及引用链

GitHub Git Tree API `recursive=1` 返回 **211 个条目**且 `truncated=false`；其中包括目录。按后缀统计：88 个 `.cjs`、75 个 `.js`、17 个 `.html`、3 个 `.css`、16 个 `.md`，其余为配置及静态资源。本轮逐批读取 88 个 CJS、75 个 JS、17 个 HTML，搜索四个候选文件的直接提及及旧入口依赖，并检查主要文档和 CI。

| 分层 | 入口与引用关系 | 保留策略 |
| --- | --- | --- |
| 公开构建 | `scripts/build-static.cjs` 的 39 项白名单源文件 → `dist/`；`labs/dof-lab-three-entry.js` → esbuild → `dist/labs/dof-lab-three-bundle.js` | 不根据“是否入 dist”判断可删除 |
| 公开运行时 | `index.html`、`public-use.html`、`labs/*.html` → JS/CSS/SVG；HTML 页面通过 `script src` 加载依赖 | 所有现有公开页面保持不变 |
| 数学算法 | `labs/constraint-engine.js`、`labs/dof-lab-geometry.js`、`labs/free-geometry-core.js`、`labs/tangent-constraint-core.js`、`labs/composite-geometry-core.js` 等；`knowledge/` 内各类约束与求交模块 | 全部保护，等 01 几何契约确认 |
| 自动测试 | `.github/workflows/check.yml` → 82 个不重复的 `scripts/*.cjs` 调用；共有 88 个脚本 | 未进入 CI 的测试并不自动视为可删除 |
| 教材知识与核验 | `knowledge/` 教材知识、作图播放器、`labs/verified-exercises.js`、`labs/chapter-drawing.js` 与审核数据 | 虽未进入公开 `dist`，仍保留；注意公开仓库源码可见 |
| 文档与部署 | `README.md`、`DEPLOY.md`、`docs/`、`QA_REPORT.md`、`package.json`、`wrangler.jsonc` | 保留；历史记录不直接当作当前事实 |

## 2. 六个未被现行 CI 调用的脚本

`check.yml` 有 82 个 `node scripts/*.cjs` 调用，所有目标路径都存在、没有重复；下列六项不在 CI：

| 文件 | 依赖证据 | 决策 |
| --- | --- | --- |
| `scripts/validate.cjs` | 读取已删除的 `content.js`，要求已删除的 `app.js`、`styles.css`、`labs/v7.html` 及旧版题库统计 | **删除**：旧题库专用，已无法单独运行 |
| `scripts/check-question-strategies.cjs` | require 已删除的 `question-strategies.js`，读取旧 `content.js` 和 `app.js` | **删除**：旧题库桥接测试，不影响 `labs/constraint-engine.js` |
| `scripts/check-workbench-layout.cjs` | 读取已删除的 `labs/line-projection.html` 与 `labs/line-workbench-layout.js` | **删除**：旧 UI 测试，不删除 SVG 或新版工作台 |
| `scripts/check-line-projection.cjs` | 文件前半依赖已删的直线投影 UI；后半还测试现存 `labs/chapter-26-29.html`、`labs/chapter-drawing.js`、`labs/verified-exercises.js` 等；文档 `docs/knowledge-review-protocol.md` 亦引用此检查 | **保留待拆分**：不可整文件删除有效教材回归逻辑 |
| `scripts/check-k-drag.cjs` | 测试现存 `labs/constraints.html` 的固定视图、拖动逆投影与约束条件 | **保留，建议择期接入 CI** |
| `scripts/check-lab-page.cjs` | 检查现存 `labs/constraints.html` 的内嵌脚本、SVG 控件和共享约束引擎 | **保留，建议择期接入 CI** |

第一批只删除上述前三个脚本；`scripts/check-line-projection.cjs` 需要后续独立任务将教材核验测试迁移至现行测试后再评估。

## 3. 构建与发布检查

- `package.json`：Three.js `0.186.1`、esbuild `0.28.2` 为当前构建需要的开发依赖；本轮无充分证据证明可删。没有 `package-lock.json`，建议另批建立可复现安装。
- `scripts/build-static.cjs`：先清理 `dist/`，复制公开白名单，改写部分过期私有链接，使用 esbuild 输出 WebGL bundle；本轮不调整该逻辑。
- `.github/workflows/check.yml`：push/PR 触发 Node 22 构建、现有数学/课本/页面检查与打包资源检查；本轮不修改检查命令。
- `wrangler.jsonc`：Worker `engineering-drawing-study`，静态目录 `./dist`，404 处理为 `404-page`；不运行任何正式部署。
- `_headers` 位于仓库根目录但未列入公开构建白名单：安全响应头是否由实际 Worker 发布环境提供仍需部署专项验证，禁止本轮擅改。
- `QA_REPORT.md` 描述已退役的旧题库，属于历史资料，建议将来加“历史报告”标记而非无证据删除。
- `main` 当前分支保护为 `false`（GitHub API 结果）；建议总控另行审核分支保护和强制状态检查。

## 4. 测试与回退

**清理前（真实远端基线）**：GitHub Actions [run #1510](https://github.com/07xh/engineering-drawing-study/actions/runs/39571480561)，对 `55625e46efe933fb3c5a8a918a9bd32c5451c423`，`validate` 作业各核心步骤（安装、语法检查、全套校验）均 `success`。

**清理后**：以本 PR 最新 head SHA 的 GitHub Actions 结果为准；尚未取得结果前禁止写“已通过”。

**覆盖声明**：CI 通过可确认现有自动数学/三视图/自由度/静态 SVG/Three.js 打包检查未退化，**不等于**已进行浏览器视觉验收或 Cloudflare 生产冒烟测试。

**回退方案**：不合并时直接关闭 PR；若未来按总控批准合并，则可 revert 此 PR 的清理提交。被删除的三份测试在基准 SHA 中有完整原始内容。不要对 main 强推。

## 5. 后续待办（不属于本 PR）

1. 拆分 `check-line-projection.cjs`：丢弃失效 UI 断言、保留并迁移现存教材习题/描图/自由度回归检查。
2. 评估是否将 `check-k-drag.cjs` 与 `check-lab-page.cjs` 纳入 CI。
3. 基于最终 `dist` 做递归敏感文件扫描、密钥检测、静态/动态资源验证。
4. 在 01 几何契约稳定后整理数学模块的显式依赖图及题型级验收，不为“清爽目录”删除算法。
5. 在独立 PR 整理锁文件、历史 QA 文档及部署安全头验证。
