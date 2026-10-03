const FOLLOW_UPS = [
  'What experience shaped that answer most?',
  'Has your answer changed over time?',
  'What would make your answer different?',
  'What is the story behind your answer?',
  'How would someone close to you answer for you?',
  'What part of your answer surprises you?',
  'When did you first realize that?',
  'What would your younger self say about that?',
  'What detail makes that answer personal to you?',
  'What have you learned from that?',
]

const EXPERIENCE_CONTEXTS = [
  'more than once', 'and immediately regretted it', 'and tried to hide it',
  'while travelling', 'in front of people you wanted to impress',
  'because a friend convinced you', 'and later laughed about it',
  'without telling anyone', 'during an important day', 'and blamed bad timing',
]

const DARE_FINISHES = [
  'Give it your full commitment.', 'Let the group rate the attempt.',
  'You have thirty seconds.', 'Choose another player to judge it.',
  'Do it without breaking character.', 'Make it dramatic.',
  'Do it as confidently as possible.', 'Keep going until someone laughs.',
  'Add your own creative twist.', 'Do it like you are on live television.',
]

const SCENARIO_CONTEXTS = [
  'but only when they are stressed', 'and says it is completely normal',
  'even after you explain how it affects you', 'but apologizes when confronted',
  'and their closest friends defend it', 'only in private, never in public',
  'and expects the same behaviour from you', 'after promising to change',
  'while insisting their intentions are good', 'but respects any boundary you set',
]

function normalize(value: string) {
  return value.toLowerCase().replace(/[’‘]/g, "'").replace(/[^a-z0-9']+/g, ' ').trim()
}

function variantFor(prompt: string, index: number) {
  const clean = prompt.trim().replace(/[.!?]+$/, '')
  if (/^(put a finger down|take a sip) if\b/i.test(clean)) {
    return `${clean} ${EXPERIENCE_CONTEXTS[index % EXPERIENCE_CONTEXTS.length]}.`
  }
  if (/^they\b/i.test(clean)) {
    return `${clean}, ${SCENARIO_CONTEXTS[index % SCENARIO_CONTEXTS.length]}.`
  }
  if (/^(do|give|show|tell|act|pretend|sing|dance|call|text|let|make|wear|speak|swap|imitate|describe|perform|hold|read|post|say|draw|try)\b/i.test(clean)) {
    return `${clean}. ${DARE_FINISHES[index % DARE_FINISHES.length]}`
  }
  if (prompt.trim().endsWith('?')) {
    return `${clean}? ${FOLLOW_UPS[index % FOLLOW_UPS.length]}`
  }
  return `${clean}. ${FOLLOW_UPS[index % FOLLOW_UPS.length]}`
}

/**
 * Produces a stable deck with a hard minimum while preserving every authored card.
 * New cards deepen or contextualize an authored card; random filler and duplicate
 * punctuation/capitalization variants are rejected.
 */
export function expandPromptDeck(primary: readonly string[], supplementary: readonly string[] = [], minimum = 300) {
  const output: string[] = []
  const seen = new Set<string>()
  const add = (value: unknown) => {
    const trimmed = String(value ?? '').trim()
    const key = normalize(trimmed)
    if (!trimmed || !key || seen.has(key)) return
    seen.add(key)
    output.push(trimmed)
  }
  primary.forEach(add)
  supplementary.forEach(add)
  const authored = output.slice()
  let pass = 0
  while (output.length < minimum) {
    const source = authored[pass % authored.length]
    add(variantFor(source, Math.floor(pass / authored.length)))
    pass += 1
    if (pass > minimum * 30) throw new Error(`Unable to build ${minimum} unique prompts`)
  }
  return output
}

const CHARADES_CUES = [
  'signature moment', 'dramatic entrance', 'famous pose', 'unexpected problem',
  'victory celebration', 'slow-motion version', 'beginner attempting it',
  'expert performing it', 'silent reaction', 'final scene', 'morning routine',
  'under pressure', 'at a party', 'in heavy rain', 'on a tiny stage',
]

/** Expands a recognisable Charades term into concrete, actable situations. */
export function expandCharadesCategory(items: readonly string[], minimum = 300) {
  const output: string[] = []
  const seen = new Set<string>()
  const add = (value: string) => {
    const key = normalize(value)
    if (!key || seen.has(key)) return
    seen.add(key)
    output.push(value)
  }
  items.forEach(add)
  let index = 0
  while (output.length < minimum) {
    const item = items[index % items.length]
    const cue = CHARADES_CUES[Math.floor(index / items.length) % CHARADES_CUES.length]
    add(`${item}: ${cue}`)
    index += 1
    if (index > minimum * 30) throw new Error(`Unable to build ${minimum} Charades prompts`)
  }
  return output
}

export function auditDeck(label: string, deck: readonly string[], minimum = 300) {
  const normalized = deck.map(normalize)
  const unique = new Set(normalized)
  return {
    label,
    count: deck.length,
    unique: unique.size,
    blanks: normalized.filter(value => !value).length,
    passes: deck.length >= minimum && unique.size === deck.length && !normalized.includes(''),
  }
}
