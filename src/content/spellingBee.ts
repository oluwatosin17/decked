export interface SpellingWord { word: string; definition: string; sentence: string; level: 1 | 2 | 3; variants?: readonly string[] }
export type SpellingLevel = 1 | 2 | 3
import { acceptsSpelling, maxFairSpellingRounds, selectFairSpellingDeck } from './spellingSelection'
export const SPELLING_LEVELS: readonly { id: SpellingLevel; label: string; description: string }[] = [
  { id: 1, label: 'EASY', description: 'Familiar words' },
  { id: 2, label: 'MEDIUM', description: 'A little trickier' },
  { id: 3, label: 'HARD', description: 'For word lovers' },
]

// Short, unambiguous words with reviewed clues. The answer is shown only to the reader.
export const SPELLING_WORDS: readonly SpellingWord[] = [
  { word: 'lantern', definition: 'A portable light with a protective case.', sentence: 'We carried a lantern into the garden.', level: 1 },
  { word: 'puzzle', definition: 'A problem or game solved by thinking.', sentence: 'The final puzzle took us ten minutes.', level: 1 },
  { word: 'blanket', definition: 'A warm covering used on a bed.', sentence: 'She brought a blanket to the picnic.', level: 1 },
  { word: 'basket', definition: 'A container woven from strips of material.', sentence: 'The basket was full of fruit.', level: 1 },
  { word: 'festival', definition: 'A celebration with events or performances.', sentence: 'Our town hosts a music festival.', level: 1 },
  { word: 'journey', definition: 'An act of travelling from one place to another.', sentence: 'Their journey began at sunrise.', level: 1 },
  { word: 'thunder', definition: 'The sound made by a lightning storm.', sentence: 'We heard thunder after the flash.', level: 1 },
  { word: 'whisper', definition: 'To speak very softly.', sentence: 'Please whisper while the baby sleeps.', level: 1 },
  { word: 'diamond', definition: 'A very hard clear gemstone.', sentence: 'The ring held a small diamond.', level: 1 },
  { word: 'cinnamon', definition: 'A sweet, warm spice from tree bark.', sentence: 'She added cinnamon to the tea.', level: 1 },
  { word: 'treasure', definition: 'Something valuable that is kept or found.', sentence: 'The children searched for treasure.', level: 1 },
  { word: 'calendar', definition: 'A chart showing days, weeks and months.', sentence: 'Mark the date on the calendar.', level: 1 },
  { word: 'adventure', definition: 'An exciting or unusual experience.', sentence: 'The trip became an adventure.', level: 2 },
  { word: 'silhouette', definition: 'A dark outline of a person or object.', sentence: 'Her silhouette appeared in the doorway.', level: 2 },
  { word: 'occasion', definition: 'A particular event or time.', sentence: 'We dressed up for the occasion.', level: 2 },
  { word: 'rhythm', definition: 'A repeated pattern of sounds or movements.', sentence: 'The drummer kept a steady rhythm.', level: 2 },
  { word: 'mischief', definition: 'Playful troublemaking.', sentence: 'The puppy was full of mischief.', level: 2 },
  { word: 'restaurant', definition: 'A place where meals are served to customers.', sentence: 'They met at a new restaurant.', level: 2 },
  { word: 'boulevard', definition: 'A broad street, often lined with trees.', sentence: 'The parade moved down the boulevard.', level: 2 },
  { word: 'exaggerate', definition: 'To describe something as bigger or greater than it is.', sentence: 'Do not exaggerate the size of the fish.', level: 2 },
  { word: 'conscience', definition: 'A sense of what is right and wrong.', sentence: 'His conscience told him to apologise.', level: 2 },
  { word: 'courteous', definition: 'Polite and considerate.', sentence: 'The host was courteous to every guest.', level: 2 },
  { word: 'persuade', definition: 'To convince someone to do or believe something.', sentence: 'She tried to persuade us to stay.', level: 2 },
  { word: 'necessary', definition: 'Needed for a purpose.', sentence: 'A ticket is necessary for entry.', level: 2 },
  { word: 'accommodate', definition: 'To make room for someone or something.', sentence: 'The hall can accommodate fifty guests.', level: 3 },
  { word: 'entrepreneur', definition: 'A person who starts and runs a business.', sentence: 'The entrepreneur opened a bakery.', level: 3 },
  { word: 'bureaucracy', definition: 'A system of administration with many rules and offices.', sentence: 'The paperwork took longer because of bureaucracy.', level: 3 },
  { word: 'conscientious', definition: 'Careful to do things thoroughly and well.', sentence: 'She is a conscientious organiser.', level: 3 },
  { word: 'resilience', definition: 'The ability to recover from difficulty.', sentence: 'Their resilience impressed the whole team.', level: 3 },
  { word: 'onomatopoeia', definition: 'A word that imitates a sound.', sentence: 'Buzz is an example of onomatopoeia.', level: 3 },
  { word: 'idiosyncrasy', definition: 'An unusual habit or feature of a person.', sentence: 'That little dance is his idiosyncrasy.', level: 3 },
  { word: 'chrysanthemum', definition: 'A flowering plant with many narrow petals.', sentence: 'A yellow chrysanthemum grew by the gate.', level: 3 },
  { word: 'miscellaneous', definition: 'Made up of different kinds of things.', sentence: 'The box held miscellaneous supplies.', level: 3 },
  { word: 'quintessential', definition: 'The most typical example of something.', sentence: 'That song is quintessential party music.', level: 3 },
  { word: 'indispensable', definition: 'So useful that it cannot be done without.', sentence: 'Her help was indispensable.', level: 3 },
  { word: 'fluorescent', definition: 'Giving off light after absorbing radiation.', sentence: 'The fluorescent sign glowed above the door.', level: 3 },
]

let runtimeWords: readonly SpellingWord[] = SPELLING_WORDS

export function getSpellingWords(): readonly SpellingWord[] { return runtimeWords }
export function setManagedSpellingWords(words: readonly SpellingWord[]) { runtimeWords = words }
export function resetManagedSpellingWords() { runtimeWords = SPELLING_WORDS }
export function spellingMaxRounds(teamCount: number, levels: readonly SpellingLevel[]) {
  return maxFairSpellingRounds(runtimeWords, teamCount, levels)
}

export function buildSpellingDeck(random: () => number = Math.random): SpellingWord[] {
  const shuffle = (items: SpellingWord[]) => {
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1)); [items[i], items[j]] = [items[j], items[i]]
    }
    return items
  }
  return [1, 2, 3].flatMap(level => shuffle(runtimeWords.filter(item => item.level === level)))
}

export function buildSpellingTurnDeck(teamCount: number, rounds: number, random: () => number = Math.random, levels: readonly SpellingLevel[] = [1, 2, 3], recentlyUsed: ReadonlySet<string> = new Set()): SpellingWord[] {
  return selectFairSpellingDeck(runtimeWords, { teamCount, rounds, levels, random, recentlyUsed })
}

export function spellingTurn(teams: { players: { name: string }[] }[], turn: number) {
  const teamIndex = turn % teams.length
  const round = Math.floor(turn / teams.length)
  const team = teams[teamIndex]
  return { teamIndex, round, speller: team?.players[round % team.players.length]?.name ?? '' }
}

export function isCorrectSpelling(answer: string, entry: Pick<SpellingWord, 'word' | 'variants'>): boolean {
  return acceptsSpelling(answer, entry)
}
