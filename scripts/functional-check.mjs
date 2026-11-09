import { chromium } from 'playwright-core'
import assert from 'node:assert/strict'
import { mkdir, stat } from 'node:fs/promises'
import path from 'node:path'

const outDir = path.resolve('visual-check')
await mkdir(outDir, { recursive: true })

const browser = await chromium.connectOverCDP('http://127.0.0.1:9222')
const context = await browser.newContext({
  viewport: { width: 360, height: 800 },
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

const results = []
const title = '完成产品原型的第一轮验证'
const storageKey = 'sancheng.plans.v1'
const ideasStorageKey = 'sancheng.ideas.v1'
const SPLASH_QUOTES = [
  '不能听命于自己者，就要受命于他人。',
  '每一个不曾起舞的日子，都是对生命的辜负。',
  '对未来真正的慷慨，是把一切献给现在。',
  '对待生命你不妨大胆冒险一点，因为好歹你要失去它。',
]

function check(name) {
  results.push(name)
  console.log(`✓ ${name}`)
}

async function waitForSplash() {
  await page.locator('.splash-screen').waitFor({ state: 'detached', timeout: 6000 })
}

async function getPlans() {
  return page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key) || '[]'),
    storageKey,
  )
}

async function getIdeas() {
  return page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key) || '[]'),
    ideasStorageKey,
  )
}

async function assertNoHorizontalOverflow(label) {
  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }))
  assert.ok(
    metrics.scrollWidth <= metrics.innerWidth + 1,
    `${label} 出现横向溢出: ${metrics.scrollWidth} > ${metrics.innerWidth}`,
  )
}

async function shot(name) {
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.screenshot({ path: path.join(outDir, name) })
}

