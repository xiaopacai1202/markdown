<template>
  <div id="app" :class="currentTheme">
    <header class="app-header">
      <div class="mobile-menu-toggle" @click="toggleMobileMenu" v-if="isMobile">
        <el-icon><Menu /></el-icon>
      </div>
      
      <h1><i class="icon-document"></i> QuickMD</h1>
      
      <div class="header-actions">
        <!-- 侧边栏切换按钮 (桌面和平板) -->
        <el-tooltip :content="sidebarVisible ? '隐藏侧边栏' : '显示侧边栏'" v-if="!isMobile">
          <el-button 
            @click="toggleSidebar" 
            :icon="sidebarVisible ? Fold : Expand" 
            circle 
            class="sidebar-toggle"
          />
        </el-tooltip>
        
        <!-- 添加插件管理按钮 -->
        <el-tooltip content="插件管理">
          <el-button 
            @click="showPluginManager" 
            icon="Management" 
            circle 
            class="plugin-manage-toggle"
          />
        </el-tooltip>
        
        <!-- 主题切换按钮 -->
        <el-tooltip :content="currentTheme === 'light-theme' ? '切换到暗色主题' : '切换到亮色主题'">
          <el-button 
            @click="toggleTheme" 
            :icon="currentTheme === 'light-theme' ? Moon : Sunny" 
            circle 
            class="theme-toggle"
          />
        </el-tooltip>
        
        <!-- 桌面端工具栏 -->
        <el-button-group class="toolbar desktop-toolbar" v-if="!isMobile">
          <el-button type="primary" @click="saveDocument" :icon="Document" :loading="saving" :class="{ 'manual-save': true }">{{ saving ? '保存中...' : '保存' }}</el-button>
          <el-button @click="createNewDocument" :icon="Plus">新建</el-button>
          
          <!-- 导出下拉菜单 -->
          <el-dropdown @command="handleExportCommand" trigger="click">
            <el-button type="success" :icon="Download">
              导出<el-icon class="el-icon--right"><arrow-down /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="html">导出为 HTML</el-dropdown-item>
                <el-dropdown-item command="pdf">导出为 PDF（截图）</el-dropdown-item>
                <el-dropdown-item command="pdf-text">导出为 PDF（纯文本）</el-dropdown-item>
                <el-dropdown-item command="markdown">导出为 Markdown</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          
          <el-button type="danger" @click="deleteCurrentDocument" :icon="Delete" v-if="currentDocument.id">删除</el-button>
        </el-button-group>
        
        <!-- 移动端工具栏下拉菜单 -->
        <el-dropdown v-if="isMobile" class="mobile-toolbar-dropdown" trigger="click">
          <el-button icon="More" circle class="mobile-more-button" />
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="saveDocument">
                <el-icon><Document /></el-icon>保存
              </el-dropdown-item>
              <el-dropdown-item @click="createNewDocument">
                <el-icon><Plus /></el-icon>新建
              </el-dropdown-item>
              <el-dropdown-item divided>导出选项</el-dropdown-item>
              <el-dropdown-item @click="handleExportCommand('html')">
                <el-icon><Download /></el-icon>导出为 HTML
              </el-dropdown-item>
              <el-dropdown-item @click="handleExportCommand('pdf')">
                <el-icon><Download /></el-icon>导出为 PDF（截图）
              </el-dropdown-item>
              <el-dropdown-item @click="handleExportCommand('pdf-text')">
                <el-icon><Download /></el-icon>导出为 PDF（纯文本）
              </el-dropdown-item>
              <el-dropdown-item @click="handleExportCommand('markdown')">
                <el-icon><Download /></el-icon>导出为 Markdown
              </el-dropdown-item>
              <el-dropdown-item divided v-if="currentDocument.id">
                <el-dropdown-item @click="deleteCurrentDocument" style="color: var(--el-color-danger)">
                  <el-icon><Delete /></el-icon>删除文档
                </el-dropdown-item>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </header>

    <main class="main-layout">
      <!-- 侧边栏 - 文档列表 -->
      <aside class="sidebar" :class="{ 
        'sidebar-hidden': !sidebarVisible, 
        'mobile-sidebar': isMobile,
        'mobile-sidebar-visible': mobileMenuVisible && isMobile
      }">
        <div class="sidebar-header">
          <h3>我的文档</h3>
          <div class="sidebar-actions">
            <el-button size="small" @click="loadDocuments" :icon="Refresh" circle />
            <el-button size="small" @click="isMobile ? toggleMobileMenu() : toggleSidebar()" :icon="Close" circle class="close-sidebar" />
          </div>
        </div>
        <el-divider />
        <div class="document-list">
          <div 
            v-for="doc in documents" 
            :key="doc.id" 
            class="document-item" 
            :class="{ active: currentDocument.id === doc.id }"
            @click="loadDocument(doc.id)"
          >
            <div class="document-title">{{ doc.title || '无标题文档' }}</div>
            <div class="document-time">{{ formatDate(doc.updatedAt) }}</div>
          </div>
          <div v-if="documents.length === 0" class="empty-tip">
            暂无文档，点击"新建"开始创作
          </div>
        </div>
      </aside>

      <!-- 主编辑区 -->
      <section class="editor-container" :class="{ 
        'editor-full-width': !sidebarVisible || (isMobile && !mobileMenuVisible),
        'mobile-editor': isMobile
      }">
        <div class="document-header">
          <el-input 
            v-model="currentDocument.title" 
            placeholder="输入文档标题..." 
            class="title-input"
            @input="debouncedSave"
          />
          <div class="document-meta">
            最后更新: {{ currentDocument.updatedAt ? formatDate(currentDocument.updatedAt) : '--' }}
            <span v-if="isAutoSaving" class="auto-saving-indicator">⏳ 保存中...</span>
    <span v-else-if="lastSaveTime" class="auto-saved-indicator">✅ 已自动保存</span>
          </div>
        </div>

        <div class="editor-content" :class="{ 'mobile-view': isMobile && mobileView === 'edit' }">
          <!-- 编辑区 -->
          <div class="editor-pane" :class="{ 'hidden-on-mobile': isMobile && mobileView !== 'edit' }">
            <textarea
              v-model="currentDocument.content"
              placeholder="开始编写你的 Markdown..."
              class="markdown-editor"
              @input="debouncedSave"
            ></textarea>
          </div>

          
          
          <!-- 预览区 -->
          <div class="preview-pane" ref="previewElement" :class="{ 'hidden-on-mobile': isMobile && mobileView !== 'preview' }">
            <div class="html-preview" v-html="compiledMarkdown"></div>
          </div>
        </div>

        <!-- 移动端视图切换按钮 -->
