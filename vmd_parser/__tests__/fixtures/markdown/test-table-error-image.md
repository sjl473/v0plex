---
title: Table Error Test - Image
created_at: 2024-01-01
last_updated_at: 2024-01-01
author: test-author->test@example.com
has_custom_tsx: false
tags: [test, table, error]
---

# Table Error Test - Image in Cell

This file should fail compilation because it contains an image inside a table cell.

| Header 1 | Header 2 |
|----------|----------|
| ![alt](image.png) | Normal text |
