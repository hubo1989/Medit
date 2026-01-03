# DOT 图表 (Graphviz) 完整演示

[返回主测试文档](./test.md)

本文档包含 DOT/Graphviz 图表的完整演示，涵盖各种图类型和样式特性。

---

## 1. 有向图 (Digraph)

### 1.1 简单有向图

```dot
digraph G {
    A -> B -> C;
    B -> D;
    A -> D;
}
```

### 1.2 带样式的有向图

```dot
digraph G {
    rankdir=LR;
    node [shape=box, style=filled, fillcolor=lightblue];
    
    Start [shape=ellipse, fillcolor=lightgreen];
    End [shape=ellipse, fillcolor=lightcoral];
    
    Start -> "Step 1" -> "Step 2" -> "Step 3" -> End;
    "Step 1" -> "Step 3" [style=dashed, label="skip"];
}
```

### 1.3 复杂有向图

```dot
digraph G {
    rankdir=TB;
    node [shape=box, style="rounded,filled", fillcolor="#e1f5fe"];
    edge [color="#1976d2"];
    
    入口 [shape=circle, fillcolor="#4caf50", fontcolor=white];
    出口 [shape=doublecircle, fillcolor="#f44336", fontcolor=white];
    
    入口 -> 验证;
    验证 -> 处理 [label="成功"];
    验证 -> 错误处理 [label="失败", color=red];
    处理 -> 存储;
    存储 -> 响应;
    错误处理 -> 响应;
    响应 -> 出口;
}
```

---

## 2. 无向图 (Graph)

### 2.1 基础无向图

```dot
graph Network {
    layout=neato;
    node [shape=circle];
    
    A -- B -- C -- D -- A;
    B -- D;
    A -- C;
}
```

### 2.2 网络拓扑图

```dot
graph NetworkTopology {
    layout=neato;
    overlap=false;
    node [shape=box, style=filled];
    
    Router [fillcolor=yellow, shape=diamond];
    Server1 [fillcolor=lightblue];
    Server2 [fillcolor=lightblue];
    PC1 [fillcolor=lightgreen];
    PC2 [fillcolor=lightgreen];
    PC3 [fillcolor=lightgreen];
    
    Router -- Server1;
    Router -- Server2;
    Server1 -- PC1;
    Server1 -- PC2;
    Server2 -- PC3;
}
```

---

## 3. 子图和集群

### 3.1 前后端架构

```dot
digraph G {
    compound=true;
    
    subgraph cluster_frontend {
        label="Frontend";
        style=filled;
        color=lightgrey;
        node [style=filled, color=white];
        React -> Redux -> Router;
    }
    
    subgraph cluster_backend {
        label="Backend";
        style=filled;
        color=lightblue;
        node [style=filled, color=white];
        NodeJS -> Express -> MongoDB;
    }
    
    Redux -> NodeJS;
}
```

### 3.2 多层架构图

```dot
digraph Architecture {
    rankdir=TB;
    compound=true;
    node [shape=box, style="rounded,filled"];
    
    subgraph cluster_presentation {
        label="表现层";
        style=filled;
        color="#e3f2fd";
        Web [fillcolor="#90caf9"];
        Mobile [fillcolor="#90caf9"];
        API [fillcolor="#90caf9"];
    }
    
    subgraph cluster_business {
        label="业务层";
        style=filled;
        color="#e8f5e9";
        UserService [fillcolor="#a5d6a7"];
        OrderService [fillcolor="#a5d6a7"];
        PaymentService [fillcolor="#a5d6a7"];
    }
    
    subgraph cluster_data {
        label="数据层";
        style=filled;
        color="#fff3e0";
        MySQL [fillcolor="#ffcc80"];
        Redis [fillcolor="#ffcc80"];
        MongoDB [fillcolor="#ffcc80"];
    }
    
    Web -> UserService;
    Mobile -> OrderService;
    API -> PaymentService;
    
    UserService -> MySQL;
    OrderService -> Redis;
    PaymentService -> MongoDB;
}
```