<div class="mobile-view-toggle" v-if="isMobile">
  <el-button-group>
    <el-button 
      :class="{ 'is-active': mobileView === 'edit' }"
      @click="mobileView = 'edit'"
      size="small"
    >
      编辑
    </el-button>
    <el-button 
      :class="{ 'is-active': mobileView === 'preview' }"
      @click="mobileView = 'preview'"
      size="small"
    >
      预览
    </el-button>
  </el-button-group>
</div>
      </section>
    </main>

    <!-- 加载状态 - 修复后的版本 -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-content">
        <el-icon class="is-loading" :size="30"><Loading /></el-icon>
        <p>加载中...</p>
      </div>
    </div>
    
    <!-- PDF 导出加载状态 -->
    <el-dialog
      v-model="pdfExporting"
      title="正在导出 PDF"
      width="30%"
      :show-close="false"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <div class="export-progress">
        <el-progress :percentage="exportProgress" :status="exportStatus" />
        <p class="export-message">{{ exportMessage }}</p>
      </div>
    </el-dialog>

    <!-- 移动端侧边栏遮罩 -->
    <div 
      class="mobile-sidebar-overlay" 
      v-if="isMobile && mobileMenuVisible" 
      @click="toggleMobileMenu"
    ></div>
    <!-- 统一字数统计显示（只要字数统计插件启用就显示） -->
<div v-if="showWordCount" class="word-count-display">
  <span>📝 {{ wordCount }}</span>
  <span>🔤 {{ characterCount }}</span>
  <span>📋 {{ lineCount }}</span>
</div>
    <!-- 插件管理对话框 -->
    <PluginManager ref="pluginManagerRef" @plugin-toggle="handlePluginToggle"/>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted, nextTick, onUnmounted, watch, markRaw } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Delete, Download, Document, Plus, Refresh, Sunny, Moon, ArrowDown, Close, Menu, Fold, Expand ,Loading} from '@element-plus/icons-vue';
import { parseMarkdown, highlightCodeBlocks, setHighlightTheme } from './utils/markdownParser.js';
import { documentApi } from './api/markdownApi.js';
import { debounce } from 'lodash-es';
import { exportToPDF, exportMarkdownAsPDF } from './utils/pdfExporter.js';
import PluginManager from './components/PluginManager.vue';
import pluginManager from '/src/plugins/PluginManager.js';
import WordCountPlugin from './plugins/WordCountPlugin';
import DiagramPlugin from './plugins/DiagramPlugin.js'
import {DiagramToolbarPlugin} from './plugins/DiagramPlugin.js';

const pluginManagerRef = ref(null);
const previewElement = ref(null);
const currentTheme = ref('light-theme');
const sidebarVisible = ref(true);
const isMobile = ref(false);
const mobileMenuVisible = ref(false);
const mobileView = ref('edit');
const documents = ref([]);
const currentDocument = reactive({
  id: null,
  title: '',
  content: '',
  updatedAt: null
});
const loading = ref(false);
const saving = ref(false);
const pdfExporting = ref(false);
const exportProgress = ref(0);
const exportStatus = ref('');
const exportMessage = ref('准备导出...');

// 显示插件管理器的方法
const showPluginManager = () => {
  if (pluginManagerRef.value) {
    pluginManagerRef.value.show();
  }
};

// 处理插件状态变化
const handlePluginToggle = (pluginInfo) => {
  console.log('插件状态变化:', pluginInfo);
  pluginStates[pluginInfo.name] = pluginInfo.enabled;
  // 重新初始化插件
  initializePlugins();
  
  // 如果是字数统计插件，显示提示信息
  if (pluginInfo.name === 'word-count-plugin') {
    if (pluginInfo.enabled) {
      ElMessage.success('字数统计功能已启用');
    } else {
      ElMessage.info('字数统计功能已禁用');
    }
  }
};

// 计算属性
const compiledMarkdown = computed(() => {
  return parseMarkdown(currentDocument.content);
});

