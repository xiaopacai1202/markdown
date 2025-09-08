<template>
  <aside class="sidebar" :class="{ 
    'sidebar-hidden': !sidebarVisible, 
    'mobile-sidebar': isMobile,
    'mobile-sidebar-visible': mobileMenuVisible && isMobile
  }">
    <div class="sidebar-header">
      <h3>我的文档</h3>
      <div class="sidebar-actions">
        <el-button size="small" @click="$emit('load-documents')" :icon="Refresh" circle />
        <el-button size="small" @click="handleCloseSidebar" :icon="Close" circle class="close-sidebar" />
      </div>
    </div>
    <el-divider />
    <div class="document-list">
      <div 
        v-for="doc in documents" 
        :key="doc.id" 
        class="document-item" 
        :class="{ active: currentDocument.id === doc.id }"
        @click="$emit('load-document', doc.id)"
      >
        <div class="document-title">{{ doc.title || '无标题文档' }}</div>
        <div class="document-time">{{ formatDate(doc.updatedAt) }}</div>
      </div>
      <div v-if="documents.length === 0" class="empty-tip">
        暂无文档，点击"新建"开始创作
      </div>
    </div>
  </aside>
</template>

<script setup>
import { Refresh, Close } from '@element-plus/icons-vue'

const props = defineProps({
  documents: Array,
  currentDocument: Object,
  sidebarVisible: Boolean,
  isMobile: Boolean,
  mobileMenuVisible: Boolean
})

const emit = defineEmits(['load-document', 'load-documents', 'toggle-mobile-menu', 'toggle-sidebar'])

const formatDate = (dateString) => {
  if (!dateString) return '--'
  return new Date(dateString).toLocaleString('zh-CN')
}

const handleCloseSidebar = () => {
  if (props.isMobile) {
    emit('toggle-mobile-menu')
  } else {
    emit('toggle-sidebar')
  }
}
</script>

<style scoped>
.sidebar {
  width: 280px;
  background-color: var(--sidebar-bg);
  border-right: 1px solid var(--border-color);
  overflow-y: auto;
  padding: 1rem;
  transition: transform 0.3s ease;
}

.sidebar-hidden {
  transform: translateX(-100%);
  position: absolute;
  height: 100%;
  z-index: 90;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.15);
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.sidebar-header h3 {
  margin: 0;
  color: var(--text-color);
}

.sidebar-actions {
  display: flex;
  gap: 5px;
}

.close-sidebar {
  display: none;
}

.sidebar-hidden .close-sidebar {
  display: block;
}

.document-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.document-item {
  padding: 0.75rem;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s;
  border: 1px solid var(--border-color);
  background-color: var(--card-bg);
}

.document-item:hover {
  background-color: var(--card-hover);
}

.document-item.active {
  background-color: var(--card-active);
  border-color: #409eff;
}

.document-title {
  font-weight: 500;
  margin-bottom: 0.25rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.document-time {
  font-size: 0.75rem;
  color: var(--blockquote-text);
}

.empty-tip {
  text-align: center;
  color: var(--blockquote-text);
  padding: 2rem;
  font-style: italic;
}

@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    height: 100%;
    width: 80%;
    max-width: 300px;
    z-index: 200;
    transform: translateX(-100%);
    box-shadow: 2px 0 10px rgba(0, 0, 0, 0.2);
  }
  
  .mobile-sidebar-visible {
    transform: translateX(0);
  }
}

@media (max-width: 480px) {
  .document-item {
    padding: 1rem;
  }
  
  .document-title {
    font-size: 1rem;
  }
  
  .document-time {
    font-size: 0.75rem;
  }
}
</style>