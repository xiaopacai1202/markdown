import { BasePlugin } from './BasePlugin.js'

export class DiagramPlugin extends BasePlugin {
  constructor() {
    super()
    this.name = 'diagram-plugin'
    this.displayName = '图表支持'
    this.description = '支持 Mermaid 图表渲染，包括流程图、序列图、甘特图等'
    this.version = '1.0.0'
    this.author = 'QuickMD Team'
  }

  initialize() {
    super.initialize()
    console.log('Diagram plugin initialized')
    // 这里可以添加图表支持的初始化逻辑
  }

  enable() {
    super.enable()
    console.log('Diagram plugin enabled')
    // 启用图表支持
  }

  disable() {
    super.disable()
    console.log('Diagram plugin disabled')
    // 禁用图表支持
  }
}

// 默认导出
export default DiagramPlugin

// 同时导出 DiagramToolbarPlugin
export { DiagramToolbarPlugin } from './DiagramToolbarPlugin.js'