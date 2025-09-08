import { ref, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { documentApi } from '../api/markdownApi.js'

export function useDocuments() {
  const documents = ref([])
  const currentDocument = reactive({
    id: null,
    title: '',
    content: '',
    updatedAt: null
  })
  const loading = ref(false)
  const saving = ref(false)

  // 静默加载文档列表（不显示加载状态）
  const loadDocumentsSilently = async () => {
    try {
      const response = await documentApi.getAll()
      documents.value = response.data
    } catch (error) {
      console.debug('静默加载文档列表失败:', error)
    }
  }

  const loadDocuments = async () => {
    try {
      loading.value = true
      const response = await documentApi.getAll()
      documents.value = response.data
      
      if (!currentDocument.id && documents.value.length > 0) {
        await loadDocument(documents.value[0].id)
      } else if (documents.value.length === 0) {
        createNewDocument()
      }
    } catch (error) {
      console.error('Error loading documents:', error)
      ElMessage.error('加载文档列表失败，请确保 JSON Server 已启动')
    } finally {
      loading.value = false
    }
  }

  const loadDocument = async (id) => {
    try {
      loading.value = true
      const response = await documentApi.getById(id)
      Object.assign(currentDocument, response.data)
    } catch (error) {
      console.error('Error loading document:', error)
      ElMessage.error('加载文档失败')
    } finally {
      loading.value = false
    }
  }

  const createNewDocument = () => {
    const now = new Date().toISOString()
    Object.assign(currentDocument, {
      id: null,
      title: `新文档-${new Date().getTime()}`,
      content: '# 新文档\n\n开始编写你的内容...',
      updatedAt: now
    })
  }

  const saveDocument = async () => {
    if (!currentDocument.content.trim()) {
      ElMessage.warning('文档内容不能为空')
      return
    }

    try {
      saving.value = true
      
      // 更新最后修改时间
      const updateData = {
        title: currentDocument.title,
        content: currentDocument.content,
        updatedAt: new Date().toISOString()
      }
      
      if (currentDocument.id) {
        await documentApi.update(currentDocument.id, updateData)
        currentDocument.updatedAt = updateData.updatedAt
        ElMessage.success('文档已更新')
      } else {
        const response = await documentApi.create(updateData)
        currentDocument.id = response.data.id
        currentDocument.updatedAt = updateData.updatedAt
        ElMessage.success('文档已创建')
      }
      
      await loadDocuments()
    } catch (error) {
      console.error('保存失败:', error)
      ElMessage.error('保存失败，请确保 JSON Server 已启动')
    } finally {
      saving.value = false
    }
  }

  const deleteCurrentDocument = async () => {
    if (!currentDocument.id) return

    try {
      await ElMessageBox.confirm('确定要删除这个文档吗？此操作不可恢复。', '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      })

      await documentApi.delete(currentDocument.id)
      ElMessage.success('文档已删除')
      
      createNewDocument()
      await loadDocuments()
    } catch (error) {
      if (error !== 'cancel') {
        console.error('Error deleting document:', error)
        ElMessage.error('删除失败')
      }
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return '--'
    return new Date(dateString).toLocaleString('zh-CN')
  }

  return {
    documents,
    currentDocument,
    loading,
    saving,
    loadDocuments,
    loadDocumentsSilently,
    loadDocument,
    createNewDocument,
    deleteCurrentDocument,
    saveDocument,
    formatDate
  }
}