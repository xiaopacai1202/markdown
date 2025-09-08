import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { setHighlightTheme } from '../utils/markdownParser.js'

export function useTheme() {
  const currentTheme = ref('light-theme')

  const toggleTheme = () => {
    currentTheme.value = currentTheme.value === 'light-theme' ? 'dark-theme' : 'light-theme'
    localStorage.setItem('quickmd-theme', currentTheme.value)
    ElMessage.success(`已切换到${currentTheme.value === 'light-theme' ? '亮色' : '暗色'}主题`)
    
    setHighlightTheme(currentTheme.value)
  }

  // 初始化主题
  const savedTheme = localStorage.getItem('quickmd-theme')
  if (savedTheme) {
    currentTheme.value = savedTheme
  }
  setHighlightTheme(currentTheme.value)

  return {
    currentTheme,
    toggleTheme
  }
}