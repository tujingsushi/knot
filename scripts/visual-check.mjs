import { chromium } from 'playwright-core'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'

const outDir = path.resolve('visual-check')
await mkdir(outDir, { recursive: true })

const browser = await chromium.connectOverCDP('http://127.0.0.1:9222')
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  locale: 'zh-CN',
  timezoneId: 'Asia/Shanghai',
  serviceWorkers: 'block',
})
const page = await context.newPage()
const errors = []
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(`console: ${message.text()}`)
})
page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`))

await page.goto('http://127.0.0.1:4174/', { waitUntil: 'networkidle' })
await page.evaluate(() => localStorage.clear())
await page.reload({ waitUntil: 'networkidle' })
await page.locator('.splash-screen').waitFor({ state: 'visible', timeout: 5000 })
await page.screenshot({ path: path.join(outDir, '00-splash.png') })
await page.locator('.splash-screen').waitFor({ state: 'detached', timeout: 6000 })
await page.evaluate(() => document.fonts.ready)
await page.waitForTimeout(400)

async function shot(name, fullPage = false) {
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.screenshot({ path: path.join(outDir, name), fullPage })
}

await shot('01-empty.png')
await shot('01-empty-full.png', true)

await page.getByRole('button', { name: '先看看示例' }).first().click()
await page.waitForTimeout(3300)
await shot('02-overview.png')
await shot('02-overview-full.png', true)

await page.getByRole('button', { name: '想法', exact: true }).click()
await page.waitForTimeout(500)
await shot('03-ideas.png')

await page.getByRole('button', { name: '新建', exact: true }).click()
await page.waitForTimeout(300)
await shot('03-create-choice.png')
await page.getByRole('button', { name: /新建想法/ }).click()
await page.waitForTimeout(400)
await shot('03-new-idea.png')
await page.getByRole('button', { name: '关闭' }).click()
await page.waitForTimeout(300)

await page.getByRole('button', { name: '规划', exact: true }).click()
await page.waitForTimeout(300)

const metrics = await page.evaluate(() => {
  const frame = document.querySelector('.app-frame')
  return {
    viewport: { width: window.innerWidth, height: window.innerHeight },
    docScrollWidth: document.documentElement.scrollWidth,
    frameWidth: frame?.getBoundingClientRect().width,
    bodyHeight: document.body.scrollHeight,
  }
})

await page.locator('.plans-list-section').scrollIntoViewIfNeeded()
await page.waitForTimeout(500)
await page.screenshot({ path: path.join(outDir, '03-time-3m.png') })
await page.screenshot({ path: path.join(outDir, '03-time-3m-full.png'), fullPage: true })

await page.getByRole('button', { name: '1 年' }).click()
await page.waitForTimeout(400)
await page.screenshot({ path: path.join(outDir, '04-time-1y.png') })
await page.screenshot({ path: path.join(outDir, '04-time-1y-full.png'), fullPage: true })

await page.locator('.band-row').filter({ hasText: '建立稳定的阅读节奏' }).click()
await page.waitForTimeout(500)
await shot('06-detail.png')
await page.locator('dialog[open]').getByRole('button', { name: '关闭' }).click()
await page.waitForTimeout(300)

await page.getByRole('button', { name: '打开今日一页' }).click()
await page.waitForTimeout(700)
await shot('07-today.png')

let downloadName = null
try {
  const downloadPromise = page.waitForEvent('download', { timeout: 8000 })
  await page.getByRole('button', { name: '保存今日一页为图片' }).click()
  const download = await downloadPromise
  downloadName = download.suggestedFilename()
  const savePath = path.join(outDir, 'today-export.png')
  await download.saveAs(savePath)
  await page.waitForTimeout(500)
} catch (error) {
  errors.push(`download: ${error.message}`)
}

await page.getByRole('button', { name: '关闭今日一页' }).click()
await page.waitForTimeout(500)

await page.locator('.band-row').first().click()
await page.waitForTimeout(400)
await page.getByRole('button', { name: '完成，并打一个结' }).click()
await page.waitForTimeout(900)
await shot('08-detail-complete.png')
await page.locator('dialog[open]').getByRole('button', { name: '关闭' }).click()
await page.waitForTimeout(300)

await page.evaluate(() => window.scrollTo(0, 0))
await page.waitForTimeout(300)
await shot('09-overview-knot.png')

await page.getByRole('button', { name: '打开设置' }).click()
await page.waitForTimeout(500)
await shot('10-settings.png')
await page.locator('.settings-developer').scrollIntoViewIfNeeded()
await page.waitForTimeout(300)
await shot('10-settings-developer.png')
await page.locator('dialog[open]').getByRole('button', { name: '关闭' }).click()
await page.waitForTimeout(300)

await page.getByRole('button', { name: '新建', exact: true }).click()
await page.getByRole('button', { name: /新建规划/ }).click()
await page.waitForTimeout(500)
await page.getByRole('button', { name: /添加子目标/ }).click()
await page.locator('.subgoal-input').fill('先搭好章节框架')
await shot('11-new-plan.png')

console.log(JSON.stringify({ metrics, errors, downloadName }, null, 2))
process.exit(0)
