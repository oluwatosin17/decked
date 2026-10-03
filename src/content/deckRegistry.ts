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

export interface AuditedDeck {
  game: string
  category: string
  prompts: readonly string[]
}

const categorized = (game: string, decks: Record<string, readonly string[]>): AuditedDeck[] =>
  Object.entries(decks).map(([category, prompts]) => ({ game, category, prompts }))

export const AUDITED_DECKS: AuditedDeck[] = [
  { game: 'Never Have I Ever', category: 'main', prompts: NEVER_HAVE_I_EVER_DECK },
  ...categorized('Late Night Talks', LATE_NIGHT_DECKS),
  ...categorized('Dinner Table', DINNER_TABLE_DECKS),
  ...categorized('Icebreaker', ICEBREAKER_DECKS),
  ...categorized('Everyday Conversations', EVERYDAY_DECKS),
  ...categorized("Let's Reconnect", RECONNECT_DECKS),
  { game: 'Red Flag / Green Flag', category: 'main', prompts: SCENARIO_DECK },
  ...categorized('Charades', CHARADES_PROMPTS),
  ...categorized('Strangers', STRANGERS_DECKS),
  ...categorized('Put a Finger Down', PUT_A_FINGER_DOWN_DECKS),
  ...categorized('Take a Sip', TAKE_A_SIP_DECKS),
  ...categorized('Sip or Spill', SIP_OR_SPILL_DECKS),
  { game: "You Laugh, You're Out", category: 'main', prompts: LAUGH_YOU_ARE_OUT_DECK },
  ...categorized('Do or Drink', DO_OR_DRINK_DECKS),
]
