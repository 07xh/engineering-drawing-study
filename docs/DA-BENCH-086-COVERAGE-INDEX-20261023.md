# DA-BENCH-086 · 配套教材习题验收索引（首个实现增量）

关联 [#380](https://github.com/07xh/engineering-drawing-study/issues/380)、[#377](https://github.com/07xh/engineering-drawing-study/issues/377)、[#372](https://github.com/07xh/engineering-drawing-study/issues/372)。

## 实现边界

本批只交付可执行的**元数据校验 / 稳定 ID / 覆盖计数**，不导入 86 页图像，不分析书中尚未核对的章节或题号，不提供课程/题库/新的几何求解器，不改变已发布工作台。

- 使用**书本印刷页码** `printedPage`（1–86），不是 PDF 阅读器页码；`questionLabel` 保留教材题号写法，如短数字组合 `12-4-1`。不能确认原题编号时使用页内 `localOrdinal`，保留 “LOCAL” 明确标志待核对。
- `textbookChapter`、`topic`、`solver` 只是短元数据；未确认章节保留 `null`，不能猜测已完成映射。
- `kind=synthetic-control` 是合成负例/规则测试，**不计入真实习题覆盖率**。
- 五个独立阶段：`recognition`、`math`、`construction`、`animation`、`standards`。每项可以是 untested/passed/failed/not-applicable。
- `result=solved` 不是根据红色答案生成的标签；至少要求真实题、`blindTest=true`、`answerHidden=true`、数学/构造/V5 可追溯证据，以及全部适用阶段标记 passed。**字段验证不能证明真实性，M5 仍需独立审查测试报告**。
- `result=unsupported` / `multiple` / `underdetermined` 等可记录为安全处理结果，**不能计入完整自动解题数**；`unreviewed` 是默认状态，不得宣布通过。
- schema 仅接受明示字段，拒绝额外的答案/扫描负载；公开仓库不保存原书整页内容、答案图、私密上传文件或大篇教辅文字。

## 使用例（**虚构测试元数据**，非来自原书）

```js
const {validateEntry,summarize}=require('../benchmark/exercise-coverage.cjs');
const synthetic={
  printedPage:12,questionLabel:'2-3-1',
  kind:'synthetic-control',topic:'synthetic fillet',
  result:'unreviewed'
};
console.log(validateEntry(synthetic).id);
console.log(summarize([synthetic]));
```

## 当前状态与后续开发

已有：模块 `benchmark/exercise-coverage.cjs` 和自动测试 `tests/workbench/bench-086-coverage-index.test.cjs`，作为 09 验收辅助，不写回用户真实习题数据。

未做：逐页辨识 86 页全部题号、核对教材目录、遮蔽红色答案构造测试输入、专业求解器真实跑题、Android 与线上复核。后续按照 #377 F0/F1 学习急用交付 → F2/F3 识图确认 → F4/F5 空间求解与独立端到端验收逐项推进。绝不能以本索引代码已存在来宣称书中题目已解。
