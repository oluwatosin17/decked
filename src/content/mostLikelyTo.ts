export type MostLikelyCategory = 'party' | 'friends' | 'couples' | 'everyday' | 'adventure' | 'bold'

const combine = (starts: readonly string[], finishes: readonly string[]) =>
  starts.flatMap(start => finishes.map(finish => `Who’s most likely to ${start} ${finish}?`))

export const MOST_LIKELY_PROMPTS: Record<MostLikelyCategory, string[]> = {
  party: combine([
    'at a party, be the first person to', 'during a quiet night out, suddenly', 'when the music starts, confidently',
    'in a room full of strangers, happily', 'after one burst of confidence, unexpectedly',
    'when the group needs energy, volunteer to', 'before anyone else is ready, decide to',
    'while everyone is watching, boldly', 'near the end of the night, still',
    'the next morning, admit they tried to',
  ], [
    'start a dance floor', 'organise an unplanned after-party', 'invent a ridiculous group challenge',
    'befriend someone they met five minutes ago', 'give a dramatic speech nobody requested',
  ]),
  friends: combine([
    'in the friend group, always', 'when a friend is having a hard week, quietly',
    'while planning the next group trip, naturally', 'after borrowing something, genuinely',
    'when somebody says “I’m fine,” immediately', 'years after an inside joke began, still',
    'when the group needs honesty, bravely', 'without being asked, reliably',
    'during a disagreement, eventually', 'with everyone’s trust, confidently',
  ], [
    'remember the detail everyone else forgot', 'show up with exactly the right support',
    'turn the moment into a story worth retelling', 'take charge and make a fair plan',
    'say what the whole group needs to hear',
  ]),
  couples: combine([
    'in a relationship, lovingly', 'after a small disagreement, sincerely',
    'when planning a date, secretly', 'on an ordinary evening, effortlessly',
    'when their partner feels low, instinctively', 'while sharing a home, regularly',
    'before a special anniversary, carefully', 'during a spontaneous weekend, happily',
    'in a sweet message, openly', 'when nobody else is watching, quietly',
  ], [
    'create a new favourite memory', 'make their partner laugh at the perfect time',
    'solve a problem before it is mentioned', 'prove they remember the smallest details',
    'turn a simple plan into an unexpected adventure',
  ]),
  everyday: combine([
    'before breakfast, somehow', 'while getting ready to leave, usually',
    'during a quick errand, accidentally', 'when choosing what to eat, inevitably',
    'after checking one notification, easily', 'while trying to be organised, ironically',
    'when learning one simple fact, enthusiastically', 'on an otherwise normal day, unexpectedly',
    'when everyone is waiting, casually', 'while solving a small problem, cleverly',
  ], [
    'end up running late', 'discover something unexpectedly useful', 'change their mind at the last second',
    'make everyone wait for the full story', 'create another task for themselves',
  ]),
  adventure: combine([
    'when offered a one-way ticket, boldly', 'to chase a long-held dream, patiently',
    'after learning a completely new skill, proudly', 'in an unfamiliar city, quickly',
    'with one wild idea, determinedly', 'when the group needs a leader, confidently',
    'before knowing every detail, courageously', 'after getting lost on a trip, somehow',
    'with an unusual hidden talent, unexpectedly', 'over the next ten years, gradually',
  ], [
    'build the life they imagined', 'create a story worth telling', 'meet people they never expected',
    'solve a difficult problem in their own way', 'discover what they are truly capable of',
  ]),
  bold: combine([
    'after feeling instant chemistry, confidently', 'in a flirty group chat, daringly',
    'when their biggest crush walks in, visibly', 'on a date that is going nowhere, honestly',
    'after falling for someone unexpected, openly', 'during a secret romance, successfully',
    'when everyone senses the tension, finally', 'after deciding exactly what they want, directly',
    'the morning after a surprising night, calmly', 'when attraction becomes impossible to ignore, boldly',
  ], [
    'make the first move', 'send the message everyone else would overthink',
    'tell the truth even if it complicates the story', 'take a chance that works out better than expected',
    'create a moment mentioned at every future party',
  ]),
}

export const MOST_LIKELY_CATEGORIES: Array<{ id: MostLikelyCategory; label: string; description: string; adult?: boolean }> = [
  { id: 'party', label: 'Party', description: 'Big personalities and chaotic nights' },
  { id: 'friends', label: 'Friends', description: 'Inside jokes, loyalty, and group history' },
  { id: 'couples', label: 'Couples', description: 'Romance, routines, and knowing each other' },
  { id: 'everyday', label: 'Everyday', description: 'Habits everyone recognises' },
  { id: 'adventure', label: 'Big Moves', description: 'Dreams, risks, and future stories' },
  { id: 'bold', label: 'After Dark', description: 'Flirty and revealing', adult: true },
]

export const MOST_LIKELY_DECK = Object.values(MOST_LIKELY_PROMPTS).flat()