// 计算字数
const wordCount = computed(() => {
  const content = currentDocument.content.trim();
  return content ? content.split(/\s+/).filter(word => word.length > 0).length : 0;
});

const characterCount = computed(() => {
  return currentDocument.content.length;
});

const lineCount = computed(() => {
  return currentDocument.content.split('\n').length;
});
// 检测设备类型
const checkIsMobile = () => {
  isMobile.value = window.innerWidth <= 768;
  if (isMobile.value) {
    sidebarVisible.value = false;
    mobileMenuVisible.value = false;
  }
};

// 从后端加载文档列表
onMounted(() => {
  checkIsMobile();
  window.addEventListener('resize', checkIsMobile);
  
  // 设置初始高亮主题
  const savedTheme = localStorage.getItem('quickmd-theme');
  if (savedTheme) {
    currentTheme.value = savedTheme;
  }
  setHighlightTheme(currentTheme.value);
  
  loadDocuments();
  const savedSidebarState = localStorage.getItem('quickmd-sidebar');
  
  if (savedSidebarState !== null) {
    sidebarVisible.value = savedSidebarState === 'true';
  }
});
// 响应式插件状态
const pluginStates = reactive({
  'word-count-plugin': false,
  'diagram-plugin': false,
  'diagram-toolbar-plugin': false
});
// 添加初始化插件状态的方法
const initializePluginStates = () => {
  const pluginConfig = loadPluginConfig();
  Object.keys(pluginStates).forEach(pluginName => {
    pluginStates[pluginName] = pluginConfig[pluginName] || false;
  });
};
onUnmounted(() => {
  window.removeEventListener('resize', checkIsMobile);
  checkIsMobile();
  window.addEventListener('resize', checkIsMobile);
  
  // 设置初始高亮主题
  const savedTheme = localStorage.getItem('quickmd-theme');
  if (savedTheme) {
    currentTheme.value = savedTheme;
  }
  setHighlightTheme(currentTheme.value);
  
  // 初始化插件状态
  initializePluginStates();
  
  loadDocuments();
  const savedSidebarState = localStorage.getItem('quickmd-sidebar');
  
  if (savedSidebarState !== null) {
    sidebarVisible.value = savedSidebarState === 'true';
  }
});
// 是否显示字数统计（只要字数统计插件启用就显示）
const showWordCount = computed(() => {
  return pluginStates['word-count-plugin'] === true;
});

// 加载所有文档
const loadDocuments = async () => {
  try {
    loading.value = true;
    const response = await documentApi.getAll();
    documents.value = response.data;
    
    if (!currentDocument.id && documents.value.length > 0) {
      await loadDocument(documents.value[0].id);
    } else if (documents.value.length === 0) {
      createNewDocument();
    }
  } catch (error) {
    console.error('Error loading documents:', error);
    ElMessage.error('加载文档列表失败，请确保 JSON Server 已启动');
  } finally {
    loading.value = false;
  }
};

// 加载单个文档
const loadDocument = async (id) => {
  try {
    loading.value = true;
    const response = await documentApi.getById(id);
    Object.assign(currentDocument, response.data);
    
    if (isMobile.value) {
      mobileMenuVisible.value = false;
    }
  } catch (error) {
    console.error('Error loading document:', error);
    ElMessage.error('加载文档失败');
  } finally {
    loading.value = false;
  }
};

// 创建新文档
const createNewDocument = () => {
  Object.assign(currentDocument, {
    id: null,
    title: `新文档-${new Date().getTime()}`,
    content: '# 新文档\n\n开始编写你的内容...',
    updatedAt: new Date().toISOString()
  });
};

// 自动保存函数（不显示提示）
const autoSaveDocument = async () => {
  if (!currentDocument.content.trim() || saving.value) {
    return;
  }

  try {
    saving.value = true;
    
    if (currentDocument.id) {
      // 更新现有文档（静默保存）
      await documentApi.update(currentDocument.id, {
        title: currentDocument.title,
        content: currentDocument.content
      });
      // 不显示提示
    } else {
      // 创建新文档（静默保存）
      const response = await documentApi.create({
        title: currentDocument.title,
        content: currentDocument.content
      });
      currentDocument.id = response.data.id;
      // 不显示提示
    }
    
    // 静默更新文档列表
    loadDocuments().catch(() => {
      // 静默失败，不显示错误
    });
    
  } catch (error) {
    console.error('自动保存失败:', error);
    // 静默失败，不显示错误提示
  } finally {
    saving.value = false;
  }
};
// 自动保存相关变量
const autoSaveInterval = ref(null);
const lastSaveTime = ref(null);
const isAutoSaving = ref(false);

// 启动自动保存
const startAutoSave = () => {
  // 清除现有的定时器
  stopAutoSave();
  
  // 每30秒自动保存一次
  autoSaveInterval.value = setInterval(() => {
    if (currentDocument.content.trim()) {
      isAutoSaving.value = true;
      autoSaveDocument().finally(() => {
        isAutoSaving.value = false;
        lastSaveTime.value = new Date();
      });
    }
  }, 30000); // 30秒
};

// 停止自动保存
const stopAutoSave = () => {
  if (autoSaveInterval.value) {
    clearInterval(autoSaveInterval.value);
    autoSaveInterval.value = null;
  }
};

