/* 大学工程制图第2章：经校核的原创教学内容。更新此文件后重新部署网站。 */
window.DRAWING_CONTENT = {
  "version": "8.1.0",
  "textbook": "胡建生《工程制图与AutoCAD 第3版》",
  "lessons": [
    {
      "id": "projection",
      "group": "认识投影",
      "title": "投影法与工程视图",
      "page": "27",
      "level": "入门",
      "minutes": 14,
      "mode": "point",
      "intro": "从“物体—投射线—投影面”的关系理解正投影。分清中心投影、平行投影和正投影；识别投影的真实性、积聚性与类似性。",
      "concepts": [
        "中心投影：投射线汇聚于投影中心，透视效果明显。",
        "平行投影：投射线彼此平行；正投影的投射线垂直于投影面。",
        "平面与投影面平行时可反映实形；垂直时可能积聚成线。"
      ],
      "example": "把一个圆形薄板平行放置于投影面，正投影为圆；将其所在平面转为垂直于投影面，圆形薄板的投影积聚为线段。",
      "steps": [
        "确定物体、投影面及投射方向",
        "区分中心投影与平行投影",
        "判断投射线是否垂直投影面",
        "观察平行、垂直和倾斜时的投影特性"
      ],
      "mistakes": [
        "投射线平行并不自动等于正投影，还要看是否垂直投影面。",
        "立体旋转后的投影形状改变，不代表物体本身发生形变。"
      ],
      "paper": "画出中心投影、斜投影与正投影的概念图；用三个小草图说明平面相对于投影面的不同位置。"
    },
    {
      "id": "system",
      "group": "认识投影",
      "title": "三投影面体系与展开",
      "page": "29",
      "level": "入门",
      "minutes": 18,
      "mode": "point",
      "intro": "熟悉 V（正立面）、H（水平面）、W（侧立面）及三条投影轴，理解第一角画法的展开位置。",
      "concepts": [
        "V 面上为正面投影，H 面上为水平投影，W 面上为侧面投影。",
        "投影展开后：俯视图在主视图下方，左视图在主视图右侧（第一角画法）。",
        "长对正、高平齐、宽相等是同一几何形体在三视图中的对应关系。"
      ],
      "example": "空间点 A(40,25,30) 展开：a′=(40,30)，a=(40,25)，a″=(25,30)。注意二维展开图的轴向方向与坐标对照。",
      "steps": [
        "画三面互相垂直的 V、H、W",
        "明确 x、y、z 的正向和原点 O",
        "以 V 面为基准展开 H、W",
        "核对同一元素各视图的坐标对应"
      ],
      "mistakes": [
        "左视图布置在右侧是第一角画法的常见布局。",
        "不要把轴测视图的屏幕像素距离当成实际投影尺寸。"
      ],
      "paper": "在 A4 纸上完整绘制 OX、OYH、OYW、OZ 的展开体系，说明为何 Y 轴需要转移。"
    },
    {
      "id": "point",
      "group": "点的投影",
      "title": "点的三面投影与坐标",
      "page": "33",
      "level": "基础核心",
      "minutes": 25,
      "mode": "point",
      "intro": "从任意空间点的三个坐标计算三面投影，掌握两投影求第三投影，读懂 a、a′、a″ 与投影连线。",
      "concepts": [
        "A(x,y,z) 的 V 面投影 a′ 用 (x,z)，H 面投影 a 用 (x,y)，W 面投影 a″ 用 (y,z)。",
        "a 和 a′ 通过垂直于 OX 的投影连线对应；a′ 和 a″ 通过平行于 OX 的连线对应。",
        "将 H 中的 y 距离转移到 W 的 y 距离时应保证宽度相等，可用 45° 转移辅助线。"
      ],
      "example": "设 A(60,35,45) mm。正面投影的高度为 45，水平投影距 X 轴 35，侧面投影距 Z 轴 35。",
      "steps": [
        "由已知坐标确定点位",
        "向 V、H、W 分别做垂直投射",
        "投影面展开并转移 y 距离",
        "画投影连线并标明 a、a′、a″"
      ],
      "mistakes": [
        "把水平面投影 a 和正面投影 a′ 写反。",
        "用肉眼估算深度对应，而不是用投影线或 45° 辅助线。"
      ],
      "paper": "分别作 A(30,20,45)、B(65,40,15)、C(20,0,30) 的三面投影，并在三图中标注字母。"
    },
    {
      "id": "point-relation",
      "group": "点的投影",
      "title": "两点位置、重影点与从属",
      "page": "33",
      "level": "基础强化",
      "minutes": 20,
      "mode": "point",
      "intro": "判断点到投影面的距离、两点相对位置、重影点与投影可见性，为直线和形体作图打基础。",
      "concepts": [
        "两点 x 差表示左右变化，y 差表示前后变化，z 差表示上下变化（按约定坐标正向）。",
        "两点的 H 面投影重合，当且仅当它们的 x、y 相同；V 面投影重合需 x、z 相同。",
        "点在某投影面上时，垂直于该面的坐标为 0；点在投影轴上时有两个坐标为 0。"
      ],
      "example": "A(30,20,15)、B(30,20,50) 的水平投影重合，但空间中并非同一点；V 和 W 面投影可区分上下位置。",
      "steps": [
        "列出两点的 x、y、z",
        "比较哪两个坐标相同",
        "找出产生重影的投影面",
        "根据第三个坐标判断空间前后或上下"
      ],
      "mistakes": [
        "一个视图投影重合不意味着空间点重合。",
        "重影点的可见性与观察方向有关，不能仅凭投影重合就作判断。"
      ],
      "paper": "自拟两组重影点：一组 H 面重影，一组 V 面重影；标出三个视图并解释观察方向。"
    },
    {
      "id": "line-special",
      "group": "直线的投影",
      "title": "特殊位置直线（六类）",
      "page": "37",
      "level": "基础核心",
      "minutes": 26,
      "mode": "line",
      "intro": "理解水平线、正平线、侧平线三种投影面平行线，以及铅垂线、正垂线、侧垂线三种投影面垂直线。",
      "concepts": [
        "直线平行某一投影面：在该面上的投影反映线段真长。",
        "直线垂直某一投影面：在该面上的投影积聚为一点。",
        "水平线两端 z 相同；正平线 y 相同；侧平线 x 相同。"
      ],
      "example": "A(10,15,20)、B(60,15,45) 的 y 恒定，故 AB 是正平线；V 面投影反映真长。",
      "steps": [
        "比较两端点的坐标差 Δx、Δy、Δz",
        "若一个坐标差为 0，判断平行哪个投影面",
        "若两个坐标差为 0，判断垂直哪个投影面",
        "验证实长或积聚投影"
      ],
      "mistakes": [
        "“投影线看起来水平”不等于空间直线为水平线。",
        "只有指定投影面上的投影才能正确判断真长。"
      ],
      "paper": "各构造一条水平线、正平线、侧平线、铅垂线、正垂线、侧垂线；在三面投影体系中画完并比较。"
    },
    {
      "id": "line-general",
      "group": "直线的投影",
      "title": "一般位置直线与求真长",
      "page": "37",
      "level": "本科进阶",
      "minutes": 30,
      "mode": "line",
      "intro": "一般位置直线通常三个投影都不反映真长。利用空间坐标差、直角三角形法求真长和倾角。",
      "concepts": [
        "空间线段真长 L=√(Δx²+Δy²+Δz²)。",
        "H 面投影长度 Lh=√(Δx²+Δy²)，与 H 面夹角 α 满足 sinα=|Δz|/L。",
        "V 面投影长度 Lv=√(Δx²+Δz²)，与 V 面夹角 β 满足 sinβ=|Δy|/L。"
      ],
      "example": "A(10,10,10)、B(40,50,70) mm，差值 (30,40,60)，真长为 √6100≈78.10 mm，H 面投影长度为 50 mm。",
      "steps": [
        "作出 AB 的三面投影",
        "比较三坐标差，确认一般位置",
        "以 H 面投影为一条直角边、Δz 为另一条直角边",
        "斜边即真长；再判断对 H 的倾角"
      ],
      "mistakes": [
        "以主视图中的斜线长度代替空间真长。",
        "求倾角时误把投影面内的倾斜角当成直线与投影面的空间夹角。"
      ],
      "paper": "用直角三角形法求 A(10,10,10)、B(40,50,70) 的真长与对 H 面的夹角；注明辅助作图。"
    },
    {
      "id": "line-relations",
      "group": "直线的投影",
      "title": "两直线的相对位置",
      "page": "37",
      "level": "本科进阶",
      "minutes": 24,
      "mode": "line",
      "intro": "系统区分空间平行、相交、交叉（异面）和垂直线；理解一个视图交叉不代表空间相交。",
      "concepts": [
        "空间两直线平行时，在对应投影中也平行（特殊积聚情形应结合其他视图判断）。",
        "空间两直线相交时，交点在各个视图的投影必须同属于一条投影连线。",
        "若投影相交点不能对应同一个空间点，空间两直线可能交叉而非相交。"
      ],
      "example": "两条空间直线在主视图的投影相交于一点，但在俯视图中对应点不在同一投影连线上，则不能据此断定两线相交。",
      "steps": [
        "先确定已知视图中线段投影的相对位置",
        "标注候选交点并寻找对应投影",
        "检查交点是否对应同一个空间点",
        "综合判断平行、相交或交叉"
      ],
      "mistakes": [
        "只看一个视图断定空间相交。",
        "误认为二维投影中的直角一定代表空间中两线垂直。"
      ],
      "paper": "画两条在主视图相交但空间交叉的直线，解释为什么需要第二个视图进行判断。"
    },
    {
      "id": "plane-special",
      "group": "平面的投影",
      "title": "特殊位置平面（六类）",
      "page": "41",
      "level": "基础核心",
      "minutes": 26,
      "mode": "plane",
      "intro": "按投影面平行面与投影面垂直面分类，分析实形、积聚性和类似性的出现条件。",
      "concepts": [
        "水平面、正平面、侧平面分别平行 H、V、W，投影到平行的面反映实形。",
        "铅垂面、正垂面、侧垂面分别垂直 H、V、W，在垂直面投影积聚为线。",
        "一般位置平面在三个投影面上通常都不能直接显示实形。"
      ],
      "example": "三角形 PQR 的三点 z 都等于 25 mm，则所在平面是水平面；在 H 面上反映实形，V、W 面积聚成线段。",
      "steps": [
        "写出确定平面的三点坐标",
        "判断是否一个坐标恒定",
        "由恒定坐标确定平行投影面",
        "观察剩余两面的积聚投影"
      ],
      "mistakes": [
        "“平面投影是线”不一定表示整个平面很窄，而可能是积聚性。",
        "倾斜平面投影成缩短多边形不等于真形。"
      ],
      "paper": "分别画水平面、正平面、侧平面和一个正垂面的三面投影；指出真形与积聚图。"
    },
    {
      "id": "plane-general",
      "group": "平面的投影",
      "title": "一般位置平面、点线从属",
      "page": "41",
      "level": "本科进阶",
      "minutes": 32,
      "mode": "plane",
      "intro": "从三个不共线点确定一般位置平面，理解点在平面内、直线在平面内的判定与作图。",
      "concepts": [
        "通过三点不共线的投影可确定一个平面；须同时满足不同视图的对应关系。",
        "直线通过平面内两个点，即属于该平面。",
        "点属于平面内某一直线，即属于平面；只在一个视图内“落在三角形里”不能证明空间从属。"
      ],
      "example": "给定三点 P、Q、R，若 S 位于 PQ 上（空间坐标按同一比例插值），则 S 一定位于 △PQR 所在平面。",
      "steps": [
        "先识别确定平面的三点",
        "找到平面内可用的辅助线",
        "在一个视图定位辅助点，再用投影关系求其余视图",
        "以第二个视图核对点线从属"
      ],
      "mistakes": [
        "只根据一个视图中的位置判断点是否在平面内。",
        "将“在三角形的投影范围内”误当作“在原平面上”。"
      ],
      "paper": "已知 P(10,15,10)、Q(60,25,30)、R(25,55,55)，求 PQ 中点 S 的三面投影，说明 S 属于哪个平面。"
    },
    {
      "id": "solid",
      "group": "综合迁移",
      "title": "几何体投影与线面综合",
      "page": "47",
      "level": "基础综合",
      "minutes": 27,
      "mode": "plane",
      "intro": "从点、线、面过渡到棱柱、棱锥和圆柱：找特征点、轮廓线、不可见线，并检查各视图对应。",
      "concepts": [
        "平面立体由顶点、棱线和面组成，先投影顶点再连接棱线。",
        "同一棱线在某视图上的显示取决于观察方向与遮挡关系。",
        "三视图表达同一个形体，不能把各视图当成三个独立的图形。"
      ],
      "example": "一个直立三棱柱：俯视图保留底面三角形形状，正面及侧面展示棱柱高度和对应棱线。",
      "steps": [
        "分析立体结构，列出顶点、棱线与面",
        "选定主投影方向，画主视图",
        "根据长宽高对应作俯、左视图",
        "检查可见性、轮廓和漏线"
      ],
      "mistakes": [
        "把看不见的棱线直接省略，而不判断是否应用虚线。",
        "不同视图间的长、宽、高对应错误。"
      ],
      "paper": "用纸面绘制一正立三棱柱的三视图；比较棱边在不同投影中的真实性和积聚性。"
    }
  ],
  "questions": [
    {
      "id": "Q001",
      "lesson": "projection",
      "type": "single",
      "stem": "正投影与一般平行投影的区别是什么？",
      "options": [
        "投射线互相平行",
        "投射线垂直于投影面",
        "物体必须是直线",
        "没有投影变形"
      ],
      "answer": 1,
      "explain": "正投影属于平行投影，而且投射线须与投影面垂直。",
      "unit": "",
      "hint": ""
    },
    {
      "id": "Q002",
      "lesson": "projection",
      "type": "multi",
      "stem": "哪些说法正确？",
      "options": [
        "中心投影的投射线通常汇聚于同一点",
        "正投影的投射线互相平行",
        "正投影对任何倾斜平面都反映实形",
        "投影面平行于平面图形时可反映实形"
      ],
      "answer": [
        0,
        1,
        3
      ],
      "explain": "中心投影、正投影的投射线特征不同；平面若倾斜于投影面一般不反映实形。",
      "unit": "",
      "hint": ""
    },
    {
      "id": "Q003",
      "lesson": "projection",
      "type": "single",
      "stem": "当某平面图形垂直于投影面时，正投影可能表现为：",
      "options": [
        "原面积",
        "一直线",
        "一个立方体",
        "透视图"
      ],
      "answer": 1,
      "explain": "投影面垂直的平面图形表现积聚性，二维区域积聚到线。",
      "unit": "",
      "hint": ""
    },
    {
      "id": "Q004",
      "lesson": "projection",
      "type": "order",
      "stem": "从空间物体形成正投影的合理流程是：",
      "options": [
        "选择投影面和方向",
        "从物体作垂直投射线",
        "求与投影面的交点",
        "按对应关系连接投影"
      ],
      "answer": [
        0,
        1,
        2,
        3
      ],
      "explain": "正投影先定义投影面和方向，再作垂直投射线确定投影点，最后连接。",
      "unit": "",
      "hint": ""
    },
    {
      "id": "Q005",
      "lesson": "system",
      "type": "single",
      "stem": "采用第一角画法时，俯视图一般放在主视图的：",
      "options": [
        "上方",
        "下方",
        "左侧",
        "右侧"
      ],
      "answer": 1,
      "explain": "第一角画法：俯视图位于主视图下方，左视图在主视图右侧。",
      "unit": "",
      "hint": ""
    },
    {
      "id": "Q006",
      "lesson": "system",
      "type": "single",
      "stem": "主视图和左视图共同反映哪一个尺寸方向？",
      "options": [
        "长度",
        "宽度",
        "高度",
        "面积"
      ],
      "answer": 2,
      "explain": "主视图与左视图高度平齐。",
      "unit": "",
      "hint": ""
    },
    {
      "id": "Q007",
      "lesson": "system",
      "type": "multi",
      "stem": "以下对应关系正确的是：",
      "options": [
        "主视与俯视长对正",
        "主视与左视高平齐",
        "俯视与左视宽相等",
        "三视图可以独立采用不同的比例"
      ],
      "answer": [
        0,
        1,
        2
      ],
      "explain": "三个视图属于同一物体，长宽高相互对应。",
      "unit": "",
      "hint": ""
    },
    {
      "id": "Q008",
      "lesson": "system",
      "type": "order",
      "stem": "三投影面体系展开的合理步骤：",
      "options": [
        "建立 V、H、W 三投影面",
        "明确 O、X、Y、Z",
        "展开 H、W 到同一平面",
        "绘制投影对应线"
      ],
      "answer": [
        0,
        1,
        2,
        3
      ],
      "explain": "先立体系与投影轴，再展开并传递坐标。",
      "unit": "",
      "hint": ""
    },
    {
      "id": "Q009",
      "lesson": "point",
      "type": "single",
      "stem": "空间点 A(45,20,35) 的正面投影 a′ 应保留：",
      "options": [
        "x 与 y",
        "x 与 z",
        "y 与 z",
        "全部坐标"
      ],
      "answer": 1,
      "explain": "V 面的两个坐标是 x、z。",
      "unit": "",
      "hint": ""
    },
    {
      "id": "Q010",
      "lesson": "point",
      "type": "numeric",
      "stem": "点 A(45,20,35) 的水平投影 a 到 OX 轴的距离是多少？",
      "options": [],
      "answer": 20,
      "explain": "水平投影 a 保留 x、y，其距 OX 为深度坐标 y。",
      "unit": "mm",
      "hint": ""
    },
    {
      "id": "Q011",
      "lesson": "point",
      "type": "numeric",
      "stem": "点 B(60,35,48) 的侧面投影 b″ 距 OZ 轴的距离是多少？",
      "options": [],
      "answer": 35,
      "explain": "侧面投影保留 y、z，因此距 OZ 轴为 y。",
      "unit": "mm",
      "hint": ""
    },
    {
      "id": "Q012",
      "lesson": "point",
      "type": "multi",
      "stem": "A(30,20,40) 的投影对应关系有哪些？",
      "options": [
        "a′=(30,40)",
        "a=(30,20)",
        "a″=(20,40)",
        "a″=(30,20)"
      ],
      "answer": [
        0,
        1,
        2
      ],
      "explain": "分别使用 (x,z)、(x,y)、(y,z)。",
      "unit": "",
      "hint": ""
    },
    {
      "id": "Q013",
      "lesson": "point",
      "type": "order",
      "stem": "已知点的正面和水平投影，求侧面投影：",
      "options": [
        "由 a′ 确定高度 z",
        "由 a 确定深度 y",
        "把 y 距离转移到 W 展开位置",
        "确定 a″ 并核对投影连线"
      ],
      "answer": [
        0,
        1,
        2,
        3
      ],
      "explain": "侧面投影使用 y 和 z，须从已有两个视图转移。",
      "unit": "",
      "hint": ""
    },
    {
      "id": "Q014",
      "lesson": "point",
      "type": "numeric",
      "stem": "点 C(18,42,65) 的正面投影到 OX 轴的距离为多少？",
      "options": [],
      "answer": 65,
      "explain": "正面投影高度是 z。",
      "unit": "mm",
      "hint": ""
    },
    {
      "id": "Q015",
      "lesson": "point-relation",
      "type": "single",
      "stem": "A(30,15,20)、B(30,15,60) 在哪个投影面上重影？",
      "options": [
        "正面 V",
        "水平 H",
        "侧面 W",
        "均重影"
      ],
      "answer": 1,
      "explain": "两点 x、y 相同，所以 H 面投影重合。",
      "unit": "",
      "hint": ""
    },
    {
      "id": "Q016",
      "lesson": "point-relation",
      "type": "multi",
      "stem": "点 P(25,0,35) 的位置满足：",
      "options": [
        "点位于正面 V 上",
        "水平投影位于 OX 轴上",
        "侧面投影位于 OZ 轴上",
        "点位于 H 面上"
      ],
      "answer": [
        0,
        1,
        2
      ],
      "explain": "y=0 表示位于 V；在 H 投影 y=0 处和 W 投影 y=0 处都位于对应轴。",
      "unit": "",
      "hint": ""
    },
    {
      "id": "Q017",
      "lesson": "point-relation",
      "type": "single",
      "stem": "点 A(20,40,10) 与 B(20,20,10)，其哪个面上的投影重合？",
      "options": [
        "V 面",
        "H 面",
        "W 面",
        "全部"
      ],
      "answer": 0,
      "explain": "x 和 z 相同，因此正面投影重合。",
      "unit": "",
      "hint": ""
    },
    {
      "id": "Q018",
      "lesson": "point-relation",
      "type": "numeric",
      "stem": "A(10,25,15)、B(10,25,52) 两点的高差是多少？",
      "options": [],
      "answer": 37,
      "explain": "两个点的 z 差为 52−15。",
      "unit": "mm",
      "hint": ""
    },
    {
      "id": "Q019",
      "lesson": "line-special",
      "type": "single",
      "stem": "A(10,20,30) B(50,20,60) 两点连线为：",
      "options": [
        "水平线",
        "正平线",
        "侧平线",
        "铅垂线"
      ],
      "answer": 1,
      "explain": "y 相同，空间线段平行 V，属于正平线。",
      "unit": "",
      "hint": ""
    },
    {
      "id": "Q020",
      "lesson": "line-special",
      "type": "single",
      "stem": "铅垂线在 H 面上的投影是：",
      "options": [
        "真长线段",
        "一点",
        "斜线",
        "圆"
      ],
      "answer": 1,
      "explain": "铅垂线垂直 H 面，因而 H 面投影积聚为一点。",
      "unit": "",
      "hint": ""
    },
    {
      "id": "Q021",
      "lesson": "line-special",
      "type": "multi",
      "stem": "关于水平线正确的是：",
      "options": [
        "两个端点 z 相同",
        "在 H 面投影反映真长",
        "在 V 面投影积聚为点",
        "在 V 面投影平行 OX"
      ],
      "answer": [
        0,
        1,
        3
      ],
      "explain": "水平线平行 H，故 H 反映真长；V 投影为平行 X 轴的线而非点（非退化情形）。",
      "unit": "",
      "hint": ""
    },
    {
      "id": "Q022",
      "lesson": "line-special",
      "type": "single",
      "stem": "A(15,12,10)、B(15,12,65) 属于：",
      "options": [
        "正垂线",
        "侧垂线",
        "铅垂线",
        "一般位置直线"
      ],
      "answer": 2,
      "explain": "Δx=Δy=0，只沿 z 方向变化，因此垂直 H。",
      "unit": "",
      "hint": ""
    },
    {
      "id": "Q023",
      "lesson": "line-special",
      "type": "single",
      "stem": "侧平线在什么投影面反映真长？",
      "options": [
        "V",
        "H",
        "W",
        "三个面"
      ],
      "answer": 2,
      "explain": "侧平线平行 W，所以 W 投影反映真长。",
      "unit": "",
      "hint": ""
    },
    {
      "id": "Q024",
      "lesson": "line-general",
      "type": "numeric",
      "stem": "A(10,10,10)、B(40,50,70) mm，AB 的水平投影长度为多少？",
      "options": [],
      "answer": 50,
      "explain": "Δx=30、Δy=40，Lh=√(30²+40²)=50。",
      "unit": "mm",
      "hint": ""
    },
    {
      "id": "Q025",
      "lesson": "line-general",
      "type": "numeric",
      "stem": "A(0,0,0)、B(30,40,0) mm，AB 的空间真长是多少？",
      "options": [],
      "answer": 50,
      "explain": "Δz=0，线段平行 H，真长 √(30²+40²)=50。",
      "unit": "mm",
      "hint": ""
    },
    {
      "id": "Q026",
      "lesson": "line-general",
      "type": "numeric",
      "stem": "A(5,8,10)、B(8,12,22) mm，AB 的真长是多少？",
      "options": [],
      "answer": 13,
      "explain": "Δx=3、Δy=4、Δz=12，L=√169=13。",
      "unit": "mm",
      "hint": ""
    },
    {
      "id": "Q027",
      "lesson": "line-general",
      "type": "single",
      "stem": "一般位置直线的三投影长度通常：",
      "options": [
        "有一个总是真长",
        "三个投影都短于真长",
        "三个投影都等于真长",
        "有两个积聚为点"
      ],
      "answer": 1,
      "explain": "一般位置直线既不平行也不垂直三投影面，正投影通常缩短。",
      "unit": "",
      "hint": ""
    },
    {
      "id": "Q028",
      "lesson": "line-general",
      "type": "single",
      "stem": "求一般位置直线真长的直角三角形法，以 H 面投影为一直角边，另一直角边应取：",
      "options": [
        "x 坐标差",
        "y 坐标差",
        "z 坐标差",
        "三个坐标之和"
      ],
      "answer": 2,
      "explain": "水平投影已包含 x、y 变化，另一条边补上高度差 Δz。",
      "unit": "",
      "hint": ""
    },
    {
      "id": "Q029",
      "lesson": "line-relations",
      "type": "single",
      "stem": "两条直线的主视图投影交于一点，就能判断空间两线相交吗？",
      "options": [
        "一定能",
        "不一定，须核对其他视图交点是否对应",
        "不可能相交",
        "只有水平线才可以"
      ],
      "answer": 1,
      "explain": "一个视图的投影交点可能属于不同的空间点。",
      "unit": "",
      "hint": ""
    },
    {
      "id": "Q030",
      "lesson": "line-relations",
      "type": "multi",
      "stem": "判断空间直线相交可采用哪些条件？",
      "options": [
        "在两个相关视图中确认交点投影对应",
        "验证同一个空间交点位于两条直线上",
        "只要一个投影交叉就算相交",
        "投影连线关系必须一致"
      ],
      "answer": [
        0,
        1,
        3
      ],
      "explain": "需多个视图的交点对应关系，而不是看单幅二维交叉。",
      "unit": "",
      "hint": ""
    },
    {
      "id": "Q031",
      "lesson": "line-relations",
      "type": "single",
      "stem": "异面直线指的是：",
      "options": [
        "既不平行也不相交的空间直线",
        "任意两条垂直线",
        "两个视图中重合的直线",
        "同平面内相交线"
      ],
      "answer": 0,
      "explain": "异面直线不存在共同平面，既不相交也不平行。",
      "unit": "",
      "hint": ""
    },
    {
      "id": "Q032",
      "lesson": "line-relations",
      "type": "single",
      "stem": "若两条空间直线平行（不考虑投影积聚），对应投影的方向关系：",
      "options": [
        "任意变化",
        "保持平行",
        "必定垂直",
        "必定重合"
      ],
      "answer": 1,
      "explain": "平行投影保持平行线方向；积聚情形需用其他视图辅助判断。",
      "unit": "",
      "hint": ""
    },
    {
      "id": "Q033",
      "lesson": "plane-special",
      "type": "single",
      "stem": "平面上所有点的 z 坐标相同，所在平面为：",
      "options": [
        "正平面",
        "水平面",
        "侧平面",
        "一般位置平面"
      ],
      "answer": 1,
      "explain": "z 恒定，平面与 H 平行。",
      "unit": "",
      "hint": ""
    },
    {
      "id": "Q034",
      "lesson": "plane-special",
      "type": "single",
      "stem": "正垂面在哪一个投影面上的投影积聚为线？",
      "options": [
        "V",
        "H",
        "W",
        "都积聚"
      ],
      "answer": 0,
      "explain": "正垂面垂直 V，故 V 投影积聚。",
      "unit": "",
      "hint": ""
    },
    {
      "id": "Q035",
      "lesson": "plane-special",
      "type": "multi",
      "stem": "有关水平面的表述正确的是：",
      "options": [
        "H 面投影反映实形",
        "V 面投影积聚成线",
        "W 面投影积聚成线",
        "所有投影都反映实形"
      ],
      "answer": [
        0,
        1,
        2
      ],
      "explain": "水平面平行 H，垂直 V 与 W。",
      "unit": "",
      "hint": ""
    },
    {
      "id": "Q036",
      "lesson": "plane-special",
      "type": "single",
      "stem": "侧平面上点的哪个坐标相同？",
      "options": [
        "x",
        "y",
        "z",
        "三个坐标"
      ],
      "answer": 0,
      "explain": "侧平面平行 W，故 x 恒定。",
      "unit": "",
      "hint": ""
    },
    {
      "id": "Q037",
      "lesson": "plane-special",
      "type": "single",
      "stem": "一般位置平面相对于三个投影面通常：",
      "options": [
        "有一个平行",
        "有一个垂直",
        "均倾斜",
        "三个都平行"
      ],
      "answer": 2,
      "explain": "一般位置平面不平行也不垂直任一基本投影面。",
      "unit": "",
      "hint": ""
    },
    {
      "id": "Q038",
      "lesson": "plane-general",
      "type": "single",
      "stem": "要证明点 S 在平面 △PQR 内，可以先证明：",
      "options": [
        "S 在某一视图的三角形内部",
        "S 位于 △PQR 的一条已知空间线段上",
        "S 到 H 面距离不变",
        "S 具有最大的 x 坐标"
      ],
      "answer": 1,
      "explain": "平面内直线上的点必属于该平面；投影范围内并不保证空间从属。",
      "unit": "",
      "hint": ""
    },
    {
      "id": "Q039",
      "lesson": "plane-general",
      "type": "multi",
      "stem": "判断平面上某直线是否属于该平面，可以用：",
      "options": [
        "直线通过平面上两点",
        "直线通过平面上一点且与平面内另一条直线平行",
        "直线一个视图落在平面投影内部",
        "只比较直线的长度"
      ],
      "answer": [
        0,
        1
      ],
      "explain": "两点法或平行于平面内一条线并过平面上一点的条件可用于判定。",
      "unit": "",
      "hint": ""
    },
    {
      "id": "Q040",
      "lesson": "plane-general",
      "type": "numeric",
      "stem": "已知 P(10,15,10)、Q(60,25,30)，其线段中点 S 的 z 坐标为多少？",
      "options": [],
      "answer": 20,
      "explain": "z_S=(10+30)/2=20。",
      "unit": "mm",
      "hint": ""
    },
    {
      "id": "Q041",
      "lesson": "plane-general",
      "type": "single",
      "stem": "平面 PQR 的一个视图是三角形，点 S 的对应视图落在该三角形里，可以直接断定 S 在空间平面内吗？",
      "options": [
        "可以",
        "不可以",
        "只有正平面可以",
        "只要线型正确即可"
      ],
      "answer": 1,
      "explain": "必须利用多个视图的投影关系以及平面内辅助线判定。",
      "unit": "",
      "hint": ""
    },
    {
      "id": "Q042",
      "lesson": "plane-general",
      "type": "order",
      "stem": "通过平面内一条辅助线确认点 S 从属关系的基本流程：",
      "options": [
        "在平面上选取可构造的辅助线",
        "在已知视图求 S 与辅助线关系",
        "求辅助线和 S 在其他视图的对应投影",
        "核对 S 是否同时落在各视图对应线段上"
      ],
      "answer": [
        0,
        1,
        2,
        3
      ],
      "explain": "从属问题要跨视图验证，辅助线为判定桥梁。",
      "unit": "",
      "hint": ""
    },
    {
      "id": "Q043",
      "lesson": "solid",
      "type": "single",
      "stem": "绘制平面立体的三视图时，通常应先确定：",
      "options": [
        "剖面线",
        "所有顶点的投影",
        "零件序号",
        "表面粗糙度"
      ],
      "answer": 1,
      "explain": "顶点与棱边是平面立体的基本图形元素。",
      "unit": "",
      "hint": ""
    },
    {
      "id": "Q044",
      "lesson": "solid",
      "type": "multi",
      "stem": "校核三视图应检查：",
      "options": [
        "长对正",
        "高平齐",
        "宽相等",
        "全部不可见边都用粗实线"
      ],
      "answer": [
        0,
        1,
        2
      ],
      "explain": "三视图长宽高一致；不可见轮廓应按条件使用虚线，不应直接都用粗实线。",
      "unit": "",
      "hint": ""
    },
    {
      "id": "Q045",
      "lesson": "solid",
      "type": "single",
      "stem": "棱柱某一面平行 H，则其水平投影会：",
      "options": [
        "可反映该面实形",
        "积聚为一点",
        "全部轮廓消失",
        "自动变成透视图"
      ],
      "answer": 0,
      "explain": "与投影面平行的平面图形在该面正投影可反映实形。",
      "unit": "",
      "hint": ""
    },
    {
      "id": "Q046",
      "lesson": "solid",
      "type": "order",
      "stem": "从点线面知识迁移到棱柱投影的合理顺序：",
      "options": [
        "识别顶点与棱线",
        "投影主要顶点",
        "连接可见与不可见棱边",
        "检查三视图对应及线型"
      ],
      "answer": [
        0,
        1,
        2,
        3
      ],
      "explain": "从点到线，再到整个面和形体，最终校核线型和对应关系。",
      "unit": "",
      "hint": ""
    },
    {
      "id": "Q047",
      "lesson": "point",
      "type": "numeric",
      "stem": "点 D(38,22,51) 的正面投影 d′ 的 x 坐标是多少？",
      "options": [],
      "answer": 38,
      "explain": "V 面投影保留 x 和 z。",
      "unit": "mm",
      "hint": ""
    },
    {
      "id": "Q048",
      "lesson": "point-relation",
      "type": "single",
      "stem": "点 T(0,0,45) 位于：",
      "options": [
        "OX 轴",
        "OY 轴",
        "OZ 轴",
        "H 面内一般位置"
      ],
      "answer": 2,
      "explain": "x=y=0，故位于 OZ 轴。",
      "unit": "",
      "hint": ""
    },
    {
      "id": "Q049",
      "lesson": "line-special",
      "type": "single",
      "stem": "A(10,20,30)、B(45,55,30) 连接为：",
      "options": [
        "水平线",
        "正平线",
        "侧平线",
        "铅垂线"
      ],
      "answer": 0,
      "explain": "Δz=0，AB 平行 H。",
      "unit": "",
      "hint": ""
    },
    {
      "id": "Q050",
      "lesson": "line-general",
      "type": "numeric",
      "stem": "A(0,0,0) B(0,12,5) 的真长是多少？",
      "options": [],
      "answer": 13,
      "explain": "线段差为 (0,12,5)，真长 √(12²+5²)=13。",
      "unit": "mm",
      "hint": ""
    },
    {
      "id": "Q051",
      "lesson": "plane-special",
      "type": "single",
      "stem": "三角形三个顶点的 x 都为 25，则该平面为：",
      "options": [
        "水平面",
        "正平面",
        "侧平面",
        "铅垂面"
      ],
      "answer": 2,
      "explain": "x 恒定的平面平行 W，即侧平面。",
      "unit": "",
      "hint": ""
    },
    {
      "id": "Q052",
      "lesson": "plane-general",
      "type": "numeric",
      "stem": "P(10,20,30) Q(50,40,70)，PQ 中点在 H 面上的 y 坐标是多少？",
      "options": [],
      "answer": 30,
      "explain": "中点的 y 坐标为 (20+40)/2=30。",
      "unit": "mm",
      "hint": ""
    },
    {
      "id": "Q053",
      "lesson": "projection",
      "type": "truefalse",
      "stem": "平行投影法中投射线互相平行，但不一定与投影面垂直。",
      "options": [
        "正确",
        "错误"
      ],
      "answer": 0,
      "explain": "正投影是平行投影法的一种，要求投射线与投影面垂直。",
      "unit": ""
    },
    {
      "id": "Q054",
      "lesson": "system",
      "type": "match",
      "stem": "请匹配三面投影的坐标组成。",
      "options": [
        "正面投影 a′",
        "水平投影 a",
        "侧面投影 a″"
      ],
      "answer": [
        0,
        1,
        2
      ],
      "explain": "正面采用 (x,z)，水平采用 (x,y)，侧面采用 (y,z)。",
      "unit": "",
      "choices": [
        "(x,z)",
        "(x,y)",
        "(y,z)"
      ]
    },
    {
      "id": "Q055",
      "lesson": "point",
      "type": "plot",
      "stem": "A(40,20,50) mm，请在 V 面（正面）图格中点击 a′ 的位置。",
      "options": [],
      "answer": [
        40,
        50
      ],
      "explain": "V 面使用 x=40、z=50。",
      "unit": "",
      "plane": "V"
    },
    {
      "id": "Q056",
      "lesson": "point",
      "type": "plot",
      "stem": "A(40,20,50) mm，请在 H 面（水平）图格中点击 a 的位置。",
      "options": [],
      "answer": [
        40,
        20
      ],
      "explain": "H 面使用 x=40、y=20。",
      "unit": "",
      "plane": "H"
    },
    {
      "id": "Q057",
      "lesson": "point",
      "type": "plot",
      "stem": "A(40,20,50) mm，请在 W 面（侧面）图格中点击 a″ 的位置。",
      "options": [],
      "answer": [
        20,
        50
      ],
      "explain": "W 面使用 y=20、z=50。",
      "unit": "",
      "plane": "W"
    },
    {
      "id": "Q058",
      "lesson": "point-relation",
      "type": "truefalse",
      "stem": "空间中两个点的水平投影重合，说明两个点的 x 和 y 坐标相同。",
      "options": [
        "正确",
        "错误"
      ],
      "answer": 0,
      "explain": "H 面投影采用 (x,y)，z 可以不同。",
      "unit": ""
    },
    {
      "id": "Q059",
      "lesson": "line-special",
      "type": "match",
      "stem": "把特殊位置直线与其反映真长的投影面匹配。",
      "options": [
        "水平线",
        "正平线",
        "侧平线"
      ],
      "answer": [
        1,
        0,
        2
      ],
      "explain": "水平线∥H、正平线∥V、侧平线∥W。",
      "unit": "",
      "choices": [
        "V 面",
        "H 面",
        "W 面"
      ]
    },
    {
      "id": "Q060",
      "lesson": "line-special",
      "type": "truefalse",
      "stem": "铅垂线在水平投影面 H 的投影积聚为一点。",
      "options": [
        "正确",
        "错误"
      ],
      "answer": 0,
      "explain": "直线垂直于某投影面时，该面上的投影积聚为一点。",
      "unit": ""
    },
    {
      "id": "Q061",
      "lesson": "line-general",
      "type": "truefalse",
      "stem": "一条一般位置直线的主视图长度必然等于其空间真长。",
      "options": [
        "正确",
        "错误"
      ],
      "answer": 1,
      "explain": "一般位置直线在三个基本投影面上均不直接反映真长。",
      "unit": ""
    },
    {
      "id": "Q062",
      "lesson": "line-general",
      "type": "numeric",
      "stem": "A(0,0,0)、B(3,4,12) mm，AB 真长是多少？",
      "options": [],
      "answer": 13,
      "explain": "√(3²+4²+12²)=√169=13。",
      "unit": "mm"
    },
    {
      "id": "Q063",
      "lesson": "line-relations",
      "type": "truefalse",
      "stem": "两条直线的正面投影和水平投影都分别相交，就能不经对应关系判断而断定空间相交。",
      "options": [
        "正确",
        "错误"
      ],
      "answer": 1,
      "explain": "还须验证两个投影交点相互对应于同一个空间点。",
      "unit": ""
    },
    {
      "id": "Q064",
      "lesson": "plane-special",
      "type": "match",
      "stem": "匹配平面类型与反映实形的投影面。",
      "options": [
        "水平面",
        "正平面",
        "侧平面"
      ],
      "answer": [
        1,
        0,
        2
      ],
      "explain": "水平面平行 H、正平面平行 V、侧平面平行 W。",
      "unit": "",
      "choices": [
        "V 面",
        "H 面",
        "W 面"
      ]
    },
    {
      "id": "Q065",
      "lesson": "plane-general",
      "type": "truefalse",
      "stem": "某点的正面投影位于三角形的正面投影内部，就足以证明该点在空间三角形内。",
      "options": [
        "正确",
        "错误"
      ],
      "answer": 1,
      "explain": "必须通过投影对应关系和辅助线进一步检验空间从属。",
      "unit": ""
    },
    {
      "id": "Q066",
      "lesson": "solid",
      "type": "truefalse",
      "stem": "棱柱某条棱线在一个视图被遮挡，不能仅凭其他视图中的位置判断它应画成实线。",
      "options": [
        "正确",
        "错误"
      ],
      "answer": 0,
      "explain": "应结合观察方向和空间遮挡关系判断可见性与线型。",
      "unit": ""
    },
    {
      "id": "Q067",
      "lesson": "line-special",
      "type": "plotline",
      "stem": "水平线 AB：A(15,20,40)、B(65,50,40) mm。请在 V 面画出直线 AB 的正面投影。",
      "options": [],
      "answer": [
        [
          15,
          40
        ],
        [
          65,
          40
        ]
      ],
      "explain": "正面投影只保留 x、z，两端点高度都是 40 mm，所得 a′b′ 与 OX 轴平行。",
      "plane": "V",
      "unit": "mm"
    },
    {
      "id": "Q068",
      "lesson": "line-special",
      "type": "plotline",
      "stem": "正平线 AB：A(10,25,20)、B(65,25,60) mm。请在 H 面画水平投影 ab。",
      "options": [],
      "answer": [
        [
          10,
          25
        ],
        [
          65,
          25
        ]
      ],
      "explain": "水平投影只保留 x、y。两个端点 y 都是 25 mm，因此 ab 与 OX 平行。",
      "plane": "H",
      "unit": "mm"
    },
    {
      "id": "Q069",
      "lesson": "line-special",
      "type": "plotline",
      "stem": "侧平线 AB：A(35,10,15)、B(35,65,55) mm。请在 W 面画侧面投影 a″b″。",
      "options": [],
      "answer": [
        [
          10,
          15
        ],
        [
          65,
          55
        ]
      ],
      "explain": "侧面投影保留 y 和 z，在 W 面两端为 (10,15) 与 (65,55)。",
      "plane": "W",
      "unit": "mm"
    },
    {
      "id": "Q070",
      "lesson": "line-general",
      "type": "plotline",
      "stem": "一般位置直线：A(20,15,20)、B(65,55,60) mm。请在 V 面画出 a′b′。",
      "options": [],
      "answer": [
        [
          20,
          20
        ],
        [
          65,
          60
        ]
      ],
      "explain": "V 面保留 x 和 z，投影端点为 (20,20)、(65,60)，再连接端点。",
      "plane": "V",
      "unit": "mm"
    },
    {
      "id": "Q071",
      "lesson": "line-general",
      "type": "plotline",
      "stem": "一般位置直线：A(20,15,20)、B(65,55,60) mm。请在 H 面画出 ab。",
      "options": [],
      "answer": [
        [
          20,
          15
        ],
        [
          65,
          55
        ]
      ],
      "explain": "H 面保留 x 和 y，投影端点为 (20,15)、(65,55)，再连接端点。",
      "plane": "H",
      "unit": "mm"
    },
    {
      "id": "Q072",
      "lesson": "line-general",
      "type": "plotline",
      "stem": "一般位置直线：A(20,15,20)、B(65,55,60) mm。请在 W 面画出 a″b″。",
      "options": [],
      "answer": [
        [
          15,
          20
        ],
        [
          55,
          60
        ]
      ],
      "explain": "W 面保留 y 和 z，投影端点为 (15,20)、(55,60)，再连接端点。",
      "plane": "W",
      "unit": "mm"
    },
    {
      "id": "Q073",
      "lesson": "line-relations",
      "type": "plotline",
      "stem": "判断投影是否同向：两条平行空间线 AB 与 CD，已知 A(10,15,10)、B(35,40,35)、C(30,10,20)、D(55,35,45)。请画 AB 在 H 面的投影。",
      "options": [],
      "answer": [
        [
          10,
          15
        ],
        [
          35,
          40
        ]
      ],
      "explain": "AB 的 H 面投影端点为 (10,15) 和 (35,40)。CD 相对 AB 的位移方向相同，空间中互相平行。",
      "plane": "H",
      "unit": "mm"
    },
    {
      "id": "Q074",
      "lesson": "point-relation",
      "type": "plotline",
      "stem": "空间点连线：A(25,20,15)、B(25,20,55)。请在 V 面画两点之间的投影线段。",
      "options": [],
      "answer": [
        [
          25,
          15
        ],
        [
          25,
          55
        ]
      ],
      "explain": "两个点的 x 坐标相同，V 面投影为竖直线段，z 从 15 到 55。",
      "plane": "V",
      "unit": "mm"
    }
  ]
};
