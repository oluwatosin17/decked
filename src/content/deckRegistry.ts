import { NEVER_HAVE_I_EVER_DECK } from '../NeverHaveIEverGame'
import { LATE_NIGHT_DECKS } from '../LateNightTalksGame'
import { DINNER_TABLE_DECKS } from '../DinnerTableGame'
import { ICEBREAKER_DECKS } from '../IcebreakerGame'
import { EVERYDAY_DECKS } from '../EverydayConversationsGame'
import { RECONNECT_DECKS } from '../LetsReconnectGame'
import { SCENARIO_DECK } from '../RedFlagGreenFlagGame'
import { CHARADES_PROMPTS } from '../charadesData'
import { STRANGERS_DECKS } from '../WNRSGame'
import { PUT_A_FINGER_DOWN_DECKS } from '../PutAFingerDownGame'
import { TAKE_A_SIP_DECKS } from '../TakeASipGame'
import { SIP_OR_SPILL_DECKS } from '../SipOrSpillGame'
import { LAUGH_YOU_ARE_OUT_DECK } from '../LaughYouAreOutGame'
import { DO_OR_DRINK_DECKS } from '../DoOrDrinkGame'
import { MOST_LIKELY_DECK } from './mostLikelyTo'
import { MOST_LIKELY_PROMPTS } from './mostLikelyTo'
import { CHOOSE_SIDE_AUDIT_TEXT, CHOOSE_SIDE_PROMPTS } from './chooseYourSide'
import { TRUTH_DECK, DARE_DECK } from '../TruthOrDareGame'
import { SPICY_QUESTION_BANKS } from '../SpicyStartersGame'
import { WHO_SAID_THAT_PROMPTS } from './whoSaidThat'
import { WE_JUST_MET_PROMPTS } from './weJustMet'
import type { GameId } from '../gameRegistry'
import { IMPOSTER_DECKS } from './imposter'
import { ALL_MINI_MYSTERIES } from './miniMystery'
import { KNOW_ME_CATEGORIES, KNOW_ME_PROMPTS } from './doYouKnowMe'
import { THINK_FAST_PROMPTS } from './thinkFast'
import { COURT_CASES } from './notMeYourHonour'

export interface AuditedDeck {
  gameId?: GameId
  game: string
  category: string
  prompts: readonly string[]
}

export interface AuditedGame {
  gameId: GameId
  game: string
  contentModel: 'bundled' | 'player-authored' | 'rules-based'
  decks: AuditedDeck[]
  note?: string
}

const categorized = (game: string, decks: Record<string, readonly string[]>): AuditedDeck[] =>
  Object.entries(decks)
    .filter(([category]) => !category.toLowerCase().startsWith('random'))
    .map(([category, prompts]) => ({ game, category, prompts }))

export const AUDITED_DECKS: AuditedDeck[] = [
  { game: 'Never Have I Ever', category: 'main', prompts: NEVER_HAVE_I_EVER_DECK },
  ...categorized('Late Night Talks', LATE_NIGHT_DECKS),
  ...categorized('Dinner Table', DINNER_TABLE_DECKS),
  ...categorized('Icebreaker', ICEBREAKER_DECKS),
  ...categorized('Real Talk, Every Day', EVERYDAY_DECKS),
  ...categorized('Back to Us', RECONNECT_DECKS),
  { game: 'Dateable or Dealbreaker', category: 'main', prompts: SCENARIO_DECK },
  ...categorized('Charades', CHARADES_PROMPTS),
  ...categorized('Strangers', STRANGERS_DECKS),
  ...categorized('Drop a Finger', PUT_A_FINGER_DOWN_DECKS),
  ...categorized('Take a Sip', TAKE_A_SIP_DECKS),
  ...categorized('Answer or Drink', SIP_OR_SPILL_DECKS),
  { game: 'Keep a Straight Face', category: 'main', prompts: LAUGH_YOU_ARE_OUT_DECK },
  ...categorized('Dare or Pour', DO_OR_DRINK_DECKS),
  { game: "Who's Most Likely To", category: 'main', prompts: MOST_LIKELY_DECK },
  { game: 'Choose Your Side', category: 'main', prompts: CHOOSE_SIDE_AUDIT_TEXT },
]

