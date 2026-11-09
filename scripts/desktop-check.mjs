import { _electron as electron } from 'playwright-core'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'

const root = process.cwd()
const outDir = path.join(root, 'visual-check')
await mkdir(outDir, { recursive: true })

const env = { ...process.env }
delete env.ELECTRON_RUN_AS_NODE
delete env.ELECTRON_NO_ATTACH_CONSOLE
env.KNOT_USER_DATA = process.env.KNOT_USER_DATA || path.join(root, '.electron-data')

const packaged = process.env.KNOT_DESKTOP_EXECUTABLE
const noSandbox = process.env.KNOT_NO_SANDBOX === '1'
const app = await electron.launch({
  executablePath: packaged || path.join(root, 'node_modules', 'electron', 'dist', 'electron.exe'),
  args: packaged
    ? [...(noSandbox ? ['--no-sandbox'] : [])]
    : ['.', ...(noSandbox ? ['--no-sandbox'] : [])],
  cwd: root,
  env,
})

const prefix = packaged ? 'desktop-packaged' : 'desktop'

const page = await app.firstWindow()
const errors = []
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(`console: ${message.text()}`)
})
page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`))

await page.locator('.splash-screen').waitFor({ state: 'detached', timeout: 8000 })
await page.getByText('结绳', { exact: true }).first().waitFor()

const desktop = await page.evaluate(() => ({
  hasBridge: Boolean(window.knotDesktop),
  platform: window.knotDesktop?.platform,
  electron: window.knotDesktop?.electron,
}))

await page.screenshot({ path: path.join(outDir, `${prefix}-app.png`) })

if (!packaged) {
  await page.getByRole('button', { name: '先看看示例' }).click()
  await page.waitForTimeout(3300)
  await page.screenshot({ path: path.join(outDir, `${prefix}-demo.png`) })
}

await page.getByRole('button', { name: '打开设置' }).click()
await page.getByText('运行信息与关于', { exact: true }).click()
await page.getByText(/桌面版 · Windows/).waitFor()
await page.getByText('tujingsushi', { exact: true }).waitFor()
await page.screenshot({ path: path.join(outDir, `${prefix}-settings.png`) })

console.log(JSON.stringify({ desktop, errors }, null, 2))
await app.close()
