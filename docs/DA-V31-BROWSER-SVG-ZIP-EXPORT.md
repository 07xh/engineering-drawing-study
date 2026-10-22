# DraftAI V3.1｜二维真实解题工作台下载 SVG 与分步 ZIP

本 PR 在已经合并的 #258 最终 SVG 导出、#262 分步 SVG 导出的数学可靠性边界之上，为现有 `labs/auto-fillet-live.html` 实现**真实浏览器下载按钮**。不涉及 AI/OCR 数据、远程上传或 PDF 工具链。

## 工作台按钮

- **保存完整 SVG 图纸**：将当前已核对数学条件重新交给旧有 02 求解器→双端有向 G1→07 V5 adapter，通过后本地生成 `draftai-r<revision>-verified.svg`。
- **下载分步图纸 ZIP**：按真实已完成步骤导出 `draftai-step-00.svg`、`draftai-step-01.svg` …… 最终页，采用无外部依赖的存储式 ZIP 打成一个下载，避免浏览器限制同一次操作的多文件下载。
- “保留辅助线和辅助圆”可选；默认保留，关掉时仍显示已知图与最终已证圆弧。ZIP 每张图视口相同。
- 按钮只在当前 `session` 已生成可渲染、数学验证的计划时启用。每次点击都重新核验当前 `revision`、真正的表单输入和严格模式下的全部人工确认，导出接口自己重算而非截图或信任 UI 状态。尺寸、分支、原题来源确认改变后旧答案不能再下载。
- 下载仅在用户点击时利用 `Blob` 和浏览器对象 URL 实现，不发起网络请求，不持久化原题、密钥或输出文件；对象 URL 在下载处理后或退出时释放。ZIP 文件有 65 个以内的步骤图、单图 512 KB 和总内容 10 MB 的上界。

## 数学界限

只支持已验收的两有限线段、线段+整圆、两整圆连接圆弧。必须有当前数学残差/接触及有向 G1 证明、分支和行进方向，不能把这解释为全局唯一解，也不支持陌生照片自动识图。图纸下载功能不更改数学本身，不将检测候选的 `image-px` 当 `model-mm`。

## 测试与发布

新建：
- `export/verified-fillet-step-zip.cjs`，纯离线标准 ZIP 构造。
- `labs/verified-fillet-export-ui.cjs`，真实浏览器下载控制器。
- `tests/workbench/v31-verified-svg-zip.test.cjs`，ZIP 文件头、中央目录、三类真实求解、版次、错误条件与视口一致性。
- `tests/workbench/v31-verified-export-ui.test.cjs`，按钮启用/失效、真实 Blob 下载、错误 G1 与陈旧 revision 拒绝、安全释放。

当前页面与入口仅做有限挂载改动，不修改 01/02/07 原求解器，不更改 08 图像识别/候选算法、CI 配置、GitHub 权限和 Cloudflare 上传部署方案。静态构建依照原 `labs/auto-fillet-live-entry.cjs` 的 esbuild 引用直接包含两个模块。正式上线须进一步查证生产 Active SHA，浏览器/安卓真机交互体验不能仅凭 CI 代替。