const gameDecks = (gameId: GameId, game: string, decks: Record<string, readonly string[]>): AuditedDeck[] =>
  Object.entries(decks)
    .filter(([category]) => !category.toLowerCase().startsWith('random'))
    .map(([category, prompts]) => ({ gameId, game, category, prompts }))

const chooseSideDecks: Record<string, readonly string[]> = Object.fromEntries(
  Object.entries(CHOOSE_SIDE_PROMPTS).map(([category, prompts]) => [
    category,
    prompts.map(prompt => `${prompt.optionA} OR ${prompt.optionB}`),
  ]),
)

const mysteryAuditPayload = (mystery: (typeof ALL_MINI_MYSTERIES)[number]) => [...new Set([
  mystery.incident, ...mystery.briefing, ...mystery.knownFacts, ...mystery.evidence,
  ...mystery.solutionBeats, mystery.motive, ...mystery.culpritProof,
  ...mystery.redHerringResolutions, mystery.finalReveal.what,
  ...mystery.roles.flatMap(role => [role.publicStory, role.secret, role.clue, ...role.objectives, ...(role.guiltyPlan ? [role.guiltyPlan] : [])]),
])]

/**
 * Complete, canonical inventory used by the Content Management migration audit.
 * Keep this aligned with GAME_REGISTRY. Player-authored games intentionally have
 * no bundled decks and are reported as not applicable rather than as zero cards.
 */
