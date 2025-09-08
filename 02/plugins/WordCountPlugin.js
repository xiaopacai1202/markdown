import { EditorStatePlugin } from './PluginInterface';

export default class WordCountPlugin extends EditorStatePlugin {
  constructor() {
    super();
    this.name = 'word-count-plugin';
    this.version = '1.0.0';
    this.description = '实时统计文档字数、字符数和行数';
    
    this.statsElement = null;
    this.stats = {
      words: 0,
      characters: 0,
      lines: 0
    };
  }

  // src/plugins/WordCountPlugin.js
createWordCountDisplay() {
  // 不再区分移动端/桌面端，由 Vue 组件统一控制显示
  // 插件只负责功能逻辑，不负责UI显示
  console.log('字数统计插件功能已初始化');
  
  // 注册内容变化监听
  this.pluginManager.registerHook('editor:contentChanged', (content) => {
    this.updateStats(content);
  });
}

// 移除创建DOM元素的逻辑
teardown() {
  // 清理逻辑，不再移除DOM元素
  console.log('字数统计插件已卸载');
  super.teardown();
}

  // 检测是否为移动端
  isMobile() {
    return window.innerWidth <= 768;
  }

  createStatsElement() {
    this.statsElement = document.createElement('div');
    this.statsElement.className = 'word-count-display';
    this.statsElement.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: var(--el-color-primary);
      color: white;
      padding: 8px 12px;
      border-radius: 16px;
      font-size: 14px;
      font-weight: 500;
      z-index: 99;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      transition: all 0.3s ease;
    `;
    
    document.body.appendChild(this.statsElement);
  }

  onContentChanged(content) {
    this.updateStats(content);
  }

  updateStats(content) {
    if (!this.statsElement) return;
    
    if (!content) {
      this.stats = { words: 0, characters: 0, lines: 0 };
    } else {
      this.stats = {
        words: this.countWords(content),
        characters: this.countCharacters(content),
        lines: this.countLines(content)
      };
    }
    
    this.renderStats();
  }

  countWords(content) {
    const trimmed = content.trim();
    return trimmed ? trimmed.split(/\s+/).filter(word => word.length > 0).length : 0;
  }

  countCharacters(content) {
    return content.length;
  }

  countLines(content) {
    return content.split('\n').length;
  }

  renderStats() {
    if (!this.statsElement) return;
    
    this.statsElement.innerHTML = `
      <div style="display: flex; gap: 15px; align-items: center;">
        <span>📝 ${this.stats.words}</span>
        <span>🔤 ${this.stats.characters}</span>
        <span>📋 ${this.stats.lines}</span>
      </div>
    `;

    // 如果内容为空，显示灰色状态
    if (this.stats.characters === 0) {
      this.statsElement.style.opacity = '0.6';
      this.statsElement.style.backgroundColor = 'var(--el-border-color)';
    } else {
      this.statsElement.style.opacity = '1';
      this.statsElement.style.backgroundColor = 'var(--el-color-primary)';
    }
  }

  // 添加窗口大小变化监听（可选）
  onWindowResize() {
    if (this.isMobile() && this.statsElement) {
      // 如果是移动端且元素存在，移除它
      if (this.statsElement.parentNode) {
        this.statsElement.parentNode.removeChild(this.statsElement);
      }
      this.statsElement = null;
    } else if (!this.isMobile() && !this.statsElement) {
      // 如果是桌面端且元素不存在，创建它
      this.createStatsElement();
      this.updateStats(this.editorInstance?.content || '');
    }
  }
}