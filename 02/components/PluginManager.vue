<template>
  <el-dialog
    v-model="visible"
    title="插件管理"
    :width="getDialogWidth"
    :before-close="handleBeforeClose"
    :class="{ 'mobile-dialog': isMobile, 'tablet-dialog': isTablet }"
  >
    <div class="plugin-manager">
      <el-alert
        title="插件管理"
        type="info"
        description="点击开关即可启用或禁用功能插件"
        show-icon
        class="mb-16"
      />
      
      <div class="plugin-list">
        <div
          v-for="plugin in plugins"
          :key="plugin.name"
          class="plugin-item"
          :class="{ 'plugin-item-disabled': !plugin.enabled }"
        >
          <div class="plugin-info">
            <div class="plugin-header">
              <h4 class="plugin-name">{{ plugin.displayName }}</h4>
              <el-tag
                :type="plugin.enabled ? 'success' : 'info'"
                size="small"
              >
                {{ plugin.enabled ? '已启用' : '已禁用' }}
              </el-tag>
            </div>
            <p class="plugin-description">{{ plugin.description }}</p>
            <div class="plugin-version">
              <span class="version">v{{ plugin.version }}</span>
              <span class="author">by {{ plugin.author }}</span>
            </div>
          </div>
          
          <div class="plugin-actions">
            <el-switch
              v-model="plugin.enabled"
              @change="handlePluginToggle(plugin)"
              :active-value="true"
              :inactive-value="false"
            />
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">关闭</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, watch, computed} from 'vue'
import { ElMessage } from 'element-plus'


const emit = defineEmits(['update:modelValue', 'pluginToggle'])

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

// 响应式数据
const visible = ref(false)
const plugins = reactive([])

// 可用的插件列表
const availablePlugins = [
  {
    name: 'word-count-plugin',
    displayName: '字数统计',
    description: '实时统计文档字数和字符数，支持多种统计方式',
    version: '1.0.0',
    author: 'QuickMD Team',
    enabled: true
  },
  {
    name: 'diagram-plugin',
    displayName: '图表支持',
    description: '支持 Mermaid 图表渲染，包括流程图、序列图、甘特图等',
    version: '1.0.0',
    author: 'QuickMD Team',
    enabled: true
  },
  {
    name: 'diagram-toolbar-plugin',
    displayName: '图表工具栏',
    description: '提供图表插入快捷工具栏，方便快速插入各种图表',
    version: '1.0.0',
    author: 'QuickMD Team',
    enabled: true
  }
]

// 添加设备检测
const isMobile = computed(() => window.innerWidth <= 768)
const isTablet = computed(() => window.innerWidth > 768 && window.innerWidth <= 1024)


// 动态对话框宽度
const getDialogWidth = computed(() => {
  if (isMobile.value) return '90%'      // 移动端：90%宽度
  if (isTablet.value) return '70%'      // 平板：70%宽度
  return '600px'                        // 桌面端：固定600px
})

// 从 localStorage 加载插件配置
const loadPluginConfig = () => {
  try {
    const savedConfig = localStorage.getItem('plugin-config')
    if (savedConfig) {
      return JSON.parse(savedConfig)
    }
    // 默认配置
    return {
      'word-count-plugin': true,
      'diagram-plugin': true,
      'diagram-toolbar-plugin': true
    }
  } catch (error) {
    console.error('加载插件配置失败:', error)
    return {
      'word-count-plugin': true,
      'diagram-plugin': true,
      'diagram-toolbar-plugin': true
    }
  }
}

// 保存插件配置到 localStorage
const savePluginConfig = () => {
  try {
    const config = {}
    plugins.forEach(plugin => {
      config[plugin.name] = plugin.enabled
    })
    localStorage.setItem('plugin-config', JSON.stringify(config))
    return true
  } catch (error) {
    console.error('保存插件配置失败:', error)
    return false
  }
}

// 处理插件开关切换
const handlePluginToggle = (plugin) => {
  // 立即保存到 localStorage
  savePluginConfig()
  
  // 通知父组件插件状态变化
  emit('pluginToggle', {
    name: plugin.name,
    enabled: plugin.enabled
  })
  
  ElMessage.success(`${plugin.displayName} ${plugin.enabled ? '已启用' : '已禁用'}`)
}

// 处理关闭
const handleClose = () => {
  visible.value = false
}

// 处理关闭对话框
const handleBeforeClose = (done) => {
  done() // 直接关闭，不再询问保存
}

// 显示对话框
const show = () => {
  // 加载当前配置
  const pluginConfig = loadPluginConfig()
  
  // 初始化插件列表
  plugins.length = 0
  availablePlugins.forEach(plugin => {
    plugins.push({
      ...plugin,
      enabled: pluginConfig[plugin.name] ?? plugin.enabled
    })
  })
  
  visible.value = true
}

