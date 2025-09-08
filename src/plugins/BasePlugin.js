export class BasePlugin {
  constructor() {
    this.name = 'base-plugin'
    this.displayName = '基础插件'
    this.description = '插件基础类'
    this.version = '1.0.0'
    this.author = 'QuickMD Team'
    this.enabled = false
    this.editor = null
  }

  setEditor(editor) {
    this.editor = editor
  }

  initialize() {
    console.log(`Plugin ${this.name} initialized`)
    this.enabled = true
  }

  enable() {
    this.enabled = true
    console.log(`Plugin ${this.name} enabled`)
  }

  disable() {
    this.enabled = false
    console.log(`Plugin ${this.name} disabled`)
  }

  destroy() {
    console.log(`Plugin ${this.name} destroyed`)
  }
}