// 内容变化时触发自动保存防抖
const debouncedAutoSave = debounce(() => {
  if (currentDocument.content.trim()) {
    isAutoSaving.value = true;
    autoSaveDocument().finally(() => {
      isAutoSaving.value = false;
      lastSaveTime.value = new Date();
    });
  }
}, 5000); // 内容停止变化5秒后自动保存

// 内容变化时触发钩子和自动保存
watch(() => currentDocument.content, (newContent) => {
  editorAPI.content = newContent;
  wrappedPluginManager.triggerHook('editor:contentChanged', newContent);
  
  // 触发防抖的自动保存
  debouncedAutoSave();
});

// 在 mounted 中启动自动保存
onMounted(() => {
  checkIsMobile();
  window.addEventListener('resize', checkIsMobile);
  
  // 设置初始高亮主题
  const savedTheme = localStorage.getItem('quickmd-theme');
  if (savedTheme) {
    currentTheme.value = savedTheme;
  }
  setHighlightTheme(currentTheme.value);
  
  // 初始化插件状态
  initializePluginStates();
  
  loadDocuments();
  const savedSidebarState = localStorage.getItem('quickmd-sidebar');
  
  if (savedSidebarState !== null) {
    sidebarVisible.value = savedSidebarState === 'true';
  }
  
  // 启动自动保存
  startAutoSave();
});

// 在卸载时停止自动保存
onUnmounted(() => {
  window.removeEventListener('resize', checkIsMobile);
  stopAutoSave();
  
  // 清理所有插件
  wrappedPluginManager.getPlugins().forEach(plugin => {
    wrappedPluginManager.unregister(plugin.name);
  });
});
// 手动保存函数（显示提示）
const saveDocument = async () => {
  if (!currentDocument.content.trim()) {
    ElMessage.warning('文档内容不能为空');
    return;
  }

  try {
    saving.value = true;
    
    if (currentDocument.id) {
      // 更新现有文档
      await documentApi.update(currentDocument.id, {
        title: currentDocument.title,
        content: currentDocument.content
      });
      ElMessage.success('文档已更新');
    } else {
      // 创建新文档
      const response = await documentApi.create({
        title: currentDocument.title,
        content: currentDocument.content
      });
      currentDocument.id = response.data.id;
      ElMessage.success('文档已创建');
    }
    
    // 显示加载文档列表
    await loadDocuments();
    
  } catch (error) {
    console.error('保存失败:', error);
    ElMessage.error('保存失败，请确保 JSON Server 已启动');
  } finally {
    saving.value = false;
  }
};

const debouncedSave = debounce(saveDocument, 1000);

// 删除文档
const deleteCurrentDocument = async () => {
  if (!currentDocument.id) return;

  try {
    await ElMessageBox.confirm('确定要删除这个文档吗？此操作不可恢复。', '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    });

    await documentApi.delete(currentDocument.id);
    ElMessage.success('文档已删除');
    
    createNewDocument();
    await loadDocuments();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Error deleting document:', error);
      ElMessage.error('删除失败');
    }
  }
};

// 切换侧边栏显示状态
const toggleSidebar = () => {
  sidebarVisible.value = !sidebarVisible.value;
  localStorage.setItem('quickmd-sidebar', sidebarVisible.value);
};

// 切换移动端菜单
const toggleMobileMenu = () => {
  mobileMenuVisible.value = !mobileMenuVisible.value;
};

// 切换主题
const toggleTheme = () => {
  currentTheme.value = currentTheme.value === 'light-theme' ? 'dark-theme' : 'light-theme';
  localStorage.setItem('quickmd-theme', currentTheme.value);
  ElMessage.success(`已切换到${currentTheme.value === 'light-theme' ? '亮色' : '暗色'}主题`);
  
  // 切换高亮主题
  setHighlightTheme(currentTheme.value);
  
  // 重新高亮代码
  nextTick(() => {
    highlightCodeBlocks(previewElement.value);
  });
};

// 处理导出命令
const handleExportCommand = async (command) => {
  switch (command) {
    case 'html':
      downloadHTML();
      break;
    case 'pdf':
      await exportAsPDF();
      break;
    case 'pdf-text':
      exportAsTextPDF();
      break;
    case 'markdown':
      exportAsMarkdown();
      break;
  }
};

// 导出为 PDF（截图方式）
const exportAsPDF = async () => {
  if (!previewElement.value) {
    ElMessage.warning('没有内容可导出');
    return;
  }

  pdfExporting.value = true;
  exportProgress.value = 10;
  exportMessage.value = '正在准备导出...';

  try {
    await nextTick();
    
    exportProgress.value = 30;
    exportMessage.value = '正在生成 PDF...';

    const filename = `${currentDocument.title || 'document'}.pdf`;
    
    const now = new Date();
    const formattedDate = now.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    await exportToPDF(previewElement.value, filename, {
      title: currentDocument.title || 'QuickMD 文档',
      date: formattedDate,
      backgroundColor: currentTheme.value === 'dark-theme' ? '#1a1a1a' : '#ffffff',
      onStart: () => {
        exportProgress.value = 50;
        exportMessage.value = '正在处理内容...';
      },
      onSuccess: () => {
        exportProgress.value = 100;
        exportStatus.value = 'success';
        exportMessage.value = '导出成功！';
        setTimeout(() => {
          pdfExporting.value = false;
          ElMessage.success('PDF 导出成功');
        }, 1000);
      },
      onError: (error) => {
        exportStatus.value = 'exception';
        exportMessage.value = '导出失败';
        console.error('PDF export failed:', error);
        ElMessage.error('PDF 导出失败');
        setTimeout(() => {
          pdfExporting.value = false;
        }, 2000);
      }
    });

  } catch (error) {
    console.error('PDF export error:', error);
    pdfExporting.value = false;
    ElMessage.error('导出过程中发生错误');
  }
};

