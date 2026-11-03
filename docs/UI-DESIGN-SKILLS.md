# UI 设计 Agent Skills（项目级安装）

本仓库以 Git 子模块固定 [Taste Skill](https://github.com/Leonxlnx/taste-skill) 与 [Impeccable](https://github.com/pbakaus/impeccable)，为 Codex / Claude Code 提供项目技能，不作为网站生产依赖。

## 首次启用

在本仓库根目录运行：

```bash
git submodule update --init --recursive
test -f .agents/skills/design-taste-frontend/SKILL.md
test -f .agents/skills/impeccable/SKILL.md
```

重启本地 Codex / Claude Code 会话即可读取项目下的 `.agents/skills/`、`.claude/skills/` 符号链接。Windows 环境建议 WSL 或支持符号链接的 Git；否则按上游 README 在本地 Agent skills 目录安装。默认不启用自动 Hook、Live Apply、外部下载执行或沙箱绕过；若要启用，必须单独审查脚本和权限。

## 固定上游版本

- Taste Skill：`12af471f627f866411b4bd785b19646d3672784c`，MIT 许可证，适合构思设计方向与界面重设计。
- Impeccable：`9fadc41729c38fd47d7ae622b501558653f9d2e9`，Apache-2.0 许可证，适合 `critique`、`audit`、`distill`、`adapt`、`polish`。

更新上游只能通过独立 PR 修改子模块的 gitlink，核查维护状态、兼容性和权限后再合并。不要自动拉取上游 main。

## 绘序 · DraftFlow 使用边界

1. 保留 M0–M5 数学求解、真实三维拓扑、Geometry Scene、ConstructionStep DAG 和唯一 V5 播放器，UI Skill 只对展示层提建议，不能充当几何验收。
2. 三视图必须保留第一角法 V/H/W 布局、真实来源端点、遮挡与工程线型；未通过 M5 联合门禁的边不得在 V5 显示为已证实的实线或虚线。
3. 重点优化解题工作台布局、分屏、移动端工具栏和动画操作的可达性，不以视觉完整代替真实教材 C1 整题无答案验收。
4. UI 变更须先比对真实桌面与 Android 平板截图，再跑现有测试和对应工作台回归；遵守仓库现行 PR/Issue 门禁，不从设计工具直接合并生产。

此安装不等于完成 UI 改版，也不能代替真实浏览器和功能回归验收。
