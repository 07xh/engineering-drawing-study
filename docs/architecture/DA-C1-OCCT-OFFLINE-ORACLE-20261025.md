# C1｜Open CASCADE（OCCT）离线独立 B-Rep/隐藏线对照首轮

**执行规则：#372 数学权威，#152 CI/合并，#377 C1 首要交付，#497 唯一项目与 V5；遵循 `DA-OPEN-SOURCE-ACCELERATION-REUSE-20261025.md`。**

## 实际复用与许可

- **OCCT/Open CASCADE Technology**：真实的 CAD B-Rep 构造和 `HLRBRep_Algo` / `HLRBRep_HLRToShape` 隐藏线计算，不是渲染线段采样。上游 [OCCT](https://github.com/Open-Cascade-SAS/OCCT) 的许可是 LGPL-2.1 **附带 Open CASCADE exception**；未来任何分发须单独审查通知、许可、可替换链接与特殊例外。
- **CadQuery**：[CadQuery](https://github.com/CadQuery/cadquery)，Apache-2.0 的 Python CAD 封装；依赖 `cadquery-ocp`（OCP Python 绑定）。本轮 CI **固定** `cadquery==2.8.0` 和 `cadquery-ocp==7.9.3.1.1`，不引入至 `package.json`、Cloudflare Worker、浏览器或 Android 安装包。它们只是**测试依赖**，不承担正式求解或授权。
- **已有算法**：`workbench/m5-c1-convex-contour-source-coverage.cjs` 及现存单实体 C1 M0–M5 正式消费者完全保留；`tools/cad-oracle/export-c1-cases.cjs` 仅读取合成闭合网格的当前数学凸包支持侧边，不把 CAD 参考答案输入 M3。
- 新增独立 CAD 工作流 `.github/workflows/c1-occt-oracle.yml`：只在相关文件变更或手动调用时运行，与既有五类必需 CI **分离**；运行真实 Python HLR 后产出只读可复核 JSON（含源码输入 SHA-256、版本、体积、每视图面积、轮廓节点偏差与可见轮廓完整覆盖）。

## 可复现实验

本机已有 CAD 绑定时：

```bash
node tools/cad-oracle/export-c1-cases.cjs > /tmp/draftai-c1-input.json
python -m unittest -v tests/cad/test_c1_occt_hlr_oracle.py
python tools/cad-oracle/occt_c1_hlr.py \
  --input /tmp/draftai-c1-input.json \
  --out /tmp/draftai-c1-occt-report.json
```

未安装时，独立 Python 环境根据经核验的 wheel 可用性和供应链自行安装上面固定版本。切勿为了 CAD 测试而在生产 `npm` 依赖中安装大体积 OCC/VTK。

### 首批真实输入与反例

- 标准长方体、平移长方体、旋转长方体、三角剖分顶面（额外共面假折棱）、比例变换长方体及**四面体**；六个不同参数或拓扑输入，真实执行 **18 个** V/H/W OCCT 投影。
- 独立重建闭合 B-Rep，验证实体有效性、正体积；再用 OCCT 精确 HLR 提取**可见线**，转成 DraftAI 第一角法 `(u,v)` 坐标；比较当前 M5 数学凸包顶点/面积、各边是否被 CAD 可见线的并集无缺口覆盖。
- 必须拒绝假源顶点、非有限坐标、单位改变、开放面、闭环投影端点断裂，以及**整张纸面轮廓被统一篡改平移**，不能用自己携带的参考答案证明自己正确。
- OCCT 在旋转视图可能使**同一真实点的二维浮点结果**有约 `1e-15 mm` 差异；仅在独立 CAD oracle 内采用 `1e-9 mm` 的保守节点去重，外轮廓对照公差 `1e-6 mm`，**不放宽 M0–M5 正式数学门禁**。每个可见 HLR 线段在原始纸面边上的覆盖仍逐区间核验，单纯面积相等不算通过。

## 证据边界

- **通过**：在明确定义的闭合凸体示例中，OCCT 独立计算的三视图可见 HLR 线在几何轮廓上与现有 C1 保守数学证据一致。
- **未证明**：轮廓线属于哪条唯一最前 3D 原始棱线、C1 全部内部实虚线和端点连续可见性、全局标准 GB/ISO 线型、C2 布尔新生线、C3 有限相贯、真实无答案教材原题或正式 `ConstructionIntent → DAG → 唯一 V5` 实体线动作。CAD 的计算**不允许写入 SolveResult**，不具签发权限；测试只是一份独立证据。
- **部署**：GitHub CAD CI 通过也不等于 Cloudflare Production Active SHA、真实浏览器或 Android 实机验收。
- 若 CAD 框架在特殊退化点与 M0 证明不一致，应保留全部证据、标记不确定，分别验证精度和闭合实体；不要直接采用 CAD 参考线型盖过项目的 `undetermined`。

## 加速评价口径

首轮报告须写明精确执行环境、两个包的版本与真实运行数据；只有在同一输入、同一硬件跑过**旧方案与候选方案**的 median/p95/内存/构建体积，并验证准确率及许可后才能宣称实测加速比例。本阶段仅建立第二套**离线独立验收途径**，不声称能将 C1 直接加速数倍。
