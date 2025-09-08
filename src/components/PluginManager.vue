<template>
  <el-dialog
    :model-value="visible"
    @update:model-value="$emit('update:modelValue', $event)"
    title="插件管理"
    :width="getDialogWidth"
    :before-close="handleBeforeClose"
    :class="{ 'mobile-dialog': isMobile, 'tablet-dialog': isTablet, 'dark-dialog': isDarkTheme }"
    :style="dialogStyle"
  >
    <div class="plugin-manager">
      <el-alert
        title="插件管理"
        type="info"
        :description="alertDescription"
        show-icon
        class="mb-16"
        :class="{ 'dark-alert': isDarkTheme }"
      />
      
      <div class="plugin-list">
        <div
          v-for="plugin in plugins"
          :key="plugin.name"
          class="plugin-item"
          :class="{ 
            'plugin-item-disabled': !plugin.enabled,
            'dark-plugin-item': isDarkTheme
          }"
        >
          <div class="plugin-info">
            <div class="plugin-header">
              <h4 class="plugin-name" :class="{ 'dark-text': isDarkTheme }">{{ plugin.displayName }}</h4>
              <el-tag
                :type="plugin.enabled ? 'success' : 'info'"
                size="small"
                :class="{ 'dark-tag': isDarkTheme }"
              >
                {{ plugin.enabled ? '已启用' : '已禁用' }}
              </el-tag>
            </div>
            <p class="plugin-description" :class="{ 'dark-text-secondary': isDarkTheme }">{{ plugin.description }}</p>
            <div class="plugin-version">
              <span class="version" :class="{ 'dark-text-secondary': isDarkTheme }">v{{ plugin.version }}</span>
              <span class="author" :class="{ 'dark-text-secondary': isDarkTheme }">by {{ plugin.author }}</span>
            </div>
          </div>
          
          <div class="plugin-actions">
            <el-switch
              v-model="plugin.enabled"
              @change="handlePluginToggle(plugin)"
              :active-value="true"
              :inactive-value="false"
              :class="{ 'dark-switch': isDarkTheme }"
            />
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button 
          @click="handleClose" 
          :class="{ 'dark-button': isDarkTheme }"
        >
          关闭
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, watch, computed } from 'vue'
import { ElMessage } from 'element-plus'

const emit = defineEmits(['update:modelValue', 'pluginToggle'])

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  currentTheme: {
    type: String,
    default: 'light-theme'
  }
})

// 响应式数据
const visible = ref(false)
const plugins = reactive([])

// 计算属性
const isDarkTheme = computed(() => props.currentTheme === 'dark-theme')
const isMobile = computed(() => window.innerWidth <= 768)
const isTablet = computed(() => window.innerWidth > 768 && window.innerWidth <= 1024)
const alertDescription = computed(() => 
  isDarkTheme.value 
    ? '点击开关即可启用或禁用功能插件（深色模式）' 
    : '点击开关即可启用或禁用功能插件'
)

// 动态对话框宽度
const getDialogWidth = computed(() => {
  if (isMobile.value) return '90%'
  if (isTablet.value) return '70%'
  return '600px'
})

// 对话框样式
const dialogStyle = computed(() => ({
  '--dark-bg-color': '#1a1a1a',
  '--dark-text-color': '#e0e0e0',
  '--dark-border-color': '#404040',
  '--dark-card-bg': '#2d2d2d',
  '--dark-card-hover': '#3d3d3d'
}))

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

// 从 localStorage 加载插件配置
const loadPluginConfig = () => {
  try {
    const savedConfig = localStorage.getItem('plugin-config')
    if (savedConfig) {
      return JSON.parse(savedConfig)
    }
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
  savePluginConfig()
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
  done()
}

// 显示对话框
const show = () => {
  const pluginConfig = loadPluginConfig()
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

// 监听 visible 变化
watch(visible, (newVal) => {
  emit('update:modelValue', newVal)
})

// 监听 modelValue 变化
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

/* 深色模式样式 */
.dark-plugin-item {
  background-color: var(--dark-card-bg);
  border-color: var(--dark-border-color);
}

.dark-plugin-item:hover {
  border-color: var(--el-color-primary);
  background-color: var(--dark-card-hover);
}

.dark-plugin-item.plugin-item-disabled {
  background-color: rgba(75, 85, 99, 0.3);
}

.dark-text {
  color: var(--dark-text-color) !important;
}

.dark-text-secondary {
  color: #a0aec0 !important;
}

.dark-alert {
  background-color: var(--dark-card-bg);
  border-color: var(--dark-border-color);
}

.dark-alert :deep(.el-alert__title) {
  color: var(--dark-text-color);
}

.dark-alert :deep(.el-alert__description) {
  color: #a0aec0;
}

.dark-tag {
  background-color: rgba(75, 85, 99, 0.4);
  border-color: var(--dark-border-color);
}

.dark-tag :deep(.el-tag__content) {
  color: var(--dark-text-color);
}

.dark-button {
  background-color: var(--dark-card-bg);
  border-color: var(--dark-border-color);
  color: var(--dark-text-color);
}

.dark-button:hover {
  background-color: var(--dark-card-hover);
  border-color: var(--el-color-primary);
}

.dark-switch :deep(.el-switch__core) {
  background-color: var(--dark-border-color);
}

.dark-switch :deep(.el-switch__core:after) {
  background-color: var(--dark-text-color);
}

/* 移动端优化 */
:deep(.mobile-dialog .el-dialog) {
  width: 95% !important;
  max-width: 100%;
  margin: 20px auto !important;
  max-height: 80vh;
}

:deep(.mobile-dialog .el-dialog__body) {
  padding: 16px;
}

:deep(.mobile-dialog.dark-dialog .el-dialog) {
  background-color: var(--dark-bg-color);
}

:deep(.dark-dialog .el-dialog__header) {
  border-bottom: 1px solid var(--dark-border-color);
}

:deep(.dark-dialog .el-dialog__title) {
  color: var(--dark-text-color);
}

:deep(.dark-dialog .el-dialog__headerbtn .el-dialog__close) {
  color: var(--dark-text-color);
}

:deep(.dark-dialog .el-dialog__body) {
  background-color: var(--dark-bg-color);
  color: var(--dark-text-color);
}

:deep(.dark-dialog .el-dialog__footer) {
  border-top: 1px solid var(--dark-border-color);
  background-color: var(--dark-bg-color);
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
</style>