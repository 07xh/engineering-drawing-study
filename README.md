# 图学课堂 v8.1.2｜可部署的大学工程制图学习网站

## 已有功能

以胡建生《工程制图与AutoCAD》第三版第 2 章目录为参照，含 10 个投影基础专题、74 道原创练习题、8 种可筛选题型、逐步讲解、三投影面 SVG 演示与纸面练习。另保留 `labs/v7.html` 旧版动画实验室。

**边界：** 教学内容为原创教材对照学习资料，不收录教材原题及标准答案；10 个专题不等于覆盖教材每道课后题。复杂组合体、空间交线与纸面作图自动评分尚未完成。页面演示为教学坐标图，不作为工程图纸的国家标准合规证明。

## 知识库与解题方法升级

- **31 张知识卡**：`knowledge/index.html`，依据用户提供的《工程制图.pdf》23 页扫描，独立归纳点线面、三视图、平面及曲面立体的基本方法。可搜索、筛选、记录阅读进度。
- **知识动态图**：从知识卡进入原创 V/H/W 分栏投影动画，逐步显示点、线、面、棱柱、棱锥、圆柱、圆锥、球体与适用辅助线/辅助截圆，调用共享的线性约束引擎解释**示例中的单个点**的自由度。不是整题唯一性证明。
- **28 道教材习题导航**：`labs/chapter-drawing.html` 中新增通用解法比较、研究来源初筛与原题核验清单；用户点击后可匿名使用维基媒体公开 API 和 Crossref 学术元数据搜索。网页实时查询不能代替逐题原图和数学复核。
- **教材答案闸门**：真实教材习题仍只显示部分原图已知条件；原图未全部复核、答案未独立验算时，原题答案动画保持禁用。原创知识动态图与教材答案作图区严格分离。
- 维护和审查标准见 `docs/knowledge-review-protocol.md`。公开页面不会上传用户的原始教材 PDF。

**部署状态提醒**：GitHub 代码存在及自动检查通过，不等于 Cloudflare Pages 已经完成公网部署；请单独确认 Pages Git 集成和正式预览地址。

## 本地打开

解压整个 ZIP，保持文件目录完整，用浏览器打开 `index.html`。建议通过本地 HTTP 服务进行持久化及完整功能测试。网站无需安装 CAD，也不需要任何 API Token。

## 正式部署到独立网站

建议新建 GitHub 仓库 `engineering-drawing-study`，**不要放到现有 Firefly 仓库里**。将整个项目文件上传到新仓库根目录（包括隐藏的 `.github/workflows`）。

登录 Cloudflare > Workers & Pages，创建独立的 Pages 项目，选择 **Connect to Git**，关联新仓库。框架使用 `None`；构建命令留空；输出目录使用 `.`。按页面提示完成首次部署后，会生成 `pages.dev` 临时域名。随后在项目的 **Custom domains** 中添加例如 `drawing.0701000.xyz` 的子域名，并按 Cloudflare 提示配置 DNS。该域名目前只是规划，**未声称已经上线**。

GitHub 与 Cloudflare Pages 连接之后，提交内容会触发自动部署；非正式分支先检查预览，再合并至正式分支。GitHub Actions 会自动检查题目数据和 JavaScript 基础语法。GitHub 仓库：https://github.com/07xh/engineering-drawing-study。仓库存在不等于网站已部署，后续仍须建立 Cloudflare Pages Git 集成。

**更新课程：** 编辑 `content.js` 内的课程和题库结构，并提交 GitHub。当前尚无直接在网页里编辑/发布内容的后台；后续可单独加受保护的可视化管理界面。不要把 GitHub Token、Cloudflare Secret 等密钥写进公开网站文件。

## 结构

- `index.html`：网站首页、课程和练习区
- `styles.css`：电脑、平板、手机及打印样式
- `content.js`：课程和题库数据（更新课程时重点维护）
- `app.js`：练习反馈、进度、动画及几何投影
- `labs/v7.html`：旧版动态实验室
- `favicon.svg`：站点图标
- `_headers`：静态页面的安全响应头
- `scripts/validate.cjs`：数据结构和答案合法性检查
- `.github/workflows/check.yml`：代码提交后自动检查

## 学习记录

学习进度保存在当前浏览器的 localStorage 中。无法跨设备自动同步，清理浏览器数据可能导致丢失。第一阶段不需要账号系统。

## 课程资料来源

- 官方教材页面：https://www.cmpedu.com/books/book/5608586.htm
- Cloudflare 官方部署文档：https://developers.cloudflare.com/pages/get-started/git-integration/

所有插图和题目示例都采用原创内容。可公开链接原教材和正版课程资源，但不能未经授权公开上传教材扫描页或出版社配套习题答案。

## Git 集成特别提示

若需要以后 GitHub 提交后自动更新，**第一次就使用 Pages 的 Git 集成新建项目**，不要为了快速上线先用 Direct Upload 创建同一个项目。Cloudflare 官方文档说明 Direct Upload 项目无法直接切换成 Git 集成。

独立仓库 `engineering-drawing-study` 与 Firefly 完全隔离；Cloudflare 项目在完成首次部署前仍未上线。不要把 API 密钥提交到公开仓库。
