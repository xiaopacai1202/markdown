class PluginManager {
  constructor() {
    this.plugins = new Map();
    this.hooks = new Map();
    this.editorInstance = null;
  }

  // 设置编辑器实例
  setEditorInstance(editor) {
    this.editorInstance = editor;
    return this;
  }

  // 注册插件
  register(plugin) {
    if (this.plugins.has(plugin.name)) {
      console.warn(`Plugin ${plugin.name} is already registered`);
      return false;
    }

    try {
      // 初始化插件
      if (plugin.initialize) {
        plugin.initialize(this, this.editorInstance);
      }

      // 注册插件钩子
      if (plugin.hooks) {
        Object.entries(plugin.hooks).forEach(([hookName, callback]) => {
          this.registerHook(hookName, callback);
        });
      }

      this.plugins.set(plugin.name, plugin);
      console.log(`Plugin ${plugin.name} registered successfully`);
      return true;
    } catch (error) {
      console.error(`Failed to register plugin ${plugin.name}:`, error);
      return false;
    }
  }

  // 注销插件
  unregister(pluginName) {
    const plugin = this.plugins.get(pluginName);
    if (!plugin) {
      console.warn(`Plugin ${pluginName} is not registered`);
      return false;
    }

    try {
      // 执行清理操作
      if (plugin.teardown) {
        plugin.teardown(this, this.editorInstance);
      }

      // 移除插件钩子
      if (plugin.hooks) {
        Object.keys(plugin.hooks).forEach(hookName => {
          this.unregisterHook(hookName, plugin.hooks[hookName]);
        });
      }

      this.plugins.delete(pluginName);
      console.log(`Plugin ${pluginName} unregistered successfully`);
      return true;
    } catch (error) {
      console.error(`Failed to unregister plugin ${pluginName}:`, error);
      return false;
    }
  }

  // 注册钩子
  registerHook(hookName, callback) {
    if (!this.hooks.has(hookName)) {
      this.hooks.set(hookName, []);
    }
    this.hooks.get(hookName).push(callback);
  }

  // 注销钩子
  unregisterHook(hookName, callback) {
    if (!this.hooks.has(hookName)) return;
    
    const callbacks = this.hooks.get(hookName);
    const index = callbacks.indexOf(callback);
    if (index !== -1) {
      callbacks.splice(index, 1);
    }
  }

  // 触发钩子
  triggerHook(hookName, ...args) {
    if (!this.hooks.has(hookName)) return;
    
    this.hooks.get(hookName).forEach(callback => {
      try {
        callback(...args);
      } catch (error) {
        console.error(`Error in hook ${hookName}:`, error);
      }
    });
  }

  // 获取所有已注册插件
  getPlugins() {
    return Array.from(this.plugins.values());
  }

  // 获取特定插件
  getPlugin(pluginName) {
    return this.plugins.get(pluginName);
  }
}

// 创建单例实例
 const pluginManager = new PluginManager();
 export default pluginManager