// 隐藏对话框
const hide = () => {
  visible.value = false
}

// 监听 visible 变化，同步到 modelValue
watch(visible, (newVal) => {
  emit('update:modelValue', newVal)
})

// 监听 modelValue 变化，同步到 visible
watch(() => props.modelValue, (newVal) => {
  visible.value = newVal
})

// 暴露方法给父组件
defineExpose({
  show,
  hide
})
</script>

<style scoped>
.plugin-manager {
  max-height: 60vh;
  overflow-y: auto;
}

.mb-16 {
  margin-bottom: 16px;
}

.plugin-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.plugin-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 12px;
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  transition: all 0.2s ease;
  background: var(--el-bg-color);
}

.plugin-item:hover {
  border-color: var(--el-color-primary);
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
}

.plugin-item-disabled {
  opacity: 0.6;
  background-color: var(--el-fill-color-light);
}

.plugin-info {
  flex: 1;
  margin-right: 12px;
}

.plugin-header {
  display: flex;
  align-items: center;
  margin-bottom: 6px;
  gap: 8px;
}

.plugin-name {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.plugin-description {
  margin: 0 0 8px 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
  line-height: 1.4;
}

.plugin-version {
  display: flex;
  gap: 12px;
  font-size: 11px;
  color: var(--el-text-color-placeholder);
}

.plugin-actions {
  display: flex;
  align-items: center;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
}

/* 移动端优化 */
:deep(.mobile-dialog .el-dialog) {
  width: 95% !important;
  max-width: 100%;
  margin: 20px auto !important;
  max-height: 80vh;
}

:deep(.mobile-dialog .el-dialog__body) {
  padding: 16px 16px 0;
  margin: 0;
  padding: 16px;
}

:deep(.mobile-dialog .el-dialog__header) {
  padding: 0 16px 16px;
}
:deep(.mobile-dialog .el-dialog__footer) {
  padding: 0 16px 16px;
}

/* 平板优化 */
:deep(.tablet-dialog .el-dialog) {
  width: 70% !important;
  max-width: 800px;
  margin: 40px auto !important;
  max-height: 70vh;
}

:deep(.tablet-dialog .el-dialog__body) {
  max-height: 55vh;
  overflow-y: auto;
  padding: 20px;
}

:deep(.tablet-dialog .el-dialog__header) {
  padding: 20px 20px 0;
}

:deep(.tablet-dialog .el-dialog__footer) {
  padding: 0 20px 20px;
}
/* 桌面端优化 */
:deep(.el-dialog:not(.mobile-dialog):not(.tablet-dialog)) {
  width: 600px;
  max-height: 70vh;
}

:deep(.el-dialog:not(.mobile-dialog):not(.tablet-dialog) .el-dialog__body) {
  max-height: 55vh;
  overflow-y: auto;
  padding: 20px;
}
/* 移动端插件项优化 */
@media (max-width: 768px) {
  .plugin-item {
    flex-direction: column;
    gap: 12px;
    padding: 12px;
  }
  
  .plugin-info {
    margin-right: 0;
  }
  
  .plugin-actions {
    align-self: flex-end;
  }
  
  .plugin-header {
    flex-wrap: wrap;
  }
  
  .plugin-name {
    font-size: 14px;
  }
  
  .plugin-description {
    font-size: 12px;
  }
  
  .plugin-version {
    font-size: 11px;
  }
}
/* 平板端插件项优化 */
@media (min-width: 769px) and (max-width: 1024px) {
  .plugin-item {
    padding: 14px;
  }
  
  .plugin-name {
    font-size: 15px;
  }
  
  .plugin-description {
    font-size: 13px;
  }
}
/* 移动端字数统计样式 */
.mobile-word-count {
  position: fixed;
  bottom: 70px;
  right: 15px;
  background-color: var(--el-color-primary);
  color: white;
  padding: 6px 10px;
  border-radius: 14px;
  font-size: 12px;
  font-weight: 500;
  z-index: 98;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  display: flex;
  gap: 8px;
  align-items: center;
}
/* 小屏幕优化 */
@media (max-width: 480px) {
  .mobile-word-count {
    bottom: 65px;
    right: 10px;
    padding: 5px 8px;
    font-size: 11px;
    gap: 6px;
  }
  
  .mobile-word-count span {
    display: flex;
    align-items: center;
    gap: 2px;
  }
  
  :deep(.mobile-dialog .el-dialog) {
    width: 95% !important;
    margin: 10px auto !important;
  }
}
/* 确保不会遮挡其他元素 */
@media (max-width: 768px) {
  .mobile-view-toggle {
    bottom: 20px;
  }
  
  .mobile-word-count {
    bottom: 70px;
  }
}
</style>