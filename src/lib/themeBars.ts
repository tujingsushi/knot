import { Capacitor, registerPlugin } from '@capacitor/core'
import { EdgeToEdge } from '@capawesome/capacitor-android-edge-to-edge-support'

interface ThemeBarsPlugin {
  setColors(options: {
    status: string
    navigation: string
    light: boolean
  }): Promise<void>
}

const ThemeBars = registerPlugin<ThemeBarsPlugin>('ThemeBars')

export async function applyNativeBars(paper: string): Promise<void> {
  if (Capacitor.getPlatform() !== 'android') return

  try {
    await ThemeBars.setColors({
      status: paper,
      navigation: paper,
      light: true,
    })
  } catch {
    // The direct bar-color fallback is optional.
  }

  try {
    await EdgeToEdge.enable()
    await EdgeToEdge.setStatusBarColor({ color: paper })
    await EdgeToEdge.setNavigationBarColor({ color: paper })
  } catch {
    // Web and iOS keep their native chrome.
  }
}
