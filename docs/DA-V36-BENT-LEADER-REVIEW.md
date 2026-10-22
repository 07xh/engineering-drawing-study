# DraftAI 08 V3.6｜两段折线尺寸引出线的候选关联

服务于 DraftAI 个人 AI 工程制图自动解题系统，继 #271 的单段有限引线候选之后，补齐常见的**有折点的尺寸引出线**。

## 算法
- `recognition/bent-leader-candidates.cjs` 接收已归一化到原图坐标的 OCR R/Φ 文字候选、有限直线候选和圆/圆弧候选，不接受真实毫米值或“已验证答案”。
- 对两条不同线段分别检查：第一段起点靠近文字 bbox、第一段尾点与第二段起点的间隙、两段转角，以及第二段终点靠近圆/圆弧 bbox 的边界。直线方向允许反转，不因 OCR 与 Hough 检测顺序猜测几何方向。
- 设置端点间隙/文字邻近/曲线邻近/转角/候选数量上限；纯共线、反向折返、无关线段不应满足折线假设。
- 多个圆同时满足条件时分别返回待核对的 `geometryCandidateId`、`jointEndpointDistancePx`、`turnDegrees` 等证据，不返回“唯一解”。
- `jointsVerified:false`、`arrowheadVerified:false`、`geometryConfirmed:false` 共同表达**仅有像素证据，没有箭头、图形拓扑、毫米尺寸或 G1 证明**。

## 验收及局限
`node --test tests/workbench/v36-bent-leader-candidates.test.cjs`。覆盖正向两段折线、线段倒序/反向、两个可能圆、间隙过大、共线与折返、越界数据、资源限制、无数学求解器调用。

当前版本处理恰好两段直线。尚不能识别三段以上尺寸引线、真实箭头尖端形状、线段遮挡、虚线以及混叠扫描图的拓扑。它不会自动把照片像素比例转换成真实毫米。

本独立 PR 仅交付数学图形**来源候选层**；下一独立 UI PR 才将折线建议与 #273 的 OCR 核对面板结合。Cloudflare 正式域名及 Android 实机仍需要独立核查。
