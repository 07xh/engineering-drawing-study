# DraftAI｜私有真实教材 DWG 批量核验入口（08→09）

该离线脚本按来源 DWG 分别执行预检，再选择已经在可信 CAD 软件中导出的 ASCII DXF，或显式指定已安装的 GNU LibreDWG dwgread，产出待人工审核的几何图元和尺寸标注候选。

## 本轮三张真实教材图

- 第03章 图3-9：平面斜截圆柱时截交线的画法
- 第03章 图3-12：用辅助线法求圆锥的截交线
- 第03章 图3-13：用辅助平面法求圆锥的截交线

这些私有原始 DWG 为 AC1018 格式。已有来源核验，但尚未提取出足以独立确认的原始 CAD 模型数据或尺寸，教材整题通过数仍为 0。

## 私有本地执行示例

以下是示例路径，须替换为本机绝对路径；输出目录必须不存在且父目录已存在。命令需在 DraftAI 仓库根目录运行。

    node scripts/audit-private-cad-batch.cjs --out /private/audit-001 --dwg '/private/图3-9 平面斜截圆柱时截交线的画法.dwg' --dwg '/private/图3-12 用辅助线法求圆锥的截交线.dwg' --dwg '/private/图3-13 用辅助平面法求圆锥的截交线.dwg'

仅执行来源预检时，不会伪造 CAD 图元。安装真实 LibreDWG 后可在命令末尾追加 --dwgread /绝对路径/dwgread。若已用可信 CAD 软件导出 ASCII DXF，在每个 --dwg 参数后紧跟对应 --dxf /绝对路径/xxx.dxf，不能同时使用 --dwgread。

输出 audit-index.json 仅包含摘要，每份 source-001.json 等明细可能含教材原始几何/尺寸和答案，必须保存在私人位置，不能上传公开 GitHub、Cloudflare 或公开 CI 附件。工具仅在本机运行，无网络上传；不包含外部转换器二进制。

## 严格验收顺序

1. 校验原始 DWG 身份和可信转换过程；记录导出等价性无法自动证明的边界。
2. 检查 DXF MODEL/PAPER、图层、块/INSERT、尺寸文字、OCS/坐标和未解析图元；缺失实体不得悄悄忽略。
3. 利用已有 CAD 审核契约逐个标注 given / reference-answer / exclude；不能根据图层名称自动认定已知条件。
4. 另行确认尺寸单位、标注关联、第一角 V/H/W 纸面坐标和 3D 实体映射；2D DXF 模型空间坐标不等于 3D XYZ。
5. 题目已知条件确定后接入已有 M3，保留数学残差、分支及反例，不让参考答案参与求解。
6. 使用同一 SolveResult → ConstructionIntent → ConstructionStep DAG → 唯一 V5 同步二维与三维。
7. 求解之后才独立对照教材标准几何、线型、可见性，记录不一致和误差范围。

即使所有 CAD 图元已读出，在第 3–7 项独立通过之前也不得声称教材整题通过。遵守 #372、#380、#152。
