const fs = require('fs');
const path = require('path');

const NUM_ARTICLES = 100;

// Language configurations - content only, structure is shared
const LANG_CONFIGS = {
  en: {
    dir: path.join(__dirname, '../dev/en'),
    folderName: '_99_TestArticles',
    titlePrefixes: [
      'Introduction to', 'Guide for', 'Understanding', 'Advanced', 'Basics of',
      'Getting Started with', 'Mastering', 'Tutorial on', 'Overview of', 'Deep Dive into',
      'Best Practices for', 'Tips for', 'How to Use', 'Exploring', 'Working with',
      'Configuring', 'Deploying', 'Optimizing', 'Troubleshooting', 'Integrating'
    ],
    titleSubjects: [
      'v0plex', 'Markdown', 'VMD', 'Components', 'Layouts', 'Themes', 'Navigation',
      'Sidebar', 'Headers', 'Footers', 'Content Management', 'Static Sites', 'Web Development',
      'Documentation', 'API Reference', 'Configuration', 'Build Process', 'Deployment',
      'Performance', 'SEO', 'Responsive Design', 'Accessibility', 'Version Control',
      'Testing', 'Debugging', 'Customization', 'Extensions', 'Plugins', 'Themes'
    ],
    authors: ['v0plex', 'admin', 'developer', 'writer', 'contributor'],
    content: '# hello world',
    tags: ['guide', 'tutorial', 'reference', 'advanced', 'beginner', 'tips', 'configuration', 'api', 'setup', 'troubleshooting']
  },
  zh: {
    dir: path.join(__dirname, '../dev/zh'),
    folderName: '_99_测试文章',
    titlePrefixes: [
      '介绍', '指南', '理解', '高级', '基础',
      '入门', '精通', '教程', '概览', '深入',
      '最佳实践', '技巧', '如何使用', '探索', '使用',
      '配置', '部署', '优化', '故障排除', '集成'
    ],
    titleSubjects: [
      'v0plex', 'Markdown', 'VMD', '组件', '布局', '主题', '导航',
      '侧边栏', '头部', '页脚', '内容管理', '静态网站', 'Web开发',
      '文档', 'API参考', '配置', '构建流程', '部署',
      '性能', 'SEO', '响应式设计', '无障碍', '版本控制',
      '测试', '调试', '自定义', '扩展', '插件', '主题'
    ],
    authors: ['v0plex', '管理员', '开发者', '作者', '贡献者'],
    content: '# 你好世界',
    tags: ['指南', '教程', '参考', '高级', '入门', '技巧', '配置', 'API', '设置', '故障排除']
  }
};

const folderTopics = [
  'Advanced', 'Configuration', 'API', 'Tutorials', 'Examples',
  'Reference', 'Guides', 'Setup', 'Deployment', 'Integration', 'Basics'
];

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate() {
  const start = new Date(2024, 0, 1);
  const end = new Date();
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return date.toISOString().split('T')[0];
}

function randomTags(tagList) {
  const numTags = Math.floor(Math.random() * 3) + 1;
  const selected = [];
  while (selected.length < numTags) {
    const tag = randomItem(tagList);
    if (!selected.includes(tag)) {
      selected.push(tag);
    }
  }
  return selected;
}

function generateTitle(index, config) {
  const prefix = randomItem(config.titlePrefixes);
  const subject = randomItem(config.titleSubjects);
  return `${prefix} ${subject} ${index}`;
}

function generateFrontmatter(index, config) {
  const title = generateTitle(index, config);
  const created = randomDate();
  const updated = randomDate();
  const author = randomItem(config.authors);
  const selectedTags = randomTags(config.tags);

  return `---
title: ${title}
created_at: ${created}
last_updated_at: ${updated}
author: ${author}
has_custom_tsx: false
tags: [${selectedTags.join(', ')}]
---
`;
}

function generateFileName(index, title, lang) {
  // Keep consistent file naming across languages
  const safeTitle = title.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_');
  return `_0${index}_${safeTitle}.md`;
}

function generateFolderName(index) {
  return `_0${index}_${folderTopics[index % folderTopics.length]}`;
}

// Structure definition - shared between all languages
const structure = [];
let articleCount = 0;
let folderIndex = 0;

while (articleCount < NUM_ARTICLES) {
  const shouldCreateFolder = Math.random() < 0.3 && folderIndex < folderTopics.length;
  
  let folder = null;
  if (shouldCreateFolder) {
    folderIndex++;
    folder = generateFolderName(folderIndex);
  }
  
  const articlesInGroup = Math.min(
    Math.floor(Math.random() * 6) + 3,
    NUM_ARTICLES - articleCount
  );
  
  for (let i = 0; i < articlesInGroup; i++) {
    articleCount++;
    structure.push({
      index: articleCount,
      folder: folder
    });
  }
}

console.log(`Generated structure with ${structure.length} articles`);

// Generate articles for each language using the same structure
for (const [lang, config] of Object.entries(LANG_CONFIGS)) {
  console.log(`\n========== Generating for ${lang} ==========`);
  
  const TARGET_DIR = path.join(config.dir, config.folderName);
  
  // Delete existing directory if exists
  if (fs.existsSync(TARGET_DIR)) {
    fs.rmSync(TARGET_DIR, { recursive: true });
  }
  
  // Create target directory
  fs.mkdirSync(TARGET_DIR, { recursive: true });
  
  // Create folders
  const uniqueFolders = [...new Set(structure.filter(s => s.folder).map(s => s.folder))];
  for (const folder of uniqueFolders) {
    const folderPath = path.join(TARGET_DIR, folder);
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
  }
  
  // Generate articles
  for (const item of structure) {
    const title = generateTitle(item.index, config);
    const fileName = generateFileName(item.index, title, lang);
    const filePath = item.folder 
      ? path.join(TARGET_DIR, item.folder, fileName)
      : path.join(TARGET_DIR, fileName);
    
    const content = generateFrontmatter(item.index, config) + '\n' + config.content + '\n';
    fs.writeFileSync(filePath, content);
    console.log(`Created [${lang}]: ${filePath}`);
  }
  
  console.log(`\n✅ Generated ${structure.length} articles in ${TARGET_DIR}`);
}

console.log(`\n========================================`);
console.log(`✅ Total: ${structure.length * Object.keys(LANG_CONFIGS).length} articles generated across all languages`);
console.log(`Structure is identical between languages - prefixes match!`);
