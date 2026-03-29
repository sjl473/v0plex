---
title: VMD 功能完整测试（中文）
created_at: 2026-03-12
last_updated_at: 2026-03-12
author: v0plex
has_custom_tsx: false
tags: [test, reference]
---

# VMD 功能完整测试（中文）

本文档包含所有 VMD 标签及其允许的排列组合，用于全面测试 v0plex 的 Markdown 编译器。



## 第一部分：基础排版元素

### 1.1 标题层级

# 这是一级标题（H1）

标准 Markdown 一级标题。

## 这是二级标题（H2）

### 这是三级标题（H3）

#### 这是四级标题（H4）

##### 这是五级标题（H5）

###### 这是六级标题（H6）

### 1.2 段落与文本格式

这是一个普通段落。段落可以包含**粗体文本**、*斜体文本*、***粗斜体文本***、~~删除线文本~~，以及 `行内代码`。

这是另一个段落。段落之间需要空行分隔。

### 1.3 换行符

第一行文字  
第二行文字（使用两个空格换行）

### 1.4 链接

这是一个[外部链接](https://github.com/sjl473/v0plex)。

这是一个[相对链接](../_00_文档/_00_什么是%20v0plex.md)。



## 第二部分：列表

### 2.1 无序列表

- 第一项
- 第二项
- 第三项
  - 嵌套项 1
  - 嵌套项 2
- 第四项

### 2.2 有序列表

1. 第一步
2. 第二步
3. 第三步
   1. 子步骤 A
   2. 子步骤 B
4. 第四步

### 2.3 混合列表

1. 主要任务
   - 子任务 A
   - 子任务 B
2. 次要任务
   - 子任务 C
   - 子任务 D



## 第三部分：代码

### 3.1 行内代码

使用 `npm install` 安装依赖，或者使用 `pnpm build` 构建项目。

### 3.2 围栏代码块

```javascript
function greet(name) {
    console.log(`Hello, ${name}!`);
    return `Greeting sent to ${name}`;
}

greet('v0plex');
```

```python
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

print(f"第10个斐波那契数是: {fibonacci(10)}")
```

```bash
# 安装依赖
pnpm install

# 构建项目
pnpm build

# 开发模式
pnpm dev
```



## 第四部分：数学公式

### 4.1 行内数学公式

爱因斯坦的质能方程是 $E = mc^2$，其中 $E$ 是能量，$m$ 是质量，$c$ 是光速。

二次方程的解为 $x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$。

### 4.2 块级数学公式

$$
\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}
$$

$$
\sum_{i=1}^{n} i = \frac{n(n+1)}{2}
$$

$$
\begin{bmatrix}
a & b \\
c & d
\end{bmatrix}
\begin{bmatrix}
x \\
y
\end{bmatrix}
=
\begin{bmatrix}
ax + by \\
cx + dy
\end{bmatrix}
$$



## 第五部分：引用块

> 这是一个引用块。引用块用于强调引用的内容。
>
> 引用块可以包含多个段落。

> **加粗的引用文字**

> `引用中的代码`



## 第六部分：图像

### 6.1 标准 Markdown 图像

![示例图片](../../assets/images/pasted_file.png)

### 6.2 带链接的图像

todo



## 第七部分：VMD 自定义标签

### 7.1 信息提示框（info）

<info>
这是一条普通的信息提示，用于提供额外的说明或提示。
</info>

<info>
**加粗的信息标题**

信息提示框可以包含多段内容。这是第二段文字。
</info>

### 7.2 警告提示框（warning）

<warning>
这是一条警告信息，提醒用户注意潜在的问题或风险。
</warning>

<warning>
*斜体的警告说明*

警告框也可以包含多段内容，以及 `行内代码`。
</warning>

### 7.3 成功提示框（success）

<success>
这是一条成功提示，表示操作成功或推荐的做法。
</success>

<success>
***粗斜体的成功标题***

成功提示框支持所有行内格式。
</success>



## 第八部分：提示框内的嵌套组合

### 8.1 info 内嵌套列表

<info>
**使用步骤：**

1. 第一步操作说明
2. 第二步操作说明
   - 注意事项 A
   - 注意事项 B
3. 第三步操作说明
</info>

### 8.2 warning 内嵌套列表

<warning>
**常见错误：**

- 错误一：没有正确配置环境变量
- 错误二：忘记安装依赖
- 错误三：端口被占用
  - 解决方案：更换端口
  - 解决方案：关闭占用端口的程序
</warning>

### 8.3 success 内嵌套复杂格式

<success>
**最佳实践指南**

按照以下步骤操作：

1. 准备工作
   - 确保环境正确
   - 检查依赖版本
2. 执行操作
   - 运行 `pnpm install`
   - 运行 `pnpm build`
3. 验证结果

> 这是提示框内的引用块

</success>

### 8.4 提示框内嵌套 smallimg

<info>
这是一个包含小图标的提示框：<smallimg>![图标](../../assets/images/pasted_file.png)</smallimg>

小图标可以出现在段落的任何位置。
</info>

<warning>
警告：<smallimg>![警告图标](../../assets/images/pasted_file.png)</smallimg> 请谨慎操作！
</warning>

<success>
成功：<smallimg>![成功图标](../../assets/images/pasted_file.png)</smallimg> 操作已完成。
</success>



