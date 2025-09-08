import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { exportToPDF, exportMarkdownAsPDF } from '../utils/pdfExporter.js'
import { parseMarkdown } from '@/utils/markdownParser.js'
export function useExport(currentDocument) {
  const pdfExporting = ref(false)
  const exportProgress = ref(0)
  const exportStatus = ref('')
  const exportMessage = ref('准备导出...')

  // 检查是否有内容的辅助函数
  const hasContent = () => {
    const doc = typeof currentDocument === 'function' ? currentDocument() : currentDocument
    return doc && doc.content && doc.content.trim() !== '' && doc.content.trim() !== '# 新文档\n\n开始编写你的内容...'
  }

  const handleExportCommand = async (command) => {
    if (!hasContent()) {
      ElMessage.warning('没有内容可导出')
      return
    }

    switch (command) {
      case 'html':
        downloadHTML()
        break
      case 'pdf':
        await exportAsPDF()
        break
      case 'pdf-text':
        exportAsTextPDF()
        break
      case 'markdown':
        exportAsMarkdown()
        break
    }
  }

  const exportAsPDF = async () => {
    const previewElement = document.querySelector('.preview-pane')
    if (!previewElement) {
      ElMessage.warning('预览元素未找到')
      return
    }

    pdfExporting.value = true
    exportProgress.value = 10
    exportMessage.value = '正在准备导出...'

    try {
      const doc = typeof currentDocument === 'function' ? currentDocument() : currentDocument
      const filename = `${doc.title || 'document'}.pdf`
      const now = new Date()
      const formattedDate = now.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })

      await exportToPDF(previewElement, filename, {
        title: doc.title || 'QuickMD 文档',
        date: formattedDate,
        backgroundColor: document.documentElement.classList.contains('dark-theme') ? '#1a1a1a' : '#ffffff',
        onStart: () => {
          exportProgress.value = 50
          exportMessage.value = '正在处理内容...'
        },
        onSuccess: () => {
          exportProgress.value = 100
          exportStatus.value = 'success'
          exportMessage.value = '导出成功！'
          setTimeout(() => {
            pdfExporting.value = false
            ElMessage.success('PDF 导出成功')
          }, 1000)
        },
        onError: (error) => {
          exportStatus.value = 'exception'
          exportMessage.value = '导出失败'
          console.error('PDF export failed:', error)
          ElMessage.error('PDF 导出失败')
          setTimeout(() => {
            pdfExporting.value = false
          }, 2000)
        }
      })

    } catch (error) {
      console.error('PDF export error:', error)
      pdfExporting.value = false
      ElMessage.error('导出过程中发生错误')
    }
  }

  const exportAsTextPDF = () => {
    const doc = typeof currentDocument === 'function' ? currentDocument() : currentDocument
    const filename = `${doc.title || 'document'}.pdf`
    exportMarkdownAsPDF(
      doc.content,
      doc.title || 'QuickMD 文档',
      filename
    )
    ElMessage.success('纯文本 PDF 导出成功')
  }

  const exportAsMarkdown = () => {
    const doc = typeof currentDocument === 'function' ? currentDocument() : currentDocument
    const blob = new Blob([doc.content], { type: 'text/markdown' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${doc.title || 'document'}.md`
    link.click()
    URL.revokeObjectURL(link.href)
    ElMessage.success('Markdown 导出成功')
  }

  const downloadHTML = () => {
  // 直接使用编译后的 Markdown 内容而不是预览元素
  const doc = typeof currentDocument === 'function' ? currentDocument() : currentDocument
  if (!doc.content || doc.content.trim() === '' || doc.content.trim() === '# 新文档\n\n开始编写你的内容...') {
    ElMessage.warning('没有内容可导出')
    return
  }
  
  try {
    // 使用 parseMarkdown 函数编译内容
    const htmlContent = parseMarkdown(doc.content)
    
    // 创建完整的 HTML 文档
    const fullHTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${doc.title || 'QuickMD 文档'}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            color: #333;
            background-color: #fff;
        }
        h1, h2, h3, h4, h5, h6 {
            margin-top: 1.5em;
            margin-bottom: 0.5em;
            font-weight: 600;
            line-height: 1.25;
        }
        p {
            margin-bottom: 1em;
        }
        pre {
            background-color: #f6f8fa;
            border-radius: 6px;
            padding: 1em;
            overflow: auto;
            margin-bottom: 1em;
        }
        code {
            background-color: rgba(175, 184, 193, 0.2);
            border-radius: 3px;
            padding: 0.2em 0.4em;
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            font-size: 0.85em;
        }
        pre code {
            background: none;
            padding: 0;
            border-radius: 0;
        }
        blockquote {
            border-left: 4px solid #dfe2e5;
            color: #6a737d;
            margin: 0;
            padding-left: 1em;
        }
        table {
            border-collapse: collapse;
            width: 100%;
            margin-bottom: 1em;
        }
        th, td {
            border: 1px solid #dfe2e5;
            padding: 0.5em;
        }
        th {
            background-color: #f6f8fa;
        }
        .export-info {
            text-align: center;
            margin-bottom: 2em;
            padding-bottom: 1em;
            border-bottom: 2px solid #eee;
        }
        .export-title {
            font-size: 24px;
            margin: 0 0 10px 0;
            color: #2c3e50;
        }
        .export-date {
            font-size: 14px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="export-info">
        <h1 class="export-title">${doc.title || 'QuickMD 文档'}</h1>
        <div class="export-date">导出时间: ${new Date().toLocaleString('zh-CN')}</div>
    </div>
    ${htmlContent}
</body>
</html>`
    
    const blob = new Blob([fullHTML], { type: 'text/html' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${doc.title || 'document'}.html`
    link.click()
    URL.revokeObjectURL(link.href)
    ElMessage.success('HTML 导出成功')
  } catch (error) {
    console.error('HTML export error:', error)
    ElMessage.error('HTML 导出失败')
  }
}
  return {
    pdfExporting,
    exportProgress,
    exportStatus,
    exportMessage,
    handleExportCommand,
    hasContent
  }
}