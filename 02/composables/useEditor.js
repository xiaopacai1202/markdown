import { ref, reactive, onMounted, onUnmounted, watch, nextTick,computed ,toRaw} from 'vue'
import { ElMessage,ElMessageBox } from 'element-plus'
import { debounce } from 'lodash-es'
import { documentApi } from '@/api/markdownApi.js'
import pluginManager from '@/plugins/PluginManager.js'
import { parseMarkdown, highlightCodeBlocks, setHighlightTheme } from '@/utils/markdownParser.js'
import { loadPluginConfig, } from '@/utils/pluginConfig.js'
import WordCountPlugin from '@/plugins/WordCountPlugin.js'
import DiagramPlugin from '@/plugins/DiagramPlugin.js'
import { DiagramToolbarPlugin } from '@/plugins/DiagramPlugin.js'
import { updateLocal } from '@/api/localApi'
export default function useEditor() {
  /* ---------- 1. 基础状态 ---------- */
  const currentTheme = ref(localStorage.getItem('quickmd-theme') || 'light-theme')
  const isMobile = ref(window.innerWidth <= 768)
  const sidebarVisible = ref(localStorage.getItem('quickmd-sidebar') !== 'false')
  const mobileMenuVisible = ref(false)
  const mobileView = ref('edit')

  /* ---------- 2. 文档状态 ---------- */
  const documents = ref([])
  const currentDocument = reactive({
    id: null,
    title: '',
    content: '',
    updatedAt: null,
    isDirtyTitle: false
  })
  const loading = ref(false)
  const saving = ref(false)

  /* ---------- 3. 自动保存 ---------- */
  const isAutoSaving = ref(false)
  const lastSaveTime = ref(null)
  let autoSaveTimer = null
const startAutoSave = () => {
  stopAutoSave()
  autoSaveTimer = setInterval(() => autoSave(), 30_000) // 30 s
}
const stopAutoSave = () => {
  if (autoSaveTimer) { clearInterval(autoSaveTimer); autoSaveTimer = null }
}
  /* 3. 自动保存 ---------- */
const autoSave = async () => {
  if (!currentDocument.content.trim() || saving.value) return
  saving.value = true
  try {
    /* ① 标题已改 → 按原逻辑静默推后端（不动） */
    if (currentDocument.isDirtyTitle && currentDocument.id) {
      await documentApi.update(currentDocument.id, { title: currentDocument.title })
      currentDocument.isDirtyTitle = false
      // 仍无提示
    }

    /* ② 正文 → 只写本地，不推后端，无提示 */
    await updateLocal(toRaw(currentDocument))
    lastSaveTime.value = new Date()
  } catch (e) {
    console.warn('[autoSave] 静默保存失败', e)
  }
  saving.value = false
}

  /* ---------- 8. 文档 IO ---------- */
  const loadDocuments = async () => {
    console.log('🔥 loadDocuments 被调用了')
  loading.value = true
  try {
    const { data } = await documentApi.getAll()
    documents.value = data

    if (!currentDocument.id && data.length) {
      await loadDocument(data[0].id)
    } 
    // ✅ 弹出成功提示
    ElMessage.success('文档列表已刷新')
  } catch (error) {
    console.error('刷新失败:', error)
    ElMessage.error('刷新失败，请稍后重试')
  } finally {
    loading.value = false
  }
}
  const loadDocument = async id => {
  loading.value = true
  const { data } = await documentApi.getById(id)

  // ✅ 整体替换，保证字段完整
  Object.assign(currentDocument, {
    id: data.id,
    title: data.title,
    content: data.content,
    updatedAt: data.updatedAt,
    isDirtyTitle: false
  })

  if (isMobile.value) mobileMenuVisible.value = false
  loading.value = false
}
  const createEmpty = async () => {
  loading.value = true
  try {
    // 1. 后端创建
    const { data } = await documentApi.create({
      title: '无标题文档',
      content: '# 新文档\n\n开始编写你的内容...',
      updatedAt: new Date().toISOString()
    })
    //切换新文档
    Object.assign(currentDocument, data)
    // 2. 插入到列表最顶部
    documents.value.unshift(data)
    ElMessage.success('新文档已创建')
  } catch (e) {
    ElMessage.error('创建文档失败')
  } finally {
    loading.value = false
  }
}
  const silentSave = async () => {
    saving.value = true
    try {
      if (currentDocument.id) await documentApi.update(currentDocument.id, currentDocument)
      else {
        const { data } = await documentApi.create(currentDocument)
        currentDocument.id = data.id
      }
      loadDocuments()
    } finally { saving.value = false }
  }
const manualSave = async () => {
  if (!currentDocument.content.trim()) return ElMessage.warning('文档内容不能为空')
  saving.value = true
  try {
    // 只要标题脏就同步
    if (currentDocument.isDirtyTitle || !currentDocument.id) {
      await silentSave()          // silentSave 里已经包含 create/update 逻辑
      currentDocument.isDirtyTitle = false
    } else {
      // 标题没改，仅保存正文
      await updateLocal(toRaw(currentDocument))
    }
    ElMessage.success('文档已保存')
  } finally { saving.value = false }
}
  const debouncedManualSave = debounce(manualSave, 1_000)

  const deleteCurrentDocument = async () => {
    if (!currentDocument.id) return
    try {
      await ElMessageBox.confirm('确定要删除这个文档吗？此操作不可恢复。', '警告', { type: 'warning' ,confirmButtonText: '确定',
        cancelButtonText: '取消'})
      await documentApi.delete(currentDocument.id)
      ElMessage.success('文档已删除')
      loadDocuments()
    } catch (e) { if (e !== 'cancel') ElMessage.error('删除失败') }
  }


  /* ---------- 4. 插件 ---------- */
  const pluginStates = reactive(loadPluginConfig())
  const initPlugins = () => {
    // 清掉旧插件
    pluginManager.getPlugins().forEach(p => pluginManager.unregister(p.name))
    pluginManager.setEditorInstance(editorAPI)

    // 重新读配置
    const cfg = loadPluginConfig()
    Object.keys(pluginStates).forEach(k => { pluginStates[k] = cfg[k] ?? false })

    // 注册钩子
    pluginManager.registerHook('editor:showDialog', editorAPI.showDialog)
    pluginManager.registerHook('editor:hideDialog', editorAPI.hideDialog)

    // 注册插件
    const reg = (name, PluginClass) => {
      if (!pluginStates[name]) return
      try {
        const plugin = new PluginClass()
        pluginManager.register(plugin)
      } catch (e) { console.error(`注册插件 ${name} 失败`, e) }
    }
    reg('word-count-plugin', WordCountPlugin)
    reg('diagram-plugin', DiagramPlugin)
    reg('diagram-toolbar-plugin', DiagramToolbarPlugin)
  }

  /* ---------- 5. 编辑器 API ---------- */
  const editorAPI = reactive({
    content: '',
    insertText(text) {
      const textarea = document.querySelector('.markdown-editor')
      if (!textarea) return
      const [start, end] = [textarea.selectionStart, textarea.selectionEnd]
      const before = currentDocument.content.substring(0, start)
      const after = currentDocument.content.substring(end)
      currentDocument.content = before + text + after
      nextTick(() => {
        textarea.focus()
        textarea.setSelectionRange(start + text.length, start + text.length)
      })
    },
    showDialog(opts) { /* 预留 */ },
    hideDialog() { /* 预留 */ }
  })

  /* ---------- 6. 主题 ---------- */
  const toggleTheme = () => {
    currentTheme.value = currentTheme.value === 'light-theme' ? 'dark-theme' : 'light-theme'
    localStorage.setItem('quickmd-theme', currentTheme.value)
    setHighlightTheme(currentTheme.value)
    ElMessage.success(`已切换到${currentTheme.value === 'light-theme' ? '亮色' : '暗色'}主题`)
    nextTick(() => highlightCodeBlocks(document.querySelector('.html-preview')))
  }

  /* ---------- 7. 设备 ---------- */
  const checkDevice = () => {
    isMobile.value = window.innerWidth <= 768
    if (isMobile.value) {
      sidebarVisible.value = false
      mobileMenuVisible.value = false
    }
  }

  /* ---------- 9. 生命周期 ---------- */
  onMounted(() => {
    window.addEventListener('resize', checkDevice)
    checkDevice()
    setHighlightTheme(currentTheme.value)
    initPlugins()
    loadDocuments().then(startAutoSave)
  })
  onUnmounted(() => {
    window.removeEventListener('resize', checkDevice)
    stopAutoSave()
    pluginManager.getPlugins().forEach(p => pluginManager.unregister(p.name))
  })

  /* ---------- 10. 监听 ---------- */
  watch(() => currentDocument.content, v => {
    editorAPI.content = v
    pluginManager.triggerHook('editor:contentChanged', v)
  })

  /* ---------- 11. 计算属性 ---------- */
  const compiledMarkdown = computed(() => parseMarkdown(currentDocument.content))
  const wordCount = computed(() => {
  const c = (currentDocument.content ?? '').trim()
  return c ? c.split(/\s+/).filter(w => w.length > 0).length : 0
})
  const characterCount = computed(() => (currentDocument.content ?? '').length)
const lineCount      = computed(() => (currentDocument.content ?? '').split('\n').length)
  const showWordCount = computed(() => pluginStates['word-count-plugin'] === true)

  return {
    /* 状态 */
    currentTheme, isMobile, sidebarVisible, mobileMenuVisible, mobileView,
    documents, currentDocument, loading, saving, isAutoSaving, lastSaveTime,
    pluginStates, compiledMarkdown, wordCount, characterCount, lineCount, showWordCount,
    /* 方法 */
    toggleTheme,
    toggleSidebar: () => {
      sidebarVisible.value = !sidebarVisible.value
      localStorage.setItem('quickmd-sidebar', sidebarVisible.value)
    },
    toggleMobileMenu: () => { mobileMenuVisible.value = !mobileMenuVisible.value },
    loadDocument, loadDocuments,createEmpty, manualSave, debouncedManualSave, deleteCurrentDocument,
    initPlugins,
    onTitleInput: () => { currentDocument.isDirtyTitle = true }
  }
}