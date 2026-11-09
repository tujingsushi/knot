import { chromium } from 'playwright-core'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'

const outDir = path.resolve('visual-check')
await mkdir(outDir, { recursive: true })
const browser = await chromium.connectOverCDP('http://127.0.0.1:9222')

for (const [name, width, height] of [
  ['320', 320, 700],
  ['desktop', 1280, 900],
]) {
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 1,
    isMobile: name === '320',
    hasTouch: name === '320',
    locale: 'zh-CN',
    timezoneId: 'Asia/Shanghai',
    serviceWorkers: 'block',
  })
  const page = await context.newPage()
  await page.goto('http://127.0.0.1:4174/', { waitUntil: 'networkidle' })
  await page.evaluate(() => localStorage.clear())
  await page.reload({ waitUntil: 'networkidle' })
  await page.locator('.splash-screen').waitFor({ state: 'detached', timeout: 6000 })
  await page.getByRole('button', { name: '先看看示例' }).click()
  await page.waitForTimeout(3300)
  await page.evaluate(() => window.scrollTo(0, 0))
  const metrics = await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    frameWidth: document.querySelector('.app-frame')?.getBoundingClientRect().width,
  }))
  console.log(name, metrics)
  await page.screenshot({ path: path.join(outDir, `${name}-overview.png`) })
}

process.exit(0)
