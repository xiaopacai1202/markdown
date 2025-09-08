// localApi.js
const LS_KEY = 'quickmd:docs'

// 读取本地文档列表
export const getAll = () => {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || '[]')
  } catch {
    return []
  }
}

// 保存整份列表
export const saveAll = list => {
  localStorage.setItem(LS_KEY, JSON.stringify(list))
}

// 更新或新增单篇
export const updateLocal = doc => {
  const list = getAll()
  const idx = list.findIndex(d => d.id === doc.id)
  if (idx >= 0) list[idx] = doc
  else list.unshift({ ...doc, id: doc.id || Date.now() })
  saveAll(list)
  return doc
}