// 导出为 PDF（纯文本方式）
const exportAsTextPDF = () => {
  if (!currentDocument.content) {
    ElMessage.warning('没有内容可导出');
    return;
  }

  const filename = `${currentDocument.title || 'document'}.pdf`;
  exportMarkdownAsPDF(
    currentDocument.content,
    currentDocument.title || 'QuickMD 文档',
    filename
  );
  ElMessage.success('纯文本 PDF 导出成功');
};

// 导出为 Markdown 文件
const exportAsMarkdown = () => {
  if (!currentDocument.content) {
    ElMessage.warning('没有内容可导出');
    return;
  }

  const blob = new Blob([currentDocument.content], { type: 'text/markdown' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${currentDocument.title || 'document'}.md`;
  link.click();
  URL.revokeObjectURL(link.href);
  ElMessage.success('Markdown 导出成功');
};

// 导出 HTML 文件
const downloadHTML = () => {
  if (!compiledMarkdown.value) {
    ElMessage.warning('没有内容可导出');
    return;
  }
  const blob = new Blob([compiledMarkdown.value], { type: 'text/html' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${currentDocument.title || 'document'}.html`;
  link.click();
  URL.revokeObjectURL(link.href);
  ElMessage.success('HTML 导出成功');
};

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '--';
  return new Date(dateString).toLocaleString('zh-CN');
};

// 使用 markRaw 包装插件管理器
const wrappedPluginManager = markRaw(pluginManager);

// 提供编辑器API给插件使用
const editorAPI = reactive({
  content: '',
  insertText(text) {
    const textarea = document.querySelector('.markdown-editor');
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = currentDocument.content.substring(0, start);
    const after = currentDocument.content.substring(end);
    
    currentDocument.content = before + text + after;
    
    nextTick(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + text.length,
        start + text.length
      );
    });
  },
  showDialog(options) {
    dialogOptions.value = options;
    showDialog.value = true;
  },
  hideDialog() {
    showDialog.value = false;
  }
});

// 对话框状态
const showDialog = ref(false);
const dialogOptions = ref({});

// 从localStorage加载插件配置
const loadPluginConfig = () => {
  const config = localStorage.getItem('plugin-config');
  if (config) {
    try {
      return JSON.parse(config);
    } catch (error) {
      console.error('解析插件配置失败:', error);
      // 返回默认配置
      return {
        'word-count-plugin': true, // 默认启用
        'diagram-plugin': true,
        'diagram-toolbar-plugin': true
      };
    }
  }
  // 默认配置 - 所有插件都启用
  return {
    'word-count-plugin': true,
    'diagram-plugin': true,
    'diagram-toolbar-plugin': true
  };
};

// 初始化插件系统
const initializePlugins = () => {
  // 清除所有已注册的插件
  const registeredPlugins = wrappedPluginManager.getPlugins();
  if (registeredPlugins.length > 0) {
    registeredPlugins.forEach(plugin => {
      wrappedPluginManager.unregister(plugin.name);
    });
  }

  // 设置编辑器实例
  wrappedPluginManager.setEditorInstance(editorAPI);
  
  // 注册核心钩子
  wrappedPluginManager.registerHook('editor:showDialog', editorAPI.showDialog);
  wrappedPluginManager.registerHook('editor:hideDialog', editorAPI.hideDialog);
  
  // 加载当前插件配置
  const pluginConfig = loadPluginConfig();
  
  // 更新插件状态
  Object.keys(pluginStates).forEach(pluginName => {
    pluginStates[pluginName] = pluginConfig[pluginName] ?? false;
  });
  
  console.log('注册插件，当前配置:', pluginConfig);
  
  // 注册插件函数
  const registerPlugin = (pluginName, PluginClass) => {
    if (pluginConfig[pluginName]) {
      try {
        const plugin = new PluginClass();
        const success = wrappedPluginManager.register(plugin);
        if (success) {
          console.log(`✅ ${pluginName} 注册成功`);
        }
        return success;
      } catch (error) {
        console.error(`❌ ${pluginName} 注册失败:`, error);
        return false;
      }
    } else {
      console.log(`⏸️ ${pluginName} 已禁用，跳过注册`);
      return false;
    }
  };
  
  // 注册所有插件
  registerPlugin('word-count-plugin', WordCountPlugin);
  registerPlugin('diagram-plugin', DiagramPlugin);
  registerPlugin('diagram-toolbar-plugin', DiagramToolbarPlugin);
};

// 内容变化时更新统计
watch(() => currentDocument.content, (newContent) => {
  editorAPI.content = newContent;
  wrappedPluginManager.triggerHook('editor:contentChanged', newContent);
  
  // 手动触发统计更新（如果插件已启用）
  if (pluginStates['word-count-plugin']) {
    // 这里可以添加额外的统计更新逻辑
  }
});

