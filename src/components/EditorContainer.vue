<template>
  <section class="editor-container" :class="{ 
    'editor-full-width': !sidebarVisible || (isMobile && !mobileMenuVisible),
    'mobile-editor': isMobile
  }">
    <div class="document-header">
      <el-input 
        :model-value="currentDocument.title" 
        @update:model-value="$emit('update:title', $event)"
        placeholder="输入文档标题..." 
        class="title-input"
      />
      <div class="document-meta">
        最后更新: {{ currentDocument.updatedAt ? formatDate(currentDocument.updatedAt) : '--' }}
        <span v-if="isAutoSaving" class="auto-saving-indicator">⏳ 保存中...</span>
        <span v-else-if="lastSaveTime" class="auto-saved-indicator">✅ 已自动保存</span>
      </div>
    </div>

    <div class="editor-content" :class="{ 'mobile-view': isMobile && mobileView === 'edit' }">
      <div class="editor-pane" :class="{ 'hidden-on-mobile': isMobile && mobileView !== 'edit' }">
        <textarea
          :value="currentDocument.content"
          @input="$emit('update:content', $event.target.value)"
          placeholder="开始编写你的 Markdown..."
          class="markdown-editor"
        ></textarea>
      </div>
      
      <div class="preview-pane" ref="previewElement" :class="{ 'hidden-on-mobile': isMobile && mobileView !== 'preview' }">
        <div class="html-preview" v-html="compiledMarkdown"></div>
      </div>
    </div>

    <div class="mobile-view-toggle" v-if="isMobile">
      <el-button-group>
        <el-button 
          :class="{ 'is-active': mobileView === 'edit' }"
          @click="$emit('update-mobile-view', 'edit')"
          size="small"
        >
          编辑
        </el-button>
        <el-button 
          :class="{ 'is-active': mobileView === 'preview' }"
          @click="$emit('update-mobile-view', 'preview')"
          size="small"
        >
          预览
        </el-button>
      </el-button-group>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { parseMarkdown, highlightCodeBlocks } from '../utils/markdownParser.js'

const props = defineProps({
  currentDocument: Object,
  sidebarVisible: Boolean,
  isMobile: Boolean,
  mobileMenuVisible: Boolean,
  mobileView: String,
  isAutoSaving: Boolean,
  lastSaveTime: Date,
  showWordCount: Boolean,
  wordCount: Number,
  characterCount: Number,
  lineCount: Number
})

const emit = defineEmits(['update:content', 'update:title', 'update-mobile-view'])

const previewElement = ref(null)

const compiledMarkdown = computed(() => {
  return parseMarkdown(props.currentDocument.content)
})

const formatDate = (dateString) => {
  if (!dateString) return '--'
  return new Date(dateString).toLocaleString('zh-CN')
}

// 先定义 updatePreview 函数
const updatePreview = async () => {
  if (!previewElement.value) return
  
  try {
    let html = parseMarkdown(props.currentDocument.content)
    previewElement.value.innerHTML = html
    
    await nextTick()
    highlightCodeBlocks(previewElement.value)
  } catch (error) {
    console.error('Preview update error:', error)
    previewElement.value.innerHTML = `<div class="error">预览渲染错误: ${error.message}</div>`
  }
}

// 然后再设置 watch
watch(() => props.currentDocument.content, () => {
  updatePreview()
}, { immediate: true })

onMounted(() => {
  updatePreview()
})
</script>

<style scoped>
.editor-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: margin-left 0.3s ease;
}

.editor-full-width {
  margin-left: 0;
}

.document-header {
  padding: 1rem;
  border-bottom: 1px solid var(--border-color);
  background-color: var(--card-bg);
}

.title-input {
  font-size: 1.5rem;
  font-weight: 600;
  border: none;
  outline: none;
  margin-bottom: 0.5rem;
  background-color: transparent;
  color: var(--text-color);
  width: 100%;
}

.title-input :deep(.el-input__wrapper) {
  box-shadow: none !important;
  padding: 0;
  background-color: transparent;
}

.document-meta {
  font-size: 0.875rem;
  color: var(--blockquote-text);
}

.editor-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.editor-pane,
.preview-pane {
  flex: 1;
  overflow: auto;
}

.editor-pane {
  border-right: 1px solid var(--border-color);
  background-color: var(--editor-bg);
}

.markdown-editor {
  width: 100%;
  height: 100%;
  border: none;
  outline: none;
  resize: none;
  padding: 1rem;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 14px;
  line-height: 1.6;
  background-color: transparent;
  color: var(--editor-text);
}

.html-preview {
  padding: 1rem;
  line-height: 1.6;
}

.auto-saving-indicator {
  margin-left: 12px;
  font-size: 12px;
  color: var(--el-color-warning);
}

.auto-saved-indicator {
  margin-left: 12px;
  font-size: 12px;
  color: var(--el-color-success);
  opacity: 0.7;
}

.mobile-view-toggle {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
  background-color: var(--card-bg);
  border-radius: 20px;
  padding: 5px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

@media (max-width: 768px) {
  .document-header {
    padding: 0.75rem;
  }
  
  .title-input {
    font-size: 1.2rem;
  }
  
  .editor-content {
    flex-direction: column;
  }
  
  .editor-pane,
  .preview-pane {
    flex: none;
    height: 100%;
  }
  
  .hidden-on-mobile {
    display: none;
  }
  
  .markdown-editor {
    font-size: 16px;
  }
  
  .html-preview {
    padding: 0.75rem;
    font-size: 16px;
  }
}
</style>