## 第九部分：小图像标签（smallimg）

### 9.1 段落中的小图像

这是一段包含<smallimg>![小图标](../../assets/images/pasted_file.png)</smallimg>小图像的文本。小图像可以与文字混排，不会打断段落流。

### 9.2 多个小图像

在一段文字中可以插入多个<smallimg>![图标1](../../assets/images/pasted_file.png)</smallimg>小图像<smallimg>![图标2](../../assets/images/pasted_file.png)</smallimg>，它们会保持在行内显示。



## 第十部分：Post 布局

### 10.1 基础 Post 布局

<post>
<lft>

左侧内容支持：

- 列表
- **粗体**
- *斜体*
- `行内代码`
- 行内公式 $E=mc^2$

</lft>
<rt>

![示例图](../../assets/images/pasted_file.png)

</rt>
</post>

### 10.2 Post 布局带复杂左侧内容

<post>
<lft>

**复杂布局示例**

这是左侧的详细说明。可以包含：

1. 有序列表项
2. 另一个列表项
   - 嵌套无序项
   - 另一个嵌套项
3. 最后一项

以及一段普通文字。

</lft>
<rt>

![图1](../../assets/images/pasted_file.png)

![图2](../../assets/images/pasted_file.png)

</rt>
</post>

### 10.3 多个 Post 布局连续使用

<post>
<lft>

**第一个 Post 布局**

这是第一个并排布局的左侧内容。

</lft>
<rt>

![图A](../../assets/images/pasted_file.png)

</rt>
</post>

<post>
<lft>

**第二个 Post 布局**

这是第二个并排布局的左侧内容，展示了多个 post 可以连续使用。

</lft>
<rt>

![图B](../../assets/images/pasted_file.png)

![图C](../../assets/images/pasted_file.png)

</rt>
</post>



## 第十一部分：复杂嵌套组合

### 11.1 列表内包含 smallimg

- 项目一 <smallimg>![图标](../../assets/images/pasted_file.png)</smallimg> 带图标
- 项目二 <smallimg>![图标](../../assets/images/pasted_file.png)</smallimg> 另一个图标
- 项目三 纯文字

### 11.2 多层嵌套结构

<info>
**复杂嵌套示例**

1. 第一层列表
   - 第二层列表 <smallimg>![图标](../../assets/images/pasted_file.png)</smallimg>
   - 另一个第二项
2. 继续第一层
   1. 有序子项
   2. 另一个有序子项

普通段落文字，包含 `代码` 和 *斜体*。
</info>

### 11.3 多个提示框连续使用

<info>
第一个信息提示框。
</info>

<warning>
紧接着的警告提示框。
</warning>

<success>
最后的成功提示框。
</success>



## 第十二部分：代码与数学公式混排

### 12.1 代码块与段落

下面是一个代码块示例：

```typescript
const config = {
    name: 'v0plex',
    version: '1.0.0'
};
```

然后是解释代码的段落。

### 12.2 数学公式与列表

数学公式可以出现在列表中：

- 圆的面积公式：$A = \pi r^2$
- 球的体积公式：$V = \frac{4}{3}\pi r^3$
- 更复杂的公式：
  $$
  e^{i\pi} + 1 = 0
  $$



## 第十三部分：边界情况测试

### 13.1 行内代码包含尖括号

在 Markdown 中使用行内代码显示标签：`<info>`、`<warning>`、`<success>`、`<post>`、`<lft>`、`<rt>`、`<smallimg>`。这些不应该被解析为实际的 VMD 标签。

### 13.2 代码块中包含 VMD 标签

```markdown
以下是 VMD 标签的语法示例：

<info>
这是信息提示框的内容。
</info>

<warning>
这是警告提示框的内容。
</warning>

<post>
<lft>
左侧内容
</lft>
<rt>
![图片](image.png)
</rt>
</post>
```


## 第十四部分：综合示例

### 14.1 完整文档结构示例

<post>
<lft>

**左侧详细说明**

这个示例展示了 post 布局的强大功能：

- 左侧可以放文字说明
- 支持**各种格式**
- 可以包含行内公式 $\alpha + \beta = \gamma$
- 使用 `代码` 高亮关键词

步骤说明：
1. 准备环境
2. 安装依赖
3. 运行项目

</lft>
<rt>

![步骤1](../../assets/images/pasted_file.png)

![步骤2](../../assets/images/pasted_file.png)

![步骤3](../../assets/images/pasted_file.png)

</rt>
</post>


## 第十五部分：特殊字符测试

### 15.1 中文标点与特殊字符

测试中文标点：，。！？、；：""''（）《》【】

测试特殊符号：@ # $ % ^ & * ( ) _ + - = [ ] { } | \ : ; " ' < > , . ? / ~ `

### 15.2 HTML 实体

测试 HTML 实体：& < > " '

### 15.3 Unicode 字符

Emoji 测试：🎉 🚀 💻 📚 ✨

数学符号：∀ ∃ ∈ ∉ ⊆ ⊇ ∪ ∩ ∞ ∂ ∫ √ ± × ÷



**文档结束**

本文档涵盖了 v0plex 支持的几乎所有 VMD 功能及其合法排列组合。通过构建本文档，可以全面验证 Markdown 编译器的正确性。
