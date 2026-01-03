# LaTeX 数学公式全面测试文档 🧮

本文档旨在测试 LaTeX 数学公式的各种格式，包括常见用法和边缘情况。

---

## 1. 基础语法测试

### 1.1 行内公式

最简单的行内公式：$x$、$y$、$z$

带运算符：$a + b$、$a - b$、$a \times b$、$a \div b$

混合文本：已知 $x = 5$，则 $x^2 = 25$。

### 1.2 独立公式

$$
E = mc^2
$$

### 1.3 空公式与空白测试

空格公式：$   $

只有空格的独立公式：
$$
   
$$

---

## 2. 上下标测试

### 2.1 基本上下标

单字符上标：$x^2$、$a^n$、$e^x$

单字符下标：$x_1$、$a_n$、$x_i$

同时有上下标：$x_i^2$、$a_n^k$

### 2.2 复杂上下标

多字符上标（需要括号）：$x^{10}$、$e^{-x}$、$2^{n+1}$

多字符下标：$x_{ij}$、$a_{n-1}$、$\sigma_{max}$

嵌套上下标：$x^{y^z}$、${x^y}^z$、$x_{i_j}$

### 2.3 前置上下标

前置上下标：${}_a^b X$、${}^{14}_6 C$

同位素表示：${}^{235}_{92}\text{U}$

### 2.4 边缘情况

连续上标：$x^2{}^3$

混合：$x_1^2 + x_2^2 + x_3^2$

---

## 3. 分数测试

### 3.1 基本分数

简单分数：$\frac{1}{2}$、$\frac{a}{b}$、$\frac{x+y}{z}$

行内分数对比：$\frac{a}{b}$ vs $\tfrac{a}{b}$ vs $\dfrac{a}{b}$

### 3.2 嵌套分数

二层嵌套：$\frac{1}{1+\frac{1}{x}}$

三层嵌套：$\frac{1}{1+\frac{1}{1+\frac{1}{x}}}$

连分数表示：
$$
\cfrac{1}{1+\cfrac{1}{1+\cfrac{1}{1+\cfrac{1}{x}}}}
$$

### 3.3 复杂分数

分子分母都复杂：
$$
\frac{\sum_{i=1}^{n} x_i}{\sqrt{\sum_{i=1}^{n} x_i^2}}
$$

带根号的分数：$\frac{\sqrt{2}}{2}$、$\frac{1}{\sqrt{x^2+1}}$

---

## 4. 根号测试

### 4.1 平方根

基本平方根：$\sqrt{2}$、$\sqrt{x}$、$\sqrt{x+y}$

嵌套根号：$\sqrt{\sqrt{x}}$、$\sqrt{1+\sqrt{1+\sqrt{x}}}$

### 4.2 高次根

立方根：$\sqrt[3]{8}$、$\sqrt[3]{x+y}$

n次根：$\sqrt[n]{x}$、$\sqrt[n+1]{a^n}$

### 4.3 复杂根号

根号内有分数：$\sqrt{\frac{a}{b}}$

分数内有根号：$\frac{1}{\sqrt{2}}$

二次公式：
$$
x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}
$$

---

## 5. 求和与乘积

### 5.1 求和符号

无界限：$\sum x_i$

带界限（行内）：$\sum_{i=1}^{n} i$

带界限（独立）：
$$
\sum_{i=1}^{n} i = \frac{n(n+1)}{2}
$$

### 5.2 乘积符号

基本乘积：$\prod_{i=1}^{n} a_i$

阶乘表示：
$$
n! = \prod_{k=1}^{n} k
$$

### 5.3 其他大型运算符

并集：$\bigcup_{i=1}^{n} A_i$

交集：$\bigcap_{i=1}^{n} A_i$

余积：$\coprod_{i \in I} G_i$

极限形式的求和：
$$
\sum_{\substack{0 \leq i \leq m \\ 0 \leq j \leq n}} a_{ij}
$$

---

## 6. 积分测试

### 6.1 定积分

基本定积分：$\int_0^1 x \, dx$

无穷限积分：$\int_{-\infty}^{\infty} e^{-x^2} dx$

