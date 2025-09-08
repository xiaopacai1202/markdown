import { ref, onUnmounted } from 'vue'
import { debounce } from 'lodash-es'
import { documentApi } from '../api/markdownApi.js'

export function useAutoSave(currentDocument, saveDocument, loadDocuments) {
  const isAutoSaving = ref(false)
  const lastSaveTime = ref(null)
  const autoSaveInterval = ref(null)

  const autoSaveDocument = async () => {
    // 如果没有内容或者正在保存，直接返回
    if (!currentDocument.content.trim() || isAutoSaving.value) {
      return
    }

    try {
      isAutoSaving.value = true
      
      // 更新最后修改时间
      const updateData = {
        title: currentDocument.title,
        content: currentDocument.content,
        updatedAt: new Date().toISOString() // 添加更新时间
      }
      
      if (currentDocument.id) {
        // 更新现有文档（静默保存）
        await documentApi.update(currentDocument.id, updateData)
      } else {
        // 创建新文档（静默保存）
        const response = await documentApi.create(updateData)
        currentDocument.id = response.data.id
      }
      
      // 静默更新本地文档的更新时间
      currentDocument.updatedAt = updateData.updatedAt
      
      // 静默更新文档列表（不显示加载状态）
      try {
        const response = await documentApi.getAll()
        loadDocuments(response.data) // 假设 loadDocuments 可以接受数据参数
      } catch (error) {
        // 静默失败，不影响主流程
        console.debug('静默更新文档列表失败:', error)
      }
      
      lastSaveTime.value = new Date()
      
    } catch (error) {
      // 静默失败，不显示错误提示，只在控制台输出调试信息
      console.debug('自动保存失败（静默）:', error.message)
    } finally {
      isAutoSaving.value = false
    }
  }

  const debouncedAutoSave = debounce(autoSaveDocument, 5000)

  const startAutoSave = () => {
    stopAutoSave()
    // 每30秒自动保存一次
    autoSaveInterval.value = setInterval(() => {
      if (currentDocument.content.trim()) {
        autoSaveDocument()
      }
    }, 30000)
  }

  const stopAutoSave = () => {
    if (autoSaveInterval.value) {
      clearInterval(autoSaveInterval.value)
      autoSaveInterval.value = null
    }
  }

  onUnmounted(() => {
    stopAutoSave()
  })

  return {
    isAutoSaving,
    lastSaveTime,
    startAutoSave,
    stopAutoSave,
    debouncedAutoSave
  }
}