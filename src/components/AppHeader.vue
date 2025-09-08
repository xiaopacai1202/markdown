<template>
  <header class="app-header">
    <div class="mobile-menu-toggle" @click="$emit('toggle-mobile-menu')" v-if="isMobile">
      <el-icon><Menu /></el-icon>
    </div>
    
    <h1><i class="icon-document"></i> QuickMD</h1>
    
    <div class="header-actions">
      <!-- 侧边栏切换按钮 -->
      <el-tooltip :content="sidebarVisible ? '隐藏侧边栏' : '显示侧边栏'" v-if="!isMobile">
        <el-button 
          @click="$emit('toggle-sidebar')" 
          :icon="sidebarVisible ? Fold : Expand" 
          circle 
          class="header-button"
        />
      </el-tooltip>
      
      <!-- 插件管理按钮 -->
      <el-tooltip content="插件管理">
        <el-button 
          @click="$emit('show-plugin-manager')" 
          icon="Management" 
          circle 
          class="header-button"
        />
      </el-tooltip>
      
      <!-- 主题切换按钮 -->
      <el-tooltip :content="currentTheme === 'light-theme' ? '切换到暗色主题' : '切换到亮色主题'">
        <el-button 
          @click="$emit('toggle-theme')" 
          :icon="currentTheme === 'light-theme' ? Moon : Sunny" 
          circle 
          class="header-button"
        />
      </el-tooltip>
      
      <DesktopToolbar 
        v-if="!isMobile"
        :saving="saving"
        :current-document="currentDocument"
        :has-content="hasContent"
        @save-document="$emit('save-document')"
        @create-new-document="$emit('create-new-document')"
        @delete-current-document="$emit('delete-current-document')"
        @export-command="$emit('export-command', $event)"
      />
      
      <MobileToolbar 
        v-if="isMobile"
        :current-document="currentDocument"
        :has-content="hasContent"
        @save-document="$emit('save-document')"
        @create-new-document="$emit('create-new-document')"
        @delete-current-document="$emit('delete-current-document')"
        @export-command="$emit('export-command', $event)"
      />
    </div>
  </header>
</template>

<script setup>
import { Menu, Fold, Expand, Moon, Sunny, Management } from '@element-plus/icons-vue'
import DesktopToolbar from './DesktopToolbar.vue'
import MobileToolbar from './MobileToolbar.vue'

defineProps({
  isMobile: Boolean,
  sidebarVisible: Boolean,
  currentTheme: String,
  saving: Boolean,
  currentDocument: Object,
  hasContent: Boolean
})

defineEmits([
  'toggle-sidebar',
  'toggle-theme',
  'save-document',
  'create-new-document',
  'delete-current-document',
  'export-command',
  'show-plugin-manager',
  'toggle-mobile-menu'
])
</script>

<style scoped>
.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background-color: var(--header-bg);
  color: var(--header-text);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
  position: relative;
  z-index: 100;
}

.app-header h1 {
  font-size: 1.5rem;
  font-weight: 500;
  margin: 0;
}

.mobile-menu-toggle {
  display: none;
  cursor: pointer;
  margin-right: 1rem;
}

.mobile-menu-toggle .el-icon {
  font-size: 1.5rem;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 统一头部按钮样式 */
.header-button {
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

.header-button:hover {
  background-color: rgba(255, 255, 255, 0.2);
  transform: translateY(-1px);
}

.header-button:active {
  transform: translateY(0);
}

/* 暗色主题下的按钮样式 */
.dark-theme .header-button {
  background-color: rgba(0, 0, 0, 0.2);
}

.dark-theme .header-button:hover {
  background-color: rgba(0, 0, 0, 0.3);
}

/* 移动端样式 */
@media (max-width: 768px) {
  .app-header {
    padding: 0.75rem 1rem;
    height: 56px;
  }
  
  .app-header h1 {
    font-size: 1.2rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 120px;
  }
  
  .mobile-menu-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 12px;
  }
  
  .header-actions {
    gap: 6px;
  }
  
  .header-button {
    width: 36px;
    height: 36px;
    min-width: 36px;
  }
}

@media (max-width: 480px) {
  .app-header {
    padding: 0.5rem;
  }
  
  .app-header h1 {
    max-width: 100px;
    font-size: 1.1rem;
  }
  
  .header-actions {
    gap: 4px;
  }
  
  .header-button {
    width: 34px;
    height: 34px;
    min-width: 34px;
  }
  
  .mobile-menu-toggle {
    margin-right: 8px;
  }
  
  .mobile-menu-toggle .el-icon {
    font-size: 1.3rem;
  }
}

/* 工具提示样式优化 */
:deep(.el-tooltip__trigger) {
  outline: none;
}

:deep(.el-tooltip__popper) {
  background: var(--el-bg-color);
  color: var(--el-text-color-primary);
  border: 1px solid var(--el-border-color);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  border-radius: 6px;
  padding: 6px 10px;
  font-size: 12px;
}

:deep(.el-tooltip__popper .popper__arrow) {
  border-bottom-color: var(--el-border-color);
}

:deep(.el-tooltip__popper .popper__arrow::after) {
  border-bottom-color: var(--el-bg-color);
}

/* 按钮图标大小统一 */
.header-button .el-icon {
  font-size: 16px;
  width: 16px;
  height: 16px;
}

/* 移动端按钮图标 */
@media (max-width: 768px) {
  .header-button .el-icon {
    font-size: 18px;
    width: 18px;
    height: 18px;
  }
}
</style>