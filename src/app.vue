<template>
  <div id="app" :class="currentTheme">
    <AppHeader
      :is-mobile="isMobile"
      :sidebar-visible="sidebarVisible"
      :current-theme="currentTheme"
      :saving="saving"
      :current-document="currentDocument"
      :has-content="hasContent()"
      @toggle-sidebar="toggleSidebar"
      @toggle-theme="toggleTheme"
      @save-document="saveDocument"
      @create-new-document="createNewDocument"
      @delete-current-document="deleteCurrentDocument"
      @export-command="handleExportCommand"
      @show-plugin-manager="showPluginManager"
      @toggle-mobile-menu="toggleMobileMenu"
    />

    <main class="main-layout">
      <Sidebar
        :documents="documents"
        :current-document="currentDocument"
        :sidebar-visible="sidebarVisible"
        :is-mobile="isMobile"
        :mobile-menu-visible="mobileMenuVisible"
        @load-document="loadDocument"
        @load-documents="loadDocuments"
        @toggle-mobile-menu="toggleMobileMenu"
        @toggle-sidebar="toggleSidebar"
      />

      <EditorContainer
        :current-document="currentDocument"
        :sidebar-visible="sidebarVisible"
        :is-mobile="isMobile"
        :mobile-menu-visible="mobileMenuVisible"
        :mobile-view="mobileView"
        :is-auto-saving="isAutoSaving"
        :last-save-time="lastSaveTime"
        :show-word-count="showWordCount"
        :word-count="wordCount"
        :character-count="characterCount"
        :line-count="lineCount"
        @update:content="updateContent"
        @update:title="updateTitle"
        @update-mobile-view="updateMobileView"
      />
    </main>

    <LoadingOverlay :loading="loading" />
    
    <ExportDialog
      v-model:pdfExporting="pdfExporting"
      :export-progress="exportProgress"
      :export-status="exportStatus"
      :export-message="exportMessage"
    />

    <div 
      v-if="isMobile && mobileMenuVisible" 
      class="mobile-sidebar-overlay" 
      @click="toggleMobileMenu"
    ></div>

    <div v-if="showWordCount" class="word-count-display">
      <span>📝 {{ wordCount }}</span>
      <span>🔤 {{ characterCount }}</span>
      <span>📋 {{ lineCount }}</span>
    </div>

    <PluginManager 
      ref="pluginManagerRef" 
      :current-theme="currentTheme"
      :model-value="pluginDialogVisible"
      @update:model-value="pluginDialogVisible = $event"
      @plugin-toggle="handlePluginToggle"
    />
  </div>
</template>

<script setup>
import { ref,computed, onMounted, onUnmounted} from 'vue'

// Components
import AppHeader from './components/AppHeader.vue'
import Sidebar from './components/Sidebar.vue'
import EditorContainer from './components/EditorContainer.vue'
import LoadingOverlay from './components/LoadingOverlay.vue'
import ExportDialog from './components/ExportDialog.vue'
import PluginManager from './components/PluginManager.vue'

// Composables
import { useAutoSave } from './composables/useAutoSave'
import { useTheme } from './composables/useTheme'
import { useDocuments } from './composables/useDocuments'
import { useExport } from './composables/useExport'
import { usePlugins } from './composables/usePlugins'
import { useResponsive } from './composables/useResponsive'

// 响应式布局
const { isMobile, checkIsMobile } = useResponsive()

// 主题管理
const { currentTheme, toggleTheme } = useTheme()

// 文档管理
const {
  documents,
  currentDocument,
  loading,
  saving,
  loadDocuments,
  loadDocumentsSilently,
  loadDocument,
  createNewDocument,
  deleteCurrentDocument,
  saveDocument,
  formatDate
} = useDocuments()

// 自动保存
const {
  isAutoSaving,
  lastSaveTime,
  startAutoSave,
  stopAutoSave,
  debouncedAutoSave
} = useAutoSave(currentDocument, saveDocument, loadDocumentsSilently)

// 导出功能
const {
  pdfExporting,
  exportProgress,
  exportStatus,
  exportMessage,
  handleExportCommand,
  hasContent
} = useExport(() => currentDocument)

