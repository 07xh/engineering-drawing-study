# DraftAI｜现行规则唯一入口（2026-10-23）

> 本文件仅是**权威规则索引**，不新建另一套审核流程、数学规范或产品路线。若历史文档、注释、旧 Issue/PR 与现行规则冲突，以下现行 GitHub Issue 优先；读最新 main 与当前测试结果，不把旧快照当实时进度。

| 范围 | 唯一现行依据 |
| --- | --- |
| 产品定位及 M0–M5 开发总纲 | [#340](https://github.com/07xh/engineering-drawing-study/issues/340) |
| M0–M5 数学、ConstructionIntent、二维三维联动及迁移验收 | [#372](https://github.com/07xh/engineering-drawing-study/issues/372) |
| 单人开发、PR、CI、合并与 Cloudflare 原生发布流程 | [#152](https://github.com/07xh/engineering-drawing-study/issues/152) |
| V7 统一项目工作台、图像审核、本地保存及跨视图接入 | [#497](https://github.com/07xh/engineering-drawing-study/issues/497) |
| 教材配套习题的独立验收数据与版权边界 | [#380](https://github.com/07xh/engineering-drawing-study/issues/380) |

## 一律失效的旧约束

- 教师教学网站、课程/题库、六层教学法优先的产品定位和相关旧里程碑。
- 等待第二个 GitHub 审核者、00/09 外部正式批准、逐步再问所有者才能合并等旧流程。
- 把旧 #143、#233 或按日期撰写的 UI/课程路线图、报告、Issue 历史评论当作现行阻断或已完成证据。
- 为圆柱、圆锥等题型重复建设数学内核、SolveResult、ConstructionIntent、ConstructionStep DAG、V5 播放器或独立二维/三维求解状态。

## 清理与兼容边界

1. 历史演示页和老求解器**不因产品定位废止而自动等于无用代码**。迁移前必须核对公开入口、build-static 白名单、运行时引用、测试、公式/投影对照价值；已验证旧算法可作为独立 oracle。
2. 仅删除能够证实无调用、失效或完全被现行实现替代的文件。旧 URL 与未迁移高级工具仍需保留；需要迁移时先增加兼容入口。
3. 用户已确认条件、来源/比例尺版本、分支/修订、V/H/W 第一角法、稳定对象 ID、二维/三维共享 Scene 和 V5 证据必须一致；恢复项目不能继承旧“已验证”资格。
4. CI 全绿不代表真实题图已完成、Cloudflare 已激活或安卓交互已验收。状态分别核验；不要在本文件手工维护虚假的实时百分比。
5. Git 提交历史保留旧资料作审计，不代表旧文本仍有效。新增设计应修改上述唯一规则源或其明确引用，不再建立互相冲突的“总纲”。

更新现行规范请优先更新对应 Issue，并只在本索引调整入口，而非复制其全文。
