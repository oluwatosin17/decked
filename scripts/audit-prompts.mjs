import { createServer } from 'vite'

const MINIMUM = 300
const MAX_CROSS_CATEGORY_REUSE = 0
const NEAR_DUPLICATE_THRESHOLD = 0.82
// This is a conservative lexical smoke test, not a semantic classifier. Most
// well-written category prompts imply their setting without repeating the
// category name, so topic signals only need to appear across a meaningful
// sample of the deck. Editorial review and the zero-reuse checks carry the
// stronger semantic-relevance guarantee.
const MIN_RELEVANCE_RATE = 0.10
const MIN_CARD_LENGTH = 8
const MAX_CARD_LENGTH = 220

const normalize = value => value
  .toLowerCase()
  .replace(/[’‘]/g, "'")
  .replace(/[^a-z0-9']+/g, ' ')
  .trim()

const words = value => new Set(normalize(value).split(' ').filter(word => word.length > 2))

const similarity = (left, right) => {
  const a = words(left)
  const b = words(right)
  if (!a.size || !b.size) return 0
  let intersection = 0
  for (const word of a) if (b.has(word)) intersection += 1
  return intersection / (a.size + b.size - intersection)
}

const SYNTHETIC_MARKERS = [
  /what experience shaped that answer most/i,
  /has your answer changed over time/i,
  /what would make your answer different/i,
  /what is the story behind your answer/i,
  /how would someone close to you answer for you/i,
  /what part of your answer surprises you/i,
  /when did you first realize that/i,
  /what would your younger self say about that/i,
  /what detail makes that answer personal to you/i,
  /what have you learned from that/i,
  /and immediately regretted it/i,
  /and tried to hide it/i,
  /because a friend convinced you/i,
  /and later laughed about it/i,
  /and blamed bad timing/i,
  /give it your full commitment/i,
  /let the group rate the attempt/i,
  /choose another player to judge it/i,
  /do it like you are on live television/i,
  /: (signature moment|dramatic entrance|famous pose|unexpected problem|victory celebration|slow-motion version|beginner attempting it|expert performing it|silent reaction|final scene|morning routine|under pressure|at a party|in heavy rain|on a tiny stage)$/i,
]

const UNSAFE_PATTERNS = [
  /drink (the )?(whole|entire) (bottle|glass)/i,
  /finish (the )?(bottle|glass|drink)/i,
  /take [3-9]|take (three|four|five|six|seven|eight|nine) shots?/i,
  /drive .*after drinking/i,
  /without (their|his|her) (knowledge|consent|permission)/i,
  /post .*without .*permission/i,
  /share .*password/i,
  /show .*private (message|photo|video)/i,
  /contact your ex/i,
  /remove (all|your) clothes/i,
  /play the rest .*naked/i,
  /go skinny dipping/i,
  /clean the house naked/i,
]

const CATEGORY_SIGNALS = {
  school: ['school', 'class', 'teacher', 'student', 'homework', 'exam', 'test', 'lecture', 'campus', 'study', 'assignment', 'grade'],
  work: ['work', 'job', 'boss', 'manager', 'colleague', 'coworker', 'office', 'meeting', 'career', 'client', 'shift', 'salary'],
  travel: ['travel', 'trip', 'flight', 'airport', 'hotel', 'holiday', 'vacation', 'journey', 'train', 'bus', 'country', 'city', 'passport'],
  family: ['family', 'parent', 'mother', 'father', 'mum', 'mom', 'dad', 'sibling', 'brother', 'sister', 'relative', 'childhood', 'home', 'generation', 'tradition', 'shared story', 'belong', 'support', 'care', 'together', 'chosen family'],
  friends: ['friend', 'friendship', 'group chat', 'bestie', 'mate', 'support', 'trust', 'boundary', 'connection', 'belong', 'shared', 'together', 'care', 'listen', 'understand', 'appreciat', 'conflict', 'repair', 'memory', 'laugh'],
  relationships: ['relationship', 'partner', 'date', 'dating', 'romantic', 'love', 'crush', 'ex', 'kiss', 'couple'],
  'first-date': ['date', 'dating', 'first impression', 'attraction', 'chemistry', 'meet', 'relationship', 'romantic', 'preference', 'value', 'communicat', 'curious', 'connection', 'lifestyle', 'hope', 'boundary', 'interest', 'conversation', 'compatib', 'listen'],
  couples: ['partner', 'relationship', 'couple', 'love', 'together', 'romantic', 'affection', 'closeness', 'intimacy', 'care', 'trust', 'connection', 'shared', 'between us'],
  team: ['team', 'work', 'colleague', 'group', 'collaborate', 'project', 'leader', 'feedback'],
  party: ['party', 'dance', 'music', 'group', 'crowd', 'celebrat', 'night out', 'host', 'gathering', 'playful', 'laugh', 'story', 'food', 'debate', 'imagin', 'shared', 'welcome', 'fun'],
  drinking: ['drink', 'sip', 'bar', 'party', 'toast', 'cocktail', 'beer', 'wine'],
  nostalgia: ['childhood', 'younger', 'memory', 'remember', 'grew up', 'school', 'past', 'first', 'old', 'once', 'used to', 'earlier', 'era', 'years ago', 'long ago', 'former', 'then', 'retell', 'history'],
  'green-flags': ['respect', 'kind', 'honest', 'support', 'listen', 'boundary', 'reliable', 'care', 'communicate'],
  // Red flags span communication, reliability, accountability, privacy, reciprocity,
  // shared-space conduct, work conduct, online behavior, ego, and emotional habits.
  // Use behavioral stems rather than only the most severe relationship vocabulary.
  'red-flags': [
    'jealous', 'control', 'lie', 'dishonest', 'disrespect', 'boundary', 'manipulat', 'ignore', 'secret',
    'avoid', 'assum', 'expect', 'blam', 'excuse', 'apolog', 'accountab', 'forgiv', 'guilt', 'denied',
    'promise', 'cancel', 'late', 'forgot', 'unavailable', 'borrow', 'commit', 'credit', 'permission',
    'private', 'confidential', 'gossip', 'pressur', 'refusal', 'entitled', 'embarrass', 'excluded',
    'dismiss', 'resent', 'complain', 'interrupt', 'withheld', 'judg', 'compare', 'reassur', 'punish',
    'vague', 'coldly', 'minimiz', 'insist', 'incompatib', 'insecurity', 'mixed signal', 'double standard',
    'last minute', 'without asking', 'without checking', 'someone else', 'shared', 'unfair', 'selfish',
  ],
}

const mechanicFailures = (game, prompts) => prompts.reduce((count, prompt) => {
  const value = prompt.trim()
  if (game === 'Never Have I Ever' && /\?$/.test(value)) return count + 1
  if (game === 'Red Flag / Green Flag' && !/^they\b/i.test(value)) return count + 1
  if (game === 'Put a Finger Down' && !/^put a finger down if\b/i.test(value)) return count + 1
  if (game === 'Take a Sip' && !/^take a sip if\b/i.test(value)) return count + 1
  const isOpenEndedConversationPrompt = /\?$/.test(value)
    || /^(tell|describe|design|imagine|share|name|explain|picture|create|choose|recall|offer|invent|pick)\b/i.test(value)
  if (['Late Night Talks', 'Dinner Table', 'Icebreaker', 'Everyday Conversations', "Let's Reconnect", 'Strangers'].includes(game) && !isOpenEndedConversationPrompt) return count + 1
  if (game === 'Charades' && value.split(/\s+/).length > 12) return count + 1
  return count
}, 0)

const relevanceFailures = (category, prompts) => {
  const key = category.split('/').at(-1)
  const signals = CATEGORY_SIGNALS[key]
  if (!signals) return { failures: 0, rate: 1 }
  const relevant = prompts.filter(prompt => signals.some(signal => normalize(prompt).includes(normalize(signal)))).length
  return { failures: prompts.length - relevant, rate: relevant / prompts.length }
}

const findNearDuplicates = prompts => {
  const matches = []
  for (let i = 0; i < prompts.length; i += 1) {
    for (let j = i + 1; j < prompts.length; j += 1) {
      const left = normalize(prompts[i])
      const right = normalize(prompts[j])
      if (Math.min(left.length, right.length) < 24) continue
      const lengthRatio = Math.min(left.length, right.length) / Math.max(left.length, right.length)
      if (lengthRatio < 0.72) continue
      if (similarity(left, right) >= NEAR_DUPLICATE_THRESHOLD) {
        matches.push([i + 1, j + 1])
        if (matches.length >= 10) return matches
      }
    }
  }
  return matches
}

const server = await createServer({
  appType: 'custom',
  logLevel: 'silent',
  server: { middlewareMode: true, hmr: false },
})

try {
  const { AUDITED_DECKS } = await server.ssrLoadModule('/src/content/deckRegistry.ts')
  const ownership = new Map()

  for (const deck of AUDITED_DECKS) {
    const owner = `${deck.game} / ${deck.category}`
    for (const prompt of deck.prompts) {
      const key = normalize(prompt)
      if (!key) continue
      const owners = ownership.get(key) ?? new Set()
      owners.add(owner)
      ownership.set(key, owners)
    }
  }

  const rows = AUDITED_DECKS.map(({ game, category, prompts }) => {
    const normalized = prompts.map(normalize)
    const exactDuplicates = normalized.length - new Set(normalized).size
    const blanks = normalized.filter(value => !value).length
    const synthetic = prompts.filter(prompt => SYNTHETIC_MARKERS.some(marker => marker.test(prompt))).length
    const nearDuplicates = findNearDuplicates(prompts)
    const reusedPrompts = [...new Set(normalized)].filter(prompt => (ownership.get(prompt)?.size ?? 0) > 1)
    const reused = reusedPrompts.length
    const malformed = prompts.filter(prompt => {
      const value = prompt.trim()
      if (game === 'Charades') {
        return value.length < 2 || value.length > 100 || value.split(/\s+/).length > 12
      }
      return value.length < MIN_CARD_LENGTH || value.length > MAX_CARD_LENGTH
    }).length
    const unsafe = prompts.filter(prompt => UNSAFE_PATTERNS.some(pattern => pattern.test(prompt))).length
    const mechanic = mechanicFailures(game, prompts)
    const relevance = relevanceFailures(category, prompts)
    const failures = []
    if (prompts.length !== MINIMUM) failures.push(`count ${prompts.length}/${MINIMUM}`)
    if (exactDuplicates) failures.push(`${exactDuplicates} exact duplicates`)
    if (nearDuplicates.length) failures.push(`${nearDuplicates.length}+ near duplicates`)
    if (synthetic) failures.push(`${synthetic} synthetic variants`)
    if (reused > MAX_CROSS_CATEGORY_REUSE) failures.push(`${reused} reused across categories`)
    if (blanks) failures.push(`${blanks} blank cards`)
    if (malformed) failures.push(`${malformed} malformed-length cards`)
    if (unsafe) failures.push(`${unsafe} unsafe/coercive cards`)
    if (mechanic) failures.push(`${mechanic} mechanic-format violations`)
    if (relevance.rate < MIN_RELEVANCE_RATE) failures.push(`${relevance.failures} off-category cards (${Math.round(relevance.rate * 100)}% relevant)`)
    return {
      game,
      category,
      count: prompts.length,
      exact: exactDuplicates,
      near: nearDuplicates.length,
      synthetic,
      reused,
      mechanic,
      relevance: `${Math.round(relevance.rate * 100)}%`,
      unsafe,
      status: failures.length ? 'FAIL' : 'PASS',
      failures,
      reusedPrompts,
    }
  })

  console.table(rows.map(({ failures: _failures, reusedPrompts: _reusedPrompts, ...row }) => row))
  const failed = rows.filter(row => row.status === 'FAIL')
  for (const row of failed) {
    console.error(`FAIL ${row.game} / ${row.category}: ${row.failures.join('; ')}`)
    for (const prompt of row.reusedPrompts.slice(0, 5)) {
      console.error(`  REUSED "${prompt}" -> ${[...(ownership.get(prompt) ?? [])].join(', ')}`)
    }
  }
  console.log(`\n${rows.length} decks checked; ${rows.length - failed.length} passed; ${failed.length} failed.`)
  if (failed.length) process.exitCode = 1
} finally {
  await server.close()
}
