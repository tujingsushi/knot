export interface DesktopBridge {
  platform: string
  electron: string
}

declare global {
  interface Window {
    knotDesktop?: DesktopBridge
  }
}

export function isDesktopApp(): boolean {
  return typeof window !== 'undefined' && Boolean(window.knotDesktop)
}

export function desktopPlatformLabel(): string {
  const platform = window.knotDesktop?.platform
  if (platform === 'win32') return 'Windows'
  if (platform === 'darwin') return 'macOS'
  if (platform === 'linux') return 'Linux'
  return '桌面'
}
