import content from './content/guides.json'
import expansion from './content/guideExpansion.json'
import searchDescriptors from './content/gameSearchDescriptors.json'
import type { Screen } from './navigation'

export interface GuideRecommendation {
  gameId: string
  name: string
  path: string
  image: string
  players: string
  duration: string
  bestFor: string
  alcohol: string
  reason: string
}

export interface GuideFaq { question: string; answer: string }
export interface GuideSection { heading: string; paragraphs: string[] }

export interface Guide {
  screen: Screen
  path: string
  slug: string
  title: string
  heading: string
  description: string
  intro: string
  summary?: string
  tips?: string[]
  sections?: GuideSection[]
  recommendations?: GuideRecommendation[]
  faqs?: GuideFaq[]
}

export const GUIDES = [...content, ...expansion] as Guide[]
export const GUIDE_LIBRARY = GUIDES[0]
export const GUIDE_ARTICLES = GUIDES.slice(1)
export const GUIDE_BY_SCREEN = new Map(GUIDES.map(guide => [guide.screen, guide]))
export const GAME_SEARCH_DESCRIPTORS = searchDescriptors as Record<string, string>
