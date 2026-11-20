# DraftFlow V11 AI 解题第一阶段（安全接入与范围）

## 已实现的代码（并非线上 AI 已启用）

- 首页在既有工作台前增加独立 AI 入口，可上传本地题图/填题意，选择“最终答案、解题思路、详细步骤、二维、三维、动态作图、验证说明”；精简/标准/详细教学与预设可本机保存。
- 图片只在点击提交后用浏览器 Canvas 压缩清理后发送，题图、题干及访问令牌**不存本机持久化**。输出选项是本机偏好，不包含用户隐私。
- 可选的 Cloudflare Worker 处理程序见 \`ai/worker.mjs\`：同源、个人令牌、上传限额、模型服务端密钥、受限 JSON、错误屏蔽及“AI 未认证”状态；仅支持 **文字候选分析**。不伪造正式二维、三维或 V5。
- AI 返回建议使用的现有数学工具入口。**新增首个有限真实衔接：模型明确提取了单个空间点的 x/y/z 毫米坐标和原题依据时，用户可逐项核对后将候选值填写进现有单点三视图工作台；现有 M3/V5 必须由用户重新确认并手动启动。**不自动赋予数学证明，不替用户确认，不覆盖其他题型项目。
- 对三视图补图、组合体、截交和相贯的复杂题，**尚未实现模型候选到 ProblemDraft→M0–M5→V5 的自动编排或正式 2D/3D 图形生成**。

## 部署安全门禁（此 PR 绝不自动启用 AI）

现有 \`wrangler.jsonc\` 是仅静态资源的 Worker，\`.github/workflows/deploy-worker-github-actions.yml\` **明确阻止设置 \`main\`**。本 PR **没有修改**该配置或生产部署工作流，也没有添加公开 AI 端点。已提交的 \`ai/worker.mjs\` 仅为可审的后端候选实现。网页 \`GET /api/ai/status\` 不可用时 **自动禁用提交**，不会上传图像。

经所有者独立审查并完成以下事项后，才能另行在受保护的部署分支进行手动验收（禁止未经授权就发布）：

1. 验证 Cloudflare 现有 Worker 身份、自定义域名、Actions Deploy 触发条件及静态 ASSETS 兼容；将 \`ai/worker.mjs\` 作为 \`main\` 时使用 \`assets.binding: "ASSETS"\`，必要时配置 \`assets.run_worker_first\`。修改生产配置/守卫需独立审批。
2. 在 Cloudflare Worker Secrets 设置 \`DRAFTFLOW_AI_KEY\`（所选模型服务 API key）和高熵 \`DRAFTFLOW_AI_ACCESS_TOKEN\`（长度至少 24，且只供个人使用）；普通变量配置 \`DRAFTFLOW_AI_MODEL\`（支持视觉和 JSON 输出的模型）。
3. 在 Cloudflare WAF/Rate Limiting 对 \`/api/ai/*\` 设请求频率和费用控制，并经人工核对后才把 \`DRAFTFLOW_AI_RATE_LIMIT_READY=true\`。最后启用 \`DRAFTFLOW_AI_ENABLED=true\`。仅凭客户端按钮或 Origin 检查不能代替身份验证。
4. 确认上传图像的隐私告知、日志清理、模型供应商数据处理条款及用户授权。不得把教材扫描原图、用户题图、密钥提交到公开仓库或 \`dist/\`。
5. 先用**非私密测试图**和伪造请求做反例验收（无授权、跨站、超大图、禁用服务、提示词注入），再测真实个人题图。GitHub CI、Worker Active SHA、Android 设备另行核对。

## 下一步具体开发

- 把 AI 输出的候选点线面/尺寸、题型和推导约束转换成可编辑 ProblemDraft，用户核对后投递现有 M0–M5 引擎。
- 先把点投影、简单平面图形作图和已确认基本体的二维/三维结果接到同一解题页面，并保持 line-style fail closed。
- 增加陌生题测试：AI 识图错漏、欠约束、多解、2D/3D 不一致与 V5 不完整；任何内容未经验证必须与正式答案视觉隔离。

**不要把这个阶段标为“AI 拍照解题已上线”“三维图自动生成”或“数学计算已认证”。**
