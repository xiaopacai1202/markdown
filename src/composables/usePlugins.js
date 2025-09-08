import { ref, reactive, onUnmounted,computed } from 'vue'
import { markRaw } from 'vue'
import pluginManager from '../plugins/PluginManager.js'
import WordCountPlugin from '../plugins/WordCountPlugin'
import DiagramPlugin from '../plugins/DiagramPlugin.js'
import { DiagramToolbarPlugin } from '../plugins/DiagramPlugin.js'

export function usePlugins(currentDocument) {
  const pluginManagerRef = ref(null)
  // 添加插件弹窗可见状态
const pluginDialogVisible = ref(false)
  const pluginStates = reactive({
    'word-count-plugin': false,
    'diagram-plugin': false,
    'diagram-toolbar-plugin': false
  })

  const showWordCount = computed(() => {
    return pluginStates['word-count-plugin'] === true
  })

  const showPluginManager = () => {
  if (pluginManagerRef.value) {
    pluginDialogVisible.value = true
    // 确保调用 show 方法
    setTimeout(() => {
      pluginManagerRef.value.show()
    }, 0)
  }
}

  const handlePluginToggle = (pluginInfo) => {
    pluginStates[pluginInfo.name] = pluginInfo.enabled
    initializePlugins()
  }

  const loadPluginConfig = () => {
    const config = localStorage.getItem('plugin-config')
    if (config) {
      try {
        return JSON.parse(config)
      } catch (error) {
        console.error('解析插件配置失败:', error)
        return {
          'word-count-plugin': true,
          'diagram-plugin': true,
          'diagram-toolbar-plugin': true
        }
      }
    }
    return {
      'word-count-plugin': true,
      'diagram-plugin': true,
      'diagram-toolbar-plugin': true
    }
  }

  const initializePlugins = () => {
    // 清除所有已注册的插件
    const registeredPlugins = wrappedPluginManager.getPlugins()
    if (registeredPlugins.length > 0) {
      registeredPlugins.forEach(plugin => {
        wrappedPluginManager.unregister(plugin.name)
      })
    }

    // 设置编辑器实例
    const editorAPI = {
      content: currentDocument.content,
      insertText(text) {
        const textarea = document.querySelector('.markdown-editor')
        if (!textarea) return
        
        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        const before = currentDocument.content.substring(0, start)
        const after = currentDocument.content.substring(end)
        
        currentDocument.content = before + text + after
      }
    }
    
    wrappedPluginManager.setEditorInstance(editorAPI)
    
    // 加载当前配置
    const pluginConfig = loadPluginConfig()
    
    // 更新插件状态
    Object.keys(pluginStates).forEach(pluginName => {
      pluginStates[pluginName] = pluginConfig[pluginName] ?? false
    })
    
    // 注册插件
    const registerPlugin = (pluginName, PluginClass) => {
  if (pluginConfig[pluginName]) {
    try {
      const plugin = new PluginClass()
      const success = wrappedPluginManager.register(plugin)
      if (success) {
        console.log(`✅ ${pluginName} 注册成功`)
      }
      return success
    } catch (error) {
      console.error(`❌ ${pluginName} 注册失败:`, error)
      return false
    }
  } else {
    console.log(`⏸️ ${pluginName} 已禁用，跳过注册`)
    return false
  }
}
    
    registerPlugin('word-count-plugin', WordCountPlugin)
    registerPlugin('diagram-plugin', DiagramPlugin)
    registerPlugin('diagram-toolbar-plugin', DiagramToolbarPlugin)
  }

  const wrappedPluginManager = markRaw(pluginManager)

  onUnmounted(() => {
    wrappedPluginManager.getPlugins().forEach(plugin => {
      wrappedPluginManager.unregister(plugin.name)
    })
  })

  return {
    pluginManagerRef,
    pluginDialogVisible,
    pluginStates,
    showWordCount,
    showPluginManager,
    handlePluginToggle,
    initializePlugins
  }
}