### 6.2 不定积分

$\int x^n \, dx = \frac{x^{n+1}}{n+1} + C$

### 6.3 多重积分

二重积分：$\iint_D f(x,y) \, dA$

三重积分：$\iiint_E f(x,y,z) \, dV$

环路积分：$\oint_C \vec{F} \cdot d\vec{r}$

曲面积分：$\oiint_S \vec{F} \cdot d\vec{S}$

### 6.4 复杂积分

高斯积分：
$$
\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}
$$

---

## 7. 极限测试

### 7.1 基本极限

$\lim_{x \to 0} \frac{\sin x}{x} = 1$

$\lim_{n \to \infty} \left(1 + \frac{1}{n}\right)^n = e$

### 7.2 多变量极限

$$
\lim_{(x,y) \to (0,0)} \frac{xy}{x^2 + y^2}
$$

### 7.3 极限相关

上极限：$\limsup_{n \to \infty} a_n$

下极限：$\liminf_{n \to \infty} a_n$

---

## 8. 矩阵测试

### 8.1 基本矩阵

无括号矩阵：
$$
\begin{matrix} a & b \\ c & d \end{matrix}
$$

圆括号矩阵：
$$
\begin{pmatrix} a & b \\ c & d \end{pmatrix}
$$

方括号矩阵：
$$
\begin{bmatrix} a & b \\ c & d \end{bmatrix}
$$

花括号矩阵：
$$
\begin{Bmatrix} a & b \\ c & d \end{Bmatrix}
$$

行列式（竖线）：
$$
\begin{vmatrix} a & b \\ c & d \end{vmatrix}
$$

双竖线矩阵：
$$
\begin{Vmatrix} a & b \\ c & d \end{Vmatrix}
$$

### 8.2 大型矩阵

$$
\begin{pmatrix}
a_{11} & a_{12} & \cdots & a_{1n} \\
a_{21} & a_{22} & \cdots & a_{2n} \\
\vdots & \vdots & \ddots & \vdots \\
a_{m1} & a_{m2} & \cdots & a_{mn}
\end{pmatrix}
$$

### 8.3 增广矩阵

$$
\left[\begin{array}{ccc|c}
1 & 0 & 0 & x \\
0 & 1 & 0 & y \\
0 & 0 & 1 & z
\end{array}\right]
$$

### 8.4 行向量与列向量

行向量：$\begin{pmatrix} x_1 & x_2 & \cdots & x_n \end{pmatrix}$

列向量：
$$
\begin{pmatrix} x_1 \\ x_2 \\ \vdots \\ x_n \end{pmatrix}
$$

---

## 9. 括号测试

### 9.1 基本括号

圆括号：$(a+b)$

方括号：$[a+b]$

花括号：$\{a+b\}$

尖括号：$\langle a, b \rangle$

绝对值：$|x|$

范数：$\left\|x\right\|$

### 9.2 自适应括号

小括号：$\left( \frac{a}{b} \right)$

大分数：
$$
\left[ \frac{\frac{a}{b}}{\frac{c}{d}} \right]
$$

### 9.3 混合括号

$$
\left( \sum_{i=1}^{n} \left[ x_i + \left\{ y_i - z_i \right\} \right] \right)
$$

### 9.4 单边括号

左括号：$\left. \frac{x^3}{3} \right|_0^1$

