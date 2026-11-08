// Four isolated Chrome contexts against the localhost-only QA API and database.
// Start the local PostgREST, proxy and Vite server before running this script.
import { createHmac } from 'node:crypto'
import { createRequire } from 'node:module'
import { execFileSync } from 'node:child_process'
import assert from 'node:assert/strict'

const require = createRequire(import.meta.url)
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || '/Users/oluwatosinobalana/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')
const chromePath = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const appUrl = process.env.DECKED_QA_URL || 'http://127.0.0.1:5174'
const ids = [1, 2, 3, 4].map(number => 'a' + number + number + number + number + number + number + number + '-'+number+number+number+number+'-4'+number+number+number+'-8'+number+number+number+'-'+number.toString().repeat(12))
const secret = 'decked-local-qa-jwt-secret-2026-11-08-only'
const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url')
const jwt = id => {
  const header = encode({ alg: 'HS256', typ: 'JWT' })
  const payload = encode({ sub: id, role: 'authenticated', aud: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600 })
  return header + '.' + payload + '.' + createHmac('sha256', secret).update(header + '.' + payload).digest('base64url')
}
const dbValue = sql => execFileSync('docker', ['exec', 'decked-spelling-e2e-db', 'psql', '-X', '-At', '-U', 'postgres', '-d', 'postgres', '-c', sql], { encoding: 'utf8' }).trim()
const privateWord = async (page, roomId) => page.evaluate(async roomId => {
  const session = JSON.parse(localStorage.getItem('sb-127-auth-token'))
  const response = await fetch('http://127.0.0.1:54321/rest/v1/rpc/decked_get_spelling_word', {
    method: 'POST',
    headers: { authorization: 'Bearer ' + session.access_token, apikey: 'local-qa', 'content-type': 'application/json' },
    body: JSON.stringify({ p_room_id: roomId }),
  })
  if (!response.ok) throw new Error('Private word RPC failed: ' + await response.text())
  return response.json()
}, roomId)

