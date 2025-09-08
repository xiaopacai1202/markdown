// 插件基类
export class BasePlugin {
  constructor() {
    this.name = 'base-plugin';
    this.version = '1.0.0';
    this.description = 'Base plugin class';
    this.hooks = {};
  }

  initialize(pluginManager, editorInstance) {
    this.pluginManager = pluginManager;
    this.editorInstance = editorInstance;
  }

  teardown() {
    // 清理操作
  }
}

// 编辑器工具栏按钮插件接口
export class ToolbarButtonPlugin extends BasePlugin {
  constructor() {
    super();
    this.buttonConfig = {
      icon: '',
      tooltip: '',
      position: 'left',
      onClick: () => {}
    };
  }

  initialize(pluginManager, editorInstance) {
    super.initialize(pluginManager, editorInstance);
    
    // 注册工具栏按钮
    pluginManager.triggerHook('toolbar:addButton', this.buttonConfig);
  }

  teardown() {
    // 移除工具栏按钮
    this.pluginManager.triggerHook('toolbar:removeButton', this.buttonConfig);
    super.teardown();
  }
}

// 编辑器状态监听插件接口
export class EditorStatePlugin extends BasePlugin {
  constructor() {
    super();
    this.hooks = {
      'editor:contentChanged': this.onContentChanged.bind(this)
    };
  }

  onContentChanged() {
    // 内容变化时的处理逻辑
  }
}

// 预览区域增强插件接口
export class PreviewEnhancementPlugin extends BasePlugin {
  constructor() {
    super();
    this.hooks = {
      'preview:beforeRender': this.beforePreviewRender.bind(this),
      'preview:afterRender': this.afterPreviewRender.bind(this)
    };
  }

  beforePreviewRender(content) {
    return content; // 可以修改预览内容
  }

  afterPreviewRender() {
    // 对预览元素进行操作
  }
}