---

## 4. 状态机图

```dot
digraph StateMachine {
    rankdir=LR;
    node [shape=circle];
    
    idle [label="Idle"];
    loading [label="Loading"];
    success [label="Success", shape=doublecircle];
    error [label="Error", shape=doublecircle];
    
    idle -> loading [label="fetch()"];
    loading -> success [label="200 OK"];
    loading -> error [label="Error"];
    error -> loading [label="retry()"];
    success -> idle [label="reset()"];
}
```

---

## 5. 记录节点（表格样式）

### 5.1 数据库表关系

```dot
digraph structs {
    node [shape=record];
    
    struct1 [label="{<f0> id|<f1> name|<f2> email}"];
    struct2 [label="{<f0> user_id|<f1> order_id|<f2> amount}"];
    struct3 [label="{<f0> order_id|<f1> product|<f2> qty}"];
    
    struct1:f0 -> struct2:f0;
    struct2:f1 -> struct3:f0;
}
```

### 5.2 类结构图

```dot
digraph UML {
    node [shape=record, fontname="Helvetica"];
    
    User [label="{User|+ id: int\l+ name: string\l+ email: string\l|+ login()\l+ logout()\l}"];
    Admin [label="{Admin|+ role: string\l|+ manageUsers()\l}"];
    Post [label="{Post|+ id: int\l+ title: string\l+ content: text\l|+ publish()\l+ delete()\l}"];
    
    Admin -> User [arrowhead=empty, label="extends"];
    User -> Post [label="creates", arrowhead=open];
}
```

---

## 6. 节点形状展示

```dot
digraph Shapes {
    rankdir=LR;
    
    box [shape=box, label="box"];
    ellipse [shape=ellipse, label="ellipse"];
    circle [shape=circle, label="circle"];
    diamond [shape=diamond, label="diamond"];
    trapezium [shape=trapezium, label="trapezium"];
    parallelogram [shape=parallelogram, label="parallelogram"];
    house [shape=house, label="house"];
    pentagon [shape=pentagon, label="pentagon"];
    hexagon [shape=hexagon, label="hexagon"];
    octagon [shape=octagon, label="octagon"];
    doublecircle [shape=doublecircle, label="doublecircle"];
    tripleoctagon [shape=tripleoctagon, label="tripleoctagon"];
    cylinder [shape=cylinder, label="cylinder"];
    note [shape=note, label="note"];
    tab [shape=tab, label="tab"];
    folder [shape=folder, label="folder"];
    component [shape=component, label="component"];
}
```

---

## 7. 边样式展示

```dot
digraph EdgeStyles {
    rankdir=LR;
    node [shape=circle];
    
    A1 -> B1 [style=solid, label="solid"];
    A2 -> B2 [style=dashed, label="dashed"];
    A3 -> B3 [style=dotted, label="dotted"];
    A4 -> B4 [style=bold, label="bold"];
    
    C1 -> D1 [arrowhead=normal, label="normal"];
    C2 -> D2 [arrowhead=dot, label="dot"];
    C3 -> D3 [arrowhead=odot, label="odot"];
    C4 -> D4 [arrowhead=none, label="none"];
    C5 -> D5 [arrowhead=diamond, label="diamond"];
    C6 -> D6 [arrowhead=box, label="box"];
}
```

---

## 8. 颜色方案

```dot
digraph Colors {
    node [style=filled, shape=box];
    
    red [fillcolor=red, fontcolor=white];
    orange [fillcolor=orange];
    yellow [fillcolor=yellow];
    green [fillcolor=green, fontcolor=white];
    blue [fillcolor=blue, fontcolor=white];
    purple [fillcolor=purple, fontcolor=white];
    
    hex1 [fillcolor="#ff6b6b", label="#ff6b6b"];
    hex2 [fillcolor="#4ecdc4", label="#4ecdc4"];
    hex3 [fillcolor="#45b7d1", label="#45b7d1"];
    hex4 [fillcolor="#96ceb4", label="#96ceb4"];
    
    red -> orange -> yellow -> green -> blue -> purple;
    hex1 -> hex2 -> hex3 -> hex4;
}
```