条件定义：
$$
|x| = \left\{
\begin{array}{ll}
x & \text{if } x \geq 0 \\
-x & \text{if } x < 0
\end{array}
\right.
$$

### 9.5 特殊括号

向上取整：$\lceil x \rceil$

向下取整：$\lfloor x \rfloor$

---

## 10. 希腊字母

### 10.1 小写希腊字母

$\alpha \beta \gamma \delta \epsilon \varepsilon \zeta \eta \theta \vartheta$

$\iota \kappa \lambda \mu \nu \xi \pi \varpi \rho \varrho$

$\sigma \varsigma \tau \upsilon \phi \varphi \chi \psi \omega$

### 10.2 大写希腊字母

$\Gamma \Delta \Theta \Lambda \Xi \Pi \Sigma \Upsilon \Phi \Psi \Omega$

---

## 11. 运算符与关系符

### 11.1 算术运算符

加减乘除：$+ - \times \div$

点乘叉乘：$\cdot \times$

加减号：$\pm \mp$

### 11.2 比较运算符

基本比较：$< > \leq \geq \neq$

远大于/远小于：$\ll \gg$

约等于：$\approx \sim \simeq \cong$

### 11.3 集合运算符

属于：$\in \notin \ni$

子集：$\subset \supset \subseteq \supseteq$

集合运算：$\cup \cap \setminus \emptyset$

### 11.4 逻辑运算符

与或非：$\land \lor \neg$

蕴含：$\Rightarrow \Leftarrow \Leftrightarrow$

量词：$\forall \exists \nexists$

### 11.5 箭头

基本箭头：$\to \leftarrow \leftrightarrow$

双线箭头：$\Rightarrow \Leftarrow \Leftrightarrow$

映射箭头：$\mapsto$

长箭头：$\longrightarrow \longleftarrow$

---

## 12. 空格命令测试

### 12.1 负空格到正空格

| 命令 | 效果 | 说明 |
|------|------|------|
| `\!` | $a\!b$ | 负细间距 |
| (无) | $ab$ | 无间距 |
| `\,` | $a\,b$ | 细间距 (3/18 em) |
| `\:` | $a\:b$ | 中等间距 (4/18 em) |
| `\;` | $a\;b$ | 粗间距 (5/18 em) |
| `\ ` | $a\ b$ | 普通空格 |
| `\quad` | $a\quad b$ | 1 em 空格 |
| `\qquad` | $a\qquad b$ | 2 em 空格 |

### 12.2 积分中的空格

正确写法：$\int f(x) \, dx$

错误写法（无空格）：$\int f(x)dx$

### 12.3 模运算空格

二元模：$a \bmod b$

同余模：$a \equiv b \pmod{n}$

带括号模：$a \mod n$

复杂模运算：$V = T \bmod 2^{31}$

---

## 13. 文本与字体

### 13.1 数学文本

$x > 0 \text{ and } y > 0$

$f(x) = 0 \text{ 当且仅当 } x = 0$

### 13.2 数学字体

普通：$ABCDEFG$

粗体：$\mathbf{ABCDEFG}$

斜体：$\mathit{ABCDEFG}$

罗马体：$\mathrm{ABCDEFG}$

无衬线：$\mathsf{ABCDEFG}$

打字机：$\mathtt{ABCDEFG}$

花体：$\mathcal{ABCDEFG}$

手写体：$\mathscr{ABCDEFG}$

黑板粗体：$\mathbb{NZQRC}$

哥特体：$\mathfrak{ABCDEFG}$

### 13.3 向量与矩阵符号

向量（箭头）：$\vec{v}$、$\vec{AB}$

向量（粗体）：$\mathbf{v}$、$\boldsymbol{v}$

矩阵：$\mathbf{A}$、$\mathbf{B}$

---

## 14. 重音与装饰

### 14.1 上方装饰

帽子：$\hat{a}$、$\widehat{abc}$

波浪：$\tilde{a}$、$\widetilde{abc}$

横线：$\bar{a}$、$\overline{abc}$

点：$\dot{a}$、$\ddot{a}$、$\dddot{a}$

圈：$\mathring{a}$

检验符：$\check{a}$

箭头：$\vec{a}$、$\overrightarrow{AB}$、$\overleftarrow{AB}$

### 14.2 下方装饰

下划线：$\underline{abc}$

下括号：$\underbrace{a+b+c}_{n \text{ 项}}$

### 14.3 上下组合

$$
\overbrace{a+b+\cdots+z}^{26 \text{ 个字母}}
$$

$$
\underbrace{1+2+3+\cdots+n}_{n \text{ 项}} = \frac{n(n+1)}{2}
$$

---

## 15. 函数名

### 15.1 三角函数

$\sin x$、$\cos x$、$\tan x$

$\csc x$、$\sec x$、$\cot x$

$\arcsin x$、$\arccos x$、$\arctan x$

### 15.2 双曲函数

$\sinh x$、$\cosh x$、$\tanh x$

### 15.3 对数与指数

$\log x$、$\log_a x$、$\ln x$、$\lg x$

$\exp(x)$

### 15.4 其他函数

最大最小：$\max(a,b)$、$\min(a,b)$

取整：$\gcd(a,b)$、$\lcm(a,b)$

模与参数：$\arg z$、$\deg f$

行列式与维度：$\det A$、$\dim V$

核与像：$\ker f$、$\hom(A,B)$

上下确界：$\sup S$、$\inf S$

---

## 16. 分段函数 (cases)

### 16.1 基本 cases

$$
f(x) = \begin{cases}
1 & x > 0 \\
0 & x = 0 \\
-1 & x < 0
\end{cases}
$$

### 16.2 复杂 cases

斐波那契数列：
$$
F_n = \begin{cases}
0 & n = 0 \\
1 & n = 1 \\
F_{n-1} + F_{n-2} & n > 1
\end{cases}
$$

### 16.3 左右 cases

$$
\left.
\begin{array}{r}
x + y = 3 \\
2x - y = 0
\end{array}
\right\} \Rightarrow x = 1, y = 2
$$

