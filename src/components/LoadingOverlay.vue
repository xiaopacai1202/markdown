<template>
  <div v-if="loading" class="loading-overlay">
    <div class="loading-content">
      <el-icon class="is-loading" :size="30"><Loading /></el-icon>
      <p>加载中...</p>
    </div>
  </div>
</template>

<script setup>
import { Loading } from '@element-plus/icons-vue'

defineProps({
  loading: Boolean
})
</script>

<style scoped>
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