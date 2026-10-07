import { SPICY_QUESTION_BANKS } from '../SpicyStartersGame'
import { NEVER_HAVE_I_EVER_DECK } from '../NeverHaveIEverGame'
import { LATE_NIGHT_MULTIPLAYER_DECK } from '../LateNightTalksGame'
import { DINNER_TABLE_MULTIPLAYER_DECK } from '../DinnerTableGame'
import { ICEBREAKER_DECK } from '../IcebreakerGame'
import { EVERYDAY_MULTIPLAYER_DECK } from '../EverydayConversationsGame'
import { RECONNECT_MULTIPLAYER_DECK } from '../LetsReconnectGame'
import { SCENARIO_DECK } from '../RedFlagGreenFlagGame'
import { CHARADES_PROMPTS } from '../charadesData'
import { DARE_DECK, TRUTH_DECK } from '../TruthOrDareGame'
import { STRANGERS_DECKS } from '../WNRSGame'
import { PUT_A_FINGER_DOWN_DECKS } from '../PutAFingerDownGame'
import { TAKE_A_SIP_DECKS } from '../TakeASipGame'
import { SIP_OR_SPILL_DECKS } from '../SipOrSpillGame'
import { LAUGH_YOU_ARE_OUT_DECK } from '../LaughYouAreOutGame'
import { DO_OR_DRINK_DECKS } from '../DoOrDrinkGame'
import type { MultiplayerGameId } from './types'
import { MOST_LIKELY_DECK } from '../content/mostLikelyTo'
import { CHOOSE_SIDE_AUDIT_TEXT } from '../content/chooseYourSide'
import { WHO_SAID_THAT_PROMPTS } from '../WhoSaidThatGame'

export interface MultiplayerGameConfig {
  id: MultiplayerGameId
  name: string
  deck: readonly string[]
  cardColor: string
  textColor: string
  kind: 'truth-or-dare' | 'conversation' | 'score' | 'vote' | 'charades'
}

const unique = (items: readonly string[]) => Array.from(new Set(items))

export const MULTIPLAYER_GAMES: Record<MultiplayerGameId, MultiplayerGameConfig> = {
  'truth-or-dare': { id: 'truth-or-dare', name: 'Truth or Dare', deck: unique([...TRUTH_DECK, ...DARE_DECK]), cardColor: '#f7b8bc', textColor: '#dc2827', kind: 'truth-or-dare' },
  'spicy-starters': { id: 'spicy-starters', name: 'Spicy Opener', deck: unique([...SPICY_QUESTION_BANKS.mild, ...SPICY_QUESTION_BANKS.medium, ...SPICY_QUESTION_BANKS.hot]), cardColor: '#c90023', textColor: '#df91b5', kind: 'conversation' },
  'never-have-i-ever': { id: 'never-have-i-ever', name: 'Never Have I Ever', deck: NEVER_HAVE_I_EVER_DECK, cardColor: '#bf33ff', textColor: '#fff', kind: 'score' },
  'late-night-talks': { id: 'late-night-talks', name: 'Late Night Talks', deck: LATE_NIGHT_MULTIPLAYER_DECK, cardColor: '#ff4b19', textColor: '#fee5df', kind: 'conversation' },
  'dinner-table': { id: 'dinner-table', name: 'Dinner Table', deck: DINNER_TABLE_MULTIPLAYER_DECK, cardColor: '#443537', textColor: '#fff', kind: 'conversation' },
  'icebreaker': { id: 'icebreaker', name: 'Icebreaker', deck: unique(ICEBREAKER_DECK.map(card => card.text)), cardColor: '#3ca7bf', textColor: '#081318', kind: 'conversation' },
  'everyday-conversation': { id: 'everyday-conversation', name: 'Real Talk, Every Day', deck: EVERYDAY_MULTIPLAYER_DECK, cardColor: '#eae6e1', textColor: '#0f973d', kind: 'conversation' },
  reconnect: { id: 'reconnect', name: 'Back to Us', deck: RECONNECT_MULTIPLAYER_DECK, cardColor: '#f5e9de', textColor: '#d22f49', kind: 'conversation' },
  'red-flag-green-flag': { id: 'red-flag-green-flag', name: 'Dateable or Dealbreaker', deck: SCENARIO_DECK, cardColor: '#080808', textColor: '#fff', kind: 'vote' },
  charades: { id: 'charades', name: 'Charades', deck: unique(Object.values(CHARADES_PROMPTS).flat()), cardColor: '#ed3844', textColor: '#fff', kind: 'charades' },
  strangers: { id: 'strangers', name: 'Beyond Small Talk', deck: unique(Object.values(STRANGERS_DECKS).flat()), cardColor: '#b51e26', textColor: '#fff', kind: 'conversation' },
  'finger-down': { id: 'finger-down', name: 'Drop a Finger', deck: unique(Object.values(PUT_A_FINGER_DOWN_DECKS).flat()), cardColor: '#ed8251', textColor: '#fff', kind: 'conversation' },
  'take-a-sip': { id: 'take-a-sip', name: 'Take a Sip', deck: unique(Object.values(TAKE_A_SIP_DECKS).flat()), cardColor: '#ffecd1', textColor: '#eb5e28', kind: 'conversation' },
  'sip-or-spill': { id: 'sip-or-spill', name: 'Answer or Drink', deck: unique(Object.values(SIP_OR_SPILL_DECKS).flat()), cardColor: '#35152d', textColor: '#f7ecd5', kind: 'conversation' },
  'you-laugh': { id: 'you-laugh', name: 'Keep a Straight Face', deck: LAUGH_YOU_ARE_OUT_DECK, cardColor: '#ef3b4b', textColor: '#fff', kind: 'conversation' },
  'do-or-drink': { id: 'do-or-drink', name: 'Dare or Pour', deck: unique(Object.values(DO_OR_DRINK_DECKS).flat()), cardColor: '#d1ffd5', textColor: '#5228eb', kind: 'conversation' },
  'two-truths-bluff': { id: 'two-truths-bluff', name: 'Two Truths and a Bluff', deck: ['Player-created statements'], cardColor: '#ef879a', textColor: '#351126', kind: 'vote' },
  'most-likely-to': { id: 'most-likely-to', name: 'Who’s Most Likely To?', deck: MOST_LIKELY_DECK, cardColor: '#0759c7', textColor: '#f7f1df', kind: 'vote' },
  'choose-your-side': { id: 'choose-your-side', name: 'Choose Your Side', deck: CHOOSE_SIDE_AUDIT_TEXT, cardColor: '#ef3f24', textColor: '#f7efd9', kind: 'vote' },
  'who-said-that': { id: 'who-said-that', name: 'Who Said That?', deck: WHO_SAID_THAT_PROMPTS, cardColor: '#35152d', textColor: '#fff1d6', kind: 'vote' },
}

export const isMultiplayerGame = (id: string): id is MultiplayerGameId => id in MULTIPLAYER_GAMES
