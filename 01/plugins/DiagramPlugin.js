import { PreviewEnhancementPlugin, ToolbarButtonPlugin } from './PluginInterface';

// Mermaid 图表支持
export default class DiagramPlugin extends PreviewEnhancementPlugin {
  constructor() {
    super();
    this.name = 'diagram-plugin';
    this.version = '1.0.0';
    this.description = '支持Mermaid流程图、序列图等图表渲染';
    
    this.mermaidInitialized = false;
  }

  initialize(pluginManager, editorInstance) {
    super.initialize(pluginManager, editorInstance);
    
    // 动态加载Mermaid库
    this.loadMermaid().then(() => {
      this.mermaidInitialized = true;
      console.log('Mermaid loaded successfully');
    }).catch(error => {
      console.error('Failed to load Mermaid:', error);
    });
  }

  loadMermaid() {
    return new Promise((resolve, reject) => {
      // 检查是否已加载
      if (window.mermaid) {
        resolve();
        return;
      }

      // 动态加载Mermaid
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/mermaid@9.4.0/dist/mermaid.min.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Mermaid'));
      document.head.appendChild(script);
    });
  }

  beforePreviewRender(content) {
    if (!this.mermaidInitialized) return content;
    
    // 查找并替换Mermaid代码块
    return content.replace(/```mermaid\n([\s\S]*?)\n```/g, (match, diagramCode) => {
      const id = 'mermaid-' + Math.random().toString(36).substr(2, 9);
      return `<div class="mermaid-diagram" id="${id}">${diagramCode}</div>`;
    });
  }

  afterPreviewRender(previewElement) {
    if (!this.mermaidInitialized || !previewElement) return;
    
    // 渲染所有Mermaid图表
    const diagrams = previewElement.querySelectorAll('.mermaid-diagram');
    diagrams.forEach(diagram => {
      this.renderDiagram(diagram);
    });
  }

  async renderDiagram(diagramElement) {
    try {
      const diagramCode = diagramElement.textContent;
      const { svg } = await window.mermaid.render(`mermaid-${Date.now()}`, diagramCode);
      diagramElement.innerHTML = svg;
      
      // 添加样式
      diagramElement.style.display = 'block';
      diagramElement.style.overflow = 'auto';
      diagramElement.style.margin = '1em 0';
    } catch (error) {
      diagramElement.innerHTML = `
        <div style="padding: 1em; background: #f8d7da; color: #721c24; border-radius: 4px;">
          <strong>图表渲染错误:</strong> ${error.message}
          <pre style="margin-top: 0.5em; font-size: 0.8em;">${diagramElement.textContent}</pre>
        </div>
      `;
      console.error('Mermaid rendering error:', error);
    }
  }
}

// 图表插入工具栏按钮
export class DiagramToolbarPlugin extends ToolbarButtonPlugin {
  constructor() {
    super();
    this.name = 'diagram-toolbar-plugin';
    this.version = '1.0.0';
    this.description = '图表插入工具栏按钮';
    
    this.buttonConfig = {
      icon: 'DataAnalysis',
      tooltip: '插入图表',
      position: 'right',
      onClick: this.insertDiagramTemplate.bind(this)
    };
  }

  insertDiagramTemplate() {
    const diagramTemplates = {
      flowchart: `\`\`\`mermaid
graph TD
    A[开始] --> B{判断};
    B -->|是| C[执行操作];
    B -->|否| D[结束];
    C --> D;
\`\`\``,
      sequence: `\`\`\`mermaid
sequenceDiagram
    participant A as 用户
    participant B as 系统
    
    A->>B: 请求数据
    B->>B: 处理请求
    B-->>A: 返回结果
\`\`\``,
      class: `\`\`\`mermaid
classDiagram
    class Animal {
        +String name
        +void speak()
    }
    class Dog {
        +void bark()
    }
    Animal <|-- Dog
\`\`\``
    };

    // 显示模板选择对话框
    this.pluginManager.triggerHook('editor:showDialog', {
      title: '选择图表类型',
      content: `
        <div style="display: flex; flex-direction: column; gap: 10px;">
          <button class="diagram-btn" data-type="flowchart">流程图</button>
          <button class="diagram-btn" data-type="sequence">序列图</button>
          <button class="diagram-btn" data-type="class">类图</button>
        </div>
      `,
      onMounted: (dialogElement) => {
        dialogElement.querySelectorAll('.diagram-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const type = btn.dataset.type;
            this.insertContent(diagramTemplates[type]);
            this.pluginManager.triggerHook('editor:hideDialog');
          });
        });
      }
    });
  }

  insertContent(content) {
    if (this.editorInstance && this.editorInstance.insertText) {
      this.editorInstance.insertText(content);
    }
  }
}