// 插件管理
const {
  pluginManagerRef,
  showPluginManager,
  pluginDialogVisible,
  handlePluginToggle,
  initializePlugins,
  showWordCount
} = usePlugins(currentDocument)

// 侧边栏状态
const sidebarVisible = ref(true)
const mobileMenuVisible = ref(false)
const mobileView = ref('edit')

// 计算属性
const wordCount = computed(() => {
  const content = currentDocument.content.trim()
  return content ? content.split(/\s+/).filter(word => word.length > 0).length : 0
})

const characterCount = computed(() => {
  return currentDocument.content.length
})

const lineCount = computed(() => {
  return currentDocument.content.split('\n').length
})

// 方法
const toggleSidebar = () => {
  sidebarVisible.value = !sidebarVisible.value
  localStorage.setItem('quickmd-sidebar', sidebarVisible.value)
}

const toggleMobileMenu = () => {
  mobileMenuVisible.value = !mobileMenuVisible.value
}

const updateContent = (content) => {
  currentDocument.content = content
  debouncedAutoSave()
}

const updateTitle = (title) => {
  currentDocument.title = title
  debouncedAutoSave()
}

const updateMobileView = (view) => {
  mobileView.value = view
}

// 生命周期
onMounted(() => {
  checkIsMobile()
  window.addEventListener('resize', checkIsMobile)
  
  const savedSidebarState = localStorage.getItem('quickmd-sidebar')
  if (savedSidebarState !== null) {
    sidebarVisible.value = savedSidebarState === 'true'
  }
  
  loadDocuments()
  startAutoSave()
  initializePlugins()
})

onUnmounted(() => {
  window.removeEventListener('resize', checkIsMobile)
  stopAutoSave()
})
</script>

<style>
/* 样式保持不变 */
:root, .light-theme {
  --bg-color: #ffffff;
  --text-color: #2c3e50;
  --border-color: #eaecef;
  --header-bg: #2c3e50;
  --header-text: #ecf0f1;
  --editor-bg: #f6f8fa;
  --editor-text: #2c3e50;
  --pre-bg: #f6f8fa;
  --code-bg: rgba(175, 184, 193, 0.2);
  --blockquote-border: #dfe2e5;
  --blockquote-text: #6a737d;
  --table-border: #dfe2e5;
  --table-header-bg: #f6f8fa;
  --sidebar-bg: #f8f9fa;
  --card-bg: #ffffff;
  --card-hover: #f5f7fa;
  --card-active: #e3f2fd;
}

.dark-theme {
  --bg-color: #1a1a1a;
  --text-color: #e0e0e0;
  --border-color: #404040;
  --header-bg: #1f2937;
  --header-text: #f3f4f6;
  --editor-bg: #2d3748;
  --editor-text: #e2e8f0;
  --pre-bg: #2d3748;
  --code-bg: rgba(75, 85, 99, 0.4);
  --blockquote-border: #4a5568;
  --blockquote-text: #a0aec0;
  --table-border: #4a5568;
  --table-header-bg: #2d3748;
  --sidebar-bg: #2d2d2d;
  --card-bg: #2d2d2d;
  --card-hover: #3d3d3d;
  --card-active: #374151;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  transition: all 0.3s ease;
}

body, #app {
  height: 100vh;
  overflow: hidden;
  background-color: var(--bg-color);
  color: var(--text-color);
}

#app {
  display: flex;
  flex-direction: column;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  position: relative;
}

.main-layout {
  display: flex;
  flex: 1;
  overflow: hidden;
  position: relative;
}

.mobile-sidebar-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 190;
}

.word-count-display {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: var(--card-bg);
  padding: 8px 12px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  font-size: 12px;
  display: flex;
  gap: 12px;
  z-index: 100;
  border: 1px solid var(--border-color);
}

.word-count-display span {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 移动端优化 */
@media (max-width: 768px) {
  .word-count-display {
    bottom: 70px;
    right: 10px;
    font-size: 11px;
    gap: 8px;
    padding: 6px 10px;
  }
}
</style>