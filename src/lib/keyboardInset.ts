import { Capacitor } from '@capacitor/core'
import { Keyboard } from '@capacitor/keyboard'

let keyboardHeight = 0
let initialized = false

export function getKeyboardHeight(): number {
  return keyboardHeight
}

function publish(height: number) {
  keyboardHeight = Math.max(0, Math.round(height))
  window.dispatchEvent(
    new CustomEvent('knot:keyboard', { detail: { height: keyboardHeight } }),
  )
}

export async function initKeyboardInset(): Promise<void> {
  if (initialized || !Capacitor.isNativePlatform()) return
  initialized = true
  try {
    await Keyboard.addListener('keyboardWillShow', (info) => {
      publish(info.keyboardHeight)
    })
    await Keyboard.addListener('keyboardDidShow', (info) => {
      publish(info.keyboardHeight)
    })
    await Keyboard.addListener('keyboardWillHide', () => {
      publish(0)
    })
    await Keyboard.addListener('keyboardDidHide', () => {
      publish(0)
    })
  } catch {
    initialized = false
  }
}
