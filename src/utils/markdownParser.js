import { marked } from 'marked'
import hljs from 'highlight.js'

// 配置 marked 使用 highlight.js 进行代码高亮
marked.setOptions({
  highlight: function (code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(code, { language: lang }).value
      } catch (err) {
        console.warn(`Highlight.js error for language ${lang}:`, err)
        return hljs.highlightAuto(code).value
      }
    }
    
    // 自动检测语言
    try {
      return hljs.highlightAuto(code).value
    } catch (err) {
      console.warn('Highlight.js auto detection error:', err)
      return code
    }
  },
  langPrefix: 'hljs language-',
})

// 导出解析函数
export const parseMarkdown = (content) => {
  if (!content || content.trim() === '') {
    return '<p>暂无内容</p>'
  }
  
  try {
    return marked.parse(content)
  } catch (error) {
    console.error('Marked parsing error:', error)
    return `<p>解析错误: ${error.message}</p>`
  }
}

// 单独的高亮函数，用于手动高亮
export const highlightCodeBlocks = (element) => {
  if (!element) return
  
  // 高亮所有代码块
  const codeBlocks = element.querySelectorAll('pre code')
  codeBlocks.forEach((block) => {
    // 如果已经高亮过了，跳过
    if (block.classList.contains('hljs')) return
    
    try {
      hljs.highlightElement(block)
    } catch (error) {
      console.warn('Highlight error:', error)
    }
  })
}

// 动态切换高亮主题 - 使用本地样式
export const setHighlightTheme = (theme) => {
  // 移除现有的高亮样式
  const existingStyles = document.querySelectorAll('style[data-highlight-style]')
  existingStyles.forEach(style => style.remove())
  
  // 添加新的高亮样式
  const style = document.createElement('style')
  style.dataset.highlightStyle = 'true'
  
  if (theme === 'dark-theme') {
    // github-dark 样式
    style.textContent = `
      .hljs{display:block;overflow-x:auto;padding:0.5em;color:#e6edf3;background:#0d1117}
      .hljs-doctag,.hljs-keyword,.hljs-meta .hljs-keyword,.hljs-template-tag,.hljs-template-variable,.hljs-type,.hljs-variable.language_{color:#ff7b72}
      .hljs-title,.hljs-title.class_,.hljs-title.class_.inherited__,.hljs-title.function_{color:#d2a8ff}
      .hljs-attr,.hljs-attribute,.hljs-literal,.hljs-meta,.hljs-number,.hljs-operator,.hljs-selector-attr,.hljs-selector-class,.hljs-selector-id,.hljs-variable{color:#79c0ff}
      .hljs-meta .hljs-string,.hljs-regexp,.hljs-string{color:#a5d6ff}
      .hljs-built_in,.hljs-symbol{color:#ffa657}
      .hljs-code,.hljs-comment,.hljs-formula{color:#8b949e}
      .hljs-name,.hljs-quote,.hljs-selector-pseudo,.hljs-selector-tag{color:#7ee787}
      .hljs-subst{color:#c9d1d9}
      .hljs-section{color:#1f6feb;font-weight:700}
      .hljs-bullet{color:#f2cc60}
      .hljs-emphasis{color:#c9d1d9;font-style:italic}
      .hljs-strong{color:#c9d1d9;font-weight:700}
      .hljs-addition{color:#aff5b4;background-color:#033a16}
      .hljs-deletion{color:#ffdcd7;background-color:#67060c}
      
      /* 代码块容器样式 */
      pre code.hljs {
        padding: 1rem;
        border-radius: 6px;
        border: 1px solid #30363d;
        margin: 1rem 0;
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'source-code-pro', monospace;
        font-size: 14px;
        line-height: 1.5;
      }
    `
  } else {
    // github 样式
    style.textContent = `
      .hljs{display:block;overflow-x:auto;padding:0.5em;color:#24292e;background:#f6f8fa}
      .hljs-doctag,.hljs-keyword,.hljs-meta .hljs-keyword,.hljs-template-tag,.hljs-template-variable,.hljs-type,.hljs-variable.language_{color:#d73a49}
      .hljs-title,.hljs-title.class_,.hljs-title.class_.inherited__,.hljs-title.function_{color:#6f42c1}
      .hljs-attr,.hljs-attribute,.hljs-literal,.hljs-meta,.hljs-number,.hljs-operator,.hljs-selector-attr,.hljs-selector-class,.hljs-selector-id,.hljs-variable{color:#005cc5}
      .hljs-meta .hljs-string,.hljs-regexp,.hljs-string{color:#032f62}
      .hljs-built_in,.hljs-symbol{color:#e36209}
      .hljs-code,.hljs-comment,.hljs-formula{color:#6a737d}
      .hljs-name,.hljs-quote,.hljs-selector-pseudo,.hljs-selector-tag{color:#22863a}
      .hljs-subst{color:#24292e}
      .hljs-section{color:#005cc5;font-weight:700}
      .hljs-bullet{color:#735c0f}
      .hljs-emphasis{color:#24292e;font-style:italic}
      .hljs-strong{color:#24292e;font-weight:700}
      .hljs-addition{color:#22863a;background-color:#f0fff4}
      .hljs-deletion{color:#b31d28;background-color:#ffeef0}
      
      /* 代码块容器样式 */
      pre code.hljs {
        padding: 1rem;
        border-radius: 6px;
        border: 1px solid #e1e4e8;
        margin: 1rem 0;
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'source-code-pro', monospace;
        font-size: 14px;
        line-height: 1.5;
      }
    `
  }
  
  document.head.appendChild(style)
}