try {
  await page.goto('http://127.0.0.1:4174/', { waitUntil: 'networkidle' })
  await page.locator('.splash-screen').waitFor({ state: 'visible', timeout: 5000 })
  const splashQuote = (
    (await page.locator('.splash-quote').textContent()) ?? ''
  )
    .replace(/[「」]/g, '')
    .trim()
  assert.ok(SPLASH_QUOTES.includes(splashQuote))
  check('开屏随机显示四句名言之一')

  await page.evaluate(() => localStorage.clear())
  await page.reload({ waitUntil: 'networkidle' })
  await waitForSplash()
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(300)

  await page.getByText('把一件想做的事，放进一段时间里。').waitFor()
  await assertNoHorizontalOverflow('空状态')
  await shot('360-empty.png')
  check('空状态正常，360px 无横向溢出')

  // Create an idea from the bottom "新建" action.
  await page.getByRole('button', { name: '新建', exact: true }).click()
  await page.getByRole('button', { name: /新建想法/ }).click()
  await page.locator('#idea-title').fill('想学做一只陶杯')
  await page.locator('#idea-note').fill('先不安排时间，等一个周末。')
  await page.getByRole('button', { name: '收进想法' }).click()
  await page.waitForTimeout(400)
  let ideas = await getIdeas()
  assert.equal(ideas.length, 1)
  assert.equal(ideas[0].title, '想学做一只陶杯')
  assert.match(ideas[0].date, /^\d{4}-\d{2}-\d{2}$/)
  await page.locator('.page-ideas').waitFor()
  await page.getByText('想学做一只陶杯').waitFor()
  check('新建想法并进入想法页')

  await page.getByRole('button', { name: '规划', exact: true }).click()
  await page.locator('.ring-idea').waitFor()
  assert.match(
    (await page.locator('.year-ring').getAttribute('aria-label')) ?? '',
    /1 个想法/,
  )
  check('想法点缀在年轮上')

  await page.getByRole('button', { name: '想法', exact: true }).click()
  await page.locator('.idea-main').filter({ hasText: '想学做一只陶杯' }).click()
  await page.locator('#idea-title').fill('想学做一只陶杯（手捏）')
  await page.getByRole('button', { name: '保存修改' }).click()
  await page.waitForTimeout(300)
  ideas = await getIdeas()
  assert.equal(ideas[0].title, '想学做一只陶杯（手捏）')
  check('编辑想法并持久化')
  await shot('360-ideas.png')

  await page.getByRole('button', { name: '规划', exact: true }).click()
  await page.waitForTimeout(300)

  // Validation: title required.
  await page.getByRole('button', { name: '写下第一条规划' }).click()
  await page.getByRole('button', { name: '放进时间里' }).click()
  await page.getByText('给这条规划起一个名字').waitFor()
  await page.getByRole('button', { name: '关闭' }).click()
  await page.waitForTimeout(300)
  check('标题必填校验生效')

  // Tapping outside must not discard an in-progress plan.
  await page.getByRole('button', { name: '写下第一条规划' }).click()
  await page.locator('#plan-title').fill('临时输入，不应丢失')
  await page.mouse.click(20, 100)
  await page.waitForTimeout(300)
  assert.equal(await page.locator('#plan-title').inputValue(), '临时输入，不应丢失')
  await page.locator('dialog[open]').waitFor()
  check('点击遮罩不会丢失已输入内容')
  await page.getByRole('button', { name: '关闭' }).click()
  await page.waitForTimeout(300)

  // Create a plan.
  await page.getByRole('button', { name: '写下第一条规划' }).click()
  await page.locator('#plan-title').fill(title)
  await page.locator('.date-field input').nth(0).fill('2026-11-06')
  await page.locator('.date-field input').nth(1).fill('2027-02-28')
  await page.getByRole('button', { name: /添加备注/ }).click()
  assert.equal(await page.locator('#plan-title').inputValue(), title)
  await page.locator('#plan-note').fill('先完成，再完美。')
  await page.getByRole('button', { name: /添加子目标/ }).click()
  assert.equal(await page.locator('#plan-title').inputValue(), title)
  assert.equal(await page.locator('#plan-note').inputValue(), '先完成，再完美。')
  await page.locator('.subgoal-input').fill('先写出一页提纲')
  await page.locator('.checkin-option').click()
  assert.equal(
    await page.getByRole('checkbox', { name: /每日打卡/ }).isChecked(),
    true,
  )
  assert.equal(await page.locator('#plan-title').inputValue(), title)
  await shot('360-new-plan-filled.png')
  await page.locator('#plan-title').click()
  await page.locator('#plan-title').press('Enter')
  await page.waitForTimeout(400)
  let plans = await getPlans()
  assert.equal(plans.length, 0)
  assert.equal(await page.locator('dialog[open]').count(), 1)
  assert.equal(await page.locator('#plan-title').inputValue(), title)
  check('开始键只收起键盘，不创建规划')

  await page.getByRole('button', { name: '放进时间里' }).click()
  await page.waitForTimeout(500)
  plans = await getPlans()
  assert.equal(plans.length, 1)
  assert.equal(plans[0].title, title)
  assert.equal(plans[0].startDate, '2026-11-06')
  assert.equal(plans[0].endDate, '2027-02-28')
  assert.equal(plans[0].subgoals.length, 1)
  assert.equal(plans[0].subgoals[0].title, '先写出一页提纲')
  assert.equal(plans[0].checkInEnabled, true)
  await page.locator('.band-row').filter({ hasText: title }).waitFor()
  check('添加字段不清空输入，点击按钮才创建规划')

  await page.reload({ waitUntil: 'networkidle' })
  await waitForSplash()
  await page.locator('.band-row').filter({ hasText: title }).waitFor()
  await assertNoHorizontalOverflow('规划页含一条规划')
  await shot('360-overview-one.png')
  check('刷新后数据仍然存在')

  const quickCheckIn = page.locator('.checkin-quick-row').filter({ hasText: title })
  await quickCheckIn.waitFor()
  await quickCheckIn.locator('.checkin-quick-action').click()
  await page.waitForTimeout(300)
  plans = await getPlans()
  assert.equal(plans[0].checkInDates.length, 1)
  assert.match(plans[0].checkInDates[0], /^\d{4}-\d{2}-\d{2}$/)
  check('规划页便捷打卡并持久化')

  await page.getByRole('button', { name: '规划', exact: true }).click()
  await page.waitForTimeout(300)
  assert.equal(await page.locator('.filter-chip.is-active').textContent(), '在路上')
  await page
    .locator('.band-row')
    .filter({ hasText: title })
    .getByText('先写出一页提纲')
    .waitFor()
  check('规划页默认在路上并显示子目标')

  // Complete the plan.
  await page.locator('.band-row').filter({ hasText: title }).click()
  await page.locator('.detail-subgoal').first().click()
  await page.waitForTimeout(300)
  plans = await getPlans()
  assert.equal(plans[0].subgoals[0].done, true)
  check('勾选子目标并持久化')
  assert.equal(
    (await page.locator('.checkin-today-button').textContent())?.trim(),
    '今天已打卡',
  )
  await page.locator('.checkin-today-button').click()
  await page.waitForTimeout(300)
  plans = await getPlans()
  assert.equal(plans[0].checkInDates.length, 0)
  check('详情取消今日打卡')
  await page.locator('.checkin-today-button').click()
  await page.waitForTimeout(300)
  plans = await getPlans()
  assert.equal(plans[0].checkInDates.length, 1)
  check('详情重新打卡')
  await page.getByRole('button', { name: '完成，并打一个结' }).click()
  await page.waitForTimeout(700)
  await page.locator('.detail-seal').waitFor()
  await page.getByText('这一程，打了一个结。').waitFor()
  plans = await getPlans()
  assert.equal(plans[0].status, 'done')
  assert.ok(plans[0].completedAt)
  await shot('360-detail-complete.png')
  check('完成仪式、印章与 completedAt 写入')
  await page.locator('dialog[open]').getByRole('button', { name: '关闭' }).click()
  await page.waitForTimeout(300)
  assert.match(
    (await page.locator('.year-ring').getAttribute('aria-label')) ?? '',
    /1 条已完成/,
  )
  await page
    .locator('.urgency-legend-item')
    .filter({ hasText: '已完成' })
    .waitFor()
  check('已完成规划显示在年轮上')

  // Done filter and reopen.
  await page.locator('.filter-chip').filter({ hasText: '已完成' }).click()
  await page.locator('.band-row').filter({ hasText: title }).waitFor()
  check('已完成筛选可见')
  await page.locator('.band-row').filter({ hasText: title }).click()
  await page.getByRole('button', { name: '重新打开这条规划' }).click()
  await page.waitForTimeout(300)
  plans = await getPlans()
  assert.equal(plans[0].status, 'active')
  assert.equal(plans[0].completedAt, null)
  await page.locator('dialog[open]').getByRole('button', { name: '关闭' }).click()
  check('重新打开并清除完成时间')

  // Archive.
  await page.locator('.filter-chip').filter({ hasText: '在路上' }).click()
  await page.locator('.band-row').filter({ hasText: title }).click()
  await page.getByRole('button', { name: '归档', exact: true }).click()
  await page.waitForTimeout(400)
  plans = await getPlans()
  assert.equal(plans[0].status, 'archived')
  check('归档规划')

  // Archived filter and delete.
  await page.locator('.filter-chip').filter({ hasText: '已归档' }).click()
  await page.locator('.band-row').filter({ hasText: title }).click()
  await page.getByRole('button', { name: '删除' }).click()
  await page.getByRole('button', { name: '永久删除' }).click()
  await page.waitForTimeout(400)
  plans = await getPlans()
  assert.equal(plans.length, 0)
  check('确认后永久删除')

  await page.getByText('把一件想做的事，放进一段时间里。').waitFor()
  check('删除后回到空状态')

  // Demo + export.
  await page.getByRole('button', { name: '先看看示例' }).click()
  await page.waitForTimeout(3200)
  await page.locator('.filter-chip').filter({ hasText: '在路上' }).click()
  await page.waitForTimeout(300)
  await assertNoHorizontalOverflow('示例规划页')
  await shot('360-overview-demo.png')
  await page.getByRole('button', { name: '打开设置' }).click()
  await page.waitForTimeout(300)
  const downloadPromise = page.waitForEvent('download', { timeout: 8000 })
  await page.getByRole('button', { name: '导出备份' }).click()
  const download = await downloadPromise
  const exportPath = path.join(outDir, 'functional-backup.json')
  await download.saveAs(exportPath)
  const exportStat = await stat(exportPath)
  assert.ok(exportStat.size > 100)
  check('导出 JSON 备份')

  // Clear all.
  await page.getByRole('button', { name: '打开设置' }).click()
  await page.waitForTimeout(300)
  await page.getByRole('button', { name: '清空全部内容' }).click()
  await page.getByRole('button', { name: '清空全部' }).click()
  await page.waitForTimeout(500)
  plans = await getPlans()
  ideas = await getIdeas()
  assert.equal(plans.length, 0)
  assert.equal(ideas.length, 0)
  check('清空全部数据')

  // Import the backup.
  await page.getByRole('button', { name: '打开设置' }).click()
  await page.waitForTimeout(300)
  await page.locator('input[type="file"]').setInputFiles(exportPath)
  await page.getByText('导入这份备份？').waitFor()
  await page.getByRole('button', { name: '覆盖并导入' }).click()
  await page.waitForTimeout(600)
  plans = await getPlans()
  ideas = await getIdeas()
  assert.equal(plans.length, 7)
  assert.equal(ideas.length, 3)
  check('导入 JSON 备份并覆盖')

  // Manifest.
  const manifest = await page.evaluate(async () => {
    const response = await fetch('./manifest.webmanifest')
    return response.json()
  })
  assert.equal(manifest.name, '结绳 · 把远方拆成今天')
  assert.ok(manifest.icons.some((icon) => icon.sizes === '512x512'))
  check('PWA manifest 可访问')

  await page.getByRole('button', { name: '打开设置' }).click()
  await page.waitForTimeout(300)
  await shot('360-settings.png')
  await page.locator('.settings-developer').scrollIntoViewIfNeeded()
  await page.getByText('tujingsushi', { exact: true }).waitFor()
  await page
    .getByText('github.com/tujingsushi/knot', { exact: true })
    .waitFor()
  await shot('360-settings-developer.png')
  check('开发者信息可见')
  await page.locator('dialog[open]').getByRole('button', { name: '关闭' }).click()
  await page.getByRole('button', { name: '新建', exact: true }).click()
  await page.getByRole('button', { name: /新建规划/ }).click()
  await page.waitForTimeout(300)
  await shot('360-new-plan.png')
  await page.getByRole('button', { name: '关闭' }).click()
  await assertNoHorizontalOverflow('最终规划页')
  check('移动端 360px 布局无横向溢出')

  assert.deepEqual(errors, [])
  check('控制台无错误')

  // Service worker + offline check in a fresh context.
  const pwaContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    locale: 'zh-CN',
    timezoneId: 'Asia/Shanghai',
  })
  const pwaPage = await pwaContext.newPage()
  await pwaPage.goto('http://127.0.0.1:4174/', { waitUntil: 'networkidle' })
  const sw = await pwaPage.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready
    if (!navigator.serviceWorker.controller) {
      await new Promise((resolve) => {
        navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true })
        setTimeout(resolve, 2500)
      })
    }
    return {
      scope: registration.scope,
      active: Boolean(registration.active),
      controlled: Boolean(navigator.serviceWorker.controller),
    }
  })
  assert.equal(sw.active, true)
  assert.ok(sw.scope.includes('4174'))
  check('Service Worker 已激活')
  await pwaPage.reload({ waitUntil: 'networkidle' })
  await pwaContext.setOffline(true)
  await pwaPage.reload({ waitUntil: 'domcontentloaded', timeout: 10000 })
  await pwaPage.getByText('结绳', { exact: true }).first().waitFor({ timeout: 8000 })
  await pwaContext.setOffline(false)
  check('离线重载后应用可启动')

  console.log('\nALL CHECKS PASSED')
  console.log(`${results.length} checks`)
  process.exit(0)
} catch (error) {
  console.error('\nFAILED:', error.message)
  console.error(JSON.stringify({ errors, results }, null, 2))
  try {
    await page.screenshot({ path: path.join(outDir, 'failure.png'), fullPage: true })
  } catch {}
  process.exit(1)
}
