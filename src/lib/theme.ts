export type ThemeKey = 'paper' | 'celadon' | 'dusk' | 'rose' | 'pine'

export interface ThemeOption {
  key: ThemeKey
  label: string
  description: string
  paper: string
  ink: string
  accent: string
  idea: string
  red: string
}

export const THEMES: ThemeOption[] = [
  {
    key: 'paper',
    label: '纸黄',
    description: '原始纸色与黛青',
    paper: '#f4efe4',
    ink: '#28251f',
    accent: '#5e7f8c',
    idea: '#a9843f',
    red: '#b8462c',
  },
  {
    key: 'celadon',
    label: '青瓷',
    description: '青灰纸与松石绿',
    paper: '#eaf1eb',
    ink: '#20322d',
    accent: '#4f7d72',
    idea: '#a88745',
    red: '#a94d3d',
  },
  {
    key: 'dusk',
    label: '暮蓝',
    description: '雾蓝纸与深海蓝',
    paper: '#e9edf1',
    ink: '#1f2a36',
    accent: '#526f8c',
    idea: '#a88a4a',
    red: '#b34f3d',
  },
  {
    key: 'rose',
    label: '胭脂',
    description: '暖粉纸与酒红',
    paper: '#f4e9e8',
    ink: '#322326',
    accent: '#9b5f68',
    idea: '#b1824d',
    red: '#a83d3b',
  },
  {
    key: 'pine',
    label: '松墨',
    description: '浅苔纸与深松绿',
    paper: '#edf0e6',
    ink: '#222d25',
    accent: '#5f7a62',
    idea: '#ad8746',
    red: '#a85036',
  },
]

const THEME_KEY = 'knot.theme'

export function isThemeKey(value: string | null): value is ThemeKey {
  return THEMES.some((theme) => theme.key === value)
}

export function loadTheme(): ThemeKey {
  if (typeof window === 'undefined') return 'paper'
  try {
    const saved = window.localStorage.getItem(THEME_KEY)
    if (isThemeKey(saved)) return saved
  } catch {
    // The default theme is always available.
  }
  return 'paper'
}

export function themeOption(key: ThemeKey): ThemeOption {
  return THEMES.find((theme) => theme.key === key) ?? THEMES[0]
}

export function applyTheme(key: ThemeKey): void {
  if (typeof document === 'undefined') return
  const option = themeOption(key)
  document.documentElement.dataset.theme = key
  document.documentElement.style.colorScheme = 'light'
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', option.paper)
  try {
    window.localStorage.setItem(THEME_KEY, key)
  } catch {
    // Theme persistence is optional.
  }
}
