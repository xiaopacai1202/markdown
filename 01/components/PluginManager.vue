<template>
  <el-dialog
    v-model="dialogVisible"
    title="插件管理"
    :width="getDialogWidth"
    :before-close="handleBeforeClose"
    :class="{ 'mobile-dialog': isMobile, 'tablet-dialog': isTablet, 'dark-dialog': isDarkTheme }"
    :style="dialogStyle"
    :close-on-click-modal="true"
    :close-on-press-escape="true"
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
          @click="dialogVisible = false" 
          :class="{ 'dark-button': isDarkTheme }"
        >
          关闭
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  currentTheme: {
    type: String,
    default: 'light-theme'
  }
})

const emit = defineEmits(['update:visible', 'pluginToggle'])

// 使用计算属性处理双向绑定
const dialogVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

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
  '--dark-bg-color': '#2d3748',
  '--dark-text-color': '#e2e8f0',
  '--dark-border-color': '#4a5568',
  '--dark-card-bg': '#2d3748',
  '--dark-card-hover': '#3c4b64'
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

// 初始化插件列表
const initializePlugins = () => {
  const pluginConfig = loadPluginConfig()
  plugins.length = 0
  availablePlugins.forEach(plugin => {
    plugins.push({
      ...plugin,
      enabled: pluginConfig[plugin.name] ?? plugin.enabled
    })
  })
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

// 处理关闭对话框
const handleBeforeClose = (done) => {
  done()
}

// 监听 visible 变化，当弹窗显示时初始化插件列表
watch(() => props.visible, (newVal) => {
  if (newVal) {
    initializePlugins()
  }
})

// 暴露方法
defineExpose({
  initializePlugins
})
</script>