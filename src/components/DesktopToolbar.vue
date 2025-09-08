<template>
  <div class="desktop-toolbar">
    <!-- 保存按钮 -->
    <el-tooltip content="保存" placement="bottom" :show-after="500">
      <el-button 
        @click="$emit('save-document')" 
        :icon="Document" 
        :loading="saving" 
        circle
        class="toolbar-button"
      />
    </el-tooltip>

    <!-- 新建按钮 -->
    <el-tooltip content="新建" placement="bottom" :show-after="500">
      <el-button 
        @click="$emit('create-new-document')" 
        :icon="Plus"
        circle
        class="toolbar-button"
      />
    </el-tooltip>

    <!-- 导出下拉菜单 -->
    <el-tooltip content="导出" placement="bottom" :show-after="500">
      <el-dropdown @command="$emit('export-command', $event)" trigger="click">
        <el-button 
          :icon="Download" 
          :disabled="!hasContent"
          circle
          class="toolbar-button"
        />
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="html" :disabled="!hasContent">
              <el-icon><Document /></el-icon>导出为 HTML
            </el-dropdown-item>
            <el-dropdown-item command="pdf" :disabled="!hasContent">
              <el-icon><Picture /></el-icon>导出为 PDF（截图）
            </el-dropdown-item>
            <el-dropdown-item command="pdf-text" :disabled="!hasContent">
              <el-icon><DocumentCopy /></el-icon>导出为 PDF（纯文本）
            </el-dropdown-item>
            <el-dropdown-item command="markdown" :disabled="!hasContent">
              <el-icon><Notebook /></el-icon>导出为 Markdown
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </el-tooltip>

    <!-- 删除按钮 -->
    <el-tooltip content="删除" placement="bottom" :show-after="500" v-if="currentDocument.id">
      <el-button 
        @click="$emit('delete-current-document')" 
        :icon="Delete" 
        circle
        class="toolbar-button"
      />
    </el-tooltip>
  </div>
</template>

<script setup>
import { Document, Plus, Download, Delete, Picture, DocumentCopy, Notebook } from '@element-plus/icons-vue'

defineProps({
  saving: Boolean,
  currentDocument: Object,
  hasContent: Boolean
})

defineEmits(['save-document', 'create-new-document', 'delete-current-document', 'export-command'])
</script>

<style scoped>
.desktop-toolbar {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-left: 8px;
}

/* 统一工具栏按钮样式 */
.toolbar-button {
  width: 32px;
  height: 32px;
  min-width: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s ease;
  background-color: rgba(255, 255, 255, 0.1);
  border: none;
  color: var(--header-text);
  padding: 0;
  margin: 0;
}

.toolbar-button:hover {
  background-color: rgba(255, 255, 255, 0.2);
  transform: translateY(-1px);
}

.toolbar-button:active {
  transform: translateY(0);
}

/* 暗色主题下的按钮样式 */
.dark-theme .toolbar-button {
  background-color: rgba(0, 0, 0, 0.2);
}

.dark-theme .toolbar-button:hover {
  background-color: rgba(0, 0, 0, 0.3);
}

/* 禁用状态的按钮 */
.toolbar-button.is-disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.toolbar-button.is-disabled:hover {
  transform: none;
  background-color: rgba(255, 255, 255, 0.1);
}

.dark-theme .toolbar-button.is-disabled:hover {
  background-color: rgba(0, 0, 0, 0.2);
}

/* 加载状态 */
.toolbar-button .el-icon.is-loading {
  animation: rotating 2s linear infinite;
}

@keyframes rotating {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 按钮图标大小统一 */
.toolbar-button .el-icon {
  font-size: 16px;
  width: 16px;
  height: 16px;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .desktop-toolbar {
    display: none;
  }
}

/* 下拉菜单样式 */
:deep(.el-dropdown-menu) {
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color);
  padding: 4px 0;
}

:deep(.el-dropdown-menu__item) {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  font-size: 13px;
  transition: all 0.2s ease;
  color: var(--el-text-color-primary);
  border-radius: 4px;
  margin: 2px 4px;
}

:deep(.el-dropdown-menu__item:hover) {
  background-color: var(--el-fill-color-light);
}

:deep(.el-dropdown-menu__item .el-icon) {
  font-size: 14px;
  width: 14px;
  height: 14px;
}

:deep(.el-dropdown-menu__item.is-disabled) {
  opacity: 0.5;
  color: var(--el-text-color-disabled);
  cursor: not-allowed;
}

:deep(.el-dropdown-menu__item.is-disabled:hover) {
  background-color: transparent;
}
</style>