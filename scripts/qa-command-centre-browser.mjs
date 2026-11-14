// Browser smoke for local, provisioned viewer/editor/admin identities.
// Requires the same disposable QA database, local API proxy, and Vite server
// as qa-spelling-four-browser.mjs. Does not connect to production.
import { createHmac } from 'node:crypto'
import { createRequire } from 'node:module'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'

const require = createRequire(import.meta.url)
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || '/Users/oluwatosinobalana/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')
const chromePath = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const appUrl = process.env.DECKED_QA_URL || 'http://127.0.0.1:5174'
const secret = 'decked-local-qa-jwt-secret-2026-11-08-only'
const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url')
const jwt = id => {
  const header = encode({ alg: 'HS256', typ: 'JWT' })
  const payload = encode({ sub: id, role: 'authenticated', aud: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600 })
  return header + '.' + payload + '.' + createHmac('sha256', secret).update(header + '.' + payload).digest('base64url')
}
const staff = [
  { id: 'b1111111-1111-4111-8111-111111111111', role: 'viewer' },
  { id: 'b2222222-2222-4222-8222-222222222222', role: 'editor' },
  { id: 'b3333333-3333-4333-8333-333333333333', role: 'admin' },
]
const sections = ['Overview', 'Acquisition', 'Games', 'Funnels', 'Multiplayer', 'Geography', 'Play Patterns', 'Reliability', 'Content', 'Feedback', 'Settings']
const dbValue = sql => execFileSync('docker', ['exec', 'decked-spelling-e2e-db', 'psql', '-X', '-At', '-U', 'postgres', '-d', 'postgres', '-c', sql], { encoding: 'utf8' }).trim()