// 预览更新时触发钩子
const updatePreview = async () => {
  if (!previewElement.value) return;
  
  try {
    // 解析 Markdown
    let html = parseMarkdown(currentDocument.content);
    
    // 调用预览前钩子
    const beforeRenderResult = wrappedPluginManager.triggerHook('preview:beforeRender', html);
    html = beforeRenderResult !== undefined ? beforeRenderResult : html;
    
    // 更新预览内容
    previewElement.value.innerHTML = html;
    
    // 等待 DOM 更新
    await nextTick();
    
    // 手动高亮代码块
    highlightCodeBlocks(previewElement.value);
    
    // 调用预览后钩子
    wrappedPluginManager.triggerHook('preview:afterRender', previewElement.value);
    
  } catch (error) {
    console.error('Preview update error:', error);
    previewElement.value.innerHTML = `<div class="error">预览渲染错误: ${error.message}</div>`;
  }
};

// 在 mounted 钩子中初始化插件
onMounted(() => {
  initializePlugins();
  
  // 监听内容变化，更新预览
  watch(() => currentDocument.content, () => {
    updatePreview();
  }, { immediate: true });
  
  // 监听主题变化，重新高亮代码
  watch(currentTheme, () => {
    setTimeout(() => {
      highlightCodeBlocks(previewElement.value);
    }, 100);
  });
});

onUnmounted(() => {
  // 清理所有插件
  wrappedPluginManager.getPlugins().forEach(plugin => {
    wrappedPluginManager.unregister(plugin.name);
  });
});
</script>

<style>
/* 定义亮色主题变量 */
:root, .light-theme {
  --bg-color: #ffffff;
  --text-color: #2c3e50;
  --border-color: #eaecef;
  --header-bg: #2c3e50;
  --header-text: #ecf0f1;
  --editor-bg: #f6f8fa;
  --editor-text: #2c3e50;
  --pre-bg: #f6f8fa;
  --code-bg: rgba(175, 184, 193, 0.2);
  --blockquote-border: #dfe2e5;
  --blockquote-text: #6a737d;
  --table-border: #dfe2e5;
  --table-header-bg: #f6f8fa;
  --sidebar-bg: #f8f9fa;
  --card-bg: #ffffff;
  --card-hover: #f5f7fa;
  --card-active: #e3f2fd;
}

/* 定义暗色主题变量 */
.dark-theme {
  --bg-color: #1a1a1a;
  --text-color: #e0e0e0;
  --border-color: #404040;
  --header-bg: #1f2937;
  --header-text: #f3f4f6;
  --editor-bg: #2d3748;
  --editor-text: #e2e8f0;
  --pre-bg: #2d3748;
  --code-bg: rgba(75, 85, 99, 0.4);
  --blockquote-border: #4a5568;
  --blockquote-text: #a0aec0;
  --table-border: #4a5568;
  --table-header-bg: #2d3748;
  --sidebar-bg: #2d2d2d;
  --card-bg: #2d2d2d;
  --card-hover: #3d3d3d;
  --card-active: #374151;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  transition: all 0.3s ease;
}

body,
#app {
  height: 100vh;
  overflow: hidden;
  background-color: var(--bg-color);
  color: var(--text-color);
}

#app {
  display: flex;
  flex-direction: column;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell,
    sans-serif;
  position: relative;
}

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background-color: var(--header-bg);
  color: var(--header-text);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
  position: relative;
  z-index: 100;
}

.app-header h1 {
  font-size: 1.5rem;
  font-weight: 500;
}

.mobile-menu-toggle {
  display: none;
  font-size: 1.5rem;
  cursor: pointer;
  margin-right: 1rem;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}
/* 移动端工具栏下拉菜单 */
.mobile-toolbar-dropdown {
  margin-left: 8px;
}

.mobile-more-button {
  width: 32px;
  height: 32px;
}

/* 移动端下拉菜单样式 */
:deep(.mobile-toolbar-dropdown .el-dropdown-menu) {
  max-width: 200px;
}

:deep(.mobile-toolbar-dropdown .el-dropdown-menu__item) {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  font-size: 14px;
}

:deep(.mobile-toolbar-dropdown .el-icon) {
  font-size: 16px;
  width: 16px;
  height: 16px;
}

/* 移动端头部优化 */
@media (max-width: 768px) {
  .app-header {
    padding: 0.5rem;
    height: 50px;
  }
  
  .app-header h1 {
    font-size: 1.1rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 120px;
  }
  
  .mobile-menu-toggle {
    display: block;
    margin-right: 8px;
  }
  
  .desktop-toolbar {
    display: none !important;
  }
  
  .header-actions {
    gap: 4px;
  }
  
  .header-actions .el-button {
    width: 32px;
    height: 32px;
    min-width: 32px;
  }
  
  .plugin-manage-toggle,
  .theme-toggle {
    display: flex !important;
  }
}

/* 超小屏幕优化 */
@media (max-width: 360px) {
  .app-header h1 {
    max-width: 100px;
    font-size: 1rem;
  }
  
  .header-actions {
    gap: 2px;
  }
  
  .header-actions .el-button {
    width: 30px;
    height: 30px;
    min-width: 30px;
  }
}

/* 确保插件对话框在移动端显示正常 */
:deep(.mobile-dialog .el-dialog) {
  width: 95% !important;
  max-width: 100%;
  margin: 20px auto !important;
  max-height: 80vh;
}

:deep(.mobile-dialog .el-dialog__body) {
  max-height: 60vh;
  overflow-y: auto;
  padding: 16px;
}

