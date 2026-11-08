// Start Vite on localhost:5185, then run with an installed Playwright runtime.
import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'

const require = createRequire(import.meta.url)
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || '/Users/oluwatosinobalana/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')
const chromePath = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const baseUrl = process.env.DECKED_QA_URL || 'http://127.0.0.1:5185'
const registry = readFileSync(new URL('../src/gameRegistry.ts', import.meta.url), 'utf8')
const navigation = readFileSync(new URL('../src/navigation.ts', import.meta.url), 'utf8')
const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8')
const gameIds = [...registry.matchAll(/\{ id: '([^']+)', name: '/g)].map(match => match[1])
const destinationKeys = Object.fromEntries([...app.matchAll(/(?:'([^']+)'|([a-z][a-z-]*)): \{ localScreen: '[^']+', multiplayerId: '([^']+)' \}/g)].map(match => [match[3], match[1] || match[2]]))

const browser = await chromium.launch({ executablePath: chromePath, headless: true })
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto(baseUrl + '/games')
  await page.getByRole('button', { name: 'Icebreakers' }).waitFor()
  const width = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, inner: innerWidth }))
  assert.equal(width.scroll, width.inner)
  await page.getByRole('button', { name: 'Icebreakers' }).click()
  assert.ok((await page.locator('main').innerText()).length > 100)
  console.log(`Browse mobile width ${width.inner}: no document overflow; category filter rendered`)

  for (const gameId of gameIds) {
    assert.ok(destinationKeys[gameId], `Missing destination for ${gameId}`)
    const routeKey = destinationKeys[gameId]
    const path = [...navigation.matchAll(/(?:'([^']+)'|([a-z][a-z-]*)): '(\/games\/[^']+)'/g)]
      .find(match => (match[1] || match[2]) === routeKey)?.[3]
    assert.ok(path, `Missing route for ${gameId}`)
    const response = await page.goto(baseUrl + path)
    assert.equal(response.status(), 200)
    await page.waitForFunction(() => document.body.innerText.length > 40, null, { timeout: 10000 })
    assert.ok((await page.locator('body').innerText()).length > 40, `Blank route ${gameId}`)
  }
  console.log(`${gameIds.length} canonical game routes loaded on 390px Chrome`)
  for (const [slug, label] of [['read-my-lips', 'Read My Lips'], ['spelling-bee', 'Spelling Bee']]) {
    await page.goto(`${baseUrl}/guides/how-to-play-${slug}`)
    await page.getByText(label, { exact: false }).first().waitFor()
  }
  assert.deepEqual(errors, [])
  console.log('Read My Lips and Spelling Bee guides loaded; no uncaught browser errors')
} finally {
  await browser.close()
}
