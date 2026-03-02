/**
 * Diagram Templates for Insert Menu
 * Provides templates for mermaid, vega-lite, and graphviz diagrams
 */

export interface DiagramTemplate {
  id: string;
  /** i18n key for the label (e.g., 'diagram.mermaidFlowchart') */
  labelKey: string;
  template: string;
}

export interface DiagramCategory {
  id: string;
  /** i18n key for the category label (e.g., 'diagram.mermaid') */
  labelKey: string;
  templates: DiagramTemplate[];
}

export const DIAGRAM_CATEGORIES: DiagramCategory[] = [
  {
    id: 'mermaid',
    labelKey: 'diagram.mermaid',
    templates: [
      {
        id: 'mermaid-flowchart',
        labelKey: 'diagram.mermaidFlowchart',
        template: `\`\`\`mermaid
graph TD
    A[开始] --> B{判断条件}
    B -->|是| C[执行操作]
    B -->|否| D[其他操作]
    C --> E[结束]
    D --> E
\`\`\``,
      },
      {
        id: 'mermaid-sequence',
        labelKey: 'diagram.mermaidSequence',
        template: `\`\`\`mermaid
sequenceDiagram
    participant A as 用户
    participant B as 服务器
    participant C as 数据库

    A->>B: 发送请求
    B->>C: 查询数据
    C-->>B: 返回结果
    B-->>A: 响应数据
\`\`\``,
      },
      {
        id: 'mermaid-class',
        labelKey: 'diagram.mermaidClass',
        template: `\`\`\`mermaid
classDiagram
    class Animal {
        +String name
        +int age
        +makeSound()
    }
    class Dog {
        +String breed
        +bark()
    }
    Animal <|-- Dog
\`\`\``,
      },
      {
        id: 'mermaid-state',
        labelKey: 'diagram.mermaidState',
        template: `\`\`\`mermaid
stateDiagram-v2
    [*] --> 待处理
    待处理 --> 处理中: 开始处理
    处理中 --> 已完成: 处理成功
    处理中 --> 失败: 处理出错
    失败 --> 处理中: 重试
    已完成 --> [*]
\`\`\``,
      },
      {
        id: 'mermaid-er',
        labelKey: 'diagram.mermaidEr',
        template: `\`\`\`mermaid
erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ LINE-ITEM : contains
    CUSTOMER {
        string name
        string email
    }
    ORDER {
        int id
        date created
    }
    LINE-ITEM {
        string product
        int quantity
    }
\`\`\``,
      },
      {
        id: 'mermaid-gantt',
        labelKey: 'diagram.mermaidGantt',
        template: `\`\`\`mermaid
gantt
    title 项目开发计划
    dateFormat  YYYY-MM-DD

    section 需求阶段
    需求分析     :a1, 2024-01-01, 7d
    需求评审     :a2, after a1, 3d

    section 开发阶段
    架构设计     :b1, after a2, 5d
    编码实现     :b2, after b1, 14d
    单元测试     :b3, after b2, 7d

    section 发布阶段
    集成测试     :c1, after b3, 5d
    部署上线     :c2, after c1, 3d
\`\`\``,
      },
      {
        id: 'mermaid-pie',
        labelKey: 'diagram.mermaidPie',
        template: `\`\`\`mermaid
pie showData
    title 数据分布
    "类型A" : 45
    "类型B" : 30
    "类型C" : 15
    "其他" : 10
\`\`\``,
      },
      {
        id: 'mermaid-mindmap',
        labelKey: 'diagram.mermaidMindmap',
        template: `\`\`\`mermaid
mindmap
  root((中心主题))
    分支1
      子节点1-1
      子节点1-2
    分支2
      子节点2-1
    分支3
      子节点3-1
      子节点3-2
\`\`\``,
      },
    ],
  },
  {
    id: 'vega-lite',
    labelKey: 'diagram.vegaLite',
    templates: [
      {
        id: 'vega-lite-bar',
        labelKey: 'diagram.vegaLiteBar',
        template: `\`\`\`vega-lite
{
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
  "data": {
    "values": [
      {"category": "A", "value": 28},
      {"category": "B", "value": 55},
      {"category": "C", "value": 43},
      {"category": "D", "value": 91}
    ]
  },
  "mark": "bar",
  "encoding": {
    "x": {"field": "category", "type": "nominal"},
    "y": {"field": "value", "type": "quantitative"}
  }
}
\`\`\``,
      },
      {
        id: 'vega-lite-line',
        labelKey: 'diagram.vegaLiteLine',
        template: `\`\`\`vega-lite
{
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
  "data": {
    "values": [
      {"date": "2024-01", "value": 10},
      {"date": "2024-02", "value": 15},
      {"date": "2024-03", "value": 12},
      {"date": "2024-04", "value": 20}
    ]
  },
  "mark": "line",
  "encoding": {
    "x": {"field": "date", "type": "temporal"},
    "y": {"field": "value", "type": "quantitative"}
  }
}
\`\`\``,
      },
      {
        id: 'vega-lite-area',
        labelKey: 'diagram.vegaLiteArea',
        template: `\`\`\`vega-lite
{
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
  "width": 400,
  "height": 200,
  "data": {
    "values": [
      {"month": "Jan", "value": 100},
      {"month": "Feb", "value": 150},
      {"month": "Mar", "value": 120},
      {"month": "Apr", "value": 180},
      {"month": "May", "value": 200}
    ]
  },
  "mark": "area",
  "encoding": {
    "x": {"field": "month", "type": "nominal", "axis": {"title": "月份"}},
    "y": {"field": "value", "type": "quantitative", "axis": {"title": "数值"}}
  }
}
\`\`\``,
      },
      {
        id: 'vega-lite-scatter',
        labelKey: 'diagram.vegaLiteScatter',
        template: `\`\`\`vega-lite
{
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
  "width": 400,
  "height": 300,
  "data": {
    "values": [
      {"x": 10, "y": 20, "category": "A"},
      {"x": 30, "y": 40, "category": "A"},
      {"x": 50, "y": 60, "category": "B"},
      {"x": 70, "y": 30, "category": "B"},
      {"x": 90, "y": 80, "category": "C"}
    ]
  },
  "mark": "point",
  "encoding": {
    "x": {"field": "x", "type": "quantitative"},
    "y": {"field": "y", "type": "quantitative"},
    "color": {"field": "category", "type": "nominal"},
    "shape": {"field": "category", "type": "nominal"}
  }
}
\`\`\``,
      },
      {
        id: 'vega-lite-pie',
        labelKey: 'diagram.vegaLitePie',
        template: `\`\`\`vega-lite
{
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
  "data": {
    "values": [
      {"category": "类别A", "value": 40},
      {"category": "类别B", "value": 30},
      {"category": "类别C", "value": 20},
      {"category": "其他", "value": 10}
    ]
  },
  "mark": {"type": "arc", "innerRadius": 0},
  "encoding": {
    "theta": {"field": "value", "type": "quantitative"},
    "color": {"field": "category", "type": "nominal"}
  }
}
\`\`\``,
      },
      {
        id: 'vega-lite-heatmap',
        labelKey: 'diagram.vegaLiteHeatmap',
        template: `\`\`\`vega-lite
{
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
  "width": 300,
  "height": 200,
  "data": {
    "values": [
      {"day": "Mon", "hour": 9, "value": 10},
      {"day": "Mon", "hour": 12, "value": 50},
      {"day": "Mon", "hour": 18, "value": 30},
      {"day": "Tue", "hour": 9, "value": 20},
      {"day": "Tue", "hour": 12, "value": 60},
      {"day": "Tue", "hour": 18, "value": 40},
      {"day": "Wed", "hour": 9, "value": 15},
      {"day": "Wed", "hour": 12, "value": 45},
      {"day": "Wed", "hour": 18, "value": 35}
    ]
  },
  "mark": "rect",
  "encoding": {
    "x": {"field": "hour", "type": "ordinal"},
    "y": {"field": "day", "type": "ordinal"},
    "color": {"field": "value", "type": "quantitative"}
  }
}
\`\`\``,
      },
      {
        id: 'vega-lite-stacked-bar',
        labelKey: 'diagram.vegaLiteStackedBar',
        template: `\`\`\`vega-lite
{
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
  "width": 400,
  "height": 300,
  "data": {
    "values": [
      {"quarter": "Q1", "product": "A", "sales": 100},
      {"quarter": "Q1", "product": "B", "sales": 80},
      {"quarter": "Q2", "product": "A", "sales": 120},
      {"quarter": "Q2", "product": "B", "sales": 90},
      {"quarter": "Q3", "product": "A", "sales": 150},
      {"quarter": "Q3", "product": "B", "sales": 110}
    ]
  },
  "mark": "bar",
  "encoding": {
    "x": {"field": "quarter", "type": "nominal"},
    "y": {"field": "sales", "type": "quantitative"},
    "color": {"field": "product", "type": "nominal"},
    "xOffset": {"field": "product"}
  }
}
\`\`\``,
      },
    ],
  },
  {
    id: 'dot',
    labelKey: 'diagram.dot',
    templates: [
      {
        id: 'dot-basic',
        labelKey: 'diagram.dotBasic',
        template: `\`\`\`dot
digraph G {
    rankdir=LR;
    A [label="节点A"];
    B [label="节点B"];
    C [label="节点C"];

    A -> B [label="连接"];
    B -> C;
    C -> A;
}
\`\`\``,
      },
      {
        id: 'dot-tree',
        labelKey: 'diagram.dotTree',
        template: `\`\`\`dot
digraph Tree {
    node [shape=box];
    rankdir=TB;

    Root [label="根节点"];
    Root -> Child1 [label="左"];
    Root -> Child2 [label="右"];

    Child1 [label="子节点1"];
    Child1 -> Leaf1;
    Child1 -> Leaf2;

    Child2 [label="子节点2"];
    Child2 -> Leaf3;
    Child2 -> Leaf4;

    Leaf1 [label="叶子1", shape=ellipse];
    Leaf2 [label="叶子2", shape=ellipse];
    Leaf3 [label="叶子3", shape=ellipse];
    Leaf4 [label="叶子4", shape=ellipse];
}
\`\`\``,
      },
      {
        id: 'dot-cluster',
        labelKey: 'diagram.dotCluster',
        template: `\`\`\`dot
digraph Clusters {
    rankdir=TB;
    node [shape=box];

    subgraph cluster_frontend {
        label = "前端层";
        style = filled;
        color = lightblue;
        Web [label="Web应用"];
        Mobile [label="移动端"];
    }

    subgraph cluster_backend {
        label = "后端层";
        style = filled;
        color = lightgreen;
        API [label="API服务"];
        Auth [label="认证服务"];
    }

    subgraph cluster_data {
        label = "数据层";
        style = filled;
        color = lightyellow;
        DB [label="数据库"];
        Cache [label="缓存"];
    }

    Web -> API;
    Mobile -> API;
    API -> Auth;
    API -> DB;
    API -> Cache;
}
\`\`\``,
      },
      {
        id: 'dot-state',
        labelKey: 'diagram.dotState',
        template: `\`\`\`dot
digraph StateMachine {
    rankdir=LR;
    node [shape=circle];

    init [label="", shape=point];
    idle [label="空闲"];
    processing [label="处理中"];
    success [label="成功", shape=doublecircle];
    error [label="错误"];

    init -> idle;
    idle -> processing [label="开始"];
    processing -> success [label="完成"];
    processing -> error [label="失败"];
    error -> idle [label="重试"];
}
\`\`\``,
      },
    ],
  },
  {
    id: 'vega',
    labelKey: 'diagram.vega',
    templates: [
      {
        id: 'vega-bar',
        labelKey: 'diagram.vegaBar',
        template: `\`\`\`vega
{
  "$schema": "https://vega.github.io/schema/vega/v5.json",
  "width": 400,
  "height": 200,
  "padding": 5,
  "data": [
    {
      "name": "table",
      "values": [
        {"category": "A", "amount": 28},
        {"category": "B", "amount": 55},
        {"category": "C", "amount": 43},
        {"category": "D", "amount": 91}
      ]
    }
  ],
  "scales": [
    {
      "name": "xscale",
      "type": "band",
      "domain": {"data": "table", "field": "category"},
      "range": "width"
    },
    {
      "name": "yscale",
      "type": "linear",
      "domain": {"data": "table", "field": "amount"},
      "range": "height"
    }
  ],
  "axes": [
    {"orient": "bottom", "scale": "xscale"},
    {"orient": "left", "scale": "yscale"}
  ],
  "marks": [
    {
      "type": "rect",
      "from": {"data": "table"},
      "encode": {
        "enter": {
          "x": {"scale": "xscale", "field": "category"},
          "width": {"scale": "xscale", "band": 1},
          "y": {"scale": "yscale", "field": "amount"},
          "y2": {"scale": "yscale", "value": 0}
        },
        "update": {"fill": {"value": "steelblue"}}
      }
    }
  ]
}
\`\`\``,
      },
      {
        id: 'vega-pie',
        labelKey: 'diagram.vegaPie',
        template: `\`\`\`vega
{
  "$schema": "https://vega.github.io/schema/vega/v5.json",
  "width": 200,
  "height": 200,
  "data": [
    {
      "name": "table",
      "values": [
        {"id": 1, "field": 4},
        {"id": 2, "field": 6},
        {"id": 3, "field": 10},
        {"id": 4, "field": 3}
      ],
      "transform": [
        {"type": "pie", "field": "field"}
      ]
    }
  ],
  "scales": [
    {
      "name": "color",
      "type": "ordinal",
      "domain": {"data": "table", "field": "id"},
      "range": {"scheme": "category20"}
    }
  ],
  "marks": [
    {
      "type": "arc",
      "from": {"data": "table"},
      "encode": {
        "enter": {
          "fill": {"scale": "color", "field": "id"},
          "x": {"signal": "width/2"},
          "y": {"signal": "height/2"}
        },
        "update": {
          "startAngle": {"field": "startAngle"},
          "endAngle": {"field": "endAngle"},
          "innerRadius": {"value": 0},
          "outerRadius": {"signal": "width/2 - 10"}
        }
      }
    }
  ]
}
\`\`\``,
      },
    ],
  },
  {
    id: 'infographic',
    labelKey: 'diagram.infographic',
    templates: [
      {
        id: 'infographic-list',
        labelKey: 'diagram.infographicList',
        template: `\`\`\`infographic
infographic list-row-horizontal-icon-arrow
data
  title 项目进度
  desc 当前阶段概述
  lists
    - label 需求分析
      value 100%
      desc 已完成
      icon check circle
    - label 开发中
      value 60%
      desc 进行中
      icon code
    - label 测试
      value 0%
      desc 待开始
      icon bug
\`\`\``,
      },
      {
        id: 'infographic-compare',
        labelKey: 'diagram.infographicCompare',
        template: `\`\`\`infographic
infographic compare-swot
data
  compares
    - label 优势
      children
        - label 技术领先
        - label 团队专业
    - label 劣势
      children
        - label 资源有限
        - label 时间紧迫
    - label 机会
      children
        - label 市场增长
        - label 政策支持
    - label 威胁
      children
        - label 竞争激烈
        - label 成本上升
\`\`\``,
      },
      {
        id: 'infographic-timeline',
        labelKey: 'diagram.infographicTimeline',
        template: `\`\`\`infographic
infographic list-row-simple-horizontal-arrow
data
  lists
    - label 第一阶段
      desc 需求调研与规划
    - label 第二阶段
      desc 设计与开发
    - label 第三阶段
      desc 测试与上线
    - label 第四阶段
      desc 运维与迭代
\`\`\``,
      },
    ],
  },
];

// Build O(1) lookup map at module load time
const DIAGRAM_TEMPLATE_MAP = new Map<string, DiagramTemplate>();
for (const category of DIAGRAM_CATEGORIES) {
  for (const template of category.templates) {
    DIAGRAM_TEMPLATE_MAP.set(template.id, template);
  }
}

/**
 * Get template by ID
 */
export function getTemplateById(id: string): DiagramTemplate | undefined {
  return DIAGRAM_TEMPLATE_MAP.get(id);
}