const browser = await chromium.launch({ executablePath: chromePath, headless: true })
try {
  for (const account of staff) {
    const context = await browser.newContext({ viewport: { width: account.role === 'viewer' ? 390 : 1280, height: 900 } })
    const accessToken = jwt(account.id)
    await context.addInitScript(({ id, accessToken }) => {
      const user = { id, email: 'qa-' + id.slice(0, 1) + '@local.invalid', aud: 'authenticated', role: 'authenticated', is_anonymous: false, app_metadata: { provider: 'email', providers: ['email'] }, user_metadata: {} }
      localStorage.setItem('decked:command-centre:auth:v1', JSON.stringify({ access_token: accessToken, refresh_token: 'local-only', token_type: 'bearer', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, user }))
    }, { id: account.id, accessToken })
    const page = await context.newPage()
    const failedRpc = []
    page.on('response', response => {
      if (response.url().includes('/rpc/') && response.status() >= 400) failedRpc.push(response.url().split('/rpc/')[1] + ':' + response.status())
    })
    await page.goto(appUrl + '/command-centre')
    await page.getByRole('navigation', { name: 'Command Centre' }).waitFor({ timeout: 15_000 })
    assert.equal(await page.locator('.cc-account span').innerText(), account.role.toUpperCase())
    for (const label of sections) {
      await page.getByRole('navigation', { name: 'Command Centre' }).getByRole('button', { name: label, exact: true }).click()
      await page.waitForTimeout(350)
      assert.equal(await page.getByRole('navigation', { name: 'Command Centre' }).getByRole('button', { name: label, exact: true }).getAttribute('aria-current'), 'page')
    }
    if (account.role === 'admin') {
      await page.getByRole('navigation', { name: 'Command Centre' }).getByRole('button', { name: 'Games' }).click()
      const spellingRow = page.getByRole('row').filter({ has: page.getByRole('button', { name: 'Spelling Bee', exact: true }) })
      await spellingRow.waitFor({ timeout: 15_000 })
      const cells = await spellingRow.locator('td').allInnerTexts()
      const sessions = Number(dbValue("select count(*) from public.analytics_game_sessions where game_id='spelling-bee' and started_at is not null and environment='production'"))
      const completed = Number(dbValue("select count(*) from public.analytics_game_sessions where game_id='spelling-bee' and status='completed' and environment='production'"))
      assert.equal(Number(cells[4]), sessions)
      assert.equal(Number.parseFloat(cells[7]), Math.round(1000 * completed / sessions) / 10)
      console.log('admin Games: displayed Spelling Bee multiplayer starts ' + cells[4] + ' match database sessions ' + sessions)
      const downloadEvent = page.waitForEvent('download', { timeout: 20_000 })
      await page.getByRole('button', { name: 'Export games CSV' }).click()
      const download = await downloadEvent
      const csv = readFileSync(await download.path(), 'utf8')
      assert.ok(csv.includes('spelling-bee'))
      console.log('admin Games: CSV export includes Spelling Bee')
      await page.getByRole('navigation', { name: 'Command Centre' }).getByRole('button', { name: 'Settings' }).click()
      await page.locator('.cc-table').getByText('report exported', { exact: true }).first().waitFor({ timeout: 15_000 })
      console.log('admin Settings: export recorded in audit log')
    }
    await page.getByRole('navigation', { name: 'Command Centre' }).getByRole('button', { name: 'Content' }).click()
    await page.waitForTimeout(1000)
    await page.locator('.cc-content-game-card').filter({ hasText: 'Spelling Bee' }).click()
    await page.getByRole('button', { name: 'All games' }).waitFor()
    if (account.role === 'viewer') {
      assert.equal(await page.getByRole('button', { name: 'Upload JSON' }).count(), 0)
      assert.equal(await page.getByRole('button', { name: 'Publish Spelling Bee' }).count(), 0)
    } else {
      assert.equal(await page.getByRole('button', { name: 'Upload JSON' }).count(), 1)
      assert.equal(await page.getByRole('button', { name: 'Publish Spelling Bee' }).count(), 1)
    }
    if (account.role === 'editor') {
      await page.getByLabel('Upload content JSON').setInputFiles(new URL('../docs/qa/spelling-bee-candidate/command-centre-draft-import.json', import.meta.url).pathname)
      const dialog = page.getByRole('dialog', { name: 'Review content upload' })
      await dialog.waitFor({ timeout: 20_000 })
      assert.match(await dialog.innerText(), /934 need editorial review/)
      await dialog.getByRole('button', { name: 'Import 934 cards' }).click()
      await page.getByText(/Imported 934 cards as drafts/).waitFor({ timeout: 30_000 })
      await page.getByRole('button', { name: 'Publish Spelling Bee' }).click()
      await page.getByText(/Spelling Bee release held/).waitFor({ timeout: 20_000 })
      console.log('editor: 934 local drafts imported; publication held pending review and audio')
      const beforeVersion = Number(dbValue("select current_version from public.content_items i join public.content_item_versions v on v.item_id=i.id and v.version=i.current_version where i.game_id='spelling-bee' and v.body='river'"))
      await page.locator('.cc-content-category-grid button').filter({ hasText: 'Easy' }).click()
      await page.getByRole('textbox', { name: 'Search' }).fill('river')
      await page.getByRole('button', { name: 'river', exact: true }).waitFor({ timeout: 15_000 })
      await page.getByRole('button', { name: 'river', exact: true }).click()
      const editor = page.getByRole('dialog', { name: 'Create a new draft version' })
      await editor.getByRole('textbox', { name: 'Definition' }).fill('A natural stream of water flowing across land in a channel.')
      await editor.getByRole('textbox', { name: 'Change note' }).fill('Local browser QA revision')
      await editor.getByRole('button', { name: 'Save draft' }).click()
      await page.getByText(/Draft saved/).waitFor({ timeout: 15_000 })
      const afterVersion = Number(dbValue("select current_version from public.content_items i join public.content_item_versions v on v.item_id=i.id and v.version=i.current_version where i.game_id='spelling-bee' and v.body='river'"))
      assert.equal(afterVersion, beforeVersion + 1)
      console.log('editor: river draft revision advanced from v' + beforeVersion + ' to v' + afterVersion)
    }
    if (account.role === 'admin') {
      await page.locator('.cc-content-category-grid button').filter({ hasText: 'Easy' }).waitFor({ timeout: 15_000 })
      await page.screenshot({ path: new URL('../docs/qa/assets/spelling-bee-command-centre-2026-11-08.png', import.meta.url).pathname, fullPage: true })
    }
    console.log(account.role + ': 11 sections navigable; RPC failures=' + JSON.stringify([...new Set(failedRpc)]))
    console.log(account.role + ' Content: ' + (await page.locator('.cc-main').innerText()).slice(0, 500).replaceAll('\n', ' | '))
    await context.close()
  }
} finally {
  await browser.close()
}
