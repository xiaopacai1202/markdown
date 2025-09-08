<template>
  <div id="app" :class="currentTheme">
    <header class="app-header">
      <div class="mobile-menu-toggle" @click="toggleMobileMenu" v-if="isMobile">
        <el-icon><Menu /></el-icon>
      </div>

      <h1><i class="icon-document"></i> QuickMD</h1>

      <div class="header-actions">
        <!-- 侧边栏切换 -->
        <el-tooltip :content="sidebarVisible ? '隐藏侧边栏' : '显示侧边栏'" v-if="!isMobile">
          <el-button circle @click="toggleSidebar" :icon="sidebarVisible ? Fold : Expand" class="sidebar-toggle" />
        </el-tooltip>

        <!-- 插件管理 -->
        <el-tooltip content="插件管理">
          <el-button circle icon="Management" class="plugin-manage-toggle" @click="showPluginManager" />
        </el-tooltip>

        <!-- 主题 -->
        <el-tooltip :content="currentTheme === 'light-theme' ? '切换到暗色主题' : '切换到亮色主题'">
          <el-button circle @click="toggleTheme" :icon="currentTheme === 'light-theme' ? Moon : Sunny" class="theme-toggle" />
        </el-tooltip>

        <!-- 桌面工具栏 -->
        <el-button-group class="toolbar desktop-toolbar" v-if="!isMobile">
          <el-button type="primary" :icon="Document" :loading="saving" @click="manualSave">
            {{ saving ? '保存中...' : '保存' }}
          </el-button>
          <el-button :icon="Plus" @click="createEmpty">新建</el-button>

          <el-dropdown trigger="click" @command="handleExportCommand">
            <el-button type="success" :icon="Download">
              导出<el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="html">导出为 HTML</el-dropdown-item>
                <el-dropdown-item command="pdf">导出为 PDF（截图）</el-dropdown-item>
                <el-dropdown-item command="pdf-text">导出为 PDF（纯文本）</el-dropdown-item>
                <el-dropdown-item command="markdown">导出为 Markdown</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>

          <el-button type="danger" :icon="Delete" v-if="currentDocument.id" @click="deleteCurrentDocument">删除</el-button>
        </el-button-group>

        <!-- 移动端更多 -->
        <el-dropdown trigger="click" v-if="isMobile" class="mobile-toolbar-dropdown">
          <el-button circle icon="More" class="mobile-more-button" />
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="manualSave"><el-icon><Document /></el-icon>保存</el-dropdown-item>
              <el-dropdown-item @click="createEmpty"><el-icon><Plus /></el-icon>新建</el-dropdown-item>
              <el-dropdown-item divided>导出选项</el-dropdown-item>
              <el-dropdown-item command="html" @click="handleExportCommand('html')"><el-icon><Download /></el-icon>导出为 HTML</el-dropdown-item>
              <el-dropdown-item command="pdf" @click="handleExportCommand('pdf')"><el-icon><Download /></el-icon>导出为 PDF（截图）</el-dropdown-item>
              <el-dropdown-item command="pdf-text" @click="handleExportCommand('pdf-text')"><el-icon><Download /></el-icon>导出为 PDF（纯文本）</el-dropdown-item>
              <el-dropdown-item command="markdown" @click="handleExportCommand('markdown')"><el-icon><Download /></el-icon>导出为 Markdown</el-dropdown-item>
              <el-dropdown-item divided v-if="currentDocument.id">
                <el-dropdown-item @click="deleteCurrentDocument" style="color:var(--el-color-danger)"><el-icon><Delete /></el-icon>删除文档</el-dropdown-item>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </header>

    <main class="main-layout">
      <!-- 侧边栏 -->
      <aside class="sidebar" :class="{
          'sidebar-hidden': !sidebarVisible,
          'mobile-sidebar': isMobile,
          'mobile-sidebar-visible': mobileMenuVisible && isMobile
        }">
        <div class="sidebar-header">
          <h3>我的文档</h3>
          <div class="sidebar-actions">
            <el-button size="small" circle @click="loadDocuments" style="pointer-events: all;"><el-icon><Refresh /></el-icon></el-button>
            <el-button size="small" circle :icon="Close" @click="isMobile ? toggleMobileMenu() : toggleSidebar()" class="close-sidebar" />
          </div>
        </div>
        <el-divider />
        <div class="document-list">
          <div v-for="doc in documents" :key="doc.id" class="document-item" :class="{ active: currentDocument.id === doc.id }" @click="loadDocument(doc.id)">
            <div class="document-title">{{ doc.title || '无标题文档' }}</div>
            <div class="document-time">{{ formatDate(doc.updatedAt) }}</div>
          </div>
          <div v-if="documents.length === 0" class="empty-tip">暂无文档，点击"新建"开始创作</div>
        </div>
      </aside>

      <!-- 编辑区 -->
      <section class="editor-container" :class="{
          'editor-full-width': !sidebarVisible || (isMobile && !mobileMenuVisible),
          'mobile-editor': isMobile
        }">
        <div class="document-header">
          <el-input v-model="currentDocument.title" placeholder="输入文档标题..." class="title-input" @input="onTitleInput" />
          <div class="document-meta">
            最后更新: {{ currentDocument.updatedAt ? formatDate(currentDocument.updatedAt) : '--' }}
          </div>
        </div>

        <div class="editor-content" :class="{ 'mobile-view': isMobile && mobileView === 'edit' }">
          <!-- 编辑 -->
          <div class="editor-pane" :class="{ 'hidden-on-mobile': isMobile && mobileView !== 'edit' }">
            <textarea v-model="currentDocument.content" placeholder="开始编写你的 Markdown..." class="markdown-editor" />
          </div>

          <!-- 预览 -->
          <div class="preview-pane" ref="previewElement" :class="{ 'hidden-on-mobile': isMobile && mobileView !== 'preview' }">
            <div class="html-preview" v-html="compiledMarkdown"></div>
          </div>
        </div>

        <!-- 移动端切换 -->
        <div class="mobile-view-toggle" v-if="isMobile">
          <el-button-group>
            <el-button size="small" :class="{ 'is-active': mobileView === 'edit' }" @click="mobileView = 'edit'">编辑</el-button>
            <el-button size="small" :class="{ 'is-active': mobileView === 'preview' }" @click="mobileView = 'preview'">预览</el-button>
          </el-button-group>
        </div>
      </section>
    </main>

    <!-- 加载遮罩 -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-content">
        <el-icon class="is-loading" :size="30"><Loading /></el-icon>
        <p>加载中...</p>
      </div>
    </div>

    <!-- PDF 导出进度 -->
    <el-dialog v-model="pdfExporting" title="正在导出 PDF" width="30%" :show-close="false" :close-on-click-modal="false" :close-on-press-escape="false">
      <div class="export-progress">
        <el-progress :percentage="exportProgress" :status="exportStatus" />
        <p class="export-message">{{ exportMessage }}</p>
      </div>
    </el-dialog>

    <!-- 移动端遮罩 -->
    <div class="mobile-sidebar-overlay" v-if="isMobile && mobileMenuVisible" @click="toggleMobileMenu" />

    <!-- 字数统计 -->
    <div v-if="showWordCount" class="word-count-display">
      <span>📝 {{ wordCount }}</span>
      <span>🔤 {{ characterCount }}</span>
      <span>📋 {{ lineCount }}</span>
    </div>

    <!-- 插件管理 -->
    <PluginManager ref="pluginManagerRef" @plugin-toggle="initPlugins" />
  </div>
