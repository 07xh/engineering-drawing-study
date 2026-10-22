# PR #226 独立数学审计（2026-10-22）

## 结论与范围

固定对象：[PR #226](https://github.com/07xh/engineering-drawing-study/pull/226)，HEAD `02ef9ebd62f83af10234a87817ac4cf0175a8278`。审计结束再次读取，该 HEAD 未变，仍 Draft、未合并。

原测试 18/18、新增独立正向测试 8/8 通过；新增期望契约回归 0/3 通过，对应以下两个 P2 问题。不能记作 29/29 全绿，也不能据此宣称新数值核心完成签收。修复由 #226 原分支继续，避免重复实现。

本 PR 仅保存公开审计报告和可复现脚本，不修改 core、engines、workbench、构建、CI 或生产配置。脚本不加入现有必过测试入口：边界脚本在被审计版本上故意保留失败。合并本文档不等于合并 #226 或批准数学契约。

## 实际验证证据

本地 Node v24.21.0（不同于 CI Node22）：
- 原套件 `tests/math/m0-jacobian-rank-evidence.test.cjs`：18/18 PASS。
- 独立正向套件：8/8 PASS，包含 320 个确定性矩形矩阵（1–8 行、1–8 列、5 组谱）。独立正交变换构造已知奇异值谱，rankEstimate 全部匹配，奇异值比例最大绝对误差 `1.6653345369377348e-16`，没有未收敛案例。
- 其他覆盖：整体尺度/符号/排列、真实 legacy 距离残差、两圆正负交点独立方程、非解满秩、残差缩放、阈值敏感、迭代不足、64×64 稠密正交与输入不变性。
- 边界脚本：3 FAIL，分别为内层数组缺失项、外层缺失行、极端幅度比例误差。属于已复现缺口，不是假定已修复。
- 对象源码/原测试/旧分析器/技术说明四份快照均经 Git blob SHA 校验匹配。被审计模块 blob 为 `0808169c8af8e4e298bd565d88e960a842d4ac99`。
- 只读 check-runs API 核实对象 HEAD 的 [math](https://github.com/07xh/engineering-drawing-study/actions/runs/39725056336)、[planar-math](https://github.com/07xh/engineering-drawing-study/actions/runs/39725056322)、[point-projection](https://github.com/07xh/engineering-drawing-study/actions/runs/39725056320)、[workbench](https://github.com/07xh/engineering-drawing-study/actions/runs/39725056325)、[validate](https://github.com/07xh/engineering-drawing-study/actions/runs/39725056319) 及 Workers Builds 均 success。已有 CI 不包含本报告新增的红测，绿灯不能反证缺口不存在。

## 可复现方式

先在**独立 checkout** 中取固定对象 SHA，避免重置正在开发的工作目录。两个脚本以当前目录为审计对象根目录，也可用 `DRAFTAI_AUDIT_ROOT` 显式指定；不会下载代码或修改审计对象。

从固定对象 checkout 运行本审计 PR 中的两个脚本（用实际绝对路径替换）：

```powershell
node --test tests/math/m0-jacobian-rank-evidence.test.cjs
node --test <审计文件目录>/independent-positive.cjs
node --test <审计文件目录>/independent-boundaries.cjs
```

前两条应成功；第三条在上述固定 HEAD 应返回退出码1、三项失败。修复后应重新运行全部测试并更新证据，不可继续套用旧 SHA。正向测试用确定性已知谱作对照，不等于认证 SVD 或全仓构建验收。

## P2-1：稀疏零矩阵绕过有限值校验

`core/numeric/jacobian-rank-evidence.cjs:21` 的 Array.some 跳过 holes，第28行 flat 丢弃缺失项，第32–34行将剩余零值当成合法零矩阵提前返回：

```js
const {diagnoseJacobian}=require('./core/numeric/jacobian-rank-evidence.cjs');
const row=[0,0,0]; delete row[1];
diagnoseJacobian({rows:[row],normalized:true});
// rankEstimate=0, localDegreesEstimate=3, converged=true
const rows=[[0,0],[0,0]]; delete rows[1];
diagnoseJacobian({rows,normalized:true});
// rankEstimate=0, localDegreesEstimate=2, converged=true
```

缺失值未被声明为0，不能发布已校验的矩阵秩。影响主要在 JS 直接调用或预分配未填满数组；JSON 产生的 null 会被现有有限值检查拒绝。建议按索引检查每一行及元素，拒绝 holes/undefined，再进入零矩阵分支。本次没有发现该新模块已接入正式引擎。

## P2-2：列平方和下溢被标作收敛

第47–49行计算列平方和可能下溢为0，跳过本应进行的正交化；第61行将没有旋转当作收敛：

```js
diagnoseJacobian({rows:[[1,1e-200],[0,1e-200]],normalized:true});
// singularRatios[1]=1.414213562373095e-200
// conditionEstimate=7.071067811865475e199
// converged=true, status='rank-deficient'
```

独立解析基准：e=1e-200，J=[[1,e],[0,e]]，JᵀJ 的迹为1+2e²、行列式为e²，故 sigma_min/sigma_max=e*(1+O(e²))，双精度下应接近1e-200。实测比例误差约41.4%，条件估计偏差约29.3%。

**影响限定**：此例在所有当前允许阈值下仍判数值秩1，没有证明 rankEstimate 错判；问题是奇异值比例、条件估计和 converged 的可信度。现有模块本身不是认证 SVD。建议稳定计算列范数/相关性，或将此类信息损失明确标为 undetermined/不可用，不通过改变工程毫米容差掩盖。

## 接入与后续

normalized:true 只是调用方承诺；diag(1,1e-12) 与 diag(1,1) 的秩估计分别为1和2，无量纲不等于残差权重已校准。正式接入仍需行列尺度签收、残差门禁和分支独立验算。局部满秩不证明存在或全局唯一。

本报告未修改数学算法、未验证修复、未验收 Cloudflare Active SHA、正式域名或安卓触笔。#226 仍须原负责人处理两项边界、重跑准确 HEAD 检查并交00完成共享 core 签收。本次文档 PR 按 #152 普通低风险流程审核。