---

## 17. 对齐环境

### 17.1 aligned 环境

$$
\begin{aligned}
a &= b + c \\
  &= d + e + f \\
  &= g
\end{aligned}
$$

### 17.2 多行等式

$$
\begin{aligned}
(a+b)^2 &= (a+b)(a+b) \\
        &= a^2 + ab + ba + b^2 \\
        &= a^2 + 2ab + b^2
\end{aligned}
$$

### 17.3 方程组

$$
\begin{aligned}
x + y &= 5 \\
2x - y &= 1
\end{aligned}
$$

---

## 18. 特殊符号

### 18.1 省略号

水平省略：$1, 2, 3, \ldots, n$

居中省略：$1 + 2 + 3 + \cdots + n$

竖直省略：$\vdots$

对角省略：$\ddots$

### 18.2 无穷与空集

$\infty$、$-\infty$、$\emptyset$、$\varnothing$

### 18.3 其他常用符号

偏导：$\partial$

nabla：$\nabla$

普朗克常数：$\hbar$

实部虚部：$\Re$、$\Im$

阿列夫：$\aleph$

角度：$90°$ 或 $90^\circ$

千分号：$\permil$ 或 $‰$

---

## 19. 物理与工程公式

### 19.1 量子力学

薛定谔方程：
$$
i\hbar \frac{\partial}{\partial t} \Psi(\mathbf{r}, t) = \hat{H} \Psi(\mathbf{r}, t)
$$

不确定性原理：
$$
\Delta x \cdot \Delta p \geq \frac{\hbar}{2}
$$

### 19.2 电磁学

麦克斯韦方程（微分形式）：
$$
\begin{aligned}
\nabla \cdot \mathbf{E} &= \frac{\rho}{\varepsilon_0} \\
\nabla \cdot \mathbf{B} &= 0 \\
\nabla \times \mathbf{E} &= -\frac{\partial \mathbf{B}}{\partial t} \\
\nabla \times \mathbf{B} &= \mu_0 \mathbf{J} + \mu_0 \varepsilon_0 \frac{\partial \mathbf{E}}{\partial t}
\end{aligned}
$$

### 19.3 相对论

质能方程：$E = mc^2$

洛伦兹因子：$\gamma = \frac{1}{\sqrt{1 - v^2/c^2}}$

四维动量：
$$
p^\mu = (E/c, \mathbf{p}) = m_0 c \gamma (1, \boldsymbol{\beta})
$$

### 19.4 热力学

熵的定义：$S = k_B \ln \Omega$

自由能：$F = U - TS$

---

## 20. 化学公式

### 20.1 化学式

$\text{H}_2\text{O}$、$\text{CO}_2$、$\text{C}_6\text{H}_{12}\text{O}_6$

### 20.2 化学反应

$$
\text{2H}_2 + \text{O}_2 \to \text{2H}_2\text{O}
$$

