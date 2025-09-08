const KEY = 'plugin-config'

export const loadPluginConfig = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}')
  } catch {
    return {
      'word-count-plugin': true,
      'diagram-plugin': true,
      'diagram-toolbar-plugin': true
    }
  }
}

export const savePluginConfig = config => localStorage.setItem(KEY, JSON.stringify(config))