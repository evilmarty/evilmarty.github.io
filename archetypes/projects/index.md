---
date: '{{ .Date }}'
title: '{{ replace .File.ContentBaseName `-` ` ` | title }}'
params:
  url: "https://example.com/"
---