:deep(.mobile-dialog .el-dialog__header) {
  padding: 16px 16px 0;
}

:deep(.mobile-dialog .el-dialog__footer) {
  padding: 0 16px 16px;
}

/* 移动端插件列表优化 */
@media (max-width: 768px) {
  .plugin-item {
    flex-direction: column;
    gap: 12px;
    padding: 12px;
  }
  
  .plugin-info {
    margin-right: 0;
  }
  
  .plugin-actions {
    align-self: flex-end;
  }
  
  .plugin-header {
    flex-wrap: wrap;
  }
  
  .plugin-name {
    font-size: 14px;
  }
  
  .plugin-description {
    font-size: 12px;
  }
  
  .plugin-version {
    font-size: 11px;
  }
}
.sidebar-toggle,
.theme-toggle {
  background-color: rgba(255, 255, 255, 0.1);
  border: none;
  color: var(--header-text);
}

.sidebar-toggle:hover,
.theme-toggle:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.dark-theme .sidebar-toggle,
.dark-theme .theme-toggle {
  background-color: rgba(0, 0, 0, 0.2);
}

.dark-theme .sidebar-toggle:hover,
.dark-theme .theme-toggle:hover {
  background-color: rgba(0, 0, 0, 0.3);
}

/* 主布局 */
.main-layout {
  display: flex;
  flex: 1;
  overflow: hidden;
  position: relative;
}

.sidebar {
  width: 280px;
  background-color: var(--sidebar-bg);
  border-right: 1px solid var(--border-color);
  overflow-y: auto;
  padding: 1rem;
  transition: transform 0.3s ease;
}

.sidebar-hidden {
  transform: translateX(-100%);
  position: absolute;
  height: 100%;
  z-index: 90;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.15);
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.sidebar-header h3 {
  margin: 0;
  color: var(--text-color);
}

.sidebar-actions {
  display: flex;
  gap: 5px;
}

.close-sidebar {
  display: none;
}

.sidebar-hidden .close-sidebar {
  display: block;
}

.document-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.document-item {
  padding: 0.75rem;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s;
  border: 1px solid var(--border-color);
  background-color: var(--card-bg);
}

.document-item:hover {
  background-color: var(--card-hover);
}

.document-item.active {
  background-color: var(--card-active);
  border-color: #409eff;
}

.document-title {
  font-weight: 500;
  margin-bottom: 0.25rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.document-time {
  font-size: 0.75rem;
  color: var(--blockquote-text);
}

.empty-tip {
  text-align: center;
  color: var(--blockquote-text);
  padding: 2rem;
  font-style: italic;
}

.editor-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: margin-left 0.3s ease;
}

.editor-full-width {
  margin-left: 0;
}

.document-header {
  padding: 1rem;
  border-bottom: 1px solid var(--border-color);
  background-color: var(--card-bg);
}

.title-input {
  font-size: 1.5rem;
  font-weight: 600;
  border: none;
  outline: none;
  margin-bottom: 0.5rem;
  background-color: transparent;
  color: var(--text-color);
  width: 100%;
}

.title-input :deep(.el-input__wrapper) {
  box-shadow: none !important;
  padding: 0;
  background-color: transparent;
}

.document-meta {
  font-size: 0.875rem;
  color: var(--blockquote-text);
}

.editor-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.editor-pane,
.preview-pane {
  flex: 1;
  overflow: auto;
}

.editor-pane {
  border-right: 1px solid var(--border-color);
  background-color: var(--editor-bg);
}

.markdown-editor {
  width: 100%;
  height: 100%;
  border: none;
  outline: none;
  resize: none;
  padding: 1rem;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 14px;
  line-height: 1.6;
  background-color: transparent;
  color: var(--editor-text);
}

.html-preview {
  padding: 1rem;
  line-height: 1.6;
}

/* 保证预览区的样式 */
.html-preview h1,
.html-preview h2,
.html-preview h3,
.html-preview h4,
.html-preview h5,
.html-preview h6 {
  margin-top: 1.5em;
  margin-bottom: 0.5em;
  font-weight: 600;
  line-height: 1.25;
}

.html-preview p {
  margin-bottom: 1em;
}

.html-preview pre {
  background-color: var(--pre-bg);
  border-radius: 6px;
  padding: 1em;
  overflow: auto;
  margin-bottom: 1em;
}

.html-preview code {
  background-color: var(--code-bg);
  border-radius: 3px;
  padding: 0.2em 0.4em;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.85em;
}

.html-preview pre code {
  background: none;
  padding: 0;
  border-radius: 0;
}

.html-preview blockquote {
  border-left: 4px solid var(--blockquote-border);
  color: var(--blockquote-text);
  margin: 0;
  padding-left: 1em;
}

.html-preview table {
  border-collapse: collapse;
  width: 100%;
  margin-bottom: 1em;
}

.html-preview th,
.html-preview td {
  border: 1px solid var(--table-border);
  padding: 0.5em;
}

.html-preview th {
  background-color: var(--table-header-bg);
}

/* 确保 Highlight.js 样式正确应用 */
.hljs {
  display: block;
  overflow-x: auto;
  padding: 1em;
  border-radius: 6px;
}

/* 暗色主题下的代码高亮样式调整 */
.dark-theme .hljs {
  background: #1f2937 !important;
}

