import type { KnowMePrompt } from './doYouKnowMe'
import { EDITORIAL_PERSONALITY_PROMPTS } from './doYouKnowMeEditorial'
import { EDITORIAL_EVERYDAY_PROMPTS } from './doYouKnowMeEverydayEditorial'
import { EDITORIAL_FOOD_PROMPTS } from './doYouKnowMeFoodEditorial'
import { EDITORIAL_OPINIONS_PROMPTS } from './doYouKnowMeOpinionsEditorial'
import { EDITORIAL_ENTERTAINMENT_PROMPTS } from './doYouKnowMeEntertainmentEditorial'
import { EDITORIAL_FUTURE_PROMPTS } from './doYouKnowMeFutureEditorial'
import { EDITORIAL_NIGERIAN_PROMPTS } from './doYouKnowMeNigerianEditorial'
import { EDITORIAL_WILD_CARD_PROMPTS } from './doYouKnowMeWildCardsEditorial'

export const EXPANDED_KNOW_ME_PROMPTS: KnowMePrompt[] = [
  ...EDITORIAL_PERSONALITY_PROMPTS,
  ...EDITORIAL_EVERYDAY_PROMPTS,
  ...EDITORIAL_FOOD_PROMPTS,
  ...EDITORIAL_OPINIONS_PROMPTS,
  ...EDITORIAL_ENTERTAINMENT_PROMPTS,
  ...EDITORIAL_FUTURE_PROMPTS,
  ...EDITORIAL_NIGERIAN_PROMPTS,
  ...EDITORIAL_WILD_CARD_PROMPTS,
]
