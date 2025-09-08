<template>
  <el-dialog
    :model-value="pdfExporting"
    @update:model-value="$emit('update:pdfExporting', $event)"
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
</template>

<script setup>
defineProps({
  pdfExporting: Boolean,
  exportProgress: Number,
  exportStatus: String,
  exportMessage: String
})

defineEmits(['update:pdfExporting'])
</script>

<style scoped>
.export-progress {
  text-align: center;
}

.export-message {
  margin-top: 1rem;
  color: var(--text-color);
  font-size: 0.9rem;
}
</style>