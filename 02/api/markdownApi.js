import axios from 'axios';

// 创建 axios 实例，配置基础 URL
const apiClient = axios.create({
  baseURL: 'http://localhost:3001', // JSON Server 默认运行在 3001 端口
  headers: {
    'Content-Type': 'application/json',
  },
});

// 文档 API
export const documentApi = {
  // 获取所有文档列表
  getAll() {
    return apiClient.get('/documents');
  },

  // 获取单个文档
  getById(id) {
    return apiClient.get(`/documents/${id}`);
  },

  // 创建新文档
  create(document) {
    return apiClient.post('/documents', {
      ...document,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  },

  // 更新文档
  update(id, document) {
    return apiClient.put(`/documents/${id}`, {
      ...document,
      updatedAt: new Date().toISOString(),
    });
  },

  // 删除文档
  delete(id) {
    return apiClient.delete(`/documents/${id}`);
  },
};

export default apiClient;
