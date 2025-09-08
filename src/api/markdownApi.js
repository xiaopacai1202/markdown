import axios from 'axios'

const API_BASE_URL = 'http://localhost:3001'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
})

export const documentApi = {
  getAll: () => api.get('/documents'),
  getById: (id) => api.get(`/documents/${id}`),
  create: (data) => api.post('/documents', {
    ...data,
    createdAt: new Date().toISOString(), // 确保有创建时间
    updatedAt: new Date().toISOString()  // 确保有更新时间
  }),
  update: (id, data) => api.put(`/documents/${id}`, {
    ...data,
    updatedAt: new Date().toISOString()  // 确保更新时也更新更新时间
  }),
  delete: (id) => api.delete(`/documents/${id}`),
}