平衡反应：
$$
\text{N}_2 + \text{3H}_2 \rightleftharpoons \text{2NH}_3
$$

### 20.3 同位素

${}^{14}_{6}\text{C}$、${}^{235}_{92}\text{U}$

---

## 21. 边缘情况测试

### 21.1 空元素

空分数：$\frac{}{}$

空上下标：$x^{}_{}$

空括号：$\left(\right)$

### 21.2 超长公式

$$
\int_{-\infty}^{\infty} \int_{-\infty}^{\infty} \int_{-\infty}^{\infty} f(x,y,z) \exp\left(-\frac{x^2+y^2+z^2}{2\sigma^2}\right) dx \, dy \, dz
$$

### 21.3 深度嵌套

$$
\sqrt{\sqrt{\sqrt{\sqrt{\sqrt{x}}}}}
$$

$$
\frac{1}{\frac{1}{\frac{1}{\frac{1}{\frac{1}{x}}}}}
$$

$$
x^{x^{x^{x^{x}}}}
$$

### 21.4 特殊字符转义

$\$$ 美元符号

$\%$ 百分号

$\#$ 井号

$\&$ 与号

$\_$ 下划线

$\{$ 和 $\}$ 花括号

### 21.5 Unicode 与特殊字符

直接 Unicode：$∀x∈ℝ, x²≥0$

混合使用：$α + β = γ$ vs $\alpha + \beta = \gamma$

---

## 22. 组合数学

### 22.1 排列组合

排列：$P_n^k = \frac{n!}{(n-k)!}$

组合：$\binom{n}{k} = \frac{n!}{k!(n-k)!}$

### 22.2 二项式定理

$$
(x+y)^n = \sum_{k=0}^{n} \binom{n}{k} x^{n-k} y^k
$$

### 22.3 卡特兰数

$$
C_n = \frac{1}{n+1}\binom{2n}{n} = \binom{2n}{n} - \binom{2n}{n+1}
$$

---

## 23. 数论

### 23.1 整除与同余

整除：$a \mid b$、$a \nmid b$

同余：$a \equiv b \pmod{n}$

### 23.2 重要定理

费马小定理：
$$
a^{p-1} \equiv 1 \pmod{p}
$$

欧拉定理：
$$
a^{\phi(n)} \equiv 1 \pmod{n}
$$

威尔逊定理：
$$
(p-1)! \equiv -1 \pmod{p}
$$

### 23.3 数论函数

欧拉函数：$\phi(n) = n\prod_{p|n}\left(1-\frac{1}{p}\right)$

莫比乌斯函数：$\mu(n)$

---

## 24. 级数与收敛

### 24.1 幂级数

$$
e^x = \sum_{n=0}^{\infty} \frac{x^n}{n!}
$$

$$
\sin x = \sum_{n=0}^{\infty} \frac{(-1)^n x^{2n+1}}{(2n+1)!}
$$

$$
\cos x = \sum_{n=0}^{\infty} \frac{(-1)^n x^{2n}}{(2n)!}
$$

### 24.2 收敛判别

比值判别法：
$$
\lim_{n \to \infty} \left| \frac{a_{n+1}}{a_n} \right| < 1
$$

根值判别法：
$$
\limsup_{n \to \infty} \sqrt[n]{|a_n|} < 1
$$

---

## 25. 微分方程

### 25.1 常微分方程

一阶线性：
$$
\frac{dy}{dx} + P(x)y = Q(x)
$$

二阶常系数：
$$
y'' + py' + qy = f(x)
$$

### 25.2 偏微分方程

热传导方程：
$$
\frac{\partial u}{\partial t} = \alpha \nabla^2 u
$$

波动方程：
$$
\frac{\partial^2 u}{\partial t^2} = c^2 \nabla^2 u
$$

拉普拉斯方程：
$$
\nabla^2 \phi = 0
$$

---

## 26. 变换

### 26.1 傅里叶变换

$$
\hat{f}(\xi) = \int_{-\infty}^{\infty} f(x) e^{-2\pi i x \xi} \, dx
$$

$$
f(x) = \int_{-\infty}^{\infty} \hat{f}(\xi) e^{2\pi i x \xi} \, d\xi
$$

