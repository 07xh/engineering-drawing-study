# DraftAI V3.1｜真实数学作图步骤 SVG 分页导出

这是在已合并 PR #258 的 **内部导出接口** 之上进行的独立增量。它不是新的求解器、AI/OCR、教学课程或公开网站按钮，也不改变任何现有 01/02/07/08 求解和播放模块。

## 交付能力

- `exportVerifiedFilletSvg(input, {expectedRevision, includeGuides, completedSteps})`：新增 `completedSteps` 选项，表示当前图纸显示的**已完成步骤数量**；从 0（只显示已知图）到真实 V5 步骤总数（完整结果）。
- `exportVerifiedFilletStepSheets(input, {expectedRevision, includeGuides})`：返回 `sheets`，其中包含从步骤 0 到最终步骤的 SVG 字符串、完成数量、所选数学分支和 revision 标识。
- 通过完整已验证的圆弧求解与 V5 作图结果计算一次一致的图纸边界，所有步骤保留同一 `viewBox`，方便打印、逐步翻页和未来制作教程外的个人作图记录。
- 过程中的 SVG 只画出当前及此前完成的图元，不提前显露最终连接弧。最终页保留原 PR #258 的完整结果图兼容性；可以隐藏辅助线。
- 使用已有 02+G1 数学求解与 V5 adapter 重算结果。任何错误分支、未经证实的 G1、无解、过期 revision 或错误尺寸都不输出“假标准答案”。

## 调用示例

```js
const {exportVerifiedFilletStepSheets} =
  require('./export/verified-fillet-step-sheets.cjs');
const pages = exportVerifiedFilletStepSheets(confirmedProblem, {
  expectedRevision: confirmedProblem.problem.revision,
  includeGuides: true
});
for (const page of pages.sheets) {
  // page.svg 是静态 SVG 文本；保存或下载由未来的独立 UI 负责。
  // page.completedSteps 表示当前图纸已经展示多少真实步骤。
}
```

## 安全、数学与适用范围

已支持的三类题仍然只有两有限线段、有限线段+整圆、两整圆的连接圆弧。所有过程页遵循**完整问题已先行得到验证**，但局部过程页不被标记成已经画出完整答案；本模块不证明解全局唯一。它不保存或发送文件，不读用户图片，不从像素自行推断毫米，不向 SVG 中插入原始文字或用户提供的任意 SVG。

## 工程边界与回退

本批修改仅限 `export/verified-fillet-svg.cjs`、新增 `export/verified-fillet-step-sheets.cjs`、`tests/workbench/v31-verified-fillet-step-sheets.test.cjs` 及本文档。新增测试自动进入现有 `tests/workbench/*.test.cjs` 工作流；没有修改公共网页、Cloudflare、GitHub Actions、正在并行开发的 08 识图文件。

回退此 PR 不影响主求解器、V5 播放器或 PR #258 的旧独立最终 SVG 导出行为。将来的“保存所有作图步骤”按钮需由专门 UI PR 实施并完成真实浏览器测试。
