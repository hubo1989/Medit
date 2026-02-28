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
