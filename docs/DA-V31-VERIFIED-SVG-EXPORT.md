# DraftAI V3.1 · 已验证圆弧连接的 SVG 导出

这是一项个人工程制图自动解题系统的独立导出能力，不是 OCR、课程、CAD 或公共网页功能。只增加 export 模块和 workbench 回归测试，不触碰已有 01/02 数学内核、07 播放器、08 识图及部署配置。

## 内部 API

调用 `exportVerifiedFilletSvg({problem,selection,sheet},{expectedRevision,includeGuides})`，返回 SVG 字符串、分支 ID、版本号、步骤数量和原数学证明范围。问题必须是毫米单位并具有当前已确认的几何输入、分支 ID、连接弧旋向及两侧原轮廓方向。

## 数学与隐私边界

- 导出模块自己重新调用经过验证的 confirmedFilletTimeline，不接受外部注入的步骤、证明布尔值或任意 SVG 源码。
- 仅三种已支持的连接类型：两有限线段、有限线段+整圆、两整圆。只有当前 revision 的所选分支通过有限接触和双端有向 G1 检查才生成完整 SVG。
- 输出包含已知图形和结果圆弧；可以隐藏辅助图线和辅助圆，保留来源图元和步骤编号。输出无脚本、外链、图像数据、文件保存或后台请求。
- 几何以既有数学计算为依据；SVG 视口大小只是排版，不提供新的数学证明。选中一个分支不等于证明全局唯一解。
- SVG 文件本身不是防伪证书，也没有解决图片自动识别、单位校准、斜截面、复杂复合圆弧、私有存储或浏览器导出按钮。

## 验证与上线

独立新增 tests/workbench/v31-verified-fillet-svg-export.test.cjs，自动纳入当前 workbench CI 的 tests/workbench/*.test.cjs 检查。验证三类真实圆弧、参数修改与过期 revision、无解、多解未选、错误 G1、畸形单位和导出安全边界。

本 PR 不修改网页入口或构建输出，也不声称已经在 Cloudflare 生产上线。后续如果需要在工作台加入“保存 SVG”按钮，须另开 07 专项 PR，核对当前 revision 与可见页面状态。此功能可单独 revert。