export const CONTENT_AUDIT_GAMES: AuditedGame[] = [
  { gameId: 'truth-or-dare', game: 'Truth or Dare', contentModel: 'bundled', decks: gameDecks('truth-or-dare', 'Truth or Dare', { truth: TRUTH_DECK, dare: DARE_DECK }) },
  { gameId: 'spicy-starters', game: 'Spicy Opener', contentModel: 'bundled', decks: gameDecks('spicy-starters', 'Spicy Opener', SPICY_QUESTION_BANKS) },
  { gameId: 'never-have-i-ever', game: 'Never Have I Ever', contentModel: 'bundled', decks: [{ gameId: 'never-have-i-ever', game: 'Never Have I Ever', category: 'main', prompts: NEVER_HAVE_I_EVER_DECK }] },
  { gameId: 'late-night-talks', game: 'Late Night Talks', contentModel: 'bundled', decks: gameDecks('late-night-talks', 'Late Night Talks', LATE_NIGHT_DECKS) },
  { gameId: 'dinner-table', game: 'Dinner Table', contentModel: 'bundled', decks: gameDecks('dinner-table', 'Dinner Table', DINNER_TABLE_DECKS) },
  { gameId: 'icebreaker', game: 'Icebreaker', contentModel: 'bundled', decks: gameDecks('icebreaker', 'Icebreaker', ICEBREAKER_DECKS) },
  { gameId: 'everyday-conversation', game: 'Real Talk, Every Day', contentModel: 'bundled', decks: gameDecks('everyday-conversation', 'Real Talk, Every Day', EVERYDAY_DECKS) },
  { gameId: 'reconnect', game: 'Back to Us', contentModel: 'bundled', decks: gameDecks('reconnect', 'Back to Us', RECONNECT_DECKS) },
  { gameId: 'red-flag-green-flag', game: 'Dateable or Dealbreaker', contentModel: 'bundled', decks: [{ gameId: 'red-flag-green-flag', game: 'Dateable or Dealbreaker', category: 'main', prompts: SCENARIO_DECK }] },
  { gameId: 'charades', game: 'Charades', contentModel: 'bundled', decks: gameDecks('charades', 'Charades', CHARADES_PROMPTS) },
  { gameId: 'strangers', game: 'Beyond Small Talk', contentModel: 'bundled', decks: gameDecks('strangers', 'Beyond Small Talk', STRANGERS_DECKS) },
  { gameId: 'finger-down', game: 'Drop a Finger', contentModel: 'bundled', decks: gameDecks('finger-down', 'Drop a Finger', PUT_A_FINGER_DOWN_DECKS) },
  { gameId: 'take-a-sip', game: 'Take a Sip', contentModel: 'bundled', decks: gameDecks('take-a-sip', 'Take a Sip', TAKE_A_SIP_DECKS) },
  { gameId: 'sip-or-spill', game: 'Answer or Drink', contentModel: 'bundled', decks: gameDecks('sip-or-spill', 'Answer or Drink', SIP_OR_SPILL_DECKS) },
  { gameId: 'you-laugh', game: 'Keep a Straight Face', contentModel: 'bundled', decks: [{ gameId: 'you-laugh', game: 'Keep a Straight Face', category: 'main', prompts: LAUGH_YOU_ARE_OUT_DECK }] },
  { gameId: 'do-or-drink', game: 'Dare or Pour', contentModel: 'bundled', decks: gameDecks('do-or-drink', 'Dare or Pour', DO_OR_DRINK_DECKS) },
  { gameId: 'two-truths-bluff', game: 'Two Truths and a Bluff', contentModel: 'player-authored', decks: [], note: 'Cards are written by players for each round; there is no bundled prompt library to migrate.' },
  { gameId: 'most-likely-to', game: 'Who’s Most Likely To?', contentModel: 'bundled', decks: gameDecks('most-likely-to', 'Who’s Most Likely To?', MOST_LIKELY_PROMPTS) },
  { gameId: 'choose-your-side', game: 'Choose Your Side', contentModel: 'bundled', decks: gameDecks('choose-your-side', 'Choose Your Side', chooseSideDecks) },
  { gameId: 'who-said-that', game: 'Who Said That?', contentModel: 'bundled', decks: [{ gameId: 'who-said-that', game: 'Who Said That?', category: 'main', prompts: WHO_SAID_THAT_PROMPTS }] },
  { gameId: 'we-just-met', game: 'We Just Met', contentModel: 'bundled', decks: gameDecks('we-just-met', 'We Just Met', WE_JUST_MET_PROMPTS) },
  { gameId: 'whot', game: 'Whot', contentModel: 'rules-based', decks: [], note: 'Whot uses a fixed card deck and configurable rules rather than written prompt content.' },
  { gameId: 'imposter', game: 'Imposter', contentModel: 'bundled', decks: gameDecks('imposter', 'Imposter', Object.fromEntries(Object.entries(IMPOSTER_DECKS).map(([category, pairs]) => [category, pairs.map(pair => `${pair.regular} OR ${pair.imposter}`)]))) },
  { gameId: 'mini-mystery', game: 'Mini Mystery', contentModel: 'bundled', decks: gameDecks('mini-mystery', 'Mini Mystery', Object.fromEntries(ALL_MINI_MYSTERIES.map(mystery => [mystery.id, mysteryAuditPayload(mystery)]))) },
  { gameId: 'do-you-know-me', game: 'Do You Know Me?', contentModel: 'bundled', decks: gameDecks('do-you-know-me', 'Do You Know Me?', Object.fromEntries(KNOW_ME_CATEGORIES.map(category => [category.id, KNOW_ME_PROMPTS.filter(prompt => prompt.category === category.id).map(prompt => `${prompt.question} — ${prompt.options.join(' / ')}`)]))) },
  { gameId: 'think-fast', game: 'Think Fast', contentModel: 'bundled', decks: [{ gameId: 'think-fast', game: 'Think Fast', category: 'main', prompts: THINK_FAST_PROMPTS }] },
  { gameId: 'not-me-your-honour', game: 'Not Me, Your Honour!', contentModel: 'bundled', decks: gameDecks('not-me-your-honour', 'Not Me, Your Honour!', Object.fromEntries(COURT_CASES.map(item => [item.id, [...item.briefing, item.accusation, item.accusedSecret, item.prosecutorClue, ...item.evidence, item.twist, ...item.objections]]))) },
]
