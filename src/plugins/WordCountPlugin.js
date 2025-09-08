import { BasePlugin } from './BasePlugin.js'

export class WordCountPlugin extends BasePlugin {
  constructor() {
    super()
    this.name = 'word-count-plugin'
    this.displayName = '字数统计'
    this.description = '实时统计文档字数和字符数，支持多种统计方式'
    this.version = '1.0.0'
    this.author = 'QuickMD Team'
  }

  initialize() {
    super.initialize()
    console.log('Word count plugin initialized')
    // 这里可以添加字数统计的初始化逻辑
  }

  enable() {
    super.enable()
    console.log('Word count plugin enabled')
    // 启用量统计
  }

  disable() {
    super.disable()
    console.log('Word count plugin disabled')
    // 禁用字数统计
  }
}

// 默认导出
export default WordCountPlugin