/* 导出进度样式 */
.export-progress {
  text-align: center;
}

.export-message {
  margin-top: 1rem;
  color: var(--text-color);
  font-size: 0.9rem;
}

/* 移动端样式 */
@media (max-width: 768px) {
  .mobile-menu-toggle {
    display: block;
  }
  
  .sidebar-toggle {
    display: none !important;
  }
  
  .app-header {
    padding: 0.75rem 1rem;
  }
  
  .app-header h1 {
    font-size: 1.2rem;
  }
  
  .header-actions {
    gap: 5px;
  }
  
  .toolbar .el-button {
    padding: 8px 12px;
    font-size: 0.8rem;
  }
  
  .toolbar .el-button span {
    display: none;
  }
  
  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    height: 100%;
    width: 80%;
    max-width: 300px;
    z-index: 200;
    transform: translateX(-100%);
    box-shadow: 2px 0 10px rgba(0, 0, 0, 0.2);
  }
  
  .mobile-sidebar-visible {
    transform: translateX(0);
  }
  
  .mobile-sidebar-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 190;
  }
  
  .editor-container {
    margin-left: 0 !important;
  }
  
  .document-header {
    padding: 0.75rem;
  }
  
  .title-input {
    font-size: 1.2rem;
  }
  
  .editor-content {
    flex-direction: column;
  }
  
  .editor-pane,
  .preview-pane {
    flex: none;
    height: 100%;
  }
  
  .hidden-on-mobile {
    display: none;
  }
  
  .mobile-view-toggle {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 100;
    background-color: var(--card-bg);
    border-radius: 20px;
    padding: 5px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }
  
  .markdown-editor {
    font-size: 16px; /* 移动端增加字体大小 */
  }
  
  .html-preview {
    padding: 0.75rem;
    font-size: 16px; /* 移动端增加字体大小 */
  }
  
  /* 移动端优化表格显示 */
  .html-preview table {
    display: block;
    overflow-x: auto;
  }
}

/* 小屏幕手机 */
@media (max-width: 480px) {
  .app-header {
    padding: 0.5rem;
  }
  
  .app-header h1 {
    font-size: 1rem;
  }
  
  .theme-toggle,
  .sidebar-toggle {
    width: 40px;
    height: 40px;
  }
  
  .toolbar .el-button {
    padding: 6px 10px;
  }
  
  .sidebar {
    width: 85%;
  }
  
  .document-item {
    padding: 1rem;
  }
  
  .document-title {
    font-size: 1rem;
  }
  
  .document-time {
    font-size: 0.75rem;
  }
}

/* 自动保存状态指示器 */
.auto-saving-indicator {
  margin-left: 12px;
  font-size: 12px;
  color: var(--el-color-warning);
}

.auto-saved-indicator {
  margin-left: 12px;
  font-size: 12px;
  color: var(--el-color-success);
  opacity: 0.7;
}

.document-meta {
  display: flex;
  align-items: center;
  font-size: 0.875rem;
  color: var(--blockquote-text);
  margin-top: 0.5rem;
  gap: 12px;
}

/* Element Plus 组件主题适配 */
.dark-theme .el-button {
  --el-button-text-color: var(--text-color);
}

.dark-theme .el-button:not(.theme-toggle):not(.sidebar-toggle) {
  --el-button-bg-color: var(--editor-bg);
  --el-button-border-color: var(--border-color);
}

.dark-theme .el-button:not(.theme-toggle):not(.sidebar-toggle):hover {
  --el-button-hover-bg-color: var(--pre-bg);
  --el-button-hover-border-color: var(--border-color);
}

.dark-theme .el-button--primary {
  --el-button-bg-color: #409eff;
  --el-button-border-color: #409eff;
}

.dark-theme .el-button--success {
  --el-button-bg-color: #67c23a;
  --el-button-border-color: #67c23a;
}

.dark-theme .el-button--danger {
  --el-button-bg-color: #f56c6c;
  --el-button-border-color: #f56c6c;
}

.dark-theme .el-message {
  --el-message-bg-color: var(--editor-bg);
  --el-message-text-color: var(--text-color);
  --el-message-border-color: var(--border-color);
}

.dark-theme .el-dropdown-menu {
  --el-dropdown-menu-bg-color: var(--editor-bg);
  --el-dropdown-menu-text-color: var(--text-color);
  --el-dropdown-menu-border-color: var(--border-color);
}

.dark-theme .el-dropdown-menu__item {
  color: var(--text-color);
}

.dark-theme .el-dropdown-menu__item:hover {
  background-color: var(--card-hover);
}

.dark-theme .el-dialog {
  --el-dialog-bg-color: var(--editor-bg);
  --el-dialog-text-color: var(--text-color);
  --el-dialog-border-color: var(--border-color);
}

.dark-theme .el-progress-bar {
  --el-progress-bg-color: var(--border-color);
}
/* 加载覆盖层样式 */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.9);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  backdrop-filter: blur(2px);
}

.dark-theme .loading-overlay {
  background-color: rgba(0, 0, 0, 0.9);
}

.loading-content {
  text-align: center;
  color: #606266;
}

.dark-theme .loading-content {
  color: #e5e7eb;
}

.loading-content .el-icon {
  color: #409eff;
  margin-bottom: 16px;
  animation: rotate 1s linear infinite;
}

.loading-content p {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>