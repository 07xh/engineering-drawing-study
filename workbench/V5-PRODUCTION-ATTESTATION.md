# DA-07 V5 生产发布核验｜可重复执行

本检查不修改 Cloudflare 或 GitHub Actions 设置，不上传任何私有文件，不依赖管理员登录，专门填补原有 P0 R5 生产指纹验证中 **自由度实验室 V5 (DOF)** 的覆盖缺口。

## 核验原则

GitHub CI `success` ≠ Cloudflare 已正式部署。只有部署域名的**远端实际资源字节**与待发布 commit 在本地构建出的 `dist/` 完全一致，且对应内部源码、脚本和测试路径不返回 HTTP 200，才认定为 *内容层面的 production pass*。

脚本 `workbench/verify-v5-production.cjs` 独立检查：
- 必须可公开获取的 9 个文件：DOF V5 HTML，交互 JavaScript，真实 WebGL Three bundle，几何模型、可见性、制图纸面、状态、SVG 3D 备用视图及约束引擎。
- 必须**不能**公开取得的 6 个文件：私有 V5 构造同步消费源码、timeline、motion、Three.js 未打包入口以及两份数学/浏览器模拟测试。
- 公开文件使用 SHA-256 逐字节对比；私有文件只接受 401/403/404/410。
- 302/301 等跳转**不能**冒充内容一致；200 soft-404 页出现在私有路径也算风险。
- 请求限定 HTTPS 根域名、超时与最大 5 MB 响应，网络/本地构建缺失一律 `unverified`，有明确不一致一律 `fail`，绝不把网络中断当作安全通过。

## 在拥有仓库代码与网络的可信环境执行

```bash
git checkout main
git rev-parse HEAD   # 记下供验收的精确 main SHA
npm ci
node scripts/build-static.cjs
node scripts/verify-production-learning-site.cjs --base-url https://drawing.0701000.xyz --dist dist --json
node workbench/verify-v5-production.cjs --base-url https://drawing.0701000.xyz --dist dist --json
```

第三、四行中只有两个独立核验**均显示 pass**，才能声称这批 P0 + V5 教学资源字节与指定本地构建一致。如果外部网站断网、DNS 不可用、构建缺失或超时，则判定 `unverified`，不可声称已上线。

**注意**：Cloudflare 控制台 Active Deployment 的提交 SHA、流量路由、缓存失效与正式域名实际版本，仍需部署所有者对照 Dashboard 中的生产部署记录；数学实机交互、触笔、横屏、点击准确度、WebGL 帧率和视觉问题也需要真实 Chromium/Android 浏览器逐项验收，不能仅凭资源 hash 或 Node VM 测试放行。

## CI 与回归

自动工作台测试 `tests/workbench/v5-production-fingerprint.test.cjs` 使用真实本地 HTTP Server 模拟全部资源和私有路径，覆盖：正常全通过、旧 Three/V5 JS、私有源码泄漏、soft-404、缺失构建、DNS 中断、302、503、恶意 URL 和构建 allowlist 漏项。

真实 Cloudflare 验证**只在明确提供域名并且网络允许时运行**。自动测试只检验工具的行为，不会访问生产网站，也不代表生产环境已验收。
