# Infographic 图表演示

[返回主测试文档](./test.md)

本文档展示 Infographic 信息图各类别的代表性示例。源代码共定义 **212 个模板**，可访问 [AntV Infographic Gallery](https://infographic.antv.vision/examples) 查看在线演示。

---

## 1. 列表类 (List)

```infographic
infographic list-grid-badge-card
data
  title Service Features
  desc Platform capabilities overview
  items
    - label Analytics
      desc Real-time data insights
    - label Security
      desc Enterprise-grade protection
    - label Scalability
      desc Auto-scaling infrastructure
    - label Integration
      desc 100+ API connectors
    - label Support
      desc 24/7 expert assistance
    - label Compliance
      desc SOC2 and GDPR ready
```

**可用模板变体（23 款）：**

- **list-row-\*** 横向列表 — 项目水平排列，带箭头或连接线，适合展示有序流程、步骤说明
  - `list-row-simple-horizontal-arrow` 简约箭头样式
  - `list-row-horizontal-icon-arrow` 带图标的箭头样式
  - `list-row-horizontal-icon-line` 带图标的连线样式
  - `list-row-circular-progress` 环形进度样式
  - `list-row-simple-horizontal-arrow-badge` 带徽章的箭头样式
- **list-column-\*** 纵向列表 — 项目垂直排列，适合展示清单、待办事项、步骤指南
  - `list-column-done-list` 已完成清单样式，带勾选标记
  - `list-column-vertical-icon-arrow` 带图标的垂直箭头
  - `list-column-simple` 简约纵向列表
- **list-grid-\*** 网格列表 — 多列网格布局，适合展示功能特性、产品矩阵、KPI 指标卡
  - `list-grid-badge-card` 徽章卡片，带标签和数值
  - `list-grid-candy-card-lite` 糖果色卡片，清新活泼
  - `list-grid-ribbon-card` 丝带卡片，带装饰条
  - `list-grid-progress-card` 进度卡片，显示完成度
  - `list-grid-circular-progress` 环形进度卡片
  - `list-grid-simple` 简约网格
  - `list-grid-icon-card` 图标卡片
  - `list-grid-number-card` 数字卡片，突出数值
  - `list-grid-underline-text` 下划线文字样式
- **list-sector-\*** 扇形列表 — 扇形/放射状布局，适合展示核心能力、业务板块、围绕中心的分类
  - `list-sector-plain-text` 纯文本扇形
  - `list-sector-half-plain-text` 半圆扇形
  - `list-sector-underline-text` 下划线文字扇形
- **list-pyramid-\*** 金字塔列表 — 层级金字塔结构，适合展示马斯洛需求、投资配置、优先级层次
  - `list-pyramid-compact-card` 紧凑卡片金字塔
  - `list-pyramid-underline-text` 下划线文字金字塔
  - `list-pyramid-simple` 简约金字塔

---

## 2. 序列类 (Sequence)

```infographic
infographic sequence-timeline-simple
data
  title Company Milestones
  desc Key events in our journey
  items
    - label 2018
      desc Company founded with initial team
    - label 2019
      desc First product launch
    - label 2020
      desc Series A funding secured
    - label 2021
      desc Expanded to 10 cities
    - label 2022
      desc Reached 1M users
    - label 2023
      desc International expansion
```

**可用模板变体（46 款）：**

- **sequence-timeline-\*** 时间线 — 垂直时间轴布局，适合展示发展历程、里程碑事件、项目进度
  - `sequence-timeline-simple` 简约时间线
  - `sequence-timeline-done-list` 已完成清单样式
  - `sequence-timeline-rounded-rect-node` 圆角矩形节点
  - `sequence-timeline-plain-text` 纯文本样式
  - `sequence-timeline-simple-illus` 插画风格
- **sequence-steps-\*** 步骤流程 — 带步骤编号的流程图，适合展示操作指南、业务流程、使用教程
  - `sequence-steps-simple` 简约步骤
  - `sequence-steps-badge-card` 徽章卡片步骤
  - `sequence-steps-simple-illus` 插画风格步骤
- **sequence-roadmap-vertical-\*** 路线图 — 产品/战略路线图，适合展示产品规划、战略路径、发展计划
  - `sequence-roadmap-vertical-simple` 简约路线图
  - `sequence-roadmap-vertical-plain-text` 纯文本样式
  - `sequence-roadmap-vertical-badge-card` 徽章卡片样式
  - `sequence-roadmap-vertical-pill-badge` 药丸徽章样式
  - `sequence-roadmap-vertical-quarter-circular` 扇形样式
  - `sequence-roadmap-vertical-quarter-simple-card` 卡片样式
  - `sequence-roadmap-vertical-underline-text` 下划线文字样式
- **sequence-ascending-\*** 递进列表 — 逐级递增的阶梯图，适合展示成长阶段、能力进阶、发展层次
  - `sequence-ascending-steps` 递进步骤
  - `sequence-ascending-stairs-3d-simple` 3D 阶梯简约
  - `sequence-ascending-stairs-3d-underline-text` 3D 阶梯下划线
- **sequence-stairs-front-\*** 阶梯图 — 正面视角的阶梯，适合展示职业发展、能力等级、递进关系
  - `sequence-stairs-front-simple` 简约正面阶梯
  - `sequence-stairs-front-pill-badge` 药丸徽章阶梯
  - `sequence-stairs-front-compact-card` 紧凑卡片阶梯
- **sequence-snake-steps-\*** 蛇形布局 — S 形蜿蜒路径，适合展示用户旅程、复杂流程、多步骤引导
  - `sequence-snake-steps-simple` 简约蛇形
  - `sequence-snake-steps-compact-card` 紧凑卡片蛇形
  - `sequence-snake-steps-pill-badge` 药丸徽章蛇形
  - `sequence-snake-steps-underline-text` 下划线文字蛇形
  - `sequence-snake-steps-simple-illus` 插画风格蛇形
- **sequence-horizontal-zigzag-\*** 水平之字形 — 左右交替的之字路径，适合展示交替流程、创意工作流
  - `sequence-horizontal-zigzag-simple` 简约样式
  - `sequence-horizontal-zigzag-plain-text` 纯文本样式
  - `sequence-horizontal-zigzag-simple-illus` 插画风格
  - `sequence-horizontal-zigzag-horizontal-icon-line` 图标连线样式
  - `sequence-horizontal-zigzag-simple-horizontal-arrow` 箭头样式
  - `sequence-horizontal-zigzag-underline-text` 下划线文字
- **sequence-zigzag-\*** 之字形变体 — 垂直之字形和 3D 样式
  - `sequence-zigzag-steps-underline-text` 垂直之字形
  - `sequence-zigzag-pucks-3d-simple` 3D 圆盘简约
  - `sequence-zigzag-pucks-3d-underline-text` 3D 圆盘下划线
  - `sequence-zigzag-pucks-3d-indexed-card` 3D 圆盘索引卡片
- **sequence-circular-\*** 环形流程 — 闭环循环图，适合展示循环流程、PDCA、持续改进
  - `sequence-circular-simple` 简约环形
  - `sequence-circular-underline-text` 下划线文字环形
- **sequence-filter-mesh-\*** 漏斗图 — 逐级筛选的漏斗形状，适合展示转化漏斗、销售管道
  - `sequence-filter-mesh-simple` 简约漏斗
  - `sequence-filter-mesh-underline-text` 下划线文字漏斗
- **sequence-color-snake-steps-\*** 彩色蛇形 — 多彩蛇形时间线
  - `sequence-color-snake-steps-horizontal-icon-line` 图标连线样式
  - `sequence-color-snake-steps-simple-illus` 插画风格
- `sequence-pyramid-simple` 金字塔 — 层级金字塔，适合展示层级架构
- `sequence-mountain-underline-text` 山峰图 — 山峰形状的里程碑图
- `sequence-cylinders-3d-simple` 圆柱体 — 3D 圆柱堆叠
- `sequence-circle-arrows-indexed-card` 圆形步骤 — 带箭头的环形步骤

---

## 3. 对比类 (Comparison)

```infographic
infographic compare-swot
data
  title SWOT Analysis
  desc Strategic planning framework
  items
    - label Strengths
      children
        - label Leading R&D capability
        - label Complete supply chain
        - label Efficient customer service
        - label Experienced management team
    - label Weaknesses
      children
        - label Insufficient brand exposure
        - label Slow product updates
        - label Limited market channels
        - label High operating costs
    - label Opportunities
      children
        - label Digital transformation trend
        - label Emerging market expansion
        - label Favorable policy support
        - label AI application scenarios
    - label Threats
      children
        - label Intense competition
        - label Rapid demand changes
        - label Lower market barriers
        - label Supply chain risks
```

**可用模板变体（17 款）：**

- `compare-swot` SWOT 分析 — 四象限战略分析框架，适合展示优势/劣势/机会/威胁分析
- **compare-binary-horizontal-\*** 双向对比 — 左右两栏对比布局，适合展示方案对比、优劣势对照
  - 分隔符样式：`-fold`（折叠）、`-arrow`（箭头）、`-vs`（VS 对战）
  - 内容样式：`-simple`、`-underline-text`、`-badge-card`、`-compact-card`
  - 组合示例：`compare-binary-horizontal-simple-fold`、`compare-binary-horizontal-badge-card-vs`
- **compare-hierarchy-left-right-\*** 层级对比 — 左右对称的层级树，适合展示竞品分析、组织对照
  - `compare-hierarchy-left-right-circle-node-plain-text` 圆形节点纯文本
  - `compare-hierarchy-left-right-circle-node-pill-badge` 圆形节点药丸徽章
- **compare-hierarchy-row-\*** 行式对比 — 横向排列的层级对比
  - `compare-hierarchy-row-letter-card-compact-card` 字母卡片配紧凑卡片
  - `compare-hierarchy-row-letter-card-rounded-rect-node` 字母卡片配圆角矩形

---

## 4. 象限类 (Quadrant)

```infographic
infographic quadrant-quarter-circular
data
  title Risk Control Matrix
  desc Frequency vs Impact Analysis
  items
    - label High Impact High Freq
      desc Avoid Risk
    - label Low Impact High Freq
      desc Control Risk
    - label High Impact Low Freq
      desc Transfer Risk
    - label Low Impact Low Freq
      desc Accept Risk
```

**可用模板变体（3 款）：**

- **quadrant-quarter-\*** 四象限 — 经典四象限矩阵，适合展示优先级矩阵、风险评估、二维分类决策
  - `quadrant-quarter-circular` 扇形四象限，视觉更动感
  - `quadrant-quarter-simple-card` 卡片式四象限，信息更丰富
- `quadrant-simple-illus` 简单象限 — 插画风格四象限，适合展示技能矩阵、影响力分析、简洁分类

---

## 5. 关系类 (Relation)

```infographic
infographic relation-circle-icon-badge
data
  title Department Budget Overview
  desc Annual allocation by team
  items
    - label Engineering
      value 35
      icon mdi/code-tags
    - label Marketing
      value 25
      icon mdi/bullhorn
    - label Sales
      value 20
      icon mdi/chart-line
    - label Operations
      value 12
      icon mdi/cog
    - label HR
      value 8
      icon mdi/account-group
```

**可用模板变体（2 款）：**

- **relation-circle-\*** 关系圈 — 环形分布的关系图，适合展示部门占比、子公司关系、团队构成
  - `relation-circle-circular-progress` 环形进度样式，显示百分比
  - `relation-circle-icon-badge` 图标徽章样式，带图标标识

---

## 6. 层级类 (Hierarchy)

```infographic
infographic hierarchy-tree-tech-style-capsule-item
data
  title Organization Structure
  desc Technology department hierarchy
  items
    - label CTO
      children
        - label VP Engineering
          children
            - label Frontend Team
            - label Backend Team
            - label DevOps Team
        - label VP Product
          children
            - label Product Design
            - label UX Research
        - label VP Data
          children
            - label Data Science
            - label Data Engineering
```

**可用模板变体（110 款）：**

层级类模板采用 **组合命名** 方式

- **hierarchy-tree-\*** 层级树（100 款）— 自上而下的树形结构，适合展示组织架构、产品功能树、系统模块
  - 方向（4 种）：默认(top-bottom)、`bt`(bottom-top)、`lr`(left-right)、`rl`(right-left)
  - 连接线样式（5 种）：
    - `tech-style` 科技风格，直线渐变带箭头
    - `curved-line` 曲线连接，柔和优雅
    - `dashed-line` 虚线连接，带圆点标记
    - `distributed-origin` 分布式起点，带箭头
    - `dashed-arrow` 虚线箭头
  - 节点样式（5 种）：
    - `capsule-item` 胶囊形节点
    - `badge-card` 徽章卡片
    - `rounded-rect-node` 圆角矩形
    - `ribbon-card` 丝带卡片
    - `compact-card` 紧凑卡片
  - 命名规则：`hierarchy-tree-[方向-]{连接线样式}-{节点样式}`
  - 示例：`hierarchy-tree-tech-style-capsule-item`、`hierarchy-tree-lr-curved-line-badge-card`
- **hierarchy-mindmap-\*** 思维导图（10 款）— 中心发散的思维导图，适合展示知识结构、头脑风暴
  - 颜色模式（2 种）：
    - `branch-gradient` 分支渐变，每个分支独立颜色
    - `level-gradient` 层级渐变，按深度着色
  - 节点样式（5 种）：
    - `lined-palette` 彩色下划线
    - `capsule-item` 胶囊节点
    - `circle-progress` 环形进度
    - `rounded-rect` 圆角矩形
    - `compact-card` 紧凑卡片
  - 示例：`hierarchy-mindmap-branch-gradient-capsule-item`

---

## 7. 图表类 (Chart)

```infographic
infographic chart-pie-donut-plain-text
data
  title Budget Allocation
  desc Q4 2024 department spending
  items
    - label R&D
      value 40
      desc Research and development
    - label Marketing
      value 25
      desc Brand and campaigns
    - label Operations
      value 20
      desc Infrastructure and logistics
    - label HR
      value 15
      desc Talent and training
```

**可用模板变体（11 款）：**

- `chart-bar-plain-text` 柱状图 — 水平条形图，适合展示数量对比、年度趋势、横向排名
- `chart-column-simple` 条形图 — 垂直柱形图，适合展示分类数据、纵向对比、增长趋势
- `chart-line-plain-text` 折线图 — 连续数据趋势线，适合展示趋势变化、时间序列、增长曲线
- **chart-pie-\*** 饼图 — 经典饼图，适合展示占比分布、市场份额、构成分析
  - `chart-pie-plain-text` 纯文本标注
  - `chart-pie-compact-card` 紧凑卡片标注
  - `chart-pie-pill-badge` 药丸徽章标注
- **chart-pie-donut-\*** 环形饼图 — 中空环形图，适合展示占比对比、预算分配、可在中心显示汇总数据
  - `chart-pie-donut-plain-text` 纯文本标注
  - `chart-pie-donut-pill-badge` 药丸徽章标注
  - `chart-pie-donut-compact-card` 紧凑卡片标注
- `chart-wordcloud` 词云 — 标准词云，适合展示关键词热度、标签云、文本分析
- `chart-wordcloud-rotate` 旋转词云 — 带旋转角度的词云，适合展示创意词云、动态标签

---

## 数据字段说明

| 字段 | 说明 | 适用模板 |
|------|------|----------|
| `title` | 图表标题 | 所有模板 |
| `desc` | 图表描述/副标题 | 所有模板 |
| `label` | 项目标签/名称 | 所有模板 |
| `value` | 数值（百分比/数量） | 图表、进度、关系圈等 |
| `icon` | MDI 图标 (如 `mdi/chart-line`) | 支持图标的模板 |
| `time` | 时间标签 | 时间线、彩色序列等 |
| `children` | 子项目（嵌套结构） | 层级树、思维导图、SWOT、对比 |

---

[返回主测试文档](./test.md)
