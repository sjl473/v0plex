---
created_at: July 20th, 2025
last_updated_at: August 3rd, 2025
author: anonymous
type: blog
has_custom_tsx: false
---


# lorem 1

## Supported Syntax Overview

### Basic Typography

**Bold text** `__bold__`  
*Italic text* `_italic_`  
***Bold italic***  
~~Strikethrough~~

### Headings

# H1
## H2
### H3
#### H4
##### H5
###### H6

### Paragraphs and Line Breaks

Lorem ipsum dolor sit amet, consectetur adipiscing elit.  
Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.→  
Quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

### Lists

- Lorem ipsum dolor sit amet
    - Consectetur adipiscing elit
        - Sed do eiusmod tempor incididunt

### Blockquotes

> Lorem ipsum dolor sit amet, consectetur adipiscing elit.  
> Ut enim ad minim veniam, quis nostrud exercitation ullamco.

### Code

Inline: `const example = "lorem ipsum";`

Code block:
```javascript
function generateText() {
  const content = "Lorem ipsum dolor sit amet";
  console.log(content);
  return content.split(" ").length;
}
```

### Mathematical Expressions

Inline: $E = mc^2$

Block:
$$
\int_{a}^{b} f(x) \, dx = F(b) - F(a)
$$

### Links and Images

[Example link](https://example.com)  
![Placeholder image](../assets/images/pasted%20file.png)

### Escaping

\* Literal asterisk \*  
\# Literal hash \#

## Custom Extension Tags

### post: Side-by-side Layout

<post>
<lft>

- Lorem ipsum dolor sit amet
- Consectetur adipiscing elit
- Sed do eiusmod tempor

</lft>
<rt>

![Image one](../assets/images/pasted%20file.png)  
![Image two](../assets/images/pasted%20file.png)  
![Image three](../assets/images/pasted%20file.png)

</rt>
</post>

### info: Information Box

<info>
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt.
</info>

### smallimg: Inline Small Image

Text with embedded <smallimg>![icon](../assets/images/pasted%20file.png)</smallimg> small image.

## Current Limitations

- Table syntax not supported
- Task lists not supported
- Nested blockquotes not supported
- Ordered list support status to be confirmed