---

## 9. 流程图示例

### 9.1 用户登录流程

```dot
digraph LoginFlow {
    rankdir=TB;
    node [shape=box, style="rounded,filled", fillcolor="#e3f2fd"];
    
    start [shape=ellipse, fillcolor="#4caf50", fontcolor=white, label="开始"];
    end [shape=ellipse, fillcolor="#f44336", fontcolor=white, label="结束"];
    
    input [label="输入用户名密码"];
    validate [shape=diamond, fillcolor="#fff9c4", label="验证信息?"];
    checkUser [shape=diamond, fillcolor="#fff9c4", label="用户存在?"];
    checkPwd [shape=diamond, fillcolor="#fff9c4", label="密码正确?"];
    success [label="登录成功"];
    fail [label="登录失败"];
    log [label="记录日志"];
    
    start -> input;
    input -> validate;
    validate -> checkUser [label="有效"];
    validate -> fail [label="无效"];
    checkUser -> checkPwd [label="是"];
    checkUser -> fail [label="否"];
    checkPwd -> success [label="是"];
    checkPwd -> fail [label="否"];
    success -> log;
    fail -> log;
    log -> end;
}
```

### 9.2 CI/CD 流程

```dot
digraph CICD {
    rankdir=LR;
    node [shape=box, style="rounded,filled"];
    
    subgraph cluster_dev {
        label="Development";
        color="#e3f2fd";
        style=filled;
        Code [fillcolor="#90caf9"];
        Test [fillcolor="#90caf9"];
    }
    
    subgraph cluster_ci {
        label="CI Pipeline";
        color="#e8f5e9";
        style=filled;
        Build [fillcolor="#a5d6a7"];
        UnitTest [fillcolor="#a5d6a7", label="Unit Test"];
        IntegTest [fillcolor="#a5d6a7", label="Integration Test"];
    }
    
    subgraph cluster_cd {
        label="CD Pipeline";
        color="#fff3e0";
        style=filled;
        Deploy_Staging [fillcolor="#ffcc80", label="Deploy to Staging"];
        Deploy_Prod [fillcolor="#ffcc80", label="Deploy to Prod"];
    }
    
    Code -> Test -> Build -> UnitTest -> IntegTest -> Deploy_Staging -> Deploy_Prod;
}
```

---

## 10. 组织架构图

```dot
digraph OrgChart {
    rankdir=TB;
    node [shape=box, style="rounded,filled", fillcolor="#e1f5fe"];
    
    CEO [fillcolor="#1976d2", fontcolor=white];
    
    CTO [fillcolor="#42a5f5"];
    CFO [fillcolor="#42a5f5"];
    COO [fillcolor="#42a5f5"];
    
    DevLead [label="Dev Lead", fillcolor="#90caf9"];
    QALead [label="QA Lead", fillcolor="#90caf9"];
    FinLead [label="Finance Lead", fillcolor="#90caf9"];
    OpsLead [label="Ops Lead", fillcolor="#90caf9"];
    
    Dev1 [label="Developer 1", fillcolor="#bbdefb"];
    Dev2 [label="Developer 2", fillcolor="#bbdefb"];
    QA1 [label="QA Engineer", fillcolor="#bbdefb"];
    
    CEO -> {CTO CFO COO};
    CTO -> {DevLead QALead};
    CFO -> FinLead;
    COO -> OpsLead;
    DevLead -> {Dev1 Dev2};
    QALead -> QA1;
}
```

---

[返回主测试文档](./test.md)