</template>

<script setup>
import { ref,onMounted } from 'vue'
import {
  Delete, Download, Document, Plus, Refresh, Sunny, Moon, ArrowDown, Close, Menu, Fold, Expand, Loading
} from '@element-plus/icons-vue'
import { exportToPDF, exportMarkdownAsPDF } from '@/utils/pdfExporter.js'
import { formatDate } from '@/utils/formatDate.js'
import PluginManager from '@/components/PluginManager.vue'
import useEditor from '@/composables/useEditor'
import { ElMessage } from 'element-plus'
/* ---------------- 解构编辑器能力 ---------------- */
const {
  currentTheme, isMobile, sidebarVisible, mobileMenuVisible, mobileView,
  documents, currentDocument, loading, saving,onTitleInput,
  loadDocuments, compiledMarkdown, wordCount, characterCount, lineCount, showWordCount,
  toggleTheme, toggleSidebar, toggleMobileMenu, loadDocument, createEmpty, manualSave, deleteCurrentDocument,
  initPlugins
} = useEditor()

/* ---------------- 插件管理器 ref ---------------- */
const pluginManagerRef = ref(null)
const showPluginManager = () => pluginManagerRef.value?.show()

/* ---------------- 导出相关 ---------------- */
const pdfExporting = ref(false)
const exportProgress = ref(0)
const exportStatus = ref('')
const exportMessage = ref('准备导出...')
const handleExportCommand = async cmd => {
  switch (cmd) {
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

/* 导出为 PDF（截图） */
async function exportAsPDF() {
  const previewElement = document.querySelector('.html-preview')
  if (!previewElement) return ElMessage.warning('没有内容可导出')
  pdfExporting.value = true
  exportProgress.value = 10
  exportMessage.value = '正在准备导出...'
  const filename = `${currentDocument.title || 'document'}.pdf`
  const success = await exportToPDF(previewElement, filename, {
    title: currentDocument.title || 'QuickMD 文档',
    date: formatDate(new Date()),
    backgroundColor: currentTheme.value === 'dark-theme' ? '#1a1a1a' : '#ffffff',
    onStart: () => { exportProgress.value = 50; exportMessage.value = '正在处理内容...' },
    onSuccess: () => { exportProgress.value = 100; exportStatus.value = 'success'; exportMessage.value = '导出成功！'; ElMessage.success('PDF 导出成功') },
    onError: e => { exportStatus.value = 'exception'; exportMessage.value = '导出失败'; ElMessage.error('PDF 导出失败'); console.error(e) }
  })
  setTimeout(() => { pdfExporting.value = false; exportProgress.value = 0; exportStatus.value = '' }, 1200)
}

/* 导出为纯文本 PDF */
function exportAsTextPDF() {
  if (!currentDocument.content) return ElMessage.warning('没有内容可导出')
  exportMarkdownAsPDF(currentDocument.content, currentDocument.title || 'QuickMD 文档', `${currentDocument.title || 'document'}.pdf`)
  ElMessage.success('纯文本 PDF 导出成功')
}

/* 导出为 Markdown */
function exportAsMarkdown() {
  if (!currentDocument.content) return ElMessage.warning('没有内容可导出')
  const blob = new Blob([currentDocument.content], { type: 'text/markdown' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${currentDocument.title || 'document'}.md`
  link.click()
  URL.revokeObjectURL(link.href)
  ElMessage.success('Markdown 导出成功')
}

/* 导出为 HTML */
function downloadHTML() {
  if (!compiledMarkdown.value) return ElMessage.warning('没有内容可导出')
  const blob = new Blob([compiledMarkdown.value], { type: 'text/html' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${currentDocument.title || 'document'}.html`
  link.click()
  URL.revokeObjectURL(link.href)
  ElMessage.success('HTML 导出成功')
}

/* ---------------- 生命周期 ---------------- */
onMounted(() => {
  // 所有初始化已在 useEditor 完成
})
</script>

<style src="@/styles/app.css"></style>