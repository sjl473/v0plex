# Post VMD 主题颜色优化方案

## IBM Carbon Design System 颜色映射

### 需要修改的文件
1. `components/vmd/postvmd.module.css`
2. `components/vmd/postvmd.tsx` (修复重复导入)
3. `app/globals.css` (新增 VMD 专用变量)

---

## 颜色映射表

### Light Theme (white)

| 元素 | 当前值 | 建议值 | Carbon Token |
|------|--------|--------|--------------|
| 图片容器背景 | `#f4f4f4` | `$layer-01` → `#f4f4f4` | `--v0plex-background-hover` |
| Modal 背景 | `#525252` | `$overlay` → `rgba(22, 22, 22, 0.8)` | 新增变量 |
| Modal 按钮颜色 | `#ffffff` | `$icon-inverse` → `#ffffff` | `--v0plex-icon-inverse` |
| 导航箭头颜色 | `#161616` | `$icon-primary` → `#161616` | `--v0plex-icon-primary` |
| 导航箭头边框 | `#ffffff` | `$background` → `#ffffff` | `--v0plex-background` |
| 图片计数器背景 | `rgba(82, 82, 82, 0.8)` | `$background-inverse` → `#393939` + opacity | 新增变量 |
| 图片计数器文字 | `#f4f4f4` | `$text-inverse` → `#ffffff` | `--v0plex-text-inverse` |

### Dark Theme (g100)

| 元素 | 当前值 | 建议值 | Carbon Token |
|------|--------|--------|--------------|
| 图片容器背景 | `#393939` | `$layer-01` → `#262626` | `--v0plex-background-hover` |
| Modal 背景 | `#525252` | `$overlay` → `rgba(0, 0, 0, 0.8)` | 新增变量 |
| Modal 按钮颜色 | `#ffffff` (强制) | `$icon-primary` → `#f4f4f4` | `--v0plex-icon-primary` |
| 导航箭头颜色 | `#f4f4f4` | `$icon-primary` → `#f4f4f4` | `--v0plex-icon-primary` |
| 导航箭头边框 | 隐式 | `$background` → `#161616` | `--v0plex-background` |
| 图片计数器背景 | `rgba(200, 200, 200, 0.8)` | `$background-inverse` → `#f4f4f4` + opacity | 新增变量 |
| 图片计数器文字 | `#161616` | `$text-inverse` → `#161616` | `--v0plex-text-inverse` |

---

## CSS 变量扩展建议

在 `app/globals.css` 中添加以下 VMD 专用变量：

```css
html[v0plex-theme="white"] {
    /* 已有变量... */
    
    /* VMD 专用 - Light Theme */
    --vmd-overlay-background: rgba(22, 22, 22, 0.85);
    --vmd-counter-bg: rgba(57, 57, 57, 0.9);
    --vmd-counter-text: #ffffff;
    --vmd-arrow-shadow: #ffffff;
    --vmd-nav-bg-hover: rgba(15, 98, 254, 0.1);
}

html[v0plex-theme="g100"] {
    /* 已有变量... */
    
    /* VMD 专用 - Dark Theme */
    --vmd-overlay-background: rgba(0, 0, 0, 0.9);
    --vmd-counter-bg: rgba(244, 244, 244, 0.9);
    --vmd-counter-text: #161616;
    --vmd-arrow-shadow: #161616;
    --vmd-nav-bg-hover: rgba(120, 169, 255, 0.15);
}
```

---

## 组件修改清单

### postvmd.module.css 修改

1. **.imageWrapper**: 改用 `--v0plex-background-hover` 变量
2. **.modalOverlay**: 改用 `--vmd-overlay-background` 变量
3. **.modalCloseBtn, .modalNavBtn**: 移除 `!important`，使用 `--v0plex-icon-inverse`
4. **.navArrow***: 使用 `--v0plex-icon-primary` 和 `--vmd-arrow-shadow`
5. **.imageCounter**: 使用 `--vmd-counter-bg` 和 `--vmd-counter-text`
6. **.modalCaption**: 使用 `--v0plex-text-inverse` 而非硬编码 `#ffffff`

### postvmd.tsx 修复

1. 移除重复的导入语句（第5-10行）
2. 确保 Modal 按钮正确传递 theme 上下文

---

## 交互状态优化

### 导航箭头悬停效果

```css
.navArrow {
    transition: opacity 0.15s ease, transform 0.15s ease;
}

.navArrow:hover {
    transform: translateY(-50%) scale(1.1);
    filter: brightness(1.2);
}
```

### Modal 按钮悬停效果

使用 Carbon Button 的 ghost kind 配合主题，或者添加自定义悬停状态：

```css
.modalCloseBtn:hover,
.modalNavBtn:hover {
    background-color: var(--vmd-nav-bg-hover) !important;
}
```

---

## 无障碍考虑

1. **对比度**: 所有文字与背景对比度 ≥ 4.5:1
2. **焦点状态**: 添加 `:focus-visible` 样式
3. **减少动画**: 支持 `prefers-reduced-motion`

---

## 实施优先级

1. **P0**: 修复重复导入，统一颜色变量
2. **P1**: 添加 VMD 专用 CSS 变量
3. **P2**: 优化交互状态（悬停、焦点）
4. **P3**: 支持 prefers-reduced-motion
