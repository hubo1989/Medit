# Inline HTML 全面测试

[返回主测试文档](./test.md)

本文档覆盖 inline HTML 的过滤与渲染场景。

- **Don't conflate IDs:** A removed/absent `SRD-<M>-0` (sometimes written informally as "SRD-<M>") does **not** imply that `SRD<M>1`, `SRD<M>2`, ...are removed.

## 1. 无效/自定义标签（应该显示为文本）

- 自定义标签: <M> <X> <ABC> <myTag>
- 占位符风格: <PLACEHOLDER> <TODO> <FIXME>
- 模板变量: <VAR1> <T> <N>

## 2. 常见有效 inline HTML 标签

- 加粗: <b>bold text</b> 和 <strong>strong text</strong>
- 斜体: <i>italic text</i> 和 <em>emphasized text</em>
- 下划线: <u>underlined text</u>
- 删除线: <s>strikethrough</s> 和 <del>deleted</del>
- 插入: <ins>inserted text</ins>
- 标记: <mark>highlighted text</mark>
- 小字: <small>small text</small>
- 上标: x<sup>2</sup> + y<sup>2</sup> = z<sup>2</sup>
- 下标: H<sub>2</sub>O
- 代码: <code>inline code</code>
- 键盘: Press <kbd>Ctrl</kbd>+<kbd>C</kbd>
- 引用: <q>This is a quote</q>
- 缩写: <abbr title="HyperText Markup Language">HTML</abbr>
- 时间: <time datetime="2026-02-01">February 1, 2026</time>

## 3. 链接和图片

- 链接: <a href="https://example.com">Example Link</a>
- 图片: Image <img src="../icons/icon128.png" alt="placeholder">

## 4. 换行和分隔

- 文本一<br>文本二
- 文本一<br/>文本二

## 5. Span 和样式

- <span style="color: red">红色文字</span>
- <span style="background: yellow">黄色背景</span>
- <span class="custom-class">带类名的span</span>

## 6. 混合使用

- 公式 E=mc<sup>2</sup> 中，c 表示光速
- 化学式 C<sub>6</sub>H<sub>12</sub>O<sub>6</sub>
- 按 <kbd>Ctrl</kbd>+<kbd>S</kbd> 保存
- 这是 <mark>重要</mark> 内容

## 7. 边界情况

- 未闭合标签: <b>bold without close
- 嵌套: <b><i>bold and italic</i></b>
- 属性: <span data-value="123" id="test">with attributes</span>
- 空标签: <span></span>
- 自闭合: <br/> <hr/> <img/>

## 8. 潜在危险标签（应该被过滤或转义）

- Script: <script>alert('xss')</script>
- iframe: <iframe src="https://example.com"></iframe>
- object: <object data="file.swf"></object>
- embed: <embed src="file.swf">
- 事件处理: <span onclick="alert('click')">clickable</span>
- javascript URL: <a href="javascript:alert('xss')">evil link</a>

## 9. 标题中的 HTML

## 标题 with <i>italic</i> and <code>code</code>
### 标题 with <sup>superscript</sup> E=mc<sup>2</sup>
#### 标题 with <sub>subscript</sub> H<sub>2</sub>O
##### 标题 with <mark>highlight</mark>
###### 标题 with <span style="color:red">red text</span>

## 标题 with 无效标签 <M> <X>
## 标题 with <kbd>Ctrl</kbd>+<kbd>S</kbd>
### 标题 with <a href="#">link</a>

## 10. 引用块示例

> 这是一个引用块。
> 
> - 支持列表
> - 支持 **加粗** 和 *斜体*
> - 支持 <sup>上标</sup> 与 <sub>下标</sub>

## 11. 表格示例

| 字段 | 值 | 备注 |
| --- | --- | --- |
| 名称 | Markdown Viewer | **加粗** 文本 |
| 版本 | 1.4.2 | *斜体* 文本 |
| 公式 | E=mc<sup>2</sup> | 上标示例 |
| 化学式 | H<sub>2</sub>O | 下标示例 |
