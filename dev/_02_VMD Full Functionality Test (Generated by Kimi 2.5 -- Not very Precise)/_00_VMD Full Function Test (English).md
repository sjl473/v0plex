---
title: VMD Full Function Test (English)
created_at: 2026-03-12
last_updated_at: 2026-03-12
author: v0plex
has_custom_tsx: false
---

# VMD Full Function Test (English)

This document contains all VMD tags and their permitted combinations for comprehensive testing of the v0plex Markdown compiler.



## Part 1: Basic Typography Elements

### 1.1 Heading Levels

# This is Heading Level 1 (H1)

Standard Markdown level 1 heading.

## This is Heading Level 2 (H2)

### This is Heading Level 3 (H3)

#### This is Heading Level 4 (H4)

##### This is Heading Level 5 (H5)

###### This is Heading Level 6 (H6)

### 1.2 Paragraphs and Text Formatting

This is a normal paragraph. Paragraphs can contain **bold text**, *italic text*, ***bold italic text***, ~~strikethrough text~~, and `inline code`.

This is another paragraph. Paragraphs need blank lines between them.

### 1.3 Line Breaks

First line of text  
Second line of text (using two spaces for line break)

### 1.4 Links

This is an [external link](https://github.com/sjl473/v0plex).

This is a [relative link](../_01_Documentation/_00_What%20is%20v0plex.md).



## Part 2: Lists

### 2.1 Unordered Lists

- First item
- Second item
- Third item
  - Nested item 1
  - Nested item 2
- Fourth item

### 2.2 Ordered Lists

1. First step
2. Second step
3. Third step
   1. Sub-step A
   2. Sub-step B
4. Fourth step

### 2.3 Mixed Lists

1. Main task
   - Sub-task A
   - Sub-task B
2. Secondary task
   - Sub-task C
   - Sub-task D



## Part 3: Code

### 3.1 Inline Code

Use `npm install` to install dependencies, or use `pnpm build` to build the project.

### 3.2 Fenced Code Blocks

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

print(f"The 10th Fibonacci number is: {fibonacci(10)}")
```

```bash
# Install dependencies
pnpm install

# Build the project
pnpm build

# Development mode
pnpm dev
```



## Part 4: Mathematical Formulas

### 4.1 Inline Math Formulas

Einstein's mass-energy equation is $E = mc^2$, where $E$ is energy, $m$ is mass, and $c$ is the speed of light.

The solution to the quadratic equation is $x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$.

### 4.2 Block Math Formulas

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



## Part 5: Blockquotes

> This is a blockquote. Blockquotes are used to emphasize quoted content.
>
> Blockquotes can contain multiple paragraphs.

> **Bold text in a quote**

> `Code in a quote`



## Part 6: Images

### 6.1 Standard Markdown Images

![Example image](../assets/images/pasted_file.png)

### 6.2 Linked Images

todo



## Part 7: VMD Custom Tags

### 7.1 Info Box (info)

<info>
This is a general information tip, used to provide additional explanations or hints.
</info>

<info>
**Bold info title**

Info boxes can contain multi-paragraph content. This is the second paragraph.
</info>

### 7.2 Warning Box (warning)

<warning>
This is a warning message, alerting users to potential issues or risks.
</warning>

<warning>
*Italic warning description*

Warning boxes can also contain multiple paragraphs and `inline code`.
</warning>

### 7.3 Success Box (success)

<success>
This is a success message, indicating a successful operation or recommended practice.
</success>

<success>
***Bold italic success title***

Success boxes support all inline formatting.
</success>



## Part 8: Nesting Combinations Inside Boxes

### 8.1 Info with Nested Lists

<info>
**Usage steps:**

1. First step instructions
2. Second step instructions
   - Note A
   - Note B
3. Third step instructions
</info>

### 8.2 Warning with Nested Lists

<warning>
**Common errors:**

- Error 1: Environment variables not properly configured
- Error 2: Forgot to install dependencies
- Error 3: Port is occupied
  - Solution: Change port
  - Solution: Close the program using the port
</warning>

### 8.3 Success with Complex Formatting

<success>
**Best Practices Guide**

Follow these steps:

1. Preparation
   - Ensure environment is correct
   - Check dependency versions
2. Execute operation
   - Run `pnpm install`
   - Run `pnpm build`
3. Verify results

> This is a blockquote inside a success box

</success>

### 8.4 Boxes with smallimg

<info>
This is an info box containing a small icon: <smallimg>![icon](../assets/images/pasted_file.png)</smallimg>

Small icons can appear anywhere in the paragraph.
</info>

<warning>
Warning: <smallimg>![warning icon](../assets/images/pasted_file.png)</smallimg> Please proceed with caution!
</warning>

<success>
Success: <smallimg>![success icon](../assets/images/pasted_file.png)</smallimg> Operation completed.
</success>



## Part 9: Small Image Tag (smallimg)

### 9.1 Small Images in Paragraphs

This is a paragraph containing a <smallimg>![small icon](../assets/images/pasted_file.png)</smallimg> small image. Small images can be mixed with text without breaking the paragraph flow.

### 9.2 Multiple Small Images

Multiple <smallimg>![icon1](../assets/images/pasted_file.png)</smallimg> small images <smallimg>![icon2](../assets/images/pasted_file.png)</smallimg> can be inserted in a single paragraph, and they will remain inline.



## Part 10: Post Layout

### 10.1 Basic Post Layout

<post>
<lft>

Left content supports:

- Lists
- **Bold**
- *Italic*
- `Inline code`
- Inline formulas $E=mc^2$

</lft>
<rt>

![Example image](../assets/images/pasted_file.png)

</rt>
</post>

### 10.2 Post Layout with Complex Left Content

<post>
<lft>

**Complex Layout Example**

This is the detailed description on the left. Can include:

1. Ordered list items
2. Another list item
   - Nested unordered item
   - Another nested item
3. Last item

And a regular paragraph.

</lft>
<rt>

![Image 1](../assets/images/pasted_file.png)

![Image 2](../assets/images/pasted_file.png)

</rt>
</post>

### 10.3 Multiple Post Layouts in Sequence

<post>
<lft>

**First Post Layout**

This is the left content of the first side-by-side layout.

</lft>
<rt>

![Image A](../assets/images/pasted_file.png)

</rt>
</post>

<post>
<lft>

**Second Post Layout**

This is the left content of the second side-by-side layout, demonstrating that multiple posts can be used consecutively.

</lft>
<rt>

![Image B](../assets/images/pasted_file.png)

![Image C](../assets/images/pasted_file.png)

</rt>
</post>



## Part 11: Complex Nesting Combinations

### 11.1 Lists with smallimg

- Item 1 <smallimg>![icon](../assets/images/pasted_file.png)</smallimg> with icon
- Item 2 <smallimg>![icon](../assets/images/pasted_file.png)</smallimg> another icon
- Item 3 plain text

### 11.2 Multi-level Nested Structure

<info>
**Complex Nesting Example**

1. First level list
   - Second level list <smallimg>![icon](../assets/images/pasted_file.png)</smallimg>
   - Another second level item
2. Continue first level
   1. Ordered sub-item
   2. Another ordered sub-item

Regular paragraph text containing `code` and *italics*.
</info>

### 11.3 Multiple Boxes in Sequence

<info>
First info box.
</info>

<warning>
Following warning box.
</warning>

<success>
Final success box.
</success>



## Part 12: Code and Math Formula Mixing

### 12.1 Code Blocks with Paragraphs

Below is a code block example:

```typescript
const config = {
    name: 'v0plex',
    version: '1.0.0'
};
```

Then a paragraph explaining the code.

### 12.2 Math Formulas with Lists

Math formulas can appear in lists:

- Circle area formula: $A = \pi r^2$
- Sphere volume formula: $V = \frac{4}{3}\pi r^3$
- More complex formula:
  $$
  e^{i\pi} + 1 = 0
  $$



## Part 13: Edge Case Testing

### 13.1 Inline Code with Angle Brackets

Using inline code to display tags in Markdown: `<info>`, `<warning>`, `<success>`, `<post>`, `<lft>`, `<rt>`, `<smallimg>`. These should not be parsed as actual VMD tags.

### 13.2 Code Blocks Containing VMD Tags

```markdown
Here are syntax examples of VMD tags:

<info>
This is the content of an info box.
</info>

<warning>
This is the content of a warning box.
</warning>

<post>
<lft>
Left content
</lft>
<rt>
![Image](image.png)
</rt>
</post>
```


## Part 14: Comprehensive Examples

### 14.1 Complete Document Structure Example

<post>
<lft>

**Detailed Description on Left**

This example demonstrates the powerful features of the post layout:

- Left side can hold text descriptions
- Supports **various formats**
- Can include inline formulas $\alpha + \beta = \gamma$
- Use `code` to highlight keywords

Step-by-step instructions:
1. Prepare environment
2. Install dependencies
3. Run the project

</lft>
<rt>

![Step 1](../assets/images/pasted_file.png)

![Step 2](../assets/images/pasted_file.png)

![Step 3](../assets/images/pasted_file.png)

</rt>
</post>


## Part 15: Special Character Testing

### 15.1 English Punctuation and Special Characters

Testing English punctuation: , . ! ? ; : " " ' ' ( ) < > [ ] { }

Testing special symbols: @ # $ % ^ & * ( ) _ + - = [ ] { } | \ : ; " ' < > , . ? / ~ `

### 15.2 HTML Entities

Testing HTML entities: & < > " '

### 15.3 Unicode Characters

Emoji test: 🎉 🚀 💻 📚 ✨

Math symbols: ∀ ∃ ∈ ∉ ⊆ ⊇ ∪ ∩ ∞ ∂ ∫ √ ± × ÷



**End of Document**

This document covers almost all VMD features supported by v0plex and their valid combinations. Building this document allows comprehensive verification of the Markdown compiler's correctness.