const browser = await chromium.launch({ executablePath: chromePath, headless: true })
try {
  const clients = []
  for (const [index, id] of ids.entries()) {
    const context = await browser.newContext({ viewport: { width: index === 3 ? 390 : 1280, height: index === 3 ? 844 : 900 } })
    const accessToken = jwt(id)
    await context.addInitScript(({ id, accessToken }) => {
      const user = { id, aud: 'authenticated', role: 'authenticated', is_anonymous: true, app_metadata: { provider: 'anonymous', providers: ['anonymous'] }, user_metadata: {} }
      localStorage.setItem('sb-127-auth-token', JSON.stringify({ access_token: accessToken, refresh_token: 'local-only', token_type: 'bearer', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, user }))
    }, { id, accessToken })
    const page = await context.newPage()
    await page.goto(appUrl + '/play-together?game=spelling-bee')
    await page.getByRole('button', { name: 'CREATE A GAME' }).waitFor({ timeout: 15_000 })
    clients.push({ context, page, id })
    console.log('Client ' + (index + 1) + ' opened the Spelling Bee multiplayer entry')
  }
  const host = clients[0].page
  await host.getByRole('button', { name: 'CREATE A GAME' }).click()
  await host.getByRole('textbox', { name: 'Your display name' }).fill('QA Host')
  const createdResponse = host.waitForResponse(response => response.url().includes('/rpc/decked_create_room'))
  await host.getByRole('button', { name: 'CREATE ROOM' }).click()
  const created = await (await createdResponse).json()
  if (!created?.room?.id || !created?.room?.code) throw new Error('Room creation failed: ' + JSON.stringify(created))
  console.log('Created local room ' + created.room.code)
  for (const [index, client] of clients.slice(1).entries()) {
    await client.page.getByRole('button', { name: 'JOIN A GAME' }).click()
    await client.page.getByRole('textbox', { name: 'Your display name' }).fill('QA Player ' + (index + 2))
    await client.page.getByRole('textbox', { name: 'Room code' }).fill(created.room.code)
    const joinedResponse = client.page.waitForResponse(response => response.url().includes('/rpc/decked_join_room'))
    await client.page.getByRole('button', { name: 'JOIN ROOM' }).click()
    const joined = await (await joinedResponse).json()
    if (joined?.room?.id !== created.room.id) throw new Error('Client did not join the local room: ' + JSON.stringify(joined))
    console.log('Client ' + (index + 2) + ' joined local room')
  }
  await host.reload()
  await host.getByRole('button', { name: 'SET UP GAME' }).waitFor({ timeout: 15_000 })
  console.log('Host sees four players: ' + (await host.locator('body').innerText()).includes('QA Player 4'))
  await host.getByRole('button', { name: 'SET UP GAME' }).click()
  await host.getByRole('group', { name: 'Spelling levels' }).getByRole('button', { name: /EASY/ }).click()
  await host.getByRole('group', { name: 'Spelling levels' }).getByRole('button', { name: /MEDIUM/ }).click()
  await host.getByRole('button', { name: 'NEXT' }).click()
  await host.getByRole('button', { name: '+ ADD TEAM' }).click()
  await host.getByRole('button', { name: '+ ADD TEAM' }).click()
  await host.getByRole('textbox', { name: 'Team 1 name' }).fill('Alpha')
  await host.getByRole('textbox', { name: 'Team 2 name' }).fill('Beta')
  await host.getByRole('button', { name: 'ASSIGN PLAYERS' }).click()
  for (const [index, name] of ['QA Host', 'QA Player 2', 'QA Player 3', 'QA Player 4'].entries()) {
    await host.getByRole('button', { name: 'Choose team for ' + name }).click()
    await host.getByRole('dialog').getByRole('button', { name: index < 2 ? 'Alpha' : 'Beta' }).click()
  }
  await host.getByRole('button', { name: 'NEXT' }).click()
  await host.getByPlaceholder('ENTER SECONDS').fill('20')
  await host.getByRole('button', { name: 'NEXT' }).click()
  await host.getByRole('spinbutton', { name: 'Number of rounds per team' }).fill('2')
  const startedResponse = host.waitForResponse(response => response.url().includes('/rpc/decked_start_spelling_game'))
  await host.getByRole('button', { name: 'START GAME' }).click()
  const started = await startedResponse
  if (started.status() !== 204) throw new Error('Game start failed: ' + started.status() + ' ' + await started.text())
  await host.getByRole('button', { name: 'START TURN' }).waitFor({ timeout: 15_000 })
  console.log('Game started with two teams and two rounds')
  const roomId = created.room.id
  const levels = dbValue("select string_agg(entry.value->>'level',',' order by entry.ordinality) from public.decked_spelling_secrets s cross join lateral jsonb_array_elements(s.deck) with ordinality entry(value,ordinality) where s.room_id='" + roomId + "'").split(',')
  assert.equal(levels.length, 4)
  assert.equal(levels[0], levels[1])
  assert.equal(levels[2], levels[3])
  assert.notEqual(levels[0], levels[2])
  assert.deepEqual(new Set(levels), new Set(['1', '2']))
  console.log('Server deck rotates Easy and Medium across equal-difficulty team rounds')
  await Promise.all(clients.slice(1).map(async client => {
    await client.page.reload()
    await client.page.getByText('TURN 1 / 4').waitFor({ timeout: 15_000 })
  }))
  await host.getByRole('button', { name: 'START TURN' }).click()
  await host.getByRole('textbox', { name: 'Spell aloud, then enter the word' }).waitFor()
  const hostPrivate = await privateWord(host, roomId)
  assert.equal(hostPrivate.word, null)
  assert.ok(hostPrivate.audio_id)
  assert.ok(hostPrivate.definition)
  for (const client of clients.slice(1)) {
    const hidden = await privateWord(client.page, roomId)
    assert.equal(hidden.word, null)
    assert.equal(hidden.audio_id, null)
    assert.equal(hidden.definition, null)
    assert.equal(await client.page.getByRole('textbox', { name: 'Spell aloud, then enter the word' }).count(), 0)
  }
  console.log('Only the active speller receives audio and clues before reveal')
  const firstWord = dbValue("select deck->0->>'word' from public.decked_spelling_secrets where room_id='" + roomId + "'")
  await host.getByRole('textbox', { name: 'Spell aloud, then enter the word' }).fill(firstWord)
  await host.getByRole('button', { name: 'CHECK SPELLING' }).click()
  await host.getByText('CORRECT!').waitFor({ timeout: 10_000 })
  console.log('Turn 1: correct answer scored for Alpha')
  await host.getByRole('button', { name: 'NEXT TURN' }).click()
  const third = clients[2].page
  await third.reload()
  await third.getByText('TURN 2 / 4').waitFor({ timeout: 15_000 })
  await third.getByRole('button', { name: 'START TURN' }).click()
  await third.getByRole('textbox', { name: 'Spell aloud, then enter the word' }).waitFor()
  const secondSpellerPrivate = await privateWord(third, roomId)
  assert.ok(secondSpellerPrivate.audio_id)
  assert.equal(secondSpellerPrivate.word, null)
  const hostAsOpponent = await privateWord(host, roomId)
  assert.equal(hostAsOpponent.audio_id, null)
  await third.getByRole('textbox', { name: 'Spell aloud, then enter the word' }).fill('incorrectword')
  await third.getByRole('button', { name: 'CHECK SPELLING' }).click()
  await third.getByText('NO POINT').waitFor({ timeout: 10_000 })
  console.log('Turn 2: incorrect answer scored zero for Beta')
  await third.getByRole('button', { name: 'NEXT TURN' }).click()
  const secondClient = clients[1]
  await secondClient.page.close()
  secondClient.page = await secondClient.context.newPage()
  await secondClient.page.goto(appUrl + '/play-together?game=spelling-bee')
  await secondClient.page.getByText('TURN 3 / 4').waitFor({ timeout: 15_000 })
  await secondClient.page.getByRole('button', { name: 'START TURN' }).click()
  await secondClient.page.getByRole('textbox', { name: 'Spell aloud, then enter the word' }).waitFor()
  assert.ok((await privateWord(secondClient.page, roomId)).audio_id)
  console.log('Turn 3: second Alpha speller reconnected with the same session')
  await secondClient.page.getByText('NO POINT').waitFor({ timeout: 35_000 })
  console.log('Turn 3: server timeout scored zero')
  await secondClient.page.getByRole('button', { name: 'NEXT TURN' }).click()
  const fourth = clients[3].page
  await fourth.reload()
  await fourth.getByText('TURN 4 / 4').waitFor({ timeout: 15_000 })
  await fourth.getByRole('button', { name: 'START TURN' }).click()
  await fourth.getByRole('textbox', { name: 'Spell aloud, then enter the word' }).fill('incorrectword')
  await fourth.getByRole('button', { name: 'CHECK SPELLING' }).click()
  await fourth.getByText('NO POINT').waitFor({ timeout: 10_000 })
  await fourth.getByRole('button', { name: 'SEE RESULTS' }).click()
  await fourth.getByText('WINNER: ALPHA').waitFor({ timeout: 15_000 })
  await fourth.screenshot({ path: new URL('../docs/qa/assets/spelling-bee-four-browser-final-2026-11-08.png', import.meta.url).pathname, fullPage: true })
  console.log('Final result: Alpha wins after four turns')
  const finalState = dbValue("select status||'|'||(game_state->'session'->'sp_scores')::text||'|'||(game_state->'session'->>'sp_phase') from public.decked_rooms where id='" + roomId + "'")
  assert.equal(finalState, 'finished|[1, 0]|done')
  console.log('Database final state reconciled: ' + finalState)
  await Promise.all(clients.map(client => client.context.close()))
} finally {
  await browser.close()
}