### 26.2 拉普拉斯变换

$$
\mathcal{L}\{f(t)\} = F(s) = \int_0^{\infty} f(t) e^{-st} \, dt
$$

### 26.3 Z变换

$$
X(z) = \mathcal{Z}\{x[n]\} = \sum_{n=-\infty}^{\infty} x[n] z^{-n}
$$

---

## 27. 概率论

### 27.1 基本概念

条件概率：$P(A|B) = \frac{P(A \cap B)}{P(B)}$

独立性：$P(A \cap B) = P(A) \cdot P(B)$

### 27.2 贝叶斯定理

$$
P(A|B) = \frac{P(B|A) \cdot P(A)}{P(B)} = \frac{P(B|A) \cdot P(A)}{\sum_i P(B|A_i) P(A_i)}
$$

### 27.3 分布

正态分布：
$$
f(x) = \frac{1}{\sigma\sqrt{2\pi}} \exp\left(-\frac{(x-\mu)^2}{2\sigma^2}\right)
$$

泊松分布：
$$
P(X=k) = \frac{\lambda^k e^{-\lambda}}{k!}
$$

二项分布：
$$
P(X=k) = \binom{n}{k} p^k (1-p)^{n-k}
$$

---

## 28. 表格中的公式

| 函数 | 导数 | 积分 |
|------|------|------|
| $x^n$ | $nx^{n-1}$ | $\frac{x^{n+1}}{n+1}$ |
| $e^x$ | $e^x$ | $e^x$ |
| $\ln x$ | $\frac{1}{x}$ | $x\ln x - x$ |
| $\sin x$ | $\cos x$ | $-\cos x$ |
| $\cos x$ | $-\sin x$ | $\sin x$ |

---

## 29. 算法复杂度表示

时间复杂度：$O(1)$、$O(\log n)$、$O(n)$、$O(n \log n)$、$O(n^2)$、$O(2^n)$、$O(n!)$

空间复杂度：$S(n) = O(n)$

递归复杂度（主定理）：
$$
T(n) = aT\left(\frac{n}{b}\right) + f(n)
$$

---

## 30. 混合与压力测试

### 30.1 超复杂公式

$$
\oint_{\partial \Sigma} \mathbf{F} \cdot d\mathbf{l} = \iint_{\Sigma} (\nabla \times \mathbf{F}) \cdot d\mathbf{S}
$$

$$
\det(A - \lambda I) = \begin{vmatrix}
a_{11}-\lambda & a_{12} & \cdots & a_{1n} \\
a_{21} & a_{22}-\lambda & \cdots & a_{2n} \\
\vdots & \vdots & \ddots & \vdots \\
a_{n1} & a_{n2} & \cdots & a_{nn}-\lambda
\end{vmatrix} = 0
$$

### 30.2 长公式换行

$$
\begin{aligned}
&\quad (a+b+c)(x+y+z) \\
&= ax + ay + az + bx + by + bz + cx + cy + cz
\end{aligned}
$$

### 30.3 混合所有元素

$$
\forall \varepsilon > 0, \exists \delta > 0 : |x-a|<\delta \Rightarrow \left|\frac{f(x)-f(a)}{x-a} - f'(a)\right| < \varepsilon
$$

---

## 总结

本文档涵盖了 LaTeX 数学公式的：

1. ✅ 基础语法（行内/独立公式）
2. ✅ 上下标（包括嵌套和前置）
3. ✅ 分数（包括嵌套和连分数）
4. ✅ 根号（包括高次根和嵌套）
5. ✅ 求和、乘积、积分
6. ✅ 极限
7. ✅ 矩阵（各种括号样式）
8. ✅ 各类括号和自适应大小
9. ✅ 希腊字母
10. ✅ 运算符和关系符
11. ✅ 空格命令
12. ✅ 文本和字体
13. ✅ 重音和装饰
14. ✅ 数学函数
15. ✅ 分段函数
16. ✅ 对齐环境
17. ✅ 特殊符号
18. ✅ 物理化学公式
19. ✅ 边缘情况
20. ✅ 压力测试
