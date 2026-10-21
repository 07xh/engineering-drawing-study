# DraftAI V5｜统一时间轴与真实几何播放器

> 07 专项独立实现 · 关联 #150、#152、#153 · 此分支不进入公开 `dist/` 清单，不代表生产已部署。V4 可视化方向已经沉淀为独立播放器函数；V5 独立从 latest main 开发，不依赖未合并的 PR #178。

## 文件清单与实际能力

| 模块 | 职责 | 与数学的关系 |
|---|---|---|
| `teaching-timeline-v5.js` | 顺序步骤时间轴；0.25–4× 实时调速；播放/暂停/seek/逐步/变更失效 | 完全不推导数学 |
| `teaching-motion-v5.js` | SVG 线、圆、圆弧渐进；纯屏幕坐标；相机视窗插值 | 消费已核验的投影或转化 |
| `verified-timeline-adapters.cjs` | 调用 03 点投影、02 双圆连接和有限线段连接求解器 | 严格阻断未验证结果 |
| `v5-preview.html` + CSS + Entry | 隔离交互页：表单/分支、时间轴、点击跳步、纸面模式、自动取景 | 只显示消费适配器返回的求解器结果 |
| `tests/workbench/teaching-v5.test.cjs` | 独立纯数值与真实求解器消费回归 | 禁止未验证结果进入动画 |

### 速度配置

默认 `1×`，允许 `0.25–4×`，可在播放中改变且**媒体时间连续**。每个动画图元的默认时长：

- 线段 `900 ms`
- 圆 `1500 ms`
- 圆弧 `1500 ms`
- 点 `260 ms`
- 高亮 `380 ms`
- 无图元提示 `600 ms`（每个步骤默认间隔 `180 ms`）

通过调用 `compileTimeline(steps,{durations:{line:1200,arc:2200},gapMs:250})` 实现全局/类型默认速度，再用单个 `action.durationMs` 覆盖步骤内图元。所有改动只影响展示时间，不影响几何内核。

### 真实数学门禁

- **03 点投影**：必须满足 `status=unique`、`globallyUnique=true`、`solutionCount=1`、`degrees=0`、`proofLevel=linear-algebra` 及完整的四条经验证 45° 转移联系线；再绘制缺失的第三投影点。
- **02 双圆圆弧**：必须明确真实候选 `branchId`、弧向 `cw/ccw`、已知两侧轮廓走向、双侧有向 `G1` 与切点残差；先绘辅助圆与圆心、切点，最后出现连接圆弧。
- **02 有限线段圆弧**：同样要求显式候选和双侧行进方向、切点位于有限线段、有向 `G1`、非零圆弧扫角；不得将无穷直线的相切证明混同于有限线段成立。
- 修改用户输入后，`player.invalidate(nextRevision,now)` 立即禁止旧动画继续播放；新计划只能由原求解器重新计算得出。
- 工作台学生笔迹、教材原图、AI 识图均**不能直接制造**合法标准答案。

### 时间轴调用样例

```js
const timeline = DA07TimelineV5.compileTimeline([
 {id:'guide',actions:[{id:'contact-line',kind:'line',durationMs:900}]},
 {id:'arc',dependsOn:['guide'],actions:[{id:'verified-arc',kind:'arc'}]}
]);
const player = DA07TimelineV5.createPlayer(timeline,{speed:1,revision:0});
player.play(performance.now());
player.setSpeed(1.7,performance.now());
const display = player.snapshot(performance.now());
DA07MotionV5.updateSvg(existingSvgElement,verifiedScreenAction,
  display.actionFractions['verified-arc']);
```

### 本地运行（开发者）

```bash
npm install --no-package-lock --no-audit --no-fund
node workbench/build-v5-preview.cjs
# 从本地 Web server 访问 /workbench/v5-preview.html
node --test tests/workbench/*.test.cjs
```

`build-v5-preview.cjs` 只向 workbench 生成一个 browser bundle，**不修改** `dist/`、Cloudflare、生产入口、公共 `core/**` 或 `.github/workflows/**`。

### 测试与未完成的正式门槛

- Node 测试：边界时间、调速连续、暂停、seek、数据修订、顺逆圆弧、相机等价性、真实 03/02 数学门禁及负面输入。
- 独立代码与静态检查：`tests/workbench/v5-preview-structure.test.cjs`。
- CI 以 PR 最终 head 的工作台、投影、平面数学、静态站点四组 GitHub Checks 为准。
- `workbench/v5-preview.html` 是**隔离的开发页**。本 PR 不能声称 Android 实机触笔/真实浏览器视觉检查或生产版本已经通过；需要 09/00 结合真实构建预览核验。
- 当前 `main` 的分支保护仍需按 #153 完成。与 01 公共五契约、教材逐页原图、自由度/三维同步的正式集成**仍依赖专项验收与统一冻结**，不能因这个 PR 成功就判定网站整体重构完成。

### 回退与生产安全

- 回退本 PR 或删除独立 `workbench/teaching-*-v5.js`、`workbench/v5-preview*` 及本专项测试即可；不影响已上线真实数学课程。
- 当前未修改 01/02/03 求解器、不改共享构建/部署/CI 工作流、不合并 main、不向公开页面发布私人教材。
- 00/09 确认数学、构建、分支保护、Cloudflare 直连发布门禁后，再决定将通用时间轴接入各生产页面。