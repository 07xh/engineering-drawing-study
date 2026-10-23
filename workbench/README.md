# DraftAI 07｜历史 synthetic 工作台原型（非生产入口）

> **历史原型；本页旧审批与架构前置要求已废止。** 当前以 [现行规则](../docs/CURRENT-RULES.md)、[数学契约 #372](https://github.com/07xh/engineering-drawing-study/issues/372)、[统一项目工作台 #497](https://github.com/07xh/engineering-drawing-study/issues/497) 为准。不要把该原型当成公开端到端识图解题应用。

## 保留原因

本目录中的 `index.html` 与 synthetic fixture 用于回归输入交互、布局、错误态和旧 V5 适配行为；页面样本并非真实题图、可信 SolveResult 或教材答案。目录中后来新增的受测几何/V5 库应以其具体生产消费入口判定，不可因为原型过时而整体删除。

该原型本身不计算截交线、切点、虚实线、残差或唯一标准解；历史 `solveGate` 状态草案不是数学证明。

## 验收与迁移原则

- 原型回归：`node --test tests/workbench/*.test.cjs`。
- **不再等待 #144 冻结、00/09 外部账号批准等已废止条件**；按 #152 最新 HEAD 适用 CI、数学反例/安全验收处理 PR。
- 正式入口应使用唯一 ProblemDraft / SolveResult / ConstructionIntent / ConstructionStep DAG / V5 和 #497 项目协调、IndexedDB；原型 fixture 不得自动升格为可信解。
- 更改用户确认条件、来源或修订号时必须阻断旧步骤；三维/二维使用稳定对象 ID、共同投影，三维视口交互不能触发重求解。
- 旧页面要退出前，检查所有入口、链接、构建引用、回归用例和回滚路径；历史实验与可验证对照优先保留在高级工具中。

**验收状态警告**：静态或 Node 测试通过，不代表浏览器、Android、Cloudflare 生产部署或真实原题已经通过验收。
