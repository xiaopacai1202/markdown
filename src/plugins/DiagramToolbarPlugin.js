import { BasePlugin } from './BasePlugin.js'

export class DiagramToolbarPlugin extends BasePlugin {
  constructor() {
    super()
    this.name = 'diagram-toolbar-plugin'
    this.displayName = '图表工具栏'
    this.description = '提供图表插入快捷工具栏，方便快速插入各种图表'
    this.version = '1.0.0'
    this.author = 'QuickMD Team'
  }

  initialize() {
    super.initialize()
    console.log('Diagram toolbar plugin initialized')
    // 这里可以添加工具栏的初始化逻辑
  }

  enable() {
    super.enable()
    console.log('Diagram toolbar plugin enabled')
    // 启用工具栏
  }

  disable() {
    super.disable()
    console.log('Diagram toolbar plugin disabled')
    // 禁用工具栏
  }
}

// 默认导出
export default DiagramToolbarPlugin