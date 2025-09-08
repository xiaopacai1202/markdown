<template>
  <el-dropdown class="mobile-toolbar-dropdown" trigger="click">
    <el-tooltip content="更多操作" placement="bottom" :show-after="500">
      <el-button icon="More" circle class="header-button" />
    </el-tooltip>
    <template #dropdown>
      <el-dropdown-menu class="mobile-dropdown-menu">
        <!-- 保存 -->
        <el-dropdown-item @click="$emit('save-document')" class="mobile-dropdown-item">
          <el-icon><Document /></el-icon>
          <span>保存</span>
        </el-dropdown-item>

        <!-- 新建 -->
        <el-dropdown-item @click="$emit('create-new-document')" class="mobile-dropdown-item">
          <el-icon><Plus /></el-icon>
          <span>新建</span>
        </el-dropdown-item>

        <el-dropdown-item divided class="mobile-dropdown-divider">
          <span>导出选项</span>
        </el-dropdown-item>

        <!-- 导出选项 -->
        <el-dropdown-item @click="$emit('export-command', 'html')" :disabled="!hasContent" class="mobile-dropdown-item">
          <el-icon><Document /></el-icon>
          <span>导出为 HTML</span>
        </el-dropdown-item>

        <el-dropdown-item @click="$emit('export-command', 'pdf')" :disabled="!hasContent" class="mobile-dropdown-item">
          <el-icon><Picture /></el-icon>
          <span>导出为 PDF（截图）</span>
        </el-dropdown-item>

        <el-dropdown-item @click="$emit('export-command', 'pdf-text')" :disabled="!hasContent" class="mobile-dropdown-item">
          <el-icon><DocumentCopy /></el-icon>
          <span>导出为 PDF（纯文本）</span>
        </el-dropdown-item>

        <el-dropdown-item @click="$emit('export-command', 'markdown')" :disabled="!hasContent" class="mobile-dropdown-item">
          <el-icon><Notebook /></el-icon>
          <span>导出为 Markdown</span>
        </el-dropdown-item>

        <!-- 删除 -->
        <el-dropdown-item divided v-if="currentDocument.id" class="mobile-dropdown-divider">
          <el-dropdown-item @click="$emit('delete-current-document')" class="mobile-dropdown-item mobile-dropdown-danger">
            <el-icon><Delete /></el-icon>
            <span>删除文档</span>
          </el-dropdown-item>
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<script setup>
import { Document, Plus, Delete, Picture, DocumentCopy, Notebook } from '@element-plus/icons-vue'

defineProps({
  currentDocument: Object,
  hasContent: Boolean
})

defineEmits(['save-document', 'create-new-document', 'delete-current-document', 'export-command'])
</script>

<style scoped>
.mobile-toolbar-dropdown {
  margin-left: 8px;
}

/* 移动端下拉菜单项样式 */
:deep(.mobile-dropdown-menu) {
  border-radius: 12px;
  padding: 8px 0;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

:deep(.mobile-dropdown-item) {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  color: var(--el-text-color-primary);
  opacity: 0.9;
  transition: all 0.2s ease;
  min-width: 160px;
  border-radius: 6px;
  margin: 2px 8px;
}

:deep(.mobile-dropdown-item:hover) {
  opacity: 1;
  background-color: var(--el-fill-color-light);
  transform: translateX(2px);
}

:deep(.mobile-dropdown-danger) {
  color: var(--el-color-danger) !important;
}

:deep(.mobile-dropdown-danger:hover) {
  background-color: rgba(var(--el-color-danger-rgb), 0.1) !important;
}

:deep(.mobile-dropdown-divider) {
  color: var(--el-text-color-secondary);
  font-weight: 500;
  opacity: 0.7;
  padding: 8px 20px;
  font-size: 13px;
  margin: 4px 8px;
  border-bottom: 1px solid var(--el-border-color);
}

:deep(.mobile-dropdown-item .el-icon) {
  font-size: 18px;
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

:deep(.mobile-dropdown-item span) {
  font-size: 14px;
  font-weight: 500;
}

/* 禁用状态 */
:deep(.mobile-dropdown-item.is-disabled) {
  opacity: 0.5;
  color: var(--el-text-color-disabled);
  cursor: not-allowed;
}

:deep(.mobile-dropdown-item.is-disabled:hover) {
  background-color: transparent;
  transform: none;
}

/* 移动端适配 */
@media (max-width: 480px) {
  :deep(.mobile-dropdown-menu) {
    min-width: 180px;
  }
  
  :deep(.mobile-dropdown-item) {
    padding: 10px 16px;
    gap: 10px;
    margin: 2px 6px;
  }
  
  :deep(.mobile-dropdown-item .el-icon) {
    font-size: 16px;
  }
  
  :deep(.mobile-dropdown-item span) {
    font-size: 13px;
  }
  
  :deep(.mobile-dropdown-divider) {
    padding: 6px 16px;
    margin: 4px 6px;
  }
}
</style>