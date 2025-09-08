class PluginManager {
  constructor() {
    this.plugins = new Map()
    this.hooks = new Map()
    this.editorInstance = null
  }

  setEditorInstance(editor) {
    this.editorInstance = editor
    // 为所有已注册的插件设置编辑器实例
    for (const plugin of this.plugins.values()) {
      this.setEditorForPlugin(plugin)
    }
  }

  setEditorForPlugin(plugin) {
    if (this.editorInstance && typeof plugin.setEditor === 'function') {
      plugin.setEditor(this.editorInstance)
    }
  }

  register(plugin) {
    if (this.plugins.has(plugin.name)) {
      console.warn(`Plugin ${plugin.name} is already registered`)
      return false
    }

    try {
      // 设置编辑器实例（如果可用）
      this.setEditorForPlugin(plugin)
      
      // 初始化插件
      if (typeof plugin.initialize === 'function') {
        plugin.initialize()
      }
      
      this.plugins.set(plugin.name, plugin)
      console.log(`Plugin ${plugin.name} registered successfully`)
      return true
    } catch (error) {
      console.error(`Failed to register plugin ${plugin.name}:`, error)
      return false
    }
  }

  unregister(pluginName) {
    const plugin = this.plugins.get(pluginName)
    if (plugin) {
      // 清理插件
      if (typeof plugin.destroy === 'function') {
        plugin.destroy()
      }
      this.plugins.delete(pluginName)
      console.log(`Plugin ${pluginName} unregistered`)
    }
  }

  getPlugin(pluginName) {
    return this.plugins.get(pluginName)
  }

  getPlugins() {
    return Array.from(this.plugins.values())
  }

  registerHook(hookName, callback) {
    if (!this.hooks.has(hookName)) {
      this.hooks.set(hookName, [])
    }
    this.hooks.get(hookName).push(callback)
  }

  triggerHook(hookName, ...args) {
    const hooks = this.hooks.get(hookName)
    if (hooks) {
      let result
      for (const hook of hooks) {
        result = hook(...args)
        // 如果钩子返回了值，使用该值作为后续参数
        if (result !== undefined) {
          args = [result]
        }
      }
      return result
    }
    return args[0] // 返回第一个参数作为默认值
  }

  enablePlugin(pluginName) {
    const plugin = this.plugins.get(pluginName)
    if (plugin && typeof plugin.enable === 'function') {
      plugin.enable()
    }
  }

  disablePlugin(pluginName) {
    const plugin = this.plugins.get(pluginName)
    if (plugin && typeof plugin.disable === 'function') {
      plugin.disable()
    }
  }
}

// 导出单例
export default new PluginManager()